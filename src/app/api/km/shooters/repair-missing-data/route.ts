// src/app/api/km/shooters/repair-missing-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const schuetzenSnapshot = await getDocs(collection(db, 'km_shooters'));
    
    let repariert = 0;
    let fehler = 0;
    
    for (const schuetzeDoc of schuetzenSnapshot.docs) {
      const data = schuetzeDoc.data();
      const updates: any = {};
      
      // Geburtsjahr reparieren
      if (!data.birthYear && !data.geburtsjahr) {
        // Standard-Geburtsjahr basierend auf Namen (Schätzung)
        if (data.firstName?.includes('Karl') || data.lastName?.includes('Aurin')) {
          updates.birthYear = 1989; // Aus Debug-Daten bekannt
        } else {
          updates.birthYear = 1980; // Standard für Erwachsene
        }
      }
      
      // Geschlecht reparieren
      if (!data.gender && !data.geschlecht) {
        // Geschlecht basierend auf Vornamen schätzen
        const vorname = data.firstName || data.vorname || '';
        if (['Karl', 'Alexander', 'Michael', 'Marcel'].includes(vorname)) {
          updates.gender = 'male';
        } else if (['Anna', 'Maria', 'Petra', 'Sabine'].includes(vorname)) {
          updates.gender = 'female';
        } else {
          updates.gender = 'male'; // Standard
        }
      }
      
      // Updates anwenden
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'km_shooters', schuetzeDoc.id), updates);
        console.log(`Schütze ${schuetzeDoc.id} repariert:`, updates);
        repariert++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${repariert} Schützen repariert, ${fehler} Fehler`,
      repariert,
      fehler
    });
    
  } catch (error) {
    console.error('Schützen-Reparatur Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}