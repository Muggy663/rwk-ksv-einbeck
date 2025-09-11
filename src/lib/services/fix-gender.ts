// Gender-Feld nachträglich korrigieren
import { db } from '@/lib/firebase/config';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

export async function fixGenderFieldsAllClubs() {
  try {
    console.log('Korrigiere Gender-Felder für alle Vereine...');
    
    // Lade alle Clubs
    const clubsSnapshot = await getDocs(collection(db, 'clubs'));
    console.log(`Gefunden: ${clubsSnapshot.docs.length} Vereine`);
    
    let totalUpdated = 0;
    
    for (const clubDoc of clubsSnapshot.docs) {
      const clubId = clubDoc.id;
      const clubData = clubDoc.data();
      console.log(`Korrigiere Gender für: ${clubData.name} (${clubId})`);
      
      const updated = await fixGenderForClub(clubId);
      totalUpdated += updated;
    }
    
    console.log(`Gender-Korrektur abgeschlossen: ${totalUpdated} Mitglieder aus allen Vereinen aktualisiert`);
    return totalUpdated;
    
  } catch (error) {
    console.error('Fehler bei Gesamt-Gender-Korrektur:', error);
    throw error;
  }
}

export async function fixGenderForClub(clubId: string) {
  try {
    
    // Lade alle Mitglieder
    const mitgliederCollection = `clubs/${clubId}/mitglieder`;
    const mitgliederSnapshot = await getDocs(collection(db, mitgliederCollection));
    
    console.log('Gefunden:', mitgliederSnapshot.docs.length, 'Mitglieder');
    
    let updated = 0;
    
    for (const memberDoc of mitgliederSnapshot.docs) {
      const memberData = memberDoc.data();
      const originalShooterId = memberData.originalShooterId;
      
      if (!originalShooterId) continue;
      
      // Lade Original-Shooter-Daten
      const shootersQuery = query(
        collection(db, 'shooters'),
        where('__name__', '==', originalShooterId)
      );
      const shooterSnapshot = await getDocs(shootersQuery);
      
      if (!shooterSnapshot.empty) {
        const shooterData = shooterSnapshot.docs[0].data();
        const gender = shooterData.geschlecht || shooterData.gender || 'male';
        
        // Update Mitglied mit korrektem Gender
        await updateDoc(doc(db, mitgliederCollection, memberDoc.id), {
          geschlecht: gender,
          gender: gender // Beide Felder für Kompatibilität
        });
        
        updated++;
      }
    }
    
    console.log('Gender-Korrektur abgeschlossen:', updated, 'Mitglieder aktualisiert');
    return updated;
    
  } catch (error) {
    console.error('Fehler bei Gender-Korrektur:', error);
    throw error;
  }
}