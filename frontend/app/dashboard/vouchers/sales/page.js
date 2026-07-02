"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api } from "@/lib/api";
import { usePageShortcuts } from "@/lib/ShortcutContext";
import { Card } from "@/components/ui/Card";
import { Spinner, Badge } from "@/components/ui/Misc";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatDate } from "@/lib/format";

export default function SalesVoucherListPage() {
  const { activeCompany } = useCompany();
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try { setRows(await api.sales.list(activeCompany.id)); } catch {}
    setLoading(false);
  }, [activeCompany]);

  useEffect(() => { load(); }, [load]);
  usePageShortcuts([{ combo: "f8", display: "F8", label: "New sales voucher", action: () => router.push("/dashboard/vouchers/sales/new") }], [router]);

  const columns = useMemo(() => [
    { accessorKey: "invoice_number", header: "Invoice #", cell: (i) => <span className="num text-paper">{i.getValue()}</span> },
    { accessorFn: (r) => r.customer?.name||"—", id: "customer", header: "Customer" },
    { accessorKey: "voucher_date", header: "Date", cell: (i) => <span className="num text-paper-faint">{formatDate(i.getValue())}</span> },
    { accessorKey: "total", header: "Amount", cell: (i) => <span className="num">{formatCurrency(i.getValue())}</span> },
    { accessorKey: "status", header: "Status", cell: (i) => <Badge tone={i.getValue()==="paid"?"green":i.getValue()==="partial"?"amber":"red"}>{i.getValue()}</Badge> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => (
      <button onClick={() => router.push(`/dashboard/vouchers/sales/${row.original.id}`)} className="p-1.5 rounded-md hover:bg-panel-2 text-paper-faint hover:text-signal"><Eye size={14}/></button>
    )},
  ], [router]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Vouchers</p>
          <h1 className="font-display text-2xl font-semibold text-paper">Sales / Customer Bill</h1>
          <p className="text-paper-faint text-sm mt-1">Every invoice raised against a customer, newest first.</p>
        </div>
        <Button icon={Plus} shortcut="F8" onClick={() => router.push("/dashboard/vouchers/sales/new")}>New sales voucher</Button>
      </div>
      <Card>{loading ? <Spinner /> : <DataTable columns={columns} data={rows} emptyTitle="No sales vouchers yet" emptyDescription="Raise your first invoice." />}</Card>
    </div>
  );
}
