"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { usePageShortcuts } from "@/lib/ShortcutContext";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Misc";
import VoucherItemsEditor from "@/components/vouchers/VoucherItemsEditor";
import { todayISO } from "@/lib/format";

export default function NewSalesVoucherPage() {
  const { activeCompany } = useCompany();
  const router = useRouter();
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [voucherDate, setVoucherDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!activeCompany) return;
    Promise.all([api.customers.list(activeCompany.id), api.stockItems.list(activeCompany.id)])
      .then(([c, s]) => { setCustomers(c||[]); setStockItems(s||[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeCompany]);

  async function onSave(e) {
    e?.preventDefault();
    if (!customerId) return toast.error("Select a customer first.");
    if (!items.length) return toast.error("Add at least one item.");
    const overStock = items.some((i) => i.availableQty !== undefined && Number(i.qty) > Number(i.availableQty));
    if (overStock) return toast.error("One or more items exceed available stock.");
    setSaving(true);
    try {
      const result = await api.sales.create(activeCompany.id, {
        customer_id: customerId, voucher_date: voucherDate, notes,
        items: items.map((i) => ({ stock_item_id: i.stock_item_id, item_name: i.item_name, qty: Number(i.qty), rate: Number(i.rate), gst_percent: Number(i.gst_percent) })),
      });
      toast.success("Invoice created. Stock and customer balance updated.");
      router.push(`/dashboard/vouchers/sales/${result.id}`);
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  }

  usePageShortcuts([{ combo: "ctrl+s", display: "Ctrl S", label: "Save voucher", action: onSave }], [customerId, voucherDate, notes, items, activeCompany]);

  if (loading) return <Spinner label="Loading customers and stock…" />;

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-paper-faint hover:text-paper"><ArrowLeft size={14}/> Back</button>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">New voucher</p>
        <h1 className="font-display text-2xl font-semibold text-paper">Sales / Customer Bill</h1>
        <p className="text-paper-faint text-sm mt-1">Invoice number is generated automatically. Stock decreases on save.</p>
      </div>
      <Card>
        <CardHeader eyebrow="Details" title="Bill to" />
        <CardBody className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label required>Customer</Label>
            <Select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select a customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            {!customers.length && <p className="text-[11px] text-paper-faint mt-1.5">Create a customer under Masters first.</p>}
          </div>
          <div><Label required>Voucher date</Label><Input type="date" required value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional remarks" /></div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader eyebrow="Line items" title="Items billed" />
        <CardBody><VoucherItemsEditor stockItems={stockItems} priceField="selling_price" items={items} onChange={setItems} /></CardBody>
      </Card>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button icon={Save} shortcut="Ctrl S" loading={saving} onClick={onSave}>Save invoice</Button>
      </div>
    </div>
  );
}
