"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";

type Segment = {
  id: string;
  name: string;
  description: string | null;
  filters: Record<string, unknown>;
  resultCount: number;
  createdById: string;
  createdBy: { name: string | null; email: string };
  createdAt: string;
  updatedAt: string;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Icon Components ───────────────────────────────────────

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6,9 12,15 18,9" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

// ─── Tooltip wrapper ───────────────────────────────────────

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="tooltip-wrapper">
      {children}
      <span className="tooltip-label">{label}</span>
    </span>
  );
}

// ─── Filter label renderer ─────────────────────────────────

function renderFilterValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object" && !Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

function FilterBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}

// Marketing cost per customer (from settings, default Rp 610)
const COST_PER_CUSTOMER = 610;

export default function CampaignPage() {
  const router = useRouter();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [costPerCustomer, setCostPerCustomer] = useState(COST_PER_CUSTOMER);

  const fetchSegments = useCallback(async () => {
    try {
      const res = await fetch("/api/segments");
      if (res.ok) {
        const data = await res.json();
        setSegments(data);
      }
    } catch (err) {
      console.error("Failed to fetch segments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data?.marketingCostPerCustomer) {
          setCostPerCustomer(data.marketingCostPerCustomer);
        }
      }
    } catch {
      // use default
    }
  }, []);

  useEffect(() => {
    fetchSegments();
    fetchSettings();
  }, [fetchSegments, fetchSettings]);

  const handleDelete = async (segmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Hapus segment ini?")) return;

    try {
      const res = await fetch(`/api/segments/${segmentId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSegments();
        if (expandedId === segmentId) setExpandedId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async (segment: Segment, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement CSV export for this segment
    alert(`Export segment "${segment.name}" (${segment.resultCount} customers) — coming soon`);
  };

  const handleEdit = (segmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/campaign/segment/${segmentId}/edit`);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <AppShell
      active="Campaigns"
      header={
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Workspace &gt; Campaigns
            </p>
            <h1 className="mt-2 font-[var(--font-sora)] text-3xl font-semibold">
              Campaigns
            </h1>
            <p className="text-sm text-slate-500">
              Kelola segment audiens untuk campaign marketing Anda.
            </p>
          </div>
          <Button onClick={() => router.push("/campaign/segment/new")}>
            <PlusIcon />
            Add New Segment
          </Button>
        </div>
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Segments</p>
          <p className="mt-1 text-2xl font-semibold">{segments.length}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Audience</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600">
            {segments.reduce((sum, s) => sum + s.resultCount, 0).toLocaleString("id-ID")}
          </p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Est. Total Cost</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {formatCurrency(segments.reduce((sum, s) => sum + s.resultCount, 0) * costPerCustomer)}
          </p>
        </Card>
      </div>

      {/* Segments table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" id="segments-table">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4 w-8"></th>
                <th className="px-6 py-4">Segment Name</th>
                <th className="px-6 py-4">Campaign Cost</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4">Updated At</th>
                <th className="px-6 py-4">Created By</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                      <span>Loading segments...</span>
                    </div>
                  </td>
                </tr>
              ) : segments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <EmptyStateIcon />
                      <div>
                        <p className="font-medium text-slate-500">Belum ada segment</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Klik &ldquo;Add New Segment&rdquo; untuk membuat segment pertama.
                        </p>
                      </div>
                      <Button onClick={() => router.push("/campaign/segment/new")} size="sm">
                        <PlusIcon />
                        Add New Segment
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                segments.map((segment) => {
                  const isExpanded = expandedId === segment.id;
                  const campaignCost = segment.resultCount * costPerCustomer;

                  return (
                    <Fragment key={segment.id}>
                      <tr
                        onClick={() => toggleExpand(segment.id)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isExpanded
                            ? "bg-blue-50/60"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Expand chevron */}
                        <td className="px-6 py-4 text-slate-400">
                          <ChevronDownIcon open={isExpanded} />
                        </td>

                        {/* Segment name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                              {(segment.name || "S")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{segment.name}</p>
                              {segment.description && (
                                <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{segment.description}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Campaign cost */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-800">{formatCurrency(campaignCost)}</p>
                            <p className="text-xs text-slate-400">{segment.resultCount.toLocaleString("id-ID")} customers</p>
                          </div>
                        </td>

                        {/* Created at */}
                        <td className="px-6 py-4 text-slate-600">{formatDate(segment.createdAt)}</td>

                        {/* Updated at */}
                        <td className="px-6 py-4 text-slate-600">{formatDate(segment.updatedAt)}</td>

                        {/* Created by */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="grid h-7 w-7 place-items-center rounded-full bg-orange-100 text-[10px] font-semibold text-orange-700">
                              {(segment.createdBy?.name || segment.createdBy?.email || "U")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <span className="text-slate-600">{segment.createdBy?.name || segment.createdBy?.email || "—"}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip label="Edit">
                              <button
                                onClick={(e) => handleEdit(segment.id, e)}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                id={`edit-segment-${segment.id}`}
                              >
                                <EditIcon />
                              </button>
                            </Tooltip>
                            <Tooltip label="Download CSV">
                              <button
                                onClick={(e) => handleDownload(segment, e)}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                                id={`download-segment-${segment.id}`}
                              >
                                <DownloadIcon />
                              </button>
                            </Tooltip>
                            <Tooltip label="Delete">
                              <button
                                onClick={(e) => handleDelete(segment.id, e)}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                id={`delete-segment-${segment.id}`}
                              >
                                <DeleteIcon />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="bg-blue-50/30">
                          <td colSpan={7} className="px-8 py-5">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-slate-700">Segment Detail</h3>
                                <Badge tone="info">{segment.resultCount.toLocaleString("id-ID")} customers</Badge>
                              </div>

                              {/* Filters display */}
                              {segment.filters && Object.keys(segment.filters).length > 0 ? (
                                <div className="space-y-3">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Applied Filters</p>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(segment.filters).map(([key, value]) => (
                                      <FilterBadge
                                        key={key}
                                        label={key.replace(/_/g, " ")}
                                        value={renderFilterValue(key, value)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 italic">No filters configured yet.</p>
                              )}

                              {/* Meta info */}
                              <div className="mt-4 flex flex-wrap gap-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
                                <span>
                                  <span className="font-semibold text-slate-500">Created:</span>{" "}
                                  {formatDateTime(segment.createdAt)}
                                </span>
                                <span>
                                  <span className="font-semibold text-slate-500">Updated:</span>{" "}
                                  {formatDateTime(segment.updatedAt)}
                                </span>
                                <span>
                                  <span className="font-semibold text-slate-500">Est. Cost:</span>{" "}
                                  {formatCurrency(campaignCost)}
                                </span>
                                <span>
                                  <span className="font-semibold text-slate-500">Cost/Customer:</span>{" "}
                                  {formatCurrency(costPerCustomer)}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
