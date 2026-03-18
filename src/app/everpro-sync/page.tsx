"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useState, useRef, useEffect, useCallback } from "react";

type UploadStatus = "success" | "failed" | "uploading";

interface HistoryItem {
  id: string;
  fileName: string;
  filePath: string;
  status: UploadStatus;
  totalRows: number | string;
  createdAt: string;
}

export default function EverproSyncPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "error" | "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchHistory = useCallback(async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/everpro-sync/history?page=${page}&limit=${limit}`);
      const data = await res.json();
      if (data.items) {
        setHistory(data.items);
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages
        });
      }
    } catch (error) {
      showToast("Failed to load history", "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFileUpload = async (file: File) => {
    const allowedExtensions = ["csv", "xlsx", "xls"];
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      showToast("File unsupported. Please upload CSV or Excel files only.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    showToast("Uploading file...", "success");

    try {
      const res = await fetch("/api/everpro-sync/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        showToast("File uploaded and recorded successfully!", "success");
        fetchHistory(1); // Refresh history
      } else {
        showToast("Upload failed server-side.", "error");
      }
    } catch (error) {
      showToast("Upload failed.", "error");
    }
  };

  const deleteHistoryItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file and its history? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/everpro-sync/history?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("File removed from history.", "success");
        fetchHistory(pagination.page);
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete.", "error");
      }
    } catch (error) {
      showToast("Failed to delete.", "error");
    }
  };

  const downloadTemplate = () => {
    window.open("/templates/Template Import Data Everpro - Sheet1.csv", "_blank");
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };
  };

  return (
    <AppShell active="Everpro Sync">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-2xl border px-6 py-4 shadow-2xl transition-all duration-300 ${
          toast.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}>
          {toast.type === "error" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Everpro Manual Data Upload</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manually import your Everpro Excel exports to sync customer segments and update your database.
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate} className="gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Template
        </Button>
      </div>

      {/* Steps Section */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            step: "STEP 1",
            title: "Export Data",
            description: "Export your segments from the Everpro dashboard as .xlsx.",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            )
          },
          {
            step: "STEP 2",
            title: "Upload Here",
            description: "Drag and drop the exported file into the upload zone below.",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            )
          },
          {
            step: "STEP 3",
            title: "Validate & Map",
            description: "Review column mappings and validate the data integrity.",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            )
          }
        ].map((item, idx) => (
          <Card key={idx} className="p-6 transition-all hover:translate-y-[-2px] hover:shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              {item.icon}
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-blue-500">{item.step}</p>
            <h3 className="mt-1 text-base font-bold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">{item.description}</p>
          </Card>
        ))}
      </div>

      {/* Upload Zone */}
      <div className="mt-8">
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
          }}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 py-16 transition-all hover:bg-white hover:border-blue-300"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
              <line x1="9" y1="18" x2="15" y2="18" />
              <line x1="9" y1="12" x2="11" y2="12" />
            </svg>
          </div>
          <p className="mt-6 text-xl font-bold text-slate-900">Drop your Everpro export file here</p>
          <p className="mt-1 text-sm text-slate-500">
            or <span className="font-semibold text-blue-600">browse files</span> from your computer
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Supports .csv, .xlsx only (Max 20MB)
          </div>
        </div>
      </div>

      {/* Upload History */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Upload History</h2>
          <div className="flex items-center gap-3">
             <span className="text-xs text-slate-500">Show:</span>
             <select 
              value={pagination.limit}
              onChange={(e) => fetchHistory(1, parseInt(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-100"
             >
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
             </select>
          </div>
        </div>
        
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4 text-center">Upload Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Total Rows</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                   <td colSpan={5} className="py-12 text-center text-sm text-slate-400">Loading history...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-12 text-center text-sm text-slate-400">No uploads yet.</td>
                </tr>
              ) : (
                history.map((item) => {
                  const { date, time } = formatDate(item.createdAt);
                  return (
                  <tr key={item.id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          item.fileName.endsWith('.csv') ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{item.fileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-slate-600">{date}</span>
                      <span className="ml-2 text-[10px] text-slate-400 font-medium uppercase">{time}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <Badge tone={item.status === 'failed' ? 'danger' : item.status === 'uploading' ? 'warning' : 'success'}>
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            item.status === 'failed' ? 'bg-rose-500' : item.status === 'uploading' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-slate-600">{item.totalRows}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button 
                          onClick={() => window.open(`/everpro-sync/preview?filePath=${encodeURIComponent(item.filePath)}&fileName=${encodeURIComponent(item.fileName)}`, "_blank")}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Preview"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => window.open(item.filePath, "_blank")}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          title="Download"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => deleteHistoryItem(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Delete"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={pagination.page === 1}
              onClick={() => fetchHistory(pagination.page - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchHistory(i + 1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                    pagination.page === i + 1 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchHistory(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
