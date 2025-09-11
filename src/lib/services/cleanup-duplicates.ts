// Duplikat-Bereinigung für Mitglieder
import { db } from '@/lib/firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export async function cleanupDuplicatesAllClubs() {
  try {
    console.log('Starte Duplikat-Bereinigung für alle Vereine...');
    
    // Lade alle Clubs
    const clubsSnapshot = await getDocs(collection(db, 'clubs'));
    console.log(`Gefunden: ${clubsSnapshot.docs.length} Vereine`);
    
    let totalDeleted = 0;
    let totalRemaining = 0;
    
    for (const clubDoc of clubsSnapshot.docs) {
      const clubId = clubDoc.id;
      const clubData = clubDoc.data();
      console.log(`Bereinige Duplikate für: ${clubData.name} (${clubId})`);
      
      const result = await cleanupDuplicatesForClub(clubId);
      totalDeleted += result.deleted;
      totalRemaining += result.remaining;
    }
    
    console.log(`Duplikat-Bereinigung abgeschlossen: ${totalDeleted} Duplikate gelöscht, ${totalRemaining} Mitglieder verbleiben`);
    return { deleted: totalDeleted, remaining: totalRemaining };
    
  } catch (error) {
    console.error('Fehler bei Gesamt-Duplikat-Bereinigung:', error);
    throw error;
  }
}

export async function cleanupDuplicatesForClub(clubId: string) {
  try {
    
    const mitgliederCollection = `clubs/${clubId}/mitglieder`;
    const snapshot = await getDocs(collection(db, mitgliederCollection));
    
    console.log('Gefunden:', snapshot.docs.length, 'Mitglieder');
    
    // Gruppiere nach originalShooterId
    const membersByShooterId = new Map();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const shooterId = data.originalShooterId;
      
      if (!membersByShooterId.has(shooterId)) {
        membersByShooterId.set(shooterId, []);
      }
      membersByShooterId.get(shooterId).push({ id: doc.id, data });
    });
    
    let deleted = 0;
    
    // Lösche Duplikate - behalte nur das erste
    for (const [shooterId, members] of membersByShooterId) {
      if (members.length > 1) {
        console.log(`Shooter ${shooterId} hat ${members.length} Duplikate`);
        
        // Lösche alle außer dem ersten
        for (let i = 1; i < members.length; i++) {
          await deleteDoc(doc(db, mitgliederCollection, members[i].id));
          deleted++;
        }
      }
    }
    
    console.log('Duplikat-Bereinigung abgeschlossen:', deleted, 'Duplikate gelöscht');
    return { deleted, remaining: snapshot.docs.length - deleted };
    
  } catch (error) {
    console.error('Fehler bei Duplikat-Bereinigung:', error);
    throw error;
  }
}