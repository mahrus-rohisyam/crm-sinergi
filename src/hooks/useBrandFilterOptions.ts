import { useState, useEffect } from "react";

export type BrandFilterOptions = {
  skus: string[];
  csNames: string[];
  leadSources: string[];
};

type UseBrandFilterOptionsReturn = {
  options: BrandFilterOptions | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useBrandFilterOptions(
  clientId: number,
): UseBrandFilterOptionsReturn {
  const [options, setOptions] = useState<BrandFilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBrandOptions = async (clientId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/segments/brand-filter-options?client_id=${clientId}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOptions({
        skus: data.skus || [],
        csNames: data.csNames || [],
        leadSources: data.leadSources || [],
      });
      setIsLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setOptions({
        skus: [],
        csNames: [],
        leadSources: [],
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset options when clientId changes
    if (clientId) {
      fetchBrandOptions(clientId);
    } else {
      setOptions(null);
    }
  }, [clientId]);

  return {
    options,
    isLoading,
    error,
    refetch: () => {
      if (clientId) {
        fetchBrandOptions(clientId);
      }
    },
  };
}
