// src/app/api/km/david21-import/route.ts
// API Route für David21 Ergebnis-Import

import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { David21Service } from '@/lib/services/david21-service';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const saisonId = formData.get('saisonId') as string;
    
    if (!file || !saisonId) {
      return NextResponse.json(
        { success: false, error: 'Datei und Saison erforderlich' },
        { status: 400 }
      );
    }

    const content = await file.text();
    const results = David21Service.parseResults(content);
    
    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keine gültigen Ergebnisse gefunden' },
        { status: 400 }
      );
    }

    // Saison-Collection ermitteln
    const saisonDoc = await adminDb.collection('km_saisons').doc(saisonId).get();
    if (!saisonDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Saison nicht gefunden' },
        { status: 404 }
      );
    }

    const collectionName = saisonDoc.data()?.collectionName;
    if (!collectionName) {
      return NextResponse.json(
        { success: false, error: 'Collection-Name fehlt in Saison' },
        { status: 400 }
      );
    }

    // Ergebnisse in Datenbank speichern
    const batch = adminDb.batch();
    const meldungenSnapshot = await adminDb.collection(collectionName).get();
    
    for (const result of results) {
      const meldung = meldungenSnapshot.docs.find(doc => 
        doc.data().startNummer === result.startNummer
      );
      
      if (meldung) {
        batch.update(meldung.ref, {
          ringe: result.ringe,
          zehntel: result.zehntel,
          innerZehner: result.innerZehner,
          schussDetails: result.schussDetails,
          importDatum: new Date().toISOString()
        });
      }
    }
    
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `${results.length} Ergebnisse importiert`,
      ergebnisse: results
    });

  } catch (error) {
    logError('David21 Import Error:', error);
    return NextResponse.json(
      { success: false, error: 'Import fehlgeschlagen' },
      { status: 500 }
    );
  }
}
