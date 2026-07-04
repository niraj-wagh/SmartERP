require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { requireAuth } = require("./middleware/auth");

const app = express();

// ── CORS — allow Vercel frontend + local dev + any Vercel preview ──
app.use(cors({
  origin: function (origin, callback) {
    // No origin = server-to-server or Postman — allow
    if (!origin) return callback(null, true);

    const allowed = [
      process.env.CORS_ORIGIN,          // e.g. https://smart-erp-omega.vercel.app
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].filter(Boolean);

    // Allow any Vercel preview URL for this project
    const isVercelPreview = /^https:\/\/smart-erp[^.]*\.vercel\.app$/.test(origin);

    if (allowed.includes(origin) || isVercelPreview) {
      return callback(null, true);
    }

    console.warn("[CORS] Blocked:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Handle preflight OPTIONS for every route BEFORE auth
app.options("*", cors());

// ── Security & logging ──
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));

// ── Health check (no auth, used to wake up Render) ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "SmartERP API", version: "1.0.0" });
});

// ── Auth middleware on all routes below ──
app.use(requireAuth);

// ── Route imports ──
const companiesRouter   = require("./routes/companies");
const customersRouter   = require("./routes/customers");
const suppliersRouter   = require("./routes/suppliers");
const stockItemsRouter  = require("./routes/stockItems");
const salesRouter       = require("./routes/sales");
const purchasesRouter   = require("./routes/purchases");
const reportsRouter     = require("./routes/reports");
const pdfRouter         = require("./routes/pdf");
const excelRouter       = require("./routes/excel");

app.use("/api/companies",                          companiesRouter);
app.use("/api/companies/:companyId/customers",     customersRouter);
app.use("/api/companies/:companyId/suppliers",     suppliersRouter);
app.use("/api/companies/:companyId/stock-items",   stockItemsRouter);
app.use("/api/companies/:companyId/sales",         salesRouter);
app.use("/api/companies/:companyId/purchases",     purchasesRouter);
app.use("/api/companies/:companyId/reports",       reportsRouter);
app.use("/api/pdf",                                pdfRouter);
app.use("/api/excel",                              excelRouter);

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error("[Error]", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error." });
});

// ── 404 ──
app.use((_req, res) => res.status(404).json({ message: "Route not found." }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀  SmartERP Backend running on port ${PORT}`);
  console.log(`   CORS_ORIGIN = ${process.env.CORS_ORIGIN || "(not set)"}\n`);
});

module.exports = app;
