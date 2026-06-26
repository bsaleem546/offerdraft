import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ArrowRight, Eye, Download, Trash2, CheckCircle } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { PACKAGES, formatMoney } from "../lib/mock-data";
import { requireAuth } from "../lib/guards";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Dashboard — OfferDraft" }] }),
  component: Dashboard,
});

function Dashboard() {
  const recent = PACKAGES.slice(0, 5);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="label-xs">Overview</div>
          <h1 className="serif text-3xl mt-1">Good morning, Elena</h1>
        </div>
        <Link to="/packages/new" className="btn-primary"><Plus size={14} /> New Package</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { label: "Packages this month", value: "12", sub: "of 30 included" },
          { label: "Total packages created", value: "47", sub: "Since January" },
          { label: "Estimated time saved", value: "94 hrs", sub: "at 2 hrs per package" },
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
                <td className="px-4 py-3">{p.address}</td>
                <td className="px-4 py-3 text-[var(--color-text-sec)]">{p.buyer}</td>
                <td className="px-4 py-3 text-right mono">{formatMoney(p.amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-[var(--color-text-sec)]">{p.created}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3 text-[var(--color-text-sec)]">
                    <Link to="/packages/$id" params={{ id: p.id }} className="hover:text-[var(--color-accent)]" title="View"><Eye size={14} /></Link>
                    {p.status === "Complete" ? (
                      <button className="hover:text-[var(--color-accent)]" title="Download"><Download size={14} /></button>
                    ) : (
                      <button className="hover:text-[var(--color-accent)]" title="Complete"><CheckCircle size={14} /></button>
                    )}
                    <button className="hover:text-[var(--color-danger)]" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
