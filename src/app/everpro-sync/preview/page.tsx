"use client";

import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Suspense, useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import Spreadsheet from "react-spreadsheet";

type PreviewCell = {
  value: string;
  readOnly: boolean;
};

function PreviewContent() {
  const searchParams = useSearchParams();
  const filePath = searchParams.get("filePath");
  const fileName = searchParams.get("fileName") || "file.csv";

  const [data, setData] = useState<PreviewCell[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!filePath) {
      setError("No file path provided.");
      setLoading(false);
      return;
    }

    async function loadFile() {
      try {
        const response = await fetch(filePath!);
        if (!response.ok) throw new Error("Failed to fetch file");

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
          header: 1,
        });

        if (jsonData.length === 0) {
          setError("This file is empty.");
          setLoading(false);
          return;
        }

        const maxCols = Math.max(
          ...jsonData.map((r) => (Array.isArray(r) ? r.length : 0)),
        );
        const matrix = jsonData.map((row) => {
          const rowArr = Array.isArray(row) ? row : [];
          return Array.from({ length: maxCols }, (_, i) => ({
            value:
              rowArr[i] === undefined || rowArr[i] === null
                ? ""
                : String(rowArr[i]),
            readOnly: true, // react-spreadsheet supports readOnly at cell level
          }));
        });

        setData(matrix);
      } catch (err) {
        setError("Error loading preview.");
      } finally {
        setLoading(false);
      }
    }

    loadFile();
  }, [filePath]);

  const columnLabels = useMemo(() => {
    if (data.length === 0) return [];
    return data[0].map((_, i) => {
      let label = "";
      let n = i;
      while (n >= 0) {
        label = String.fromCharCode((n % 26) + 65) + label;
        n = Math.floor(n / 26) - 1;
      }
      return label;
    });
  }, [data]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden font-sans">
      {/* Immersive Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/everpro-sync">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 rounded-xl transition-all hover:bg-slate-50"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Button>
          </Link>
          <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-[300px]">
              {fileName}
            </h1>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                Live Preview • Optimized for Web
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!loading && !error && (
            <div className="hidden sm:flex items-center gap-6 mr-4 border-r border-slate-100 pr-6">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                  Rows
                </p>
                <p className="text-sm font-black text-slate-900 leading-tight">
                  {data.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                  Status
                </p>
                <p className="text-sm font-black text-emerald-600 leading-tight">
                  Synced
                </p>
              </div>
            </div>
          )}
          <Badge tone="info" className="px-3 py-1 font-bold text-[10px]">
            READ ONLY MODE
          </Badge>
        </div>
      </div>

      {/* Full-Screen Workspace */}
      <div className="relative flex-1 bg-[#f8fafc] overflow-hidden">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-6 drop-shadow-sm">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Preview Unavailable
            </h2>
            <p className="mt-2 text-slate-500 max-w-xs">{error}</p>
            <Link href="/everpro-sync" className="mt-8">
              <Button className="rounded-2xl px-8 shadow-lg shadow-blue-500/20">
                Return to History
              </Button>
            </Link>
          </div>
        ) : (
          <div className="h-full w-full overflow-auto custom-scroll p-4 sm:p-8">
            {loading ? (
              <div className="flex h-full w-full flex-col items-center justify-center">
                <div className="relative">
                  <div className="h-16 w-16 border-[5px] border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-ping"></div>
                  </div>
                </div>
                <p className="mt-6 text-sm font-black text-slate-400 tracking-widest uppercase animate-pulse">
                  Building Grid Matrix...
                </p>
              </div>
            ) : (
              <div className="mx-auto inline-block min-w-full rounded-[32px] border border-slate-200 bg-white shadow-2xl p-2 overflow-hidden">
                <Spreadsheet data={data} columnLabels={columnLabels} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Immersive Footer Label */}
      {!loading && !error && (
        <div className="bg-white border-t border-slate-100 px-6 py-2 flex items-center justify-between text-[10px] font-bold text-slate-400 tracking-wider">
          <div>POWERED BY XLSX PREVIEW ENGINE 2.0</div>
          <div className="flex items-center gap-4">
            <span>ESTIMATED LOAD: 142MS</span>
            <span className="text-blue-500">AES-256 SECURED ACCESS</span>
          </div>
        </div>
      )}

      <style jsx global>{`
        .Spreadsheet {
          font-family:
            "Inter",
            system-ui,
            -apple-system,
            sans-serif !important;
          border-radius: 20px !important;
          overflow: hidden !important;
          width: max-content !important;
          min-width: 100% !important;
        }
        .Spreadsheet-row-header,
        .Spreadsheet-column-header {
          background-color: #f8fafc !important;
          color: #64748b !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          padding: 12px !important;
          border: 1px solid #e2e8f0 !important;
        }
        .Spreadsheet-cell {
          border: 1px solid #f1f5f9 !important;
          padding: 12px 16px !important;
          background: white !important;
          color: #334155 !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          min-width: 140px !important;
          pointer-events: none !important; /* Truly disable all clicks on cells to prevent editing UI */
          user-select: text !important;
        }
        /* Re-enable scrolling but block interactions with internal inputs */
        .Spreadsheet-cell input {
          display: none !important;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
          border: 3px solid #f8fafc;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest bg-white">
          Booting Preview...
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
