import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { meldungIds, vonSaison, nachSaison } = await request.json();
    
    if (!meldungIds || !Array.isArray(meldungIds) || !vonSaison || !nachSaison) {
      return NextResponse.json({
        success: false,
        error: 'Fehlende Parameter'
      }, { status: 400 });
    }

    let verschobenCount = 0;
    const batch = adminDb.batch();

    // Lade alle zu verschiebenden Meldungen
    for (const meldungId of meldungIds) {
      try {
        // Versuche verschiedene Collection-Namen
        let alteMeldungRef = null;
        let alteMeldungDoc = null;
        
        // Mögliche Collection-Namen probieren
        const possibleCollections = [
          `km_meldungen_${vonSaison}`,
          `km_meldungen_2026_ld`,
          `km_meldungen_2026_kkp`, 
          `km_meldungen_2026_kk`,
          'km_meldungen'
        ];
        
        for (const collectionName of possibleCollections) {
          try {
            const testRef = adminDb.collection(collectionName).doc(meldungId);
            const testDoc = await testRef.get();
            if (testDoc.exists) {
              alteMeldungRef = testRef;
              alteMeldungDoc = testDoc;
              break;
            }
          } catch (e) {
            // Collection existiert nicht, weiter probieren
          }
        }
        
        if (!alteMeldungDoc || !alteMeldungDoc.exists) {
          logError(`Meldung ${meldungId} nicht gefunden in verfügbaren Collections`);
          continue;
        }

        const meldungData = alteMeldungDoc.data();
        
        // Ziel-Collection bestimmen
        const zielCollections = [
          `km_meldungen_${nachSaison}`,
          `km_meldungen_2026_ld`,
          `km_meldungen_2026_kkp`,
          `km_meldungen_2026_kk`
        ];
        
        let zielCollection = `km_meldungen_${nachSaison}`;
        // Wenn nachSaison eine spezifische Collection-ID ist, verwende sie direkt
        if (zielCollections.includes(nachSaison)) {
          zielCollection = nachSaison;
        }
        
        // SICHERHEIT: Erst erstellen, dann löschen!
        const neueMeldungRef = adminDb.collection(zielCollection).doc();
        
        // 1. ERST neue Meldung erstellen
        await neueMeldungRef.set({
          ...meldungData,
          saisonId: nachSaison,
          verschobenAm: new Date(),
          verschobenVon: vonSaison,
          urspruenglicheMeldungId: meldungId
        });
        
        // 2. NUR WENN ERFOLGREICH: Alte Meldung löschen
        await alteMeldungRef.delete();
        
        logInfo(`Meldung ${meldungId} erfolgreich von ${vonSaison} nach ${zielCollection} verschoben`);
        
        verschobenCount++;
        
      } catch (error) {
        logError(`Fehler beim Verschieben der Meldung ${meldungId}:`, error);
      }
    }

    // Batch nicht mehr nötig - einzelne Operationen sind sicherer
    
    logInfo(`${verschobenCount} Meldungen von ${vonSaison} nach ${nachSaison} verschoben`);

    return NextResponse.json({
      success: true,
      verschoben: verschobenCount,
      message: `${verschobenCount} Meldungen erfolgreich verschoben`
    });

  } catch (error) {
    logError('Fehler beim Verschieben der Meldungen:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}