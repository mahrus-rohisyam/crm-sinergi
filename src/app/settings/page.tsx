"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useEffect, useState, useRef } from "react";

type Settings = {
  appName: string;
  currency: string;
  currencySymbol: string;
  marketingCostPerCustomer: number;
  logoUrl: string | null;
  faviconUrl: string | null;
};

const currencies = [
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    appName: "CRM Suite",
    currency: "IDR",
    currencySymbol: "Rp",
    marketingCostPerCustomer: 610,
    logoUrl: null,
    faviconUrl: null,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings(data);
          if (data.logoUrl) setLogoPreview(data.logoUrl);
          if (data.faviconUrl) setFaviconPreview(data.faviconUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleCurrencyChange = (code: string) => {
    const found = currencies.find((c) => c.code === code);
    if (found) {
      setSettings({ ...settings, currency: found.code, currencySymbol: found.symbol });
    }
  };

  const handleFileUpload = (
    file: File | undefined,
    field: "logoUrl" | "faviconUrl",
    setPreview: (url: string) => void,
  ) => {
    if (!file) return;
    // Create a local preview
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Upload file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("field", field);

    fetch("/api/settings/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          setSettings((prev) => ({ ...prev, [field]: data.url }));
          setMessage({ type: "success", text: `${field === "logoUrl" ? "Logo" : "Favicon"} uploaded.` });
        }
      })
      .catch(() => {
        setMessage({ type: "error", text: "Upload failed." });
      });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings berhasil disimpan." });
      } else {
        setMessage({ type: "error", text: "Gagal menyimpan settings." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    }

    setSaving(false);
  };

  return (
    <AppShell
      active="Settings"
      header={
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Configuration
            </p>
            <h1 className="mt-2 font-[var(--font-sora)] text-3xl font-semibold">
              Settings
            </h1>
            <p className="text-sm text-slate-500">
              Atur branding, currency, dan preferensi aplikasi.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      }
    >
      {/* Feedback */}
      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Branding ─── */}
        <Card className="px-6 py-6">
          <h3 className="text-base font-semibold">Branding</h3>
          <p className="text-xs text-slate-500">Atur nama, logo, dan favicon aplikasi.</p>

          <div className="mt-5 space-y-5">
            {/* App Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Application Name</label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Logo</label>
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21,15 16,10 5,21" />
                    </svg>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Upload Logo
                  </button>
                  <p className="mt-1 text-xs text-slate-400">PNG, JPG, SVG. Max 2MB.</p>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0], "logoUrl", setLogoPreview)}
                  />
                </div>
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Favicon</label>
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                  {faviconPreview ? (
                    <img src={faviconPreview} alt="Favicon" className="h-full w-full object-contain p-1" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => faviconRef.current?.click()}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Upload Favicon
                  </button>
                  <p className="mt-1 text-xs text-slate-400">ICO, PNG. Recommended 32×32px.</p>
                  <input
                    ref={faviconRef}
                    type="file"
                    accept="image/*,.ico"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0], "faviconUrl", setFaviconPreview)}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Currency & Cost ─── */}
        <Card className="px-6 py-6">
          <h3 className="text-base font-semibold">Currency & Campaign Cost</h3>
          <p className="text-xs text-slate-500">Atur mata uang dan biaya marketing per customer.</p>

          <div className="mt-5 space-y-5">
            {/* Currency */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Symbol Preview */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Preview</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">
                {settings.currencySymbol} 1.000.000
              </p>
            </div>

            {/* Marketing Cost Per Customer */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Marketing Cost / Customer
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">{settings.currencySymbol}</span>
                <input
                  type="number"
                  value={settings.marketingCostPerCustomer}
                  onChange={(e) =>
                    setSettings({ ...settings, marketingCostPerCustomer: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <p className="text-xs text-slate-400">
                Digunakan untuk estimasi biaya campaign (jumlah customer × biaya per customer).
              </p>
            </div>

            {/* Example Calculation */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold text-blue-600">Example</p>
              <p className="mt-1 text-sm text-blue-800">
                1.000 customers × {settings.currencySymbol}{" "}
                {settings.marketingCostPerCustomer.toLocaleString()} ={" "}
                <span className="font-semibold">
                  {settings.currencySymbol}{" "}
                  {(1000 * settings.marketingCostPerCustomer).toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
