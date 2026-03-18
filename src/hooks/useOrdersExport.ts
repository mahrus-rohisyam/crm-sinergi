import { useState } from "react";

export type ExportBrand = "Amura" | "Reglow" | "Purela";

export type ExportFilters = {
  brand: ExportBrand;
  start_date?: string; // YYYY-MM-DD
  status?: string;
};

export function useOrdersExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportOrders = async (filters: ExportFilters) => {
    setIsExporting(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        brand: filters.brand,
      });

      if (filters.start_date) {
        params.set("start_date", filters.start_date);
      }

      if (filters.status) {
        params.set("status", filters.status);
      }

      const response = await fetch(`/api/wms/orders/export?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename =
        filenameMatch?.[1] || `${filters.brand}_Orders_Export.xlsx`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Export failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportOrders,
    isExporting,
    error,
  };
}
