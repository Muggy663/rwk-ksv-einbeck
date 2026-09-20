// src/lib/services/ausrichter-service.ts
// Ausrichter-Rotation für den 1. Durchgang: fair über die Jahre, PRO LIGA.
// Historie liegt in der Collection 'ausrichter_historie' (ein Dokument je Saison+Liga).
// Ziel: Vereine, die zuletzt/oft ausgerichtet haben, rutschen im Vorschlag nach hinten;
// wer in dieser Liga noch nie dran war, wird bevorzugt. Standkapazität (welcher Verein
// welche Disziplin überhaupt ausrichten kann) wird berücksichtigt.

import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { logError } from '@/lib/utils/secure-logger';

const HISTORIE_COLLECTION = 'ausrichter_historie';

export interface AusrichterEintrag {
  id: string;            // `${competitionYear}_${leagueId}`
  seasonId: string;
  leagueId: string;
  leagueName: string;
  competitionYear: number;
  disziplinKat: 'LG' | 'KK' | 'KKP'; // grobe Kategorie (nur Info/Filter)
  ausrichterClubId: string;
  ausrichterTeamName: string;
}

/** Grobe Disziplin-Kategorie für die Standkapazität-Prüfung. */
export function disziplinKategorie(leagueType?: string | null): 'LG' | 'KKG' | 'KKP' {
  const t = (leagueType || '').toUpperCase();
  if (t === 'KKP') return 'KKP';
  if (t === 'KK' || t === 'KKG') return 'KKG';
  return 'LG'; // LGA/LGS/LP/LPA/LG/LD -> Luftdruck
}

/** Kann der Verein diese Disziplin ausrichten? Ohne gepflegte Angabe: true (nicht blockieren). */
export function kannAusrichten(ausrichterDisziplinen: string[] | undefined, leagueType?: string | null): boolean {
  if (!ausrichterDisziplinen || ausrichterDisziplinen.length === 0) return true; // ungepflegt -> nicht ausschließen
  return ausrichterDisziplinen.includes(disziplinKategorie(leagueType));
}

/** Lädt die gesamte Ausrichter-Historie (alle Jahre). */
export async function ladeAusrichterHistorie(): Promise<AusrichterEintrag[]> {
  try {
    const snap = await getDocs(collection(db, HISTORIE_COLLECTION));
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as AusrichterEintrag[];
  } catch (e) {
    logError('Ausrichter-Historie konnte nicht geladen werden:', e);
    return [];
  }
}

/** Speichert (oder überschreibt) den Ausrichter einer Liga für eine Saison. */
export async function speichereAusrichter(params: {
  seasonId: string;
  leagueId: string;
  leagueName: string;
  competitionYear: number;
  leagueType?: string | null;
  ausrichterClubId: string;
  ausrichterTeamName: string;
}): Promise<void> {
  const id = `${params.competitionYear}_${params.leagueId}`;
  await setDoc(doc(db, HISTORIE_COLLECTION, id), {
    seasonId: params.seasonId,
    leagueId: params.leagueId,
    leagueName: params.leagueName,
    competitionYear: params.competitionYear,
    disziplinKat: disziplinKategorie(params.leagueType) === 'KKG' ? 'KK' : disziplinKategorie(params.leagueType) === 'KKP' ? 'KKP' : 'LG',
    ausrichterClubId: params.ausrichterClubId,
    ausrichterTeamName: params.ausrichterTeamName,
    gespeichertAm: serverTimestamp(),
  }, { merge: true });
}

export interface AusrichterKandidat {
  clubId: string;
  teamName: string;
  /** Jahr der letzten Ausrichtung in DIESER Liga (0 = noch nie) */
  letztesJahr: number;
  /** Wie oft dieser Verein in dieser Liga schon ausgerichtet hat */
  anzahl: number;
  /** Kann der Verein die Disziplin ausrichten (Standkapazität)? */
  faehig: boolean;
}

/**
 * Berechnet die Ausrichter-Reihenfolge für EINE Liga:
 * Kandidaten (die gemeldeten Mannschaften der Liga) werden so sortiert, dass der
 * am längsten nicht (bzw. noch nie) Ausrichtende zuerst steht. Nicht-fähige Vereine
 * (Standkapazität) landen ganz hinten.
 *
 * @param leagueId       aktuelle Liga
 * @param leagueType     Disziplin der Liga (für Standkapazität)
 * @param aktuellesJahr  Wettkampfjahr der neuen Saison
 * @param mannschaften   gemeldete Mannschaften der Liga: { clubId, teamName, ausrichterDisziplinen }
 * @param historie       gesamte Ausrichter-Historie
 */
export function berechneAusrichterReihenfolge(
  leagueId: string,
  leagueType: string | null | undefined,
  aktuellesJahr: number,
  mannschaften: Array<{ clubId: string; teamName: string; ausrichterDisziplinen?: string[] }>,
  historie: AusrichterEintrag[],
): AusrichterKandidat[] {
  // Historie dieser Liga (alle Jahre außer dem aktuellen), je clubId auswerten.
  const ligaHistorie = historie.filter(h => h.leagueId === leagueId && h.competitionYear < aktuellesJahr);
  const letztesJahrProClub = new Map<string, number>();
  const anzahlProClub = new Map<string, number>();
  for (const h of ligaHistorie) {
    letztesJahrProClub.set(h.ausrichterClubId, Math.max(letztesJahrProClub.get(h.ausrichterClubId) || 0, h.competitionYear));
    anzahlProClub.set(h.ausrichterClubId, (anzahlProClub.get(h.ausrichterClubId) || 0) + 1);
  }

  const kandidaten: AusrichterKandidat[] = mannschaften.map(m => ({
    clubId: m.clubId,
    teamName: m.teamName,
    letztesJahr: letztesJahrProClub.get(m.clubId) || 0,
    anzahl: anzahlProClub.get(m.clubId) || 0,
    faehig: kannAusrichten(m.ausrichterDisziplinen, leagueType),
  }));

  kandidaten.sort((a, b) => {
    // 1) fähige Vereine zuerst
    if (a.faehig !== b.faehig) return a.faehig ? -1 : 1;
    // 2) wer noch nie dran war (letztesJahr 0) zuerst, sonst älteste Ausrichtung zuerst
    if (a.letztesJahr !== b.letztesJahr) return a.letztesJahr - b.letztesJahr;
    // 3) wer insgesamt seltener ausgerichtet hat, zuerst
    if (a.anzahl !== b.anzahl) return a.anzahl - b.anzahl;
    // 4) stabil alphabetisch
    return a.teamName.localeCompare(b.teamName);
  });

  return kandidaten;
}
