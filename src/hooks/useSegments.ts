import { useState, useEffect, useCallback } from "react";

export type Segment = {
  id: string;
  name: string;
  description: string | null;
  filters: unknown;
  resultCount: number;
  createdById: string;
  createdBy: {
    name: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
};

type UseSegmentsReturn = {
  segments: Segment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  deleteSegment: (id: string) => Promise<boolean>;
};

/**
 * Custom hook to fetch and manage segments
 */
export function useSegments(): UseSegmentsReturn {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSegments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/segments");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSegments(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to fetch segments:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSegment = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/segments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refetch after successful delete
      await fetchSegments();
      return true;
    } catch (err) {
      console.error("Failed to delete segment:", err);
      return false;
    }
  };

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  return {
    segments,
    isLoading,
    error,
    refetch: fetchSegments,
    deleteSegment,
  };
}

/**
 * Hook to create a new segment
 */
export function useCreateSegment() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createSegment = async (data: {
    name: string;
    description?: string;
    filters: unknown;
    resultCount: number;
    createdById: string;
  }): Promise<Segment | null> => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const segment = await response.json();
      return segment;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to create segment:", error);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createSegment,
    isCreating,
    error,
  };
}

/**
 * Hook to update an existing segment
 */
export function useUpdateSegment() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateSegment = async (
    id: string,
    data: {
      name?: string;
      description?: string;
      filters?: unknown;
      resultCount?: number;
    }
  ): Promise<Segment | null> => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch(`/api/segments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const segment = await response.json();
      return segment;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to update segment:", error);
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateSegment,
    isUpdating,
    error,
  };
}
