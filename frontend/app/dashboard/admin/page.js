"use client";
import { useEffect, useState, useCallback } from "react";
import { Building2, Users, History, UserPlus, Trash2, ShieldCheck } from "lucide-react";
import { useCompany } from "@/lib/CompanyProvider";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Spinner, Badge, EmptyState } from "@/components/ui/Misc";
import Button from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/format";

const TABS = [
  { key:"profile", label:"Company profile", icon:Building2 },
  { key:"team", label:"Team members", icon:Users },
  { key:"activity", label:"Activity", icon:History },
];

export default function AdminPage() {
  const { activeCompany, refresh } = useCompany();
  const toast = useToast();
  const [tab, setTab] = useState("profile");
  const isManager = activeCompany?.role==="owner"||activeCompany?.role==="admin";

  // Profile
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (activeCompany) setForm({ name:activeCompany.name||"", address:activeCompany.address||"", gst_number:activeCompany.gst_number||"", financial_year:activeCompany.financial_year||"", state:activeCompany.state||"", contact:activeCompany.contact||"" });
  }, [activeCompany]);

  async function saveProfile(e) {
    e.preventDefault(); setSaving(true);
    try { await api.companies.update(activeCompany.id, form); toast.success("Company profile updated."); refresh(); }
    catch (err) { toast.error(err.message); }
    setSaving(false);
  }

  // Team
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("operator");
  const [inviting, setInviting] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!activeCompany) return;
    setLoadingMembers(true);
    try { setMembers(await api.companies.members.list(activeCompany.id)); } catch {}
    setLoadingMembers(false);
  }, [activeCompany]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  async function onInvite(e) {
    e.preventDefault(); setInviting(true);
    try { await api.companies.members.add(activeCompany.id, { email: inviteEmail.trim(), role: inviteRole }); toast.success("Member added."); setInviteEmail(""); loadMembers(); }
    catch (err) { toast.error(err.message); }
    setInviting(false);
  }
  async function onRoleChange(mid, role) {
    try { await api.companies.members.updateRole(activeCompany.id, mid, role); loadMembers(); }
    catch (err) { toast.error(err.message); }
  }
  async function onRemove(m) {
    if (!confirm(`Remove ${m.profile?.email||"this user"}?`)) return;
    try { await api.companies.members.remove(activeCompany.id, m.id); toast.success("Removed."); loadMembers(); }
    catch (err) { toast.error(err.message); }
  }

  // Audit logs
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  useEffect(() => {
    if (!activeCompany||tab!=="activity") return;
    setLoadingLogs(true);
    api.companies.auditLogs(activeCompany.id).then((d) => { setLogs(d||[]); setLoadingLogs(false); }).catch(() => setLoadingLogs(false));
  }, [activeCompany, tab]);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal mb-1.5">Administration</p>
        <h1 className="font-display text-2xl font-semibold text-paper">Manage {activeCompany?.name}</h1>
        <p className="text-paper-faint text-sm mt-1">Company profile, team access and audit log.</p>
      </div>
      <div className="flex gap-1.5 border-b border-hair">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("flex items-center gap-1.5 px-3.5 py-2.5 text-sm border-b-2 -mb-px transition-colors", tab===t.key?"border-signal text-signal":"border-transparent text-paper-faint hover:text-paper")}>
            <t.icon size={14}/> {t.label}
          </button>
        ))}
      </div>

      {tab==="profile" && form && (
        <Card><CardHeader eyebrow="Company information" title="Profile" />
          <CardBody>
            <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label required>Company name</Label><Input required disabled={!isManager} value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} /></div>
              <div className="sm:col-span-2"><Label>Address</Label><Input disabled={!isManager} value={form.address} onChange={(e) => setForm({...form,address:e.target.value})} /></div>
              <div><Label>GST number</Label><Input disabled={!isManager} value={form.gst_number} onChange={(e) => setForm({...form,gst_number:e.target.value})} /></div>
              <div><Label>Financial year</Label><Input disabled={!isManager} value={form.financial_year} onChange={(e) => setForm({...form,financial_year:e.target.value})} /></div>
              <div><Label>State</Label><Input disabled={!isManager} value={form.state} onChange={(e) => setForm({...form,state:e.target.value})} /></div>
              <div><Label>Contact</Label><Input disabled={!isManager} value={form.contact} onChange={(e) => setForm({...form,contact:e.target.value})} /></div>
              {isManager ? <div className="sm:col-span-2"><Button type="submit" loading={saving}>Save changes</Button></div>
                : <p className="sm:col-span-2 text-xs text-paper-faint">Only an owner or admin can edit company details.</p>}
            </form>
          </CardBody>
        </Card>
      )}

      {tab==="team" && (
        <div className="space-y-6">
          {isManager && (
            <Card><CardHeader eyebrow="Grant access" title="Add a team member" />
              <CardBody>
                <form onSubmit={onInvite} className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[220px]"><Label>Email (must have a SmartERP account)</Label><Input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@business.com" /></div>
                  <div className="w-40"><Label>Role</Label><Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}><option value="admin">Admin</option><option value="operator">Operator</option><option value="viewer">Viewer</option></Select></div>
                  <Button type="submit" icon={UserPlus} loading={inviting}>Add member</Button>
                </form>
              </CardBody>
            </Card>
          )}
          <Card><CardHeader eyebrow={`${members.length} member(s)`} title="Team" />
            <CardBody className="!p-0">
              {loadingMembers ? <Spinner /> : !members.length ? <EmptyState icon={Users} title="No team members" /> : (
                <ul className="divide-y divide-hair-soft">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between px-5 py-3">
                      <div><p className="text-sm text-paper">{m.profile?.full_name||m.profile?.email}</p><p className="text-xs text-paper-faint">{m.profile?.email}</p></div>
                      <div className="flex items-center gap-2">
                        {isManager&&m.role!=="owner" ? (
                          <Select value={m.role} onChange={(e) => onRoleChange(m.id,e.target.value)} className="!w-32 !py-1">
                            <option value="admin">Admin</option><option value="operator">Operator</option><option value="viewer">Viewer</option>
                          </Select>
                        ) : <Badge tone="amber">{m.role}</Badge>}
                        {isManager&&m.role!=="owner" && <button onClick={() => onRemove(m)} className="p-1.5 rounded-md hover:bg-panel-2 text-paper-faint hover:text-red"><Trash2 size={13}/></button>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {tab==="activity" && (
        <Card><CardHeader eyebrow="Audit log" title="Recent activity" />
          <CardBody className="!p-0">
            {loadingLogs ? <Spinner /> : !logs.length ? <EmptyState icon={History} title="No activity yet" description="Vouchers you create will appear here." /> : (
              <ul className="divide-y divide-hair-soft">
                {logs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2.5"><ShieldCheck size={13} className="text-paper-faint"/><span className="text-sm text-paper-dim">{l.description}</span></div>
                    <span className="text-[11px] text-paper-faint font-mono">{formatDateTime(l.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
