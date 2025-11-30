import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { db } from '@/lib/firebase';

/**
 * Migrationsfunktion für bestehende Teams
 * Fügt das outOfCompetition-Feld mit dem Standardwert false hinzu
 */
export const migrateTeamsForOutOfCompetition = async () => {
  try {
    const teamsRef = collection(db, "rwk_teams");
    const teamsSnapshot = await getDocs(teamsRef);
    
    if (teamsSnapshot.empty) {

      return { success: true, message: "Keine Teams gefunden", migratedCount: 0 };
    }
    
    const batch = writeBatch(db);
    let migratedCount = 0;
    
    teamsSnapshot.forEach(teamDoc => {
      const teamData = teamDoc.data();
      const teamRef = doc(db, "rwk_teams", teamDoc.id);
      
      // Nur fehlende Felder hinzufügen, keine vorhandenen Daten überschreiben
      if (teamData.outOfCompetition === undefined) {
        batch.update(teamRef, { outOfCompetition: false });
        migratedCount++;
      }
    });
    
    if (migratedCount > 0) {
      await batch.commit();

      return { success: true, message: `${migratedCount} Teams aktualisiert`, migratedCount };
    } else {

      return { success: true, message: "Alle Teams haben bereits das outOfCompetition-Feld", migratedCount: 0 };
    }
  } catch (error) {
    logError("Fehler bei der Migration:", error);
    return { success: false, message: `Fehler bei der Migration: ${error}`, migratedCount: 0 };
  }
};
