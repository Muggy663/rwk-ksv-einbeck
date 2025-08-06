/**
 * Cache-Utility für häufig abgefragte Daten
 * Vercel-kompatible Implementierung ohne localStorage
 */

// Cache-Dauer in Millisekunden
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 Minuten
  MEDIUM: 30 * 60 * 1000, // 30 Minuten
  LONG: 24 * 60 * 60 * 1000 // 24 Stunden
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  duration?: number;
}

// In-Memory Cache für Vercel-Kompatibilität
const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Holt Daten aus dem Cache oder ruft die Fetch-Funktion auf
 * @param key - Eindeutiger Schlüssel für die Daten
 * @param fetchFunction - Async-Funktion zum Abrufen der Daten
 * @param duration - Cache-Dauer in Millisekunden
 * @returns Die gecachten oder frisch abgerufenen Daten
 */
export async function getCachedData<T>(
  key: string, 
  fetchFunction: () => Promise<T>, 
  duration: number = CACHE_DURATION.MEDIUM
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
  
  if (cached && (now - cached.timestamp < duration)) {

    return Promise.resolve(cached.data);
  }
  

  return fetchFunction().then(data => {
    memoryCache.set(key, {
      data,
      timestamp: now
    });
    return data;
  });
}

/**
 * Löscht einen bestimmten Eintrag aus dem Cache
 * @param key - Der zu löschende Cache-Schlüssel
 */
export function invalidateCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * Löscht alle Einträge aus dem Cache
 */
export function clearCache(): void {
  memoryCache.clear();
}

/**
 * Cache-Objekt für die Verwendung in anderen Modulen
 */
export const dataCache = {
  /**
   * Generiert einen eindeutigen Cache-Schlüssel basierend auf Präfix und Parametern
   * @param prefix - Präfix für den Schlüssel
   * @param params - Parameter für den Schlüssel
   * @returns Der generierte Cache-Schlüssel
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    const paramsStr = JSON.stringify(params);
    return `${prefix}_${paramsStr}`;
  },
  
  /**
   * Holt Daten aus dem Cache
   * @param key - Der Cache-Schlüssel
   * @returns Die gecachten Daten oder null, wenn nicht im Cache
   */
  get<T>(key: string): T | null {
    const now = Date.now();
    const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
    
    if (cached && cached.duration && (now - cached.timestamp < cached.duration)) {

      return cached.data;
    }
    
    return null;
  },
  
  /**
   * Speichert Daten im Cache
   * @param key - Der Cache-Schlüssel
   * @param data - Die zu speichernden Daten
   * @param duration - Cache-Dauer in Millisekunden
   */
  set<T>(key: string, data: T, duration: number = CACHE_DURATION.MEDIUM): void {
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      duration
    });
  },
  
  /**
   * Löscht einen Eintrag aus dem Cache
   * @param key - Der zu löschende Cache-Schlüssel
   */
  invalidate(key: string): void {
    memoryCache.delete(key);
  },
  
  /**
   * Löscht alle Einträge aus dem Cache
   */
  clear(): void {
    memoryCache.clear();
  }
};
