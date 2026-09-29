/**
 * Helper functions for generating season-specific collection names
 */

import type { FirestoreLeagueSpecificDiscipline } from '@/types/rwk';

/**
 * Generates season-specific collection name based on year and discipline
 */
export function getSeasonSpecificScoresCollection(
  competitionYear: number,
  leagueType: FirestoreLeagueSpecificDiscipline
): string {
  // Normalisiere Disziplin-Namen
  let normalizedDiscipline = 'UNKNOWN';
  
  if (['KK', 'KKG'].includes(leagueType)) {
    normalizedDiscipline = 'KK';
  } else if (['LG', 'LGA', 'LGS', 'LP', 'LPA'].includes(leagueType)) {
    // LGS (Luftgewehr Freihand) gehört zur Luftdruck-Kategorie und MUSS hier
    // gelistet sein – sonst landet ein LGS-Ergebnis in rwk_scores_JAHR_UNKNOWN
    // statt _LD und wäre für Tabellen und Statistik unauffindbar.
    normalizedDiscipline = 'LD';
  } else if (leagueType === 'KKP') {
    normalizedDiscipline = 'KKP';
  }
  return `rwk_scores_${competitionYear}_${normalizedDiscipline}`;
}

/**
 * Tries to get season-specific collection, falls back to original
 */
export function getScoresCollectionName(
  competitionYear?: number,
  leagueType?: FirestoreLeagueSpecificDiscipline
): string {
  if (competitionYear && leagueType) {
    return getSeasonSpecificScoresCollection(competitionYear, leagueType);
  }
  
  return 'rwk_scores'; // Fallback to original collection
}