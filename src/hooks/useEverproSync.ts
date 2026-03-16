import { useState, useCallback } from "react";

export type EverproUploadHistory = {
  id: string;
  fileName: string;
  filePath: string;
  status: "success" | "failed" | "uploading";
  totalRows: number;
  createdAt: string;
  updatedAt: string;
};

export type EverproSyncStats = {
  totalContacts: number;
  contactedCount: number;
  notContactedCount: number;
  lastSyncDate: string | null;
  lastSyncDisplay: string;
  lastUploadDate: string | null;
  lastUploadFileName: string | null;
  hasData: boolean;
};

type UseEverproHistoryReturn = {
  history: EverproUploadHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: Error | null;
  fetchHistory: (page?: number, limit?: number) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<boolean>;
  uploadFile: (file: File) => Promise<boolean>;
};

/**
 * Custom hook to manage Everpro sync history
 */
export function useEverproHistory(): UseEverproHistoryReturn {
  const [history, setHistory] = useState<EverproUploadHistory[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async (page = 1, limit = 10) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/everpro-sync/history?page=${page}&limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items) {
        setHistory(data.items);
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to fetch Everpro history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteHistoryItem = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/everpro-sync/history?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refetch after successful delete
      await fetchHistory(pagination.page, pagination.limit);
      return true;
    } catch (err) {
      console.error("Failed to delete history item:", err);
      return false;
    }
  };

  const uploadFile = async (file: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/everpro-sync/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      // Refetch history after successful upload
      await fetchHistory(1, pagination.limit);
      return true;
    } catch (err) {
      console.error("Failed to upload file:", err);
      return false;
    }
  };

  return {
    history,
    pagination,
    isLoading,
    error,
    fetchHistory,
    deleteHistoryItem,
    uploadFile,
  };
}

/**
 * Custom hook to fetch Everpro sync statistics
 */
export function useEverproStats() {
  const [stats, setStats] = useState<EverproSyncStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/everpro-sync/stats");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to fetch Everpro stats:", error);
      
      // Set default values on error
      setStats({
        totalContacts: 0,
        contactedCount: 0,
        notContactedCount: 0,
        lastSyncDate: null,
        lastSyncDisplay: "Error",
        lastUploadDate: null,
        lastUploadFileName: null,
        hasData: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
