// src/utils/appVersion.ts
import packageJson from '../../package.json';
import { logWarn } from '@/lib/utils/secure-logger';

export const APP_VERSION = packageJson.version;

export function checkAndClearOnUpdate() {
  if (typeof window === 'undefined') return;

  const STORAGE_KEY = 'app_version_check_key';
  const currentVersion = APP_VERSION;
  const storedVersion = localStorage.getItem(STORAGE_KEY);

  // Nichts zu tun, wenn die Version unverändert ist.
  if (storedVersion === currentVersion) return;

  // Version-Wechsel erkannt.
  //
  // WICHTIG: Die IndexedDB wird bewusst NICHT mehr gelöscht. Firestore legt
  // dort seinen lokalen Zustand ab. Früher wurde die IndexedDB hier beim
  // Start gelöscht – in der nativen App (WebView auf https://rwk-einbeck.de)
  // riss das Firestore beim Hochfahren die Datenbank unter den Füßen weg, und
  // es luden keine Daten mehr, bis die App komplett beendet und neu gestartet
  // wurde. Ein Service Worker existiert in diesem Projekt nicht (kein
  // next-pwa/sw.js), es gibt hier also auch nichts abzumelden.
  //
  // Der HTTP-Cache-Bust passiert ohnehin beim Neuladen über den ?_v-Parameter
  // (siehe VersionCheck.hardReload). Wir merken uns hier nur noch die neue
  // Version und räumen – nur außerhalb der nativen App – flüchtige
  // App-Zustände (session-/localStorage) auf. Firestores IndexedDB bleibt
  // in jedem Fall unangetastet.
  const isNativeApp =
    !!window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform();

  if (!isNativeApp) {
    try {
      sessionStorage.clear();
    } catch (error) {
      logWarn('Fehler beim Leeren des sessionStorage:', { data: error });
    }
  }

  localStorage.setItem(STORAGE_KEY, currentVersion);
}
