// src/app/api/km/fix-schuetze-links/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {

    
    // 1. Lade alle Meldungen und Schützen
    const [meldungenSnapshot, schuetzenSnapshot] = await Promise.all([
      getDocs(collection(db, 'km_meldungen')),
      getDocs(collection(db, 'rwk_shooters'))
    ]);
    
    const meldungen = meldungenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const schuetzen = schuetzenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    

    
    let fixed = 0;
    let notFound = 0;
    
    // 2. Prüfe jede Meldung
    for (const meldung of meldungen) {
      const existingSchuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
      
      if (!existingSchuetze) {

        
        // Versuche Schütze anhand anderer Kriterien zu finden
        // (z.B. wenn Name in der Meldung gespeichert ist)
        if (meldung.schuetzeName) {
          const foundSchuetze = schuetzen.find(s => 
            s.name && s.name.toLowerCase().includes(meldung.schuetzeName.toLowerCase())
          );
          
          if (foundSchuetze) {

            
            await updateDoc(doc(db, 'km_meldungen', meldung.id), {
              schuetzeId: foundSchuetze.id
            });
            fixed++;
          } else {

            notFound++;
          }
        } else {

          notFound++;
        }
      } else {

      }
    }
    

    
    return NextResponse.json({
      success: true,
      message: `${fixed} Verknüpfungen repariert, ${notFound} nicht gefunden`,
      fixed,
      notFound,
      totalMeldungen: meldungen.length
    });

  } catch (error) {
    console.error('❌ Fix error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
