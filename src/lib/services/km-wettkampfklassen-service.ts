// src/lib/services/km-wettkampfklassen-service.ts
import { db } from '@/lib/firebase/config';
import { collection, writeBatch, doc } from 'firebase/firestore';

// Wettkampfklassen-Definitionen für 2026
const COMPETITION_CLASSES_2026 = [
  { name: 'Schüler I m', minAge: 12, maxAge: 14, gender: 'male' },
  { name: 'Schüler I w', minAge: 12, maxAge: 14, gender: 'female' },
  { name: 'Jugend m', minAge: 15, maxAge: 18, gender: 'male' },
  { name: 'Jugend w', minAge: 15, maxAge: 18, gender: 'female' },
  { name: 'Junioren I m', minAge: 19, maxAge: 20, gender: 'male' },
  { name: 'Junioren I w', minAge: 19, maxAge: 20, gender: 'female' },
  { name: 'Junioren II m', minAge: 21, maxAge: 22, gender: 'male' },
  { name: 'Junioren II w', minAge: 21, maxAge: 22, gender: 'female' },
  { name: 'Herren I', minAge: 23, maxAge: 29, gender: 'male' },
  { name: 'Damen I', minAge: 23, maxAge: 29, gender: 'female' },
  { name: 'Herren II', minAge: 30, maxAge: 34, gender: 'male' },
  { name: 'Damen II', minAge: 30, maxAge: 34, gender: 'female' },
  { name: 'Herren III', minAge: 35, maxAge: 39, gender: 'male' },
  { name: 'Damen III', minAge: 35, maxAge: 39, gender: 'female' },
  { name: 'Herren IV', minAge: 40, maxAge: 44, gender: 'male' },
  { name: 'Damen IV', minAge: 40, maxAge: 44, gender: 'female' },
  { name: 'Herren V', minAge: 45, maxAge: 49, gender: 'male' },
  { name: 'Damen V', minAge: 45, maxAge: 49, gender: 'female' },
  { name: 'Senioren 0 m', minAge: 50, maxAge: 54, gender: 'male' },
  { name: 'Seniorinnen 0', minAge: 50, maxAge: 54, gender: 'female' },
  { name: 'Senioren I m', minAge: 55, maxAge: 59, gender: 'male' },
  { name: 'Seniorinnen I', minAge: 55, maxAge: 59, gender: 'female' },
  { name: 'Senioren II m', minAge: 60, maxAge: 64, gender: 'male' },
  { name: 'Seniorinnen II', minAge: 60, maxAge: 64, gender: 'female' },
  { name: 'Senioren III m', minAge: 65, maxAge: 69, gender: 'male' },
  { name: 'Seniorinnen III', minAge: 65, maxAge: 69, gender: 'female' },
  { name: 'Senioren IV m', minAge: 70, maxAge: 74, gender: 'male' },
  { name: 'Seniorinnen IV', minAge: 70, maxAge: 74, gender: 'female' },
  { name: 'Senioren V m', minAge: 75, maxAge: 79, gender: 'male' },
  { name: 'Seniorinnen V', minAge: 75, maxAge: 79, gender: 'female' }
];

/**
 * Generiert und speichert Wettkampfklassen für die Saison 2026 in Firestore.
 * Erstellt alle Altersklassen mit entsprechenden Altersgrenzen und Geschlechtszuordnungen.
 * 
 * @throws {Error} Wenn das Speichern in Firestore fehlschlägt
 * @returns {Promise<void>}
 */
export async function generateWettkampfklassen2026(): Promise<void> {
  const collectionRef = collection(db, 'km_wettkampfklassen');
  const batch = writeBatch(db);
  const timestamp = new Date();
  
  COMPETITION_CLASSES_2026.forEach(competitionClass => {
    const docRef = doc(collectionRef);
    batch.set(docRef, {
      ...competitionClass,
      saison: '2026',
      createdAt: timestamp
    });
  });
  
  await batch.commit();
}
