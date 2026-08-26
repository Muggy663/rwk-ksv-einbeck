import { db } from '@/lib/firebase/config';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { collection, query, where, getDocs, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import { getSeasonSpecificScoresCollection } from '@/lib/utils/collection-names';

/**
 * Generiert Daten für die Top-Schützen einer Liga
 * @param leagueId ID der Liga
 * @param topCount Anzahl der Top-Schützen (Standard: 3)
 * @returns Array mit den Top-Schützen
 */
export async function fetchTopShooters(leagueId: string, topCount: number = 3) {
  try {
    // Liga-Informationen abrufen
    const leagueRef = doc(db, 'rwk_leagues', leagueId);
    const leagueSnap = await getDoc(leagueRef);
    
    if (!leagueSnap.exists()) {
      throw new Error('Liga nicht gefunden');
    }
    const leagueData = leagueSnap.data();
    
    // Saison-Informationen abrufen
    const seasonRef = doc(db, 'seasons', leagueData.seasonId);
    const seasonSnap = await getDoc(seasonRef);
    
    if (!seasonSnap.exists()) {
      throw new Error('Saison nicht gefunden');
    }
    const seasonData = seasonSnap.data();
    
    // Ergebnisse für die Liga abrufen - verwende saison-spezifische Collection
    let scoresQuery;
    try {
      const seasonSpecificCollection = getSeasonSpecificScoresCollection(seasonData.competitionYear, leagueData.type);
      scoresQuery = query(
        collection(db, seasonSpecificCollection),
        where('leagueId', '==', leagueId),
        where('competitionYear', '==', seasonData.competitionYear)
      );
    } catch (error) {
      // Fallback auf alte Collection
      scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('leagueId', '==', leagueId)
      );
    }
    
    const scoresSnapshot = await getDocs(scoresQuery);
    const shootersMap = new Map();
    
    // Duplikat-Filterung: Sammle alle Scores und entferne Duplikate
    const scoresArray = [];
    scoresSnapshot.forEach(scoreDoc => {
      scoresArray.push({ id: scoreDoc.id, ...scoreDoc.data() });
    });
    
    // Duplikate entfernen basierend auf shooterId + durchgang + competitionYear + leagueType
    const duplicateMap = new Map();
    scoresArray.forEach(score => {
      const key = `${score.shooterId}|${score.durchgang}|${score.competitionYear}|${score.leagueType}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, score);
      } else {
        // Bei Duplikaten den neueren Eintrag behalten (falls entryTimestamp vorhanden)
        const existing = duplicateMap.get(key);
        if (score.entryTimestamp && existing.entryTimestamp && 
            score.entryTimestamp.seconds > existing.entryTimestamp.seconds) {
          duplicateMap.set(key, score);
        }
      }
    });
    
    // Ergebnisse nach Schützen gruppieren (nur eindeutige Scores)
    Array.from(duplicateMap.values()).forEach(scoreData => {
      const shooterId = scoreData.shooterId;
      const durchgang = scoreData.durchgang;
      
      if (!shooterId || durchgang < 1 || durchgang > 5) return;
      
      if (!shootersMap.has(shooterId)) {
        shootersMap.set(shooterId, {
          shooterId,
          name: scoreData.shooterName || 'Unbekannter Schütze',
          teamId: scoreData.teamId || '',
          teamName: scoreData.teamName || 'Unbekanntes Team',
          teamNameTimestamp: scoreData.entryTimestamp?.seconds || 0,
          clubName: scoreData.clubName || '',
          gender: scoreData.shooterGender || 'unknown',
          results: {},
          totalScore: 0,
          roundsShot: 0
        });
      }
      
      const shooter = shootersMap.get(shooterId);
      // teamName mit dem neuesten Score aktualisieren
      const scoreTimestamp = scoreData.entryTimestamp?.seconds || 0;
      if (scoreData.teamName && scoreTimestamp >= shooter.teamNameTimestamp) {
        shooter.teamName = scoreData.teamName;
        shooter.teamNameTimestamp = scoreTimestamp;
        if (scoreData.teamId) shooter.teamId = scoreData.teamId;
      }
      shooter.results[`dg${durchgang}`] = scoreData.totalRinge || 0;
      
      if (scoreData.totalRinge) {
        shooter.totalScore += scoreData.totalRinge;
        shooter.roundsShot++;
      }
    });
    
    // AK-Teams ermitteln um deren Schützen aus der normalen Wertung auszuschließen
    const leagueTeamsForAkQuery = query(collection(db, 'rwk_teams'), where('leagueId', '==', leagueId));
    const leagueTeamsForAkSnapshot = await getDocs(leagueTeamsForAkQuery);
    const akShooterIds = new Set<string>();
    const shooterToTeamMap = new Map<string, string>();
    leagueTeamsForAkSnapshot.docs.forEach(teamDoc => {
      const teamData = teamDoc.data();
      const normalizedName = (teamData.name || '').replace(/\s+/g, ' ').trim();
      (teamData.shooterIds || []).forEach((sid: string) => {
        shooterToTeamMap.set(sid, normalizedName);
        if (teamData.outOfCompetition) akShooterIds.add(sid);
      });
    });
    // rwk_teams hat immer den aktuellen Namen - überschreibt Score-Daten
    // AK-Schützen aus normaler Wertung entfernen
    shootersMap.forEach((shooter: any, id: string) => {
      if (akShooterIds.has(id)) { shootersMap.delete(id); return; }
      const teamNameFromDb = shooterToTeamMap.get(id);
      if (teamNameFromDb) shooter.teamName = teamNameFromDb;
    });

    // Durchschnitt berechnen und in Array umwandeln
    const shooters = Array.from(shootersMap.values()).map(shooter => {
      shooter.averageScore = shooter.roundsShot > 0 ? shooter.totalScore / shooter.roundsShot : 0;
      return shooter;
    });
    
    // Schützen nach Gesamtergebnis sortieren, bei Gleichstand nach letztem Durchgang
    shooters.sort((a, b) => {
      // Primär nach Gesamtergebnis
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      
      // Bei Gleichstand: Nach letztem verfügbaren Durchgang sortieren
      for (let round = 5; round >= 1; round--) {
        const aScore = a.results[`dg${round}`] || 0;
        const bScore = b.results[`dg${round}`] || 0;
        
        if (bScore !== aScore) {
          return bScore - aScore;
        }
      }
      
      return 0;
    });
    
    // Nur die Top-Schützen zurückgeben
    const topShooters = shooters.slice(0, topCount);
    
    // Zusätzliche Informationen hinzufügen
    return topShooters.map((shooter, index) => ({
      ...shooter,
      rank: index + 1,
      league: leagueData.name,
      discipline: getDisciplineName(leagueData.type).replace(/Kleinkaliber\s+Kleinkaliber/g, 'Kleinkaliber').replace(/Luftdruck\s+Luftdruck/g, 'Luftdruck'),
      category: leagueData.category || 'Offene Gruppe',
      season: seasonData.name
    }));
  } catch (error) {
    logError('Fehler beim Abrufen der Top-Schützen:', error);
    throw error;
  }
}

/**
 * Generiert Daten für die Top-Teams einer Liga
 * @param leagueId ID der Liga
 * @param topCount Anzahl der Top-Teams (Standard: 2)
 * @returns Array mit den Top-Teams
 */
export async function fetchTopTeams(leagueId: string, topCount: number = 2) {
  try {
    // Liga-Informationen abrufen
    const leagueRef = doc(db, 'rwk_leagues', leagueId);
    const leagueSnap = await getDoc(leagueRef);
    
    if (!leagueSnap.exists()) {
      throw new Error('Liga nicht gefunden');
    }
    const leagueData = leagueSnap.data();
    
    // Saison-Informationen abrufen
    const seasonRef = doc(db, 'seasons', leagueData.seasonId);
    const seasonSnap = await getDoc(seasonRef);
    
    if (!seasonSnap.exists()) {
      throw new Error('Saison nicht gefunden');
    }
    const seasonData = seasonSnap.data();
    
    // Anzahl der Durchgänge bestimmen - immer 5
    const numRounds = 5;
    
    // Teams für die Liga abrufen
    const teamsQuery = query(
      collection(db, 'rwk_teams'),
      where('leagueId', '==', leagueId)
    );
    
    const teamsSnapshot = await getDocs(teamsQuery);
    const teams = [];
    
    const teamIds = teamsSnapshot.docs.filter(doc => !doc.data().name.toLowerCase().includes('einzel') && !doc.data().outOfCompetition).map(doc => doc.id);
    const akTeamIds = teamsSnapshot.docs.filter(doc => !doc.data().name.toLowerCase().includes('einzel') && doc.data().outOfCompetition).map(doc => doc.id);
    const allTeamIds = [...teamIds, ...akTeamIds];
    if (allTeamIds.length === 0) return [];
    
    let allScoresQuery;
    try {
      const seasonSpecificCollection = getSeasonSpecificScoresCollection(seasonData.competitionYear, leagueData.type);
      allScoresQuery = query(collection(db, seasonSpecificCollection), where('leagueId', '==', leagueId), where('competitionYear', '==', seasonData.competitionYear));
    } catch (error) {
      allScoresQuery = query(collection(db, 'rwk_scores'), where('leagueId', '==', leagueId));
    }
    
    const allScoresSnapshot = await getDocs(allScoresQuery);
    const scoresByTeam = new Map();
    allScoresSnapshot.forEach(scoreDoc => {
      const scoreData = { id: scoreDoc.id, ...scoreDoc.data() };
      if (!allTeamIds.includes(scoreData.teamId)) return;
      if (!scoresByTeam.has(scoreData.teamId)) scoresByTeam.set(scoreData.teamId, []);
      scoresByTeam.get(scoreData.teamId).push(scoreData);
    });
    
    const akTeams = [];
    
    // Substitutions einmalig für alle Teams laden
    const allSubsSnap = await getDocs(query(
      collection(db, 'team_substitutions'),
      where('competitionYear', '==', seasonData.competitionYear)
    ));
    const allSubstitutions = allSubsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    for (const teamDoc of teamsSnapshot.docs) {
      const teamData = teamDoc.data();
      if (teamData.name.toLowerCase().includes('einzel')) continue;
      
      const teamScoresArray = scoresByTeam.get(teamDoc.id) || [];
      const teamDuplicateMap = new Map();
      teamScoresArray.forEach(score => {
        const key = `${score.shooterId}|${score.durchgang}|${score.competitionYear}|${score.leagueType}`;
        if (!teamDuplicateMap.has(key)) {
          teamDuplicateMap.set(key, score);
        } else {
          const existing = teamDuplicateMap.get(key);
          if (score.entryTimestamp && existing.entryTimestamp && 
              score.entryTimestamp.seconds > existing.entryTimestamp.seconds) {
            teamDuplicateMap.set(key, score);
          }
        }
      });
      
      const roundResults = {};
      
      // Durchgangsergebnisse initialisieren
      for (let i = 1; i <= numRounds; i++) {
        roundResults[`dg${i}`] = null;
      }
      
      // Substitutions — NUR für dieses Team, um ersetzte Schützen-IDs zu kennen
      const replacedShooterIds = new Set<string>();
      allSubstitutions.forEach(sub => {
        if (sub.originalShooterId && sub.teamId === teamDoc.id) {
          replacedShooterIds.add(sub.originalShooterId);
        }
      });

      // Ergebnisse nach Durchgang gruppieren - ersetzte Schützen ausschließen
      const scoresByRound = new Map<number, number[]>();
      Array.from(teamDuplicateMap.values()).forEach(scoreData => {
        const durchgang = scoreData.durchgang;
        if (replacedShooterIds.has(scoreData.shooterId)) return;
        if (durchgang >= 1 && durchgang <= numRounds && scoreData.totalRinge) {
          if (!scoresByRound.has(durchgang)) scoresByRound.set(durchgang, []);
          scoresByRound.get(durchgang)!.push(scoreData.totalRinge);
        }
      });

      // Mannschaftsstärke immer 3 (RWK-Regel)
      const teamSize = 3;

      scoresByRound.forEach((scores, durchgang) => {
        // Absteigend sortieren und nur die besten [teamSize] nehmen
        scores.sort((a, b) => b - a);
        const top = scores.slice(0, teamSize);
        roundResults[`dg${durchgang}`] = top.reduce((s, v) => s + v, 0);
      });
      
      // Gesamtergebnis und Durchschnitt berechnen
      let totalScore = 0;
      let numScoredRounds = 0;
      
      Object.values(roundResults).forEach(result => {
        if (result !== null) {
          totalScore += result as number;
          numScoredRounds++;
        }
      });
      
      const averageScore = numScoredRounds > 0 ? totalScore / numScoredRounds : 0;
      
      // Teammitglieder aus den bereits gefilterten Scores extrahieren
      const teamMembers = [];
      const shootersMap = new Map();
      
      // Alle eindeutigen Scores für das Team durchgehen und Schützen sammeln
      // Ersetzte Schützen ausschließen
      Array.from(teamDuplicateMap.values()).forEach(scoreData => {
        const shooterId = scoreData.shooterId;
        const shooterName = scoreData.shooterName;
        
        if (!shooterId || !shooterName) return;
        if (replacedShooterIds.has(shooterId)) return; // Ersetzte Schützen nicht anzeigen
        
        if (!shootersMap.has(shooterId)) {
          shootersMap.set(shooterId, {
            name: shooterName,
            totalScore: 0,
            rounds: 0
          });
        }
        
        const shooter = shootersMap.get(shooterId);
        if (scoreData.totalRinge) {
          shooter.totalScore += scoreData.totalRinge;
          shooter.rounds++;
        }
      });
      
      // Schützen in Array umwandeln und nach totalScore sortieren — nur Top 3 für Urkunde
      const sortedShooters = Array.from(shootersMap.values())
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 3);
      
      sortedShooters.forEach(shooter => {
        teamMembers.push({
          name: shooter.name,
          totalScore: shooter.totalScore,
          rounds: shooter.rounds,
          averageScore: shooter.rounds > 0 ? Math.round(shooter.totalScore / shooter.rounds * 10) / 10 : 0
        });
      });
      
      const entry = {
        id: teamDoc.id,
        name: (teamData.name || '').replace(/\s+/g, ' ').trim(),
        clubName: teamData.clubName || '',
        outOfCompetition: !!teamData.outOfCompetition,
        roundResults,
        totalScore,
        displayScore: totalScore,
        averageScore: numScoredRounds > 0 ? totalScore / numScoredRounds : 0,
        teamMembers: teamMembers.map(member => member.name),
        teamMembersWithScores: teamMembers
      };
      if (teamData.outOfCompetition) {
        akTeams.push(entry);
      } else {
        teams.push(entry);
      }
    }
    
    const extraInfo = (index: number, isAk: boolean) => ({
      rank: index + 1,
      isOutOfCompetition: isAk,
      league: leagueData.name,
      discipline: getDisciplineName(leagueData.type).replace(/Kleinkaliber\s+Kleinkaliber/g, 'Kleinkaliber').replace(/Luftdruck\s+Luftdruck/g, 'Luftdruck'),
      category: leagueData.category || 'Offene Gruppe',
      season: seasonData.name
    });

    teams.sort((a, b) => b.totalScore - a.totalScore);
    akTeams.sort((a, b) => b.totalScore - a.totalScore);

    return [
      ...teams.slice(0, topCount).map((t, i) => ({ ...t, ...extraInfo(i, false) })),
      ...akTeams.slice(0, topCount).map((t, i) => ({ ...t, ...extraInfo(i, true) }))
    ];
  } catch (error) {
    logError('Fehler beim Abrufen der Top-Teams:', error);
    throw error;
  }
}

/**
 * Generiert Daten für die besten Schützen über alle Ligen hinweg
 * @param seasonId ID der Saison
 * @returns Objekt mit dem besten männlichen und weiblichen Schützen
 */
export async function fetchBestOverallShooters(seasonId: string, leagueId?: string, leagueIds?: string[]) {
  try {
    const seasonRef = doc(db, 'seasons', seasonId);
    const seasonSnap = await getDoc(seasonRef);
    if (!seasonSnap.exists()) throw new Error('Saison nicht gefunden');
    const seasonData = seasonSnap.data();

    let normalLeagueIds = [];
    let pistolLeagueIds = [];
    let kkPistolLeagueIds = [];

    // Direkte Liga-ID-Liste hat Vorrang
    const idsToProcess = leagueIds || (leagueId ? [leagueId] : null);

    if (idsToProcess) {
      for (const lid of idsToProcess) {
        const snap = await getDoc(doc(db, 'rwk_leagues', lid));
        if (!snap.exists()) continue;
        const t = snap.data().type;
        if (t.includes('SP')) pistolLeagueIds.push(lid);
        else if (t.includes('KKP')) kkPistolLeagueIds.push(lid);
        else normalLeagueIds.push(lid);
      }
    } else {
      const leaguesSnapshot = await getDocs(query(collection(db, 'rwk_leagues'), where('seasonId', '==', seasonId)));
      leaguesSnapshot.forEach(leagueDoc => {
        const t = leagueDoc.data().type;
        if (t.includes('SP')) pistolLeagueIds.push(leagueDoc.id);
        else if (t.includes('KKP')) kkPistolLeagueIds.push(leagueDoc.id);
        else normalLeagueIds.push(leagueDoc.id);
      });
    }
    
    // Beste männliche und weibliche Schützen für normale Ligen
    let bestMale = null;
    let bestFemale = null;
    let bestPistol = null;
    let bestKKPistol = null;
    
    // Vercel hat Probleme mit zu vielen gleichzeitigen Firestore-Abfragen
    // Daher führen wir die Abfragen nacheinander aus
    if (normalLeagueIds.length > 0) {
      bestMale = await fetchBestShooterByGender(normalLeagueIds, 'male', seasonData.name);
      bestFemale = await fetchBestShooterByGender(normalLeagueIds, 'female', seasonData.name);
    }
    
    // Bester Schütze für Sportpistole
    if (pistolLeagueIds.length > 0) {
      bestPistol = await fetchBestShooterByGender(pistolLeagueIds, 'all', seasonData.name);
    }
    
    // Bester Schütze für KK Pistole — auch nach Geschlecht
    if (kkPistolLeagueIds.length > 0) {
      bestKKPistol = await fetchBestShooterByGender(kkPistolLeagueIds, 'male', seasonData.name);
      // Beste Dame bei KKP nur wenn keine normale Dame gefunden
      if (!bestFemale) {
        bestFemale = await fetchBestShooterByGender(kkPistolLeagueIds, 'female', seasonData.name);
      }
    }
    
    return {
      bestMale,
      bestFemale,
      bestPistol,
      bestKKPistol
    };
  } catch (error) {
    logError('Fehler beim Abrufen der besten Schützen:', error);
    throw error;
  }
}

/**
 * Hilfsfunktion: Besten Schützen nach Geschlecht abrufen
 */
async function fetchBestShooterByGender(leagueIds: string[], gender: 'male' | 'female' | 'all', seasonName: string) {
  if (leagueIds.length === 0) return null;
  
  try {
    // AK-Schützen-IDs für alle Ligen laden
    const akShooterIds = new Set<string>();
    const shooterTeamNameMap = new Map<string, string>();
    for (const lid of leagueIds) {
      const teamsSnap = await getDocs(query(collection(db, 'rwk_teams'), where('leagueId', '==', lid)));
      teamsSnap.docs.forEach(teamDoc => {
        const td = teamDoc.data();
        const normalizedName = (td.name || '').replace(/\s+/g, ' ').trim();
        (td.shooterIds || []).forEach((sid: string) => {
          shooterTeamNameMap.set(sid, normalizedName);
          if (td.outOfCompetition) akShooterIds.add(sid);
        });
      });
    }
    let allScores = [];
    const maxLeaguesPerQuery = 10;
    
    for (let i = 0; i < leagueIds.length; i += maxLeaguesPerQuery) {
      const leagueIdsChunk = leagueIds.slice(i, i + maxLeaguesPerQuery);
      
      // Ergebnisse für die Ligen abrufen - verwende saison-spezifische Collection
      let scoresQuery;
      try {
        // Ermittle Liga-Typ für Collection-Name (verwende erste Liga als Referenz)
        const firstLeagueRef = doc(db, 'rwk_leagues', leagueIdsChunk[0]);
        const firstLeagueSnap = await getDoc(firstLeagueRef);
        
        if (firstLeagueSnap.exists()) {
          const firstLeagueData = firstLeagueSnap.data();
          const seasonRef = doc(db, 'seasons', firstLeagueData.seasonId);
          const seasonSnap = await getDoc(seasonRef);
          
          if (seasonSnap.exists()) {
            const seasonData = seasonSnap.data();
            const seasonSpecificCollection = getSeasonSpecificScoresCollection(seasonData.competitionYear, firstLeagueData.type);
            
            scoresQuery = query(
              collection(db, seasonSpecificCollection),
              where('leagueId', 'in', leagueIdsChunk),
              where('competitionYear', '==', seasonData.competitionYear)
            );
          } else {
            throw new Error('Saison nicht gefunden');
          }
        } else {
          throw new Error('Liga nicht gefunden');
        }
      } catch (error) {
        // Fallback auf alte Collection
        scoresQuery = query(
          collection(db, 'rwk_scores'),
          where('leagueId', 'in', leagueIdsChunk)
        );
      }
      
      const scoresSnapshot = await getDocs(scoresQuery);
      allScores = [...allScores, ...scoresSnapshot.docs];
    }
    
    // Duplikat-Filterung für Gesamtsieger
    const overallScoresArray = [];
    allScores.forEach(scoreDoc => {
      overallScoresArray.push({ id: scoreDoc.id, ...scoreDoc.data() });
    });
    
    const overallDuplicateMap = new Map();
    overallScoresArray.forEach(score => {
      const key = `${score.shooterId}|${score.durchgang}|${score.competitionYear}|${score.leagueType}`;
      if (!overallDuplicateMap.has(key)) {
        overallDuplicateMap.set(key, score);
      } else {
        const existing = overallDuplicateMap.get(key);
        if (score.entryTimestamp && existing.entryTimestamp && 
            score.entryTimestamp.seconds > existing.entryTimestamp.seconds) {
          overallDuplicateMap.set(key, score);
        }
      }
    });
    
    const shootersMap = new Map();
    
    // Ergebnisse nach Schützen gruppieren (nur eindeutige Scores)
    Array.from(overallDuplicateMap.values()).forEach(scoreData => {
      const shooterId = scoreData.shooterId;
      const shooterGender = scoreData.shooterGender || 'unknown';
      
      // Geschlechterfilter anwenden
      if (gender !== 'all' && shooterGender !== gender) return;
      // AK-Schützen herausfiltern
      if (akShooterIds.has(shooterId)) return;
      
      if (!shooterId) return;
      
      if (!shootersMap.has(shooterId)) {
        shootersMap.set(shooterId, {
          shooterId,
          name: scoreData.shooterName || 'Unbekannter Schütze',
          teamName: scoreData.teamName || 'Unbekanntes Team',
          clubName: scoreData.clubName || '',
          gender: shooterGender,
          leagueId: scoreData.leagueId,
          leagueName: scoreData.leagueName || '',
          discipline: scoreData.discipline || '',
          totalScore: 0,
          roundsShot: 0
        });
      }
      
      const shooter = shootersMap.get(shooterId);
      
      if (scoreData.totalRinge) {
        shooter.totalScore += scoreData.totalRinge;
        shooter.roundsShot++;
      }
    });
    
    // Durchschnitt berechnen und in Array umwandeln
    const shooters = Array.from(shootersMap.values()).map(shooter => {
      shooter.averageScore = shooter.roundsShot > 0 ? shooter.totalScore / shooter.roundsShot : 0;
      return shooter;
    });
    
    // Schützen nach Durchschnitt sortieren
    shooters.sort((a, b) => b.averageScore - a.averageScore);
    
    // Besten Schützen zurückgeben
    if (shooters.length === 0) return null;
    
    const bestShooter = shooters[0];
    
    // Liga-Informationen abrufen
    const leagueRef = doc(db, 'rwk_leagues', bestShooter.leagueId);
    const leagueSnap = await getDoc(leagueRef);
    
    if (leagueSnap.exists()) {
      const leagueData = leagueSnap.data();
      bestShooter.discipline = leagueData.name.replace(/\s+/g, ' ').trim();
      if (gender === 'male') {
        bestShooter.category = 'Bester Schütze';
      } else if (gender === 'female') {
        bestShooter.category = 'Beste Dame';
      } else if (leagueData.type.includes('SP')) {
        bestShooter.category = 'Bester Sportpistolenschütze';
      } else if (leagueData.type.includes('KKP')) {
        bestShooter.category = 'Bester KK Pistolenschütze';
      } else {
        bestShooter.category = 'Bester Schütze';
      }
      
      // Team-Info für bessere Anzeige hinzufügen
      const correctTeamName = shooterTeamNameMap.get(bestShooter.shooterId);
      if (correctTeamName) bestShooter.teamName = correctTeamName;
      bestShooter.displayName = bestShooter.teamName ?
        `${bestShooter.name}\n${bestShooter.teamName}` : bestShooter.name;
      bestShooter.season = seasonName;
    }
    
    return bestShooter;
  } catch (error) {
    logError('Fehler beim Abrufen des besten Schützen nach Geschlecht:', error);
    throw error;
  }
}

/**
 * Hilfsfunktion: Disziplinname aus Typ ermitteln
 */
function getDisciplineName(type: string): string {
  if (type.startsWith('LG')) return 'Luftgewehr';
  if (type.startsWith('LGA')) return 'Luftgewehr Auflage';
  if (type.startsWith('LP')) return 'Luftpistole';
  if (type.startsWith('LPA')) return 'Luftpistole Auflage';
  if (type.startsWith('KKP')) return 'KK Pistole';
  if (type.startsWith('KK')) return 'Kleinkaliber';
  if (type.startsWith('KKA')) return 'Kleinkaliber Auflage';
  if (type.startsWith('SP')) return 'Sportpistole';
  return type;
}
