// Einfache Migration ohne komplexe Logik
import { db } from '@/lib/firebase/config';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

export async function simpleMigration() {
  try {
    logDebug('Starte einfache Migration...');
    
    // Lade alle Shooter
    const shootersSnapshot = await getDocs(collection(db, 'shooters'));
    logDebug(`Gefunden: ${shootersSnapshot.docs.length} Shooter`);
    
    let migrated = 0;
    const batchSize = 500; // Firestore batch limit
    
    for (let i = 0; i < shootersSnapshot.docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = shootersSnapshot.docs.slice(i, i + batchSize);
      
      for (const shooterDoc of batchDocs) {
        const data = shooterDoc.data();
        const clubId = data.clubId;
        
        if (!clubId) continue;
        
        const memberData = {
          name: data.name || '',
          vorname: data.vorname || data.firstName || '',
          geburtsdatum: data.geburtsdatum || data.geburtstag || null,
          clubId: clubId,
          originalShooterId: shooterDoc.id,
          migriert: true,
          erstelltAm: new Date()
        };
        
        const targetCollection = `clubs/${clubId}/mitglieder`;
        const newDocRef = doc(collection(db, targetCollection));
        batch.set(newDocRef, memberData);
        migrated++;
      }
      
      await batch.commit();
      logDebug(`Migriert: ${migrated}`);
    }
    
    logDebug('Migration abgeschlossen:', migrated, 'Mitglieder');
    return migrated;
    
  } catch (error) {
    logError('Migration-Fehler:', error);
    throw error;
  }
}
