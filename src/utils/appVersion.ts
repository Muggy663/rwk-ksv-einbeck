// src/utils/appVersion.ts
import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;

export function checkAndClearOnUpdate() {
  if (typeof window === 'undefined') return;
  
  const STORAGE_KEY = 'rwk_app_version';
  const currentVersion = APP_VERSION;
  const storedVersion = localStorage.getItem(STORAGE_KEY);
  
  // Bei erstem Start oder Version-Wechsel
  if (!storedVersion || storedVersion !== currentVersion) {
    // Alle Daten löschen
    localStorage.clear();
    sessionStorage.clear();
    
    // IndexedDB löschen (falls vorhanden)
    if ('indexedDB' in window) {
      indexedDB.databases?.().then(databases => {
        databases.forEach(db => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      });
    }
    
    // Cache löschen
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Neue Version speichern
    localStorage.setItem(STORAGE_KEY, currentVersion);
  }
}
