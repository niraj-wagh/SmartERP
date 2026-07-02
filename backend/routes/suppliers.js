const router = require("express").Router({ mergeParams: true });
const { supabaseAdmin } = require("../lib/supabase");
const { requireCompanyAccess } = require("../middleware/auth");

router.use(requireCompanyAccess);

router.get("/", async (req, res) => {
  const { data, error } = await supabaseAdmin.from("suppliers").select("*")
    .eq("company_id", req.params.companyId).order("name");
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
});

router.post("/", async (req, res) => {
  const { name, mobile, address, gstin, opening_balance = 0 } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required." });
  const ob = Number(opening_balance) || 0;
  const { data, error } = await supabaseAdmin.from("suppliers")
    .insert({ company_id: req.params.companyId, name, mobile, address, gstin, opening_balance: ob, outstanding_balance: ob })
    .select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
});

router.put("/:id", async (req, res) => {
  const { name, mobile, address, gstin } = req.body;
  const { data, error } = await supabaseAdmin.from("suppliers")
    .update({ name, mobile, address, gstin }).eq("id", req.params.id)
    .eq("company_id", req.params.companyId).select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

router.delete("/:id", async (req, res) => {
  const { error } = await supabaseAdmin.from("suppliers")
    .delete().eq("id", req.params.id).eq("company_id", req.params.companyId);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ success: true });
});

module.exports = router;
