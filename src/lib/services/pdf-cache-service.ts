/**
 * Service für das Caching von PDF-Dokumenten
 * 
 * Dieses Modul implementiert ein Caching-System für PDF-Dokumente,
 * um wiederholte Generierungen zu vermeiden und die Performance zu verbessern.
 */

interface CachedPDF {
  blob: Blob;
  timestamp: number;
  key: string;
}

interface PDFCacheStats {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  averageAge: number;
  oldestEntry: number;
  newestEntry: number;
}

// In-Memory-Cache für PDF-Dokumente
const pdfCache = new Map<string, CachedPDF>();

// Konfiguration
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 Minuten in Millisekunden
const MAX_CACHE_SIZE = 20; // Maximale Anzahl von PDFs im Cache

/**
 * Generiert einen eindeutigen Cache-Schlüssel basierend auf den Parametern
 * @param type - Typ des PDFs (z.B. 'league', 'shooters', 'emptyTable')
 * @param params - Parameter für die PDF-Generierung
 * @returns Eindeutiger Cache-Schlüssel
 */
function generateCacheKey(type: string, params: Record<string, any>): string {
  // Erstelle einen deterministischen String aus den Parametern
  const paramsString = JSON.stringify(params, (key, value) => {
    // Spezielle Behandlung für Objekte mit ID
    if (value && typeof value === 'object' && value.id) {
      return { id: value.id };
    }
    return value;
  });
  
  return `${type}_${paramsString}`;
}

/**
 * Speichert ein PDF im Cache
 * @param type - Typ des PDFs
 * @param params - Parameter für die PDF-Generierung
 * @param pdfBlob - Das PDF als Blob
 */
export function cachePDF(type: string, params: Record<string, any>, pdfBlob: Blob): void {
  const key = generateCacheKey(type, params);
  
  // Wenn der Cache voll ist, entferne den ältesten Eintrag
  if (pdfCache.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();
    
    for (const [cacheKey, entry] of pdfCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = cacheKey;
      }
    }
    
    if (oldestKey) {
      pdfCache.delete(oldestKey);
    }
  }
  
  // Speichere das PDF im Cache
  pdfCache.set(key, {
    blob: pdfBlob,
    timestamp: Date.now(),
    key
  });
  
  console.log(`PDF cached: ${key}`);
}

/**
 * Ruft ein PDF aus dem Cache ab
 * @param type - Typ des PDFs
 * @param params - Parameter für die PDF-Generierung
 * @returns Das PDF als Blob oder null, wenn nicht im Cache
 */
export function getCachedPDF(type: string, params: Record<string, any>): Blob | null {
  const key = generateCacheKey(type, params);
  const cachedEntry = pdfCache.get(key);
  
  if (!cachedEntry) {
    console.log(`PDF cache miss: ${key}`);
    return null;
  }
  
  // Prüfe, ob der Cache-Eintrag abgelaufen ist
  if (Date.now() - cachedEntry.timestamp > CACHE_EXPIRY_TIME) {
    console.log(`PDF cache expired: ${key}`);
    pdfCache.delete(key);
    return null;
  }
  
  console.log(`PDF cache hit: ${key}`);
  return cachedEntry.blob;
}

/**
 * Löscht einen PDF-Cache-Eintrag
 * @param type - Typ des PDFs
 * @param params - Parameter für die PDF-Generierung
 * @returns true, wenn der Eintrag gelöscht wurde, sonst false
 */
export function invalidatePDFCache(type: string, params: Record<string, any>): boolean {
  const key = generateCacheKey(type, params);
  const result = pdfCache.delete(key);
  
  if (result) {
    console.log(`PDF cache invalidated: ${key}`);
  }
  
  return result;
}

/**
 * Löscht alle PDF-Cache-Einträge
 */
export function clearPDFCache(): void {
  const cacheSize = pdfCache.size;
  pdfCache.clear();
  console.log(`PDF cache cleared: ${cacheSize} entries removed`);
}

/**
 * Gibt Statistiken zum PDF-Cache zurück
 * @returns Cache-Statistiken
 */
export function getPDFCacheStats(): PDFCacheStats {
  const now = Date.now();
  const stats: PDFCacheStats = {
    totalEntries: pdfCache.size,
    activeEntries: 0,
    expiredEntries: 0,
    averageAge: 0,
    oldestEntry: 0,
    newestEntry: 0
  };
  
  if (pdfCache.size === 0) {
    return stats;
  }
  
  let totalAge = 0;
  let oldestTimestamp = now;
  let newestTimestamp = 0;
  
  for (const entry of pdfCache.values()) {
    const age = now - entry.timestamp;
    totalAge += age;
    
    if (entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp;
    }
    
    if (entry.timestamp > newestTimestamp) {
      newestTimestamp = entry.timestamp;
    }
    
    if (age <= CACHE_EXPIRY_TIME) {
      stats.activeEntries++;
    } else {
      stats.expiredEntries++;
    }
  }
  
  stats.averageAge = totalAge / pdfCache.size;
  stats.oldestEntry = now - oldestTimestamp;
  stats.newestEntry = now - newestTimestamp;
  
  return stats;
}