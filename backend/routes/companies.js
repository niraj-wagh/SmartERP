const router = require("express").Router();
const { supabaseAdmin } = require("../lib/supabase");
const { requireCompanyAccess, requireRole } = require("../middleware/auth");

/* ── List my companies ── */
router.get("/", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("company_users")
    .select("role, company:companies(*)")
    .eq("user_id", req.user.id);
  if (error) return res.status(500).json({ message: error.message });
  const list = (data || [])
    .filter((r) => r.company)
    .map((r) => ({ ...r.company, role: r.role }))
    .sort((a, b) => a.name.localeCompare(b.name));
  res.json(list);
});

/* ── Create company ── */
router.post("/", async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from("company_users").select("id", { count: "exact", head: true }).eq("user_id", req.user.id);
  const count = existing?.length || 0;
  if (count >= 5) return res.status(400).json({ message: "Maximum 5 companies per account." });

  const { name, address, gst_number, financial_year, state, contact } = req.body;
  if (!name) return res.status(400).json({ message: "Company name is required." });

  const { data, error } = await supabaseAdmin
    .from("companies")
    .insert({ owner_id: req.user.id, name, address, gst_number, financial_year, state, contact })
    .select()
    .single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json({ ...data, role: "owner" });
});

/* ── Update company ── */
router.put("/:companyId", requireCompanyAccess, requireRole("owner", "admin"), async (req, res) => {
  const { name, address, gst_number, financial_year, state, contact } = req.body;
  const { data, error } = await supabaseAdmin
    .from("companies")
    .update({ name, address, gst_number, financial_year, state, contact })
    .eq("id", req.params.companyId)
    .select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

/* ── Delete company ── */
router.delete("/:companyId", requireCompanyAccess, requireRole("owner"), async (req, res) => {
  const { error } = await supabaseAdmin.from("companies").delete().eq("id", req.params.companyId);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ success: true });
});

/* ── List team members ── */
router.get("/:companyId/members", requireCompanyAccess, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("company_users")
    .select("id, role, user_id, profile:profiles(email, full_name)")
    .eq("company_id", req.params.companyId);
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
});

/* ── Add team member ── */
router.post("/:companyId/members", requireCompanyAccess, requireRole("owner", "admin"), async (req, res) => {
  const { email, role = "operator" } = req.body;
  const { data: prof } = await supabaseAdmin
    .from("profiles").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (!prof) return res.status(404).json({ message: "No SmartERP account found for that email." });

  const { data, error } = await supabaseAdmin
    .from("company_users")
    .insert({ company_id: req.params.companyId, user_id: prof.id, role })
    .select("id, role, user_id, profile:profiles(email, full_name)").single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
});

/* ── Update member role ── */
router.put("/:companyId/members/:memberId", requireCompanyAccess, requireRole("owner", "admin"), async (req, res) => {
  const { role } = req.body;
  const { data, error } = await supabaseAdmin
    .from("company_users").update({ role }).eq("id", req.params.memberId)
    .select("id, role").single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

/* ── Remove member ── */
router.delete("/:companyId/members/:memberId", requireCompanyAccess, requireRole("owner", "admin"), async (req, res) => {
  const { error } = await supabaseAdmin.from("company_users").delete().eq("id", req.params.memberId);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ success: true });
});

/* ── Dashboard stats ── */
router.get("/:companyId/dashboard", requireCompanyAccess, async (req, res) => {
  const cid = req.params.companyId;
  const today = new Date().toISOString().slice(0, 10);
  const [customers, suppliers, items, salesToday, recentSales, recentPurchases, lowStock] = await Promise.all([
    supabaseAdmin.from("customers").select("id", { count: "exact", head: true }).eq("company_id", cid),
    supabaseAdmin.from("suppliers").select("id", { count: "exact", head: true }).eq("company_id", cid),
    supabaseAdmin.from("stock_items").select("id", { count: "exact", head: true }).eq("company_id", cid),
    supabaseAdmin.from("sales_vouchers").select("total").eq("company_id", cid).eq("voucher_date", today),
    supabaseAdmin.from("sales_vouchers").select("id,invoice_number,voucher_date,total,status,customer:customers(name)").eq("company_id", cid).order("created_at", { ascending: false }).limit(4),
    supabaseAdmin.from("purchase_vouchers").select("id,voucher_number,voucher_date,total,status,supplier:suppliers(name)").eq("company_id", cid).order("created_at", { ascending: false }).limit(4),
    supabaseAdmin.from("stock_items").select("id,name,quantity,reorder_level,unit").eq("company_id", cid).order("quantity", { ascending: true }).limit(50),
  ]);
  const todaysSalesTotal = (salesToday.data || []).reduce((s, v) => s + Number(v.total || 0), 0);
  const low = (lowStock.data || []).filter((i) => Number(i.quantity) <= Number(i.reorder_level || 0));
  const recent = [
    ...(recentSales.data || []).map((v) => ({ kind: "sales", id: v.id, label: v.invoice_number, party: v.customer?.name, date: v.voucher_date, total: v.total, status: v.status })),
    ...(recentPurchases.data || []).map((v) => ({ kind: "purchase", id: v.id, label: v.voucher_number, party: v.supplier?.name, date: v.voucher_date, total: v.total, status: v.status })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  res.json({ customers: customers.count || 0, suppliers: suppliers.count || 0, items: items.count || 0, todaysSalesTotal, recent, lowStock: low });
});

/* ── Audit logs ── */
router.get("/:companyId/audit-logs", requireCompanyAccess, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("audit_logs").select("*").eq("company_id", req.params.companyId)
    .order("created_at", { ascending: false }).limit(50);
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
});

module.exports = router;
