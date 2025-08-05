// Migration ausführen - RWK/KM Trennung
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// Firebase Config aus .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function executeMigration() {
  console.log('🚀 Starte KM-Schützen Migration...');
  
  try {
    // 1. Alle rwk_shooters laden
    const shootersSnap = await getDocs(collection(db, 'rwk_shooters'));
    console.log(`📊 Gefunden: ${shootersSnap.docs.length} Schützen in rwk_shooters`);
    
    const batch = writeBatch(db);
    let kmCount = 0;
    let rwkCount = 0;
    let mixedCount = 0;
    
    shootersSnap.docs.forEach((docSnap) => {
      const shooter = docSnap.data();
      
      // KM-Schütze: hat kmClubId aber kein clubId
      if (shooter.kmClubId && !shooter.clubId) {
        const kmShooterRef = doc(db, 'km_shooters', docSnap.id);
        batch.set(kmShooterRef, {
          firstName: shooter.firstName || '',
          lastName: shooter.lastName || '',
          title: shooter.title || '',
          name: shooter.name || '',
          kmClubId: shooter.kmClubId,
          gender: shooter.gender || '',
          birthYear: shooter.birthYear || null,
          mitgliedsnummer: shooter.mitgliedsnummer || '',
          isActive: shooter.isActive !== false,
          genderGuessed: shooter.genderGuessed || false,
          createdAt: shooter.createdAt || new Date(),
          importedAt: shooter.importedAt || null,
          migratedAt: new Date(),
          migratedFrom: 'rwk_shooters'
        });
        kmCount++;
      } 
      // RWK-Schütze: hat clubId
      else if (shooter.clubId) {
        rwkCount++;
      }
      // Gemischt: hat beide IDs
      else if (shooter.kmClubId && shooter.clubId) {
        mixedCount++;
      }
    });
    
    // Migration ausführen
    console.log('💾 Schreibe km_shooters Collection...');
    await batch.commit();
    
    console.log('✅ Migration abgeschlossen!');
    console.log(`📊 KM-Schützen migriert: ${kmCount}`);
    console.log(`📊 RWK-Schützen verbleiben: ${rwkCount}`);
    console.log(`📊 Gemischte Einträge: ${mixedCount}`);
    
    return { kmCount, rwkCount, mixedCount };
    
  } catch (error) {
    console.error('❌ Migration fehlgeschlagen:', error);
    throw error;
  }
}

// Migration ausführen
executeMigration()
  .then(result => {
    console.log('🎉 Migration erfolgreich!', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Migration Fehler:', error);
    process.exit(1);
  });