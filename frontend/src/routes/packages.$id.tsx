import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Download, MoreVertical, Edit3, FileText, CheckCircle2 } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmModal } from "../components/Modal";
import { PACKAGES, SAMPLE_COVER_LETTER, formatMoney } from "../lib/mock-data";
import { useToast } from "../lib/toast";

export const Route = createFileRoute("/packages/$id")({
  head: ({ params }) => ({ meta: [{ title: `Package ${params.id} — OfferDraft` }] }),
  loader: ({ params }) => {
    const pkg = PACKAGES.find((p) => p.id === params.id);
    if (!pkg) throw notFound();
    return { pkg };
  },
  notFoundComponent: () => (
    <AppShell><div className="text-center py-20"><h2 className="serif text-2xl">Package not found</h2></div></AppShell>
  ),
  component: Detail,
});

function Detail() {
  const { pkg } = Route.useLoaderData();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [letter, setLetter] = useState(SAMPLE_COVER_LETTER);
  const [draft, setDraft] = useState(letter);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="min-w-0">
          <Link to="/packages" className="text-sm text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]">← All packages</Link>
          <h1 className="serif text-3xl mt-2">{pkg.address}</h1>
          <div className="mt-3 flex items-center gap-3">
            <StatusBadge status={pkg.status} />
            <span className="text-xs text-[var(--color-text-sec)] mono">{pkg.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => toast("success", "Download started")} className="btn-primary"><Download size={14} /> Download PDF</button>
          <div className="relative">
            <button onClick={() => setMenu(!menu)} className="btn-ghost !px-3"><MoreVertical size={16} /></button>
            {menu && (
              <div className="absolute right-0 mt-2 w-44 card py-1 z-10">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-accent-dim)]" onClick={() => setMenu(false)}>Edit package</button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-accent-dim)]" onClick={() => { setMenu(false); toast("success", "Package duplicated"); }}>Duplicate</button>
                <button className="w-full text-left px-4 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-accent-dim)]" onClick={() => { setMenu(false); setConfirm(true); }}>Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="label-xs">Offer Summary</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-5">
              <div className="col-span-2">
                <div className="label-xs">Offer Amount</div>
                <div className="mono text-3xl text-[var(--color-accent)] mt-1">{formatMoney(pkg.amount)}</div>
              </div>
              <div>
                <div className="label-xs">Listing Price</div>
                <div className="mono mt-1">{formatMoney(pkg.listingPrice)}</div>
              </div>
              <div>
                <div className="label-xs">Loan Type</div>
                <div className="mt-1">{pkg.loanType}</div>
              </div>
              <div>
                <div className="label-xs">Closing Date</div>
                <div className="mt-1">{pkg.closing}</div>
              </div>
              <div>
                <div className="label-xs">Earnest Money</div>
                <div className="mono mt-1">{formatMoney(pkg.earnest)}</div>
              </div>
              <div>
                <div className="label-xs">Down Payment</div>
                <div className="mono mt-1">{pkg.downPct}%</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="label-xs">Contingencies</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {pkg.contingencies.length === 0 ? (
                <span className="text-sm text-[var(--color-text-sec)]">None — no contingencies on this offer</span>
              ) : (
                pkg.contingencies.map((c) => (
                  <span key={c} className="text-xs px-3 py-1.5 rounded-sm border border-[var(--color-border)] text-[var(--color-text-pri)]">{c}</span>
                ))
              )}
            </div>
            <div className="mt-5">
              <div className="label-xs">Escalation Clause</div>
              <div className="text-sm mt-2 text-[var(--color-text-sec)]">Not included</div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="label-xs">Buyer Cover Letter</div>
              {!editing ? (
                <button onClick={() => { setDraft(letter); setEditing(true); }} className="btn-ghost !py-1.5 !px-3 text-xs"><Edit3 size={12} /> Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="btn-ghost !py-1.5 !px-3 text-xs">Cancel</button>
                  <button onClick={() => { setLetter(draft); setEditing(false); toast("success", "Cover letter saved"); }} className="btn-primary !py-1.5 !px-3 text-xs">Save changes</button>
                </div>
              )}
            </div>
            {editing ? (
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={18} className="input-base mt-4 !p-4 leading-relaxed" />
            ) : (
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed border border-[var(--color-border)] rounded-md p-4">{letter}</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="label-xs">Package Documents</div>
            <ul className="mt-3 space-y-3">
              {[
                { type: "Cover Page", name: "cover.pdf" },
                { type: "Cover Letter", name: "letter.pdf" },
                { type: "Pre-Approval", name: "chen_preapproval.pdf" },
              ].map((d) => (
                <li key={d.name} className="flex items-center gap-3">
                  <FileText size={14} className="text-[var(--color-accent)]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{d.name}</div>
                    <div className="text-xs text-[var(--color-text-sec)]">{d.type}</div>
                  </div>
                  <button className="text-xs text-[var(--color-accent)] hover:underline">Preview</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <div className="label-xs">Buyer Info</div>
            <div className="text-sm font-medium mt-3">{pkg.buyer}</div>
            <p className="text-sm text-[var(--color-text-sec)] mt-2 leading-relaxed">{pkg.story}</p>
          </div>

          <div className="card p-6">
            <div className="label-xs">Timeline</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-text-sec)]">Created</span><span>{pkg.created}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-sec)]">Last modified</span><span>{pkg.created}</span></div>
              {pkg.status === "Complete" && (
                <div className="flex justify-between"><span className="text-[var(--color-text-sec)]">Completed</span><span>{pkg.created}</span></div>
              )}
            </div>
          </div>

          <div className="card p-6 space-y-2">
            {pkg.status === "Draft" && (
              <button onClick={() => toast("success", "Package marked complete")} className="btn-primary w-full"><CheckCircle2 size={14} /> Mark as Complete</button>
            )}
            <button onClick={() => toast("success", "Package duplicated")} className="btn-ghost w-full">Duplicate Package</button>
            <button onClick={() => setConfirm(true)} className="btn-danger w-full justify-center">Delete</button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => toast("success", "Package deleted")}
        title="Delete this package?"
        description="This action cannot be undone. The PDF and all associated documents will be permanently removed."
      />
    </AppShell>
  );
}
