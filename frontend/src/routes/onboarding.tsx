import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, ArrowLeft, Check, Loader2 } from "lucide-react";
import { StepProgress } from "../components/StepProgress";
import { useToast } from "../lib/toast";
import { user } from "../lib/api";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — OfferDraft" }] }),
  component: Onboarding,
});

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const CONTINGENCIES = ["Inspection", "Financing", "Appraisal", "Sale of Home"];
const TONES = [
  { label: "Professional", value: "professional" },
  { label: "Warm & Personal", value: "warm" },
  { label: "Highly Competitive", value: "competitive" },
];

function Onboarding() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [plan, setPlan] = useState<"solo" | "team">("solo");

  const [agencyForm, setAgencyForm] = useState({ name: "", agency_name: "", state: "TX", license_number: "" });
  const [defaults, setDefaults] = useState({
    earnest_pct: 3,
    closing_days: 30,
    contingencies: ["Inspection", "Financing", "Appraisal"] as string[],
    tone: "professional",
  });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const toggleContingency = (c: string) =>
    setDefaults((d) => ({
      ...d,
      contingencies: d.contingencies.includes(c)
        ? d.contingencies.filter((x) => x !== c)
        : [...d.contingencies, c],
    }));

  const finish = () => {
    setSaving(true);
    Promise.all([
      user.updateProfile({ name: agencyForm.name, agency_name: agencyForm.agency_name, state: agencyForm.state, license_number: agencyForm.license_number }),
      user.updateDefaults({
        default_contingencies: defaults.contingencies,
        default_closing_days: defaults.closing_days,
        cover_letter_tone: defaults.tone,
        default_earnest_money_pct: defaults.earnest_pct,
      }),
    ])
      .then(() => {
        toast("success", "Welcome to OfferDraft. Create your first offer package.");
        navigate({ to: "/dashboard" });
      })
      .catch(() => toast("error", "Failed to save your settings. You can update them in Account."))
      .finally(() => setSaving(false));
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Link to="/" className="serif text-2xl text-[var(--color-accent)]">OfferDraft</Link>
        </div>
        <div className="mb-16">
          <StepProgress steps={["Agency Info", "Defaults", "Choose Plan"]} current={step} />
        </div>

        {step === 0 && (
          <div className="card p-10">
            <h1 className="serif text-3xl">Set up your agency</h1>
            <p className="mt-2 text-[var(--color-text-sec)]">This information appears on your PDF packages.</p>
            <div className="grid md:grid-cols-2 gap-5 mt-8">
              <div>
                <label className="label-xs">Agency Name *</label>
                <input className="input-base mt-2" value={agencyForm.agency_name} onChange={(e) => setAgencyForm({ ...agencyForm, agency_name: e.target.value })} />
              </div>
              <div>
                <label className="label-xs">Your Full Name *</label>
                <input className="input-base mt-2" value={agencyForm.name} onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label-xs">State</label>
                <select className="input-base mt-2" value={agencyForm.state} onChange={(e) => setAgencyForm({ ...agencyForm, state: e.target.value })}>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label-xs">License Number</label>
                <input className="input-base mt-2" placeholder="Optional" value={agencyForm.license_number} onChange={(e) => setAgencyForm({ ...agencyForm, license_number: e.target.value })} />
              </div>
            </div>
            <div className="mt-6">
              <label className="label-xs">Agency Logo</label>
              <label className="mt-2 block border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-md p-8 text-center cursor-pointer transition-colors">
                {logo ? (
                  <img src={logo} alt="Logo preview" className="max-h-24 mx-auto" />
                ) : (
                  <>
                    <Upload size={20} className="mx-auto text-[var(--color-text-sec)]" />
                    <div className="mt-2 text-sm">Click to upload or drag your logo here</div>
                    <div className="text-xs text-[var(--color-text-sec)] mt-1">PNG or JPG, max 2MB</div>
                  </>
                )}
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setLogo(URL.createObjectURL(f)); }} />
              </label>
            </div>
            <div className="flex justify-end mt-8">
              <button onClick={next} className="btn-primary">Continue →</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="card p-10">
            <h1 className="serif text-3xl">Set your defaults</h1>
            <p className="mt-2 text-[var(--color-text-sec)]">These pre-fill every new offer package. You can change them per package.</p>
            <div className="grid md:grid-cols-2 gap-5 mt-8">
              <div>
                <label className="label-xs">Default Earnest Money %</label>
                <input type="number" value={defaults.earnest_pct} min={0} max={100} onChange={(e) => setDefaults({ ...defaults, earnest_pct: Number(e.target.value) })} className="input-base mt-2" />
              </div>
              <div>
                <label className="label-xs">Preferred Closing Window</label>
                <select className="input-base mt-2" value={defaults.closing_days} onChange={(e) => setDefaults({ ...defaults, closing_days: Number(e.target.value) })}>
                  {[14, 21, 30, 45, 60].map((d) => <option key={d} value={d}>{d} days</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className="label-xs">Default Contingencies</label>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {CONTINGENCIES.map((c) => (
                  <label key={c} className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] rounded-md text-sm cursor-pointer hover:border-[var(--color-accent)]">
                    <input type="checkbox" checked={defaults.contingencies.includes(c)} onChange={() => toggleContingency(c)} className="accent-[var(--color-accent)]" />
                    {c} Contingency
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <label className="label-xs">Cover Letter Tone</label>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {TONES.map((t) => (
                  <label key={t.value} className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] rounded-md text-sm cursor-pointer hover:border-[var(--color-accent)]">
                    <input type="radio" name="tone" checked={defaults.tone === t.value} onChange={() => setDefaults({ ...defaults, tone: t.value })} className="accent-[var(--color-accent)]" />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={back} className="btn-ghost"><ArrowLeft size={14} /> Back</button>
              <button onClick={next} className="btn-primary">Continue →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card p-10">
            <h1 className="serif text-3xl">Pick your plan</h1>
            <p className="mt-2 text-[var(--color-text-sec)]">You won't be charged today. Trial lasts 14 days.</p>
            <div className="grid md:grid-cols-2 gap-4 mt-8">
              {[
                { id: "solo" as const, name: "Solo", price: "$49", bullets: ["1 agent", "30 packages/mo", "3 templates"] },
                { id: "team" as const, name: "Team", price: "$149", bullets: ["5 agents", "Unlimited packages", "White-label PDF"] },
              ].map((p) => (
                <button key={p.id} onClick={() => setPlan(p.id)} className="card p-6 text-left transition-colors" style={plan === p.id ? { borderColor: "var(--color-accent)", background: "var(--color-accent-dim)" } : {}}>
                  <div className="flex items-center justify-between">
                    <div className="serif text-2xl">{p.name}</div>
                    {plan === p.id && <Check size={18} className="text-[var(--color-accent)]" />}
                  </div>
                  <div className="mt-2 mono text-2xl text-[var(--color-accent)]">{p.price}<span className="text-sm text-[var(--color-text-sec)]">/mo</span></div>
                  <ul className="mt-4 space-y-1.5 text-sm text-[var(--color-text-sec)]">
                    {p.bullets.map((b) => <li key={b}>· {b}</li>)}
                  </ul>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={back} className="btn-ghost"><ArrowLeft size={14} /> Back</button>
              <button onClick={finish} disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Start Free Trial"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
