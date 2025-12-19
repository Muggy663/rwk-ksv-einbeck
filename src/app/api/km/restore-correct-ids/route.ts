import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Verwende vereinfachten Ansatz...');
    
    // Da wir nicht einfach auf die Backup-DB zugreifen können,
    // verwenden wir die Analyse-Daten um nur alte Meldungen zu reparieren
    const backupDate = new Date('2025-12-19T00:22:36.000Z');
    
    // Lade aktuelle Disziplinen für Mapping
    const disziplinenSnapshot = await adminDb.collection('km_disziplinen').get();
    const neueDisziplinen: { [key: string]: string } = {};
    
    disziplinenSnapshot.forEach(doc => {
      const data = doc.data();
      neueDisziplinen[data.spoNummer] = doc.id;
    });
    
    // Korrigiertes Mapping basierend auf der KM-Orga Seite
    const correctMapping: { [key: string]: string } = {
      'jLFdUgCC0uiVz5Y3Iyq1': neueDisziplinen['1.11'], // Lea Marie -> Luftgewehr Auflage
      'EsE10iGOZGh3EFoFiqq6': neueDisziplinen['11.11'], // Ayanna -> Faszination Lichtgewehr
      'Zlnqwo6I1KYyOzeO0CPU': neueDisziplinen['1.11'], // Luftgewehr Auflage
      // Weitere werden bei Bedarf ergänzt
    };
    
    const collections = ['km_meldungen_2026_ld', 'km_meldungen_2026_kkp'];
    let totalRestored = 0;
    let totalSkipped = 0;
    let unknownIds = new Set<string>();
    
    for (const collectionName of collections) {
      console.log(`\n📂 Verarbeite ${collectionName}...`);
      const snapshot = await adminDb.collection(collectionName).get();
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Prüfe ob Meldung nach Backup erstellt wurde (schützen!)
        let meldungsDatum = null;
        if (data.meldedatum?._seconds) {
          meldungsDatum = new Date(data.meldedatum._seconds * 1000);
        } else if (data.meldedatum?.seconds) {
          meldungsDatum = new Date(data.meldedatum.seconds * 1000);
        }
        
        if (meldungsDatum && meldungsDatum > backupDate) {
          console.log(`   ⚠️  Überspringe neue Meldung: ${doc.id}`);
          totalSkipped++;
          continue;
        }
        
        // Prüfe ob ID bereits korrekt ist
        if (Object.values(neueDisziplinen).includes(data.disziplinId)) {
          continue; // Bereits korrekt
        }
        
        // Suche Mapping
        const correctId = correctMapping[data.disziplinId];
        if (correctId) {
          await doc.ref.update({ disziplinId: correctId });
          console.log(`   ✅ ${doc.id}: ${data.disziplinId} -> ${correctId}`);
          totalRestored++;
        } else {
          unknownIds.add(data.disziplinId);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      restored: totalRestored,
      skipped: totalSkipped,
      unknownIds: Array.from(unknownIds),
      message: `${totalRestored} Meldungen repariert, ${totalSkipped} neue geschützt`
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}