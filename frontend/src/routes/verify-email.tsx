import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/verify-email")({
  head: () => ({ meta: [{ title: "Verify email — OfferDraft" }] }),
  component: Verify,
});

function Verify() {
  const [cd, setCd] = useState(0);
  useEffect(() => {
    if (cd <= 0) return;
    const t = setTimeout(() => setCd(cd - 1), 1000);
    return () => clearTimeout(t);
  }, [cd]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 text-center">
      <div className="max-w-md">
        <Mail size={56} strokeWidth={1.2} className="mx-auto text-[var(--color-accent)]" />
        <h1 className="serif text-3xl mt-6">Check your inbox</h1>
        <p className="mt-3 text-[var(--color-text-sec)]">
          We sent a verification link to <strong className="text-[var(--color-text-pri)]">elena@marquezrealty.com</strong>. Click it to activate your account.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={() => { console.log("resend verify"); setCd(60); }}
            disabled={cd > 0}
            className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cd > 0 ? `Resend in ${cd}s` : "Resend verification email"}
          </button>
          <Link to="/register" className="text-sm text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]">
            Wrong email? Go back
          </Link>
        </div>
      </div>
    </div>
  );
}
