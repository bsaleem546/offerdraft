import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X, ChevronDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — OfferDraft" },
      { name: "description", content: "One tool. One price. Plans for solo agents and small teams." },
      { property: "og:title", content: "OfferDraft Pricing" },
      { property: "og:description", content: "Solo $49/mo. Team $149/mo. AI cover letters and PDF assembly on every plan." },
    ],
  }),
  component: Pricing,
});

const FEATURES = [
  ["Agent seats", "1", "5"],
  ["Monthly packages", "30", "Unlimited"],
  ["AI cover letter generation", true, true],
  ["PDF assembly + merge", true, true],
  ["Saved templates", "3", "Unlimited"],
  ["White-label PDF branding", false, true],
  ["Team collaboration", false, true],
  ["Email support", true, true],
  ["Priority support", false, true],
] as const;

const FAQS = [
  { q: "Is there a free trial?", a: "Yes — every plan includes a 14-day free trial. You won't be charged until the trial ends, and you can cancel anytime." },
  { q: "What does 'white-label PDF' mean?", a: "Your offer packages are exported with your agency's logo, colors, and footer text. No mention of OfferDraft appears on the PDF." },
  { q: "Can I change plans later?", a: "Yes. Upgrade or downgrade anytime from your billing page. Changes prorate immediately." },
  { q: "What happens when I hit 30 packages on the Solo plan?", a: "You'll be notified when you reach the limit. You can either upgrade to Team or wait until your next billing cycle resets." },
  { q: "Do uploaded documents stay private?", a: "Yes. Documents are encrypted in transit and at rest. Only you and your team members can access them." },
  { q: "What file formats can I upload?", a: "PDF, JPG, and PNG for documents. PNG and JPG for logos." },
  { q: "How do I cancel?", a: "Cancel from your billing page in two clicks. Your plan stays active through the current billing period." },
];

function Nav() {
  return (
    <nav className="px-6 lg:px-12 py-4 flex items-center justify-between border-b border-[var(--color-border)]">
      <Link to="/" className="serif text-2xl text-[var(--color-accent)]">OfferDraft</Link>
      <div className="flex items-center gap-3">
        <Link to="/login" className="btn-ghost !py-2 !px-4">Log in</Link>
        <Link to="/register" className="btn-primary !py-2 !px-4">Get Started</Link>
      </div>
    </nav>
  );
}

function PlanCard({ name, price, features, popular, planParam }: { name: string; price: string; features: string[]; popular?: boolean; planParam: string }) {
  return (
    <div
      className="card p-8 relative flex flex-col"
      style={popular ? { borderColor: "var(--color-accent)" } : {}}
    >
      {popular && (
        <div className="absolute -top-3 right-6 label-xs px-2 py-1 bg-[var(--color-accent)] text-[var(--color-text-inv)] rounded-sm">
          Most Popular
        </div>
      )}
      <div className="serif text-3xl">{name}</div>
      <div className="mt-3"><span className="mono text-4xl text-[var(--color-accent)]">{price}</span><span className="text-[var(--color-text-sec)] ml-1">/month</span></div>
      <ul className="mt-6 space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex gap-3 text-sm">
            <Check size={16} className="text-[var(--color-accent)] flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <Link to="/register" search={{ plan: planParam }} className="btn-primary mt-8 justify-center">Start {name} Plan</Link>
    </div>
  );
}

function FaqItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-[var(--color-border)]">
      <button onClick={onClick} className="w-full flex items-center justify-between py-5 text-left">
        <span className="font-medium">{q}</span>
        <ChevronDown size={18} className={`transition-transform text-[var(--color-text-sec)] ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-5 text-[var(--color-text-sec)] text-sm leading-relaxed">{a}</div>}
    </div>
  );
}

function Pricing() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div>
      <Nav />
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="label-xs">Pricing</div>
          <h1 className="serif text-4xl lg:text-5xl mt-3">One tool. One price. No per-seat nonsense.</h1>
          <p className="mt-5 text-lg text-[var(--color-text-sec)]">
            Every plan includes AI cover letter generation, PDF assembly, and document merging.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-16 max-w-3xl mx-auto">
          <PlanCard
            name="Solo"
            price="$49"
            planParam="solo"
            features={[
              "1 agent seat",
              "30 offer packages / month",
              "AI cover letter generation",
              "PDF assembly + document merge",
              "3 saved templates",
              "Email support",
            ]}
          />
          <PlanCard
            name="Team"
            price="$149"
            popular
            planParam="team"
            features={[
              "5 agent seats",
              "Unlimited offer packages",
              "AI cover letter generation",
              "White-label PDF branding",
              "Unlimited templates",
              "Priority support",
            ]}
          />
        </div>

        <div className="mt-24">
          <h2 className="serif text-3xl">Compare features</h2>
          <div className="card mt-6 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left px-6 py-4 label-xs">Feature</th>
                  <th className="text-center px-6 py-4 label-xs">Solo</th>
                  <th className="text-center px-6 py-4 label-xs">Team</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map(([label, solo, team]) => (
                  <tr key={label as string} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-6 py-4">{label as string}</td>
                    <td className="text-center px-6 py-4">{typeof solo === "boolean" ? (solo ? <Check size={16} className="inline text-[var(--color-accent)]" /> : <X size={16} className="inline text-[var(--color-text-sec)]" />) : solo}</td>
                    <td className="text-center px-6 py-4">{typeof team === "boolean" ? (team ? <Check size={16} className="inline text-[var(--color-accent)]" /> : <X size={16} className="inline text-[var(--color-text-sec)]" />) : team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-24 max-w-2xl mx-auto">
          <h2 className="serif text-3xl">Questions</h2>
          <div className="mt-6">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} open={openIdx === i} onClick={() => setOpenIdx(openIdx === i ? null : i)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
