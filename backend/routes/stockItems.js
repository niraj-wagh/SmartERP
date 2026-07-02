const router = require("express").Router({ mergeParams: true });
const { supabaseAdmin } = require("../lib/supabase");
const { requireCompanyAccess } = require("../middleware/auth");

router.use(requireCompanyAccess);

router.get("/", async (req, res) => {
  const { data, error } = await supabaseAdmin.from("stock_items").select("*")
    .eq("company_id", req.params.companyId).order("name");
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
});

router.post("/", async (req, res) => {
  const { name, sku, unit = "PCS", purchase_price = 0, selling_price = 0, quantity = 0, gst_percent = 0, reorder_level = 0 } = req.body;
  if (!name) return res.status(400).json({ message: "Item name is required." });
  const { data, error } = await supabaseAdmin.from("stock_items")
    .insert({
      company_id: req.params.companyId, name, sku, unit,
      purchase_price: Number(purchase_price), selling_price: Number(selling_price),
      quantity: Number(quantity), gst_percent: Number(gst_percent), reorder_level: Number(reorder_level),
    }).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
});

router.put("/:id", async (req, res) => {
  const { name, sku, unit, purchase_price, selling_price, quantity, gst_percent, reorder_level } = req.body;
  const { data, error } = await supabaseAdmin.from("stock_items")
    .update({
      name, sku, unit,
      purchase_price: Number(purchase_price), selling_price: Number(selling_price),
      quantity: Number(quantity), gst_percent: Number(gst_percent), reorder_level: Number(reorder_level),
    }).eq("id", req.params.id).eq("company_id", req.params.companyId).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.delete("/:id", async (req, res) => {
  const { error } = await supabaseAdmin.from("stock_items")
    .delete().eq("id", req.params.id).eq("company_id", req.params.companyId);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ success: true });
});

module.exports = router;
