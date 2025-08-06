/**
 * Service zur Bestimmung des Status eines Durchgangs
 */

/**
 * Bestimmt den aktuellen Durchgang basierend auf den vorhandenen Ergebnissen
 * @param allScores Alle Ergebnisse
 * @param maxRounds Maximale Anzahl an Durchgängen
 * @returns Nummer des aktuellen Durchgangs (höchster begonnener Durchgang)
 */
export function determineCurrentRound(
  allScores: any[],
  maxRounds: number
): number {
  // Wenn keine Ergebnisse vorhanden sind, ist der aktuelle Durchgang 0
  if (!allScores || allScores.length === 0) return 0;
  
  // Finde den höchsten Durchgang, für den Ergebnisse vorhanden sind
  let highestRound = 0;
  
  for (const score of allScores) {
    if (score.durchgang && typeof score.durchgang === 'number') {
      highestRound = Math.max(highestRound, score.durchgang);
    }
  }
  
  // Begrenze auf die maximale Anzahl an Durchgängen
  return Math.min(highestRound, maxRounds);
}
