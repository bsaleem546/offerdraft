import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FilePlus,
  FolderOpen,
  Bookmark,
  User,
  CreditCard,
} from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/packages/new", label: "New Package", icon: FilePlus, accent: true },
  { to: "/packages", label: "My Packages", icon: FolderOpen },
  { to: "/templates", label: "Templates", icon: Bookmark },
  { to: "/account", label: "Account", icon: User },
  { to: "/billing", label: "Billing", icon: CreditCard },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen">
      <aside className="w-[240px] border-r border-[var(--color-border)] flex flex-col fixed h-screen bg-[var(--color-bg)] z-10">
        <div className="px-6 py-6 border-b border-[var(--color-border)]">
          <Link to="/dashboard" className="serif text-2xl text-[var(--color-accent)]">
            OfferDraft
          </Link>
          <div className="mt-2 inline-block label-xs px-2 py-0.5 rounded-sm border border-[var(--color-accent)] text-[var(--color-accent)]">
            Solo
          </div>
        </div>
        <nav className="flex-1 py-3">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.to || (n.to !== "/dashboard" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors border-l-2 ${
                  active
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-text-pri)]"
                    : "border-transparent text-[var(--color-text-sec)] hover:text-[var(--color-text-pri)] hover:bg-[var(--color-surface)]"
                } ${n.accent && !active ? "text-[var(--color-accent)]" : ""}`}
              >
                <Icon size={16} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent)] flex items-center justify-center text-sm font-semibold">
            EM
          </div>
          <div className="min-w-0">
            <div className="text-sm truncate">Elena Marquez</div>
            <div className="text-xs text-[var(--color-text-sec)] truncate">
              elena@marquezrealty.com
            </div>
          </div>
        </div>
      </aside>
      <main className="ml-[240px] flex-1 min-w-0">
        <div className="max-w-[1200px] mx-auto px-10 py-10">{children}</div>
      </main>
    </div>
  );
}
