const router = require("express").Router({ mergeParams: true });
const { supabaseAdmin } = require("../lib/supabase");
const { requireCompanyAccess } = require("../middleware/auth");

router.use(requireCompanyAccess);

/* ── Stock Summary ── */
router.get("/stock-summary", async (req, res) => {
  const { data, error } = await supabaseAdmin.from("stock_items").select("*")
    .eq("company_id", req.params.companyId).order("name");
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
});

/* ── Sales Register ── */
router.get("/sales-register", async (req, res) => {
  const { from, to } = req.query;
  let q = supabaseAdmin.from("sales_vouchers")
    .select("id,invoice_number,voucher_date,subtotal,gst_amount,total,status,customer:customers(name)")
    .eq("company_id", req.params.companyId)
    .order("voucher_date", { ascending: false });
  if (from) q = q.gte("voucher_date", from);
  if (to) q = q.lte("voucher_date", to);
  const { data, error } = await q;
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
});

/* ── Customer Statement ── */
router.get("/customer-statement/:customerId", async (req, res) => {
  const { data: cust, error: cErr } = await supabaseAdmin.from("customers").select("*")
    .eq("id", req.params.customerId).eq("company_id", req.params.companyId).single();
  if (cErr) return res.status(404).json({ message: "Customer not found." });
  const { data: vouchers } = await supabaseAdmin.from("sales_vouchers")
    .select("id,invoice_number,voucher_date,total,status")
    .eq("company_id", req.params.companyId).eq("customer_id", req.params.customerId)
    .order("voucher_date");
  let running = Number(cust.opening_balance || 0);
  const ledger = (vouchers || []).map((v) => { running += Number(v.total); return { ...v, running }; });
  res.json({ customer: cust, ledger });
});

/* ── GST Summary ── */
router.get("/gst-summary", async (req, res) => {
  const { from, to } = req.query;
  const cid = req.params.companyId;
  let sq = supabaseAdmin.from("sales_vouchers")
    .select("gst_amount,sales_voucher_items(gst_percent,amount)").eq("company_id", cid);
  let pq = supabaseAdmin.from("purchase_vouchers")
    .select("gst_amount,purchase_voucher_items(gst_percent,amount)").eq("company_id", cid);
  if (from) { sq = sq.gte("voucher_date", from); pq = pq.gte("voucher_date", from); }
  if (to) { sq = sq.lte("voucher_date", to); pq = pq.lte("voucher_date", to); }

  const [sales, purchases] = await Promise.all([sq, pq]);
  const sRate = {}, pRate = {};
  let sTotal = 0, pTotal = 0;
  (sales.data || []).forEach((v) => {
    sTotal += Number(v.gst_amount || 0);
    (v.sales_voucher_items || []).forEach((i) => { const g = Number(i.amount) * Number(i.gst_percent) / 100; sRate[i.gst_percent] = (sRate[i.gst_percent] || 0) + g; });
  });
  (purchases.data || []).forEach((v) => {
    pTotal += Number(v.gst_amount || 0);
    (v.purchase_voucher_items || []).forEach((i) => { const g = Number(i.amount) * Number(i.gst_percent) / 100; pRate[i.gst_percent] = (pRate[i.gst_percent] || 0) + g; });
  });
  res.json({ salesGst: sTotal, purchaseGst: pTotal, salesByRate: sRate, purchaseByRate: pRate });
});

/* ── Inventory Movement ── */
router.get("/inventory", async (req, res) => {
  const cid = req.params.companyId;
  const [stock, salesMoves, purchaseMoves] = await Promise.all([
    supabaseAdmin.from("stock_items").select("*").eq("company_id", cid).order("name"),
    supabaseAdmin.from("sales_voucher_items")
      .select("id,item_name,qty,voucher:sales_vouchers!inner(company_id,voucher_date,invoice_number)")
      .eq("voucher.company_id", cid).order("id", { ascending: false }).limit(15),
    supabaseAdmin.from("purchase_voucher_items")
      .select("id,item_name,qty,voucher:purchase_vouchers!inner(company_id,voucher_date,voucher_number)")
      .eq("voucher.company_id", cid).order("id", { ascending: false }).limit(15),
  ]);
  const movements = [
    ...(salesMoves.data || []).map((m) => ({ id: "s" + m.id, type: "out", item: m.item_name, qty: m.qty, date: m.voucher?.voucher_date, ref: m.voucher?.invoice_number })),
    ...(purchaseMoves.data || []).map((m) => ({ id: "p" + m.id, type: "in", item: m.item_name, qty: m.qty, date: m.voucher?.voucher_date, ref: m.voucher?.voucher_number })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
  res.json({ items: stock.data || [], movements });
});

module.exports = router;
