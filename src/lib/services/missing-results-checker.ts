/**
 * Service zum Identifizieren fehlender Ergebnisse
 */

/**
 * Findet fehlende Ergebnisse für einen Schützen
 * @param results Ergebnisse des Schützen
 * @param maxRound Maximale Anzahl an Durchgängen
 * @param currentRound Aktueller Durchgang (höchster begonnener Durchgang)
 * @returns Array mit den Nummern der fehlenden Durchgänge
 */
export function findMissingRounds(
  results: Record<string, number | null> | undefined,
  maxRound: number,
  currentRound: number
): number[] {
  if (!results) return Array.from({ length: currentRound }, (_, i) => i + 1);
  
  const missingRounds: number[] = [];
  
  // Prüfe jeden Durchgang bis zum aktuellen
  for (let round = 1; round <= currentRound; round++) {
    const roundKey = `dg${round}`;
    
    // Wenn das Ergebnis null oder undefined ist, fehlt es
    if (results[roundKey] === null || results[roundKey] === undefined) {
      missingRounds.push(round);
    }
  }
  
  return missingRounds;
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
    const roundKey = `dg${round}`;
    
    // Wenn ein späteres Ergebnis vorhanden ist
    if (results[roundKey] !== null && results[roundKey] !== undefined) {
      foundLater = true;
    } 
    // Wenn ein früheres Ergebnis fehlt, aber ein späteres vorhanden ist
    else if (foundLater) {
      return true;
    }
  }
  
  return false;
}