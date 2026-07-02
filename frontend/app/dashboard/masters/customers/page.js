"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { usePageShortcuts } from "@/lib/ShortcutContext";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Misc";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input, Label, Textarea } from "@/components/ui/Field";
import DataTable from "@/components/ui/DataTable";
import { formatCurrency } from "@/lib/format";

function emptyForm() { return { name: "", mobile: "", address: "", gstin: "", opening_balance: 0 }; }

export default function CustomersPage() {
  const { activeCompany } = useCompany();
  const toast = useToast();
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    try { setRows(await api.customers.list(activeCompany.id)); } catch {}
    setLoading(false);
  }, [activeCompany]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(emptyForm()); setModalOpen(true); }

  usePageShortcuts([
    { combo: "ctrl+n", display: "Ctrl N", label: "New customer", action: openCreate },
    { combo: "alt+l", display: "Alt L", label: "Create ledger", action: openCreate },
  ], [activeCompany]);

  function openEdit(row) {
    setEditing(row);
    setForm({ name: row.name||"", mobile: row.mobile||"", address: row.address||"", gstin: row.gstin||"", opening_balance: row.opening_balance||0 });
    setModalOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    if (!form.name) return toast.error("Name is required.");
    setSaving(true);
    try {
      if (editing) { await api.customers.update(activeCompany.id, editing.id, { name: form.name, mobile: form.mobile, address: form.address, gstin: form.gstin }); toast.success("Customer updated."); }
      else { await api.customers.create(activeCompany.id, { ...form, opening_balance: Number(form.opening_balance) }); toast.success("Customer created."); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  }

  async function onDelete(row) {
    if (!confirm(`Delete customer "${row.name}"?`)) return;
    try { await api.customers.delete(activeCompany.id, row.id); toast.success("Deleted."); load(); }
    catch (err) { toast.error(err.message); }
  }

  const columns = useMemo(() => [
    { accessorKey: "name", header: "Customer", cell: (i) => <span className="font-medium text-paper">{i.getValue()}</span> },
    { accessorKey: "mobile", header: "Mobile", cell: (i) => i.getValue()||"—" },
    { accessorKey: "gstin", header: "GSTIN", cell: (i) => <span className="num text-xs">{i.getValue()||"—"}</span> },
    { accessorKey: "outstanding_balance", header: "Outstanding", cell: (i) => { const v=Number(i.getValue()||0); return <span className={"num "+(v>0?"text-red":"text-green")}>{formatCurrency(v)}</span>; } },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => (
      <div className="flex justify-end gap-1.5">
        <button onClick={() => router.push(`/dashboard/reports/customer-statement?customer=${row.original.id}`)} className="p-1.5 rounded-md hover:bg-panel-2 text-paper-faint hover:text-blue"><FileText size={13} /></button>
        <button onClick={() => openEdit(row.original)} className="p-1.5 rounded-md hover:bg-panel-2 text-paper-faint hover:text-signal"><Pencil size={13} /></button>
        <button onClick={() => onDelete(row.original)} className="p-1.5 rounded-md hover:bg-panel-2 text-paper-faint hover:text-red"><Trash2 size={13} /></button>
      </div>
    )},
  ], [router]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Masters</p>
          <h1 className="font-display text-2xl font-semibold text-paper">Customer Ledgers</h1>
          <p className="text-paper-faint text-sm mt-1">Every party you bill against — name, contact and running balance.</p>
        </div>
        <Button icon={Plus} onClick={openCreate} shortcut="Ctrl N">New customer</Button>
      </div>
      <Card>{loading ? <Spinner /> : <DataTable columns={columns} data={rows} emptyTitle="No customer ledgers yet" emptyDescription="Add your first customer to start billing." />}</Card>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} eyebrow={editing?"Alter ledger":"Create ledger"} title={editing?`Edit ${editing.name}`:"New customer"}
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button loading={saving} onClick={onSave}>{editing?"Save changes":"Create customer"}</Button></>}>
        <form onSubmit={onSave} className="space-y-4">
          <div><Label required>Name</Label><Input required autoFocus value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Mobile</Label><Input value={form.mobile} onChange={(e) => setForm({...form,mobile:e.target.value})} /></div>
            <div><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({...form,gstin:e.target.value})} /></div>
          </div>
          <div><Label>Address</Label><Textarea rows={2} value={form.address} onChange={(e) => setForm({...form,address:e.target.value})} /></div>
          {!editing && <div><Label hint="₹">Opening balance (receivable)</Label><Input type="number" step="0.01" value={form.opening_balance} onChange={(e) => setForm({...form,opening_balance:e.target.value})} /></div>}
        </form>
      </Modal>
    </div>
  );
}
