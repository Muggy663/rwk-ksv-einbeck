"use client";

// src/components/home/MeldefensterBanner.tsx
// Zeigt oben auf der Startseite offene Meldefenster (RWK + KM) an.
// Regeln:
//  - Frist heute oder in der Zukunft  -> "Meldung möglich bis <Datum>"
//  - Frist < 7 Tage abgelaufen         -> "Seit <Datum> beendet"
//  - Frist >= 7 Tage abgelaufen / keine -> nichts anzeigen

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logError } from '@/lib/utils/secure-logger';
import { parseMeldeschluss } from '@/lib/utils/km-meldeschluss';

interface Meldefenster {
  key: string;
  bereich: 'RWK' | 'KM';
  titel: string;
  deadline: Date;
  offen: boolean; // true = noch möglich, false = kürzlich beendet
  href: string;
}

const EINE_WOCHE_MS = 7 * 24 * 60 * 60 * 1000;

function formatDatum(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function MeldefensterBanner() {
  const [fenster, setFenster] = useState<Meldefenster[]>([]);

  useEffect(() => {
    const load = async () => {
      const jetzt = new Date();
      const gefunden: Meldefenster[] = [];

      // Prüft eine Frist und nimmt sie auf, wenn offen oder < 1 Woche beendet.
      const pruefe = (
        key: string,
        bereich: 'RWK' | 'KM',
        titel: string,
        meldeschluss: string | undefined | null,
        href: string
      ) => {
        const deadline = parseMeldeschluss(meldeschluss);
        if (!deadline) return;
        const diff = jetzt.getTime() - deadline.getTime();
        if (diff <= 0) {
          gefunden.push({ key, bereich, titel, deadline, offen: true, href });
        } else if (diff < EINE_WOCHE_MS) {
          gefunden.push({ key, bereich, titel, deadline, offen: false, href });
        }
      };

      try {
        // RWK-Saisons (Firestore) mit Status "Anmeldung möglich" + Meldeschluss
        const { getDocs, collection, query, where } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        const rwkSnap = await getDocs(
          query(collection(db, 'seasons'), where('status', '==', 'Anmeldung möglich'))
        );
        rwkSnap.docs.forEach((d) => {
          const s = d.data() as any;
          pruefe(`rwk_${d.id}`, 'RWK', s.name || 'Rundenwettkampf', s.meldeschluss, '/verein/mannschaften');
        });
      } catch (error) {
        logError('Meldefenster: RWK-Saisons konnten nicht geladen werden', error);
      }

      try {
        // KM-Saisons (API) mit Meldeschluss
        const res = await fetch('/api/km/saisons');
        if (res.ok) {
          const data = await res.json();
          (data.data || []).forEach((s: any) => {
            pruefe(`km_${s.id}`, 'KM', s.name || 'Kreismeisterschaft', s.meldeschluss, '/km/meldungen');
          });
        }
      } catch (error) {
        logError('Meldefenster: KM-Saisons konnten nicht geladen werden', error);
      }

      // Offene zuerst, dann nach Frist
      gefunden.sort((a, b) => {
        if (a.offen !== b.offen) return a.offen ? -1 : 1;
        return a.deadline.getTime() - b.deadline.getTime();
      });
      setFenster(gefunden);
    };
    load();
  }, []);

  if (fenster.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {fenster.map((f) => (
        <div
          key={f.key}
          className={`rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
            f.offen
              ? 'border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800'
              : 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800'
          }`}
        >
          <div className={`flex items-center gap-2 text-sm ${f.offen ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'}`}>
            <span className="text-lg">{f.offen ? '📣' : '⏳'}</span>
            <span>
              <span className="font-semibold">{f.bereich}: {f.titel}</span>
              {' — '}
              {f.offen
                ? <>Meldung möglich <strong>bis {formatDatum(f.deadline)}</strong></>
                : <>Anmeldung beendet <strong>seit {formatDatum(f.deadline)}</strong></>}
            </span>
          </div>
          {f.offen && (
            <Link
              href={f.href}
              className="text-sm font-medium underline text-green-700 hover:text-green-900 dark:text-green-300 whitespace-nowrap"
            >
              Jetzt melden →
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
