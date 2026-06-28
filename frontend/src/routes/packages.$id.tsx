import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, MoreVertical, Edit3, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmModal } from "../components/Modal";
import { useToast } from "../lib/toast";
import { requireAuth } from "../lib/guards";
import { packages as pkgApi, type Package } from "../lib/api";

export const Route = createFileRoute("/packages/$id")({
  beforeLoad: requireAuth,
  head: ({ params }) => ({ meta: [{ title: `Package — OfferDraft` }] }),
  component: Detail,
});

function fmt(n: number) { return `$${n.toLocaleString("en-US")}`; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function Detail() {
  const { id } = Route.useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [savingLetter, setSavingLetter] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    pkgApi.getById(id)
      .then((p) => { setPkg(p); setDraft(p.cover_letter_text); })
      .catch(() => { toast("error", "Package not found"); navigate({ to: "/packages" }); })
      .finally(() => setLoading(false));
  }, [id]);

  const saveLetter = () => {
    if (!pkg) return;
    setSavingLetter(true);
    pkgApi.updateCoverLetter(pkg.id, draft)
      .then((p) => { setPkg(p); setEditing(false); toast("success", "Cover letter saved"); })
      .catch(() => toast("error", "Failed to save cover letter"))
      .finally(() => setSavingLetter(false));
  };

  const markComplete = () => {
    if (!pkg) return;
    pkgApi.markComplete(pkg.id)
      .then((p) => { setPkg(p); toast("success", "Package marked complete"); })
      .catch(() => toast("error", "Failed to mark complete"));
  };

  const duplicate = () => {
    if (!pkg) return;
    pkgApi.duplicate(pkg.id)
      .then((p) => { toast("success", "Package duplicated"); navigate({ to: "/packages/$id", params: { id: p.id } }); })
      .catch(() => toast("error", "Failed to duplicate"));
    setMenu(false);
  };

  const deletePkg = () => {
    if (!pkg) return;
    pkgApi.delete(pkg.id)
      .then(() => { toast("success", "Package deleted"); navigate({ to: "/packages" }); })
      .catch(() => toast("error", "Failed to delete package"));
    setConfirm(false);
  };

  if (loading) {
    return <AppShell><div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-[var(--color-accent)]" /></div></AppShell>;
  }

  if (!pkg) return null;

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-6 mb-8">
        <div className="min-w-0">
          <Link to="/packages" className="text-sm text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]">← All packages</Link>
          <h1 className="serif text-3xl mt-2">{pkg.property_address}</h1>
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
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-accent-dim)]" onClick={duplicate}>Duplicate</button>
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
                <div className="mono text-3xl text-[var(--color-accent)] mt-1">{fmt(pkg.offer_amount)}</div>
              </div>
              {pkg.listing_price != null && (
                <div>
                  <div className="label-xs">Listing Price</div>
                  <div className="mono mt-1">{fmt(pkg.listing_price)}</div>
                </div>
              )}
              <div><div className="label-xs">Loan Type</div><div className="mt-1">{pkg.loan_type || "—"}</div></div>
              <div><div className="label-xs">Closing Date</div><div className="mt-1">{pkg.closing_date || "—"}</div></div>
              {pkg.earnest_money != null && (
                <div><div className="label-xs">Earnest Money</div><div className="mono mt-1">{fmt(pkg.earnest_money)}</div></div>
              )}
              {pkg.down_payment_pct != null && (
                <div><div className="label-xs">Down Payment</div><div className="mono mt-1">{pkg.down_payment_pct}%</div></div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="label-xs">Contingencies</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {!pkg.contingencies?.length ? (
                <span className="text-sm text-[var(--color-text-sec)]">None — no contingencies on this offer</span>
              ) : (
                pkg.contingencies.map((c) => (
                  <span key={c} className="text-xs px-3 py-1.5 rounded-sm border border-[var(--color-border)]">{c}</span>
                ))
              )}
            </div>
            {pkg.escalation_active && (
              <div className="mt-5">
                <div className="label-xs">Escalation Clause</div>
                <div className="text-sm mt-2">
                  Max {pkg.escalation_max_price != null ? fmt(pkg.escalation_max_price) : "—"} · Increment {pkg.escalation_increment != null ? fmt(pkg.escalation_increment) : "—"}
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="label-xs">Buyer Cover Letter</div>
              {!editing ? (
                <button onClick={() => { setDraft(pkg.cover_letter_text); setEditing(true); }} className="btn-ghost !py-1.5 !px-3 text-xs"><Edit3 size={12} /> Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="btn-ghost !py-1.5 !px-3 text-xs">Cancel</button>
                  <button onClick={saveLetter} disabled={savingLetter} className="btn-primary !py-1.5 !px-3 text-xs">
                    {savingLetter ? <Loader2 size={12} className="animate-spin" /> : "Save changes"}
                  </button>
                </div>
              )}
            </div>
            {editing ? (
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={18} className="input-base mt-4 !p-4 leading-relaxed" />
            ) : (
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed border border-[var(--color-border)] rounded-md p-4">
                {pkg.cover_letter_text || <span className="text-[var(--color-text-sec)]">No cover letter generated yet.</span>}
              </div>
            )}
          </div>

          {pkg.offer_summary_text && (
            <div className="card p-6">
              <div className="label-xs mb-3">Offer Summary</div>
              <div className="rounded-md p-5 border text-sm leading-relaxed" style={{ background: "var(--color-accent-dim)", borderColor: "var(--color-accent)" }}>
                {pkg.offer_summary_text}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="label-xs">Package Documents</div>
            <ul className="mt-3 space-y-3">
              {[{ type: "Cover Page", name: "cover.pdf" }, { type: "Cover Letter", name: "letter.pdf" }].map((d) => (
                <li key={d.name} className="flex items-center gap-3">
                  <FileText size={14} className="text-[var(--color-accent)]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{d.name}</div>
                    <div className="text-xs text-[var(--color-text-sec)]">{d.type}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <div className="label-xs">Buyer Info</div>
            <div className="text-sm font-medium mt-3">{pkg.buyer_name || "—"}</div>
            {pkg.buyer_story && <p className="text-sm text-[var(--color-text-sec)] mt-2 leading-relaxed">{pkg.buyer_story}</p>}
          </div>

          <div className="card p-6">
            <div className="label-xs">Timeline</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-text-sec)]">Created</span><span>{fmtDate(pkg.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-sec)]">Last modified</span><span>{fmtDate(pkg.updated_at)}</span></div>
              {pkg.completed_at && (
                <div className="flex justify-between"><span className="text-[var(--color-text-sec)]">Completed</span><span>{fmtDate(pkg.completed_at)}</span></div>
              )}
            </div>
          </div>

          <div className="card p-6 space-y-2">
            {pkg.status === "draft" && (
              <button onClick={markComplete} className="btn-primary w-full"><CheckCircle2 size={14} /> Mark as Complete</button>
            )}
            <button onClick={duplicate} className="btn-ghost w-full">Duplicate Package</button>
            <button onClick={() => setConfirm(true)} className="btn-danger w-full justify-center">Delete</button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={deletePkg}
        title="Delete this package?"
        description="This action cannot be undone."
      />
    </AppShell>
  );
}
