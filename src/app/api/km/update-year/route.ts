// src/app/api/km/update-year/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Lade alle Meldungen
    const snapshot = await adminDb.collection('km_meldungen').get();
    let updated = 0;
    let skipped = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // Nur updaten wenn jahr fehlt
      if (!data.jahr) {
        await docSnap.ref.update({
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