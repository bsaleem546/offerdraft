import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, RefreshCw, FileText, Loader2, CheckCircle2, Upload, X, Minus, Plus } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StepProgress } from "../components/StepProgress";
import { SAMPLE_COVER_LETTER, formatMoney } from "../lib/mock-data";
import { useToast } from "../lib/toast";

export const Route = createFileRoute("/packages/new")({
  head: () => ({ meta: [{ title: "New Package — OfferDraft" }] }),
  component: NewPackage,
});

const ALT_LETTER = `Dear Seller,

Thank you for the opportunity to make an offer on 142 Maple Street. This home stood out to us from the first showing — the layout, the renovations, and the quiet street all match exactly what we have been searching for.

We are submitting an offer of $485,000 with conventional financing pre-approved, a 20% down payment, and a closing window that adapts to your schedule. Our pre-approval letter and proof of funds are included.

We would be honored to make this house our home.

Sincerely,
James & Laura Chen`;

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

function NewPackage() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [beds, setBeds] = useState(3);
  const [baths, setBaths] = useState(2);
  const [propType, setPropType] = useState("Single Family");
  const [loanType, setLoanType] = useState("Conventional");
  const [contingencies, setContingencies] = useState<string[]>(["Inspection", "Financing"]);
  const [escalation, setEscalation] = useState(false);
  const [offer, setOffer] = useState("485000");
  const [downPct, setDownPct] = useState("20");
  const [story, setStory] = useState("");
  const [letter, setLetter] = useState(SAMPLE_COVER_LETTER);
  const [regenerating, setRegenerating] = useState(false);
  const [files, setFiles] = useState<{ preapproval: File | null; proof: File | null; additional: File[] }>({ preapproval: null, proof: null, additional: [] });
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const toggleContingency = (c: string) => setContingencies((arr) => arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c]);

  const offerNum = Number(offer) || 0;
  const downAmt = (offerNum * (Number(downPct) || 0)) / 100;

  const regenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      setLetter((cur) => (cur === SAMPLE_COVER_LETTER ? ALT_LETTER : SAMPLE_COVER_LETTER));
      setRegenerating(false);
      toast("success", "New cover letter drafted");
    }, 2000);
  };

  const download = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      toast("success", "Package downloaded");
    }, 2000);
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
              <input className="input-base mt-2" placeholder="142 Maple St, Austin TX 78704" defaultValue="142 Maple St, Austin TX 78704" />
            </div>
            <div>
              <label className="label-xs">Listing Price *</label>
              <input className="input-base mt-2 mono" defaultValue="499000" />
            </div>
            <div>
              <label className="label-xs">MLS Number</label>
              <input className="input-base mt-2" placeholder="Optional" />
            </div>
            <div className="md:col-span-2">
              <label className="label-xs">Property Type</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Single Family","Condo","Townhouse","Multi-Family"].map((t) => (
                  <button key={t} type="button" onClick={() => setPropType(t)} className={`px-4 py-2 rounded-md text-sm border ${propType === t ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "border-[var(--color-border)] text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-xs block mb-2">Bedrooms</label>
              <Stepper value={beds} onChange={setBeds} />
            </div>
            <div>
              <label className="label-xs block mb-2">Bathrooms</label>
              <Stepper value={baths} onChange={(v) => setBaths(Math.max(0, v))} step={0.5} />
            </div>
            <div>
              <label className="label-xs">Year Built</label>
              <input type="number" className="input-base mt-2" placeholder="e.g. 1998" />
            </div>
            <div className="md:col-span-2">
              <label className="label-xs">Notable Features</label>
              <textarea rows={3} className="input-base mt-2" placeholder="e.g. Recently renovated kitchen, large backyard, cul-de-sac location, mountain views" />
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <button onClick={() => setStep(1)} className="btn-primary">Next: Offer Details →</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card p-8">
          <h2 className="serif text-2xl">Offer Details</h2>
          <div className="grid md:grid-cols-2 gap-5 mt-6">
            <div className="md:col-span-2">
              <label className="label-xs">Offer Amount *</label>
              <input className="input-base mt-2 mono text-2xl" value={offer} onChange={(e) => setOffer(e.target.value.replace(/[^0-9]/g, ""))} />
              <div className="text-xs text-[var(--color-text-sec)] mt-1">{formatMoney(offerNum)}</div>
            </div>
            <div>
              <label className="label-xs">Earnest Money Deposit</label>
              <input className="input-base mt-2 mono" defaultValue="15000" />
            </div>
            <div>
              <label className="label-xs">Down Payment %</label>
              <input className="input-base mt-2 mono" value={downPct} onChange={(e) => setDownPct(e.target.value.replace(/[^0-9.]/g, ""))} />
              <div className="text-xs text-[var(--color-text-sec)] mt-1">{formatMoney(downAmt)} down</div>
            </div>
            <div className="md:col-span-2">
              <label className="label-xs">Loan Type</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Conventional","FHA","VA","Cash"].map((t) => (
                  <button key={t} type="button" onClick={() => setLoanType(t)} className={`px-4 py-2 rounded-md text-sm border ${loanType === t ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "border-[var(--color-border)] text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-xs">Desired Closing Date</label>
              <input type="date" className="input-base mt-2" defaultValue="2026-07-28" />
            </div>
            <div className="md:col-span-2">
              <label className="label-xs">Contingencies</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {["Inspection","Financing","Appraisal","Sale of Home"].map((c) => (
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
                  <input className="input-base mt-2 mono" defaultValue="520000" />
                </div>
                <div>
                  <label className="label-xs">Increment Amount</label>
                  <input className="input-base mt-2 mono" defaultValue="2500" />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <label className="label-xs">Additional Terms</label>
              <textarea rows={3} className="input-base mt-2" placeholder="Optional" />
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(0)} className="btn-ghost"><ArrowLeft size={14} /> Back</button>
            <button onClick={() => setStep(2)} className="btn-primary">Next: Buyer Info →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-8">
          <h2 className="serif text-2xl">Buyer Info & Documents</h2>
          <div className="mt-6 space-y-5">
            <div>
              <label className="label-xs">Buyer Full Name(s)</label>
              <input className="input-base mt-2" placeholder="James & Laura Chen" defaultValue="James & Laura Chen" />
            </div>
            <div>
              <label className="label-xs">Buyer Story *</label>
              <textarea
                rows={5}
                value={story}
                onChange={(e) => setStory(e.target.value.slice(0, 500))}
                className="input-base mt-2"
                placeholder="Describe your buyers in 2–3 sentences. This feeds directly into the AI cover letter. E.g.: James and Laura are a young family relocating from Chicago. They've been searching for 8 months and fell in love with this property the moment they walked in."
              />
              <div className="text-xs text-[var(--color-text-sec)] mt-1 text-right">{story.length} / 500</div>
            </div>
          </div>

          <div className="mt-8">
            <div className="label-xs mb-4">Supporting Documents</div>
            <div className="space-y-4">
              <UploadBox label="Pre-Approval Letter *" file={files.preapproval} onFile={(f) => setFiles({ ...files, preapproval: f })} onRemove={() => setFiles({ ...files, preapproval: null })} />
              <UploadBox label="Proof of Funds" sub="Required for cash offers" file={files.proof} onFile={(f) => setFiles({ ...files, proof: f })} onRemove={() => setFiles({ ...files, proof: null })} />
              <div>
                <label className="label-xs">Additional Documents <span className="font-normal text-[var(--color-text-sec)] normal-case ml-2">Optional — comps, letters, etc.</span></label>
                <label className="mt-2 block border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-md p-6 text-center cursor-pointer">
                  <Upload size={18} className="mx-auto text-[var(--color-text-sec)]" />
                  <div className="text-sm mt-2">Click to upload (multiple files)</div>
                  <input type="file" multiple className="hidden" onChange={(e) => {
                    const fs = Array.from(e.target.files || []);
                    setFiles({ ...files, additional: [...files.additional, ...fs] });
                  }} />
                </label>
                {files.additional.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.additional.map((f, i) => (
                      <div key={i} className="flex items-center justify-between border border-[var(--color-border)] rounded-md px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={14} className="text-[var(--color-accent)] flex-shrink-0" />
                          <span className="text-sm truncate">{f.name}</span>
                          <span className="text-xs text-[var(--color-text-sec)] flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
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
            <button onClick={() => setStep(3)} className="btn-primary">Next: Generate →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="label-xs">Buyer Cover Letter</div>
                <button onClick={regenerate} disabled={regenerating} className="btn-ghost !py-1.5 !px-3 text-xs">
                  {regenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Regenerate
                </button>
              </div>
              {regenerating ? (
                <div className="border border-[var(--color-border)] rounded-md p-12 text-center">
                  <Loader2 size={20} className="mx-auto text-[var(--color-accent)] animate-spin" />
                  <div className="mt-3 text-sm text-[var(--color-text-sec)]">Drafting your cover letter...</div>
                </div>
              ) : (
                <textarea
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  rows={18}
                  className="input-base !p-4 leading-relaxed"
                />
              )}
            </div>
            <div>
              <div className="label-xs mb-3">Offer Summary</div>
              <div className="rounded-md p-5 border" style={{ background: "var(--color-accent-dim)", borderColor: "var(--color-accent)" }}>
                <p className="text-sm leading-relaxed">
                  The Chens are presenting a {formatMoney(offerNum)} offer on 142 Maple St with {loanType} financing and a {downPct}% down payment of {formatMoney(downAmt)}. Closing is targeted for July 28, 2026 with {contingencies.length} contingencies included. The buyers are pre-approved and ready to move quickly.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card p-6 sticky top-6">
              <div className="label-xs mb-4">Your package will include</div>
              <ol className="space-y-3 text-sm">
                {[
                  "Cover Page (agency logo + offer summary)",
                  "Buyer Cover Letter (AI Generated)",
                  files.preapproval ? `Pre-Approval Letter (${files.preapproval.name})` : "Pre-Approval Letter",
                  ...(files.proof ? [`Proof of Funds (${files.proof.name})`] : []),
                  ...files.additional.map((f) => `Additional: ${f.name}`),
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <FileText size={14} className="text-[var(--color-accent)] flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--color-text-pri)]">{item}</span>
                  </li>
                ))}
              </ol>

              <div className="border-t border-[var(--color-border)] my-5" />

              <div className="flex items-center justify-between mb-5">
                <div className="label-xs">Estimated pages</div>
                <div className="mono text-2xl text-[var(--color-accent)]">{5 + files.additional.length}</div>
              </div>

              {downloaded ? (
                <div className="text-center py-3">
                  <CheckCircle2 size={28} className="mx-auto text-[var(--color-success)]" />
                  <div className="mt-2 text-sm">Package ready — download started</div>
                </div>
              ) : (
                <button onClick={download} disabled={downloading} className="btn-primary w-full">
                  {downloading ? (<><Loader2 size={14} className="animate-spin" /> Assembling your package...</>) : "Download PDF Package"}
                </button>
              )}
              <button onClick={() => { console.log("save draft"); toast("success", "Saved as draft"); }} className="btn-ghost w-full mt-2">Save as Draft</button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6">
          <button onClick={() => setStep(2)} className="btn-ghost"><ArrowLeft size={14} /> Back</button>
        </div>
      )}
    </AppShell>
  );
}
