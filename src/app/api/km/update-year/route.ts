// src/app/api/km/update-year/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {

    
    // Lade alle Meldungen
    const snapshot = await getDocs(collection(db, 'km_meldungen'));
    let updated = 0;
    let skipped = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // Nur updaten wenn jahr fehlt
      if (!data.jahr) {
        await updateDoc(doc(db, 'km_meldungen', docSnap.id), {
          jahr: 2026
        });
        updated++;

      } else {
        skipped++;

      }
    }
    

    
    return NextResponse.json({
      success: true,
      message: `${updated} Meldungen mit jahr: 2026 aktualisiert, ${skipped} übersprungen`,
      updated,
      skipped
    });

  } catch (error) {
    console.error('❌ Update error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
