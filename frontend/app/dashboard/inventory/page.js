"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Boxes, AlertTriangle, ArrowRight } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Misc";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export default function InventoryPage() {
  const { activeCompany } = useCompany();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try { setData(await api.reports.inventory(activeCompany.id)); } catch {}
    setLoading(false);
  }, [activeCompany]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner label="Loading inventory…" />;

  const items = data?.items || [];
  const movements = data?.movements || [];
  const totalValue = items.reduce((s,i) => s+Number(i.quantity||0)*Number(i.purchase_price||0), 0);
  const lowStock = items.filter((i) => Number(i.quantity)<=Number(i.reorder_level||0));

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Inventory</p>
        <h1 className="font-display text-2xl font-semibold text-paper">Stock movement &amp; valuation</h1>
        <p className="text-paper-faint text-sm mt-1">Live view of what's in stock, what's low, and what moved last.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-2 text-paper-faint text-xs mb-1"><Boxes size={13}/> Items tracked</div><p className="num text-2xl font-semibold text-paper">{items.length}</p></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-paper-faint text-xs mb-1"><Boxes size={13}/> Stock value (cost)</div><p className="num text-2xl font-semibold text-paper">{formatCurrency(totalValue)}</p></Card>
        <Card className="p-4 border-red/30"><div className="flex items-center gap-2 text-red text-xs mb-1"><AlertTriangle size={13}/> Below reorder level</div><p className="num text-2xl font-semibold text-red">{lowStock.length}</p></Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader eyebrow="Needs attention" title="Low stock items" action={<Link href="/dashboard/masters/stock-items" className="text-xs text-signal hover:underline flex items-center gap-1">Manage <ArrowRight size={12}/></Link>} />
          <CardBody className="!p-0">
            {!lowStock.length ? <p className="text-center text-sm text-paper-faint py-10">All items above their reorder level.</p> : (
              <ul className="divide-y divide-hair-soft">
                {lowStock.map((i) => (
                  <li key={i.id} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-paper">{i.name}</span>
                    <span className="num text-xs text-red">{formatNumber(i.quantity)} / {i.reorder_level} {i.unit}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader eyebrow="Last 20 entries" title="Recent stock movement" />
          <CardBody className="!p-0">
            {!movements.length ? <p className="text-center text-sm text-paper-faint py-10">No stock movement yet.</p> : (
              <ul className="divide-y divide-hair-soft">
                {movements.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-5 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {m.type==="in" ? <ArrowDownCircle size={14} className="text-green shrink-0"/> : <ArrowUpCircle size={14} className="text-red shrink-0"/>}
                      <div className="min-w-0">
                        <p className="text-sm text-paper truncate">{m.item}</p>
                        <p className="text-[10px] text-paper-faint font-mono">{m.ref} · {formatDate(m.date)}</p>
                      </div>
                    </div>
                    <span className={"num text-xs shrink-0 "+(m.type==="in"?"text-green":"text-red")}>{m.type==="in"?"+":"−"}{formatNumber(m.qty)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
