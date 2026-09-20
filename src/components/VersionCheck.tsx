"use client";

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import packageJson from '../../package.json';

const CLIENT_VERSION = packageJson.version;

export function VersionCheck() {
  const [outdated, setOutdated] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Betriebssystem erkennen für den passenden Tastenkombination-Hinweis
    if (typeof navigator !== 'undefined') {
      setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent));
    }
    // Cache-Buster-Parameter aus der Adresse entfernen, falls nach einem
    // Update-Reload noch vorhanden – hält die URL sauber.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('_v')) {
        url.searchParams.delete('_v');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (res.ok) {
          const { version } = await res.json();
          if (version && version !== CLIENT_VERSION) {
            setOutdated(true);
          }
        }
      } catch {
        // Netzwerkfehler ignorieren
      }
    };

    // Beim Laden prüfen
    check();
    // Alle 5 Minuten prüfen
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Erzwingt ein echtes Neuladen ohne Cache (F5 allein reicht nicht,
  // da der Browser die Seite aus dem Cache lädt).
  const hardReload = async () => {
    try {
      // Browser-Caches leeren (PWA / Service Worker)
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      // Service Worker abmelden, damit alte Assets nicht erneut ausgeliefert werden
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
        // Kurz warten, damit die Abmeldung wirklich abgeschlossen ist, bevor
        // wir neu laden. Ohne diese Pause startet die neue Seite, während der
        // Service Worker gerade erst entfernt wird – die Firestore-Listener
        // initialisieren dann nicht sauber und die Tabellen bleiben leer,
        // bis die App komplett neu gestartet wird.
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch {
      // Fehler beim Cache-Leeren ignorieren – Reload trotzdem versuchen
    }
    // Vollständige Neu-Navigation mit Cache-Buster statt reload().
    // reload() rendert in der PWA/App teils noch aus dem gerade geleerten
    // Zustand; eine frische Navigation baut Dokument und alle Kontexte
    // (Firebase, Auth, Datenschicht) komplett neu auf – entspricht einem
    // echten App-Neustart, ohne dass die App beendet werden muss.
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now().toString());
    window.location.replace(url.toString());
  };

  if (!outdated) return null;

  const shortcut = isMac ? 'Cmd + Shift + R' : 'Strg + Shift + R';

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-start gap-3">
        <RefreshCw className="h-5 w-5 shrink-0 animate-spin mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Neue Version verfügbar</p>
          <p className="text-xs text-blue-100 mt-0.5">
            Bitte vollständig neu laden. Ein normales <strong>F5</strong> reicht nicht –
            drücken Sie <strong>{shortcut}</strong> oder tippen Sie auf „Aktualisieren“.
          </p>
        </div>
        <button
          onClick={hardReload}
          className="bg-white text-blue-600 font-semibold text-sm px-3 py-1.5 rounded hover:bg-blue-50 shrink-0"
        >
          Aktualisieren
        </button>
      </div>
    </div>
  );
}
