"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Misc";
import { Input, Label } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/format";

function monthStart() { const d=new Date(); return new Date(d.getFullYear(),d.getMonth(),1).toISOString().slice(0,10); }
function today() { return new Date().toISOString().slice(0,10); }

export default function GstSummaryReport() {
  const { activeCompany } = useCompany();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try { setData(await api.reports.gstSummary(activeCompany.id, { from, to })); } catch {}
    setLoading(false);
  }, [activeCompany, from, to]);

  useEffect(() => { load(); }, [load]);

  const rates = data ? Array.from(new Set([...Object.keys(data.salesByRate||{}), ...Object.keys(data.purchaseByRate||{})])).sort((a,b)=>a-b) : [];
  const net = data ? (data.salesGst||0) - (data.purchaseGst||0) : 0;

  return (
    <div className="space-y-6 fade-in">
      <Link href="/dashboard/reports" className="flex items-center gap-1.5 text-sm text-paper-faint hover:text-paper w-fit"><ArrowLeft size={14}/> Reports</Link>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">GST report</p>
        <h1 className="font-display text-2xl font-semibold text-paper">GST Summary</h1>
        <p className="text-paper-faint text-sm mt-1">Output tax (sales) vs. input tax (purchases) for the selected period.</p>
      </div>
      <Card className="p-4 flex flex-wrap items-end gap-4">
        <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </Card>
      {loading ? <Spinner /> : !data ? null : (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="p-4"><p className="text-xs text-paper-faint">Output GST (sales)</p><p className="num text-2xl font-semibold text-paper mt-1">{formatCurrency(data.salesGst)}</p></Card>
            <Card className="p-4"><p className="text-xs text-paper-faint">Input GST (purchases)</p><p className="num text-2xl font-semibold text-paper mt-1">{formatCurrency(data.purchaseGst)}</p></Card>
            <Card className="p-4 border-signal/40">
              <p className="text-xs text-paper-faint">Net GST payable</p>
              <p className={"num text-2xl font-semibold mt-1 "+(net>=0?"text-signal":"text-green")}>{formatCurrency(Math.abs(net))} {net>=0?"payable":"credit"}</p>
            </Card>
          </div>
          <Card>
            <CardHeader eyebrow="Breakdown" title="By GST rate slab" />
            <CardBody className="!p-0">
              <table className="ledger-table">
                <thead><tr><th>Rate</th><th>Output GST</th><th>Input GST</th></tr></thead>
                <tbody>
                  {!rates.length ? <tr><td colSpan={3} className="text-center text-paper-faint py-10">No GST activity in this range.</td></tr>
                    : rates.map((r) => (
                    <tr key={r}><td>{r}%</td><td className="num">{formatCurrency(data.salesByRate[r]||0)}</td><td className="num">{formatCurrency(data.purchaseByRate[r]||0)}</td></tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
