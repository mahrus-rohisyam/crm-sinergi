"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { logout } from "@/app/login/actions";

type AppSettings = {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
};

const navItems = [
  {
    label: "Campaigns",
    href: "/",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Everpro Sync",
    href: "/everpro-sync",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 4v5h5M20 20v-5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.5 9A9 9 0 0 0 5.6 5.6L4 4m0 0v5M3.5 15a9 9 0 0 0 14.9 3.4L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/users",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

type AppShellProps = {
  active: string;
  header?: ReactNode;
  children: ReactNode;
  rightAside?: ReactNode;
};

export function AppShell({ active, header, children, rightAside }: AppShellProps) {
  const { data: session } = useSession();
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: "CRM Suite",
    logoUrl: null,
    faviconUrl: null,
  });

  // Load app settings (name, logo, favicon) from DB
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setAppSettings({
            appName: data.appName || "CRM Suite",
            logoUrl: data.logoUrl || null,
            faviconUrl: data.faviconUrl || null,
          });

          // Dynamically update browser favicon
          if (data.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
            if (!link) {
              link = document.createElement("link");
              link.rel = "icon";
              document.head.appendChild(link);
            }
            link.href = data.faviconUrl;
          }

          // Dynamically update page title
          if (data.appName) {
            document.title = data.appName;
          }
        }
      })
      .catch(() => {});
  }, []);

  // Derive user info from session
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--text-strong)]">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-[var(--border)] bg-white/85 backdrop-blur">
          {/* Brand — dynamic from settings - Top */}
          <div className="flex items-center gap-3 px-6 py-6">
            {appSettings.logoUrl ? (
              <img
                src={appSettings.logoUrl}
                alt="Logo"
                className="h-11 w-11 rounded-2xl object-contain"
              />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-600 text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3.5l6.5 3.6v7.2L12 18.9 5.5 14.3V7.1L12 3.5z" stroke="white" strokeWidth="1.5" />
                  <path d="M8 9.2l4 2.1 4-2.1M12 11.3v4.6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <div>
              <p className="text-base font-semibold">{appSettings.appName}</p>
              <p className="text-xs text-slate-500">Enterprise</p>
            </div>
          </div>

          {/* Navigation - Middle (scrollable if items too many, but pushed down) */}
          <nav className="flex-1 overflow-y-auto px-3">
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
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User card & Sign out - Bottom */}
          <div className="border-t border-[var(--border)] px-6 pb-6 pt-4">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:bg-slate-50"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                {initials}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold">{userName}</p>
                <p className="truncate text-xs text-slate-500">{userEmail}</p>
              </div>
            </Link>
            <form action={logout} className="mt-2 text-red-100">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content Area - Scrollable */}
        <div className="flex flex-1 overflow-y-auto">
          <div className="flex w-full gap-6 px-6 py-6">
            <main className="flex-1 space-y-6">
              {header}
              {children}
            </main>
            {rightAside ? <aside className="w-80 space-y-6">{rightAside}</aside> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
