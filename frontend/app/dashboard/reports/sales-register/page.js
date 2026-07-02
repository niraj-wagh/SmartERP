"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Eye } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api, downloadResponse } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Card } from "@/components/ui/Card";
import { Spinner, Badge } from "@/components/ui/Misc";
import Button from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/format";

function monthStart() { const d=new Date(); return new Date(d.getFullYear(),d.getMonth(),1).toISOString().slice(0,10); }
function today() { return new Date().toISOString().slice(0,10); }

export default function SalesRegisterReport() {
  const { activeCompany } = useCompany();
  const router = useRouter();
  const toast = useToast();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try { setRows(await api.reports.salesRegister(activeCompany.id, { from, to })); } catch {}
    setLoading(false);
  }, [activeCompany, from, to]);

  useEffect(() => { load(); }, [load]);
  const totals = rows.reduce((s,r) => ({subtotal:s.subtotal+Number(r.subtotal||0),gst:s.gst+Number(r.gst_amount||0),total:s.total+Number(r.total||0)}), {subtotal:0,gst:0,total:0});

  async function onExport() {
    setExporting(true);
    try {
      await downloadResponse(api.excel.export({ filename:`sales-register-${from}-to-${to}`, sheetName:"Sales Register",
        columns:[{header:"Invoice #",key:"invoice_number"},{header:"Date",key:"voucher_date"},{header:"Customer",key:"customer"},{header:"Subtotal",key:"subtotal"},{header:"GST",key:"gst_amount"},{header:"Total",key:"total"},{header:"Status",key:"status"}],
        rows:rows.map((r) => ({...r,customer:r.customer?.name||""})),
      }), `sales-register-${from}-to-${to}.xlsx`);
    } catch (e) { toast.error(e.message); }
    setExporting(false);
  }

  const columns = useMemo(() => [
    { accessorKey: "invoice_number", header: "Invoice #", cell: (i) => <span className="num">{i.getValue()}</span> },
    { accessorFn: (r) => r.customer?.name||"—", id: "customer", header: "Customer" },
    { accessorKey: "voucher_date", header: "Date", cell: (i) => <span className="num text-paper-faint">{formatDate(i.getValue())}</span> },
    { accessorKey: "total", header: "Total", cell: (i) => <span className="num">{formatCurrency(i.getValue())}</span> },
    { accessorKey: "status", header: "Status", cell: (i) => <Badge tone={i.getValue()==="paid"?"green":i.getValue()==="partial"?"amber":"red"}>{i.getValue()}</Badge> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => <button onClick={() => router.push(`/dashboard/vouchers/sales/${row.original.id}`)} className="p-1.5 rounded-md hover:bg-panel-2 text-paper-faint hover:text-signal"><Eye size={14}/></button> },
  ], [router]);

  return (
    <div className="space-y-6 fade-in">
      <Link href="/dashboard/reports" className="flex items-center gap-1.5 text-sm text-paper-faint hover:text-paper w-fit"><ArrowLeft size={14}/> Reports</Link>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Sales report</p>
          <h1 className="font-display text-2xl font-semibold text-paper">Sales Register</h1>
        </div>
        <Button variant="outline" icon={Download} loading={exporting} onClick={onExport}>Export Excel</Button>
      </div>
      <Card className="p-4 flex flex-wrap items-end gap-4">
        <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="flex gap-6 ml-auto text-sm">
          <div><p className="text-paper-faint text-xs">Subtotal</p><p className="num text-paper">{formatCurrency(totals.subtotal)}</p></div>
          <div><p className="text-paper-faint text-xs">GST</p><p className="num text-paper">{formatCurrency(totals.gst)}</p></div>
          <div><p className="text-paper-faint text-xs">Total</p><p className="num text-signal font-semibold">{formatCurrency(totals.total)}</p></div>
        </div>
      </Card>
      <Card>{loading ? <Spinner /> : <DataTable columns={columns} data={rows} pageSize={15} emptyTitle="No invoices in this range" />}</Card>
    </div>
  );
}
