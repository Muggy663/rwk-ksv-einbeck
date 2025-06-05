import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

/**
 * @typedef {Object} ShooterPerformanceData
 * @property {string} shooterId
 * @property {string} shooterName
 * @property {string} teamName
 * @property {'male'|'female'} gender
 * @property {Object.<string, number|null>} results
 * @property {number} totalScore
 * @property {number} roundsShot
 * @property {number} averageScore
 */

/**
 * @typedef {Object} TeamComparisonData
 * @property {string} teamId
 * @property {string} teamName
 * @property {string} leagueName
 * @property {number} totalScore
 * @property {number} roundsShot
 * @property {number} averageScore
 */

/**
 * @typedef {Object} GenderDistributionData
 * @property {number} male
 * @property {number} female
 */

/**
 * Lädt Leistungsdaten von Schützen
 * @param {string} seasonId - ID der Saison
 * @param {string} [leagueId] - ID der Liga (optional)
 * @param {string} [clubId] - ID des Vereins (optional)
 * @returns {Promise<ShooterPerformanceData[]>} Liste der Schützenleistungsdaten
 */
export async function fetchShooterPerformanceData(
  seasonId,
  leagueId,
  clubId
) {
  try {
    // Versuche, Daten aus Firestore zu laden
    let scoresQuery;
    
    if (leagueId && leagueId !== 'all') {
      scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('seasonId', '==', seasonId),
        where('leagueId', '==', leagueId)
      );
    } else {
      scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('seasonId', '==', seasonId)
      );
    }
    
    const scoresSnapshot = await getDocs(scoresQuery);
    
    if (!scoresSnapshot.empty) {
      const shootersMap = new Map();
      
      scoresSnapshot.forEach(scoreDoc => {
        const scoreData = scoreDoc.data();
        const shooterId = scoreData.shooterId;
        const scoreClubId = scoreData.clubId;
        
        if (clubId && clubId !== 'all' && clubId !== scoreClubId) {
          return;
        }
        
        if (!shooterId) return;
        
        if (!shootersMap.has(shooterId)) {
          shootersMap.set(shooterId, {
            shooterId,
            shooterName: scoreData.shooterName || 'Unbekannter Schütze',
            teamName: scoreData.teamName || 'Unbekanntes Team',
            gender: scoreData.shooterGender || 'male',
            results: {},
            totalScore: 0,
            roundsShot: 0,
            averageScore: 0
          });
        }
        
        const shooter = shootersMap.get(shooterId);
        const durchgang = scoreData.durchgang;
        
        if (durchgang && scoreData.totalRinge) {
          shooter.results[`dg${durchgang}`] = scoreData.totalRinge;
          shooter.totalScore += scoreData.totalRinge;
          shooter.roundsShot++;
        }
      });
      
      return Array.from(shootersMap.values()).map(shooter => {
        shooter.averageScore = shooter.roundsShot > 0 ? shooter.totalScore / shooter.roundsShot : 0;
        return shooter;
      });
    }
    
    // Keine Daten gefunden
    console.log('Keine Schützenleistungsdaten in Firestore gefunden.');
    return [];
  } catch (error) {
    console.error('Fehler beim Laden der Schützenleistungsdaten:', error);
    return [];
  }
}

/**
 * Lädt Vergleichsdaten von Mannschaften
 * @param {string} seasonId - ID der Saison
 * @param {string} [leagueId] - ID der Liga (optional)
 * @returns {Promise<TeamComparisonData[]>} Liste der Mannschaftsvergleichsdaten
 */
export async function fetchTeamComparisonData(
  seasonId,
  leagueId
) {
  try {
    // Versuche, Daten aus Firestore zu laden
    let teamsQuery;
    
    if (leagueId && leagueId !== 'all') {
      teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('seasonId', '==', seasonId),
        where('leagueId', '==', leagueId)
      );
    } else {
      teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('seasonId', '==', seasonId)
      );
    }
    
    const teamsSnapshot = await getDocs(teamsQuery);
    
    if (!teamsSnapshot.empty) {
      const teamsData = [];
      
      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data();
        
        const scoresQuery = query(
          collection(db, 'rwk_scores'),
          where('teamId', '==', teamDoc.id)
        );
        
        const scoresSnapshot = await getDocs(scoresQuery);
        let totalScore = 0;
        let roundsShot = 0;
        
        scoresSnapshot.forEach(scoreDoc => {
          const scoreData = scoreDoc.data();
          if (scoreData.totalRinge) {
            totalScore += scoreData.totalRinge;
            roundsShot++;
          }
        });
        
        teamsData.push({
          teamId: teamDoc.id,
          teamName: teamData.name || 'Unbekanntes Team',
          leagueName: teamData.leagueName || 'Unbekannte Liga',
          totalScore,
          roundsShot,
          averageScore: roundsShot > 0 ? totalScore / roundsShot : 0
        });
      }
      
      return teamsData;
    }
    
    // Keine Daten gefunden
    console.log('Keine Mannschaftsvergleichsdaten in Firestore gefunden.');
    return [];
  } catch (error) {
    console.error('Fehler beim Laden der Mannschaftsvergleichsdaten:', error);
    return [];
  }
}

/**
 * Lädt Daten zur Geschlechterverteilung
 * @param {string} seasonId - ID der Saison
 * @param {string} [leagueId] - ID der Liga (optional)
 * @param {string} [clubId] - ID des Vereins (optional)
 * @returns {Promise<GenderDistributionData>} Geschlechterverteilungsdaten
 */
export async function fetchGenderDistributionData(
  seasonId,
  leagueId,
  clubId
) {
  try {
    // Versuche, Daten aus Firestore zu laden
    let scoresQuery;
    
    if (leagueId && leagueId !== 'all') {
      scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('seasonId', '==', seasonId),
        where('leagueId', '==', leagueId)
      );
    } else {
      scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('seasonId', '==', seasonId)
      );
    }
    
    const scoresSnapshot = await getDocs(scoresQuery);
    
    if (!scoresSnapshot.empty) {
      const shootersMap = new Map();
      
      scoresSnapshot.forEach(scoreDoc => {
        const scoreData = scoreDoc.data();
        const shooterId = scoreData.shooterId;
        const scoreClubId = scoreData.clubId;
        
        if (clubId && clubId !== 'all' && clubId !== scoreClubId) {
          return;
        }
        
        if (!shooterId) return;
        
        shootersMap.set(shooterId, {
          gender: scoreData.shooterGender || 'male'
        });
      });
      
      let male = 0;
      let female = 0;
      
      shootersMap.forEach(shooter => {
        if (shooter.gender === 'female') {
          female++;
        } else {
          male++;
        }
      });
      
      return { male, female };
    }
    
    // Keine Daten gefunden
    console.log('Keine Geschlechterverteilungsdaten in Firestore gefunden.');
    return { male: 0, female: 0 };
  } catch (error) {
    console.error('Fehler beim Laden der Geschlechterverteilungsdaten:', error);
    return { male: 0, female: 0 };
  }
}

/**
 * Lädt alle Saisons
 * @returns {Promise<Array<{id: string, name: string, year: number}>>} Liste der Saisons
 */
export async function fetchSeasons() {
  try {
    // Versuche, Saisons aus Firestore zu laden
    const seasonsQuery = query(
      collection(db, 'seasons'),
      orderBy('competitionYear', 'desc')
    );
    
    const snapshot = await getDocs(seasonsQuery);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        year: doc.data().competitionYear
      }));
    }
    
    // Keine Daten gefunden
    console.log('Keine Saisons in Firestore gefunden.');
    return [];
  } catch (error) {
    console.error('Fehler beim Laden der Saisons:', error);
    return [];
  }
}

/**
 * Lädt Ligen für eine Saison
 * @param {string} seasonId - ID der Saison
 * @returns {Promise<Array<{id: string, name: string, type: string}>>} Liste der Ligen
 */
export async function fetchLeagues(seasonId) {
  try {
    // Versuche, Ligen aus Firestore zu laden
    const leaguesQuery = query(
      collection(db, 'rwk_leagues'),
      where('seasonId', '==', seasonId),
      orderBy('order', 'asc')
    );
    
    const snapshot = await getDocs(leaguesQuery);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        type: doc.data().type
      }));
    }
    
    // Keine Daten gefunden
    console.log('Keine Ligen in Firestore gefunden.');
    return [];
  } catch (error) {
    console.error('Fehler beim Laden der Ligen:', error);
    return [];
  }
}

/**
 * Lädt alle Vereine
 * @returns {Promise<Array<{id: string, name: string, shortName: string}>>} Liste der Vereine
 */
export async function fetchClubs() {
  try {
    // Versuche, Vereine aus Firestore zu laden
    const clubsQuery = query(
      collection(db, 'clubs'),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(clubsQuery);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        shortName: doc.data().shortName
      }));
    }
    
    // Keine Daten gefunden
    console.log('Keine Vereine in Firestore gefunden.');
    return [];
  } catch (error) {
    console.error('Fehler beim Laden der Vereine:', error);
    return [];
  }
}