"use client";

import Link from "next/link";
import { Boxes, Receipt, BookUser, Percent, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

const REPORTS = [
  { href: "/dashboard/reports/stock-summary", label: "Stock Summary", icon: Boxes, desc: "Quantity, value and reorder status for every item." },
  { href: "/dashboard/reports/sales-register", label: "Sales Register", icon: Receipt, desc: "Every invoice raised in a date range, with totals." },
  { href: "/dashboard/reports/customer-statement", label: "Customer Statement", icon: BookUser, desc: "A running ledger of invoices for one customer." },
  { href: "/dashboard/reports/gst-summary", label: "GST Summary", icon: Percent, desc: "GST collected on sales vs. paid on purchases." },
];

export default function ReportsHub() {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Reports</p>
        <h1 className="font-display text-2xl font-semibold text-paper">Financial &amp; inventory reports</h1>
        <p className="text-paper-faint text-sm mt-1">Pulled live from your ledgers and vouchers — nothing pre-computed.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="p-5 hover:border-signal/50 transition-colors h-full flex items-start gap-4">
              <div className="w-9 h-9 rounded-md bg-panel-2 border border-hair flex items-center justify-center shrink-0">
                <r.icon size={16} className="text-signal" />
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold text-paper flex items-center justify-between">
                  {r.label} <ArrowRight size={14} className="text-paper-faint" />
                </p>
                <p className="text-xs text-paper-faint mt-1">{r.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
