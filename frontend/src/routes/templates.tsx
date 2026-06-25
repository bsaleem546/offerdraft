import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Modal, ConfirmModal } from "../components/Modal";
import { TEMPLATES } from "../lib/mock-data";
import { useToast } from "../lib/toast";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Templates — OfferDraft" }] }),
  component: Templates,
});

function Templates() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [banner, setBanner] = useState(true);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <h1 className="serif text-3xl">Templates</h1>
        <button onClick={() => { setEditId(null); setOpen(true); }} className="btn-primary"><Plus size={14} /> New Template</button>
      </div>

      {banner && (
        <div className="relative rounded-md p-4 mb-6 text-sm" style={{ background: "var(--color-accent-dim)", border: "1px solid var(--color-accent)" }}>
          Templates save your default offer settings — contingencies, terms, and cover letter tone. Apply one when starting a new package to pre-fill Steps 1 and 2.
          <button onClick={() => setBanner(false)} className="absolute top-3 right-3 text-[var(--color-text-sec)]"><X size={14} /></button>
        </div>
      )}

      <div className="text-sm text-[var(--color-text-sec)] mb-4">
        You're using <strong className="text-[var(--color-text-pri)]">2 of 3</strong> templates included in your Solo plan.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="card p-6 flex flex-col">
            <div className="font-semibold">{t.name}</div>
            <div className="text-xs text-[var(--color-text-sec)] mt-2 flex-1">{t.tags}</div>
            <div className="label-xs mt-4">Last used · {t.lastUsed}</div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => toast("success", `Template "${t.name}" applied`)} className="btn-primary !py-1.5 !px-3 text-xs">Use Template</button>
              <button onClick={() => { setEditId(t.id); setOpen(true); }} className="btn-ghost !py-1.5 !px-3 text-xs">Edit</button>
              <button onClick={() => setConfirm(t.id)} className="text-xs text-[var(--color-danger)] hover:underline ml-auto">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? "Edit template" : "New template"} maxWidth={560}>
        <div className="space-y-4">
          <div>
            <label className="label-xs">Template Name</label>
            <input className="input-base mt-2" defaultValue={editId ? TEMPLATES.find((t) => t.id === editId)?.name : ""} placeholder="e.g. Standard Conventional" />
          </div>
          <div>
            <label className="label-xs">Default Contingencies</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {["Inspection","Financing","Appraisal","Sale of Home"].map((c) => (
                <label key={c} className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] rounded-md text-sm">
                  <input type="checkbox" defaultChecked={c !== "Sale of Home"} className="accent-[var(--color-accent)]" />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Loan Type</label>
              <select className="input-base mt-2"><option>Conventional</option><option>FHA</option><option>VA</option><option>Cash</option></select>
            </div>
            <div>
              <label className="label-xs">Closing Window</label>
              <select className="input-base mt-2"><option>30 days</option><option>14 days</option><option>21 days</option><option>45 days</option><option>60 days</option></select>
            </div>
          </div>
          <div>
            <label className="label-xs">Cover Letter Tone</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {["Professional","Warm & Personal","Highly Competitive"].map((t, i) => (
                <label key={t} className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] rounded-md text-xs cursor-pointer">
                  <input type="radio" name="tpl-tone" defaultChecked={i === 0} className="accent-[var(--color-accent)]" />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label-xs">Default Additional Terms</label>
            <textarea rows={3} className="input-base mt-2" placeholder="Optional" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
          <button onClick={() => { setOpen(false); toast("success", editId ? "Template updated" : "Template created"); }} className="btn-primary">Save</button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => toast("success", "Template deleted")}
        title="Delete this template?"
        description="Existing packages that used this template will not be affected."
      />
    </AppShell>
  );
}
