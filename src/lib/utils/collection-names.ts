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
  } else if (['LG', 'LGA', 'LP', 'LPA'].includes(leagueType)) {
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