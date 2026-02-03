import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { logout } from "@/app/login/actions";

const audienceUsers = [
  { name: "Budi Santoso", last: "2d ago", status: "success" },
  { name: "Siti Aminah", last: "5d ago", status: "success" },
  { name: "Rina Wati", last: "1w ago", status: "warning" },
  { name: "Agus Pratama", last: "1w ago", status: "success" },
  { name: "Dewi Lestari", last: "2w ago", status: "success" },
  { name: "Eko Saputra", last: "2w ago", status: "muted" },
  { name: "Linda Sari", last: "3w ago", status: "warning" },
];

const statusDot = (status: "success" | "warning" | "muted") => {
  if (status === "success") return "bg-[var(--success)]";
  if (status === "warning") return "bg-[var(--warning)]";
  return "bg-slate-300";
};

export default async function DashboardPage() {
  return (
    <AppShell
      active="Segment Builder"
      header={
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Segments &gt; New Segment
            </p>
            <h1 className="mt-2 font-[var(--font-sora)] text-3xl font-semibold">
              New Segment
            </h1>
            <p className="text-sm text-slate-500">
              Define your audience criteria based on behavior and data.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v10m0 0l-4-4m4 4l4-4M5 19h14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export
            </Button>
            <Button>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 5h11l3 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <path d="M8 5v6h6V5" stroke="white" strokeWidth="1.5" />
              </svg>
              Save Segment
            </Button>
            <form action={logout}>
              <Button variant="ghost">Sign out</Button>
            </form>
          </div>
        </div>
      }
      rightAside={
        <>
          <Card className="px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Audience Summary
              </p>
              <button className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 12a8 8 0 1 1-8-8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 4v6h-6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-semibold">1,240</p>
              <p className="text-sm text-slate-500">Matching Users</p>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 w-2/3 rounded-full bg-blue-600" />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Top 15% of your customer base
              </p>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Name</span>
                <span>Last Pur.</span>
                <span>Status</span>
              </div>
              <div className="mt-3 space-y-3 text-sm">
                {audienceUsers.map((user) => (
                  <div
                    key={user.name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-slate-700">{user.name}</span>
                    <span className="text-slate-500">{user.last}</span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${statusDot(
                        user.status,
                      )}`}
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full text-blue-600"
              >
                View All 1,240 Users
              </Button>
            </div>
          </Card>

          <Card className="px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Est. Campaign Cost
              </p>
              <Badge>via WhatsApp</Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold">Rp 2.450.000</p>
            <p className="text-xs text-slate-400">
              Based on audience size & channel fees.
            </p>
          </Card>
        </>
      }
    >
      <Card className="border-dashed px-6 py-10">
        <div className="mx-auto flex w-fit items-center gap-3 rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white">
          All Users
        </div>
        <div className="mt-10 space-y-6">
          <Card className="px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 3h10v18H7z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M9 8h6M9 12h6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold">
                    Transaction Criteria
                  </p>
                  <p className="text-xs text-slate-400">
                    Purchase behavior filters
                  </p>
                </div>
              </div>
              <button className="text-slate-400">...</button>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase text-slate-400">
                  Purchase includes:
                </span>
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  Reglow Serum
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs uppercase text-slate-400">And</span>
                <span className="text-xs text-slate-500">Value:</span>
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  &gt; Rp 150.000
                </span>
              </div>
            </div>
          </Card>

          <div className="flex justify-center">
            <Badge>AND</Badge>
          </div>

          <Card className="px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M8 3v4M16 3v4M5 11h14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold">Timeframe</p>
                  <p className="text-xs text-slate-400">Period selection</p>
                </div>
              </div>
              <button className="text-slate-400">...</button>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="text-xs uppercase text-slate-400">Period:</span>{" "}
              Jan 01, 2025 - Jan 31, 2025
            </div>
          </Card>

          <div className="flex justify-center">
            <Badge>AND</Badge>
          </div>

          <Card className="px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-50 text-purple-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="12"
                      cy="10"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold">Demographics</p>
                  <p className="text-xs text-slate-400">
                    Location-based targeting
                  </p>
                </div>
              </div>
              <button className="text-slate-400">...</button>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase text-slate-400">
                  Location is in:
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Jabodetabek
                </span>
              </div>
              <div className="mt-3 h-36 rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_20%_20%,#e0f2fe_0%,#f8fafc_48%,#eef2ff_100%)] p-4 text-xs text-slate-500">
                Map preview: Jakarta & surrounding area
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </AppShell>
  );
}
