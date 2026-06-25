import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "../lib/toast";
import { AuthShell } from "../components/AuthShell";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — OfferDraft" }] }),
  component: Reset,
});

function Reset() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");

  const reqs = [
    { label: "8+ characters", ok: pw.length >= 8 },
    { label: "1 uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "1 number", ok: /\d/.test(pw) },
  ];

  const valid = reqs.every((r) => r.ok) && pw === cpw && cpw.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    console.log("reset");
    toast("success", "Password updated. Log in with your new password.");
    navigate({ to: "/login" });
  };

  return (
    <AuthShell>
      <div className="w-full max-w-[400px]">
        <Link to="/login" className="text-sm text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)] flex items-center gap-2 mb-6">
          <ArrowLeft size={14} /> Back to login
        </Link>
        <div className="card p-8">
          <h1 className="serif text-3xl">Set a new password</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label-xs">New password</label>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="input-base mt-2" />
            </div>
            <div>
              <label className="label-xs">Confirm new password</label>
              <input type="password" value={cpw} onChange={(e) => setCpw(e.target.value)} className="input-base mt-2" />
              {cpw && cpw !== pw && <div className="text-xs text-[var(--color-danger)] mt-1">Passwords don't match</div>}
            </div>
            <ul className="text-xs space-y-1.5 mt-4">
              {reqs.map((r) => (
                <li key={r.label} className="flex items-center gap-2" style={{ color: r.ok ? "var(--color-success)" : "var(--color-text-sec)" }}>
                  <Check size={12} /> {r.label}
                </li>
              ))}
            </ul>
            <button disabled={!valid} type="submit" className="btn-primary w-full mt-2">Update password</button>
          </form>
        </div>
      </div>
    </AuthShell>
  );
}
