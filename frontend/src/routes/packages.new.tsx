import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, RefreshCw, FileText, Loader2, CheckCircle2, Upload, X, Minus, Plus } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StepProgress } from "../components/StepProgress";
import { useToast } from "../lib/toast";
import { requireAuth } from "../lib/guards";
import { packages as pkgApi, type Package } from "../lib/api";

export const Route = createFileRoute("/packages/new")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "New Package — OfferDraft" }] }),
  component: NewPackage,
});

function Stepper({ value, onChange, step = 1, min = 0 }: { value: number; onChange: (v: number) => void; step?: number; min?: number }) {
  return (
    <div className="flex items-center border border-[var(--color-border)] rounded-md w-fit">
      <button type="button" onClick={() => onChange(Math.max(min, value - step))} className="px-3 py-2 text-[var(--color-text-sec)] hover:text-[var(--color-accent)]"><Minus size={14} /></button>
      <div className="px-4 mono w-12 text-center">{value}</div>
      <button type="button" onClick={() => onChange(value + step)} className="px-3 py-2 text-[var(--color-text-sec)] hover:text-[var(--color-accent)]"><Plus size={14} /></button>
    </div>
  );
}

function UploadBox({ label, sub, file, onFile, onRemove }: { label: string; sub?: string; file: File | null; onFile: (f: File) => void; onRemove: () => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="label-xs">{label}</label>
        {sub && <span className="text-xs text-[var(--color-text-sec)]">{sub}</span>}
      </div>
      {file ? (
        <div className="flex items-center justify-between border border-[var(--color-border)] rounded-md px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={16} className="text-[var(--color-accent)] flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm truncate">{file.name}</div>
              <div className="text-xs text-[var(--color-text-sec)]">{(file.size / 1024).toFixed(0)} KB</div>
            </div>
          </div>
          <button onClick={onRemove} className="text-[var(--color-danger)] hover:opacity-70"><X size={16} /></button>
        </div>
      ) : (
        <label className="block border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-md p-6 text-center cursor-pointer transition-colors">
          <Upload size={18} className="mx-auto text-[var(--color-text-sec)]" />
          <div className="text-sm mt-2">Click to upload</div>
          <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </label>
      )}
    </div>
  );
}

function fmt(n: number) { return `$${n.toLocaleString("en-US")}`; }

function NewPackage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Property step
  const [address, setAddress] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [mlsNumber, setMlsNumber] = useState("");
  const [propType, setPropType] = useState("Single Family");
  const [beds, setBeds] = useState(3);
  const [baths, setBaths] = useState(2);
  const [yearBuilt, setYearBuilt] = useState("");
  const [notableFeatures, setNotableFeatures] = useState("");

  // Offer step
  const [offer, setOffer] = useState("");
  const [earnest, setEarnest] = useState("");
  const [downPct, setDownPct] = useState("20");
  const [loanType, setLoanType] = useState("Conventional");
  const [closingDate, setClosingDate] = useState("");
  const [contingencies, setContingencies] = useState<string[]>(["Inspection", "Financing"]);
  const [escalation, setEscalation] = useState(false);
  const [escalationMax, setEscalationMax] = useState("");
  const [escalationIncrement, setEscalationIncrement] = useState("");
  const [additionalTerms, setAdditionalTerms] = useState("");

  // Buyer step
  const [buyerName, setBuyerName] = useState("");
  const [story, setStory] = useState("");
  const [files, setFiles] = useState<{ preapproval: File | null; proof: File | null; additional: File[] }>({ preapproval: null, proof: null, additional: [] });

  // Generate step
  const [pkg, setPkg] = useState<Package | null>(null);
  const [letter, setLetter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const toggleContingency = (c: string) => setContingencies((arr) => arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c]);

  const offerNum = Number(offer) || 0;
  const downAmt = (offerNum * (Number(downPct) || 0)) / 100;

  const buildBody = () => ({
    property_address: address,
    offer_amount: offerNum,
    listing_price: listingPrice ? Number(listingPrice) : undefined,
    property_type: propType,
    mls_number: mlsNumber,
    bedrooms: beds,
    bathrooms: baths,
    year_built: yearBuilt ? Number(yearBuilt) : undefined,
    notable_features: notableFeatures,
    earnest_money: earnest ? Number(earnest) : undefined,
    down_payment_pct: downPct ? Number(downPct) : undefined,
    loan_type: loanType,
    closing_date: closingDate,
    contingencies,
    additional_terms: additionalTerms,
    buyer_name: buyerName,
    buyer_story: story,
  });

  const goGenerate = async () => {
    setGenerating(true);
    try {
      const created = pkg ?? await pkgApi.create(buildBody());
      setPkg(created);
      const generated = await pkgApi.generate(created.id);
      setPkg(generated);
      setLetter(generated.cover_letter_text);
      setStep(3);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to generate package");
    } finally {
      setGenerating(false);
    }
  };

  const regenerate = async () => {
    if (!pkg) return;
    setGenerating(true);
    try {
      const generated = await pkgApi.generate(pkg.id);
      setPkg(generated);
      setLetter(generated.cover_letter_text);
      toast("success", "New cover letter drafted");
    } catch {
      toast("error", "Regeneration failed");
    } finally {
      setGenerating(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const created = pkg ?? await pkgApi.create(buildBody());
      toast("success", "Saved as draft");
      navigate({ to: "/packages/$id", params: { id: created.id } });
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-10">
        <h1 className="serif text-3xl">New Offer Package</h1>
      </div>
      <div className="mb-12">
        <StepProgress steps={["Property", "Offer", "Buyer & Docs", "Generate"]} current={step} />
      </div>

      {step === 0 && (
        <div className="card p-8">
          <h2 className="serif text-2xl">Property Details</h2>
          <div className="grid md:grid-cols-2 gap-5 mt-6">
            <div className="md:col-span-2">
              <label className="label-xs">Property Address *</label>
              <input className="input-base mt-2" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="142 Maple St, Austin TX 78704" />
            </div>
            <div>
              <label className="label-xs">Listing Price</label>
              <input className="input-base mt-2 mono" value={listingPrice} onChange={(e) => setListingPrice(e.target.value.replace(/[^0-9]/g, ""))} placeholder="499000" />
            </div>
            <div>
              <label className="label-xs">MLS Number</label>
              <input className="input-base mt-2" value={mlsNumber} onChange={(e) => setMlsNumber(e.target.value)} placeholder="Optional" />
            </div>
            <div className="md:col-span-2">
              <label className="label-xs">Property Type</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Single Family", "Condo", "Townhouse", "Multi-Family"].map((t) => (
                  <button key={t} type="button" onClick={() => setPropType(t)} className={`px-4 py-2 rounded-md text-sm border ${propType === t ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "border-[var(--color-border)] text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div><label className="label-xs block mb-2">Bedrooms</label><Stepper value={beds} onChange={setBeds} /></div>
            <div><label className="label-xs block mb-2">Bathrooms</label><Stepper value={baths} onChange={(v) => setBaths(Math.max(0, v))} step={0.5} /></div>
            <div>
              <label className="label-xs">Year Built</label>
              <input type="number" className="input-base mt-2" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} placeholder="e.g. 1998" />
            </div>
            <div className="md:col-span-2">
              <label className="label-xs">Notable Features</label>
              <textarea rows={3} className="input-base mt-2" value={notableFeatures} onChange={(e) => setNotableFeatures(e.target.value)} placeholder="e.g. Recently renovated kitchen, large backyard..." />
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <button onClick={() => setStep(1)} disabled={!address} className="btn-primary disabled:opacity-40">Next: Offer Details →</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card p-8">
          <h2 className="serif text-2xl">Offer Details</h2>
          <div className="grid md:grid-cols-2 gap-5 mt-6">
            <div className="md:col-span-2">
              <label className="label-xs">Offer Amount *</label>
              <input className="input-base mt-2 mono text-2xl" value={offer} onChange={(e) => setOffer(e.target.value.replace(/[^0-9]/g, ""))} placeholder="485000" />
              {offerNum > 0 && <div className="text-xs text-[var(--color-text-sec)] mt-1">{fmt(offerNum)}</div>}
            </div>
            <div>
              <label className="label-xs">Earnest Money Deposit</label>
              <input className="input-base mt-2 mono" value={earnest} onChange={(e) => setEarnest(e.target.value.replace(/[^0-9]/g, ""))} placeholder="15000" />
            </div>
            <div>
              <label className="label-xs">Down Payment %</label>
              <input className="input-base mt-2 mono" value={downPct} onChange={(e) => setDownPct(e.target.value.replace(/[^0-9.]/g, ""))} />
              {downAmt > 0 && <div className="text-xs text-[var(--color-text-sec)] mt-1">{fmt(downAmt)} down</div>}
            </div>
            <div className="md:col-span-2">
              <label className="label-xs">Loan Type</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Conventional", "FHA", "VA", "Cash"].map((t) => (
                  <button key={t} type="button" onClick={() => setLoanType(t)} className={`px-4 py-2 rounded-md text-sm border ${loanType === t ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "border-[var(--color-border)] text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-xs">Desired Closing Date</label>
              <input type="date" className="input-base mt-2" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label-xs">Contingencies</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {["Inspection", "Financing", "Appraisal", "Sale of Home"].map((c) => (
                  <label key={c} className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] rounded-md text-sm cursor-pointer hover:border-[var(--color-accent)]">
                    <input type="checkbox" checked={contingencies.includes(c)} onChange={() => toggleContingency(c)} className="accent-[var(--color-accent)]" />
                    {c} Contingency
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center justify-between border border-[var(--color-border)] rounded-md px-4 py-3 cursor-pointer">
                <div>
                  <div className="font-medium">Escalation Clause</div>
                  <div className="text-xs text-[var(--color-text-sec)]">Automatically beat competing offers up to a maximum</div>
                </div>
                <input type="checkbox" checked={escalation} onChange={(e) => setEscalation(e.target.checked)} className="w-10 h-6 accent-[var(--color-accent)]" />
              </label>
            </div>
            {escalation && (
              <>
                <div>
                  <label className="label-xs">Maximum Offer Price</label>
                  <input className="input-base mt-2 mono" value={escalationMax} onChange={(e) => setEscalationMax(e.target.value.replace(/[^0-9]/g, ""))} placeholder="520000" />
                </div>
                <div>
                  <label className="label-xs">Increment Amount</label>
                  <input className="input-base mt-2 mono" value={escalationIncrement} onChange={(e) => setEscalationIncrement(e.target.value.replace(/[^0-9]/g, ""))} placeholder="2500" />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <label className="label-xs">Additional Terms</label>
              <textarea rows={3} className="input-base mt-2" value={additionalTerms} onChange={(e) => setAdditionalTerms(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(0)} className="btn-ghost"><ArrowLeft size={14} /> Back</button>
            <button onClick={() => setStep(2)} disabled={!offer} className="btn-primary disabled:opacity-40">Next: Buyer Info →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-8">
          <h2 className="serif text-2xl">Buyer Info & Documents</h2>
          <div className="mt-6 space-y-5">
            <div>
              <label className="label-xs">Buyer Full Name(s)</label>
              <input className="input-base mt-2" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="James & Laura Chen" />
            </div>
            <div>
              <label className="label-xs">Buyer Story *</label>
              <textarea rows={5} value={story} onChange={(e) => setStory(e.target.value.slice(0, 500))} className="input-base mt-2" placeholder="Describe your buyers in 2–3 sentences. This feeds directly into the AI cover letter." />
              <div className="text-xs text-[var(--color-text-sec)] mt-1 text-right">{story.length} / 500</div>
            </div>
          </div>
          <div className="mt-8">
            <div className="label-xs mb-4">Supporting Documents</div>
            <div className="space-y-4">
              <UploadBox label="Pre-Approval Letter" file={files.preapproval} onFile={(f) => setFiles({ ...files, preapproval: f })} onRemove={() => setFiles({ ...files, preapproval: null })} />
              <UploadBox label="Proof of Funds" sub="Required for cash offers" file={files.proof} onFile={(f) => setFiles({ ...files, proof: f })} onRemove={() => setFiles({ ...files, proof: null })} />
              <div>
                <label className="label-xs">Additional Documents <span className="font-normal text-[var(--color-text-sec)] normal-case ml-2">Optional</span></label>
                <label className="mt-2 block border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-md p-6 text-center cursor-pointer">
                  <Upload size={18} className="mx-auto text-[var(--color-text-sec)]" />
                  <div className="text-sm mt-2">Click to upload (multiple files)</div>
                  <input type="file" multiple className="hidden" onChange={(e) => { const fs = Array.from(e.target.files || []); setFiles({ ...files, additional: [...files.additional, ...fs] }); }} />
                </label>
                {files.additional.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.additional.map((f, i) => (
                      <div key={i} className="flex items-center justify-between border border-[var(--color-border)] rounded-md px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={14} className="text-[var(--color-accent)] flex-shrink-0" />
                          <span className="text-sm truncate">{f.name}</span>
                        </div>
                        <button onClick={() => setFiles({ ...files, additional: files.additional.filter((_, j) => j !== i) })} className="text-[var(--color-danger)]"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(1)} className="btn-ghost"><ArrowLeft size={14} /> Back</button>
            <button onClick={goGenerate} disabled={generating} className="btn-primary disabled:opacity-40">
              {generating ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : "Next: Generate →"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <>
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="label-xs">Buyer Cover Letter</div>
                  <button onClick={regenerate} disabled={generating} className="btn-ghost !py-1.5 !px-3 text-xs">
                    {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Regenerate
                  </button>
                </div>
                {generating ? (
                  <div className="border border-[var(--color-border)] rounded-md p-12 text-center">
                    <Loader2 size={20} className="mx-auto text-[var(--color-accent)] animate-spin" />
                    <div className="mt-3 text-sm text-[var(--color-text-sec)]">Drafting your cover letter...</div>
                  </div>
                ) : (
                  <textarea value={letter} onChange={(e) => setLetter(e.target.value)} rows={18} className="input-base !p-4 leading-relaxed" />
                )}
              </div>
              {pkg?.offer_summary_text && (
                <div>
                  <div className="label-xs mb-3">Offer Summary</div>
                  <div className="rounded-md p-5 border text-sm leading-relaxed" style={{ background: "var(--color-accent-dim)", borderColor: "var(--color-accent)" }}>
                    {pkg.offer_summary_text}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="card p-6 sticky top-6">
                <div className="label-xs mb-4">Your package will include</div>
                <ol className="space-y-3 text-sm">
                  {[
                    "Cover Page (agency logo + offer summary)",
                    "Buyer Cover Letter (AI Generated)",
                    files.preapproval ? `Pre-Approval Letter (${files.preapproval.name})` : null,
                    files.proof ? `Proof of Funds (${files.proof.name})` : null,
                    ...files.additional.map((f) => `Additional: ${f.name}`),
                  ].filter(Boolean).map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <FileText size={14} className="text-[var(--color-accent)] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
                <div className="border-t border-[var(--color-border)] my-5" />
                {downloaded ? (
                  <div className="text-center py-3">
                    <CheckCircle2 size={28} className="mx-auto text-[var(--color-success)]" />
                    <div className="mt-2 text-sm">Package ready — download started</div>
                  </div>
                ) : (
                  <button onClick={() => { setDownloaded(true); toast("success", "Package downloaded"); }} className="btn-primary w-full">
                    Download PDF Package
                  </button>
                )}
                <button onClick={saveDraft} disabled={saving} className="btn-ghost w-full mt-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : "Save as Draft"}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button onClick={() => setStep(2)} className="btn-ghost"><ArrowLeft size={14} /> Back</button>
          </div>
        </>
      )}
    </AppShell>
  );
}
