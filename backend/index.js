require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { requireAuth } = require("./middleware/auth");

const app = express();

// ── Security & logging ──
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));

// ── Health check (no auth) ──
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "SmartERP API", version: "1.0.0" }));

// ── All routes below require a valid Supabase JWT ──
app.use(requireAuth);

// Routers
const companiesRouter = require("./routes/companies");
const customersRouter = require("./routes/customers");
const suppliersRouter = require("./routes/suppliers");
const stockItemsRouter = require("./routes/stockItems");
const salesRouter = require("./routes/sales");
const purchasesRouter = require("./routes/purchases");
const reportsRouter = require("./routes/reports");
const pdfRouter = require("./routes/pdf");
const excelRouter = require("./routes/excel");

app.use("/api/companies", companiesRouter);
app.use("/api/companies/:companyId/customers", customersRouter);
app.use("/api/companies/:companyId/suppliers", suppliersRouter);
app.use("/api/companies/:companyId/stock-items", stockItemsRouter);
app.use("/api/companies/:companyId/sales", salesRouter);
app.use("/api/companies/:companyId/purchases", purchasesRouter);
app.use("/api/companies/:companyId/reports", reportsRouter);
app.use("/api/pdf", pdfRouter);
app.use("/api/excel", excelRouter);

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error("[SmartERP Error]", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error." });
});

// ── 404 ──
app.use((_req, res) => res.status(404).json({ message: "Route not found." }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀  SmartERP Backend running on http://localhost:${PORT}`);
  console.log(`   Health check → GET http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
