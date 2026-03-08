"use client";

import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import * as XLSX from "xlsx";

function PreviewContent() {
  const searchParams = useSearchParams();
  const filePath = searchParams.get("filePath");
  const fileName = searchParams.get("fileName") || "file.csv";
  
  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!filePath) {
      setError("No file path provided");
      setLoading(false);
      return;
    }

    async function loadFile() {
      try {
        const response = await fetch(filePath);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        setData(jsonData);
      } catch (err) {
        console.error("Preview error:", err);
        setError("Failed to load file preview. Ensure the file exists in public/everpro-sync.");
      } finally {
        setLoading(false);
      }
    }

    loadFile();
  }, [filePath]);

  const headers = data[0] || [];
  const rows = data.slice(1);

  return (
    <div className="min-h-screen bg-[#f3f6fb] p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/everpro-sync">
              <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-full">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Preview: {fileName}</h1>
              <p className="text-sm text-slate-500">Read-only spreadsheet view</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Badge tone="info">Read Only</Badge>
             {loading && <div className="text-xs text-blue-600 animate-pulse font-semibold">Loading data...</div>}
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-12 text-center">
             <svg className="mx-auto h-12 w-12 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
             <p className="mt-4 text-sm font-semibold text-rose-700">{error}</p>
             <Link href="/everpro-sync" className="mt-4 inline-block text-xs font-bold text-blue-600 hover:underline">Go Back</Link>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    {headers.map((header, i) => (
                      <th key={i} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-r border-slate-100 last:border-r-0">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={headers.length || 1} className="py-20 text-center text-sm text-slate-400 font-medium italic">
                        No data found in this file.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        {headers.map((_, colIdx) => (
                          <td key={colIdx} className="px-5 py-3.5 text-sm text-slate-600 border-r border-slate-50 last:border-r-0 whitespace-nowrap">
                            {row[colIdx] === undefined || row[colIdx] === null ? "-" : String(row[colIdx])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              <p className="text-xs text-slate-400 font-medium">
                {rows.length} rows processed
              </p>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                Source: {fileName}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-400">Loading preview application...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
