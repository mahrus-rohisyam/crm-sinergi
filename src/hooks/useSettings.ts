import { useState, useEffect } from "react";

export type AppSettings = {
  id: string;
  appName: string;
  currency: string;
  currencySymbol: string;
  marketingCostPerCustomer: number;
  logoUrl: string | null;
  faviconUrl: string | null;
  updatedAt: string;
};

type UseSettingsReturn = {
  settings: AppSettings | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

/**
 * Custom hook to fetch and manage application settings
 * Uses client-side data fetching with caching
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/settings");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    refetch: fetchSettings,
  };
}

/**
 * Hook to update settings
 */
export function useUpdateSettings() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateSettings = async (data: Partial<AppSettings>): Promise<AppSettings | null> => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updated = await response.json();
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to update settings:", error);
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateSettings,
    isUpdating,
    error,
  };
}
