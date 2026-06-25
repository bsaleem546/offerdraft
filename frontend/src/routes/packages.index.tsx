import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, FolderOpen, Eye, Download, Trash2, CheckCircle } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmModal } from "../components/Modal";
import { PACKAGES, formatMoney } from "../lib/mock-data";
import { useToast } from "../lib/toast";

export const Route = createFileRoute("/packages/")({
  head: () => ({ meta: [{ title: "My Packages — OfferDraft" }] }),
  component: Packages,
});

function Packages() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);

  const filtered = useMemo(() => {
    let list = PACKAGES.filter((p) =>
      (status === "all" || p.status.toLowerCase() === status) &&
      (q === "" || p.address.toLowerCase().includes(q.toLowerCase()) || p.buyer.toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "high") list = [...list].sort((a, b) => b.amount - a.amount);
    if (sort === "low") list = [...list].sort((a, b) => a.amount - b.amount);
    if (sort === "oldest") list = [...list].reverse();
    return list;
  }, [q, status, sort]);

  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <h1 className="serif text-3xl">My Packages</h1>
        <Link to="/packages/new" className="btn-primary"><Plus size={14} /> New Package</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-sec)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by address or buyer name..."
            className="input-base pl-9"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-base !w-auto">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="complete">Complete</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-base !w-auto">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="high">Highest Offer</option>
          <option value="low">Lowest Offer</option>
        </select>
      </div>

      <div className="text-sm text-[var(--color-text-sec)] mb-4">
        Showing {filtered.length} of {PACKAGES.length} packages
      </div>

      {selected.length > 0 && (
        <div className="card mb-4 px-4 py-3 flex items-center justify-between" style={{ borderColor: "var(--color-accent)" }}>
          <div className="text-sm">{selected.length} selected</div>
          <button onClick={() => setConfirm(true)} className="btn-danger !py-1.5">
            <Trash2 size={14} /> Delete selected
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card py-20 text-center">
          <FolderOpen size={36} strokeWidth={1.2} className="mx-auto text-[var(--color-text-sec)]" />
          <h3 className="serif text-2xl mt-4">No packages found</h3>
          <p className="mt-2 text-sm text-[var(--color-text-sec)]">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="w-10 px-4 py-3"></th>
                <th className="text-left px-4 py-3 label-xs">Property</th>
                <th className="text-left px-4 py-3 label-xs">Buyer</th>
                <th className="text-right px-4 py-3 label-xs">Offer</th>
                <th className="text-left px-4 py-3 label-xs">Loan</th>
                <th className="text-left px-4 py-3 label-xs">Status</th>
                <th className="text-left px-4 py-3 label-xs">Created</th>
                <th className="text-right px-4 py-3 label-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-accent-dim)]">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="accent-[var(--color-accent)]" />
                  </td>
                  <td className="px-4 py-3">{p.address}</td>
                  <td className="px-4 py-3 text-[var(--color-text-sec)]">{p.buyer}</td>
                  <td className="px-4 py-3 text-right mono">{formatMoney(p.amount)}</td>
                  <td className="px-4 py-3 text-[var(--color-text-sec)]">{p.loanType}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-[var(--color-text-sec)]">{p.created}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3 text-[var(--color-text-sec)]">
                      <Link to="/packages/$id" params={{ id: p.id }} className="hover:text-[var(--color-accent)]"><Eye size={14} /></Link>
                      {p.status === "Complete" ? <button className="hover:text-[var(--color-accent)]"><Download size={14} /></button> : <button className="hover:text-[var(--color-accent)]"><CheckCircle size={14} /></button>}
                      <button className="hover:text-[var(--color-danger)]"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-6 text-sm">
        <button className="btn-ghost !py-2">Previous</button>
        <div className="flex items-center gap-2 text-[var(--color-text-sec)]">
          <span className="px-3 py-1 rounded-sm bg-[var(--color-accent-dim)] text-[var(--color-accent)]">1</span>
          <span className="px-3 py-1">2</span>
          <span className="px-3 py-1">3</span>
          <span className="px-2">...</span>
          <span className="px-3 py-1">5</span>
        </div>
        <button className="btn-ghost !py-2">Next</button>
      </div>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => { toast("success", `${selected.length} package(s) deleted`); setSelected([]); }}
        title="Delete packages"
        description={`Delete ${selected.length} package(s)? This cannot be undone.`}
      />
    </AppShell>
  );
}
