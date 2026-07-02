"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Misc";
import Button from "@/components/ui/Button";

const TYPES = [
  { code:"CGST", desc:"Central GST — on intra-state sales, collected by the centre." },
  { code:"SGST", desc:"State GST — on intra-state sales, collected by the state." },
  { code:"IGST", desc:"Integrated GST — on inter-state sales, split later between centre and state." },
];

export default function GstPage() {
  const { activeCompany } = useCompany();
  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Compliance</p>
        <h1 className="font-display text-2xl font-semibold text-paper">GST</h1>
        <p className="text-paper-faint text-sm mt-1">GST is calculated per line item on every voucher using each stock item's rate.</p>
      </div>
      <Card className="p-5 flex items-center justify-between flex-wrap gap-4">
        <div><p className="text-xs text-paper-faint">Registered GSTIN</p><p className="font-mono text-lg text-paper mt-1">{activeCompany?.gst_number||"Not set"}</p></div>
        <Link href="/companies"><Button variant="outline" size="sm">Edit company GST details</Button></Link>
      </Card>
      <Card>
        <CardHeader eyebrow="Reports" title="GST Summary report" action={<Link href="/dashboard/reports/gst-summary"><Button size="sm" icon={ArrowRight}>Open report</Button></Link>} />
        <CardBody><p className="text-sm text-paper-dim">Output GST vs input GST for any date range, broken down by rate slab.</p></CardBody>
      </Card>
      <Card>
        <CardHeader eyebrow="Reference" title="GST types" />
        <CardBody className="space-y-3">
          {TYPES.map((t) => (<div key={t.code} className="flex items-start gap-3"><Badge tone="blue" className="mt-0.5 shrink-0">{t.code}</Badge><p className="text-sm text-paper-dim">{t.desc}</p></div>))}
          <p className="text-xs text-paper-faint pt-2 border-t border-hair">CGST/SGST vs IGST automatic split and full GSTR returns are on the roadmap.</p>
        </CardBody>
      </Card>
    </div>
  );
}
