import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Download } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { ConfirmModal } from "../components/Modal";
import { INVOICES } from "../lib/mock-data";
import { useToast } from "../lib/toast";
import { requireAuth } from "../lib/guards";

export const Route = createFileRoute("/billing")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Billing — OfferDraft" }] }),
  component: Billing,
});

function Billing() {
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(false);

  return (
    <AppShell>
      <h1 className="serif text-3xl mb-8">Billing</h1>

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="card p-8 lg:col-span-2" style={{ borderColor: "var(--color-accent)" }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="label-xs">Current Plan</div>
              <div className="serif text-3xl mt-2">Solo Plan</div>
              <div className="mono text-xl text-[var(--color-accent)] mt-1">$49 / month</div>
              <div className="text-sm text-[var(--color-text-sec)] mt-2">Next renewal: July 25, 2026</div>
            </div>
            <div className="flex flex-col gap-2">
              <button className="btn-primary">Upgrade to Team <ArrowRight size={14} /></button>
              <button onClick={() => setConfirm(true)} className="btn-danger justify-center">Cancel Plan</button>
            </div>
          </div>
          <div className="mt-8">
            <div className="flex justify-between text-sm mb-2">
              <span>Packages this month</span>
              <span className="mono">12 / 30</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "40%", background: "var(--color-accent)" }} />
            </div>
          </div>
        </div>

        <div className="card p-8">
          <div className="label-xs">Payment Method</div>
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded border border-[var(--color-border)] text-xs font-semibold">VISA</div>
              <div className="mono text-sm">•••• 4242</div>
            </div>
            <div className="text-xs text-[var(--color-text-sec)] mt-2">Expires 08/27</div>
          </div>
          <button className="text-sm text-[var(--color-accent)] hover:underline mt-6">Update payment method →</button>
        </div>
      </div>

      <div className="label-xs mb-3">Invoice History</div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left px-5 py-3 label-xs">Date</th>
              <th className="text-left px-5 py-3 label-xs">Description</th>
              <th className="text-right px-5 py-3 label-xs">Amount</th>
              <th className="text-left px-5 py-3 label-xs">Status</th>
              <th className="text-right px-5 py-3 label-xs">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv) => (
              <tr key={inv.date} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-accent-dim)]">
                <td className="px-5 py-3 text-[var(--color-text-sec)]">{inv.date}</td>
                <td className="px-5 py-3">{inv.desc}</td>
                <td className="px-5 py-3 text-right mono">{inv.amount}</td>
                <td className="px-5 py-3">
                  <span className="label-xs" style={{ color: "var(--color-success)" }}>● {inv.status}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"><Download size={12} /> Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--color-text-sec)] mt-5">
        If you cancel, your plan stays active until July 25, 2026. After that, you can still view and download existing packages but cannot create new ones.
      </p>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => toast("success", "Cancellation scheduled for July 25, 2026")}
        title="Cancel your plan?"
        description="Your Solo plan stays active until July 25, 2026. After that, you can view and download existing packages but cannot create new ones."
        confirmLabel="Confirm Cancellation"
      />
    </AppShell>
  );
}
