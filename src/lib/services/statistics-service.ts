import { db } from '@/lib/firebase/config';
import { logError, logWarn } from '@/lib/utils/secure-logger';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getSeasonSpecificScoresCollection } from '@/lib/utils/collection-names';

export interface ShooterPerformanceData {
  shooterId: string;
  shooterName: string;
  teamName: string;
  gender: 'male' | 'female';
  results: { [key: string]: number | null };
  totalScore: number;
  roundsShot: number;
  averageScore: number;
}

export interface TeamComparisonData {
  teamId: string;
  teamName: string;
  leagueName: string;
  totalScore: number;
  roundsShot: number;
  averageScore: number;
}

export interface GenderDistributionData {
  male: number;
  female: number;
}

// Verfügbare Collections basierend auf deiner Datenbank
const AVAILABLE_COLLECTIONS = [
  'rwk_scores_2025_KK',
  'rwk_scores_2025_KKP',
  'rwk_scores_2026_KK',
  'rwk_scores_2026_KKP',
  'rwk_scores_2026_LD'
];

async function findWorkingCollection(competitionYear: number, leagueType: string): Promise<string | null> {
  // Erst gewünschte Collection versuchen
  const preferredCollection = getSeasonSpecificScoresCollection(competitionYear, leagueType as any);
  
  const collectionsToTry = [preferredCollection, ...AVAILABLE_COLLECTIONS];
  
  for (const collName of collectionsToTry) {
    try {
      const testQuery = query(collection(db, collName), where('competitionYear', '==', competitionYear));
      const testSnapshot = await getDocs(testQuery);
      if (!testSnapshot.empty) {
        return collName;
      }
    } catch (e) {
      // Collection existiert nicht
    }
  }
  
  return null;
}

export async function fetchShooterPerformanceData(
  seasonId: string,
  leagueId?: string,
  clubId?: string
): Promise<ShooterPerformanceData[]> {
  try {
    const seasonQuery = query(
      collection(db, 'seasons'),
      where('__name__', '==', seasonId)
    );
    const seasonSnapshot = await getDocs(seasonQuery);
    
    if (seasonSnapshot.empty) return [];
    
    const seasonData = seasonSnapshot.docs[0].data();
    const competitionYear = seasonData.competitionYear;
    
    let leagueType = 'KK';
    if (leagueId && leagueId !== 'all') {
      const leagueQuery = query(
        collection(db, 'rwk_leagues'),
        where('__name__', '==', leagueId)
      );
      const leagueSnapshot = await getDocs(leagueQuery);
      if (!leagueSnapshot.empty) {
        leagueType = leagueSnapshot.docs[0].data().type;
      }
    }
    
    const workingCollection = await findWorkingCollection(competitionYear, leagueType);
    if (!workingCollection) return [];
    
    let scoresQuery;
    if (leagueId && leagueId !== 'all') {
      scoresQuery = query(
        collection(db, workingCollection),
        where('competitionYear', '==', competitionYear),
        where('leagueId', '==', leagueId)
      );
    } else {
      scoresQuery = query(
        collection(db, workingCollection),
        where('competitionYear', '==', competitionYear)
      );
    }
    
    const scoresSnapshot = await getDocs(scoresQuery);
    
    if (!scoresSnapshot.empty) {
      const shootersMap = new Map<string, ShooterPerformanceData>();
      
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
        
        const shooter = shootersMap.get(shooterId)!;
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
    
    return [];
  } catch (error) {
    logError('Fehler beim Laden der Schützenleistungsdaten:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '5') {
      logWarn('Firestore-Collection nicht gefunden (Build-Zeit)');
    }
    return [];
  }
}

export async function fetchTeamComparisonData(
  seasonId: string,
  leagueId?: string
): Promise<TeamComparisonData[]> {
  try {
    const seasonQuery = query(
      collection(db, 'seasons'),
      where('__name__', '==', seasonId)
    );
    const seasonSnapshot = await getDocs(seasonQuery);
    
    if (seasonSnapshot.empty) return [];
    
    const seasonData = seasonSnapshot.docs[0].data();
    const competitionYear = seasonData.competitionYear;
    
    const leaguesQuery = query(
      collection(db, 'rwk_leagues'),
      where('seasonId', '==', seasonId)
    );
    const leaguesSnapshot = await getDocs(leaguesQuery);
    const leaguesMap = new Map(leaguesSnapshot.docs.map(doc => [doc.id, doc.data()]));
    
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
      const teamsData: TeamComparisonData[] = [];
      
      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = teamDoc.data();
        
        const leagueData = leaguesMap.get(teamData.leagueId);
        if (!leagueData) continue;
        
        const workingCollection = await findWorkingCollection(competitionYear, leagueData.type);
        if (!workingCollection) continue;
        
        const scoresQuery = query(
          collection(db, workingCollection),
          where('teamId', '==', teamDoc.id),
          where('competitionYear', '==', competitionYear)
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
    
    return [];
  } catch (error) {
    logError('Fehler beim Laden der Mannschaftsvergleichsdaten:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '5') {
      logWarn('Firestore-Collection nicht gefunden (Build-Zeit)');
    }
    return [];
  }
}

export async function fetchGenderDistributionData(
  seasonId: string,
  leagueId?: string,
  clubId?: string
): Promise<GenderDistributionData> {
  try {
    const seasonQuery = query(
      collection(db, 'seasons'),
      where('__name__', '==', seasonId)
    );
    const seasonSnapshot = await getDocs(seasonQuery);
    
    if (seasonSnapshot.empty) return { male: 0, female: 0 };
    
    const seasonData = seasonSnapshot.docs[0].data();
    const competitionYear = seasonData.competitionYear;
    
    let leagueType = 'KK';
    if (leagueId && leagueId !== 'all') {
      const leagueQuery = query(
        collection(db, 'rwk_leagues'),
        where('__name__', '==', leagueId)
      );
      const leagueSnapshot = await getDocs(leagueQuery);
      if (!leagueSnapshot.empty) {
        leagueType = leagueSnapshot.docs[0].data().type;
      }
    }
    
    const workingCollection = await findWorkingCollection(competitionYear, leagueType);
    if (!workingCollection) return { male: 0, female: 0 };
    
    let genderScoresQuery;
    if (leagueId && leagueId !== 'all') {
      genderScoresQuery = query(
        collection(db, workingCollection),
        where('competitionYear', '==', competitionYear),
        where('leagueId', '==', leagueId)
      );
    } else {
      genderScoresQuery = query(
        collection(db, workingCollection),
        where('competitionYear', '==', competitionYear)
      );
    }
    
    const scoresSnapshot = await getDocs(genderScoresQuery);
    
    if (!scoresSnapshot.empty) {
      const shootersMap = new Map<string, { gender: 'male' | 'female' }>();
      
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
    
    return { male: 0, female: 0 };
  } catch (error) {
    logError('Fehler beim Laden der Geschlechterverteilungsdaten:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '5') {
      logWarn('Firestore-Collection nicht gefunden (Build-Zeit)');
    }
    return { male: 0, female: 0 };
  }
}

export async function fetchSeasons() {
  try {
    const seasonsQuery = query(
      collection(db, 'seasons'),
      where('status', 'in', ['Laufend', 'Abgeschlossen']),
      orderBy('competitionYear', 'desc')
    );
    
    const snapshot = await getDocs(seasonsQuery);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        year: doc.data().competitionYear,
        status: doc.data().status
      }));
    }
    
    return [];
  } catch (error) {
    logError('Fehler beim Laden der Saisons:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '5') {
      logWarn('Firestore-Collection nicht gefunden (Build-Zeit)');
    }
    return [];
  }
}

export async function fetchLeagues(seasonId: string) {
  try {
    const seasonDoc = await getDocs(
      query(
        collection(db, 'seasons'),
        where('__name__', '==', seasonId)
      )
    );
    
    if (seasonDoc.empty) {
      return [];
    }
    
    const seasonData = seasonDoc.docs[0].data();
    if (seasonData.status !== 'Laufend' && seasonData.status !== 'Abgeschlossen') {
      return [];
    }
    
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
    
    return [];
  } catch (error) {
    logError('Fehler beim Laden der Ligen:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '5') {
      logWarn('Firestore-Collection nicht gefunden (Build-Zeit)');
    }
    return [];
  }
}

export async function fetchClubs() {
  try {
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
    
    return [];
  } catch (error) {
    logError('Fehler beim Laden der Vereine:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '5') {
      logWarn('Firestore-Collection nicht gefunden (Build-Zeit)');
    }
    return [];
  }
}