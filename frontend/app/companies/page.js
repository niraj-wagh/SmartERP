"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Pencil, Trash2, Sparkles, Building2, LogOut } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/lib/AuthProvider";
import { useCompany } from "@/lib/CompanyProvider";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner, EmptyState, Badge } from "@/components/ui/Misc";
import Modal from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Field";
import { currentFinancialYear } from "@/lib/format";

const INDIAN_STATES = ["Andhra Pradesh","Bihar","Delhi","Gujarat","Haryana","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Punjab","Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal","Other"];

function emptyForm() {
  return { name:"", address:"", gst_number:"", financial_year: currentFinancialYear(), state:"Maharashtra", contact:"" };
}

export default function CompaniesPage() {
  return <AuthGuard><CompaniesScreen /></AuthGuard>;
}

function CompaniesScreen() {
  const { signOut } = useAuth();
  const { companies, loading, refresh, selectCompany } = useCompany();
  const toast = useToast();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  function openCreate() { setEditing(null); setForm(emptyForm()); setModalOpen(true); }
  function openEdit(c) {
    setEditing(c);
    setForm({ name:c.name||"", address:c.address||"", gst_number:c.gst_number||"",
      financial_year:c.financial_year||currentFinancialYear(), state:c.state||"Maharashtra", contact:c.contact||"" });
    setModalOpen(true);
  }

  /* Enter company → store in localStorage + context → go to dashboard */
  function enter(c) {
    selectCompany(c.id);
    router.push("/dashboard");
  }

  async function onSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Company name is required.");
    setSaving(true);
    try {
      if (editing) {
        await api.companies.update(editing.id, form);
        toast.success("Company updated.");
        setModalOpen(false);
        refresh();
      } else {
        // Create then auto-enter so the user lands on the dashboard immediately
        const newCompany = await api.companies.create(form);
        toast.success(`"${newCompany.name}" created — entering now…`);
        setModalOpen(false);
        await refresh();               // reload list
        selectCompany(newCompany.id);  // set active company in context + localStorage
        router.push("/dashboard");     // ← THIS is the missing piece
      }
    } catch (err) {
      toast.error(err.message);
    }
    setSaving(false);
  }

  async function onDelete(c) {
    if (!confirm(`Delete "${c.name}"? All ledgers, stock and vouchers will be removed.`)) return;
    setDeletingId(c.id);
    try { await api.companies.delete(c.id); toast.success("Company deleted."); refresh(); }
    catch (err) { toast.error(err.message); }
    setDeletingId(null);
  }

  return (
    <div className="min-h-screen bg-ink">
      <header className="h-14 border-b border-hair flex items-center px-6 justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-signal/15 border border-signal/40 flex items-center justify-center">
            <Sparkles size={14} className="text-signal" />
          </div>
          <span className="font-display font-semibold text-paper">SmartERP</span>
        </div>
        <Button variant="ghost" size="sm" icon={LogOut} onClick={signOut}>Log out</Button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-3">Company selection</p>
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-semibold text-paper">Choose a company</h1>
            <p className="text-paper-faint text-sm mt-1.5">
              Each account can manage up to 5 companies. Creating a new one takes you straight inside.
            </p>
          </div>
          <Button icon={Plus} onClick={openCreate} disabled={companies.length >= 5}>
            Create company
          </Button>
        </div>

        {loading ? (
          <Spinner label="Loading your companies…" />
        ) : companies.length === 0 ? (
          <Card>
            <EmptyState
              icon={Building2}
              title="No companies yet"
              description="Create your first company — you'll land straight on the dashboard."
              action={<Button icon={Plus} onClick={openCreate}>Create your first company</Button>}
            />
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {companies.map((c) => (
              <Card key={c.id} className="p-5 flex flex-col fade-in">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-panel-2 border border-hair flex items-center justify-center font-display font-semibold text-signal">
                    {c.name.slice(0,1).toUpperCase()}
                  </div>
                  <Badge tone={c.role==="owner"?"amber":"default"}>{c.role}</Badge>
                </div>
                <h3 className="font-display font-semibold text-paper">{c.name}</h3>
                <p className="text-xs text-paper-faint mt-0.5">{c.state||"—"} · FY {c.financial_year||"—"}</p>
                {c.gst_number && <p className="text-[11px] font-mono text-paper-faint mt-1">GSTIN {c.gst_number}</p>}
                <div className="flex items-center gap-2 mt-5">
                  <Button size="sm" icon={ArrowRight} onClick={() => enter(c)} className="flex-1">Enter</Button>
                  <Button size="sm" variant="outline" icon={Pencil} onClick={() => openEdit(c)} />
                  {c.role==="owner" && (
                    <Button size="sm" variant="danger" icon={Trash2} loading={deletingId===c.id} onClick={() => onDelete(c)} />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Modal
        open={modalOpen} onClose={() => setModalOpen(false)}
        eyebrow={editing?"Alter company":"Create company"}
        title={editing?`Edit ${editing.name}`:"New company"}
        footer={<>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={onSave}>
            {editing?"Save changes":"Create & enter →"}
          </Button>
        </>}
      >
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <Label required>Company name</Label>
            <Input required autoFocus value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} placeholder="e.g. Ravi Traders Pvt Ltd" />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm({...form,address:e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>GST number</Label>
              <Input value={form.gst_number} onChange={(e) => setForm({...form,gst_number:e.target.value})} placeholder="27ABCDE1234F1Z5" />
            </div>
            <div>
              <Label>Financial year</Label>
              <Input value={form.financial_year} onChange={(e) => setForm({...form,financial_year:e.target.value})} placeholder="2025-26" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>State</Label>
              <Select value={form.state} onChange={(e) => setForm({...form,state:e.target.value})}>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </div>
            <div>
              <Label>Contact</Label>
              <Input value={form.contact} onChange={(e) => setForm({...form,contact:e.target.value})} />
            </div>
          </div>
          {!editing && (
            <p className="text-xs text-paper-faint border border-hair/50 rounded-md px-3 py-2 bg-panel-2">
              After creating, you'll be taken straight into the dashboard for this company.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
