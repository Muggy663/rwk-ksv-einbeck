// src/hooks/use-optimistic-update.ts
"use client";

import { useState, useCallback } from 'react';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollbackData: T) => void;
}

export function useOptimisticUpdate<T>(
  initialData: T,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(async (
    optimisticData: T,
    asyncOperation: () => Promise<T>
  ) => {
    const previousData = data;
    
    // Sofortige optimistische Aktualisierung
    setData(optimisticData);
    setIsLoading(true);
    setError(null);

    try {
      // Führe die tatsächliche Operation aus
      const result = await asyncOperation();
      
      // Aktualisiere mit echten Daten vom Server
      setData(result);
      options.onSuccess?.(result);
      
      return result;
    } catch (err) {
      // Rollback bei Fehler
      setData(previousData);
      const error = err instanceof Error ? err : new Error('Unbekannter Fehler');
      setError(error);
      options.onError?.(error, previousData);
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [data, options]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsLoading(false);
  }, [initialData]);

  return {
    data,
    isLoading,
    error,
    update,
    reset
  };
}