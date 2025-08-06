import { db } from '@/lib/firebase/config';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  doc,
  orderBy
} from 'firebase/firestore';

export interface SafeCleanupDiagnosis {
  trulyOrphanedTeamShooters: Array<{id: string, teamId: string, shooterId: string}>;
  trulyOrphanedScores: Array<{id: string, teamId: string, shooterId: string}>;
  safeToDelete: boolean;
  warnings: string[];
}

/**
 * Sichere Diagnose - prüft nur wirklich verwaiste Daten
 */
export async function safeDiagnoseDatabaseInconsistencies(clubId: string): Promise<SafeCleanupDiagnosis> {
  const diagnosis: SafeCleanupDiagnosis = {
    trulyOrphanedTeamShooters: [],
    trulyOrphanedScores: [],
    safeToDelete: true,
    warnings: []
  };

  try {
    // Aktuelle Saison ermitteln
    const seasonsQuery = query(collection(db, 'rwk_seasons'), orderBy('year', 'desc'));
    const seasonsSnapshot = await getDocs(seasonsQuery);
    const currentSeason = seasonsSnapshot.docs[0];
    
    if (!currentSeason) {
      diagnosis.warnings.push('Keine Saison gefunden - Bereinigung nicht möglich');
      diagnosis.safeToDelete = false;
      return diagnosis;
    }

    const currentSeasonId = currentSeason.id;

    // Alle aktiven Teams der aktuellen Saison für den Verein laden
    const activeTeamsQuery = query(
      collection(db, 'rwk_teams'), 
      where('clubId', '==', clubId),
      where('seasonId', '==', currentSeasonId)
    );
    const activeTeamsSnapshot = await getDocs(activeTeamsQuery);
    const activeTeamIds = new Set(activeTeamsSnapshot.docs.map(doc => doc.id));

    // Alle Schützen des Vereins laden
    const shootersQuery = query(collection(db, 'rwk_shooters'), where('clubId', '==', clubId));
    const shootersSnapshot = await getDocs(shootersQuery);
    const existingShooterIds = new Set(shootersSnapshot.docs.map(doc => doc.id));

    // Alle Team-Schützen-Verknüpfungen prüfen
    const teamShootersQuery = query(collection(db, 'rwk_team_shooters'));
    const teamShootersSnapshot = await getDocs(teamShootersQuery);
    
    for (const tsDoc of teamShootersSnapshot.docs) {
      const data = tsDoc.data();
      const teamId = data.teamId;
      const shooterId = data.shooterId;
      
      // Nur als verwaist markieren wenn:
      // 1. Das Team nicht mehr existiert UND
      // 2. Der Schütze nicht mehr existiert UND
      // 3. Es keine aktiven Ergebnisse gibt
      const teamExists = activeTeamIds.has(teamId);
      const shooterExists = existingShooterIds.has(shooterId);
      
      if (!teamExists && !shooterExists) {
        // Prüfe ob es noch Ergebnisse gibt
        const scoresQuery = query(
          collection(db, 'rwk_scores'),
          where('teamId', '==', teamId),
          where('shooterId', '==', shooterId)
        );
        const scoresSnapshot = await getDocs(scoresQuery);
        
        if (scoresSnapshot.empty) {
          diagnosis.trulyOrphanedTeamShooters.push({
            id: tsDoc.id,
            teamId,
            shooterId
          });
        } else {
          diagnosis.warnings.push(`Team-Schützen-Verknüpfung ${tsDoc.id} hat noch ${scoresSnapshot.size} Ergebnisse`);
        }
      }
    }

    // Prüfe Ergebnisse nur auf nicht-existierende Teams UND Schützen
    const scoresQuery = query(collection(db, 'rwk_scores'));
    const scoresSnapshot = await getDocs(scoresQuery);
    
    for (const scoreDoc of scoresSnapshot.docs) {
      const data = scoreDoc.data();
      const teamId = data.teamId;
      const shooterId = data.shooterId;
      
      // Nur löschen wenn sowohl Team als auch Schütze nicht mehr existieren
      if (!activeTeamIds.has(teamId) && !existingShooterIds.has(shooterId)) {
        diagnosis.trulyOrphanedScores.push({
          id: scoreDoc.id,
          teamId,
          shooterId
        });
      }
    }

    // Sicherheitscheck
    const totalToDelete = diagnosis.trulyOrphanedTeamShooters.length + diagnosis.trulyOrphanedScores.length;
    if (totalToDelete > 100) {
      diagnosis.warnings.push(`WARNUNG: ${totalToDelete} Einträge würden gelöscht - das scheint zu viel zu sein!`);
      diagnosis.safeToDelete = false;
    }

  } catch (error) {
    console.error('Error during safe diagnosis:', error);
    diagnosis.warnings.push(`Fehler bei der Diagnose: ${error}`);
    diagnosis.safeToDelete = false;
  }

  return diagnosis;
}

/**
 * Sichere Bereinigung - löscht nur wirklich verwaiste Daten
 */
export async function performSafeCleanup(clubId: string, diagnosis: SafeCleanupDiagnosis): Promise<{deleted: number, warnings: string[]}> {
  if (!diagnosis.safeToDelete) {
    throw new Error('Bereinigung nicht sicher - bitte Warnungen prüfen');
  }

  const batch = writeBatch(db);
  let batchCount = 0;
  let totalDeleted = 0;

  try {
    // Nur wirklich verwaiste Team-Schützen-Verknüpfungen löschen
    for (const orphaned of diagnosis.trulyOrphanedTeamShooters) {
      const docRef = doc(db, 'rwk_team_shooters', orphaned.id);
      batch.delete(docRef);
      batchCount++;
      totalDeleted++;
      
      if (batchCount >= 450) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // Nur wirklich verwaiste Ergebnisse löschen
    for (const orphaned of diagnosis.trulyOrphanedScores) {
      const docRef = doc(db, 'rwk_scores', orphaned.id);
      batch.delete(docRef);
      batchCount++;
      totalDeleted++;
      
      if (batchCount >= 450) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

  } catch (error) {
    console.error('Error during safe cleanup:', error);
    throw error;
  }

  return {
    deleted: totalDeleted,
    warnings: diagnosis.warnings
  };
}
