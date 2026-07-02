"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Truck, Boxes, Receipt, ShoppingCart, AlertTriangle, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api } from "@/lib/api";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge, Spinner } from "@/components/ui/Misc";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePageShortcuts } from "@/lib/ShortcutContext";
import { NAV } from "@/lib/nav";

export default function GatewayPage() {
  const { activeCompany } = useCompany();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  usePageShortcuts([
    { combo: "f8", display: "F8", label: "Sales voucher", action: () => router.push("/dashboard/vouchers/sales/new") },
    { combo: "f9", display: "F9", label: "Purchase entry", action: () => router.push("/dashboard/vouchers/purchase/new") },
  ], [router]);

  useEffect(() => {
    if (!activeCompany) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try { const d = await api.companies.dashboard(activeCompany.id); if (!cancelled) { setData(d); } }
      catch { if (!cancelled) setData(null); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [activeCompany]);

  if (loading) return <Spinner label="Loading the Gateway…" />;

  const tiles = [
    { label: "Customer Ledgers", value: data?.customers || 0, icon: Users, href: "/dashboard/masters/customers" },
    { label: "Supplier Ledgers", value: data?.suppliers || 0, icon: Truck, href: "/dashboard/masters/suppliers" },
    { label: "Stock Items", value: data?.items || 0, icon: Boxes, href: "/dashboard/masters/stock-items" },
    { label: "Today's Sales", value: formatCurrency(data?.todaysSalesTotal || 0), icon: TrendingUp, href: "/dashboard/reports/sales-register", isCurrency: true },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Gateway of SmartERP</p>
          <h1 className="font-display text-2xl font-semibold text-paper">{activeCompany?.name}</h1>
          <p className="text-paper-faint text-sm mt-1">FY {activeCompany?.financial_year} · {activeCompany?.state}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/vouchers/sales/new"><Button icon={Receipt} shortcut="F8">New Sales Voucher</Button></Link>
          <Link href="/dashboard/vouchers/purchase/new"><Button variant="secondary" icon={ShoppingCart} shortcut="F9">New Purchase</Button></Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href}>
            <Card className="p-4 hover:border-signal/50 transition-colors h-full">
              <div className="flex items-center justify-between mb-3"><div className="w-8 h-8 rounded-md bg-panel-2 border border-hair flex items-center justify-center"><t.icon size={14} className="text-signal" /></div></div>
              <p className={t.isCurrency?"num text-xl font-semibold text-paper":"num text-2xl font-semibold text-paper"}>{t.value}</p>
              <p className="text-xs text-paper-faint mt-1">{t.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader eyebrow="Latest entries" title="Recent vouchers" action={<Link href="/dashboard/vouchers/sales" className="text-xs text-signal hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>} />
          <CardBody className="!p-0">
            {!data?.recent?.length ? (
              <div className="px-5 py-10 text-center text-sm text-paper-faint">No vouchers yet.</div>
            ) : (
              <table className="ledger-table">
                <thead><tr><th>Voucher</th><th>Party</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {data.recent.map((r) => (
                    <tr key={r.kind+r.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/vouchers/${r.kind}/${r.id}`)}>
                      <td><Badge tone={r.kind==="sales"?"amber":"blue"}>{r.kind==="sales"?"Sales":"Purchase"}</Badge> <span className="num text-xs text-paper-dim">{r.label}</span></td>
                      <td>{r.party||"—"}</td>
                      <td className="num text-paper-faint">{formatDate(r.date)}</td>
                      <td className="num">{formatCurrency(r.total)}</td>
                      <td><Badge tone={r.status==="paid"?"green":r.status==="partial"?"amber":"red"}>{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader eyebrow={data?.lowStock?.length?"Action needed":"Stock health"} title="Low stock alerts" />
          <CardBody className="!p-0">
            {!data?.lowStock?.length ? (
              <div className="px-5 py-10 text-center text-sm text-paper-faint">All items healthy.</div>
            ) : (
              <ul className="divide-y divide-hair-soft">
                {data.lowStock.slice(0,6).map((i) => (
                  <li key={i.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2.5"><AlertTriangle size={13} className="text-red shrink-0" /><span className="text-sm text-paper truncate">{i.name}</span></div>
                    <span className="num text-xs text-red shrink-0">{i.quantity} {i.unit}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader eyebrow="Menu" title="Explore the Gateway" />
        <CardBody>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {NAV.filter((n) => n.type==="group").flatMap((g) => g.items.map((i) => (
              <Link key={i.href} href={i.href} className="flex items-center justify-between px-4 py-3 rounded-lg border border-hair hover:border-signal/50 hover:bg-panel-2 transition-colors text-sm text-paper-dim hover:text-paper">
                {i.label}<ArrowRight size={13} />
              </Link>
            )))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
