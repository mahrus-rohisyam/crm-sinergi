"use client";

import { useState } from "react";
import { useOrdersExport, type ExportBrand } from "@/hooks/useOrdersExport";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function OrdersExportPage() {
  const { exportOrders, isExporting, error } = useOrdersExport();
  const [selectedBrand, setSelectedBrand] = useState<ExportBrand>("Amura");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState("");

  const handleExport = async () => {
    await exportOrders({
      brand: selectedBrand,
      start_date: startDate || undefined,
      status: status || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Export Orders by Brand
          </h1>
          <p className="mt-2 text-gray-600">
            Export WMS orders using brand-specific templates
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Brand Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Brand
              </label>
              <div className="flex gap-4">
                {(["Amura", "Reglow"] as ExportBrand[]).map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="brand"
                      value={brand}
                      checked={selectedBrand === brand}
                      onChange={(e) =>
                        setSelectedBrand(e.target.value as ExportBrand)
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Start Date Filter */}
            <div>
              <label
                htmlFor="start_date"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Start Date (Optional)
              </label>
              <input
                type="date"
                id="start_date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Filter orders from this date onwards
              </p>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Order Status (Optional)
              </label>
              <input
                type="text"
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="e.g., completed, pending"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to export all statuses
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Export Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isExporting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Exporting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Export Orders
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Information Card */}
        <Card className="mt-6 bg-blue-50 p-6">
          <h3 className="mb-2 font-semibold text-blue-900">ℹ️ How it works</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
            <li>
              Select a brand to export orders using the brand-specific template
            </li>
            <li>
              Optionally filter by start date and order status to narrow down
              results
            </li>
            <li>The system will fetch all matching orders from the WMS API</li>
            <li>
              Orders will be exported to an Excel file using the template for
              the selected brand
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
