import { db } from '@/lib/firebase/config';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  doc, 
  deleteDoc,
  updateDoc,
  documentId 
} from 'firebase/firestore';

export interface CleanupDiagnosis {
  orphanedTeamShooters: Array<{id: string, teamId: string, shooterId: string}>;
  duplicateShooterAssignments: Array<{shooterId: string, teamIds: string[]}>;
  orphanedTeamReferences: Array<{collection: string, docId: string, teamId: string}>;
  inconsistentShooterArrays: Array<{teamId: string, arrayIds: string[], relationIds: string[]}>;
}

export interface CleanupResult {
  orphanedTeamShootersFixed: number;
  duplicateAssignmentsFixed: number;
  orphanedReferencesFixed: number;
  inconsistentArraysFixed: number;
  totalFixed: number;
}

/**
 * Führt eine umfassende Diagnose der Datenbankinkonsistenzen durch
 */
export async function diagnoseDatabaseInconsistencies(clubId: string): Promise<CleanupDiagnosis> {
  const diagnosis: CleanupDiagnosis = {
    orphanedTeamShooters: [],
    duplicateShooterAssignments: [],
    orphanedTeamReferences: [],
    inconsistentShooterArrays: []
  };

  try {
    // 1. Verwaiste Team-Schützen-Referenzen finden
    const teamShootersQuery = query(collection(db, 'rwk_team_shooters'));
    const teamShootersSnapshot = await getDocs(teamShootersQuery);
    
    // Alle existierenden Teams und Schützen laden
    const teamsQuery = query(collection(db, 'rwk_teams'), where('clubId', '==', clubId));
    const teamsSnapshot = await getDocs(teamsQuery);
    const existingTeamIds = new Set(teamsSnapshot.docs.map(doc => doc.id));
    
    const shootersQuery = query(collection(db, 'rwk_shooters'));
    const shootersSnapshot = await getDocs(shootersQuery);
    const existingShooterIds = new Set(shootersSnapshot.docs.map(doc => doc.id));

    // Prüfe Team-Schützen-Referenzen
    for (const tsDoc of teamShootersSnapshot.docs) {
      const data = tsDoc.data();
      const teamId = data.teamId;
      const shooterId = data.shooterId;
      
      if (!existingTeamIds.has(teamId) || !existingShooterIds.has(shooterId)) {
        diagnosis.orphanedTeamShooters.push({
          id: tsDoc.id,
          teamId,
          shooterId
        });
      }
    }

    // 2. Doppelte Schützen-Zuordnungen finden
    const shooterTeamMap = new Map<string, string[]>();
    
    for (const tsDoc of teamShootersSnapshot.docs) {
      const data = tsDoc.data();
      const shooterId = data.shooterId;
      const teamId = data.teamId;
      
      if (existingTeamIds.has(teamId) && existingShooterIds.has(shooterId)) {
        if (!shooterTeamMap.has(shooterId)) {
          shooterTeamMap.set(shooterId, []);
        }
        shooterTeamMap.get(shooterId)!.push(teamId);
      }
    }

    // Finde Schützen mit mehreren Teams
    for (const [shooterId, teamIds] of shooterTeamMap.entries()) {
      if (teamIds.length > 1) {
        diagnosis.duplicateShooterAssignments.push({
          shooterId,
          teamIds
        });
      }
    }

    // 3. Verwaiste Team-Referenzen in anderen Collections
    const scoresQuery = query(collection(db, 'rwk_scores'));
    const scoresSnapshot = await getDocs(scoresQuery);
    
    for (const scoreDoc of scoresSnapshot.docs) {
      const data = scoreDoc.data();
      if (data.teamId && !existingTeamIds.has(data.teamId)) {
        diagnosis.orphanedTeamReferences.push({
          collection: 'rwk_scores',
          docId: scoreDoc.id,
          teamId: data.teamId
        });
      }
    }

    // 4. Inkonsistente shooterIds Arrays in Teams
    for (const teamDoc of teamsSnapshot.docs) {
      const teamData = teamDoc.data();
      const teamId = teamDoc.id;
      const arrayIds = teamData.shooterIds || [];
      
      // Finde tatsächliche Zuordnungen in rwk_team_shooters
      const actualRelations = teamShootersSnapshot.docs
        .filter(doc => doc.data().teamId === teamId)
        .map(doc => doc.data().shooterId);
      
      // Vergleiche Arrays
      const arraySet = new Set(arrayIds);
      const relationSet = new Set(actualRelations);
      
      const hasInconsistency = 
        arrayIds.length !== actualRelations.length ||
        !arrayIds.every(id => relationSet.has(id)) ||
        !actualRelations.every(id => arraySet.has(id));
      
      if (hasInconsistency) {
        diagnosis.inconsistentShooterArrays.push({
          teamId,
          arrayIds,
          relationIds: actualRelations
        });
      }
    }

  } catch (error) {
    console.error('Error during diagnosis:', error);
    throw error;
  }

  return diagnosis;
}

/**
 * Führt eine umfassende Bereinigung basierend auf der Diagnose durch
 */
export async function performAdvancedCleanup(clubId: string, diagnosis: CleanupDiagnosis): Promise<CleanupResult> {
  const result: CleanupResult = {
    orphanedTeamShootersFixed: 0,
    duplicateAssignmentsFixed: 0,
    orphanedReferencesFixed: 0,
    inconsistentArraysFixed: 0,
    totalFixed: 0
  };

  const batch = writeBatch(db);
  let batchCount = 0;

  try {
    // 1. Verwaiste Team-Schützen-Referenzen löschen
    for (const orphaned of diagnosis.orphanedTeamShooters) {
      const docRef = doc(db, 'rwk_team_shooters', orphaned.id);
      batch.delete(docRef);
      batchCount++;
      result.orphanedTeamShootersFixed++;
      
      if (batchCount >= 450) { // Firestore Batch-Limit beachten
        await batch.commit();
        batchCount = 0;
      }
    }

    // 2. Doppelte Zuordnungen bereinigen (behalte nur die neueste)
    for (const duplicate of diagnosis.duplicateShooterAssignments) {
      // Finde alle Zuordnungen für diesen Schützen
      const relationsQuery = query(
        collection(db, 'rwk_team_shooters'),
        where('shooterId', '==', duplicate.shooterId),
        where('teamId', 'in', duplicate.teamIds)
      );
      const relationsSnapshot = await getDocs(relationsQuery);
      
      // Sortiere nach Erstellungsdatum und behalte nur die neueste
      const relations = relationsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      
      // Lösche alle außer der neuesten
      for (let i = 1; i < relations.length; i++) {
        const docRef = doc(db, 'rwk_team_shooters', relations[i].id);
        batch.delete(docRef);
        batchCount++;
        result.duplicateAssignmentsFixed++;
        
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }

    // 3. Verwaiste Referenzen in anderen Collections löschen
    for (const orphaned of diagnosis.orphanedTeamReferences) {
      const docRef = doc(db, orphaned.collection, orphaned.docId);
      batch.delete(docRef);
      batchCount++;
      result.orphanedReferencesFixed++;
      
      if (batchCount >= 450) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // 4. Inkonsistente shooterIds Arrays korrigieren
    for (const inconsistent of diagnosis.inconsistentShooterArrays) {
      const teamRef = doc(db, 'rwk_teams', inconsistent.teamId);
      batch.update(teamRef, {
        shooterIds: inconsistent.relationIds
      });
      batchCount++;
      result.inconsistentArraysFixed++;
      
      if (batchCount >= 450) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // Finaler Batch-Commit
    if (batchCount > 0) {
      await batch.commit();
    }

    result.totalFixed = 
      result.orphanedTeamShootersFixed + 
      result.duplicateAssignmentsFixed + 
      result.orphanedReferencesFixed + 
      result.inconsistentArraysFixed;

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }

  return result;
}

/**
 * Kombinierte Diagnose und Bereinigung
 */
export async function diagnoseAndCleanup(clubId: string): Promise<{diagnosis: CleanupDiagnosis, result: CleanupResult}> {
  const diagnosis = await diagnoseDatabaseInconsistencies(clubId);
  const result = await performAdvancedCleanup(clubId, diagnosis);
  
  return { diagnosis, result };
}