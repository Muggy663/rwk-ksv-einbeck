// src/app/api/km/meldungen/repair/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Alle Meldungen und Disziplinen laden
    const [meldungenSnapshot, disziplinenSnapshot] = await Promise.all([
      getDocs(collection(db, 'km_meldungen')),
      getDocs(collection(db, 'km_disziplinen'))
    ]);
    
    // Disziplinen-Map erstellen (Name -> ID)
    const disziplinenMap = new Map();
    disziplinenSnapshot.docs.forEach(doc => {
      const data = doc.data();
      disziplinenMap.set(data.name, doc.id);
    });
    
    console.log('Verfügbare Disziplinen:', Array.from(disziplinenMap.keys()));
    
    let repariert = 0;
    let fehler = 0;
    
    // Alle Meldungen prüfen und reparieren
    for (const meldungDoc of meldungenSnapshot.docs) {
      const meldungData = meldungDoc.data();
      const aktuelleId = meldungData.disziplinId;
      
      // Prüfe ob disziplinId existiert
      const existiert = disziplinenSnapshot.docs.some(d => d.id === aktuelleId);
      
      if (!existiert) {
        // Versuche Disziplin anhand des Namens zu finden
        // Annahme: Die Meldung war für "Luftgewehr" (häufigste Disziplin)
        const neueId = disziplinenMap.get('Luftgewehr');
        
        if (neueId) {
          await updateDoc(doc(db, 'km_meldungen', meldungDoc.id), {
            disziplinId: neueId
          });
          console.log(`Meldung ${meldungDoc.id}: ${aktuelleId} -> ${neueId}`);
          repariert++;
        } else {
          console.error(`Keine Luftgewehr-Disziplin gefunden für Meldung ${meldungDoc.id}`);
          fehler++;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${repariert} Meldungen repariert, ${fehler} Fehler`,
      repariert,
      fehler
    });
    
  } catch (error) {
    console.error('Reparatur-Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}