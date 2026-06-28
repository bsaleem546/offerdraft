import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthShell } from "../components/AuthShell";
import { auth } from "../lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — OfferDraft" }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    auth.forgotPassword(email)
      .then(() => { setSent(true); setCooldown(60); })
      .finally(() => setLoading(false));
  };

  const resend = () => {
    setLoading(true);
    auth.forgotPassword(email)
      .then(() => setCooldown(60))
      .finally(() => setLoading(false));
  };

  return (
    <AuthShell>
      <div className="w-full max-w-[400px]">
        <Link to="/login" className="text-sm text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)] flex items-center gap-2 mb-6">
          <ArrowLeft size={14} /> Back to login
        </Link>
        <div className="card p-8">
          {!sent ? (
            <>
              <h1 className="serif text-3xl">Reset your password</h1>
              <p className="mt-2 text-sm text-[var(--color-text-sec)]">Enter your email and we'll send a reset link.</p>
              <form onSubmit={send} className="mt-6 space-y-4">
                <div>
                  <label className="label-xs">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-base mt-2" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <Mail size={40} className="mx-auto text-[var(--color-accent)]" />
              <h2 className="serif text-2xl mt-4">Check your inbox</h2>
              <p className="mt-2 text-sm text-[var(--color-text-sec)]">
                If <strong className="text-[var(--color-text-pri)]">{email}</strong> exists in our system, a reset link is on its way. It expires in 30 minutes.
              </p>
              <button
                onClick={resend}
                disabled={cooldown > 0 || loading}
                className="mt-6 text-sm text-[var(--color-accent)] hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend email"}
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
