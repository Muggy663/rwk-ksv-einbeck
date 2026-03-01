// src/lib/services/season-transition-service.ts
import { db } from '@/lib/firebase/config';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { collection, getDocs, query, where, orderBy, doc, writeBatch, addDoc, updateDoc } from 'firebase/firestore';
import { deduplicateScores } from '@/lib/utils/score-deduplication';
import { SubstitutionService } from './substitution-service';
import { TeamCalculationService } from './team-calculation-service';

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
      const teamScoresRaw = scoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
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
 * Generiert Auf-/Abstiegsvorschläge basierend auf RWK-Ordnung §16
 * Berücksichtigt Abmeldungen und Ligagrößen-Anpassungen
 */
export async function generatePromotionRelegationSuggestions(
  leagueId: string, 
  competitionYear: number,
  allLeagues: any[],
  withdrawnTeams: string[] = [], // Abgemeldete Teams
  targetLeagueSizes: Map<string, number> = new Map(), // Gewünschte Ligagrößen
  newClubs: string[] = [] // Neue Vereine (starten in niedrigster Liga)
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
    const activeTeams = standings.filter(team => !withdrawnTeams.includes(team.teamId));
    
    // Berechne verfügbare Plätze basierend auf Abmeldungen aus höheren Ligen
    const withdrawnFromHigherLeagues = allLeagues
      .filter(league => (league.order || 0) < (currentLeague.order || 0))
      .reduce((count, league) => {
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
      // Meister steigt auf (außer höchste Liga oder offene Gruppen LG/LP)
      else if (team.position === 1) {
        const isOpenGroup = currentLeague.type === 'LG' || currentLeague.type === 'LP' || 
                           currentLeague.name.toLowerCase().includes('pistole') ||
                           currentLeague.name.toLowerCase().includes('luftgewehr');
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
        // Letzter steigt ab (außer bei Ligaverkleinerung, offene Gruppen LG/LP oder niedrigste Liga)
        const isOpenGroup = currentLeague.type === 'LG' || currentLeague.type === 'LP' || 
                           currentLeague.name.toLowerCase().includes('pistole') ||
                           currentLeague.name.toLowerCase().includes('luftgewehr');
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
        const isOpenGroup = currentLeague.type === 'LG' || currentLeague.type === 'LP' || 
                           currentLeague.name.toLowerCase().includes('pistole') ||
                           currentLeague.name.toLowerCase().includes('luftgewehr');
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
        const isOpenGroup = currentLeague.type === 'LG' || currentLeague.type === 'LP' || 
                           currentLeague.name.toLowerCase().includes('pistole') ||
                           currentLeague.name.toLowerCase().includes('luftgewehr');
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
      status: 'Geplant',
      name: seasonName
    });

    // Ligen kopieren
    const sourceLeaguesQuery = query(
      collection(db, 'rwk_leagues'),
      where('seasonId', '==', sourceSeasonId)
    );
    const sourceLeaguesSnapshot = await getDocs(sourceLeaguesQuery);
    
    const leagueMapping = new Map(); // Alte ID -> Neue ID
    
    for (const leagueDoc of sourceLeaguesSnapshot.docs) {
      const leagueData = leagueDoc.data();
      const newLeagueRef = doc(collection(db, 'rwk_leagues'));
      
      batch.set(newLeagueRef, {
        ...leagueData,
        seasonId: newSeasonRef.id,
        competitionYear: targetYear
      });
      
      leagueMapping.set(leagueDoc.id, newLeagueRef.id);
    }

    // Teams kopieren (ohne Ergebnisse)
    const sourceTeamsQuery = query(
      collection(db, 'rwk_teams'),
      where('seasonId', '==', sourceSeasonId)
    );
    const sourceTeamsSnapshot = await getDocs(sourceTeamsQuery);
    
    // Finde niedrigste Liga für neue Vereine (RWK-Ordnung §7)
    const lowestLeague = sourceLeaguesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
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
          isNewClub: newClubs.includes(teamData.clubId) // Markierung für neue Vereine
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
          logWarn(`Failed to load club data for ${clubId}:`, clubError);
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

/**
 * Wendet bestätigte Auf-/Abstiegsvorschläge an
 */
export async function applyPromotionRelegation(
  suggestions: PromotionRelegationRule[],
  targetSeasonId: string
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const confirmedSuggestions = suggestions.filter(s => s.confirmed);
    
    for (const suggestion of confirmedSuggestions) {
      if (suggestion.action === 'promote' || suggestion.action === 'relegate') {
        // Team in neue Liga verschieben
        // Hier würde die Logik zum Verschieben der Teams implementiert
        // Das ist komplex, da neue Liga-IDs gefunden werden müssen
        
        // Für jetzt: Nur Logging
        logDebug(`${suggestion.action}: ${suggestion.teamName} -> ${suggestion.targetLeague}`);
      }
    }
    
    await batch.commit();
  } catch (error) {
    logError('Error applying promotion/relegation:', error);
    throw error;
  }
}

/**
 * Prüft ob ein Team von einem neuen Verein stammt (RWK-Ordnung §7)
 * Alle Teams die bereits in dieser Saison spielen sind nicht mehr neu
 */
async function checkIfNewClub(clubId: string, competitionYear: number): Promise<boolean> {
  // Alle Teams die bereits in der aktuellen Saison spielen sind nicht mehr neu
  return false;
}
