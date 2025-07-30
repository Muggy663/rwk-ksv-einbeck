// src/app/api/km/init-wettkampfklassen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const WETTKAMPFKLASSEN_2026 = [
  { name: 'Schüler I m', minAlter: 12, maxAlter: 14, geschlecht: 'male' },
  { name: 'Schüler I w', minAlter: 12, maxAlter: 14, geschlecht: 'female' },
  { name: 'Jugend m', minAlter: 15, maxAlter: 18, geschlecht: 'male' },
  { name: 'Jugend w', minAlter: 15, maxAlter: 18, geschlecht: 'female' },
  { name: 'Junioren I m', minAlter: 19, maxAlter: 20, geschlecht: 'male' },
  { name: 'Juniorinnen I', minAlter: 19, maxAlter: 20, geschlecht: 'female' },
  { name: 'Junioren II m', minAlter: 21, maxAlter: 22, geschlecht: 'male' },
  { name: 'Juniorinnen II', minAlter: 21, maxAlter: 22, geschlecht: 'female' },
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
  { name: 'Seniorinnen V', minAlter: 75, maxAlter: 79, geschlecht: 'female' },
  { name: 'Senioren VI m', minAlter: 80, maxAlter: 99, geschlecht: 'male' },
  { name: 'Seniorinnen VI', minAlter: 80, maxAlter: 99, geschlecht: 'female' }
];

async function generateWettkampfklassen2026() {
  const collectionRef = collection(db, 'km_wettkampfklassen');
  
  for (const klasse of WETTKAMPFKLASSEN_2026) {
    await addDoc(collectionRef, {
      ...klasse,
      saison: '2026',
      createdAt: new Date()
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Debug: Auth-Token prüfen
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    console.log('Starting wettkampfklassen generation...');
    const collectionRef = collection(db, 'km_wettkampfklassen');
    
    // Erst alle bestehenden Wettkampfklassen laden
    let existingSnapshot;
    try {
      existingSnapshot = await getDocs(collectionRef);
    } catch (e) {
      console.log('Collection does not exist yet, creating new one');
      existingSnapshot = { docs: [] };
    }
    const existingNames = new Set(
      existingSnapshot.docs.map(doc => doc.data().name)
    );
    
    for (const klasse of WETTKAMPFKLASSEN_2026) {
      // Nur hinzufügen wenn Name noch nicht existiert
      if (!existingNames.has(klasse.name)) {
        console.log('Adding class:', klasse.name);
        await addDoc(collectionRef, {
          ...klasse,
          saison: '2026',
          createdAt: new Date()
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Wettkampfklassen für 2026 erfolgreich initialisiert'
    });
  } catch (error) {
    console.error('Fehler beim Initialisieren der Wettkampfklassen:', error);
    
    return NextResponse.json({
      success: false,
      error: `Fehler beim Initialisieren der Wettkampfklassen: ${error.message}`,
      details: error.toString()
    }, { status: 500 });
  }
}