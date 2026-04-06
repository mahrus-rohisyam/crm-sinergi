import { useState, useCallback } from "react";

export type CustomerPreview = {
  customerName: string;
  phoneNumber: string;
  lastPurchase: string;
  status: string;
  lastContact?: string | null;
  engagementStatus?: "contacted" | "not_contacted" | "unknown";
  blastStatus?: string;
};

export type SegmentPreview = {
  matchingCount: number;
  totalCount: number;
  percentage: number;
  customers: CustomerPreview[];
  _meta?: {
    method: string;
    accurate: boolean;
    sampleSize: number;
    totalPages?: number;
    estimatedApiCallsForFullSync?: number;
    everproEnriched?: boolean;
  };
};

type UseSegmentPreviewReturn = {
  preview: SegmentPreview | null;
  isLoading: boolean;
  error: Error | null;
  fetchPreview: (filters: unknown[]) => Promise<void>;
};

/**
 * Custom hook to preview segment results
 * Fetches matching customer count and sample data based on filters
 */
export function useSegmentPreview(): UseSegmentPreviewReturn {
  const [preview, setPreview] = useState<SegmentPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPreview = useCallback(async (filters: unknown[]) => {
    // Don't fetch if no filters
    if (!filters || filters.length === 0) {
      setPreview(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try {
          const errorPayload = (await response.json()) as {
            error?: string;
            details?: string;
          };
          if (errorPayload?.details) {
            message = errorPayload.details;
          } else if (errorPayload?.error) {
            message = errorPayload.error;
          }
        } catch {
          // Keep fallback message if response is not JSON.
        }
        throw new Error(message);
      }

      const data = await response.json();
      setPreview(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to fetch segment preview:", error);
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    preview,
    isLoading,
    error,
    fetchPreview,
  };
}
