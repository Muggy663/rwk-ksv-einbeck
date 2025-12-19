import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    console.log('💾 Sichere die 13 neuen Meldungen...');
    
    const backupDate = new Date('2025-12-19T00:22:36.000Z');
    const newMeldungen = [];
    
    // Lade nur LD-Meldungen (KKP hatte keine neuen)
    const snapshot = await adminDb.collection('km_meldungen_2026_ld').get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Prüfe Datum
      let meldungsDatum = null;
      if (data.meldedatum?._seconds) {
        meldungsDatum = new Date(data.meldedatum._seconds * 1000);
      } else if (data.meldedatum?.seconds) {
        meldungsDatum = new Date(data.meldedatum.seconds * 1000);
      }
      
      if (meldungsDatum && meldungsDatum > backupDate) {
        newMeldungen.push({
          id: doc.id,
          data: data
        });
      }
    });
    
    console.log(`📋 ${newMeldungen.length} neue Meldungen gefunden`);
    
    return NextResponse.json({
      success: true,
      count: newMeldungen.length,
      meldungen: newMeldungen,
      message: `${newMeldungen.length} neue Meldungen gesichert. Jetzt kannst du das Backup wiederherstellen.`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}