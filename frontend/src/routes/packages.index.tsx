import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, FolderOpen, Eye, Download, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmModal } from "../components/Modal";
import { useToast } from "../lib/toast";
import { requireAuth } from "../lib/guards";
import { packages as pkgApi, type Package } from "../lib/api";

export const Route = createFileRoute("/packages/")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "My Packages — OfferDraft" }] }),
  component: Packages,
});

function fmt(n: number) { return `$${n.toLocaleString("en-US")}`; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function Packages() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [list, setList] = useState<Package[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);

  const LIMIT = 20;

  const load = (p = page) => {
    setLoading(true);
    pkgApi.list({ status, sort, page: p, limit: LIMIT })
      .then((r) => { setList(r.packages ?? []); setTotal(r.total); })
      .catch(() => toast("error", "Failed to load packages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); setPage(1); }, [status, sort]);

  const filtered = useMemo(() =>
    list.filter((p) =>
      q === "" ||
      p.property_address.toLowerCase().includes(q.toLowerCase()) ||
      p.buyer_name.toLowerCase().includes(q.toLowerCase())
    ), [list, q]);

  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const deleteSelected = () => {
    Promise.all(selected.map((id) => pkgApi.delete(id)))
      .then(() => { toast("success", `${selected.length} package(s) deleted`); setSelected([]); load(); })
      .catch(() => toast("error", "Failed to delete some packages"));
    setConfirm(false);
  };

  const deleteSingle = (id: string) => {
    pkgApi.delete(id)
      .then(() => { toast("success", "Package deleted"); load(); })
      .catch(() => toast("error", "Failed to delete package"));
  };

  const markComplete = (id: string) => {
    pkgApi.markComplete(id)
      .then(() => { toast("success", "Package marked complete"); load(); })
      .catch(() => toast("error", "Failed to mark complete"));
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <h1 className="serif text-3xl">My Packages</h1>
        <Link to="/packages/new" className="btn-primary"><Plus size={14} /> New Package</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-sec)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by address or buyer name..." className="input-base pl-9" />
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
        Showing {filtered.length} of {total} packages
      </div>

      {selected.length > 0 && (
        <div className="card mb-4 px-4 py-3 flex items-center justify-between" style={{ borderColor: "var(--color-accent)" }}>
          <div className="text-sm">{selected.length} selected</div>
          <button onClick={() => setConfirm(true)} className="btn-danger !py-1.5"><Trash2 size={14} /> Delete selected</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-[var(--color-accent)]" /></div>
      ) : filtered.length === 0 ? (
        <div className="card py-20 text-center">
          <FolderOpen size={36} strokeWidth={1.2} className="mx-auto text-[var(--color-text-sec)]" />
          <h3 className="serif text-2xl mt-4">No packages found</h3>
          <p className="mt-2 text-sm text-[var(--color-text-sec)]">
            {q || status !== "all" ? "Try adjusting your search or filters." : "Create your first offer package."}
          </p>
          {!q && status === "all" && (
            <Link to="/packages/new" className="btn-primary inline-flex mt-6"><Plus size={14} /> New Package</Link>
          )}
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
                  <td className="px-4 py-3">{p.property_address}</td>
                  <td className="px-4 py-3 text-[var(--color-text-sec)]">{p.buyer_name}</td>
                  <td className="px-4 py-3 text-right mono">{fmt(p.offer_amount)}</td>
                  <td className="px-4 py-3 text-[var(--color-text-sec)]">{p.loan_type}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-[var(--color-text-sec)]">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3 text-[var(--color-text-sec)]">
                      <Link to="/packages/$id" params={{ id: p.id }} className="hover:text-[var(--color-accent)]"><Eye size={14} /></Link>
                      {p.status === "complete"
                        ? <button className="hover:text-[var(--color-accent)]"><Download size={14} /></button>
                        : <button onClick={() => markComplete(p.id)} className="hover:text-[var(--color-accent)]"><CheckCircle size={14} /></button>
                      }
                      <button onClick={() => deleteSingle(p.id)} className="hover:text-[var(--color-danger)]"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm">
          <button disabled={page <= 1} onClick={() => { setPage(page - 1); load(page - 1); }} className="btn-ghost !py-2 disabled:opacity-40">Previous</button>
          <div className="text-[var(--color-text-sec)]">Page {page} of {totalPages}</div>
          <button disabled={page >= totalPages} onClick={() => { setPage(page + 1); load(page + 1); }} className="btn-ghost !py-2 disabled:opacity-40">Next</button>
        </div>
      )}

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={deleteSelected}
        title="Delete packages"
        description={`Delete ${selected.length} package(s)? This cannot be undone.`}
      />
    </AppShell>
  );
}
