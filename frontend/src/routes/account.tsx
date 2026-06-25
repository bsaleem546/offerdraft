import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Plus } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useToast } from "../lib/toast";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — OfferDraft" }] }),
  component: Account,
});

const TABS = ["Profile", "Agency Branding", "Team", "Notifications", "Password"] as const;
type Tab = (typeof TABS)[number];

function Account() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("Profile");
  const [brandColor, setBrandColor] = useState("#D4A853");
  const [footer, setFooter] = useState("Marquez Realty · 512-555-0143 · marquezrealty.com");
  const [inviting, setInviting] = useState(false);
  const [pw, setPw] = useState("");

  const pwReqs = [
    { label: "8+ characters", ok: pw.length >= 8 },
    { label: "1 uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "1 number", ok: /\d/.test(pw) },
  ];

  return (
    <AppShell>
      <h1 className="serif text-3xl mb-8">Account Settings</h1>

      <div className="flex gap-1 border-b border-[var(--color-border)] mb-8 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm whitespace-nowrap transition-colors rounded-t-md ${
              tab === t ? "bg-[var(--color-surface)] text-[var(--color-accent)]" : "text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <div className="card p-8 max-w-2xl">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-20 h-20 rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent)] flex items-center justify-center serif text-2xl">EM</div>
            <button className="btn-ghost">Change avatar</button>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div><label className="label-xs">Full Name</label><input className="input-base mt-2" defaultValue="Elena Marquez" /></div>
            <div>
              <label className="label-xs">Email</label>
              <div className="relative">
                <input className="input-base mt-2 pr-24" defaultValue="elena@marquezrealty.com" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 label-xs text-[var(--color-warning)] border border-[var(--color-warning)] px-2 py-0.5 rounded-sm">Unverified</span>
              </div>
            </div>
            <div><label className="label-xs">Phone</label><input className="input-base mt-2" defaultValue="512-555-0143" /></div>
            <div><label className="label-xs">Agency Name</label><input className="input-base mt-2" defaultValue="Marquez Realty" /></div>
            <div><label className="label-xs">License Number</label><input className="input-base mt-2" defaultValue="TX-RE-784512" /></div>
            <div><label className="label-xs">State</label><select className="input-base mt-2"><option>TX</option><option>CA</option></select></div>
          </div>
          <div className="mt-8"><button onClick={() => toast("success", "Profile saved")} className="btn-primary">Save Changes</button></div>
        </div>
      )}

      {tab === "Agency Branding" && (
        <div className="card p-8 max-w-2xl">
          <div>
            <label className="label-xs">Agency Logo</label>
            <div className="mt-2 border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-md p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded bg-[var(--color-accent-dim)] flex items-center justify-center serif text-2xl text-[var(--color-accent)]">MR</div>
              <button className="btn-ghost mt-4 text-xs !py-1.5">Replace logo</button>
            </div>
          </div>
          <div className="mt-6">
            <label className="label-xs">Brand Color</label>
            <div className="flex items-center gap-3 mt-2">
              <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-12 h-10 rounded border border-[var(--color-border)] bg-transparent cursor-pointer" />
              <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="input-base mono !w-32" />
            </div>
            <div className="mt-4 rounded-md overflow-hidden border border-[var(--color-border)]">
              <div className="h-3" style={{ background: brandColor }} />
              <div className="p-4 bg-[var(--color-bg)] flex items-center justify-between">
                <div className="serif text-lg" style={{ color: brandColor }}>Marquez Realty</div>
                <div className="label-xs">PDF Preview</div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <label className="label-xs">Default Footer Text</label>
            <textarea value={footer} onChange={(e) => setFooter(e.target.value.slice(0, 120))} rows={2} className="input-base mt-2" />
            <div className="text-xs text-[var(--color-text-sec)] mt-1 text-right">{footer.length} / 120</div>
            <div className="text-xs text-[var(--color-text-sec)] mt-1">This text appears at the bottom of every PDF page.</div>
          </div>
          <div className="mt-8"><button onClick={() => toast("success", "Branding saved")} className="btn-primary">Save Branding</button></div>
        </div>
      )}

      {tab === "Team" && (
        <div className="card p-8 max-w-3xl relative">
          <div className="absolute inset-0 bg-[rgba(10,10,10,0.7)] backdrop-blur-[2px] flex items-center justify-center rounded-md z-10">
            <div className="text-center max-w-sm px-6">
              <Lock size={28} className="mx-auto text-[var(--color-accent)]" />
              <h3 className="serif text-2xl mt-4">Team is a Team plan feature</h3>
              <p className="mt-2 text-sm text-[var(--color-text-sec)]">Upgrade to invite up to 5 agents and collaborate on packages together.</p>
              <button className="btn-primary mt-5">Upgrade to Team</button>
            </div>
          </div>
          <div className="label-xs mb-4">Team Members</div>
          <table className="w-full text-sm opacity-30">
            <thead><tr className="border-b border-[var(--color-border)]"><th className="text-left py-2 label-xs">Name</th><th className="text-left py-2 label-xs">Email</th><th className="text-left py-2 label-xs">Role</th><th className="text-left py-2 label-xs">Joined</th><th></th></tr></thead>
            <tbody>
              <tr><td className="py-3">Elena Marquez</td><td>elena@marquezrealty.com</td><td>Owner</td><td>Jan 2026</td><td></td></tr>
              <tr><td className="py-3">Daniel Park</td><td>daniel@marquezrealty.com</td><td>Member</td><td>Feb 2026</td><td className="text-[var(--color-danger)]">Remove</td></tr>
              <tr><td className="py-3">Priya Shah</td><td>priya@marquezrealty.com</td><td>Member</td><td>Mar 2026</td><td className="text-[var(--color-danger)]">Remove</td></tr>
            </tbody>
          </table>
          <button onClick={() => setInviting(!inviting)} className="btn-primary mt-6 opacity-30"><Plus size={14} /> Invite Team Member</button>
          {inviting && (
            <div className="mt-3 flex gap-2"><input className="input-base" placeholder="agent@email.com" /><button className="btn-primary">Send Invite</button></div>
          )}
        </div>
      )}

      {tab === "Notifications" && (
        <div className="card p-8 max-w-2xl">
          {[
            ["Package completed", "When a PDF package is ready to download", true],
            ["Package downloaded", "When a team member downloads a package", false],
            ["Monthly usage summary", "Packages used vs. your plan limit", true],
            ["Billing alerts", "Upcoming renewals, payment failures", true],
            ["Product updates", "New features and improvements", false],
          ].map(([label, sub, def]) => (
            <label key={label as string} className="flex items-center justify-between gap-6 py-4 border-b border-[var(--color-border)] last:border-0 cursor-pointer">
              <div>
                <div className="text-sm font-medium">{label as string}</div>
                <div className="text-xs text-[var(--color-text-sec)] mt-0.5">{sub as string}</div>
              </div>
              <input type="checkbox" defaultChecked={def as boolean} className="w-10 h-6 accent-[var(--color-accent)]" />
            </label>
          ))}
          <div className="mt-6"><button onClick={() => toast("success", "Notification preferences saved")} className="btn-primary">Save</button></div>
        </div>
      )}

      {tab === "Password" && (
        <div className="card p-8 max-w-md">
          <div className="space-y-4">
            <div><label className="label-xs">Current Password</label><input type="password" className="input-base mt-2" /></div>
            <div>
              <label className="label-xs">New Password</label>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="input-base mt-2" />
            </div>
            <div><label className="label-xs">Confirm New Password</label><input type="password" className="input-base mt-2" /></div>
            <ul className="text-xs space-y-1 mt-3">
              {pwReqs.map((r) => (
                <li key={r.label} style={{ color: r.ok ? "var(--color-success)" : "var(--color-text-sec)" }}>· {r.label}</li>
              ))}
            </ul>
            <button onClick={() => toast("success", "Password updated")} className="btn-primary w-full mt-4">Update Password</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
