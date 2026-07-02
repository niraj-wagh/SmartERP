"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { usePageShortcuts } from "@/lib/ShortcutContext";
import { Card } from "@/components/ui/Card";
import { Spinner, Badge } from "@/components/ui/Misc";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Field";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency, formatNumber } from "@/lib/format";

const UNITS = ["PCS","KG","BOX","LTR","MTR","DOZ","SET"];
const GST_RATES = [0,5,12,18,28];
function emptyForm() { return { name:"",sku:"",unit:"PCS",purchase_price:0,selling_price:0,quantity:0,gst_percent:18,reorder_level:5 }; }

export default function StockItemsPage() {
  const { activeCompany } = useCompany();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try { setRows(await api.stockItems.list(activeCompany.id)); } catch {}
    setLoading(false);
  }, [activeCompany]);

  useEffect(() => { load(); }, [load]);
  function openCreate() { setEditing(null); setForm(emptyForm()); setModalOpen(true); }
  usePageShortcuts([{ combo: "ctrl+n", display: "Ctrl N", label: "New stock item", action: openCreate }], [activeCompany]);

  function openEdit(row) {
    setEditing(row);
    setForm({ name:row.name||"",sku:row.sku||"",unit:row.unit||"PCS",purchase_price:row.purchase_price||0,selling_price:row.selling_price||0,quantity:row.quantity||0,gst_percent:row.gst_percent??18,reorder_level:row.reorder_level??5 });
    setModalOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    if (!form.name) return toast.error("Item name is required.");
    setSaving(true);
    try {
      const payload = { ...form, purchase_price:Number(form.purchase_price),selling_price:Number(form.selling_price),quantity:Number(form.quantity),gst_percent:Number(form.gst_percent),reorder_level:Number(form.reorder_level) };
      if (editing) { await api.stockItems.update(activeCompany.id, editing.id, payload); toast.success("Item updated."); }
      else { await api.stockItems.create(activeCompany.id, payload); toast.success("Item created."); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  }

  async function onDelete(row) {
    if (!confirm(`Delete stock item "${row.name}"?`)) return;
    try { await api.stockItems.delete(activeCompany.id, row.id); toast.success("Deleted."); load(); }
    catch (err) { toast.error(err.message); }
  }

  const columns = useMemo(() => [
    { accessorKey: "name", header: "Item", cell: (i) => <span className="font-medium text-paper">{i.getValue()}</span> },
    { accessorKey: "sku", header: "SKU", cell: (i) => <span className="num text-xs">{i.getValue()||"—"}</span> },
    { accessorKey: "quantity", header: "Qty", cell: ({ row }) => {
      const low = Number(row.original.quantity) <= Number(row.original.reorder_level||0);
      return <span className={"num flex items-center gap-1.5 "+(low?"text-red":"text-paper")}>{low&&<AlertTriangle size={11}/>}{formatNumber(row.original.quantity)} {row.original.unit}</span>;
    }},
    { accessorKey: "purchase_price", header: "Purchase ₹", cell: (i) => <span className="num text-paper-dim">{formatCurrency(i.getValue())}</span> },
    { accessorKey: "selling_price", header: "Selling ₹", cell: (i) => <span className="num">{formatCurrency(i.getValue())}</span> },
    { accessorKey: "gst_percent", header: "GST", cell: (i) => <Badge tone="blue">{i.getValue()}%</Badge> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => (
      <div className="flex justify-end gap-1.5">
        <button onClick={() => openEdit(row.original)} className="p-1.5 rounded-md hover:bg-panel-2 text-paper-faint hover:text-signal"><Pencil size={13}/></button>
        <button onClick={() => onDelete(row.original)} className="p-1.5 rounded-md hover:bg-panel-2 text-paper-faint hover:text-red"><Trash2 size={13}/></button>
      </div>
    )},
  ], []);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Masters</p>
          <h1 className="font-display text-2xl font-semibold text-paper">Stock Items</h1>
          <p className="text-paper-faint text-sm mt-1">Your inventory master — price, quantity and GST rate per item.</p>
        </div>
        <Button icon={Plus} onClick={openCreate} shortcut="Ctrl N">New item</Button>
      </div>
      <Card>{loading ? <Spinner /> : <DataTable columns={columns} data={rows} emptyTitle="No stock items yet" emptyDescription="Add the items you stock so vouchers can pull live price and quantity." />}</Card>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} eyebrow={editing?"Alter item":"Create item"} title={editing?`Edit ${editing.name}`:"New stock item"}
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button loading={saving} onClick={onSave}>{editing?"Save changes":"Create item"}</Button></>}>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label required>Item name</Label><Input required autoFocus value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} /></div>
            <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({...form,sku:e.target.value})} /></div>
            <div><Label>Unit</Label><Select value={form.unit} onChange={(e) => setForm({...form,unit:e.target.value})}>{UNITS.map((u) => <option key={u}>{u}</option>)}</Select></div>
            <div><Label hint="₹">Purchase price</Label><Input type="number" step="0.01" value={form.purchase_price} onChange={(e) => setForm({...form,purchase_price:e.target.value})} /></div>
            <div><Label hint="₹">Selling price</Label><Input type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({...form,selling_price:e.target.value})} /></div>
            <div><Label>GST %</Label><Select value={form.gst_percent} onChange={(e) => setForm({...form,gst_percent:e.target.value})}>{GST_RATES.map((g) => <option key={g} value={g}>{g}%</option>)}</Select></div>
            <div><Label>Reorder level</Label><Input type="number" step="1" value={form.reorder_level} onChange={(e) => setForm({...form,reorder_level:e.target.value})} /></div>
            <div className="col-span-2"><Label>Opening quantity</Label><Input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({...form,quantity:e.target.value})} /></div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
