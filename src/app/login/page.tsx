"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const sp = useSearchParams();
  const hasError = Boolean(sp.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* ───── LEFT PANEL: Dark branded hero ───── */}
      <div className="relative hidden w-1/2 overflow-hidden bg-[#0a0f1e] lg:flex lg:flex-col lg:justify-end">
        {/* Animated constellation / network background */}
        <div className="pointer-events-none absolute inset-0">
          {/* Large radial glow – top-right */}
          <div className="absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(56,140,255,0.25)_0%,transparent_70%)]" />
          {/* Medium glow – center */}
          <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,140,255,0.15)_0%,transparent_70%)]" />
          {/* Small accent – bottom-left */}
          <div className="absolute -bottom-10 -left-10 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(56,140,255,0.12)_0%,transparent_70%)]" />

          {/* SVG network lines */}
          <svg
            className="absolute inset-0 h-full w-full opacity-30"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Dots */}
            <circle cx="15%" cy="18%" r="2" fill="#3b82f6" opacity="0.8">
              <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="45%" cy="10%" r="2.5" fill="#60a5fa" opacity="0.7">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="70%" cy="22%" r="2" fill="#3b82f6" opacity="0.9">
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="25%" cy="40%" r="3" fill="#60a5fa" opacity="0.6">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="55%" cy="35%" r="2" fill="#93c5fd" opacity="0.5">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="80%" cy="45%" r="2.5" fill="#3b82f6" opacity="0.7">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="10%" cy="60%" r="2" fill="#60a5fa" opacity="0.6">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="38%" cy="55%" r="3" fill="#3b82f6" opacity="0.8">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="65%" cy="60%" r="2" fill="#93c5fd" opacity="0.5">
              <animate attributeName="opacity" values="0.2;0.6;0.2" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="85%" cy="70%" r="2.5" fill="#60a5fa" opacity="0.7">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="50%" cy="75%" r="2" fill="#3b82f6" opacity="0.6">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="20%" cy="80%" r="2.5" fill="#60a5fa" opacity="0.5">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4.5s" repeatCount="indefinite" />
            </circle>

            {/* Connection lines */}
            <line x1="15%" y1="18%" x2="45%" y2="10%" stroke="#3b82f6" strokeWidth="0.5" opacity="0.2" />
            <line x1="45%" y1="10%" x2="70%" y2="22%" stroke="#3b82f6" strokeWidth="0.5" opacity="0.15" />
            <line x1="15%" y1="18%" x2="25%" y2="40%" stroke="#60a5fa" strokeWidth="0.5" opacity="0.2" />
            <line x1="25%" y1="40%" x2="55%" y2="35%" stroke="#3b82f6" strokeWidth="0.5" opacity="0.15" />
            <line x1="55%" y1="35%" x2="70%" y2="22%" stroke="#60a5fa" strokeWidth="0.5" opacity="0.1" />
            <line x1="55%" y1="35%" x2="80%" y2="45%" stroke="#3b82f6" strokeWidth="0.5" opacity="0.15" />
            <line x1="25%" y1="40%" x2="38%" y2="55%" stroke="#60a5fa" strokeWidth="0.5" opacity="0.2" />
            <line x1="38%" y1="55%" x2="65%" y2="60%" stroke="#3b82f6" strokeWidth="0.5" opacity="0.15" />
            <line x1="80%" y1="45%" x2="85%" y2="70%" stroke="#60a5fa" strokeWidth="0.5" opacity="0.15" />
            <line x1="65%" y1="60%" x2="85%" y2="70%" stroke="#3b82f6" strokeWidth="0.5" opacity="0.1" />
            <line x1="10%" y1="60%" x2="38%" y2="55%" stroke="#60a5fa" strokeWidth="0.5" opacity="0.2" />
            <line x1="10%" y1="60%" x2="20%" y2="80%" stroke="#3b82f6" strokeWidth="0.5" opacity="0.15" />
            <line x1="38%" y1="55%" x2="50%" y2="75%" stroke="#60a5fa" strokeWidth="0.5" opacity="0.15" />
            <line x1="50%" y1="75%" x2="20%" y2="80%" stroke="#3b82f6" strokeWidth="0.5" opacity="0.1" />
          </svg>
        </div>

        {/* Content pinned bottom-left */}
        <div className="relative z-10 px-12 pb-16">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="4" fill="#60a5fa" />
                <circle cx="16" cy="5" r="2.5" fill="#3b82f6" />
                <circle cx="25.5" cy="10.5" r="2.5" fill="#3b82f6" />
                <circle cx="25.5" cy="21.5" r="2.5" fill="#3b82f6" />
                <circle cx="16" cy="27" r="2.5" fill="#3b82f6" />
                <circle cx="6.5" cy="21.5" r="2.5" fill="#3b82f6" />
                <circle cx="6.5" cy="10.5" r="2.5" fill="#3b82f6" />
                <line x1="16" y1="12" x2="16" y2="7.5" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                <line x1="19.5" y1="14" x2="23.5" y2="11.5" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                <line x1="19.5" y1="18" x2="23.5" y2="20.5" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                <line x1="16" y1="20" x2="16" y2="24.5" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                <line x1="12.5" y1="18" x2="8.5" y2="20.5" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
                <line x1="12.5" y1="14" x2="8.5" y2="11.5" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">SegmentFlow</span>
          </div>

          {/* Headline */}
          <h1 className="max-w-md font-[var(--font-sora)] text-[2.6rem] font-bold leading-[1.15] text-white">
            Power your CRM with precision segmentation.
          </h1>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-slate-400">
            Unlock deeper customer insights and drive retention with our
            AI-driven enterprise segmentation engine.
          </p>
        </div>
      </div>

      {/* ───── RIGHT PANEL: Login form ───── */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 lg:w-1/2">
        {/* Mobile-only branding */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-slate-900 to-blue-600">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="4" fill="#60a5fa" />
              <circle cx="16" cy="5" r="2.5" fill="white" />
              <circle cx="25.5" cy="10.5" r="2.5" fill="white" />
              <circle cx="25.5" cy="21.5" r="2.5" fill="white" />
              <circle cx="16" cy="27" r="2.5" fill="white" />
              <circle cx="6.5" cy="21.5" r="2.5" fill="white" />
              <circle cx="6.5" cy="10.5" r="2.5" fill="white" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-slate-900">SegmentFlow</span>
        </div>

        <div className="w-full max-w-[420px]">
          {/* Heading */}
          <h2 className="font-[var(--font-sora)] text-[1.75rem] font-bold text-slate-900">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to your account to continue
          </p>

          {/* Form */}
          <form
            className="mt-8 space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              await signIn("credentials", {
                email,
                password,
                callbackUrl: "/dashboard",
              });
              setLoading(false);
            }}
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-sm font-medium text-slate-700"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    /* Eye open */
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    /* Eye closed */
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Forgot Password?
              </button>
            </div>

            {/* Error */}
            {hasError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Email atau password salah.
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
