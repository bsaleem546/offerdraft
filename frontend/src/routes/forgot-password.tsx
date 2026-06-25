import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — OfferDraft" }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("forgot", email);
    setSent(true);
    setCooldown(60);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
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
                <button type="submit" className="btn-primary w-full">Send reset link</button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <Mail size={40} className="mx-auto text-[var(--color-accent)]" />
              <h2 className="serif text-2xl mt-4">Check your inbox</h2>
              <p className="mt-2 text-sm text-[var(--color-text-sec)]">
                We sent a link to <strong className="text-[var(--color-text-pri)]">{email}</strong>. It expires in 30 minutes.
              </p>
              <button
                onClick={() => { console.log("resend"); setCooldown(60); }}
                disabled={cooldown > 0}
                className="mt-6 text-sm text-[var(--color-accent)] hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend email"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
