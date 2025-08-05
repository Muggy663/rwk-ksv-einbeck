// Migration: Trennung RWK und KM Schützen
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const firebaseConfig = {
  // Config hier einfügen
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function migrateKMShooters() {
  console.log('🚀 Starte KM-Schützen Migration...');
  
  // 1. Alle rwk_shooters laden
  const shootersSnap = await getDocs(collection(db, 'rwk_shooters'));
  const batch = writeBatch(db);
  
  let kmCount = 0;
  let rwkCount = 0;
  
  shootersSnap.docs.forEach((docSnap) => {
    const shooter = docSnap.data();
    
    // KM-Schütze identifizieren
    if (shooter.kmClubId && !shooter.clubId) {
      // Nach km_shooters kopieren
      const kmShooterRef = doc(db, 'km_shooters', docSnap.id);
      batch.set(kmShooterRef, {
        firstName: shooter.firstName,
        lastName: shooter.lastName,
        title: shooter.title,
        name: shooter.name,
        kmClubId: shooter.kmClubId,
        gender: shooter.gender,
        birthYear: shooter.birthYear,
        mitgliedsnummer: shooter.mitgliedsnummer,
        isActive: shooter.isActive,
        createdAt: shooter.createdAt || new Date(),
        migratedAt: new Date(),
        migratedFrom: 'rwk_shooters'
      });
      kmCount++;
    } else if (shooter.clubId) {
      rwkCount++;
    }
  });
  
  // Migration ausführen
  await batch.commit();
  
  console.log(`✅ Migration abgeschlossen:`);
  console.log(`📊 KM-Schützen migriert: ${kmCount}`);
  console.log(`📊 RWK-Schützen verbleiben: ${rwkCount}`);
  
  return { kmCount, rwkCount };
}