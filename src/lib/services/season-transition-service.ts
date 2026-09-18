// src/lib/services/season-transition-service.ts
import { db } from '@/lib/firebase/config';
import { logError, logWarn, logDebug } from '@/lib/utils/secure-logger';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import { SubstitutionService } from './substitution-service';
import { TeamCalculationService } from './team-calculation-service';
import { getDisciplineCategory } from '@/types/rwk';

export interface TeamStanding {
  teamId: string;
  teamName: string;
  clubId: string;
  clubName: string;
  leagueId: string;
  leagueName: string;
  position: number;
  totalScore: number;
  averageScore: number;
  roundsPlayed: number;
}

export interface PromotionRelegationRule {
  teamId: string;
  teamName: string;
  clubName: string;
  currentLeague: string;
  currentPosition: number;
  action: 'promote' | 'relegate' | 'stay' | 'compare';
  targetLeague?: string;
  reason: string;
  confirmed: boolean;
  compareWith?: {
    teamId: string;
    teamName: string;
    league: string;
    position: number;
    score: number;
  };
}

/**
 * Berechnet die aktuellen Tabellenstände für eine Liga
 */
export async function calculateLeagueStandings(leagueId: string, competitionYear: number): Promise<TeamStanding[]> {
  try {
    // Teams der Liga laden (nur Mannschaften, keine Einzelschützen)
    const teamsQuery = query(
      collection(db, 'rwk_teams'),
      where('leagueId', '==', leagueId),
      where('competitionYear', '==', competitionYear)
    );
    const teamsSnapshot = await getDocs(teamsQuery);
    
    // Filtere Einzelschützen aus (Teams ohne shooterIds oder mit weniger als 3 Schützen)
    const mannschaftsTeams = teamsSnapshot.docs.filter(doc => {
      const team = doc.data();
      const shooterCount = team.shooterIds?.length || 0;
      return shooterCount >= 3; // Nur echte Mannschaften (mind. 3 Schützen)
    });
    
    // Clubs für Namen laden
    const clubsQuery = query(collection(db, 'clubs'));
    const clubsSnapshot = await getDocs(clubsQuery);
    const clubsMap = new Map();
    clubsSnapshot.docs.forEach(doc => {
      clubsMap.set(doc.id, doc.data().name);
    });

    // Liga-Info laden
    const leagueDoc = await getDocs(query(collection(db, 'rwk_leagues'), where('__name__', '==', leagueId)));
    const leagueData = leagueDoc.docs[0]?.data();
    const leagueName = leagueData?.name || 'Unbekannte Liga';

    const standings: TeamStanding[] = [];

    for (const teamDoc of mannschaftsTeams) {
      const team = teamDoc.data();
      
      // Verwende leagueType vom Team, nicht seasonType!
      const teamLeagueType = team.leagueType || leagueData?.type || 'KKG';
      
      // Normalisiere für Collection-Namen
      let collectionSuffix = 'KK';
      if (['KK', 'KKG'].includes(teamLeagueType)) collectionSuffix = 'KK';
      else if (['LG', 'LGA', 'LP', 'LPA', 'LD'].includes(teamLeagueType)) collectionSuffix = 'LD';
      else if (teamLeagueType === 'KKP') collectionSuffix = 'KKP';
      
      const collectionName = `rwk_scores_${competitionYear}_${collectionSuffix}`;
      const numRoundsForCompetition = 5;
      
      logDebug(`Team ${team.name}: Collection ${collectionName} (LeagueType: ${teamLeagueType})`);
      
      // Ergebnisse für das Team laden
      const scoresQuery = query(
        collection(db, collectionName),
        where('teamId', '==', teamDoc.id)
      );
      const scoresSnapshot = await getDocs(scoresQuery);
      const teamScoresRaw = scoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as import('@/types/rwk').ScoreEntry[];
      
      logDebug(`Team ${team.name}: ${teamScoresRaw.length} Ergebnisse`);
      
      const substitutions = await SubstitutionService.loadSubstitutions(competitionYear);
      const teamScores = teamScoresRaw;
      
      // Team-Berechnung über zentralen Service
      const calculationResult = TeamCalculationService.calculateTeamResults(
        teamDoc.id,
        teamScores,
        numRoundsForCompetition,
        substitutions,
        team.name
      );
      
      // Warnings ausgeben falls vorhanden
      if (calculationResult.warnings.length > 0) {
        logWarn(`Team ${team.name}`, { warnings: calculationResult.warnings });
      }
      
      // Debug-Ausgabe
      logDebug(`Team ${team.name}: GESAMT = ${calculationResult.totalScore} Ringe (${calculationResult.numScoredRounds} Durchgänge, Schnitt ${calculationResult.averageScore})`);
      
      const totalScore = calculationResult.totalScore;
      const averageScore = calculationResult.averageScore || 0;
      const roundsPlayed = calculationResult.numScoredRounds;

      standings.push({
        teamId: teamDoc.id,
        teamName: team.name,
        clubId: team.clubId,
        clubName: clubsMap.get(team.clubId) || 'Unbekannt',
        leagueId,
        leagueName,
        position: 0, // Wird nach Sortierung gesetzt
        totalScore,
        averageScore,
        roundsPlayed
      });
    }

    // Nach Gesamtergebnis sortieren (höchste zuerst)
    standings.sort((a, b) => b.totalScore - a.totalScore);
    
    // Positionen setzen
    standings.forEach((team, index) => {
      team.position = index + 1;
    });

    return standings;
  } catch (error) {
    logError('Error calculating league standings:', error);
    throw error;
  }
}

/**
 * Bestimmt, ob eine Liga eine "offene Klasse" ohne Auf-/Abstieg ist.
 * Laut RWK-Ordnung §6/§16: LG Freihand, Luftpistole (LP/LPA) und KK-Sportpistole
 * sind offene Klassen. LG AUFLAGE (LGA) und KK-Gewehr Auflage (Ligen mit
 * Kreisoberliga/Kreisliga/Kreisklassen) haben SEHR WOHL Auf-/Abstieg.
 *
 * Wichtig: Nicht allein am Namen "luftgewehr" festmachen — sonst würde die
 * LG-Auflage-Liga fälschlich als offene Klasse behandelt.
 */
function istOffeneKlasse(league: { type?: string; name?: string } | null | undefined): boolean {
  if (!league) return false;
  const type = (league.type || '').toUpperCase();
  const name = (league.name || '').toLowerCase();

  // Auflage-Ligen haben immer Auf-/Abstieg (Kreisoberliga/Kreisliga/Kreisklassen).
  const istAuflage = type === 'LGA' || type === 'LPA' || name.includes('auflage');
  if (istAuflage) return false;

  // Echte offene Klassen: Luftgewehr Freihand, Luftpistole, KK-Sportpistole.
  if (type === 'LG' || type === 'LGS' || type === 'LP' || type === 'KKP') return true;
  if (name.includes('freihand')) return true;
  if (name.includes('pistole')) return true;

  return false;
}

/**
 * Generiert Auf-/Abstiegsvorschläge basierend auf RWK-Ordnung §16
 * Berücksichtigt Abmeldungen und Ligagrößen-Anpassungen
 */
export async function generatePromotionRelegationSuggestions(
  leagueId: string, 
  competitionYear: number,
  allLeagues: any[],
  withdrawnTeams: string[] = [], // Abgemeldete Teams
  targetLeagueSizes: Map<string, number> = new Map(), // Gewünschte Ligagrößen
  _newClubs: string[] = [] // Neue Vereine (starten in niedrigster Liga)
): Promise<PromotionRelegationRule[]> {
  try {
    const standings = await calculateLeagueStandings(leagueId, competitionYear);
    const currentLeague = allLeagues.find(l => l.id === leagueId);
    
    if (!currentLeague || standings.length === 0) {
      return [];
    }

    const suggestions: PromotionRelegationRule[] = [];
    const totalTeams = standings.length;

    // Ligen nach Hierarchie sortieren (order-Feld)
    const sortedLeagues = [...allLeagues].sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentLeagueIndex = sortedLeagues.findIndex(l => l.id === leagueId);
    
    const higherLeague = currentLeagueIndex > 0 ? sortedLeagues[currentLeagueIndex - 1] : null;
    const lowerLeague = currentLeagueIndex < sortedLeagues.length - 1 ? sortedLeagues[currentLeagueIndex + 1] : null;

    // Prüfe auf Abmeldungen in dieser Liga
    const withdrawnInThisLeague = standings.filter(team => withdrawnTeams.includes(team.teamId));
    
    // Berechne verfügbare Plätze basierend auf Abmeldungen aus höheren Ligen
    const withdrawnFromHigherLeagues = allLeagues
      .filter(league => (league.order || 0) < (currentLeague.order || 0))
      .reduce((count) => {
        // Hier würde man die Abmeldungen aus höheren Ligen zählen
        return count;
      }, 0);
    
    const additionalPromotionSlots = withdrawnFromHigherLeagues;
    const targetSize = targetLeagueSizes.get(leagueId) || totalTeams;
    const sizeReduction = totalTeams - targetSize;

    // Pre-load league standings for comparisons to avoid repeated queries
    const higherLeagueStandings = higherLeague ? await calculateLeagueStandings(higherLeague.id, competitionYear) : [];
    const lowerLeagueStandings = lowerLeague ? await calculateLeagueStandings(lowerLeague.id, competitionYear) : [];

    for (const team of standings) {
      let action: 'promote' | 'relegate' | 'stay' | 'compare' = 'stay';
      let reason = 'Verbleibt in aktueller Liga';
      let targetLeague = undefined;

      // Abgemeldete Teams automatisch absteigen lassen
      if (withdrawnTeams.includes(team.teamId)) {
        if (lowerLeague) {
          action = 'relegate';
          reason = 'Nach Meldeschluss abgemeldet - steigt automatisch ab (RWK-Ordnung §16)';
          targetLeague = lowerLeague.name;
        } else {
          reason = 'Nach Meldeschluss abgemeldet - verbleibt (niedrigste Liga)';
        }
      }
      // Meister steigt auf (außer höchste Liga oder offene Klassen)
      else if (team.position === 1) {
        const isOpenGroup = istOffeneKlasse(currentLeague);
        if (isOpenGroup) {
          reason = 'Meister - verbleibt (offene Gruppe, keine Auf-/Abstiege)';
        } else if (higherLeague && !currentLeague.name.includes('Kreisoberliga')) {
          action = 'promote';
          reason = 'Meister - steigt automatisch auf';
          targetLeague = higherLeague.name;
        } else {
          reason = 'Meister - verbleibt (höchste Liga)';
        }
      } else if (team.position === totalTeams) {
        // Letzter steigt ab (außer bei Ligaverkleinerung, offene Klassen oder niedrigste Liga)
        const isOpenGroup = istOffeneKlasse(currentLeague);
        if (isOpenGroup) {
          reason = 'Letzter Platz - verbleibt (offene Gruppe, keine Auf-/Abstiege)';
        } else if (currentLeague.name.toLowerCase().includes('2. kreisklasse')) {
          reason = 'Letzter Platz - verbleibt (niedrigste Liga)';
        } else if (lowerLeague && sizeReduction === 0) {
          action = 'relegate';
          reason = 'Letzter Platz - steigt automatisch ab';
          targetLeague = lowerLeague.name;
        } else if (sizeReduction > 0) {
          action = 'relegate';
          reason = `Letzter Platz - steigt ab (Ligaverkleinerung um ${sizeReduction} Teams)`;
          targetLeague = lowerLeague?.name || 'Niedrigere Liga';
        } else {
          reason = 'Letzter Platz - verbleibt (niedrigste Liga)';
        }
      } else if (team.position === 2 && higherLeague) {
        const isOpenGroup = istOffeneKlasse(currentLeague);
        if (isOpenGroup) {
          reason = 'Zweiter - verbleibt (offene Gruppe, keine Auf-/Abstiege)';
        } else {
        // Zweiter: Vergleich mit Vorletztem der höheren Liga
        if (additionalPromotionSlots > 0) {
          action = 'promote';
          reason = 'Zweiter - steigt auf (zusätzlicher Platz durch Abmeldung aus höherer Liga)';
          targetLeague = higherLeague.name;
        } else {
          // Vorletzten der höheren Liga finden und vergleichen
          const penultimateTeam = higherLeagueStandings.find(t => t.position === higherLeagueStandings.length - 1);
          
          if (penultimateTeam && team.totalScore > penultimateTeam.totalScore) {
            action = 'promote';
            reason = `Zweiter - steigt auf (${team.totalScore} > ${penultimateTeam.totalScore} Ringe vs. ${penultimateTeam.teamName})`;
            targetLeague = higherLeague.name;
          } else if (penultimateTeam) {
            reason = `Zweiter - verbleibt (${team.totalScore} <= ${penultimateTeam.totalScore} Ringe vs. ${penultimateTeam.teamName})`;
          } else {
            reason = 'Zweiter - verbleibt (kein Vergleichsteam gefunden)';
          }
        }
        }
      } else if (team.position === totalTeams - 1 && lowerLeague) {
        const isOpenGroup = istOffeneKlasse(currentLeague);
        const isLowestLeague = currentLeague.name.toLowerCase().includes('2. kreisklasse');
        if (isOpenGroup || isLowestLeague) {
          reason = isOpenGroup ? 'Vorletzter - verbleibt (offene Gruppe, keine Auf-/Abstiege)' : 'Vorletzter - verbleibt (niedrigste Liga)';
        } else {
        // Vorletzter: Vergleich mit Zweitem der niedrigeren Liga
        const secondTeam = lowerLeagueStandings.find(t => t.position === 2);
        
        if (secondTeam && team.totalScore > secondTeam.totalScore) {
          reason = `Vorletzter - verbleibt (${team.totalScore} > ${secondTeam.totalScore} Ringe vs. ${secondTeam.teamName})`;
        } else if (secondTeam) {
          action = 'relegate';
          reason = `Vorletzter - steigt ab (${team.totalScore} <= ${secondTeam.totalScore} Ringe vs. ${secondTeam.teamName})`;
          targetLeague = lowerLeague.name;
        } else {
          reason = 'Vorletzter - verbleibt (kein Vergleichsteam gefunden)';
        }
        }
      } else if (sizeReduction > 0 && team.position > totalTeams - sizeReduction) {
        // Zusätzliche Absteiger bei Ligaverkleinerung
        action = 'relegate';
        reason = `Platz ${team.position} - steigt ab (Ligaverkleinerung: ${sizeReduction} weniger Teams)`;
        targetLeague = lowerLeague?.name || 'Niedrigere Liga';
      } else if (additionalPromotionSlots > 1 && team.position <= 2 + additionalPromotionSlots - 1) {
        // Zusätzliche Aufsteiger bei vielen Abmeldungen aus höheren Ligen
        action = 'promote';
        reason = `Platz ${team.position} - steigt auf (${additionalPromotionSlots} zusätzliche Plätze durch Abmeldungen)`;
        targetLeague = higherLeague?.name || 'Höhere Liga';
      }

      suggestions.push({
        teamId: team.teamId,
        teamName: team.teamName,
        clubName: team.clubName,
        currentLeague: currentLeague.name,
        currentPosition: team.position,
        action,
        targetLeague,
        reason,
        confirmed: false
      });
    }
    
    // Zusätzliche Hinweise für Liga-Anpassungen
    if (withdrawnInThisLeague.length > 0) {
      logDebug(`Liga ${currentLeague.name}: ${withdrawnInThisLeague.length} Teams abgemeldet`);
    }
    if (sizeReduction > 0) {
      logDebug(`Liga ${currentLeague.name}: Verkleinerung um ${sizeReduction} Teams geplant`);
    }
    if (additionalPromotionSlots > 0) {
      logDebug(`Liga ${currentLeague.name}: ${additionalPromotionSlots} zusätzliche Aufstiegsplätze verfügbar`);
    }

    return suggestions;
  } catch (error) {
    logError('Error generating promotion/relegation suggestions:', error);
    throw error;
  }
}

/**
 * Erstellt eine neue Saison basierend auf einer bestehenden
 * Berücksichtigt neue Vereine (RWK-Ordnung §7)
 */
export async function createNewSeason(
  sourceSeasonId: string,
  targetYear: number,
  targetType: 'KK' | 'LD',
  newClubs: string[] = [] // Neue Vereine, die in niedrigster Liga starten
): Promise<string> {
  try {
    const batch = writeBatch(db);
    
    // Neue Saison erstellen
    const seasonName = `RWK ${targetYear} ${targetType === 'KK' ? 'Kleinkaliber' : 'Luftdruck'}`;
    const newSeasonRef = doc(collection(db, 'seasons'));
    
    batch.set(newSeasonRef, {
      competitionYear: targetYear,
      type: targetType,
      status: 'Vorbereitung',
      name: seasonName
    });

    // Ligen kopieren
    const sourceLeaguesQuery = query(
      collection(db, 'rwk_leagues'),
      where('seasonId', '==', sourceSeasonId)
    );
    const sourceLeaguesSnapshot = await getDocs(sourceLeaguesQuery);
    
    const leagueMapping = new Map(); // Alte ID -> Neue ID
    
    // Merkt sich je Quell-Liga-ID die order (Liga-Rang), damit Teams später ihren
    // vorherigen Rang kennen (für die Auf-/Abstiegs-Anwendung).
    const leagueOrderMap = new Map<string, number>();

    for (const leagueDoc of sourceLeaguesSnapshot.docs) {
      const leagueData = leagueDoc.data();
      const newLeagueRef = doc(collection(db, 'rwk_leagues'));
      
      batch.set(newLeagueRef, {
        ...leagueData,
        seasonId: newSeasonRef.id,
        competitionYear: targetYear
      });
      
      leagueMapping.set(leagueDoc.id, newLeagueRef.id);
      leagueOrderMap.set(leagueDoc.id, (leagueData as any).order ?? 0);
    }

    // Teams kopieren (ohne Ergebnisse)
    const sourceTeamsQuery = query(
      collection(db, 'rwk_teams'),
      where('seasonId', '==', sourceSeasonId)
    );
    const sourceTeamsSnapshot = await getDocs(sourceTeamsQuery);
    
    // Finde niedrigste Liga für neue Vereine (RWK-Ordnung §7)
    const lowestLeague = sourceLeaguesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as { id: string; order?: number }))
      .sort((a, b) => (b.order || 0) - (a.order || 0))[0]; // Höchste order = niedrigste Liga
    
    const lowestLeagueNewId = leagueMapping.get(lowestLeague?.id);
    
    for (const teamDoc of sourceTeamsSnapshot.docs) {
      const teamData = teamDoc.data();
      const newTeamRef = doc(collection(db, 'rwk_teams'));
      let newLeagueId = leagueMapping.get(teamData.leagueId);
      
      // Neue Vereine müssen in niedrigster Liga starten (RWK-Ordnung §7)
      if (newClubs.includes(teamData.clubId) && lowestLeagueNewId) {
        newLeagueId = lowestLeagueNewId;
      }
      
      if (newLeagueId) {
        batch.set(newTeamRef, {
          ...teamData,
          seasonId: newSeasonRef.id,
          leagueId: newLeagueId,
          competitionYear: targetYear,
          isNewClub: newClubs.includes(teamData.clubId), // Markierung für neue Vereine
          // Rückverweise für die spätere Auf-/Abstiegs-Anwendung:
          sourceTeamId: teamDoc.id,                                // Team-ID aus der Quell-Saison
          previousOrder: leagueOrderMap.get(teamData.leagueId) ?? null, // Liga-Rang der Vorsaison
        });
      }
    }
    
    // Zusätzliche Teams für komplett neue Vereine erstellen
    for (const clubId of newClubs) {
      // Prüfen ob Verein bereits Teams hat
      const existingTeam = sourceTeamsSnapshot.docs.find(doc => doc.data().clubId === clubId);
      
      if (!existingTeam && lowestLeagueNewId) {
        const newTeamRef = doc(collection(db, 'rwk_teams'));
        
        let clubName = 'Neuer Verein';
        try {
          const clubDoc = await getDocs(query(collection(db, 'clubs'), where('__name__', '==', clubId)));
          clubName = clubDoc.docs[0]?.data()?.name || 'Neuer Verein';
        } catch (clubError) {
          logWarn(`Failed to load club data for ${clubId}:`, clubError instanceof Error ? clubError.message : String(clubError));
        }
        
        batch.set(newTeamRef, {
          name: `${clubName} I`,
          clubId: clubId,
          clubName: clubName,
          seasonId: newSeasonRef.id,
          leagueId: lowestLeagueNewId,
          competitionYear: targetYear,
          shooterIds: [],
          isNewClub: true
        });
      }
    }

    await batch.commit();
    return newSeasonRef.id;
  } catch (error) {
    logError('Error creating new season:', error);
    throw new Error(`Failed to create new season: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export interface ApplyResult {
  moved: number;                 // erfolgreich verschobene Teams
  skipped: string[];             // Vorschläge, die nicht angewendet werden konnten (mit Grund)
}

/**
 * Wendet bestätigte Auf-/Abstiegsvorschläge auf die ZIEL-Saison an.
 *
 * Voraussetzung: Die Ziel-Saison wurde per createNewSeason erstellt, d. h. ihre
 * Teams tragen `sourceTeamId` (Verweis auf das Team der Quell-Saison) und stehen
 * zunächst in derselben Liga wie in der Vorsaison. Diese Funktion verschiebt die
 * bestätigten Teams um genau eine Liga-Stufe (Rang über `order`):
 *   promote  -> nächsthöhere Liga (order - 1)
 *   relegate -> nächstniedrigere Liga (order + 1)
 *
 * Matching:
 *   Team    : Ziel-Team mit sourceTeamId === suggestion.teamId
 *   Zielliga: Nachbarliga über order (nicht über den Namen, robuster)
 */
export async function applyPromotionRelegation(
  suggestions: PromotionRelegationRule[],
  targetSeasonId: string
): Promise<ApplyResult> {
  if (!targetSeasonId) {
    throw new Error('Keine Ziel-Saison angegeben.');
  }

  try {
    // Alle bestätigten Vorschläge (auch 'stay'): Verbleiber müssen ebenfalls ihrer
    // (Vorjahres-)Liga zugeordnet werden, falls das gemeldete Team noch keine hat.
    const confirmed = suggestions.filter((s) => s.confirmed);
    const result: ApplyResult = { moved: 0, skipped: [] };
    if (confirmed.length === 0) {
      return result;
    }

    // Ziel-Ligen laden (nach order sortiert = höchste zuerst)
    const leaguesSnap = await getDocs(
      query(collection(db, 'rwk_leagues'), where('seasonId', '==', targetSeasonId))
    );
    const targetLeagues = leaguesSnap.docs
      .map((d) => ({ id: d.id, name: (d.data() as any).name as string, type: (d.data() as any).type as string, order: (d.data() as any).order ?? 0 }))
      .sort((a, b) => a.order - b.order);

    // Ziel-Liga per Name finden (für Vorjahres-Startpunkt, wenn Team noch keine Liga hat).
    // Robust gegen unterschiedliche Schreibweisen zwischen den Saisons:
    //  - alle Leerzeichen entfernen ("2. Kreisklasse" vs. "2.Kreisklasse")
    //  - gängige Disziplin-Synonyme angleichen ("Luftgewehr Freihand" vs. "LG Freihand",
    //    "Luftpistole" vs. "LP" etc.), damit der Name-Vergleich nicht an der
    //    Ausschreibung scheitert.
    const normLiga = (n?: string) =>
      (n || '')
        .toLowerCase()
        .replace(/luftgewehr\s*freihand/g, 'lgfreihand')
        .replace(/\blgf?\b\s*freihand/g, 'lgfreihand')
        .replace(/luftgewehr\s*auflage/g, 'lgauflage')
        .replace(/luftpistole/g, 'lp')
        .replace(/\s+/g, '');
    const ligaByName = new Map(targetLeagues.map((l) => [normLiga(l.name), l]));

    // Disziplin-Kategorie (KK vs. LG/LP) einer Liga, damit Auf-/Abstieg nur
    // innerhalb derselben Disziplin erfolgt und nicht versehentlich in eine
    // benachbarte Liga einer anderen Disziplin springt.
    const kategorie = (type?: string): string => getDisciplineCategory(type as any) || 'unbekannt';

    // Ziel-Teams laden. Es werden AUSSCHLIESSLICH die real in der Ziel-Saison
    // vorhandenen (= gemeldeten) Mannschaften berücksichtigt. Diese Funktion
    // aktualisiert nur deren Liga-Zuordnung (update) — sie legt KEINE Teams an
    // und löscht keine. Nicht gemeldete Vorjahres-Teams werden übersprungen.
    const teamsSnap = await getDocs(
      query(collection(db, 'rwk_teams'), where('seasonId', '==', targetSeasonId))
    );
    // Nur echte Mannschaften (>=3 Schützen) — Einzelschützen ignorieren.
    // previousOrder = Liga-Rang der Vorsaison (nur bei per Saisonwechsel erzeugten
    // Teams gesetzt); wird als stabiler, idempotenter Startpunkt bevorzugt.
    interface ZielTeam { docId: string; leagueId: string | null; previousOrder: number | null; name: string; clubId: string; leagueType: string | null }
    const bySourceId = new Map<string, ZielTeam>();       // primär: sourceTeamId-Verweis
    const byNameCat = new Map<string, ZielTeam>();         // Fallback: Name + Disziplin-Kategorie (LGA/LGS=LG, LP=..)
    const alleZielTeams: ZielTeam[] = [];                  // für die Vereins-Rangfolge-Korrektur
    // Robuste Mannschaftsnamen-Normalisierung für den Fallback-Abgleich zwischen den
    // Saisons: gleicht typische Schreibvarianten an, damit z. B.
    // "SSC Avendshausen eV. I" und "SSC Avendshausen e.V. I" als gleich gelten.
    //  - "e.V."/"eV."/"e. V." -> "ev"
    //  - alle übrigen Punkte und Leerzeichen entfernen
    const normName = (n?: string) =>
      (n || '')
        .toLowerCase()
        // "e.V." / "eV." / "e. V." KOMPLETT entfernen (nur als eigenständiges Wort,
        // nicht mitten in einem Namen). Wichtig: eine Saison kann das Team mit,
        // die andere ohne "e.V." führen ("SC Naensen I" vs. "SC Naensen e.V. I") —
        // beide müssen gleich normalisieren. "Post SV ..." bleibt unberührt.
        .replace(/\be\.?\s*v\.?(?=\s|$)/g, ' ')
        .replace(/[.\s]/g, ''); // übrige Punkte und Leerzeichen entfernen
    // Feinere Disziplin-Unterscheidung als die Kategorie: Auflage (LGA) und Freihand
    // (LGS) gehören beide zur Kategorie "LG", müssen beim Abgleich aber getrennt
    // bleiben (ein Verein hat oft gleichnamige Teams in Auflage UND Freihand).
    const disziplinKey = (type?: string | null): string => {
      const t = (type || '').toUpperCase();
      if (['LGA'].includes(t)) return 'LG-AUFLAGE';
      if (['LGS', 'LG'].includes(t)) return 'LG-FREIHAND';
      if (['LP', 'LPA'].includes(t)) return 'LP';
      if (['KK', 'KKG'].includes(t)) return 'KK';
      if (t === 'KKP') return 'KKP';
      return kategorie(type as any); // Fallback
    };
    teamsSnap.docs.forEach((d) => {
      const data = d.data() as any;
      if ((data.shooterIds?.length || 0) < 3) return; // keine echte Mannschaft
      const eintrag: ZielTeam = {
        docId: d.id,
        leagueId: data.leagueId ?? null,
        previousOrder: typeof data.previousOrder === 'number' ? data.previousOrder : null,
        name: data.name || '',
        clubId: data.clubId || '',
        leagueType: data.leagueType ?? null,
      };
      if (data.sourceTeamId) bySourceId.set(data.sourceTeamId, eintrag);
      const nk = normName(data.name);
      // Primärer Fallback: Name + Disziplin (unterscheidet Auflage-/Freihand-/Pistolen-I)
      const catKey = `${nk}|${disziplinKey(data.leagueType)}`;
      if (nk && !byNameCat.has(catKey)) byNameCat.set(catKey, eintrag);
      alleZielTeams.push(eintrag);
    });

    // Finale Ligazuordnung je Team (docId -> Ziel-Liga). Wird erst NACH der
    // Vereins-Rangfolge-Korrektur in die DB geschrieben, damit beides zusammenpasst.
    type ZielLigaInfo = { id: string; name: string; type: string; order: number };
    const finaleZuordnung = new Map<string, ZielLigaInfo>();
    // Startwert = aktuelle leagueId jedes Teams (falls es nicht in den Vorschlägen vorkommt,
    // bleibt es dort stehen, wo es ist).
    for (const t of alleZielTeams) {
      if (t.leagueId) {
        const l = targetLeagues.find((x) => x.id === t.leagueId);
        if (l) finaleZuordnung.set(t.docId, { id: l.id, name: l.name, type: l.type, order: l.order });
      }
    }

    for (const s of confirmed) {
      // Disziplin der Vorjahresliga (aus dem Vorschlag) bestimmen, um bei Vereinen mit
      // gleichnamigen Teams (z. B. Auflage-I UND Freihand-I) das RICHTIGE Ziel-Team zu treffen.
      const vorjahresLiga = ligaByName.get(normLiga(s.currentLeague));
      const disziplinDerSuggestion = disziplinKey(vorjahresLiga?.type);
      // 1. Match über sourceTeamId (eindeutig, wenn Ziel-Saison per Saisonwechsel entstand)
      // 2. Match über Name + Disziplin (trennt Auflage/Freihand/Pistole sauber)
      // WICHTIG: KEIN reiner Namens-Fallback mehr! Der hat früher gleichnamige Teams
      // ÜBER Disziplingrenzen hinweg gematcht (z. B. LP-"SGi Einbeck I" auf den
      // LGA-Vorschlag) und dabei die Disziplin des Teams fälschlich umgestellt.
      const targetTeam =
        bySourceId.get(s.teamId) ||
        byNameCat.get(`${normName(s.teamName)}|${disziplinDerSuggestion}`);
      if (!targetTeam) {
        // Team der Vorsaison ist in der Ziel-Saison NICHT gemeldet -> nicht anfassen.
        result.skipped.push(`${s.teamName}: in Ziel-Saison nicht gemeldet – übersprungen`);
        continue;
      }
      // Sicherung: Team NIE über Disziplin-Grenzen verschieben. Stimmt die Disziplin
      // des gefundenen Ziel-Teams nicht mit der der Vorjahresliga überein, überspringen.
      if (disziplinKey(targetTeam.leagueType) !== disziplinDerSuggestion) {
        result.skipped.push(`${s.teamName}: Disziplin passt nicht – übersprungen`);
        continue;
      }
      // Start-Liga bestimmen — IMMER aus der Vorjahresangabe, NIE aus der bereits
      // gesetzten leagueId. Nur so ist das Anwenden idempotent: Egal wie oft man
      // klickt, es wird immer relativ zur Vorjahresliga (nicht zur schon bewegten
      // aktuellen Liga) gerechnet. Sonst würden Teams bei jedem Klick kumulativ
      // weiterwandern.
      //   1) previousOrder (Rang der Vorsaison, bei Saisonwechsel gesetzt) — stabilster Wert
      //   2) Fallback: Vorjahresliga-Name aus dem Vorschlag (currentLeague),
      //      da die Ligen in Quell- und Ziel-Saison gleich heißen.
      let startLiga =
        targetTeam.previousOrder !== null
          ? targetLeagues.find((l) => l.order === targetTeam.previousOrder)
          : ligaByName.get(normLiga(s.currentLeague));
      if (!startLiga) {
        // Letzter Fallback: Name aus dem Vorschlag, falls previousOrder ins Leere lief.
        startLiga = ligaByName.get(normLiga(s.currentLeague));
      }
      if (!startLiga) {
        // "Verbleibt" + Team hat bereits eine Liga (z. B. offene Klassen wie
        // Freihand/Pistole): kein Handlungsbedarf, kein Fehler — still überspringen.
        if (s.action === 'stay' && targetTeam.leagueId) {
          continue;
        }
        result.skipped.push(`${s.teamName}: Vorjahresliga „${s.currentLeague}" in Ziel-Saison nicht gefunden`);
        continue;
      }

      // Zielliga bestimmen
      let zielLiga = startLiga;
      if (s.action === 'promote' || s.action === 'relegate') {
        // Nächste Liga GLEICHER Disziplin-Kategorie in Auf-/Abstiegsrichtung.
        const cat = kategorie(startLiga.type);
        const kandidaten = targetLeagues.filter((l) => kategorie(l.type) === cat);
        const nachbar =
          s.action === 'promote'
            ? [...kandidaten].reverse().find((l) => l.order < startLiga!.order) // nächsthöhere Liga
            : kandidaten.find((l) => l.order > startLiga!.order);              // nächstniedrigere Liga
        if (!nachbar) {
          result.skipped.push(
            `${s.teamName}: keine ${s.action === 'promote' ? 'höhere' : 'niedrigere'} Liga vorhanden`
          );
          continue;
        }
        zielLiga = nachbar;
      }

      // Aus dem Auf-/Abstieg berechnete Zielliga in der Zuordnungs-Map vormerken
      // (noch nicht in die DB schreiben – erst nach der Rangfolge-Korrektur).
      finaleZuordnung.set(targetTeam.docId, { id: zielLiga.id, name: zielLiga.name, type: zielLiga.type, order: zielLiga.order });
      logDebug(`${s.action}: ${s.teamName} -> ${zielLiga.name}`);
    }

    // --- Vereins-Rangfolge-Korrektur ---------------------------------------
    // Regel: Innerhalb eines Vereins muss die Mannschaftsstärke die Liga-Reihenfolge
    // bestimmen — I mindestens so hoch wie II, II wie III usw. Da Vereine immer mit I
    // beginnend melden, wird das durchgesetzt, indem pro Verein UND Disziplin
    // (Auflage/Freihand/Pistole getrennt!) die belegten Ligen nach Rang (höchste
    // zuerst) den Mannschaften nach Römerzahl zugewiesen werden (I -> höchste belegte
    // Liga, II -> nächste usw.). Reiner Platztausch — es entstehen keine neuen Belegungen.
    const roemToNum: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
    const roemischeStaerke = (name: string): number => {
      const m = name.trim().match(/\b(IV|V|III|II|I)\s*$/); // Endung I..V (längere zuerst)
      return m ? (roemToNum[m[1]] ?? 99) : 99;
    };
    // Gruppieren nach clubId + Disziplin (LGA/LGS/LP getrennt, sonst würden Auflage-I
    // und Freihand-I fälschlich gegeneinander getauscht).
    const gruppen = new Map<string, ZielTeam[]>();
    for (const t of alleZielTeams) {
      const zuord = finaleZuordnung.get(t.docId);
      if (!zuord) continue;                       // Team ohne Liga -> nicht einbeziehen
      if (roemischeStaerke(t.name) === 99) continue; // kein I..V-Suffix (z. B. Einzel) -> ignorieren
      const key = `${t.clubId}|${disziplinKey(zuord.type)}`;
      if (!gruppen.has(key)) gruppen.set(key, []);
      gruppen.get(key)!.push(t);
    }
    for (const teams of gruppen.values()) {
      if (teams.length < 2) continue;
      // Die von dieser Vereinsgruppe belegten Ligen, aufsteigend nach Rang (order).
      // Mehrfach belegte Ligen bleiben mehrfach enthalten — dadurch dürfen I und II
      // in DERSELBEN Liga stehen (ihre beiden Einträge sind dann identisch).
      const belegteLigen = teams
        .map((t) => finaleZuordnung.get(t.docId)!)
        .sort((a, b) => a.order - b.order);
      // Mannschaften nach Römerzahl aufsteigend (I, II, III …).
      const nachStaerke = [...teams].sort((a, b) => roemischeStaerke(a.name) - roemischeStaerke(b.name));
      // I bekommt die höchste belegte Liga, II die nächste usw. Regel: I nie TIEFER
      // als II. Stehen sie schon korrekt (auch gemeinsam in einer Liga), ändert sich
      // nichts; nur wenn eine höhere Römerzahl höher stünde als eine niedrigere, wird
      // getauscht.
      nachStaerke.forEach((t, i) => {
        finaleZuordnung.set(t.docId, belegteLigen[i]);
      });
    }
    // -----------------------------------------------------------------------

    // Änderungen schreiben: nur Teams, deren finale Liga von der aktuellen abweicht.
    const batch = writeBatch(db);
    for (const t of alleZielTeams) {
      const ziel = finaleZuordnung.get(t.docId);
      if (!ziel) continue;
      if (t.leagueId === ziel.id) continue; // schon korrekt -> nichts tun (idempotent)
      // leagueType nur setzen, wenn das Team noch KEINE Disziplin hat. Vorhandene
      // Disziplin wird nie überschrieben (Schutz gegen versehentliche Umwidmung).
      const setType = !t.leagueType ? { leagueType: ziel.type } : {};
      batch.update(doc(db, 'rwk_teams', t.docId), {
        leagueId: ziel.id,
        ...setType,
      });
      result.moved += 1;
    }

    if (result.moved > 0) {
      await batch.commit();
    }
    return result;
  } catch (error) {
    logError('Error applying promotion/relegation:', error);
    throw error;
  }
}




// ===========================================================================
// Ligagrößen-Ausgleich (deterministischer Vorschlag)
// ===========================================================================

export interface AusgleichTeam {
  docId: string;
  name: string;
  clubId: string;
  leagueId: string | null;   // aktuelle Liga (nach Auf-/Abstieg); null = noch nicht zugewiesen
  leagueType: string | null; // Disziplin des Teams (für nicht zugewiesene LGA-Teams nötig)
  ringe: number | null;      // Vorjahres-Gesamtringe (null = neu / kein Vorjahr)
}
export interface AusgleichLiga {
  id: string;
  name: string;
  type: string;
  order: number;
}
export interface AusgleichVorschlag {
  docId: string;
  name: string;
  vonLigaId: string | null;
  nachLigaId: string;
  nachLigaName: string;
  grund: string;
}

/**
 * Berechnet einen Vorschlag, wie die LGA-Mannschaften auf die Ligen verteilt werden,
 * damit die Größen stimmen:
 *   - höchste Liga = 6, zweithöchste = 6
 *   - restliche Mannschaften möglichst gleichmäßig auf die übrigen Ligen (obere Klasse
 *     bekommt bei ungerader Zahl die zusätzliche Mannschaft)
 * Regeln:
 *   - Nachrücken/Absteigen nach Vorjahres-Ringzahl (stärkste rücken hoch, schwächste runter)
 *   - Neue Mannschaften ohne Vorjahr (ringe = null) gelten als schwächste -> bleiben unten
 *   - "I nie tiefer als II": ein Team wird nicht so verschoben, dass es unter einer
 *     höheren Römerzahl desselben Vereins landet
 *   - so wenige Verschiebungen wie möglich (es wird von der aktuellen Verteilung ausgegangen)
 *
 * Gibt NUR einen Vorschlag zurück (keine DB-Änderung).
 */
export function berechneLigaAusgleich(
  teams: AusgleichTeam[],
  ligen: AusgleichLiga[],
): AusgleichVorschlag[] {
  // Nur LGA-Auflage-Ligen mit Auf-/Abstieg berücksichtigen, aufsteigend nach order.
  const lgaLigen = ligen
    .filter((l) => (l.type || '').toUpperCase() === 'LGA')
    .sort((a, b) => a.order - b.order);
  if (lgaLigen.length < 2) return [];

  const roemToNum: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
  const staerke = (name: string): number => {
    const m = name.trim().match(/\b(IV|V|III|II|I)\s*$/);
    return m ? (roemToNum[m[1]] ?? 99) : 99;
  };

  // LGA-Teams: entweder bereits einer LGA-Liga zugeordnet ODER als LGA gemeldet, aber
  // noch ohne Liga ("Nicht zugewiesen"). Letztere sind i.d.R. neue Mannschaften und
  // müssen mitgezählt und einsortiert werden.
  const lgaLigaIds = new Set(lgaLigen.map((l) => l.id));
  const lgaTeams = teams.filter(
    (t) => (t.leagueId && lgaLigaIds.has(t.leagueId)) || (!t.leagueId && (t.leagueType || '').toUpperCase() === 'LGA')
  );
  const anzahl = lgaTeams.length;
  if (anzahl === 0) return [];

  // Zielgrößen bestimmen
  const zielGroessen: number[] = new Array(lgaLigen.length).fill(0);
  let rest = anzahl;
  // Die obersten beiden Ligen: je 6 (aber nicht mehr als vorhanden)
  for (let i = 0; i < lgaLigen.length && i < 2; i++) {
    const g = Math.min(6, rest);
    zielGroessen[i] = g;
    rest -= g;
  }
  // Restliche Ligen: gleichmäßig, obere bekommen bei Rest die zusätzliche(n)
  const uebrigeLigen = lgaLigen.length - 2;
  if (uebrigeLigen > 0 && rest > 0) {
    const basis = Math.floor(rest / uebrigeLigen);
    let extra = rest - basis * uebrigeLigen;
    for (let i = 2; i < lgaLigen.length; i++) {
      zielGroessen[i] = basis + (extra > 0 ? 1 : 0);
      if (extra > 0) extra--;
    }
  } else if (uebrigeLigen === 0 && rest > 0) {
    // Nur zwei Ligen vorhanden -> Rest kommt in die zweite
    zielGroessen[1] += rest;
  }

  // Aktuelle Zuordnung: Liga-Index je Team
  const ligaIndex = new Map<string, number>(lgaLigen.map((l, i) => [l.id, i]));
  // Arbeitsstruktur: pro Liga-Index eine Liste von Teams.
  // Nicht zugewiesene LGA-Teams (leagueId = null) starten in der untersten Liga.
  const belegung: AusgleichTeam[][] = lgaLigen.map(() => []);
  const letzterIdx = lgaLigen.length - 1;
  for (const t of lgaTeams) {
    const idx = t.leagueId ? ligaIndex.get(t.leagueId) : letzterIdx;
    belegung[idx ?? letzterIdx].push(t);
  }

  // Hilfsfunktion: Ringe zum Vergleich (null -> -1, gilt als schwächste)
  const r = (t: AusgleichTeam) => (typeof t.ringe === 'number' ? t.ringe : -1);

  // Von oben nach unten ausgleichen.
  // Zu wenige in Liga i -> stärkste aus i+1 hochziehen.
  // Zu viele in Liga i -> schwächste nach i+1 schieben.
  for (let i = 0; i < lgaLigen.length; i++) {
    // Zu viele: schwächste nach unten schieben
    while (belegung[i].length > zielGroessen[i] && i + 1 < lgaLigen.length) {
      // schwächstes Team dieser Liga
      belegung[i].sort((a, b) => r(b) - r(a)); // stärkste zuerst
      const weg = belegung[i].pop()!;          // schwächstes
      belegung[i + 1].push(weg);
    }
    // Zu wenige: stärkste aus der Liga darunter hochziehen
    while (belegung[i].length < zielGroessen[i] && i + 1 < lgaLigen.length) {
      belegung[i + 1].sort((a, b) => r(b) - r(a)); // stärkste zuerst
      const rauf = belegung[i + 1].shift();
      if (!rauf) break;
      belegung[i].push(rauf);
    }
  }

  // "I nie tiefer als II" wahren: pro Verein prüfen und ggf. innerhalb der belegten
  // Ligen nach Römerzahl neu zuordnen (gleiche Ligen bleiben gleich -> zusammen erlaubt).
  const finalLigaIndex = new Map<string, number>();
  belegung.forEach((teamsInLiga, idx) => teamsInLiga.forEach((t) => finalLigaIndex.set(t.docId, idx)));
  const proVerein = new Map<string, AusgleichTeam[]>();
  for (const t of lgaTeams) {
    if (staerke(t.name) === 99) continue;
    if (!proVerein.has(t.clubId)) proVerein.set(t.clubId, []);
    proVerein.get(t.clubId)!.push(t);
  }
  for (const vteams of proVerein.values()) {
    if (vteams.length < 2) continue;
    const belegteIdx = vteams.map((t) => finalLigaIndex.get(t.docId)!).sort((a, b) => a - b);
    const nachStaerke = [...vteams].sort((a, b) => staerke(a.name) - staerke(b.name));
    nachStaerke.forEach((t, k) => finalLigaIndex.set(t.docId, belegteIdx[k]));
  }

  // Vorschläge zusammenstellen (nur echte Änderungen).
  const vorschlaege: AusgleichVorschlag[] = [];
  for (const t of lgaTeams) {
    const zielIdx = finalLigaIndex.get(t.docId);
    if (zielIdx === undefined) continue;
    const zielLiga = lgaLigen[zielIdx];
    if (t.leagueId === zielLiga.id) continue; // unverändert
    const vonIdx = ligaIndex.get(t.leagueId!);
    const richtung = vonIdx === undefined ? 'eingeordnet' : (zielIdx < vonIdx! ? 'aufgerückt' : 'abgerückt');
    const grund = t.ringe === null
      ? 'Neue Mannschaft ohne Vorjahr'
      : `${richtung} (Ligagrößen-Ausgleich, ${t.ringe} Ringe)`;
    vorschlaege.push({
      docId: t.docId,
      name: t.name,
      vonLigaId: t.leagueId,
      nachLigaId: zielLiga.id,
      nachLigaName: zielLiga.name,
      grund,
    });
  }
  return vorschlaege;
}
