import { Check } from "lucide-react";

export function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border ${
                  done
                    ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-text-inv)]"
                    : active
                    ? "bg-[var(--color-accent-dim)] border-[var(--color-accent)] text-[var(--color-accent)] pulse-ring"
                    : "bg-transparent border-[var(--color-border)] text-[var(--color-text-sec)]"
                }`}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`label-xs whitespace-nowrap ${
                  done || active ? "text-[var(--color-text-pri)]" : ""
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-3 mb-6"
                style={{
                  background:
                    i < current
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
