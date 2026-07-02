-- SmartERP — Optional seed data for quick demo
-- Run AFTER schema.sql, and ONLY on a development project.
-- Replace 'YOUR_USER_ID' with your actual auth.users UUID
-- (find it in Supabase → Authentication → Users → your user → copy "User UID")
--
-- Usage:
--   1. Sign up in the app first so your user row exists
--   2. Go to SQL Editor, paste this file
--   3. Replace YOUR_USER_ID below
--   4. Run

do $$
declare
  v_user_id uuid := 'YOUR_USER_ID'; -- ← replace this
  v_company_id uuid;
  v_cust1 uuid; v_cust2 uuid;
  v_sup1 uuid;
  v_item1 uuid; v_item2 uuid; v_item3 uuid;
begin

  -- Company
  insert into public.companies (owner_id, name, address, gst_number, financial_year, state, contact)
  values (v_user_id, 'Demo Traders Pvt Ltd', '12 MG Road, Mumbai, Maharashtra 400001',
          '27AADCD1234F1Z5', '2025-26', 'Maharashtra', '+91 98765 43210')
  returning id into v_company_id;

  -- Customers
  insert into public.customers (company_id, name, mobile, address, gstin, opening_balance, outstanding_balance)
  values (v_company_id, 'Ravi Electronics', '9876543210', 'Shop 4, Bandra West, Mumbai', '27ABCDE5678G1Z3', 5000, 5000)
  returning id into v_cust1;

  insert into public.customers (company_id, name, mobile, address, outstanding_balance)
  values (v_company_id, 'Priya Stores', '8765432109', '22 FC Road, Pune', 0)
  returning id into v_cust2;

  -- Suppliers
  insert into public.suppliers (company_id, name, mobile, address, gstin, opening_balance, outstanding_balance)
  values (v_company_id, 'National Distributors', '7654321098', 'MIDC, Andheri East, Mumbai', '27GHIJK9012H1Z8', 12000, 12000)
  returning id into v_sup1;

  -- Stock items
  insert into public.stock_items (company_id, name, sku, unit, purchase_price, selling_price, quantity, gst_percent, reorder_level)
  values (v_company_id, 'LED Bulb 9W', 'LED-9W-001', 'PCS', 45, 75, 200, 12, 50)
  returning id into v_item1;

  insert into public.stock_items (company_id, name, sku, unit, purchase_price, selling_price, quantity, gst_percent, reorder_level)
  values (v_company_id, 'Extension Board 4-Pin', 'EXT-4P-001', 'PCS', 120, 185, 8, 18, 20)
  returning id into v_item2;

  insert into public.stock_items (company_id, name, sku, unit, purchase_price, selling_price, quantity, gst_percent, reorder_level)
  values (v_company_id, 'USB-C Cable 1m', 'USB-C-1M', 'PCS', 80, 149, 55, 18, 30)
  returning id into v_item3;

  raise notice 'Seed complete. Company ID: %', v_company_id;
end;
$$;
