// Migration: Trennung RWK und KM Schützen
import { initializeApp } from 'firebase/app';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('Firebase configuration is missing required fields');
}

const app = initializeApp(firebaseConfig);
const databaseId = process.env.FIREBASE_DATABASE_ID || 'restored-main';
const db = getFirestore(app, databaseId);

export async function migrateKMShooters() {
  try {
    // 1. Alle shooters laden
    const shootersSnap = await getDocs(collection(db, 'shooters'));
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
          migratedFrom: 'shooters'
        });
        kmCount++;
      } else if (shooter.clubId) {
        rwkCount++;
      }
    });
    
    // Migration ausführen
    await batch.commit();
    
    return { kmCount, rwkCount };
  } catch (error) {
    logError('KM shooter migration failed:', error);
    throw new Error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
