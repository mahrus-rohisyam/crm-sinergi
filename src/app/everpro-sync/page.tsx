import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { logout } from "@/app/login/actions";
import { CsvImport } from "@/components/everpro/CsvImport";

export default function EverproSyncPage() {
  return (
    <AppShell
      active="Everpro Sync"
      header={
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Integrations &gt; Everpro Sync
            </p>
            <h1 className="mt-2 font-[var(--font-sora)] text-3xl font-semibold">
              Everpro Sync
            </h1>
            <p className="text-sm text-slate-500">
              Import daftar pelanggan dan sinkronkan status blast.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">Download Template</Button>
            <Button>Sync Now</Button>
            <form action={logout}>
              <Button variant="ghost">Sign out</Button>
            </form>
          </div>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Import CSV</p>
              <p className="text-xs text-slate-500">
                Gunakan format kolom sesuai contoh.
              </p>
            </div>
            <Badge tone="info">CSV only</Badge>
          </div>
          <CsvImport />
        </Card>

        <div className="space-y-6">
          <Card className="px-6 py-6">
            <p className="text-sm font-semibold">Rules</p>
            <ul className="mt-3 list-disc pl-5 text-xs text-slate-500">
              <li>Gunakan delimiter koma (,).</li>
              <li>Format nomor HP: 62xxxx.</li>
              <li>Kolom wajib: no_hp, nama_customer.</li>
              <li>Status blast: Sudah atau Belum.</li>
            </ul>
          </Card>

          <Card className="px-6 py-6">
            <p className="text-sm font-semibold">Last Sync</p>
            <p className="mt-2 text-2xl font-semibold">2 Feb 2026</p>
            <p className="text-xs text-slate-400">
              1,240 customers updated
            </p>
            <Button variant="outline" size="sm" className="mt-4">
              View Logs
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
