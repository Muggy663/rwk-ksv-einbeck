// Einfache Migration ohne komplexe Logik
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export async function simpleMigration() {
  try {
    console.log('Starte einfache Migration...');
    
    // Lade alle Shooter
    const shootersSnapshot = await getDocs(collection(db, 'shooters'));
    console.log('Gefunden:', shootersSnapshot.docs.length, 'Shooter');
    
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
        console.log('Migriert:', migrated);
      }
    }
    
    console.log('Migration abgeschlossen:', migrated, 'Mitglieder');
    return migrated;
    
  } catch (error) {
    console.error('Migration-Fehler:', error);
    throw error;
  }
}