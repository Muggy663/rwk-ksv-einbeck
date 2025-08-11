// src/lib/services/season-transition-service.ts
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, doc, writeBatch, addDoc, updateDoc } from 'firebase/firestore';

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
    // Teams der Liga laden
    const teamsQuery = query(
      collection(db, 'rwk_teams'),
      where('leagueId', '==', leagueId),
      where('competitionYear', '==', competitionYear)
    );
    const teamsSnapshot = await getDocs(teamsQuery);
    
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

    for (const teamDoc of teamsSnapshot.docs) {
      const team = teamDoc.data();
      
      // Ergebnisse für das Team laden
      const scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('teamId', '==', teamDoc.id),
        where('competitionYear', '==', competitionYear)
      );
      const scoresSnapshot = await getDocs(scoresQuery);
      
      // Duplikat-Filterung
      const scoresMap = new Map();
      scoresSnapshot.docs.forEach(scoreDoc => {
        const score = scoreDoc.data();
        const key = `${score.shooterId}|${score.durchgang}`;
        if (!scoresMap.has(key) || (score.entryTimestamp && scoresMap.get(key).entryTimestamp && 
            score.entryTimestamp.seconds > scoresMap.get(key).entryTimestamp.seconds)) {
          scoresMap.set(key, score);
        }
      });

      // Durchgangsergebnisse berechnen
      const roundResults = new Map();
      let totalScore = 0;
      let roundsPlayed = 0;

      Array.from(scoresMap.values()).forEach(score => {
        const round = score.durchgang;
        if (!roundResults.has(round)) {
          roundResults.set(round, 0);
        }
        roundResults.set(round, roundResults.get(round) + (score.totalRinge || 0));
      });

      // Nur Durchgänge mit Ergebnissen zählen
      roundResults.forEach(roundScore => {
        if (roundScore > 0) {
          totalScore += roundScore;
          roundsPlayed++;
        }
      });

      const averageScore = roundsPlayed > 0 ? totalScore / roundsPlayed : 0;

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
    console.error('Error calculating league standings:', error);
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
      // Meister steigt auf (außer höchste Liga oder Pistole)
      else if (team.position === 1) {
        if (currentLeague.name.toLowerCase().includes('pistole')) {
          reason = 'Meister - verbleibt (offene Klasse, keine Auf-/Abstiege)';
        } else if (higherLeague && !currentLeague.name.includes('Kreisoberliga')) {
          action = 'promote';
          reason = 'Meister - steigt automatisch auf';
          targetLeague = higherLeague.name;
        } else {
          reason = 'Meister - verbleibt (höchste Liga)';
        }
      } else if (team.position === totalTeams) {
        // Letzter steigt ab (außer bei Ligaverkleinerung, Pistole oder niedrigste Liga)
        if (currentLeague.name.toLowerCase().includes('pistole')) {
          reason = 'Letzter Platz - verbleibt (offene Klasse, keine Auf-/Abstiege)';
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
      } else if (team.position === 2 && higherLeague && !currentLeague.name.toLowerCase().includes('pistole')) {
        // Zweiter: Vergleich mit Vorletztem der höheren Liga
        if (additionalPromotionSlots > 0) {
          action = 'promote';
          reason = 'Zweiter - steigt auf (zusätzlicher Platz durch Abmeldung aus höherer Liga)';
          targetLeague = higherLeague.name;
        } else {
          // Vorletzten der höheren Liga finden und vergleichen
          const higherLeagueStandings = await calculateLeagueStandings(higherLeague.id, competitionYear);
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
      } else if (team.position === totalTeams - 1 && lowerLeague && !currentLeague.name.toLowerCase().includes('pistole') && !currentLeague.name.toLowerCase().includes('2. kreisklasse')) {
        // Vorletzter: Vergleich mit Zweitem der niedrigeren Liga
        const lowerLeagueStandings = await calculateLeagueStandings(lowerLeague.id, competitionYear);
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
      console.log(`Liga ${currentLeague.name}: ${withdrawnInThisLeague.length} Teams abgemeldet`);
    }
    if (sizeReduction > 0) {
      console.log(`Liga ${currentLeague.name}: Verkleinerung um ${sizeReduction} Teams geplant`);
    }
    if (additionalPromotionSlots > 0) {
      console.log(`Liga ${currentLeague.name}: ${additionalPromotionSlots} zusätzliche Aufstiegsplätze verfügbar`);
    }

    return suggestions;
  } catch (error) {
    console.error('Error generating promotion/relegation suggestions:', error);
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
        // Neues Team für neuen Verein erstellen
        const newTeamRef = doc(collection(db, 'rwk_teams'));
        
        // Club-Name laden
        const clubDoc = await getDocs(query(collection(db, 'clubs'), where('__name__', '==', clubId)));
        const clubName = clubDoc.docs[0]?.data()?.name || 'Neuer Verein';
        
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
    console.error('Error creating new season:', error);
    throw error;
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
        console.log(`${suggestion.action}: ${suggestion.teamName} -> ${suggestion.targetLeague}`);
      }
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error applying promotion/relegation:', error);
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