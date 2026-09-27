import type { TeamDisplay } from '@/types/rwk';

/** Case-insensitive: Teams mit "einzel" im Namen werden aus der Mannschaftsliste gefiltert. */
export const EXCLUDED_TEAM_NAME_PART = 'einzel';

/**
 * Auf-/Abstiegs-Zone einer Mannschaft anhand ihres Rangs und der Ligagröße.
 * Regel (positionsbasiert, skaliert mit der Ligagröße N = Anzahl wertbarer Teams):
 *   Platz 1        -> 'gold'      (Meister/Aufstieg)
 *   Platz 2        -> 'silber'    (Aufstieg/Vergleich)
 *   Platz N        -> 'abstieg'
 *   Platz N-1      -> 'kampf'     (Abstiegskampf)
 *   sonst          -> null        (neutral)
 * Bei Ueberlappung in kleinen Ligen: Gold/Silber haben oben Vorrang,
 * Abstieg hat unten Vorrang vor Abstiegskampf.
 */
export type RwkZone = 'gold' | 'silber' | 'kampf' | 'abstieg' | null;

export const getRwkZone = (rank: number | null | undefined, wertbareTeams: number): RwkZone => {
  if (!rank || rank < 1) return null;      // AK/Einzel/ohne Rang
  if (wertbareTeams < 2) return rank === 1 ? 'gold' : null;
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silber';
  if (rank === wertbareTeams) return 'abstieg';
  if (rank === wertbareTeams - 1) return 'kampf';
  return null;
};

/**
 * Bestimmt den liga-weit vollständigen Durchgang
 * (Alle Teams in der Liga haben diesen Durchgang vollständig)
 */
export const determineLeagueCompleteRound = (teams: TeamDisplay[], numRounds: number): number => {
  if (!teams || teams.length === 0) return 0;

  // Finde den niedrigsten vollständigen Durchgang über alle Teams
  let leagueCompleteRound = numRounds;

  for (const team of teams) {
    // Überspringe Teams außer Wertung (außer Konkurrenz ODER Einzelmeldung),
    // damit sie den liga-weit vollständigen Durchgang nicht verfälschen.
    if (team.outOfCompetition || team.istEinzelwertung) continue;

    // Finde letzten lückenlosen Durchgang für dieses Team
    let teamCompleteRound = 0;
    for (let r = 1; r <= numRounds; r++) {
      if (team.roundResults?.[`dg${r}`] !== null) {
        teamCompleteRound = r;
      } else {
        break; // Lücke gefunden
      }
    }

    // Nimm das Minimum (schwächstes Glied)
    leagueCompleteRound = Math.min(leagueCompleteRound, teamCompleteRound);
  }

  return leagueCompleteRound;
};
