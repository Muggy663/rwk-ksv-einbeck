/**
 * Validierungsfunktionen für Ergebnisse und Durchgänge
 */

import { MAX_SHOOTERS_PER_TEAM } from '@/types/rwk';

/**
 * Prüft, ob ein Durchgang für ein Team vollständig ist
 * @param teamScores Alle Scores für ein Team
 * @param durchgang Durchgangsnummer
 * @param shooterIds IDs der Schützen im Team
 * @returns true wenn der Durchgang vollständig ist, sonst false
 */
export function isRoundComplete(
  teamScores: any[], 
  durchgang: number, 
  shooterIds: string[]
): boolean {
  // Wenn keine Schützen im Team sind, kann der Durchgang nicht vollständig sein
  if (!shooterIds || shooterIds.length === 0) {
    return false;
  }

  // Filtere Scores für den angegebenen Durchgang
  const scoresForRound = teamScores.filter(score => 
    score.durchgang === durchgang && 
    typeof score.totalRinge === 'number' && 
    score.totalRinge > 0
  );

  // Prüfe, ob für jeden Schützen ein Ergebnis vorliegt
  const shootersWithScores = new Set(scoresForRound.map(score => score.shooterId));
  
  // Wenn das Team weniger als MAX_SHOOTERS_PER_TEAM Schützen hat, müssen alle Schützen geschossen haben
  if (shooterIds.length <= MAX_SHOOTERS_PER_TEAM) {
    return shooterIds.every(id => shootersWithScores.has(id));
  }
  
  // Wenn das Team mehr als MAX_SHOOTERS_PER_TEAM Schützen hat, müssen mindestens MAX_SHOOTERS_PER_TEAM Schützen geschossen haben
  return shootersWithScores.size >= MAX_SHOOTERS_PER_TEAM;
}

/**
 * Prüft, ob ein Durchgang für eine Liga vollständig ist
 * @param teams Alle Teams in der Liga
 * @param durchgang Durchgangsnummer
 * @param allScores Alle Scores für die Liga
 * @returns true wenn der Durchgang für alle Teams vollständig ist, sonst false
 */
export function isLeagueRoundComplete(
  teams: any[], 
  durchgang: number, 
  allScores: any[]
): boolean {
  // Wenn keine Teams in der Liga sind, ist der Durchgang nicht vollständig
  if (!teams || teams.length === 0) {
    return false;
  }

  // Prüfe für jedes Team, ob der Durchgang vollständig ist
  return teams.every(team => {
    // Filtere Scores für dieses Team
    const teamScores = allScores.filter(score => score.teamId === team.id);
    return isRoundComplete(teamScores, durchgang, team.shooterIds || []);
  });
}

/**
 * Berechnet den höchsten vollständigen Durchgang für eine Liga
 * @param teams Alle Teams in der Liga
 * @param allScores Alle Scores für die Liga
 * @param maxRounds Maximale Anzahl an Durchgängen
 * @returns Nummer des höchsten vollständigen Durchgangs (0 wenn keiner vollständig ist)
 */
export function getHighestCompleteRound(
  teams: any[], 
  allScores: any[], 
  maxRounds: number
): number {
  // Prüfe von der höchsten Rundennummer abwärts
  for (let round = maxRounds; round >= 1; round--) {
    if (isLeagueRoundComplete(teams, round, allScores)) {
      return round;
    }
  }
  return 0;
}

/**
 * Prüft, ob ein Schütze in einem Durchgang ein Ergebnis hat
 * @param shooterId ID des Schützen
 * @param durchgang Durchgangsnummer
 * @param allScores Alle Scores
 * @returns true wenn der Schütze ein Ergebnis hat, sonst false
 */
export function hasShooterResultForRound(
  shooterId: string,
  durchgang: number,
  allScores: any[]
): boolean {
  return allScores.some(score => 
    score.shooterId === shooterId && 
    score.durchgang === durchgang && 
    typeof score.totalRinge === 'number' && 
    score.totalRinge > 0
  );
}

/**
 * Findet fehlende Ergebnisse für einen Durchgang
 * @param teams Alle Teams
 * @param durchgang Durchgangsnummer
 * @param allScores Alle Scores
 * @returns Array mit fehlenden Ergebnissen (Team, Schütze)
 */
export function findMissingResults(
  teams: any[],
  durchgang: number,
  allScores: any[]
): Array<{teamId: string, teamName: string, shooterId: string, shooterName: string}> {
  const missingResults = [];
  
  for (const team of teams) {
    const shooterIds = team.shooterIds || [];
    
    for (const shooterId of shooterIds) {
      if (!hasShooterResultForRound(shooterId, durchgang, allScores)) {
        // Finde Schützenname
        const shooter = allScores.find(score => score.shooterId === shooterId);
        const shooterName = shooter ? shooter.shooterName : 'Unbekannter Schütze';
        
        missingResults.push({
          teamId: team.id,
          teamName: team.name || 'Unbekanntes Team',
          shooterId,
          shooterName
        });
      }
    }
  }
  
  return missingResults;
}
