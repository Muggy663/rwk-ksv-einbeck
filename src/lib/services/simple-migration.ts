// Einfache Migration ohne komplexe Logik
import { db } from '@/lib/firebase/config';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export async function simpleMigration() {
  try {
    logDebug('Starte einfache Migration...');
    
    // Lade alle Shooter
    const shootersSnapshot = await getDocs(collection(db, 'shooters'));
    logDebug('Gefunden:', shootersSnapshot.docs.length, 'Shooter');
    
    let migrated = 0;
    
    for (const shooterDoc of shootersSnapshot.docs) {
      const data = shooterDoc.data();
      const clubId = data.clubId;
      
      if (!clubId) continue;
      
      // Einfache Mitglieder-Daten
      const memberData = {
        name: data.name || '',
        vorname: data.vorname || data.firstName || '',
        geburtsdatum: data.geburtsdatum || data.geburtstag || null,
        clubId: clubId,
        originalShooterId: shooterDoc.id,
        migriert: true,
        erstelltAm: new Date()
      };
      
      // Speichere in club-spezifischer Collection
      const targetCollection = `clubs/${clubId}/mitglieder`;
      await addDoc(collection(db, targetCollection), memberData);
      migrated++;
      
      if (migrated % 10 === 0) {
        logDebug('Migriert:', migrated);
      }
    }
    
    logDebug('Migration abgeschlossen:', migrated, 'Mitglieder');
    return migrated;
    
  } catch (error) {
    logError('Migration-Fehler:', error);
    throw error;
  }
}
