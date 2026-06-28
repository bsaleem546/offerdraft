import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, ArrowRight, Eye, Download, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../lib/toast";
import { requireAuth } from "../lib/guards";
import { packages as pkgApi, user as userApi, type Package, type Profile } from "../lib/api";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Dashboard — OfferDraft" }] }),
  component: Dashboard,
});

function fmt(n: number) { return `$${n.toLocaleString("en-US")}`; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function Dashboard() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recent, setRecent] = useState<Package[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      userApi.getProfile(),
      pkgApi.list({ sort: "newest", page: 1, limit: 5 }),
    ]).then(([p, r]) => {
      setProfile(p);
      setRecent(r.packages ?? []);
      setTotal(r.total);
    }).catch(() => {
      toast("error", "Failed to load dashboard");
    }).finally(() => setLoading(false));
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const markComplete = (id: string) => {
    pkgApi.markComplete(id)
      .then((p) => { setRecent((r) => r.map((x) => x.id === id ? p : x)); toast("success", "Marked complete"); })
      .catch(() => toast("error", "Failed to mark complete"));
  };

  const deletePkg = (id: string) => {
    pkgApi.delete(id)
      .then(() => { setRecent((r) => r.filter((x) => x.id !== id)); setTotal((t) => t - 1); toast("success", "Package deleted"); })
      .catch(() => toast("error", "Failed to delete package"));
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="label-xs">Overview</div>
          <h1 className="serif text-3xl mt-1">{greeting}, {firstName}</h1>
        </div>
        <Link to="/packages/new" className="btn-primary"><Plus size={14} /> New Package</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { label: "Total packages", value: loading ? "—" : String(total), sub: "All time" },
          { label: "Drafts in progress", value: loading ? "—" : String(recent.filter((p) => p.status === "draft").length), sub: "Needs attention" },
          { label: "Estimated time saved", value: loading ? "—" : `${total * 2} hrs`, sub: "At 2 hrs per package" },
        ].map((s) => (
          <div key={s.label} className="card p-6">
            <div className="label-xs">{s.label}</div>
            <div className="mono text-4xl mt-3 text-[var(--color-text-pri)]">{s.value}</div>
            <div className="text-xs text-[var(--color-text-sec)] mt-2">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="label-xs">Recent Packages</div>
        <Link to="/packages" className="text-sm text-[var(--color-accent)] hover:underline flex items-center gap-1">
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={24} className="animate-spin text-[var(--color-accent)]" /></div>
      ) : recent.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-[var(--color-text-sec)]">No packages yet.</p>
          <Link to="/packages/new" className="btn-primary inline-flex mt-4"><Plus size={14} /> New Package</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-3 label-xs">Property</th>
                <th className="text-left px-4 py-3 label-xs">Buyer</th>
                <th className="text-right px-4 py-3 label-xs">Offer</th>
                <th className="text-left px-4 py-3 label-xs">Status</th>
                <th className="text-left px-4 py-3 label-xs">Created</th>
                <th className="text-right px-4 py-3 label-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-accent-dim)] transition-colors">
                  <td className="px-4 py-3">{p.property_address}</td>
                  <td className="px-4 py-3 text-[var(--color-text-sec)]">{p.buyer_name}</td>
                  <td className="px-4 py-3 text-right mono">{fmt(p.offer_amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-[var(--color-text-sec)]">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3 text-[var(--color-text-sec)]">
                      <Link to="/packages/$id" params={{ id: p.id }} className="hover:text-[var(--color-accent)]" title="View"><Eye size={14} /></Link>
                      {p.status === "complete" ? (
                        <button className="hover:text-[var(--color-accent)]" title="Download"><Download size={14} /></button>
                      ) : (
                        <button onClick={() => markComplete(p.id)} className="hover:text-[var(--color-accent)]" title="Mark Complete"><CheckCircle size={14} /></button>
                      )}
                      <button onClick={() => deletePkg(p.id)} className="hover:text-[var(--color-danger)]" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
