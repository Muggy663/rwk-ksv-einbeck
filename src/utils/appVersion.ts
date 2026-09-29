// src/utils/appVersion.ts
import packageJson from '../../package.json';
import { logWarn } from '@/lib/utils/secure-logger';

export const APP_VERSION = packageJson.version;

export function checkAndClearOnUpdate() {
  if (typeof window === 'undefined') return;

  const STORAGE_KEY = 'app_version_check_key';
  const currentVersion = APP_VERSION;
  const storedVersion = localStorage.getItem(STORAGE_KEY);

  // In der nativen App (Capacitor) NICHT aggressiv löschen. Die App bringt
  // bei einem Play-Store-Update ohnehin frische Assets mit; ein Löschen von
  // localStorage/sessionStorage und vor allem der IndexedDB beim Start ist
  // hier schädlich: Firestore legt seinen Offline-/Verbindungsstatus in der
  // IndexedDB ab. Wird die beim Start asynchron gelöscht, während Firebase
  // gerade hochfährt, bleibt die Datenschicht in einem kaputten Zustand –
  // Reads hängen oder liefern nichts, bis die App komplett beendet und neu
  // gestartet wird. Genau dieses Verhalten wollen wir vermeiden. Wir merken
  // uns nur die Version, löschen aber nichts.
  const isNativeApp =
    !!window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform();
  if (isNativeApp) {
    if (storedVersion !== currentVersion) {
      localStorage.setItem(STORAGE_KEY, currentVersion);
    }
    return;
  }

  // Bei erstem Start oder Version-Wechsel (nur Web/PWA)
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
