/**
 * Service zum Identifizieren fehlender Ergebnisse
 */

/**
 * Findet fehlende Ergebnisse für einen Schützen
 * @param results Ergebnisse des Schützen
 * @param currentRound Aktueller Durchgang (höchster begonnener Durchgang)
 * @returns Array mit den Nummern der fehlenden Durchgänge
 */
export function findMissingRounds(
  results: Record<string, number | null> | undefined,
  currentRound: number
): number[] {
  if (!results) return Array.from({ length: currentRound }, (_, i) => i + 1);
  
  const missingRounds: number[] = [];
  
  // Prüfe jeden Durchgang bis zum aktuellen
  for (let round = 1; round <= currentRound; round++) {
    if (isRoundMissing(results, round)) {
      missingRounds.push(round);
    }
  }
  
  return missingRounds;
}

function isRoundMissing(results: Record<string, number | null>, round: number): boolean {
  const roundKey = `dg${round}`;
  return results[roundKey] === null || results[roundKey] === undefined;
}

/**
 * Prüft, ob ein Schütze Ergebnisse für spätere Durchgänge hat, aber frühere fehlen
 * @param results Ergebnisse des Schützen
 * @param maxRound Maximale Anzahl an Durchgängen
 * @returns true, wenn spätere Durchgänge vorhanden sind, aber frühere fehlen
 */
export function hasLaterRoundsButMissingEarlier(
  results: Record<string, number | null> | undefined,
  maxRound: number
): boolean {
  if (!results) return false;
  
  let foundLater = false;
  
  // Prüfe von hinten nach vorne
  for (let round = maxRound; round >= 1; round--) {
    const hasResult = !isRoundMissing(results, round);
    
    if (hasResult) {
      foundLater = true;
    } else if (foundLater) {
      return true;
    }
  }
  
  return false;
}
