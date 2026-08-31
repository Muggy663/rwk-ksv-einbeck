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
      }
    } catch {
      // Fehler beim Cache-Leeren ignorieren – Reload trotzdem versuchen
    }
    // Mit Cache-Bypass neu laden
    window.location.reload();
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
