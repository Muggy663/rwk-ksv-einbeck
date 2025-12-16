import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

const getKMMeldungenCollection = (jahr: number, disziplinKuerzel: string) => {
  const kuerzel = disziplinKuerzel.toLowerCase();
  // Mapping für die drei verfügbaren Collections
  if (kuerzel === 'kk' || kuerzel === 'kleinkaliber') return `km_meldungen_${jahr}_kk`;
  if (kuerzel === 'kkp' || kuerzel === 'kleinkaliberpistole') return `km_meldungen_${jahr}_kkp`;
  if (kuerzel === 'ld' || kuerzel === 'luftdruck') return `km_meldungen_${jahr}_ld`;
  return `km_meldungen_${jahr}_${kuerzel}`;
};

export async function POST(request: NextRequest) {
  try {
    const { meldungIds, vonSaison, nachSaison } = await request.json();
    
    if (!meldungIds || !Array.isArray(meldungIds) || !vonSaison || !nachSaison) {
      return NextResponse.json({
        success: false,
        error: 'Fehlende Parameter'
      }, { status: 400 });
    }

    // Hole Saison-Daten für Ziel-Collection
    const nachSaisonDoc = await adminDb.collection('km_saisons').doc(nachSaison).get();
    if (!nachSaisonDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Ziel-Saison nicht gefunden'
      }, { status: 400 });
    }

    const nachSaisonData = nachSaisonDoc.data();
    const zielJahr = nachSaisonData.jahr;
    const zielDisziplinTyp = nachSaisonData.disziplinTyp.toLowerCase();
    const zielCollection = getKMMeldungenCollection(zielJahr, zielDisziplinTyp);

    let verschobenCount = 0;

    // Lade alle zu verschiebenden Meldungen
    for (const meldungId of meldungIds) {
      try {
        // Versuche verschiedene Collection-Namen für Quell-Meldung
        let alteMeldungRef = null;
        let alteMeldungDoc = null;
        
        // Hole Quell-Saison-Daten für dynamische Collection-Namen
        const vonSaisonDoc = await adminDb.collection('km_saisons').doc(vonSaison).get();
        const quellJahr = vonSaisonDoc.exists ? vonSaisonDoc.data().jahr : 2026;
        
        // Mögliche Collection-Namen probieren (dynamisch basierend auf Jahr)
        const possibleCollections = [
          `km_meldungen_${quellJahr}_kk`,
          `km_meldungen_${quellJahr}_kkp`, 
          `km_meldungen_${quellJahr}_ld`
        ];
        
        for (const collectionName of possibleCollections) {
          try {
            const testRef = adminDb.collection(collectionName).doc(meldungId);
            const testDoc = await testRef.get();
            if (testDoc.exists) {
              alteMeldungRef = testRef;
              alteMeldungDoc = testDoc;
              logInfo(`Meldung ${meldungId} gefunden in Collection: ${collectionName}`);
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
        
        logInfo(`Neue Meldung erstellt in Collection: ${zielCollection}`);
        
        // 2. NUR WENN ERFOLGREICH: Alte Meldung löschen
        await alteMeldungRef.delete();
        
        logInfo(`Meldung ${meldungId} erfolgreich von ${alteMeldungRef.parent.id} nach ${zielCollection} verschoben`);
        
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