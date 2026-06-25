import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { useToast } from "../lib/toast";
import { AuthShell } from "../components/AuthShell";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — OfferDraft" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ plan: (s.plan as string) ?? undefined }),
  component: Register,
});

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function Register() {
  const { plan } = Route.useSearch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", pw: "", cpw: "", terms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schema = z.object({
    name: z.string().trim().min(2, "Enter your full name"),
    email: z.string().trim().email("Enter a valid email"),
    pw: z.string().min(8, "At least 8 characters"),
    cpw: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  }).refine((d) => d.pw === d.cpw, { message: "Passwords don't match", path: ["cpw"] });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.errors.forEach((er) => { errs[er.path[0] as string] = er.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    console.log("register", form);
    setTimeout(() => {
      setLoading(false);
      toast("success", "Account created");
      navigate({ to: "/onboarding" });
    }, 2000);
  };

  const st = strength(form.pw);
  const planLabel = plan === "team" ? { name: "Team Plan", price: "$149/month" } : plan === "solo" ? { name: "Solo Plan", price: "$49/month" } : null;

  return (
    <AuthShell>
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-6">
          <Link to="/" className="serif text-2xl text-[var(--color-accent)]">OfferDraft</Link>
        </div>
        <div className="card p-8">
          {planLabel && (
            <div className="mb-5 text-xs px-3 py-2 rounded-md border border-[var(--color-accent)] text-[var(--color-text-pri)] bg-[var(--color-accent-dim)]">
              You're signing up for the <strong>{planLabel.name}</strong> at {planLabel.price}
            </div>
          )}
          <h1 className="serif text-3xl">Create your account</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label-xs">Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base mt-2" style={errors.name ? { borderColor: "var(--color-danger)" } : {}} />
              {errors.name && <div className="text-xs text-[var(--color-danger)] mt-1">{errors.name}</div>}
            </div>
            <div>
              <label className="label-xs">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-base mt-2" style={errors.email ? { borderColor: "var(--color-danger)" } : {}} />
              {errors.email && <div className="text-xs text-[var(--color-danger)] mt-1">{errors.email}</div>}
            </div>
            <div>
              <label className="label-xs">Password</label>
              <div className="relative mt-2">
                <input type={show ? "text" : "password"} value={form.pw} onChange={(e) => setForm({ ...form, pw: e.target.value })} className="input-base pr-10" style={errors.pw ? { borderColor: "var(--color-danger)" } : {}} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-sec)]">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex gap-1 mt-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i < st ? "var(--color-accent)" : "var(--color-border)" }} />
                ))}
              </div>
              {errors.pw && <div className="text-xs text-[var(--color-danger)] mt-1">{errors.pw}</div>}
            </div>
            <div>
              <label className="label-xs">Confirm Password</label>
              <input type={show ? "text" : "password"} value={form.cpw} onChange={(e) => setForm({ ...form, cpw: e.target.value })} className="input-base mt-2" style={errors.cpw ? { borderColor: "var(--color-danger)" } : {}} />
              {errors.cpw && <div className="text-xs text-[var(--color-danger)] mt-1">{errors.cpw}</div>}
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} className="mt-1 accent-[var(--color-accent)]" />
              <span className="text-[var(--color-text-sec)]">I agree to the <a href="#" className="text-[var(--color-accent)] hover:underline">Terms of Service</a> and <a href="#" className="text-[var(--color-accent)] hover:underline">Privacy Policy</a></span>
            </label>
            {errors.terms && <div className="text-xs text-[var(--color-danger)]">{errors.terms}</div>}
            <button disabled={loading} type="submit" className="btn-primary w-full mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Account"}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-[var(--color-text-sec)]">
            Already have an account? <Link to="/login" className="text-[var(--color-accent)] hover:underline">Log in</Link>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
