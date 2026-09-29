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
    // Hinweis: Die native App (Capacitor) lädt live von https://rwk-einbeck.de
    // (server.url in capacitor.config), ist also eine WebView auf dieselbe
    // Website. Deshalb IST der Versions-Hinweis auch in der App sinnvoll –
    // ein Vercel-Deploy ist für die App eine echte neue Version, und ein
    // Neuladen holt sie. Der Reload selbst muss nur schonend sein (siehe
    // hardReload), damit Firestore in der WebView nicht abstürzt.
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

  // Lädt die Seite frisch mit Cache-Buster neu.
  //
  // WICHTIG – bewusst SCHONEND: Früher wurden hier Caches geleert, der
  // Service Worker abgemeldet und (an anderer Stelle) sogar die IndexedDB
  // gelöscht. In der nativen App (WebView auf https://rwk-einbeck.de) hat
  // genau das Firestore zerschossen: Firestore legt seinen Zustand in der
  // IndexedDB ab; wird die weggeräumt, während die neue Seite hochfährt,
  // laden keine Daten mehr, bis die App komplett beendet und neu gestartet
  // wird. Ein Service Worker existiert in diesem Projekt ohnehin nicht
  // (kein next-pwa/sw.js), also gibt es hier auch nichts abzumelden.
  //
  // Für einen frischen Stand reicht eine vollständige Neu-Navigation mit
  // Cache-Buster: Sie baut Dokument und alle Kontexte (Firebase, Auth,
  // Datenschicht) neu auf und holt beim Server-Request das neue Deploy –
  // ohne Firestores lokale Daten zu beschädigen.
  const hardReload = () => {
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
