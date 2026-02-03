"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const sp = useSearchParams();
  const hasError = Boolean(sp.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#e0ebff_0%,#f4f7fc_40%,#ffffff_100%)]">
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute right-10 top-10 h-40 w-40 rounded-full bg-slate-200/60 blur-2xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-600 text-white">
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
              <p className="text-lg font-semibold">CRM Suite</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Enterprise
              </p>
            </div>
          </div>

          <div>
            <h1 className="max-w-lg font-[var(--font-sora)] text-4xl font-semibold leading-tight text-slate-900">
              Control every customer touchpoint with precision segmentation.
            </h1>
            <p className="mt-3 max-w-md text-sm text-slate-500">
              Build audience intelligence, orchestrate multichannel campaigns,
              and keep your growth teams aligned in a single workspace.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
              ISO-ready compliance
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
              24/7 support
            </span>
          </div>
        </div>

        <Card className="w-full max-w-md px-8 py-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Welcome back</h2>
            <p className="text-sm text-slate-500">
              Please sign in with your enterprise account.
            </p>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);

              // NextAuth v4 akan redirect sendiri bila berhasil (callbackUrl)
              // Bila gagal, ia akan redirect balik ke /login?error=CredentialsSignin
              await signIn("credentials", {
                email,
                password,
                callbackUrl: "/dashboard",
              });

              setLoading(false);
            }}
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Email
              </label>
              <Input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Password
              </label>
              <Input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded" />
                Remember me
              </label>
              <button type="button" className="font-semibold text-blue-600">
                Forgot password?
              </button>
            </div>

            {hasError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                Email atau password salah.
              </p>
            ) : null}

            <Button
              type="submit"
              className="mt-2 w-full py-3"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            By continuing you agree to CRM Suite policies.
          </div>
        </Card>
      </div>
    </div>
  );
}
