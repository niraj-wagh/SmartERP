"use client";
import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Eye } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api, downloadResponse } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Misc";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/format";

function Inner() {
  const { activeCompany } = useCompany();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(searchParams.get("customer") || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!activeCompany) return;
    api.customers.list(activeCompany.id).then((list) => {
      setCustomers(list || []);
      if (!customerId && list?.length) setCustomerId(list[0].id);
    }).catch(() => {});
  }, [activeCompany]);

  const load = useCallback(async () => {
    if (!activeCompany || !customerId) return;
    setLoading(true);
    try { setData(await api.reports.customerStatement(activeCompany.id, customerId)); }
    catch { setData(null); }
    setLoading(false);
  }, [activeCompany, customerId]);

  useEffect(() => { load(); }, [load]);

  async function onExport() {
    if (!data) return;
    setExporting(true);
    try {
      await downloadResponse(api.excel.export({
        filename: `statement-${data.customer.name}`, sheetName: "Customer Statement",
        columns: [{header:"Invoice #",key:"invoice_number"},{header:"Date",key:"voucher_date"},{header:"Amount",key:"total"},{header:"Running Balance",key:"running"},{header:"Status",key:"status"}],
        rows: data.ledger,
      }), `statement-${data.customer.name}.xlsx`);
    } catch (e) { toast.error(e.message); }
    setExporting(false);
  }

  return (
    <div className="space-y-6 fade-in">
      <Link href="/dashboard/reports" className="flex items-center gap-1.5 text-sm text-paper-faint hover:text-paper w-fit"><ArrowLeft size={14}/> Reports</Link>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Ledger report</p>
          <h1 className="font-display text-2xl font-semibold text-paper">Customer Statement</h1>
        </div>
        <Button variant="outline" icon={Download} loading={exporting} onClick={onExport} disabled={!data}>Export Excel</Button>
      </div>
      <Card className="p-4 flex flex-wrap items-end gap-4">
        <div className="w-64">
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        {data?.customer && (
          <div className="flex gap-6 ml-auto text-sm">
            <div><p className="text-paper-faint text-xs">Opening balance</p><p className="num text-paper">{formatCurrency(data.customer.opening_balance)}</p></div>
            <div><p className="text-paper-faint text-xs">Outstanding</p><p className="num text-signal font-semibold">{formatCurrency(data.customer.outstanding_balance)}</p></div>
          </div>
        )}
      </Card>
      <Card>
        {loading ? <Spinner /> : !data ? (
          <p className="text-center text-sm text-paper-faint py-14">Select a customer to view their statement.</p>
        ) : (
          <table className="ledger-table">
            <thead><tr><th>Invoice #</th><th>Date</th><th>Amount</th><th>Running balance</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr><td colSpan={3} className="text-paper-faint italic">Opening balance</td><td className="num">{formatCurrency(data.customer.opening_balance)}</td><td></td><td></td></tr>
              {data.ledger.map((v) => (
                <tr key={v.id}>
                  <td className="num">{v.invoice_number}</td>
                  <td className="num text-paper-faint">{formatDate(v.voucher_date)}</td>
                  <td className="num">{formatCurrency(v.total)}</td>
                  <td className="num text-paper">{formatCurrency(v.running)}</td>
                  <td><span className="text-xs text-paper-faint">{v.status}</span></td>
                  <td><button onClick={() => router.push(`/dashboard/vouchers/sales/${v.id}`)} className="p-1.5 rounded-md hover:bg-panel-2 text-paper-faint hover:text-signal"><Eye size={13}/></button></td>
                </tr>
              ))}
              {!data.ledger.length && <tr><td colSpan={6} className="text-center text-paper-faint py-10">No invoices yet for this customer.</td></tr>}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export default function CustomerStatementPage() {
  return <Suspense fallback={<Spinner label="Loading statement…" />}><Inner /></Suspense>;
}
