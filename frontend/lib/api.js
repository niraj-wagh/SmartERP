// Central API client — calls the Express backend
// Every request includes the Supabase JWT for authentication.
import { supabase } from "./supabaseClient";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const e = await res.json(); msg = e.message || msg; } catch {}
    throw new Error(msg);
  }
  // For binary responses (PDF, xlsx) return the response object
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/pdf") || ct.includes("spreadsheetml")) return res;
  return res.json();
}

// ── Companies ──────────────────────────────────────────────
export const api = {
  companies: {
    list: () => apiFetch("/api/companies"),
    create: (body) => apiFetch("/api/companies", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) => apiFetch(`/api/companies/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id) => apiFetch(`/api/companies/${id}`, { method: "DELETE" }),
    dashboard: (cid) => apiFetch(`/api/companies/${cid}/dashboard`),
    auditLogs: (cid) => apiFetch(`/api/companies/${cid}/audit-logs`),
    members: {
      list: (cid) => apiFetch(`/api/companies/${cid}/members`),
      add: (cid, body) => apiFetch(`/api/companies/${cid}/members`, { method: "POST", body: JSON.stringify(body) }),
      updateRole: (cid, mid, role) => apiFetch(`/api/companies/${cid}/members/${mid}`, { method: "PUT", body: JSON.stringify({ role }) }),
      remove: (cid, mid) => apiFetch(`/api/companies/${cid}/members/${mid}`, { method: "DELETE" }),
    },
  },

  // ── Masters ───────────────────────────────────────────────
  customers: {
    list: (cid) => apiFetch(`/api/companies/${cid}/customers`),
    create: (cid, body) => apiFetch(`/api/companies/${cid}/customers`, { method: "POST", body: JSON.stringify(body) }),
    update: (cid, id, body) => apiFetch(`/api/companies/${cid}/customers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (cid, id) => apiFetch(`/api/companies/${cid}/customers/${id}`, { method: "DELETE" }),
  },

  suppliers: {
    list: (cid) => apiFetch(`/api/companies/${cid}/suppliers`),
    create: (cid, body) => apiFetch(`/api/companies/${cid}/suppliers`, { method: "POST", body: JSON.stringify(body) }),
    update: (cid, id, body) => apiFetch(`/api/companies/${cid}/suppliers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (cid, id) => apiFetch(`/api/companies/${cid}/suppliers/${id}`, { method: "DELETE" }),
  },

  stockItems: {
    list: (cid) => apiFetch(`/api/companies/${cid}/stock-items`),
    create: (cid, body) => apiFetch(`/api/companies/${cid}/stock-items`, { method: "POST", body: JSON.stringify(body) }),
    update: (cid, id, body) => apiFetch(`/api/companies/${cid}/stock-items/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (cid, id) => apiFetch(`/api/companies/${cid}/stock-items/${id}`, { method: "DELETE" }),
  },

  // ── Vouchers ──────────────────────────────────────────────
  sales: {
    list: (cid, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return apiFetch(`/api/companies/${cid}/sales${q ? "?" + q : ""}`);
    },
    get: (cid, id) => apiFetch(`/api/companies/${cid}/sales/${id}`),
    create: (cid, body) => apiFetch(`/api/companies/${cid}/sales`, { method: "POST", body: JSON.stringify(body) }),
    updateStatus: (cid, id, status) => apiFetch(`/api/companies/${cid}/sales/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },

  purchases: {
    list: (cid, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return apiFetch(`/api/companies/${cid}/purchases${q ? "?" + q : ""}`);
    },
    get: (cid, id) => apiFetch(`/api/companies/${cid}/purchases/${id}`),
    create: (cid, body) => apiFetch(`/api/companies/${cid}/purchases`, { method: "POST", body: JSON.stringify(body) }),
    updateStatus: (cid, id, status) => apiFetch(`/api/companies/${cid}/purchases/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },

  // ── Reports ───────────────────────────────────────────────
  reports: {
    stockSummary: (cid) => apiFetch(`/api/companies/${cid}/reports/stock-summary`),
    salesRegister: (cid, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return apiFetch(`/api/companies/${cid}/reports/sales-register${q ? "?" + q : ""}`);
    },
    customerStatement: (cid, customerId) => apiFetch(`/api/companies/${cid}/reports/customer-statement/${customerId}`),
    gstSummary: (cid, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return apiFetch(`/api/companies/${cid}/reports/gst-summary${q ? "?" + q : ""}`);
    },
    inventory: (cid) => apiFetch(`/api/companies/${cid}/reports/inventory`),
  },

  // ── PDF & Excel (return Response for blob download) ───────
  pdf: {
    voucher: (body) => apiFetch("/api/pdf/voucher", { method: "POST", body: JSON.stringify(body) }),
  },
  excel: {
    export: (body) => apiFetch("/api/excel/export", { method: "POST", body: JSON.stringify(body) }),
  },
};

// Helper: download a binary response as a file
export async function downloadResponse(responseOrPromise, filename) {
  const res = await responseOrPromise;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
