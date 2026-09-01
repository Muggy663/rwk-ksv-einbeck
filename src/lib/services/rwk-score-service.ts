import { db } from '@/lib/firebase/config';
import { logError, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { createAuditEntry } from './audit-service';
import { batchGetShooters, batchGetClubs } from '@/lib/utils/batch-reads';

export interface RWKScoreData {
  shooterId: string;
  teamId: string;
  leagueId?: string;
  score: number;
  durchgang: number;
  competitionYear: number;
  createdBy: string;
  resultType?: 'regular' | 'pre' | 'post';
}

/**
 * Speichert ein RWK-Ergebnis und erstellt einen detaillierten Audit-Log-Eintrag
 * für E-Mail-Benachrichtigungen
 */
export async function saveRWKScore(scoreData: RWKScoreData, userInfo: { userId: string; userName: string }) {
  try {
    // Lade alle notwendigen Daten für den Audit-Log
    const [shooterDoc, teamDoc] = await Promise.all([
      getDoc(doc(db, 'shooters', scoreData.shooterId)),
      getDoc(doc(db, 'rwk_teams', scoreData.teamId))
    ]);

    const shooterName = shooterDoc.exists() ? shooterDoc.data()?.name || 'Unbekannter Schütze' : 'Unbekannter Schütze';
    const teamData = teamDoc.exists() ? teamDoc.data() : null;
    const teamName = teamData?.name || 'Unbekannte Mannschaft';

    // Lade Liga-Daten und Vereins-Daten parallel
    let leagueName = 'Unbekannte Liga';
    let clubName = 'Unbekannter Verein';
    
    const [leagueResult, clubResult] = await Promise.all([
      teamData?.leagueId ? getDoc(doc(db, 'rwk_leagues', teamData.leagueId)).catch(() => null) : Promise.resolve(null),
      teamData?.clubId ? getDoc(doc(db, 'clubs', teamData.clubId)).catch(() => null) : Promise.resolve(null)
    ]);
    
    if (leagueResult?.exists()) {
      leagueName = leagueResult.data()?.name || leagueName;
    }
    
    if (clubResult?.exists()) {
      clubName = clubResult.data()?.name || clubName;
    }

    // Speichere das Ergebnis
    const scoreEntry = {
      ...scoreData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'rwk_scores'), scoreEntry);

    // Erstelle detaillierten Audit-Log-Eintrag
    await createAuditEntry(
      'create',
      'score',
      docRef.id,
      {
        after: scoreData,
        description: `Ergebnis erfasst: ${shooterName} - ${scoreData.score} Ringe (DG ${scoreData.durchgang})`
      },
      {
        leagueId: teamData?.leagueId,
        leagueName,
        teamId: scoreData.teamId,
        teamName,
        shooterId: scoreData.shooterId,
        shooterName,
        userId: userInfo.userId,
        userName: userInfo.userName
      }
    );

    logInfo(`RWK-Ergebnis gespeichert: ${shooterName} - ${scoreData.score} Ringe (${teamName}, DG ${scoreData.durchgang})`);

    return {
      success: true,
      scoreId: docRef.id,
      message: `Ergebnis für ${shooterName} erfolgreich gespeichert`
    };

  } catch (error) {
    logError('Fehler beim Speichern des RWK-Ergebnisses:', error);
    throw error;
  }
}

/**
 * 🚀 OPTIMIERT: Speichert mehrere RWK-Ergebnisse als Batch mit Batch-Reads
 */
export async function saveRWKScoresBatch(scores: RWKScoreData[], userInfo: { userId: string; userName: string }) {
  try {
    // 🚀 Batch-Load aller Shooter und Teams auf einmal
    const shooterIds = [...new Set(scores.map(s => s.shooterId))];
    const teamIds = [...new Set(scores.map(s => s.teamId))];
    
    logDebug(`📦 Batch loading ${shooterIds.length} shooters and ${teamIds.length} teams...`);
    
    const [shootersMap, teamsSnapshot] = await Promise.all([
      batchGetShooters(shooterIds),
      getDocs(query(collection(db, 'rwk_teams'), where('__name__', 'in', teamIds.slice(0, 30))))
    ]);
    
    const teamsMap = new Map();
    teamsSnapshot.docs.forEach(doc => {
      teamsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    
    // Sammle alle Club-IDs für Batch-Load
    const clubIds = [...new Set(Array.from(teamsMap.values()).map((t: any) => t.clubId).filter(Boolean))];
    const clubsMap = await batchGetClubs(clubIds);
    
    logDebug(`✅ Loaded ${shootersMap.size} shooters, ${teamsMap.size} teams, ${clubsMap.size} clubs in batch`);
    
    const results = [];
    
    for (const scoreData of scores) {
      try {
        const shooter = shootersMap.get(scoreData.shooterId);
        const team = teamsMap.get(scoreData.teamId);
        const club = team?.clubId ? clubsMap.get(team.clubId) : null;
        
        const shooterName = shooter?.name || 'Unbekannter Schütze';
        const teamName = team?.name || 'Unbekannte Mannschaft';
        
        // Speichere das Ergebnis
        const scoreEntry = {
          ...scoreData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'rwk_scores'), scoreEntry);

        // Erstelle Audit-Log
        await createAuditEntry(
          'create',
          'score',
          docRef.id,
          {
            after: scoreData,
            description: `Ergebnis erfasst: ${shooterName} - ${scoreData.score} Ringe (DG ${scoreData.durchgang})`
          },
          {
            leagueId: team?.leagueId,
            leagueName: 'Liga',
            teamId: scoreData.teamId,
            teamName,
            shooterId: scoreData.shooterId,
            shooterName,
            userId: userInfo.userId,
            userName: userInfo.userName
          }
        );
        
        results.push({
          success: true,
          scoreId: docRef.id,
          message: `Ergebnis für ${shooterName} erfolgreich gespeichert`
        });
      } catch (error) {
        logError('Fehler beim Speichern eines einzelnen Ergebnisses:', error);
        results.push({
          success: false,
          scoreId: null,
          message: `Fehler beim Speichern des Ergebnisses`
        });
      }
    }

    logInfo(`Batch von ${scores.length} RWK-Ergebnissen gespeichert`);

    return {
      success: true,
      results,
      message: `${scores.length} Ergebnisse erfolgreich gespeichert`
    };

  } catch (error) {
    logError('Fehler beim Speichern des RWK-Ergebnis-Batches:', error);
    throw error;
  }
}

/**
 * Hilfsfunktion zum Validieren von RWK-Ergebnissen
 */
export function validateRWKScore(scoreData: RWKScoreData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!scoreData.shooterId) {
    errors.push('Schütze-ID ist erforderlich');
  }

  if (!scoreData.teamId) {
    errors.push('Team-ID ist erforderlich');
  }

  if (!scoreData.score || scoreData.score < 0 || scoreData.score > 400) {
    errors.push('Ungültiger Ringwert (0-400 erlaubt)');
  }

  if (!scoreData.durchgang || scoreData.durchgang < 1 || scoreData.durchgang > 5) {
    errors.push('Ungültiger Durchgang (1-5 erlaubt)');
  }

  if (!scoreData.competitionYear || scoreData.competitionYear < 2020 || scoreData.competitionYear > 2030) {
    errors.push('Ungültiges Wettkampfjahr');
  }

  if (!scoreData.createdBy) {
    errors.push('Benutzer-ID ist erforderlich');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
