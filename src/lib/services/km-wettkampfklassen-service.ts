// src/lib/services/km-wettkampfklassen-service.ts
import { db } from '@/lib/firebase/config';
import { collection, addDoc } from 'firebase/firestore';

const WETTKAMPFKLASSEN_2026 = [
  { name: 'Schüler I m', minAlter: 12, maxAlter: 14, geschlecht: 'male' },
  { name: 'Schüler I w', minAlter: 12, maxAlter: 14, geschlecht: 'female' },
  { name: 'Jugend m', minAlter: 15, maxAlter: 18, geschlecht: 'male' },
  { name: 'Jugend w', minAlter: 15, maxAlter: 18, geschlecht: 'female' },
  { name: 'Junioren I m', minAlter: 19, maxAlter: 20, geschlecht: 'male' },
  { name: 'Junioren I w', minAlter: 19, maxAlter: 20, geschlecht: 'female' },
  { name: 'Junioren II m', minAlter: 21, maxAlter: 22, geschlecht: 'male' },
  { name: 'Junioren II w', minAlter: 21, maxAlter: 22, geschlecht: 'female' },
  { name: 'Herren I', minAlter: 23, maxAlter: 29, geschlecht: 'male' },
  { name: 'Damen I', minAlter: 23, maxAlter: 29, geschlecht: 'female' },
  { name: 'Herren II', minAlter: 30, maxAlter: 34, geschlecht: 'male' },
  { name: 'Damen II', minAlter: 30, maxAlter: 34, geschlecht: 'female' },
  { name: 'Herren III', minAlter: 35, maxAlter: 39, geschlecht: 'male' },
  { name: 'Damen III', minAlter: 35, maxAlter: 39, geschlecht: 'female' },
  { name: 'Herren IV', minAlter: 40, maxAlter: 44, geschlecht: 'male' },
  { name: 'Damen IV', minAlter: 40, maxAlter: 44, geschlecht: 'female' },
  { name: 'Herren V', minAlter: 45, maxAlter: 49, geschlecht: 'male' },
  { name: 'Damen V', minAlter: 45, maxAlter: 49, geschlecht: 'female' },
  { name: 'Senioren 0 m', minAlter: 50, maxAlter: 54, geschlecht: 'male' },
  { name: 'Seniorinnen 0', minAlter: 50, maxAlter: 54, geschlecht: 'female' },
  { name: 'Senioren I m', minAlter: 55, maxAlter: 59, geschlecht: 'male' },
  { name: 'Seniorinnen I', minAlter: 55, maxAlter: 59, geschlecht: 'female' },
  { name: 'Senioren II m', minAlter: 60, maxAlter: 64, geschlecht: 'male' },
  { name: 'Seniorinnen II', minAlter: 60, maxAlter: 64, geschlecht: 'female' },
  { name: 'Senioren III m', minAlter: 65, maxAlter: 69, geschlecht: 'male' },
  { name: 'Seniorinnen III', minAlter: 65, maxAlter: 69, geschlecht: 'female' },
  { name: 'Senioren IV m', minAlter: 70, maxAlter: 74, geschlecht: 'male' },
  { name: 'Seniorinnen IV', minAlter: 70, maxAlter: 74, geschlecht: 'female' },
  { name: 'Senioren V m', minAlter: 75, maxAlter: 79, geschlecht: 'male' },
  { name: 'Seniorinnen V', minAlter: 75, maxAlter: 79, geschlecht: 'female' }
];

export async function generateWettkampfklassen2026(): Promise<void> {
  const collectionRef = collection(db, 'km_wettkampfklassen');
  
  for (const klasse of WETTKAMPFKLASSEN_2026) {
    await addDoc(collectionRef, {
      ...klasse,
      saison: '2026',
      createdAt: new Date()
    });
  }
}
