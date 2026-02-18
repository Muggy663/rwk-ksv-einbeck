// src/lib/utils/score-deduplication.ts
import type { ScoreEntry } from '@/types/rwk';

/**
 * Optionen für die Duplikat-Filterung von Scores
 */
export interface DeduplicationOptions {
  /** Bevorzuge Original-Scores gegenüber Substitution-Kopien */
  preferOriginalOverCopy?: boolean;
  /** Verwende neuestes Ergebnis bei Duplikaten (basierend auf entryTimestamp) */
  useLatestTimestamp?: boolean;
  /** Gruppierungs-Strategie für Duplikat-Erkennung */
  groupBy?: 'shooter-round' | 'shooter-round-year-type';
}

/**
 * Entfernt Duplikate aus Score-Array basierend auf konfigurierbaren Regeln
 * 
 * @param scores - Array von Score-Einträgen
 * @param options - Konfiguration für Duplikat-Erkennung
 * @returns Dedupliziertes Score-Array
 */
export function deduplicateScores(
  scores: ScoreEntry[],
  options: DeduplicationOptions = {
    preferOriginalOverCopy: true,
    useLatestTimestamp: true,
    groupBy: 'shooter-round-year-type'
  }
): ScoreEntry[] {
  const map = new Map<string, ScoreEntry>();
  const groupByKey = options.groupBy || 'shooter-round-year-type';

  scores.forEach(score => {
    const key = createDeduplicationKey(score, groupByKey);
    const existing = map.get(key);

    if (!existing || shouldReplaceScore(existing, score, options)) {
      map.set(key, score);
    }
  });

  return Array.from(map.values());
}

/**
 * Erstellt eindeutigen Schlüssel für Duplikat-Erkennung
 */
function createDeduplicationKey(score: ScoreEntry, groupBy: string): string {
  if (groupBy === 'shooter-round-year-type') {
    return `${score.shooterId}|${score.durchgang}|${score.competitionYear}|${score.leagueType}`;
  }
  
  return `${score.shooterId}|${score.durchgang}`;
}

/**
 * Entscheidet ob ein neuer Score einen bestehenden ersetzen soll
 */
function shouldReplaceScore(
  existing: ScoreEntry,
  newScore: ScoreEntry,
  options: DeduplicationOptions
): boolean {
  // Priorität 1: Original vs. Substitution-Kopie
  if (options.preferOriginalOverCopy) {
    const newIsCopy = newScore.isSubstitutionCopy === true;
    const existingIsCopy = existing.isSubstitutionCopy === true;
    
    if (newIsCopy && !existingIsCopy) return false; // Behalte Original
    if (!newIsCopy && existingIsCopy) return true;  // Ersetze Kopie durch Original
  }

  // Priorität 2: Neuestes Ergebnis (Timestamp)
  if (options.useLatestTimestamp) {
    const newTimestamp = newScore.entryTimestamp?.seconds || 0;
    const existingTimestamp = existing.entryTimestamp?.seconds || 0;
    
    return newTimestamp > existingTimestamp;
  }

  return false;
}

/**
 * Gruppiert Scores nach Durchgang für Team-Berechnungen
 * 
 * @param scores - Deduplizierte Scores
 * @param numRounds - Anzahl der Durchgänge
 * @returns Map mit Durchgang -> Array von Ringzahlen
 */
export function groupScoresByRound(
  scores: ScoreEntry[],
  numRounds: number
): Map<number, number[]> {
  const scoresByRound = new Map<number, number[]>();
  
  // Initialisiere alle Durchgänge
  for (let r = 1; r <= numRounds; r++) {
    scoresByRound.set(r, []);
  }
  
  // Gruppiere Scores
  scores.forEach(score => {
    if (score.durchgang >= 1 && score.durchgang <= numRounds && typeof score.totalRinge === 'number') {
      scoresByRound.get(score.durchgang)?.push(score.totalRinge);
    }
  });
  
  return scoresByRound;
}

/**
 * Gruppiert Scores nach Schütze für Einzelwertungen
 * 
 * @param scores - Deduplizierte Scores
 * @returns Map mit shooterId -> Array von Scores
 */
export function groupScoresByShooter(scores: ScoreEntry[]): Map<string, ScoreEntry[]> {
  const scoresByShooter = new Map<string, ScoreEntry[]>();
  
  scores.forEach(score => {
    if (!scoresByShooter.has(score.shooterId)) {
      scoresByShooter.set(score.shooterId, []);
    }
    scoresByShooter.get(score.shooterId)!.push(score);
  });
  
  return scoresByShooter;
}
