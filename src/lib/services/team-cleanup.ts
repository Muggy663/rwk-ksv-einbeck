import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';

/**
 * Bereinigt Referenzen auf gelöschte Mannschaften in der Datenbank
 * @param teamId - ID der gelöschten Mannschaft
 */
export async function cleanupDeletedTeamReferences(teamId: string) {
  try {
    // 1. Entferne Referenzen in rwk_scores
    const scoresRef = collection(db, 'rwk_scores');
    const scoresQuery = query(scoresRef, where('teamId', '==', teamId));
    const scoresSnapshot = await getDocs(scoresQuery);
    
    const batch = writeBatch(db);
    
    scoresSnapshot.forEach((scoreDoc) => {
      batch.delete(scoreDoc.ref);
    });
    
    // 2. Entferne Referenzen in rwk_shooter_team_assignments
    const assignmentsRef = collection(db, 'rwk_shooter_team_assignments');
    const assignmentsQuery = query(assignmentsRef, where('teamId', '==', teamId));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    
    assignmentsSnapshot.forEach((assignmentDoc) => {
      batch.delete(assignmentDoc.ref);
    });
    
    // Batch-Operationen ausführen
    await batch.commit();
    
    console.log(`Referenzen für gelöschte Mannschaft ${teamId} erfolgreich bereinigt`);
    return true;
  } catch (error) {
    console.error('Fehler beim Bereinigen von Mannschaftsreferenzen:', error);
    throw error;
  }
}

/**
 * Bereinigt alle Referenzen auf gelöschte Mannschaften für einen bestimmten Verein
 * @param clubId - ID des Vereins
 * @param userId - ID des Benutzers, der die Bereinigung durchführt (optional)
 */
export async function cleanupAllDeletedTeamReferencesForClub(clubId: string, userId?: string) {
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
    
    // Hole alle Ergebnisse für den Verein
    const scoresRef = collection(db, 'rwk_scores');
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
    
    // Batch-Operationen ausführen
    if (deletedCount > 0) {
      await batch.commit();
      console.log(`${deletedCount} verwaiste Referenzen für Verein ${clubId} bereinigt`);
    } else {
      console.log(`Keine verwaisten Referenzen für Verein ${clubId} gefunden`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Fehler beim Bereinigen von Vereinsreferenzen:', error);
    throw error;
  }
}