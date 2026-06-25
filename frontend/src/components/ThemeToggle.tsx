import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed top-4 right-4 z-50 w-9 h-9 rounded-lg flex items-center justify-center
        bg-[var(--color-surface)] border border-[var(--color-border)]
        text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]
        hover:border-[var(--color-accent)] transition-colors shadow-sm"
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
