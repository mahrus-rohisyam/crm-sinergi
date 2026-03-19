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
 * @param brandIds - Optional array of brand names to filter results by
 */
export function useFilterOptions(brandIds?: string[]): UseFilterOptionsReturn {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const brandIdsKey = brandIds?.join(",") || "";

  const fetchOptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = new URL("/api/segments/filter-options", window.location.origin);
      if (brandIds && brandIds.length > 0) {
        url.searchParams.set("brand_ids", brandIds.join(","));
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
  }, [brandIds]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions, brandIdsKey]); // Re-fetch when brandIds change

  return {
    options,
    isLoading,
    error,
    refetch: fetchOptions,
  };
}
