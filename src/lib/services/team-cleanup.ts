import { db } from '@/lib/firebase/config';
import { logError, logWarn } from '@/lib/utils/secure-logger';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { getSeasonSpecificScoresCollection } from '@/lib/utils/collection-names';

/**
 * Bereinigt Referenzen auf gelöschte Mannschaften in der Datenbank
 * @param teamId - ID der gelöschten Mannschaft
 */
export async function cleanupDeletedTeamReferences(teamId: string) {
  try {
    // 1. Entferne Referenzen in rwk_scores (alle Collections durchsuchen)
    // Da wir nicht wissen, in welcher Collection die Scores sind, müssen wir alle durchsuchen
    const currentYear = new Date().getFullYear();
    const disciplines: import('@/types/rwk').FirestoreLeagueSpecificDiscipline[] = ['KKG', 'KKP', 'LGA', 'LGS', 'LP'];
    
    const batch = writeBatch(db);
    
    // Durchsuche alle möglichen Collections
    for (const discipline of disciplines) {
      try {
        const collectionName = getSeasonSpecificScoresCollection(currentYear, discipline);
        const scoresRef = collection(db, collectionName);
        const scoresQuery = query(scoresRef, where('teamId', '==', teamId));
        const scoresSnapshot = await getDocs(scoresQuery);
        
        scoresSnapshot.forEach((scoreDoc) => {
          batch.delete(scoreDoc.ref);
        });
      } catch (error) {
        logWarn(`Fehler beim Durchsuchen von ${discipline} Collection:`, error instanceof Error ? error.message : String(error));
      }
    }
    

    
    // 2. Entferne Referenzen in rwk_shooter_team_assignments
    const assignmentsRef = collection(db, 'rwk_shooter_team_assignments');
    const assignmentsQuery = query(assignmentsRef, where('teamId', '==', teamId));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    
    assignmentsSnapshot.forEach((assignmentDoc) => {
      batch.delete(assignmentDoc.ref);
    });
    
    // Batch-Operationen ausführen
    await batch.commit();
    

    return true;
  } catch (error) {
    logError('Fehler beim Bereinigen von Mannschaftsreferenzen:', error);
    throw error;
  }
}

/**
 * Bereinigt alle Referenzen auf gelöschte Mannschaften für einen bestimmten Verein
 * @param clubId - ID des Vereins
 * @param userId - ID des Benutzers, der die Bereinigung durchführt (optional)
 */
export async function cleanupAllDeletedTeamReferencesForClub(clubId: string, _userId?: string) {
  try {
    // Hole alle aktiven Mannschaften des Vereins
    const teamsRef = collection(db, 'rwk_teams');
    const teamsQuery = query(teamsRef, where('clubId', '==', clubId));
    const teamsSnapshot = await getDocs(teamsQuery);
    
    const activeTeamIds = teamsSnapshot.docs.map(doc => doc.id);
    
    // Hole alle Schützen-Mannschafts-Zuweisungen für den Verein
    const assignmentsRef = collection(db, 'rwk_shooter_team_assignments');
    const assignmentsQuery = query(assignmentsRef, where('clubId', '==', clubId));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    
    const batch = writeBatch(db);
    let deletedCount = 0;
    
    // Lösche Zuweisungen für nicht mehr existierende Mannschaften
    assignmentsSnapshot.forEach((assignmentDoc) => {
      const assignment = assignmentDoc.data();
      if (!activeTeamIds.includes(assignment.teamId)) {
        batch.delete(assignmentDoc.ref);
        deletedCount++;
      }
    });
    
    // Hole alle Ergebnisse für den Verein aus allen Collections
    const currentYear = new Date().getFullYear();
    const disciplines: import('@/types/rwk').FirestoreLeagueSpecificDiscipline[] = ['KKG', 'KKP', 'LGA', 'LGS', 'LP'];
    
    for (const discipline of disciplines) {
      try {
        const collectionName = getSeasonSpecificScoresCollection(currentYear, discipline);
        const scoresRef = collection(db, collectionName);
        const scoresQuery = query(scoresRef, where('clubId', '==', clubId));
        const scoresSnapshot = await getDocs(scoresQuery);
        
        // Lösche Ergebnisse für nicht mehr existierende Mannschaften
        scoresSnapshot.forEach((scoreDoc) => {
          const score = scoreDoc.data();
          if (!activeTeamIds.includes(score.teamId)) {
            batch.delete(scoreDoc.ref);
            deletedCount++;
          }
        });
      } catch (error) {
        logWarn(`Fehler beim Durchsuchen von ${discipline} Collection:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    // Batch-Operationen ausführen
    if (deletedCount > 0) {
      await batch.commit();

    } else {

    }
    
    return deletedCount;
  } catch (error) {
    logError('Fehler beim Bereinigen von Vereinsreferenzen:', error);
    throw error;
  }
}
