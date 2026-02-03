import type { ReactNode } from "react";
import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Segment Builder", href: "/dashboard" },
  { label: "Campaigns", href: "/dashboard" },
  { label: "Everpro Sync", href: "/everpro-sync" },
  { label: "Settings", href: "/dashboard" },
];

type AppShellProps = {
  active: string;
  header?: ReactNode;
  children: ReactNode;
  rightAside?: ReactNode;
};

export function AppShell({ active, header, children, rightAside }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-strong)]">
      <div className="flex min-h-screen">
        <aside className="w-72 shrink-0 border-r border-[var(--border)] bg-white/85 backdrop-blur">
          <div className="flex items-center gap-3 px-6 py-6">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-600 text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3.5l6.5 3.6v7.2L12 18.9 5.5 14.3V7.1L12 3.5z"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 9.2l4 2.1 4-2.1M12 11.3v4.6"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold">CRM Suite</p>
              <p className="text-xs text-slate-500">Enterprise</p>
            </div>
          </div>
          <nav className="px-3">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Workspace
            </p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = item.label === active;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-xl border ${
                        isActive ? "border-blue-200" : "border-slate-200"
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 6h6v6H5V6zm8 0h6v6h-6V6zm-8 8h6v6H5v-6zm8 0h6v6h-6v-6z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="mt-auto px-6 pb-6 pt-8">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-orange-700">
                AU
              </div>
              <div>
                <p className="text-sm font-semibold">Admin User</p>
                <p className="text-xs text-slate-500">admin@company.com</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 gap-6 px-6 py-6">
          <main className="flex-1 space-y-6">
            {header}
            {children}
          </main>
          {rightAside ? <aside className="w-80 space-y-6">{rightAside}</aside> : null}
        </div>
      </div>
    </div>
  );
}
