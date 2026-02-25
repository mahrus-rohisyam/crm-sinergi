"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);

    try {
      const userId = (session?.user as { id?: string })?.id;
      if (!userId) {
        setProfileMsg({ type: "error", text: "Session tidak valid. Silakan login ulang." });
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (res.ok) {
        setProfileMsg({ type: "success", text: "Profil berhasil diperbarui." });
      } else {
        const data = await res.json();
        setProfileMsg({ type: "error", text: data.error || "Gagal menyimpan." });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Network error." });
    }

    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (!currentPassword) {
      setPwMsg({ type: "error", text: "Masukkan password saat ini." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "Password baru tidak cocok." });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ type: "error", text: "Password minimal 6 karakter." });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setPwMsg({ type: "success", text: "Password berhasil diubah." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwMsg({ type: "error", text: data.error || "Gagal mengubah password." });
      }
    } catch {
      setPwMsg({ type: "error", text: "Network error." });
    }

    setSaving(false);
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <AppShell active="">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Account
          </p>
          <h1 className="mt-2 font-[var(--font-sora)] text-3xl font-semibold">
            My Profile
          </h1>
          <p className="text-sm text-slate-500">
            Kelola informasi profil dan keamanan akun.
          </p>
        </div>

        {/* Profile Info */}
        <Card className="px-8 py-6">
          <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{name || "User"}</p>
              <p className="text-sm text-slate-500">{email}</p>
            </div>
          </div>

          {profileMsg && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                profileMsg.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password */}
        <Card className="px-8 py-6">
          <h3 className="text-base font-semibold">Change Password</h3>
          <p className="text-xs text-slate-500">Perbarui password akun Anda.</p>

          {pwMsg && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                pwMsg.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {pwMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password Saat Ini</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Change Password"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
