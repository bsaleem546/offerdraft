import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Plus, Loader2 } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useToast } from "../lib/toast";
import { user, ApiError, type Profile } from "../lib/api";
import { requireAuth } from "../lib/guards";

export const Route = createFileRoute("/account")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Account — OfferDraft" }] }),
  component: Account,
});

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const TABS = ["Profile", "Agency Branding", "Team", "Notifications", "Password"] as const;
type Tab = (typeof TABS)[number];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function Account() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("Profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile tab
  const [profileForm, setProfileForm] = useState({ name: "", agency_name: "", license_number: "", state: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Branding tab
  const [brandColor, setBrandColor] = useState("#D4A853");
  const [footer, setFooter] = useState("");
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandErrors, setBrandErrors] = useState<Record<string, string>>({});

  // Password tab
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    user.getProfile()
      .then((p) => {
        setProfile(p);
        setProfileForm({ name: p.name, agency_name: p.agency_name, license_number: p.license_number, state: p.state || "TX" });
        setBrandColor(p.brand_color || "#D4A853");
        setFooter(p.pdf_footer_text || "");
      })
      .catch(() => toast("error", "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = () => {
    setProfileErrors({});
    setProfileSaving(true);
    user.updateProfile(profileForm)
      .then((p) => { setProfile(p); toast("success", "Profile saved"); })
      .catch((err: unknown) => {
        if (err instanceof ApiError && Object.keys(err.fields).length) setProfileErrors(err.fields);
        else toast("error", err instanceof Error ? err.message : "Failed to save");
      })
      .finally(() => setProfileSaving(false));
  };

  const saveBranding = () => {
    setBrandErrors({});
    setBrandSaving(true);
    user.updateBranding({ brand_color: brandColor, pdf_footer_text: footer })
      .then((p) => { setProfile(p); toast("success", "Branding saved"); })
      .catch((err: unknown) => {
        if (err instanceof ApiError && Object.keys(err.fields).length) setBrandErrors(err.fields);
        else toast("error", err instanceof Error ? err.message : "Failed to save");
      })
      .finally(() => setBrandSaving(false));
  };

  const savePassword = () => {
    setPwErrors({});
    if (pwForm.next !== pwForm.confirm) {
      setPwErrors({ confirm: "Passwords don't match" });
      return;
    }
    setPwSaving(true);
    user.changePassword({ current_password: pwForm.current, new_password: pwForm.next })
      .then(() => {
        setPwForm({ current: "", next: "", confirm: "" });
        toast("success", "Password updated");
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && Object.keys(err.fields).length) setPwErrors(err.fields);
        else toast("error", err instanceof Error ? err.message : "Failed to update password");
      })
      .finally(() => setPwSaving(false));
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-[var(--color-accent)]" />
        </div>
      </AppShell>
    );
  }

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
            <div className="w-20 h-20 rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent)] flex items-center justify-center serif text-2xl">
              {profile ? initials(profile.name) : "?"}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="label-xs">Full Name</label>
              <input className="input-base mt-2" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} style={profileErrors.name ? { borderColor: "var(--color-danger)" } : {}} />
              {profileErrors.name && <div className="text-xs text-[var(--color-danger)] mt-1">{profileErrors.name}</div>}
            </div>
            <div>
              <label className="label-xs">Email</label>
              <div className="relative">
                <input className="input-base mt-2 pr-24" value={profile?.email ?? ""} disabled />
                {profile && !profile.email_verified && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 label-xs text-[var(--color-warning)] border border-[var(--color-warning)] px-2 py-0.5 rounded-sm">Unverified</span>
                )}
              </div>
            </div>
            <div>
              <label className="label-xs">Agency Name</label>
              <input className="input-base mt-2" value={profileForm.agency_name} onChange={(e) => setProfileForm({ ...profileForm, agency_name: e.target.value })} style={profileErrors.agency_name ? { borderColor: "var(--color-danger)" } : {}} />
              {profileErrors.agency_name && <div className="text-xs text-[var(--color-danger)] mt-1">{profileErrors.agency_name}</div>}
            </div>
            <div>
              <label className="label-xs">License Number</label>
              <input className="input-base mt-2" value={profileForm.license_number} onChange={(e) => setProfileForm({ ...profileForm, license_number: e.target.value })} />
            </div>
            <div>
              <label className="label-xs">State</label>
              <select className="input-base mt-2" value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-8">
            <button onClick={saveProfile} disabled={profileSaving} className="btn-primary">
              {profileSaving ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {tab === "Agency Branding" && (
        <div className="card p-8 max-w-2xl">
          <div className="mt-6">
            <label className="label-xs">Brand Color</label>
            <div className="flex items-center gap-3 mt-2">
              <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-12 h-10 rounded border border-[var(--color-border)] bg-transparent cursor-pointer" />
              <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="input-base mono !w-32" style={brandErrors.brand_color ? { borderColor: "var(--color-danger)" } : {}} />
            </div>
            {brandErrors.brand_color && <div className="text-xs text-[var(--color-danger)] mt-1">{brandErrors.brand_color}</div>}
            <div className="mt-4 rounded-md overflow-hidden border border-[var(--color-border)]">
              <div className="h-3" style={{ background: brandColor }} />
              <div className="p-4 bg-[var(--color-bg)] flex items-center justify-between">
                <div className="serif text-lg" style={{ color: brandColor }}>{profile?.agency_name || "Your Agency"}</div>
                <div className="label-xs">PDF Preview</div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <label className="label-xs">Default Footer Text</label>
            <textarea value={footer} onChange={(e) => setFooter(e.target.value.slice(0, 255))} rows={2} className="input-base mt-2" style={brandErrors.pdf_footer_text ? { borderColor: "var(--color-danger)" } : {}} />
            <div className="text-xs text-[var(--color-text-sec)] mt-1 text-right">{footer.length} / 255</div>
            {brandErrors.pdf_footer_text && <div className="text-xs text-[var(--color-danger)] mt-1">{brandErrors.pdf_footer_text}</div>}
          </div>
          <div className="mt-8">
            <button onClick={saveBranding} disabled={brandSaving} className="btn-primary">
              {brandSaving ? <Loader2 size={14} className="animate-spin" /> : "Save Branding"}
            </button>
          </div>
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
              <tr><td className="py-3">{profile?.name}</td><td>{profile?.email}</td><td>Owner</td><td></td><td></td></tr>
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
            <div>
              <label className="label-xs">Current Password</label>
              <input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className="input-base mt-2" style={pwErrors.current_password ? { borderColor: "var(--color-danger)" } : {}} />
              {pwErrors.current_password && <div className="text-xs text-[var(--color-danger)] mt-1">{pwErrors.current_password}</div>}
            </div>
            <div>
              <label className="label-xs">New Password</label>
              <input type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} className="input-base mt-2" style={pwErrors.new_password ? { borderColor: "var(--color-danger)" } : {}} />
              {pwErrors.new_password && <div className="text-xs text-[var(--color-danger)] mt-1">{pwErrors.new_password}</div>}
            </div>
            <div>
              <label className="label-xs">Confirm New Password</label>
              <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className="input-base mt-2" style={pwErrors.confirm ? { borderColor: "var(--color-danger)" } : {}} />
              {pwErrors.confirm && <div className="text-xs text-[var(--color-danger)] mt-1">{pwErrors.confirm}</div>}
            </div>
            <button onClick={savePassword} disabled={pwSaving} className="btn-primary w-full mt-4">
              {pwSaving ? <Loader2 size={14} className="animate-spin" /> : "Update Password"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
