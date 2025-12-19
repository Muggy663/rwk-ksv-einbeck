import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starte Disziplin-ID Reparatur...');
    
    // Lade neue Disziplinen
    const disziplinenSnapshot = await adminDb.collection('km_disziplinen').get();
    const neueDisziplinen: { [key: string]: string } = {};
    
    disziplinenSnapshot.forEach(doc => {
      const data = doc.data();
      neueDisziplinen[data.spoNummer] = doc.id;
    });
    
    // Manuelles Mapping der häufigsten alten IDs
    const oldToNew: { [key: string]: string } = {
      'jLFdUgCC0uiVz5Y3Iyq1': neueDisziplinen['1.41'], // KK-Gewehr Auflage 50m
      'EsE10iGOZGh3EFoFiqq6': neueDisziplinen['11.11'], // Faszination Lichtgewehr (war falsch auf 11.10)  
      'Zlnqwo6I1KYyOzeO0CPU': neueDisziplinen['1.11'], // Luftgewehr Auflage
      'IVcGnUmdWUIBpBiLAIhu': neueDisziplinen['1.10'], // Luftgewehr
      'BLI6Jnatg7sZQUDKi8gJ': neueDisziplinen['2.10'], // Luftpistole
      '5WN9OomgTkDqatb5ieC2': neueDisziplinen['1.42'], // KK Gewehr 30 Schuss
      'uP57j9xnYi3lL0MUBPzZ': neueDisziplinen['2.11'], // Luftpistole Auflage
      'ttCzOt2AorYPoxahDvLj': neueDisziplinen['11.50'], // Lichtpistole
      'zBXMDsVZkxZdELRID66m': neueDisziplinen['1.30'], // Zimmerstutzen
      'wr0iOQ7Gh2f6VcrvIA8L': neueDisziplinen['1.31'], // Zimmerstutzen Auflage
      '5SvAZBol6sCqcmIOHdm1': neueDisziplinen['12.10'], // Blasrohr
      'c0lZPKLMkZJPe3AVk6ZC': neueDisziplinen['1.80'], // KK Liegendkampf
      'YOsD4qgXUFIaBEVgcZAz': neueDisziplinen['2.20'], // 50m Pistole
      'IbPiUbeXR9tunXdAkIIV': neueDisziplinen['1.60'], // KK 3x40
    };
    
    const collections = ['km_meldungen_2026_ld', 'km_meldungen_2026_kk', 'km_meldungen_2026_kkp'];
    let totalFixed = 0;
    let totalUnknown = 0;
    const unknownIds = new Set<string>();
    
    for (const collectionName of collections) {
      console.log(`📂 Verarbeite ${collectionName}...`);
      const snapshot = await adminDb.collection(collectionName).get();
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const oldId = data.disziplinId;
        
        // Prüfe ob bereits korrekt
        if (Object.values(neueDisziplinen).includes(oldId)) continue;
        
        // Suche Mapping
        const newId = oldToNew[oldId];
        if (newId) {
          await doc.ref.update({ disziplinId: newId });
          console.log(`✅ ${oldId} -> ${newId}`);
          totalFixed++;
        } else {
          unknownIds.add(oldId);
          totalUnknown++;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      fixed: totalFixed,
      unknown: totalUnknown,
      unknownIds: Array.from(unknownIds),
      message: `${totalFixed} Meldungen repariert, ${totalUnknown} unbekannte IDs gefunden`
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}