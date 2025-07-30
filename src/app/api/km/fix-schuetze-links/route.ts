// src/app/api/km/fix-schuetze-links/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing KM meldungen schuetze links...');
    
    // 1. Lade alle Meldungen und Schützen
    const [meldungenSnapshot, schuetzenSnapshot] = await Promise.all([
      getDocs(collection(db, 'km_meldungen')),
      getDocs(collection(db, 'rwk_shooters'))
    ]);
    
    const meldungen = meldungenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const schuetzen = schuetzenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 Gefunden: ${meldungen.length} Meldungen, ${schuetzen.length} Schützen`);
    
    let fixed = 0;
    let notFound = 0;
    
    // 2. Prüfe jede Meldung
    for (const meldung of meldungen) {
      const existingSchuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
      
      if (!existingSchuetze) {
        console.log(`❌ Schütze nicht gefunden für Meldung ${meldung.id}, schuetzeId: ${meldung.schuetzeId}`);
        
        // Versuche Schütze anhand anderer Kriterien zu finden
        // (z.B. wenn Name in der Meldung gespeichert ist)
        if (meldung.schuetzeName) {
          const foundSchuetze = schuetzen.find(s => 
            s.name && s.name.toLowerCase().includes(meldung.schuetzeName.toLowerCase())
          );
          
          if (foundSchuetze) {
            console.log(`✅ Repariere: ${meldung.schuetzeName} -> ${foundSchuetze.name} (${foundSchuetze.id})`);
            
            await updateDoc(doc(db, 'km_meldungen', meldung.id), {
              schuetzeId: foundSchuetze.id
            });
            fixed++;
          } else {
            console.log(`❌ Kein passender Schütze für "${meldung.schuetzeName}" gefunden`);
            notFound++;
          }
        } else {
          console.log(`❌ Keine schuetzeName in Meldung ${meldung.id} vorhanden`);
          notFound++;
        }
      } else {
        console.log(`✅ OK: ${existingSchuetze.name} (${existingSchuetze.id})`);
      }
    }
    
    console.log(`🎉 Reparatur abgeschlossen: ${fixed} repariert, ${notFound} nicht gefunden`);
    
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