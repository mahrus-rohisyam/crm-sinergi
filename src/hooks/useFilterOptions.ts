import { useState, useEffect } from "react";

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
 */
export function useFilterOptions(): UseFilterOptionsReturn {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOptions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/segments/filter-options");

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
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  return {
    options,
    isLoading,
    error,
    refetch: fetchOptions,
  };
}
