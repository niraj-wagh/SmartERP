"use client";
import { useState } from "react";
import { Download, Users, Truck, Boxes, Receipt, ShoppingCart } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api, downloadResponse } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const EXPORTS = [
  { key:"customers", label:"Customer Ledgers", icon:Users,
    columns:[{header:"Name",key:"name"},{header:"Mobile",key:"mobile"},{header:"GSTIN",key:"gstin"},{header:"Outstanding",key:"outstanding_balance"}] },
  { key:"suppliers", label:"Supplier Ledgers", icon:Truck,
    columns:[{header:"Name",key:"name"},{header:"Mobile",key:"mobile"},{header:"GSTIN",key:"gstin"},{header:"Payable",key:"outstanding_balance"}] },
  { key:"stock_items", label:"Stock Items", icon:Boxes,
    columns:[{header:"Name",key:"name"},{header:"SKU",key:"sku"},{header:"Qty",key:"quantity"},{header:"Purchase ₹",key:"purchase_price"},{header:"Selling ₹",key:"selling_price"},{header:"GST %",key:"gst_percent"}] },
  { key:"sales", label:"Sales Vouchers", icon:Receipt,
    columns:[{header:"Invoice #",key:"invoice_number"},{header:"Date",key:"voucher_date"},{header:"Subtotal",key:"subtotal"},{header:"GST",key:"gst_amount"},{header:"Total",key:"total"},{header:"Status",key:"status"}] },
  { key:"purchases", label:"Purchase Vouchers", icon:ShoppingCart,
    columns:[{header:"Voucher #",key:"voucher_number"},{header:"Date",key:"voucher_date"},{header:"Subtotal",key:"subtotal"},{header:"GST",key:"gst_amount"},{header:"Total",key:"total"},{header:"Status",key:"status"}] },
];

// Map friendly key → api method
const DATA_FETCHERS = {
  customers: (cid) => api.customers.list(cid),
  suppliers: (cid) => api.suppliers.list(cid),
  stock_items: (cid) => api.stockItems.list(cid),
  sales: (cid) => api.sales.list(cid),
  purchases: (cid) => api.purchases.list(cid),
};

export default function UtilitiesPage() {
  const { activeCompany } = useCompany();
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  async function onExport(spec) {
    setBusy(spec.key);
    try {
      const rows = await DATA_FETCHERS[spec.key](activeCompany.id);
      await downloadResponse(
        api.excel.export({ filename:`${spec.key}-${activeCompany.name}`, sheetName:spec.label, columns:spec.columns, rows }),
        `${spec.key}-${activeCompany.name}.xlsx`
      );
      toast.success(`${spec.label} exported.`);
    } catch (e) { toast.error(e.message); }
    setBusy(null);
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Utilities</p>
        <h1 className="font-display text-2xl font-semibold text-paper">Data export</h1>
        <p className="text-paper-faint text-sm mt-1">Download any master or voucher list as an Excel workbook — handy for backups or sharing with your CA.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {EXPORTS.map((spec) => (
          <Card key={spec.key} className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-panel-2 border border-hair flex items-center justify-center"><spec.icon size={15} className="text-signal"/></div>
              <p className="font-medium text-paper text-sm">{spec.label}</p>
            </div>
            <Button size="sm" variant="outline" icon={Download} loading={busy===spec.key} onClick={() => onExport(spec)}>Export</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
