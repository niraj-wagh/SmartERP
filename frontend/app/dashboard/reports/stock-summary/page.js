"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Download, AlertTriangle } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api, downloadResponse } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Misc";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function StockSummaryReport() {
  const { activeCompany } = useCompany();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try { setRows(await api.reports.stockSummary(activeCompany.id)); } catch {}
    setLoading(false);
  }, [activeCompany]);

  useEffect(() => { load(); }, [load]);
  const totalValue = rows.reduce((s, r) => s + Number(r.quantity||0) * Number(r.purchase_price||0), 0);

  async function onExport() {
    setExporting(true);
    try {
      await downloadResponse(api.excel.export({ filename: `stock-summary-${activeCompany.name}`, sheetName: "Stock Summary",
        columns: [{header:"Item",key:"name"},{header:"SKU",key:"sku"},{header:"Unit",key:"unit"},{header:"Qty",key:"quantity"},{header:"Purchase ₹",key:"purchase_price"},{header:"Selling ₹",key:"selling_price"},{header:"GST %",key:"gst_percent"}],
        rows: rows.map((r) => ({...r, value: Number(r.quantity||0)*Number(r.purchase_price||0)})),
      }), `stock-summary-${activeCompany.name}.xlsx`);
    } catch (e) { toast.error(e.message); }
    setExporting(false);
  }

  const columns = useMemo(() => [
    { accessorKey: "name", header: "Item", cell: (i) => <span className="font-medium text-paper">{i.getValue()}</span> },
    { accessorKey: "sku", header: "SKU" },
    { accessorKey: "quantity", header: "Qty", cell: ({ row }) => {
      const low = Number(row.original.quantity) <= Number(row.original.reorder_level||0);
      return <span className={"num flex items-center gap-1.5 "+(low?"text-red":"text-paper")}>{low&&<AlertTriangle size={11}/>}{formatNumber(row.original.quantity)} {row.original.unit}</span>;
    }},
    { accessorKey: "purchase_price", header: "Cost ₹", cell: (i) => <span className="num">{formatCurrency(i.getValue())}</span> },
    { id: "value", header: "Stock value", cell: ({ row }) => <span className="num text-paper">{formatCurrency(Number(row.original.quantity||0)*Number(row.original.purchase_price||0))}</span> },
  ], []);

  return (
    <div className="space-y-6 fade-in">
      <Link href="/dashboard/reports" className="flex items-center gap-1.5 text-sm text-paper-faint hover:text-paper w-fit"><ArrowLeft size={14}/> Reports</Link>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Inventory report</p>
          <h1 className="font-display text-2xl font-semibold text-paper">Stock Summary</h1>
          <p className="text-paper-faint text-sm mt-1">Total stock value at cost: <span className="num text-paper">{formatCurrency(totalValue)}</span></p>
        </div>
        <Button variant="outline" icon={Download} loading={exporting} onClick={onExport}>Export Excel</Button>
      </div>
      <Card>{loading ? <Spinner /> : <DataTable columns={columns} data={rows} emptyTitle="No stock items yet" />}</Card>
    </div>
  );
}
