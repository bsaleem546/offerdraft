import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Modal, ConfirmModal } from "../components/Modal";
import { useToast } from "../lib/toast";
import { requireAuth } from "../lib/guards";
import { templates as tplApi, type Template } from "../lib/api";

export const Route = createFileRoute("/templates")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Templates — OfferDraft" }] }),
  component: Templates,
});

const TONE_OPTIONS = [
  { label: "Professional", value: "professional" },
  { label: "Warm & Personal", value: "warm" },
  { label: "Highly Competitive", value: "competitive" },
];
const CLOSING_OPTIONS = ["14", "21", "30", "45", "60"];
const CONTINGENCY_OPTIONS = ["Inspection", "Financing", "Appraisal", "Sale of Home"];
const LOAN_OPTIONS = ["Conventional", "FHA", "VA", "Cash"];

interface FormState {
  name: string;
  loan_type: string;
  closing_days: string;
  contingencies: string[];
  cover_letter_tone: string;
  default_terms: string;
}

const defaultForm = (): FormState => ({
  name: "",
  loan_type: "Conventional",
  closing_days: "30",
  contingencies: ["Inspection", "Financing"],
  cover_letter_tone: "professional",
  default_terms: "",
});

function Templates() {
  const { toast } = useToast();
  const [list, setList] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [banner, setBanner] = useState(true);

  const load = () => {
    setLoading(true);
    tplApi.list()
      .then(setList)
      .catch(() => toast("error", "Failed to load templates"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(null); setForm(defaultForm()); setOpen(true); };
  const openEdit = (t: Template) => {
    setEditId(t.id);
    setForm({
      name: t.name,
      loan_type: t.loan_type,
      closing_days: String(t.closing_days),
      contingencies: t.contingencies ?? [],
      cover_letter_tone: t.cover_letter_tone,
      default_terms: t.default_terms ?? "",
    });
    setOpen(true);
  };

  const toggleContingency = (c: string) => setForm((f) => ({
    ...f,
    contingencies: f.contingencies.includes(c) ? f.contingencies.filter((x) => x !== c) : [...f.contingencies, c],
  }));

  const save = () => {
    setSaving(true);
    const payload = { ...form, closing_days: Number(form.closing_days) };
    const action = editId ? tplApi.update(editId, payload) : tplApi.create(payload);
    action
      .then(() => { setOpen(false); toast("success", editId ? "Template updated" : "Template created"); load(); })
      .catch((err: Error) => toast("error", err.message))
      .finally(() => setSaving(false));
  };

  const deleteTpl = (id: string) => {
    tplApi.delete(id)
      .then(() => { toast("success", "Template deleted"); load(); })
      .catch(() => toast("error", "Failed to delete template"));
    setConfirm(null);
  };

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never";

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <h1 className="serif text-3xl">Templates</h1>
        <button onClick={openNew} className="btn-primary"><Plus size={14} /> New Template</button>
      </div>

      {banner && (
        <div className="relative rounded-md p-4 mb-6 text-sm" style={{ background: "var(--color-accent-dim)", border: "1px solid var(--color-accent)" }}>
          Templates save your default offer settings — contingencies, terms, and cover letter tone. Apply one when starting a new package to pre-fill offer details.
          <button onClick={() => setBanner(false)} className="absolute top-3 right-3 text-[var(--color-text-sec)]"><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-[var(--color-accent)]" /></div>
      ) : list.length === 0 ? (
        <div className="card py-20 text-center">
          <h3 className="serif text-2xl">No templates yet</h3>
          <p className="text-sm text-[var(--color-text-sec)] mt-2">Create a template to reuse common offer settings.</p>
          <button onClick={openNew} className="btn-primary inline-flex mt-6"><Plus size={14} /> New Template</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((t) => (
            <div key={t.id} className="card p-6 flex flex-col">
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-[var(--color-text-sec)] mt-2 flex-1 space-y-1">
                <div>{t.loan_type} · {t.closing_days} day close</div>
                <div className="capitalize">{TONE_OPTIONS.find((o) => o.value === t.cover_letter_tone)?.label ?? t.cover_letter_tone} tone</div>
                {t.contingencies?.length > 0 && <div>{t.contingencies.join(", ")}</div>}
              </div>
              <div className="label-xs mt-4">Last used · {fmtDate(t.last_used_at)}</div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => toast("success", `Template "${t.name}" applied`)} className="btn-primary !py-1.5 !px-3 text-xs">Use Template</button>
                <button onClick={() => openEdit(t)} className="btn-ghost !py-1.5 !px-3 text-xs">Edit</button>
                <button onClick={() => setConfirm(t.id)} className="text-xs text-[var(--color-danger)] hover:underline ml-auto">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit template" : "New template"} maxWidth={560}>
        <div className="space-y-4">
          <div>
            <label className="label-xs">Template Name</label>
            <input className="input-base mt-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Standard Conventional" />
          </div>
          <div>
            <label className="label-xs">Default Contingencies</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {CONTINGENCY_OPTIONS.map((c) => (
                <label key={c} className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] rounded-md text-sm cursor-pointer">
                  <input type="checkbox" checked={form.contingencies.includes(c)} onChange={() => toggleContingency(c)} className="accent-[var(--color-accent)]" />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Loan Type</label>
              <select className="input-base mt-2" value={form.loan_type} onChange={(e) => setForm({ ...form, loan_type: e.target.value })}>
                {LOAN_OPTIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs">Closing Window (days)</label>
              <select className="input-base mt-2" value={form.closing_days} onChange={(e) => setForm({ ...form, closing_days: e.target.value })}>
                {CLOSING_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label-xs">Cover Letter Tone</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {TONE_OPTIONS.map((o) => (
                <label key={o.value} className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] rounded-md text-xs cursor-pointer">
                  <input type="radio" name="tpl-tone" checked={form.cover_letter_tone === o.value} onChange={() => setForm({ ...form, cover_letter_tone: o.value })} className="accent-[var(--color-accent)]" />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label-xs">Default Additional Terms</label>
            <textarea rows={3} className="input-base mt-2" value={form.default_terms} onChange={(e) => setForm({ ...form, default_terms: e.target.value })} placeholder="Optional" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving || !form.name} className="btn-primary disabled:opacity-40">
            {saving ? <Loader2 size={14} className="animate-spin" /> : (editId ? "Save changes" : "Create template")}
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && deleteTpl(confirm)}
        title="Delete this template?"
        description="Existing packages that used this template will not be affected."
      />
    </AppShell>
  );
}
