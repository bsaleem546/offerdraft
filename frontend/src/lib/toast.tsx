import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; type: ToastType; message: string };

const ToastCtx = createContext<{ toast: (type: ToastType, message: string) => void }>({
  toast: () => {},
});

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => {
          const Icon = t.type === "success" ? CheckCircle2 : t.type === "error" ? XCircle : Info;
          const color = t.type === "success" ? "var(--color-success)" : t.type === "error" ? "var(--color-danger)" : "var(--color-accent)";
          return (
            <div
              key={t.id}
              className="card flex items-start gap-3 px-4 py-3 shadow-lg animate-[slideIn_.2s_ease]"
              style={{ minWidth: 280 }}
            >
              <Icon size={18} style={{ color, flexShrink: 0, marginTop: 2 }} />
              <div className="text-sm flex-1">{t.message}</div>
              <button
                onClick={() => setToasts((arr) => arr.filter((x) => x.id !== t.id))}
                className="text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)]"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
