"use client";

/**
 * Einfacher In-Memory-Cache für Daten mit Zeitbegrenzung
 * Optimiert für häufig abgefragte Daten
 */
class DataCache {
  constructor(maxSize = 50, defaultTTL = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // Standard-TTL: 5 Minuten
  }

  /**
   * Generiert einen Cache-Schlüssel basierend auf dem Datentyp und den Parametern
   * @param {string} dataType - Art der Daten (z.B. 'seasons', 'leagues', 'shooters')
   * @param {Object} params - Parameter für die Abfrage
   * @returns {string} - Cache-Schlüssel
   */
  generateKey(dataType, params = {}) {
    const sortedParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    return `${dataType}${sortedParams ? `?${sortedParams}` : ''}`;
  }

  /**
   * Fügt Daten zum Cache hinzu
   * @param {string} key - Cache-Schlüssel
   * @param {any} data - Zu speichernde Daten
   * @param {number} ttl - Time-to-Live in Millisekunden
   */
  set(key, data, ttl = this.defaultTTL) {
    // Wenn der Cache voll ist, entferne den ältesten Eintrag
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
    
    // Automatische Bereinigung nach Ablauf
    setTimeout(() => {
      if (this.cache.has(key) && this.cache.get(key).expiresAt <= Date.now()) {
        this.cache.delete(key);
      }
    }, ttl);
  }

  /**
   * Ruft Daten aus dem Cache ab
   * @param {string} key - Cache-Schlüssel
   * @returns {any|null} - Gespeicherte Daten oder null, wenn nicht gefunden oder abgelaufen
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const { data, expiresAt } = this.cache.get(key);
    
    // Prüfe, ob der Eintrag abgelaufen ist
    if (expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return data;
  }

  /**
   * Prüft, ob ein Schlüssel im Cache existiert und nicht abgelaufen ist
   * @param {string} key - Cache-Schlüssel
   * @returns {boolean} - true, wenn der Schlüssel existiert und nicht abgelaufen ist
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const { expiresAt } = this.cache.get(key);
    
    if (expiresAt <= Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Löscht einen Eintrag aus dem Cache
   * @param {string} key - Cache-Schlüssel
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Löscht alle Einträge aus dem Cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Löscht alle abgelaufenen Einträge aus dem Cache
   */
  cleanup() {
    const now = Date.now();
    for (const [key, { expiresAt }] of this.cache.entries()) {
      if (expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gibt die aktuelle Größe des Caches zurück
   * @returns {number} - Anzahl der Einträge im Cache
   */
  size() {
    return this.cache.size;
  }
}

// Singleton-Instanz für die gesamte Anwendung
export const dataCache = new DataCache();