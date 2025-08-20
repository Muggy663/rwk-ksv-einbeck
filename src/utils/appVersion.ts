// src/utils/appVersion.ts
export const APP_VERSION = '0.9.4.0';

export function checkAndClearOnUpdate() {
  if (typeof window === 'undefined') return;
  
  const STORAGE_KEY = 'rwk_app_version';
  const currentVersion = APP_VERSION;
  const storedVersion = localStorage.getItem(STORAGE_KEY);
  
  // Bei erstem Start oder Version-Wechsel
  if (!storedVersion || storedVersion !== currentVersion) {
    console.log(`App Update erkannt: ${storedVersion} → ${currentVersion}`);
    
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
    
    console.log('App-Daten nach Update gelöscht');
  }
}