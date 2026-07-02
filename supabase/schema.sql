-- =====================================================================
-- SmartERP — Supabase schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New
-- query → paste → Run). Safe to re-run on a fresh project.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. profiles — mirrors auth.users so we can search / display people
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. companies + company_users (multi-company, role-based access)
-- ---------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  gst_number text,
  financial_year text,
  state text,
  contact text,
  created_at timestamptz not null default now()
);

create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'operator' check (role in ('owner', 'admin', 'operator', 'viewer')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create or replace function public.handle_new_company()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.company_users (company_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

drop trigger if exists on_company_created on public.companies;
create trigger on_company_created
  after insert on public.companies
  for each row execute function public.handle_new_company();

-- ---------------------------------------------------------------------
-- 3. Masters — customers, suppliers, stock items
-- ---------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  mobile text,
  address text,
  gstin text,
  opening_balance numeric(14,2) not null default 0,
  outstanding_balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  mobile text,
  address text,
  gstin text,
  opening_balance numeric(14,2) not null default 0,
  outstanding_balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  sku text,
  unit text not null default 'PCS',
  purchase_price numeric(14,2) not null default 0,
  selling_price numeric(14,2) not null default 0,
  quantity numeric(14,2) not null default 0,
  gst_percent numeric(5,2) not null default 0,
  reorder_level numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. Vouchers — Sales (customer bill) & Purchase (indirect stock entry)
-- ---------------------------------------------------------------------
create table if not exists public.sales_vouchers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_number text not null,
  customer_id uuid not null references public.customers(id),
  voucher_date date not null default current_date,
  subtotal numeric(14,2) not null default 0,
  gst_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid', 'partial')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sales_voucher_items (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.sales_vouchers(id) on delete cascade,
  stock_item_id uuid references public.stock_items(id),
  item_name text not null,
  qty numeric(14,2) not null,
  rate numeric(14,2) not null,
  gst_percent numeric(5,2) not null default 0,
  amount numeric(14,2) not null
);

create table if not exists public.purchase_vouchers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  voucher_number text not null,
  supplier_id uuid not null references public.suppliers(id),
  voucher_date date not null default current_date,
  subtotal numeric(14,2) not null default 0,
  gst_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid', 'partial')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_voucher_items (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.purchase_vouchers(id) on delete cascade,
  stock_item_id uuid references public.stock_items(id),
  item_name text not null,
  qty numeric(14,2) not null,
  rate numeric(14,2) not null,
  gst_percent numeric(5,2) not null default 0,
  amount numeric(14,2) not null
);

-- ---------------------------------------------------------------------
-- 5. Audit log
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id),
  description text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. RPC functions — atomic voucher creation (stock + balances + audit)
-- ---------------------------------------------------------------------
create or replace function public.create_sales_voucher(
  p_company_id uuid,
  p_customer_id uuid,
  p_voucher_date date,
  p_items jsonb,
  p_notes text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_voucher_id uuid;
  v_invoice_number text;
  v_subtotal numeric := 0;
  v_gst numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_amount numeric;
  v_item_gst numeric;
  v_seq int;
begin
  if not exists (
    select 1 from public.company_users
    where company_id = p_company_id and user_id = auth.uid()
  ) then
    raise exception 'Not authorized for this company';
  end if;

  select count(*) + 1 into v_seq
  from public.sales_vouchers
  where company_id = p_company_id
    and voucher_date >= date_trunc('year', p_voucher_date)::date;

  v_invoice_number := 'INV-' || to_char(p_voucher_date, 'YYYY') || '-' || lpad(v_seq::text, 4, '0');

  insert into public.sales_vouchers
    (company_id, invoice_number, customer_id, voucher_date, subtotal, gst_amount, total, notes, created_by)
  values
    (p_company_id, v_invoice_number, p_customer_id, p_voucher_date, 0, 0, 0, p_notes, auth.uid())
  returning id into v_voucher_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_amount := (v_item ->> 'qty')::numeric * (v_item ->> 'rate')::numeric;
    v_item_gst := v_amount * coalesce((v_item ->> 'gst_percent')::numeric, 0) / 100;
    v_subtotal := v_subtotal + v_amount;
    v_gst := v_gst + v_item_gst;

    insert into public.sales_voucher_items
      (voucher_id, stock_item_id, item_name, qty, rate, gst_percent, amount)
    values
      (v_voucher_id, nullif(v_item ->> 'stock_item_id', '')::uuid, v_item ->> 'item_name',
       (v_item ->> 'qty')::numeric, (v_item ->> 'rate')::numeric,
       coalesce((v_item ->> 'gst_percent')::numeric, 0), v_amount);

    if (v_item ->> 'stock_item_id') is not null then
      update public.stock_items
      set quantity = quantity - (v_item ->> 'qty')::numeric
      where id = (v_item ->> 'stock_item_id')::uuid and company_id = p_company_id;
    end if;
  end loop;

  v_total := v_subtotal + v_gst;

  update public.sales_vouchers
  set subtotal = v_subtotal, gst_amount = v_gst, total = v_total
  where id = v_voucher_id;

  update public.customers
  set outstanding_balance = coalesce(outstanding_balance, 0) + v_total
  where id = p_customer_id and company_id = p_company_id;

  insert into public.audit_logs (company_id, user_id, description)
  values (p_company_id, auth.uid(), 'Created sales invoice ' || v_invoice_number || ' for ' || v_total::text);

  return v_voucher_id;
end;
$$;

create or replace function public.create_purchase_voucher(
  p_company_id uuid,
  p_supplier_id uuid,
  p_voucher_date date,
  p_items jsonb,
  p_notes text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_voucher_id uuid;
  v_voucher_number text;
  v_subtotal numeric := 0;
  v_gst numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_amount numeric;
  v_item_gst numeric;
  v_seq int;
begin
  if not exists (
    select 1 from public.company_users
    where company_id = p_company_id and user_id = auth.uid()
  ) then
    raise exception 'Not authorized for this company';
  end if;

  select count(*) + 1 into v_seq
  from public.purchase_vouchers
  where company_id = p_company_id
    and voucher_date >= date_trunc('year', p_voucher_date)::date;

  v_voucher_number := 'PUR-' || to_char(p_voucher_date, 'YYYY') || '-' || lpad(v_seq::text, 4, '0');

  insert into public.purchase_vouchers
    (company_id, voucher_number, supplier_id, voucher_date, subtotal, gst_amount, total, notes, created_by)
  values
    (p_company_id, v_voucher_number, p_supplier_id, p_voucher_date, 0, 0, 0, p_notes, auth.uid())
  returning id into v_voucher_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_amount := (v_item ->> 'qty')::numeric * (v_item ->> 'rate')::numeric;
    v_item_gst := v_amount * coalesce((v_item ->> 'gst_percent')::numeric, 0) / 100;
    v_subtotal := v_subtotal + v_amount;
    v_gst := v_gst + v_item_gst;

    insert into public.purchase_voucher_items
      (voucher_id, stock_item_id, item_name, qty, rate, gst_percent, amount)
    values
      (v_voucher_id, nullif(v_item ->> 'stock_item_id', '')::uuid, v_item ->> 'item_name',
       (v_item ->> 'qty')::numeric, (v_item ->> 'rate')::numeric,
       coalesce((v_item ->> 'gst_percent')::numeric, 0), v_amount);

    if (v_item ->> 'stock_item_id') is not null then
      update public.stock_items
      set quantity = quantity + (v_item ->> 'qty')::numeric
      where id = (v_item ->> 'stock_item_id')::uuid and company_id = p_company_id;
    end if;
  end loop;

  v_total := v_subtotal + v_gst;

  update public.purchase_vouchers
  set subtotal = v_subtotal, gst_amount = v_gst, total = v_total
  where id = v_voucher_id;

  update public.suppliers
  set outstanding_balance = coalesce(outstanding_balance, 0) + v_total
  where id = p_supplier_id and company_id = p_company_id;

  insert into public.audit_logs (company_id, user_id, description)
  values (p_company_id, auth.uid(), 'Recorded purchase ' || v_voucher_number || ' for ' || v_total::text);

  return v_voucher_id;
end;
$$;

grant execute on function public.create_sales_voucher(uuid, uuid, date, jsonb, text) to authenticated;
grant execute on function public.create_purchase_voucher(uuid, uuid, date, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_users enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.stock_items enable row level security;
alter table public.sales_vouchers enable row level security;
alter table public.sales_voucher_items enable row level security;
alter table public.purchase_vouchers enable row level security;
alter table public.purchase_voucher_items enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: anyone signed in can look people up by email (needed to add
-- team members); only the owner can edit their own row.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);

-- companies
drop policy if exists "companies_select" on public.companies;
create policy "companies_select" on public.companies for select to authenticated using (
  exists (select 1 from public.company_users cu where cu.company_id = companies.id and cu.user_id = auth.uid())
);
drop policy if exists "companies_insert" on public.companies;
create policy "companies_insert" on public.companies for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "companies_update" on public.companies;
create policy "companies_update" on public.companies for update to authenticated using (
  exists (select 1 from public.company_users cu where cu.company_id = companies.id and cu.user_id = auth.uid() and cu.role in ('owner','admin'))
);
drop policy if exists "companies_delete" on public.companies;
create policy "companies_delete" on public.companies for delete to authenticated using (owner_id = auth.uid());

-- company_users
drop policy if exists "company_users_select" on public.company_users;
create policy "company_users_select" on public.company_users for select to authenticated using (
  user_id = auth.uid() or exists (
    select 1 from public.company_users cu2 where cu2.company_id = company_users.company_id and cu2.user_id = auth.uid()
  )
);
drop policy if exists "company_users_insert" on public.company_users;
create policy "company_users_insert" on public.company_users for insert to authenticated with check (
  exists (select 1 from public.company_users cu where cu.company_id = company_users.company_id and cu.user_id = auth.uid() and cu.role in ('owner','admin'))
);
drop policy if exists "company_users_update" on public.company_users;
create policy "company_users_update" on public.company_users for update to authenticated using (
  exists (select 1 from public.company_users cu where cu.company_id = company_users.company_id and cu.user_id = auth.uid() and cu.role in ('owner','admin'))
);
drop policy if exists "company_users_delete" on public.company_users;
create policy "company_users_delete" on public.company_users for delete to authenticated using (
  role <> 'owner' and exists (select 1 from public.company_users cu where cu.company_id = company_users.company_id and cu.user_id = auth.uid() and cu.role in ('owner','admin'))
);

-- generic helper expression used below: membership exists for company_id
drop policy if exists "customers_all" on public.customers;
create policy "customers_all" on public.customers for all to authenticated using (
  exists (select 1 from public.company_users cu where cu.company_id = customers.company_id and cu.user_id = auth.uid())
) with check (
  exists (select 1 from public.company_users cu where cu.company_id = customers.company_id and cu.user_id = auth.uid())
);

drop policy if exists "suppliers_all" on public.suppliers;
create policy "suppliers_all" on public.suppliers for all to authenticated using (
  exists (select 1 from public.company_users cu where cu.company_id = suppliers.company_id and cu.user_id = auth.uid())
) with check (
  exists (select 1 from public.company_users cu where cu.company_id = suppliers.company_id and cu.user_id = auth.uid())
);

drop policy if exists "stock_items_all" on public.stock_items;
create policy "stock_items_all" on public.stock_items for all to authenticated using (
  exists (select 1 from public.company_users cu where cu.company_id = stock_items.company_id and cu.user_id = auth.uid())
) with check (
  exists (select 1 from public.company_users cu where cu.company_id = stock_items.company_id and cu.user_id = auth.uid())
);

drop policy if exists "sales_vouchers_select" on public.sales_vouchers;
create policy "sales_vouchers_select" on public.sales_vouchers for select to authenticated using (
  exists (select 1 from public.company_users cu where cu.company_id = sales_vouchers.company_id and cu.user_id = auth.uid())
);
drop policy if exists "sales_vouchers_update" on public.sales_vouchers;
create policy "sales_vouchers_update" on public.sales_vouchers for update to authenticated using (
  exists (select 1 from public.company_users cu where cu.company_id = sales_vouchers.company_id and cu.user_id = auth.uid())
) with check (
  exists (select 1 from public.company_users cu where cu.company_id = sales_vouchers.company_id and cu.user_id = auth.uid())
);

drop policy if exists "sales_voucher_items_select" on public.sales_voucher_items;
create policy "sales_voucher_items_select" on public.sales_voucher_items for select to authenticated using (
  exists (
    select 1 from public.sales_vouchers v
    join public.company_users cu on cu.company_id = v.company_id
    where v.id = sales_voucher_items.voucher_id and cu.user_id = auth.uid()
  )
);

drop policy if exists "purchase_vouchers_select" on public.purchase_vouchers;
create policy "purchase_vouchers_select" on public.purchase_vouchers for select to authenticated using (
  exists (select 1 from public.company_users cu where cu.company_id = purchase_vouchers.company_id and cu.user_id = auth.uid())
);
drop policy if exists "purchase_vouchers_update" on public.purchase_vouchers;
create policy "purchase_vouchers_update" on public.purchase_vouchers for update to authenticated using (
  exists (select 1 from public.company_users cu where cu.company_id = purchase_vouchers.company_id and cu.user_id = auth.uid())
) with check (
  exists (select 1 from public.company_users cu where cu.company_id = purchase_vouchers.company_id and cu.user_id = auth.uid())
);

drop policy if exists "purchase_voucher_items_select" on public.purchase_voucher_items;
create policy "purchase_voucher_items_select" on public.purchase_voucher_items for select to authenticated using (
  exists (
    select 1 from public.purchase_vouchers v
    join public.company_users cu on cu.company_id = v.company_id
    where v.id = purchase_voucher_items.voucher_id and cu.user_id = auth.uid()
  )
);

drop policy if exists "audit_logs_select" on public.audit_logs;
create policy "audit_logs_select" on public.audit_logs for select to authenticated using (
  exists (select 1 from public.company_users cu where cu.company_id = audit_logs.company_id and cu.user_id = auth.uid())
);

-- ---------------------------------------------------------------------
-- 8. Helpful indexes
-- ---------------------------------------------------------------------
create index if not exists idx_company_users_user on public.company_users(user_id);
create index if not exists idx_customers_company on public.customers(company_id);
create index if not exists idx_suppliers_company on public.suppliers(company_id);
create index if not exists idx_stock_items_company on public.stock_items(company_id);
create index if not exists idx_sales_vouchers_company on public.sales_vouchers(company_id);
create index if not exists idx_purchase_vouchers_company on public.purchase_vouchers(company_id);
create index if not exists idx_sales_voucher_items_voucher on public.sales_voucher_items(voucher_id);
create index if not exists idx_purchase_voucher_items_voucher on public.purchase_voucher_items(voucher_id);

-- =====================================================================
-- Done. Next: Project Settings → API → copy the URL and anon public key
-- into your .env.local (see .env.local.example).
-- =====================================================================
