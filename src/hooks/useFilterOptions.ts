import { useState, useEffect, useCallback } from "react";

export type FilterOptions = {
  brands: string[];
  skus: string[];
  provinces: string[];
  cities: string[];
  districts: string[];
  csNames: string[];
  leadSources: string[];
  customerTypes: string[];
  expeditions: string[];
  transactionTypes: string[];
};

type UseFilterOptionsReturn = {
  options: FilterOptions | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Custom hook to fetch filter options for segment builder
 * Fetches dropdown options from Next.js API route (which proxies to WMS API)
 * @param brandIds - Optional array of brand names to filter results by. 
 *                   Pass undefined to skip fetching until ready (e.g., loading segment data)
 *                   Pass empty array or null to fetch all brands' data
 *                   Pass array with brand names to fetch filtered data
 */
export function useFilterOptions(brandIds?: string[] | null): UseFilterOptionsReturn {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Serialize brandIds for dependency tracking
  const brandIdsKey = brandIds === undefined ? "SKIP" : (brandIds?.join(",") || "ALL");

  useEffect(() => {
    const fetchOptions = async () => {
      // Skip fetching if brandIds is explicitly undefined (not ready yet)
      if (brandIdsKey === "SKIP") {
        console.log("[useFilterOptions] Skipping fetch - brandIds is undefined");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const url = new URL("/api/segments/filter-options", window.location.origin);
        // Only add brand_ids param if we have specific brands to filter by
        if (brandIdsKey !== "ALL") {
          url.searchParams.set("brand_ids", brandIdsKey);
          console.log("[useFilterOptions] Fetching with brands:", brandIdsKey);
        } else {
          console.log("[useFilterOptions] Fetching all brands data");
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("[useFilterOptions] Fetched options:", data);
        setOptions(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error("Failed to fetch filter options:", error);
        
        // Set default empty options on error
        setOptions({
          brands: [],
          skus: [],
          provinces: [],
          cities: [],
          districts: [],
          csNames: [],
          leadSources: [],
          customerTypes: [],
          expeditions: [],
          transactionTypes: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [brandIdsKey]); // Re-fetch when brandIdsKey changes

  const refetch = useCallback(async () => {
    // Re-fetch with current brandIdsKey
    if (brandIdsKey === "SKIP") return;
    
    try {
      setIsLoading(true);
      setError(null);

      const url = new URL("/api/segments/filter-options", window.location.origin);
      if (brandIdsKey !== "ALL") {
        url.searchParams.set("brand_ids", brandIdsKey);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOptions(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to fetch filter options:", error);
    } finally {
      setIsLoading(false);
    }
  }, [brandIdsKey]);

  return {
    options,
    isLoading,
    error,
    refetch,
  };
}
