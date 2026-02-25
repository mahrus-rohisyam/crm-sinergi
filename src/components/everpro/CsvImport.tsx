"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";

const sampleHeaders = [
  "no_hp",
  "nama_customer",
  "sudah_diblast?",
  "terakhir_diblast",
];

type CsvRow = Record<string, string>;

const sampleRows: CsvRow[] = [
  {
    no_hp: "6282211655299",
    nama_customer: "Mahrus Rohisyam",
    "sudah_diblast?": "Sudah",
    terakhir_diblast: "2-Feb-26",
  },
  {
    no_hp: "6282125301285",
    nama_customer: "John Doe",
    "sudah_diblast?": "Belum",
    terakhir_diblast: "-",
  },
];

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: sampleHeaders, rows: sampleRows };
  const headers = lines[0].split(",").map((value) => value.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] || "";
      return acc;
    }, {});
  });
  return { headers, rows };
}

export function CsvImport() {
  const [headers, setHeaders] = useState<string[]>(sampleHeaders);
  const [rows, setRows] = useState<CsvRow[]>(sampleRows);
  const [fileName, setFileName] = useState("sample.csv");
  const [error, setError] = useState("");

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
    }),
    [headers.length]
  );

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setError("File harus berekstensi .csv");
      return;
    }
    const text = await file.text();
    const parsed = parseCsv(text);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setFileName(file.name);
    setError("");
  };

  return (
    <div className="mt-4">
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Drop file CSV di sini
        </p>
        <p className="text-xs text-slate-400">
          atau klik untuk pilih file dari komputer.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(event) => handleFile(event.target.files?.[0])}
          className="mt-4 w-full cursor-pointer text-xs text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
        />
        {error ? (
          <p className="mt-3 text-xs font-semibold text-red-500">{error}</p>
        ) : null}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Preview Data</p>
          <Badge>
            {rows.length} rows • {fileName}
          </Badge>
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
          <div
            className="grid bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white"
            style={gridStyle}
          >
            {headers.map((header) => (
              <span key={header}>{header}</span>
            ))}
          </div>
          {rows.map((row, index) => (
            <div
              key={`${row[headers[0]] ?? index}`}
              className="grid items-center gap-2 px-4 py-3 text-sm text-slate-700 odd:bg-white even:bg-slate-50"
              style={gridStyle}
            >
              {headers.map((header) => (
                <span key={`${header}-${index}`}>{row[header]}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
