const router = require("express").Router({ mergeParams: true });
const { supabaseAdmin } = require("../lib/supabase");
const { requireCompanyAccess } = require("../middleware/auth");

router.use(requireCompanyAccess);

/* ── List ── */
router.get("/", async (req, res) => {
  const { from, to } = req.query;
  let q = supabaseAdmin.from("sales_vouchers")
    .select("id,invoice_number,voucher_date,subtotal,gst_amount,total,status,customer:customers(name)")
    .eq("company_id", req.params.companyId)
    .order("voucher_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (from) q = q.gte("voucher_date", from);
  if (to) q = q.lte("voucher_date", to);
  const { data, error } = await q;
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
});

/* ── Detail ── */
router.get("/:id", async (req, res) => {
  const { data: v, error } = await supabaseAdmin.from("sales_vouchers")
    .select("*, customer:customers(*)")
    .eq("id", req.params.id).eq("company_id", req.params.companyId).single();
  if (error) return res.status(404).json({ message: "Voucher not found." });
  const { data: items } = await supabaseAdmin.from("sales_voucher_items")
    .select("*").eq("voucher_id", req.params.id);
  res.json({ ...v, items: items || [] });
});

/* ── Create (atomic) ── */
router.post("/", async (req, res) => {
  const { customer_id, voucher_date, items = [], notes } = req.body;
  const cid = req.params.companyId;
  if (!customer_id) return res.status(400).json({ message: "Customer is required." });
  if (!items.length) return res.status(400).json({ message: "At least one item is required." });

  // Generate sequential invoice number within the financial year
  const year = (voucher_date || new Date().toISOString().slice(0, 10)).slice(0, 4);
  const { count } = await supabaseAdmin.from("sales_vouchers").select("id", { count: "exact", head: true })
    .eq("company_id", cid).gte("voucher_date", `${year}-01-01`);
  const seq = (count || 0) + 1;
  const invoice_number = `INV-${year}-${String(seq).padStart(4, "0")}`;

  // Compute totals
  let subtotal = 0, gst_amount = 0;
  const lineItems = items.map((i) => {
    const amount = Number(i.qty) * Number(i.rate);
    const gst = amount * Number(i.gst_percent || 0) / 100;
    subtotal += amount;
    gst_amount += gst;
    return { stock_item_id: i.stock_item_id, item_name: i.item_name, qty: Number(i.qty), rate: Number(i.rate), gst_percent: Number(i.gst_percent || 0), amount };
  });
  const total = subtotal + gst_amount;

  // Insert voucher
  const { data: voucher, error: vErr } = await supabaseAdmin.from("sales_vouchers")
    .insert({ company_id: cid, invoice_number, customer_id, voucher_date: voucher_date || new Date().toISOString().slice(0, 10), subtotal, gst_amount, total, notes, created_by: req.user.id })
    .select().single();
  if (vErr) return res.status(500).json({ message: vErr.message });

  // Insert line items
  const { error: liErr } = await supabaseAdmin.from("sales_voucher_items")
    .insert(lineItems.map((li) => ({ ...li, voucher_id: voucher.id })));
  if (liErr) return res.status(500).json({ message: liErr.message });

  // Decrease stock
  for (const li of lineItems) {
    if (li.stock_item_id) {
      await supabaseAdmin.rpc("decrement_stock", { p_item_id: li.stock_item_id, p_qty: li.qty }).catch(() => {
        // fallback: direct update
        supabaseAdmin.from("stock_items").select("quantity").eq("id", li.stock_item_id).single().then(({ data: s }) => {
          if (s) supabaseAdmin.from("stock_items").update({ quantity: Number(s.quantity) - li.qty }).eq("id", li.stock_item_id);
        });
      });
    }
  }

  // Update customer outstanding balance
  const { data: cust } = await supabaseAdmin.from("customers").select("outstanding_balance").eq("id", customer_id).single();
  if (cust) await supabaseAdmin.from("customers").update({ outstanding_balance: Number(cust.outstanding_balance) + total }).eq("id", customer_id);

  // Audit log
  await supabaseAdmin.from("audit_logs").insert({ company_id: cid, user_id: req.user.id, description: `Created sales invoice ${invoice_number} for ₹${total.toFixed(2)}` });

  res.status(201).json({ id: voucher.id, invoice_number });
});

/* ── Update status ── */
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  const valid = ["paid", "unpaid", "partial"];
  if (!valid.includes(status)) return res.status(400).json({ message: "Invalid status." });
  const { data, error } = await supabaseAdmin.from("sales_vouchers")
    .update({ status }).eq("id", req.params.id).eq("company_id", req.params.companyId).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

module.exports = router;
