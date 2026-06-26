import { Sun, Moon, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTheme } from "../hooks/use-theme";

export function AuthShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-1.5 text-sm
          text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)] transition-colors"
      >
        <ArrowLeft size={14} /> Home
      </Link>
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center
          text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]
          bg-[var(--color-surface)] border border-[var(--color-border)]
          hover:border-[var(--color-accent)] transition-colors"
      >
        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      </button>
      {children}
    </div>
  );
}
