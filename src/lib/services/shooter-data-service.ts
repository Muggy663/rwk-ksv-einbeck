import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { CompetitionDisplayConfig, IndividualShooterDisplayData, ScoreEntry } from '@/types/rwk';

export async function fetchShooterDataForCompetition(
  config: CompetitionDisplayConfig,
  numRounds: number,
  filterByLeagueId?: string | null
): Promise<IndividualShooterDisplayData[]> {
  if (!config || !config.year || !config.discipline) return [];
  
  try {
    // Direkte Abfrage der Scores nach Jahr
    const scoresColRef = collection(db, "rwk_scores");
    let scoresQuery;
    
    if (filterByLeagueId && filterByLeagueId !== "ALL_LEAGUES_IND_FILTER") {
      // Wenn eine spezifische Liga ausgewählt ist
      scoresQuery = query(scoresColRef, 
        where("leagueId", "==", filterByLeagueId),
        where("competitionYear", "==", config.year)
      );
    } else {
      // Sonst alle Scores für das Jahr laden
      scoresQuery = query(scoresColRef, 
        where("competitionYear", "==", config.year)
      );
    }
    
    const scoresSnapshot = await getDocs(scoresQuery);
    const allScores: ScoreEntry[] = [];
    scoresSnapshot.docs.forEach(d => { 
      allScores.push({ id: d.id, ...d.data() as ScoreEntry }); 
    });
    
    // Schützendaten verarbeiten und erweiterte Informationen laden
    const shootersMap = new Map<string, IndividualShooterDisplayData>();
    const shooterDetailsCache = new Map<string, any>();
    
    for (const score of allScores) {
      if (!score.shooterId) continue;
      
      let currentShooterData = shootersMap.get(score.shooterId);
      if (!currentShooterData) {
        const initialResults: { [key: string]: number | null } = {};
        for (let r = 1; r <= numRounds; r++) initialResults[`dg${r}`] = null;
        
        // Lade erweiterte Schützendaten aus rwk_shooters
        let shooterDetails = shooterDetailsCache.get(score.shooterId);
        if (!shooterDetails) {
          try {
            const shooterDoc = await getDoc(doc(db, 'rwk_shooters', score.shooterId));
            if (shooterDoc.exists()) {
              shooterDetails = shooterDoc.data();
              shooterDetailsCache.set(score.shooterId, shooterDetails);
            }
          } catch (error) {
            console.warn(`Could not load shooter details for ${score.shooterId}:`, error);
          }
        }
        
        // Erstelle vollständigen Namen aus firstName + lastName oder nutze shooterName als Fallback
        let displayName = score.shooterName || "Unbek. Schütze";
        if (shooterDetails?.firstName && shooterDetails?.lastName) {
          displayName = `${shooterDetails.firstName} ${shooterDetails.lastName}`;
        } else if (shooterDetails?.name) {
          displayName = shooterDetails.name;
        }
        
        currentShooterData = {
          shooterId: score.shooterId, 
          shooterName: displayName,
          firstName: shooterDetails?.firstName,
          lastName: shooterDetails?.lastName,
          title: shooterDetails?.title,
          shooterGender: score.shooterGender || 'unknown', 
          teamName: score.teamName || "Unbek. Team", 
          results: initialResults, 
          totalScore: 0, 
          averageScore: null, 
          roundsShot: 0,
          competitionYear: score.competitionYear, 
          leagueId: score.leagueId, 
          leagueType: score.leagueType,
          teamOutOfCompetition: score.teamOutOfCompetition || false,
          teamOutOfCompetitionReason: score.teamOutOfCompetitionReason,
        };
        shootersMap.set(score.shooterId, currentShooterData);
      }
      
      // Gender und Team-Name aktualisieren
      const genderFromScore = score.shooterGender?.toLowerCase();
      if (genderFromScore === 'female' || genderFromScore === 'w') {
          currentShooterData.shooterGender = 'female';
      } else if ((genderFromScore === 'male' || genderFromScore === 'm') && currentShooterData.shooterGender !== 'female') {
          currentShooterData.shooterGender = 'male';
      }

      if (score.teamName && (currentShooterData.teamName === "Unbek. Team" || !currentShooterData.teamName)) {
          currentShooterData.teamName = score.teamName;
      }

      // Liga-Kontext aktualisieren
      if (filterByLeagueId && filterByLeagueId !== "ALL_LEAGUES_IND_FILTER" && score.leagueId === filterByLeagueId) {
        currentShooterData.leagueId = score.leagueId;
        currentShooterData.leagueType = score.leagueType;
      } else if ((!filterByLeagueId || filterByLeagueId === "ALL_LEAGUES_IND_FILTER") && !currentShooterData.leagueId) {
        currentShooterData.leagueId = score.leagueId;
        currentShooterData.leagueType = score.leagueType;
      }

      // Ergebnisse eintragen
      if (score.durchgang >= 1 && score.durchgang <= numRounds && typeof score.totalRinge === 'number') {
        currentShooterData.results[`dg${score.durchgang}`] = score.totalRinge;
      }
    }
    
    // Gesamtergebnisse berechnen
    shootersMap.forEach(shooterData => {
      let currentTotal = 0; 
      let roundsShotCount = 0;
      
      Object.values(shooterData.results).forEach(res => { 
        if (res !== null && typeof res === 'number') { 
          currentTotal += res; 
          roundsShotCount++; 
        } 
      });
      
      shooterData.totalScore = currentTotal; 
      shooterData.roundsShot = roundsShotCount;
      
      if (shooterData.roundsShot > 0 && shooterData.totalScore !== null) {
        shooterData.averageScore = parseFloat((shooterData.totalScore / shooterData.roundsShot).toFixed(2));
      }
    });
    
    // Sortieren und Rangplätze vergeben
    const rankedShooters = Array.from(shootersMap.values())
      .filter(s => s.roundsShot > 0) 
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0) || 
                      (b.averageScore ?? 0) - (a.averageScore ?? 0) || 
                      a.shooterName.localeCompare(b.shooterName));
    
    let shooterRankCounter = 1;
    rankedShooters.forEach(shooter => {
      if (!shooter.teamOutOfCompetition) {
        shooter.rank = shooterRankCounter++;
      } else {
        shooter.rank = null;
      }
    });
    
    return rankedShooters;
  } catch (err: any) {
    console.error("Fehler beim Laden der Einzelschützendaten:", err);
    return [];
  }
}
