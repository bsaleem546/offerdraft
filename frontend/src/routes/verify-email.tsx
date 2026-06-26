import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthShell } from "../components/AuthShell";
import { auth } from "../lib/api";

export const Route = createFileRoute("/verify-email")({
  head: () => ({ meta: [{ title: "Verify email — OfferDraft" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) ?? undefined }),
  component: Verify,
});

function Verify() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [cd, setCd] = useState(0);
  const [verifyState, setVerifyState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const email = localStorage.getItem("pending_verify_email") ?? "";

  // Auto-verify when token is present in URL
  useEffect(() => {
    if (!token) return;
    setVerifyState("loading");
    auth
      .verifyEmail(token)
      .then(() => {
        localStorage.removeItem("pending_verify_email");
        setVerifyState("success");
        setTimeout(() => navigate({ to: "/dashboard" }), 2000);
      })
      .catch(() => setVerifyState("error"));
  }, [token]);

  // Countdown for resend cooldown
  useEffect(() => {
    if (cd <= 0) return;
    const t = setTimeout(() => setCd(cd - 1), 1000);
    return () => clearTimeout(t);
  }, [cd]);

  if (token) {
    return (
      <AuthShell>
        <div className="max-w-md text-center">
          {verifyState === "loading" && (
            <>
              <Loader2 size={56} strokeWidth={1.2} className="mx-auto text-[var(--color-accent)] animate-spin" />
              <h1 className="serif text-3xl mt-6">Verifying your email…</h1>
            </>
          )}
          {verifyState === "success" && (
            <>
              <CheckCircle size={56} strokeWidth={1.2} className="mx-auto text-[var(--color-accent)]" />
              <h1 className="serif text-3xl mt-6">Email verified</h1>
              <p className="mt-3 text-[var(--color-text-sec)]">Redirecting you to the dashboard…</p>
            </>
          )}
          {verifyState === "error" && (
            <>
              <XCircle size={56} strokeWidth={1.2} className="mx-auto text-[var(--color-danger)]" />
              <h1 className="serif text-3xl mt-6">Link expired or invalid</h1>
              <p className="mt-3 text-[var(--color-text-sec)]">This verification link has already been used or has expired.</p>
              <Link to="/register" className="btn-primary inline-flex mt-6">Back to register</Link>
            </>
          )}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="max-w-md text-center">
        <Mail size={56} strokeWidth={1.2} className="mx-auto text-[var(--color-accent)]" />
        <h1 className="serif text-3xl mt-6">Check your inbox</h1>
        <p className="mt-3 text-[var(--color-text-sec)]">
          We sent a verification link to{" "}
          {email
            ? <strong className="text-[var(--color-text-pri)]">{email}</strong>
            : "your email address"
          }. Click it to activate your account.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            disabled={cd > 0}
            onClick={() => setCd(60)}
            className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cd > 0 ? `Resend in ${cd}s` : "Resend verification email"}
          </button>
          <Link to="/register" className="text-sm text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]">
            Wrong email? Go back
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
