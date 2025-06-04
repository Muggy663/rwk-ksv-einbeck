import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

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

export async function fetchShooterPerformanceData(
  seasonId: string,
  leagueId?: string,
  clubId?: string
): Promise<ShooterPerformanceData[]> {
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
    
    // Keine Daten gefunden
    console.log('Keine Schützenleistungsdaten in Firestore gefunden.');
    return [];
  } catch (error) {
    console.error('Fehler beim Laden der Schützenleistungsdaten:', error);
    return [];
  }
}

export async function fetchTeamComparisonData(
  seasonId: string,
  leagueId?: string
): Promise<TeamComparisonData[]> {
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
      const teamsData: TeamComparisonData[] = [];
      
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

export async function fetchGenderDistributionData(
  seasonId: string,
  leagueId?: string,
  clubId?: string
): Promise<GenderDistributionData> {
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
    
    // Keine Daten gefunden
    console.log('Keine Geschlechterverteilungsdaten in Firestore gefunden.');
    return { male: 0, female: 0 };
  } catch (error) {
    console.error('Fehler beim Laden der Geschlechterverteilungsdaten:', error);
    return { male: 0, female: 0 };
  }
}

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

export async function fetchLeagues(seasonId: string) {
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