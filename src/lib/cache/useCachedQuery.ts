/**
 * Hook für Firestore-Abfragen mit Caching
 */
import { useState, useEffect, DependencyList } from 'react';
import { getCachedData, CACHE_DURATION } from './dataCache';

interface UseCachedQueryOptions {
  cacheDuration?: number;
  dependencies?: DependencyList;
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook zum Abrufen von Daten mit Cache-Unterstützung
 * @param cacheKey - Eindeutiger Schlüssel für den Cache
 * @param queryFunction - Async-Funktion zum Abrufen der Daten
 * @param options - Optionen für die Abfrage
 * @returns { data, loading, error }
 */
export function useCachedQuery<T>(
  cacheKey: string, 
  queryFunction: () => Promise<T>, 
  options: UseCachedQueryOptions = {}
): QueryResult<T> {
  const { 
    cacheDuration = CACHE_DURATION.MEDIUM,
    dependencies = []
  } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    getCachedData<T>(cacheKey, queryFunction, cacheDuration)
      .then(result => {
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(`Error in useCachedQuery for ${cacheKey}:`, err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });
      
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, cacheDuration, ...dependencies]);

  return { data, loading, error };
}
