import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-6">
      <div className="card w-full max-w-lg px-8 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          CRM Suite
        </p>
        <h1 className="mt-4 font-[var(--font-sora)] text-4xl font-semibold">
          404
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Page not found. The segment you are looking for doesn’t exist yet.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/segment-builder"
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Back to dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}
