// src/utils/appVersion.ts
import packageJson from '../../package.json';
import { logWarn } from '@/lib/utils/secure-logger';

export const APP_VERSION = packageJson.version;

export function checkAndClearOnUpdate() {
  if (typeof window === 'undefined') return;
  
  const STORAGE_KEY = 'app_version_check_key';
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
      }).catch(error => {
        logWarn('Fehler beim Löschen der IndexedDB:', { data: error });
      });
    }
    
    // Cache löschen
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).catch(error => {
        logWarn('Fehler beim Löschen des Cache:', { data: error });
      });
    }
    
    // Neue Version speichern
    localStorage.setItem(STORAGE_KEY, currentVersion);
  }
}
