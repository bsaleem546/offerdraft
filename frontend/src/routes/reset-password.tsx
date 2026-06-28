import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "../lib/toast";
import { AuthShell } from "../components/AuthShell";
import { auth } from "../lib/api";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — OfferDraft" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) ?? "" }),
  component: Reset,
});

function Reset() {
  const { token } = Route.useSearch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== cpw) { setError("Passwords don't match"); return; }
    if (!token) { setError("Invalid or missing reset token. Please request a new link."); return; }
    setError("");
    setLoading(true);
    auth.resetPassword(token, pw)
      .then(() => {
        toast("success", "Password updated. Log in with your new password.");
        navigate({ to: "/login" });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <AuthShell>
      <div className="w-full max-w-[400px]">
        <Link to="/login" className="text-sm text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)] flex items-center gap-2 mb-6">
          <ArrowLeft size={14} /> Back to login
        </Link>
        <div className="card p-8">
          <h1 className="serif text-3xl">Set a new password</h1>
          {!token && (
            <div className="mt-4 text-sm text-[var(--color-danger)]">
              Invalid or missing reset token. Please <Link to="/forgot-password" className="underline">request a new link</Link>.
            </div>
          )}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label-xs">New password</label>
              <div className="relative mt-2">
                <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} className="input-base pr-10" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-sec)]">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label-xs">Confirm new password</label>
              <input type={show ? "text" : "password"} value={cpw} onChange={(e) => setCpw(e.target.value)} className="input-base mt-2" />
              {cpw && cpw !== pw && <div className="text-xs text-[var(--color-danger)] mt-1">Passwords don't match</div>}
            </div>
            {error && <div className="text-xs text-[var(--color-danger)]">{error}</div>}
            <button disabled={loading || !token} type="submit" className="btn-primary w-full mt-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </AuthShell>
  );
}
