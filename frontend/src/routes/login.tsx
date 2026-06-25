import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "../lib/toast";
import { AuthShell } from "../components/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — OfferDraft" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [errors, setErrors] = useState<{ email?: string; pw?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!/.+@.+\..+/.test(email)) errs.email = "Enter a valid email address";
    if (pw.length < 6) errs.pw = "Password must be at least 6 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    console.log("login", { email });
    setTimeout(() => {
      setLoading(false);
      toast("success", "Welcome back");
      navigate({ to: "/dashboard" });
    }, 2000);
  };

  return (
    <AuthShell>
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-6">
          <Link to="/" className="serif text-2xl text-[var(--color-accent)]">OfferDraft</Link>
        </div>
        <div className="card p-8">
          <h1 className="serif text-3xl">Welcome back</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label-xs">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-base mt-2" style={errors.email ? { borderColor: "var(--color-danger)" } : {}} />
              {errors.email && <div className="text-xs text-[var(--color-danger)] mt-1">{errors.email}</div>}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label-xs">Password</label>
                <Link to="/forgot-password" className="text-xs text-[var(--color-accent)] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative mt-2">
                <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} className="input-base pr-10" style={errors.pw ? { borderColor: "var(--color-danger)" } : {}} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-sec)]">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.pw && <div className="text-xs text-[var(--color-danger)] mt-1">{errors.pw}</div>}
            </div>
            <button disabled={loading} type="submit" className="btn-primary w-full mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Log in"}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-[var(--color-text-sec)]">
            Don't have an account? <Link to="/register" className="text-[var(--color-accent)] hover:underline">Get started</Link>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
