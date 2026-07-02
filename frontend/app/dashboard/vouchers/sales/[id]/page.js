"use client";
import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api, downloadResponse } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { usePageShortcuts } from "@/lib/ShortcutContext";
import Button from "@/components/ui/Button";
import { Spinner, Badge } from "@/components/ui/Misc";
import { Select } from "@/components/ui/Field";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export default function SalesVoucherViewPage({ params }) {
  const { id } = usePromise(params);
  const { activeCompany } = useCompany();
  const router = useRouter();
  const toast = useToast();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!activeCompany) return;
    api.sales.get(activeCompany.id, id)
      .then((v) => { setVoucher(v); setLoading(false); })
      .catch(() => { toast.error("Could not load this voucher."); setLoading(false); });
  }, [id, activeCompany]);

  usePageShortcuts([
    { combo: "ctrl+p", display: "Ctrl P", label: "Print", action: () => window.print() },
    { combo: "ctrl+shift+p", display: "Ctrl Shift P", label: "Download PDF", action: () => downloadPdf() },
  ], [voucher]);

  async function updateStatus(status) {
    try { const updated = await api.sales.updateStatus(activeCompany.id, id, status); setVoucher((v) => ({...v, status: updated.status})); toast.success("Status updated."); }
    catch (err) { toast.error(err.message); }
  }

  async function downloadPdf() {
    if (!voucher) return;
    setDownloading(true);
    try {
      await downloadResponse(api.pdf.voucher({ kind: "Sales Invoice", number: voucher.invoice_number, date: voucher.voucher_date, company: activeCompany, party: voucher.customer, items: voucher.items||[], subtotal: voucher.subtotal, gstAmount: voucher.gst_amount, total: voucher.total, notes: voucher.notes }), `${voucher.invoice_number}.pdf`);
    } catch (err) { toast.error(err.message); }
    setDownloading(false);
  }

  if (loading) return <Spinner label="Loading invoice…" />;
  if (!voucher) return null;
  const items = voucher.items || [];

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <div className="flex items-center justify-between no-print">
        <button onClick={() => router.push("/dashboard/vouchers/sales")} className="flex items-center gap-1.5 text-sm text-paper-faint hover:text-paper"><ArrowLeft size={14}/> Back</button>
        <div className="flex items-center gap-2">
          <Select value={voucher.status} onChange={(e) => updateStatus(e.target.value)} className="!w-36 !py-1.5">
            <option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option>
          </Select>
          <Button variant="outline" icon={Printer} shortcut="Ctrl P" onClick={() => window.print()}>Print</Button>
          <Button icon={downloading?Loader2:Download} loading={downloading} onClick={downloadPdf}>PDF</Button>
        </div>
      </div>
      <div className="bg-white text-[#16213e] rounded-xl p-8 sm:p-10 shadow-2xl shadow-black/40 print:shadow-none print:rounded-none">
        <div className="flex items-start justify-between border-b border-[#16213e]/15 pb-6 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#16213e]/50 font-mono mb-1">Tax Invoice</p>
            <h1 className="font-display text-2xl font-bold">{activeCompany?.name}</h1>
            <p className="text-xs text-[#16213e]/60 mt-1 max-w-xs">{activeCompany?.address}</p>
            {activeCompany?.gst_number && <p className="text-xs text-[#16213e]/60 font-mono">GSTIN {activeCompany.gst_number}</p>}
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold">{voucher.invoice_number}</p>
            <p className="text-xs text-[#16213e]/60 mt-1">{formatDate(voucher.voucher_date)}</p>
            <Badge tone={voucher.status==="paid"?"green":voucher.status==="partial"?"amber":"red"} className="mt-2">{voucher.status}</Badge>
          </div>
        </div>
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#16213e]/50 font-mono mb-1.5">Billed to</p>
          <p className="font-semibold">{voucher.customer?.name}</p>
          <p className="text-xs text-[#16213e]/60 mt-0.5">{voucher.customer?.address}</p>
          <p className="text-xs text-[#16213e]/60">{voucher.customer?.mobile}</p>
          {voucher.customer?.gstin && <p className="text-xs text-[#16213e]/60 font-mono">GSTIN {voucher.customer.gstin}</p>}
        </div>
        <table className="w-full text-sm mb-8">
          <thead><tr className="border-b-2 border-[#16213e]/15 text-left text-[10px] uppercase tracking-wide text-[#16213e]/50 font-mono">
            <th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">GST</th><th className="py-2 text-right">Amount</th>
          </tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-[#16213e]/10">
                <td className="py-2.5">{i.item_name}</td>
                <td className="py-2.5 text-right num">{formatNumber(i.qty)}</td>
                <td className="py-2.5 text-right num">{formatCurrency(i.rate)}</td>
                <td className="py-2.5 text-right num">{i.gst_percent}%</td>
                <td className="py-2.5 text-right num">{formatCurrency(i.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-[#16213e]/60">Subtotal</span><span className="num">{formatCurrency(voucher.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#16213e]/60">GST</span><span className="num">{formatCurrency(voucher.gst_amount)}</span></div>
            <div className="flex justify-between text-lg font-bold pt-1.5 border-t-2 border-[#16213e]/15"><span>Total</span><span className="num">{formatCurrency(voucher.total)}</span></div>
          </div>
        </div>
        {voucher.notes && <div className="mt-8 pt-4 border-t border-[#16213e]/15"><p className="text-[10px] uppercase tracking-[0.1em] text-[#16213e]/50 font-mono mb-1">Notes</p><p className="text-sm text-[#16213e]/70">{voucher.notes}</p></div>}
        <p className="text-center text-[10px] text-[#16213e]/40 mt-10">Generated by SmartERP</p>
      </div>
    </div>
  );
}
