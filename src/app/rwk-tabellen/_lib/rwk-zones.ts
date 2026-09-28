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

/**
 * Baut den Anzeigenamen eines Schützen aus firstName/lastName/title zusammen.
 * Fallback auf das `name`-Feld, wenn keine Einzelteile vorhanden sind.
 */
export const buildDisplayName = (shooterData: {
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
}): string => {
  let displayName = shooterData.name || '';
  if (shooterData.firstName || shooterData.lastName) {
    const nameParts: string[] = [];
    if (shooterData.firstName) nameParts.push(shooterData.firstName);
    if (shooterData.lastName) nameParts.push(shooterData.lastName);
    if (shooterData.title) nameParts.push(shooterData.title);
    displayName = nameParts.join(' ');
  }
  return displayName;
};

/**
 * Auf-/Abstiegs-Prognose durch Vergleich mit der Nachbarliga (RWK-Ordnung §16-Muster).
 *
 * Vergleichsbasis ist der gemeinsame vollstaendige Durchgang beider Ligen (das Minimum),
 * damit fair verglichen wird (z.B. KL bei DG4, 1.KK bei DG2 -> verglichen wird bis DG2).
 * Angezeigt wird nur, wenn in BEIDEN Ligen mindestens der 1. Durchgang komplett ist.
 *
 *   Zweiter   der Liga  vs. Vorletzter der OBEREN Liga -> Aufstieg moeglich/fraglich
 *   Vorletzter der Liga vs. Zweiter    der UNTEREN Liga -> Abstieg droht / Klassenerhalt
 */
/**
 * Offene Klasse ohne Auf-/Abstieg (RWK-Ordnung §6/§16): LG Freihand, Luftpistole,
 * KK-Sportpistole. Auflage-Ligen (LGA/LPA/"Auflage" im Namen) haben SEHR WOHL Auf-/Abstieg.
 */
export const istOffeneKlasse = (league: { type?: string; name?: string } | null | undefined): boolean => {
  if (!league) return false;
  const type = (league.type || '').toUpperCase();
  const name = (league.name || '').toLowerCase();
  const istAuflage = type === 'LGA' || type === 'LPA' || name.includes('auflage');
  if (istAuflage) return false;
  if (type === 'LG' || type === 'LGS' || type === 'LP' || type === 'KKP') return true;
  if (name.includes('freihand')) return true;
  if (name.includes('pistole')) return true;
  return false;
};

export type PrognoseTyp = 'aufstieg_moeglich' | 'aufstieg_fraglich' | 'abstieg_droht' | 'klassenerhalt' | null;

export interface Prognose {
  typ: PrognoseTyp;
  text: string;
}

/** Summiert die (wertbaren) Team-Ringe bis einschliesslich Durchgang `bisDG`. */
const summeBisDurchgang = (team: TeamDisplay, bisDG: number): number => {
  let summe = 0;
  for (let r = 1; r <= bisDG; r++) {
    const score = team.roundResults?.[`dg${r}`];
    if (score !== null && score !== undefined) summe += score;
  }
  return summe;
};

/** Nur wertbare Teams (echter Rang, kein AK/Einzel), nach Rang sortiert. */
const wertbareGeordnet = (teams: TeamDisplay[]): TeamDisplay[] =>
  teams
    .filter(t => !t.outOfCompetition && !t.istEinzelwertung && !!t.rank)
    .sort((a, b) => (a.rank || 0) - (b.rank || 0));

/**
 * Berechnet die Prognose fuer ein Team.
 * @param team           Das Team, fuer das die Prognose gilt.
 * @param eigeneLiga     Teams der eigenen Liga.
 * @param obereLiga      Teams der naechsthoeheren Liga (order-1) oder null (dann kein Aufstieg).
 * @param untereLiga     Teams der naechstniedrigeren Liga (order+1) oder null (dann kein Abstieg).
 * @param numRounds      Anzahl Durchgaenge der Saison.
 */
export const berechnePrognose = (
  team: TeamDisplay,
  eigeneLiga: TeamDisplay[],
  obereLiga: TeamDisplay[] | null,
  untereLiga: TeamDisplay[] | null,
  numRounds: number
): Prognose => {
  const leer: Prognose = { typ: null, text: '' };
  if (!team.rank || team.outOfCompetition || team.istEinzelwertung) return leer;

  const eigene = wertbareGeordnet(eigeneLiga);
  const n = eigene.length;
  if (n < 2) return leer;

  const eigenerVollDG = determineLeagueCompleteRound(eigeneLiga, numRounds);
  if (eigenerVollDG < 1) return leer; // eigener 1. Durchgang noch nicht komplett

  // --- Zweiter: Aufstiegs-Vergleich mit Vorletztem der OBEREN Liga ---
  if (team.rank === 2 && obereLiga && obereLiga.length > 0) {
    const obere = wertbareGeordnet(obereLiga);
    if (obere.length >= 2) {
      const obererVollDG = determineLeagueCompleteRound(obereLiga, numRounds);
      if (obererVollDG < 1) return leer;
      const basis = Math.min(eigenerVollDG, obererVollDG); // gemeinsamer Durchgang
      if (basis < 1) return leer;

      const vorletzterOben = obere[obere.length - 2]; // Vorletzter der oberen Liga
      const eigenePunkte = summeBisDurchgang(team, basis);
      const vergleichPunkte = summeBisDurchgang(vorletzterOben, basis);
      // Final = beide Ligen haben den letzten Durchgang komplett -> Ergebnis steht fest.
      const final = basis >= numRounds;

      if (eigenePunkte > vergleichPunkte) {
        return final
          ? { typ: 'aufstieg_moeglich', text: `Aufstieg geschafft (${eigenePunkte} > ${vergleichPunkte} Ringe vs. ${vorletzterOben.name})` }
          : { typ: 'aufstieg_moeglich', text: `Aufstieg möglich (${eigenePunkte} > ${vergleichPunkte} Ringe vs. ${vorletzterOben.name}, Stand DG ${basis})` };
      }
      // Nach dem letzten DG steht fest: kein Aufstieg -> neutral (kein negativer Hinweis).
      if (final) return leer;
      return { typ: 'aufstieg_fraglich', text: `Aufstieg fraglich (${eigenePunkte} ≤ ${vergleichPunkte} Ringe vs. ${vorletzterOben.name}, Stand DG ${basis})` };
    }
  }

  // --- Vorletzter: Abstiegs-Vergleich mit Zweitem der UNTEREN Liga ---
  if (team.rank === n - 1 && untereLiga && untereLiga.length > 0) {
    const untere = wertbareGeordnet(untereLiga);
    if (untere.length >= 2) {
      const untererVollDG = determineLeagueCompleteRound(untereLiga, numRounds);
      if (untererVollDG < 1) return leer;
      const basis = Math.min(eigenerVollDG, untererVollDG);
      if (basis < 1) return leer;

      const zweiterUnten = untere[1]; // Zweiter der unteren Liga
      const eigenePunkte = summeBisDurchgang(team, basis);
      const vergleichPunkte = summeBisDurchgang(zweiterUnten, basis);
      // Final = beide Ligen haben den letzten Durchgang komplett -> Ergebnis steht fest.
      const final = basis >= numRounds;

      if (eigenePunkte > vergleichPunkte) {
        return final
          ? { typ: 'klassenerhalt', text: `Klassenerhalt geschafft (${eigenePunkte} > ${vergleichPunkte} Ringe vs. ${zweiterUnten.name})` }
          : { typ: 'klassenerhalt', text: `Klassenerhalt (${eigenePunkte} > ${vergleichPunkte} Ringe vs. ${zweiterUnten.name}, Stand DG ${basis})` };
      }
      return final
        ? { typ: 'abstieg_droht', text: `Abstieg (${eigenePunkte} ≤ ${vergleichPunkte} Ringe vs. ${zweiterUnten.name})` }
        : { typ: 'abstieg_droht', text: `Abstieg droht (${eigenePunkte} ≤ ${vergleichPunkte} Ringe vs. ${zweiterUnten.name}, Stand DG ${basis})` };
    }
  }

  return leer;
};
