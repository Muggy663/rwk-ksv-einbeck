"use client";

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import packageJson from '../../package.json';

const CLIENT_VERSION = packageJson.version;

export function VersionCheck() {
  const [outdated, setOutdated] = useState(false);

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

  if (!outdated) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-center gap-3">
        <RefreshCw className="h-5 w-5 shrink-0 animate-spin" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Neue Version verfügbar</p>
          <p className="text-xs text-blue-100">Bitte Seite neu laden für die aktuelle Version.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-white text-blue-600 font-semibold text-sm px-3 py-1.5 rounded hover:bg-blue-50 shrink-0"
        >
          Aktualisieren
        </button>
      </div>
    </div>
  );
}
