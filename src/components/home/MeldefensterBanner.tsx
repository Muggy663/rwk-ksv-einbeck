"use client";

// src/components/home/MeldefensterBanner.tsx
// Zeigt oben auf der Startseite offene Meldefenster (RWK + KM) sowie Abgabetermine an.
// Regeln (Meldefenster, Status "Anmeldung möglich" + meldeschluss):
//  - Frist heute oder in der Zukunft  -> "Meldung möglich bis <Datum>"
//  - Frist < 7 Tage abgelaufen         -> "Anmeldung beendet seit <Datum>"
//  - Frist >= 7 Tage abgelaufen / keine -> nichts anzeigen
// Abgabetermin (laufende Saison + wettkampfende), blau, gleiche 7-Tage-Regel:
//  - Termin in der Zukunft -> "Abgabe der Ergebnisse bis <Datum>"
//  - < 7 Tage vorbei        -> "Abgabetermin war am <Datum>"

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
  art?: 'meldung' | 'abgabe'; // meldung = Meldeschluss (Default), abgabe = Wettkampfende/Abgabetermin
}

const EINE_WOCHE_MS = 7 * 24 * 60 * 60 * 1000;

function formatDatum(d: Date): string {
  // UTC, passend zum UTC-Tagesende aus parseMeldeschluss (stabiler Kalendertag).
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
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
        href: string,
        art: 'meldung' | 'abgabe' = 'meldung'
      ) => {
        const deadline = parseMeldeschluss(meldeschluss);
        if (!deadline) return;
        const diff = jetzt.getTime() - deadline.getTime();
        if (diff <= 0) {
          gefunden.push({ key, bereich, titel, deadline, offen: true, href, art });
        } else if (diff < EINE_WOCHE_MS) {
          gefunden.push({ key, bereich, titel, deadline, offen: false, href, art });
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

        // Laufende RWK-Saisons mit gepflegtem Abgabetermin (wettkampfende)
        const laufendSnap = await getDocs(
          query(collection(db, 'seasons'), where('status', '==', 'Laufend'))
        );
        laufendSnap.docs.forEach((d) => {
          const s = d.data() as any;
          if (s.wettkampfende) {
            pruefe(`rwk_abgabe_${d.id}`, 'RWK', s.name || 'Rundenwettkampf', s.wettkampfende, '/rwk-tabellen', 'abgabe');
          }
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

      // Reihenfolge: Meldefenster vor Abgabeterminen; darin offene zuerst, dann nach Frist
      gefunden.sort((a, b) => {
        const aAbgabe = a.art === 'abgabe';
        const bAbgabe = b.art === 'abgabe';
        if (aAbgabe !== bAbgabe) return aAbgabe ? 1 : -1;
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
      {fenster.map((f) => {
        const istAbgabe = f.art === 'abgabe';
        // Farbschema: Meldung offen = grün, beendet = amber, Abgabetermin = blau
        const boxClass = istAbgabe
          ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800'
          : f.offen
            ? 'border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800'
            : 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800';
        const textClass = istAbgabe
          ? 'text-blue-800 dark:text-blue-200'
          : f.offen
            ? 'text-green-800 dark:text-green-200'
            : 'text-amber-800 dark:text-amber-200';
        const icon = istAbgabe ? '📅' : f.offen ? '📣' : '⏳';
        return (
          <div
            key={f.key}
            className={`rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${boxClass}`}
          >
            <div className={`flex items-center gap-2 text-sm ${textClass}`}>
              <span className="text-lg">{icon}</span>
              <span>
                <span className="font-semibold">{f.titel}</span>
                {' — '}
                {istAbgabe
                  ? (f.offen
                      ? <>Abgabe der Ergebnisse <strong>bis {formatDatum(f.deadline)}</strong></>
                      : <>Abgabetermin war <strong>am {formatDatum(f.deadline)}</strong></>)
                  : (f.offen
                      ? <>Meldung möglich <strong>bis {formatDatum(f.deadline)}</strong></>
                      : <>Anmeldung beendet <strong>seit {formatDatum(f.deadline)}</strong></>)}
              </span>
            </div>
            {f.offen && !istAbgabe && (
              <Link
                href={f.href}
                className="text-sm font-medium underline text-green-700 hover:text-green-900 dark:text-green-300 whitespace-nowrap"
              >
                Jetzt melden →
              </Link>
            )}
            {istAbgabe && (
              <Link
                href={f.href}
                className="text-sm font-medium underline text-blue-700 hover:text-blue-900 dark:text-blue-300 whitespace-nowrap"
              >
                Zu den Tabellen →
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
