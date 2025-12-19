import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const backupDate = new Date('2025-12-19T00:22:36.000Z');
    console.log('🔍 Analysiere Meldungen nach Backup-Datum:', backupDate);
    
    const collections = ['km_meldungen_2026_ld', 'km_meldungen_2026_kkp'];
    const results = {};
    
    for (const collectionName of collections) {
      console.log(`\n📂 Analysiere ${collectionName}...`);
      const snapshot = await adminDb.collection(collectionName).get();
      
      let totalMeldungen = 0;
      let nachBackup = 0;
      let vorBackup = 0;
      let ohneTimestamp = 0;
      const nachBackupMeldungen = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        totalMeldungen++;
        
        // Prüfe verschiedene Timestamp-Felder
        let meldungsDatum = null;
        
        if (data.meldedatum?._seconds) {
          meldungsDatum = new Date(data.meldedatum._seconds * 1000);
        } else if (data.meldedatum?.seconds) {
          meldungsDatum = new Date(data.meldedatum.seconds * 1000);
        } else if (data.createdAt?._seconds) {
          meldungsDatum = new Date(data.createdAt._seconds * 1000);
        } else if (data.createdAt?.seconds) {
          meldungsDatum = new Date(data.createdAt.seconds * 1000);
        } else if (data.verschobenAm?._seconds) {
          meldungsDatum = new Date(data.verschobenAm._seconds * 1000);
        } else if (data.verschobenAm?.seconds) {
          meldungsDatum = new Date(data.verschobenAm.seconds * 1000);
        }
        
        if (meldungsDatum) {
          if (meldungsDatum > backupDate) {
            nachBackup++;
            nachBackupMeldungen.push({
              id: doc.id,
              datum: meldungsDatum.toISOString(),
              schuetzeId: data.schuetzeId,
              disziplinId: data.disziplinId,
              gemeldeteVon: data.gemeldeteVon
            });
          } else {
            vorBackup++;
          }
        } else {
          ohneTimestamp++;
        }
      });
      
      results[collectionName] = {
        total: totalMeldungen,
        vorBackup,
        nachBackup,
        ohneTimestamp,
        nachBackupMeldungen: nachBackupMeldungen.slice(0, 10) // Nur erste 10 zeigen
      };
      
      console.log(`   Total: ${totalMeldungen}`);
      console.log(`   Vor Backup (19.12.): ${vorBackup}`);
      console.log(`   Nach Backup: ${nachBackup}`);
      console.log(`   Ohne Timestamp: ${ohneTimestamp}`);
    }
    
    return NextResponse.json({
      success: true,
      backupDate: backupDate.toISOString(),
      results
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}