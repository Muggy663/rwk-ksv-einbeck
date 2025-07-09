import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc, limit } from 'firebase/firestore';

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
    
    // Ergebnisse für die Liga abrufen
    const scoresQuery = query(
      collection(db, 'rwk_scores'),
      where('leagueId', '==', leagueId)
    );
    
    const scoresSnapshot = await getDocs(scoresQuery);
    const shootersMap = new Map();
    
    // Ergebnisse nach Schützen gruppieren
    scoresSnapshot.forEach(scoreDoc => {
      const scoreData = scoreDoc.data();
      const shooterId = scoreData.shooterId;
      const durchgang = scoreData.durchgang;
      
      if (!shooterId || durchgang < 1 || durchgang > 5) return;
      
      if (!shootersMap.has(shooterId)) {
        shootersMap.set(shooterId, {
          shooterId,
          name: scoreData.shooterName || 'Unbekannter Schütze',
          teamName: scoreData.teamName || 'Unbekanntes Team',
          clubName: scoreData.clubName || '',
          gender: scoreData.shooterGender || 'unknown',
          results: {},
          totalScore: 0,
          roundsShot: 0
        });
      }
      
      const shooter = shootersMap.get(shooterId);
      shooter.results[`dg${durchgang}`] = scoreData.totalRinge || 0;
      
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
    
    // Schützen nach Gesamtergebnis sortieren
    shooters.sort((a, b) => b.totalScore - a.totalScore);
    
    // Nur die Top-Schützen zurückgeben
    const topShooters = shooters.slice(0, topCount);
    
    // Zusätzliche Informationen hinzufügen
    return topShooters.map((shooter, index) => ({
      ...shooter,
      rank: index + 1,
      league: leagueData.name,
      discipline: getDisciplineName(leagueData.type),
      category: leagueData.category || 'Offene Gruppe',
      season: seasonData.name
    }));
  } catch (error) {
    console.error('Fehler beim Abrufen der Top-Schützen:', error);
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
    
    // Anzahl der Durchgänge bestimmen
    const numRounds = leagueData.type.startsWith('L') ? 4 : 5; // Luftdruck: 4, KK: 5
    
    // Teams für die Liga abrufen
    const teamsQuery = query(
      collection(db, 'rwk_teams'),
      where('leagueId', '==', leagueId)
    );
    
    const teamsSnapshot = await getDocs(teamsQuery);
    const teams = [];
    
    for (const teamDoc of teamsSnapshot.docs) {
      const teamData = teamDoc.data();
      
      // "Einzel"-Teams überspringen
      if (teamData.name.toLowerCase().includes('einzel')) {
        continue;
      }
      
      // Ergebnisse für das Team abrufen
      const scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('teamId', '==', teamDoc.id)
      );
      
      const scoresSnapshot = await getDocs(scoresQuery);
      const roundResults = {};
      
      // Durchgangsergebnisse initialisieren
      for (let i = 1; i <= numRounds; i++) {
        roundResults[`dg${i}`] = null;
      }
      
      // Ergebnisse nach Durchgang gruppieren
      scoresSnapshot.forEach(scoreDoc => {
        const scoreData = scoreDoc.data();
        const durchgang = scoreData.durchgang;
        
        if (durchgang >= 1 && durchgang <= numRounds) {
          if (!roundResults[`dg${durchgang}`]) {
            roundResults[`dg${durchgang}`] = 0;
          }
          
          roundResults[`dg${durchgang}`] += scoreData.totalRinge || 0;
        }
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
      
      // Teammitglieder direkt aus den bereits geladenen Scores extrahieren
      const teamMembers = [];
      const shootersMap = new Map();
      
      // Alle Scores für das Team durchgehen und Schützen sammeln
      scoresSnapshot.forEach(scoreDoc => {
        const scoreData = scoreDoc.data();
        const shooterId = scoreData.shooterId;
        const shooterName = scoreData.shooterName;
        
        if (!shooterId || !shooterName) return;
        
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
      
      // Schützen in Array umwandeln
      shootersMap.forEach(shooter => {
        teamMembers.push({
          name: shooter.name,
          totalScore: shooter.totalScore,
          rounds: shooter.rounds,
          averageScore: shooter.rounds > 0 ? Math.round(shooter.totalScore / shooter.rounds * 10) / 10 : 0
        });
      });
      
      teams.push({
        id: teamDoc.id,
        name: teamData.name,
        clubName: teamData.clubName || '',
        roundResults,
        totalScore,
        averageScore,
        teamMembers: teamMembers.map(member => member.name),
        teamMembersWithScores: teamMembers
      });
    }
    
    // Teams nach Gesamtergebnis sortieren
    teams.sort((a, b) => b.totalScore - a.totalScore);
    
    // Nur die Top-Teams zurückgeben
    const topTeams = teams.slice(0, topCount);
    
    // Zusätzliche Informationen hinzufügen
    return topTeams.map((team, index) => ({
      ...team,
      rank: index + 1,
      league: leagueData.name,
      discipline: getDisciplineName(leagueData.type),
      category: leagueData.category || 'Offene Gruppe',
      season: seasonData.name
    }));
  } catch (error) {
    console.error('Fehler beim Abrufen der Top-Teams:', error);
    throw error;
  }
}

/**
 * Generiert Daten für die besten Schützen über alle Ligen hinweg
 * @param seasonId ID der Saison
 * @returns Objekt mit dem besten männlichen und weiblichen Schützen
 */
export async function fetchBestOverallShooters(seasonId: string) {
  try {
    // Saison-Informationen abrufen
    const seasonRef = doc(db, 'seasons', seasonId);
    const seasonSnap = await getDoc(seasonRef);
    
    if (!seasonSnap.exists()) {
      throw new Error('Saison nicht gefunden');
    }
    const seasonData = seasonSnap.data();
    
    // Alle Ligen der Saison abrufen
    const leaguesQuery = query(
      collection(db, 'rwk_leagues'),
      where('seasonId', '==', seasonId)
    );
    
    const leaguesSnapshot = await getDocs(leaguesQuery);
    
    // Ligen nach Typ gruppieren
    const normalLeagueIds = [];
    const pistolLeagueIds = [];
    
    leaguesSnapshot.forEach(leagueDoc => {
      const leagueData = leagueDoc.data();
      if (leagueData.type.includes('SP')) {
        pistolLeagueIds.push(leagueDoc.id);
      } else {
        normalLeagueIds.push(leagueDoc.id);
      }
    });
    
    // Beste männliche und weibliche Schützen für normale Ligen
    let bestMale = null;
    let bestFemale = null;
    let bestPistol = null;
    
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
    
    return {
      bestMale,
      bestFemale,
      bestPistol
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der besten Schützen:', error);
    throw error;
  }
}

/**
 * Hilfsfunktion: Besten Schützen nach Geschlecht abrufen
 */
async function fetchBestShooterByGender(leagueIds: string[], gender: 'male' | 'female' | 'all', seasonName: string) {
  if (leagueIds.length === 0) return null;
  
  try {
    // Bei zu vielen Ligen müssen wir die Abfrage aufteilen (Vercel-Limit)
    const maxLeaguesPerQuery = 10;
    let allScores = [];
    
    // Ligen in Gruppen aufteilen
    for (let i = 0; i < leagueIds.length; i += maxLeaguesPerQuery) {
      const leagueIdsChunk = leagueIds.slice(i, i + maxLeaguesPerQuery);
      
      // Ergebnisse für die Ligen abrufen
      const scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('leagueId', 'in', leagueIdsChunk)
      );
      
      const scoresSnapshot = await getDocs(scoresQuery);
      allScores = [...allScores, ...scoresSnapshot.docs];
    }
    
    const shootersMap = new Map();
    
    // Ergebnisse nach Schützen gruppieren
    allScores.forEach(scoreDoc => {
      const scoreData = scoreDoc.data();
      const shooterId = scoreData.shooterId;
      const shooterGender = scoreData.shooterGender || 'unknown';
      
      // Geschlechterfilter anwenden
      if (gender !== 'all' && shooterGender !== gender) {
        return;
      }
      
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
      bestShooter.discipline = getDisciplineName(leagueData.type);
      bestShooter.category = gender === 'male' ? 'Bester Schütze' : gender === 'female' ? 'Beste Dame' : 'Bester Sportpistolenschütze';
      bestShooter.season = seasonName;
    }
    
    return bestShooter;
  } catch (error) {
    console.error('Fehler beim Abrufen des besten Schützen nach Geschlecht:', error);
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
  if (type.startsWith('KK')) return 'Kleinkaliber';
  if (type.startsWith('KKA')) return 'Kleinkaliber Auflage';
  if (type.startsWith('SP')) return 'Sportpistole';
  return type;
}