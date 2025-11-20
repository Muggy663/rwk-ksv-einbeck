import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const KM_JAHRE_COLLECTION = 'km_jahre';
const KM_SAISONS_COLLECTION = 'km_saisons';

export async function POST(request: NextRequest) {
  try {
    // Lade alle bestehenden KM-Jahre
    const jahreSnapshot = await adminDb.collection(KM_JAHRE_COLLECTION).get();
    
    if (jahreSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'Keine KM-Jahre zum Migrieren gefunden'
      });
    }

    const batch = adminDb.batch();
    let migratedCount = 0;

    for (const doc of jahreSnapshot.docs) {
      const jahrData = doc.data();
      
      // Prüfe ob bereits migriert (falls Saison mit gleichem Jahr existiert)
      const existingQuery = await adminDb.collection(KM_SAISONS_COLLECTION)
        .where('jahr', '==', jahrData.jahr)
        .where('disziplinTyp', '==', 'KK')
        .get();
      
      if (!existingQuery.empty) {
        console.log(`Jahr ${jahrData.jahr} bereits als KK-Saison vorhanden, überspringe...`);
        continue;
      }

      // Migriere zu KK-Saison (da bisherige KM meist KK waren)
      const saisonData = {
        jahr: jahrData.jahr,
        disziplinTyp: 'KK',
        name: `KM ${jahrData.jahr} Kleinkaliber`,
        meldeschluss: jahrData.meldeschluss,
        status: jahrData.status || 'vorbereitung',
        beschreibung: jahrData.beschreibung || 'Migriert von KM-Jahr',
        erstelltAm: jahrData.erstelltAm || FieldValue.serverTimestamp(),
        aktualisiertAm: FieldValue.serverTimestamp(),
        migratedFrom: doc.id
      };

      const newSaisonRef = adminDb.collection(KM_SAISONS_COLLECTION).doc();
      batch.set(newSaisonRef, saisonData);
      migratedCount++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `${migratedCount} KM-Jahre erfolgreich zu KK-Saisons migriert`,
      migratedCount
    });

  } catch (error) {
    console.error('Fehler bei der Migration:', error);
    return NextResponse.json({
      success: false,
      error: `Migration fehlgeschlagen: ${error.message}`
    }, { status: 500 });
  }
}
