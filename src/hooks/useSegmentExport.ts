import { useState } from "react";

export function useSegmentExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportSegment = async (segmentId: string, segmentName: string) => {
    setIsExporting(true);
    setError(null);

    try {
      console.log(`Starting export for segment: ${segmentName} (${segmentId})`);
      
      const response = await fetch(`/api/segments/${segmentId}/export`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`Export response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Export error:', errorData);
        throw new Error(errorData.error || "Export failed");
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `${segmentName}_export.xlsx`;

      console.log(`Downloading file: ${filename}`);

      // Download the file
      const blob = await response.blob();
      console.log(`Excel file size: ${blob.size} bytes`);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      console.log('Export completed successfully');
      return { success: true };
    } catch (err) {
      console.error('Export error:', err);
      const errorMessage = err instanceof Error ? err.message : "Export failed";
      setError(errorMessage);
      alert(`Export failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportSegment,
    isExporting,
    error,
  };
}
