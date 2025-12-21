import { NextRequest, NextResponse } from 'next/server';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      meldung_id, 
      ergebnis_ringe, 
      ergebnis_teiler = 0, 
      serien = [], 
      platz_disziplin = 0, 
      platz_altersklasse = 0,
      eingegeben_von = 'km-admin',
      saisonId
    } = body;

    if (!meldung_id || !ergebnis_ringe || !saisonId) {
      return NextResponse.json({
        success: false,
        error: 'Meldung-ID, Ergebnis und Saison sind erforderlich'
      }, { status: 400 });
    }

    // Hole Saison-Daten für Collection-Namen
    const saisonDoc = await adminDb.collection('km_saisons').doc(saisonId).get();
    if (!saisonDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Saison nicht gefunden'
      }, { status: 400 });
    }

    const saisonData = saisonDoc.data();
    const saisonJahr = saisonData.jahr || 2026;
    
    // Collection-Name basierend auf Saison
    let collectionName;
    if (saisonData.name?.includes('Luftdruckgewehr') || saisonData.name?.includes('Luftdruck')) {
      collectionName = `km_ergebnisse_${saisonJahr}_ld`;
    } else if (saisonData.name?.includes('Kleinkaliber Pistole')) {
      collectionName = `km_ergebnisse_${saisonJahr}_kkp`;
    } else if (saisonData.name?.includes('Kleinkaliber')) {
      collectionName = `km_ergebnisse_${saisonJahr}_kk`;
    } else {
      collectionName = `km_ergebnisse_${saisonJahr}`;
    }

    // Prüfe ob Ergebnis bereits existiert
    const existingSnapshot = await adminDb.collection(collectionName)
      .where('meldung_id', '==', meldung_id)
      .get();

    const ergebnisData = {
      meldung_id,
      saisonId,
      ergebnis_ringe: parseInt(ergebnis_ringe),
      ergebnis_teiler: parseInt(ergebnis_teiler),
      serien,
      platz_disziplin: parseInt(platz_disziplin),
      platz_altersklasse: parseInt(platz_altersklasse),
      eingegeben_am: FieldValue.serverTimestamp(),
      eingegeben_von
    };

    let created = false;
    if (existingSnapshot.empty) {
      // Neues Ergebnis erstellen
      await adminDb.collection(collectionName).add(ergebnisData);
      created = true;
    } else {
      // Bestehendes Ergebnis aktualisieren
      const docId = existingSnapshot.docs[0].id;
      await adminDb.collection(collectionName).doc(docId).update(ergebnisData);
    }

    logDebug('✅ Ergebnis gespeichert:', { collectionName, meldung_id, created });

    return NextResponse.json({
      success: true,
      created,
      message: created ? 'Ergebnis erstellt' : 'Ergebnis aktualisiert'
    });

  } catch (error) {
    logError('Fehler beim Speichern des KM-Ergebnisses:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saisonId = searchParams.get('saison');
    
    if (!saisonId) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Hole Saison-Daten
    const saisonDoc = await adminDb.collection('km_saisons').doc(saisonId).get();
    if (!saisonDoc.exists) {
      return NextResponse.json({ success: true, data: [] });
    }

    const saisonData = saisonDoc.data();
    const saisonJahr = saisonData.jahr || 2026;
    
    // Collection-Name basierend auf Saison
    let collectionName;
    if (saisonData.name?.includes('Luftdruckgewehr') || saisonData.name?.includes('Luftdruck')) {
      collectionName = `km_ergebnisse_${saisonJahr}_ld`;
    } else if (saisonData.name?.includes('Kleinkaliber Pistole')) {
      collectionName = `km_ergebnisse_${saisonJahr}_kkp`;
    } else if (saisonData.name?.includes('Kleinkaliber')) {
      collectionName = `km_ergebnisse_${saisonJahr}_kk`;
    } else {
      collectionName = `km_ergebnisse_${saisonJahr}`;
    }

    const snapshot = await adminDb.collection(collectionName).get();
    const ergebnisse = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    logDebug('🔍 Ergebnisse geladen:', { collectionName, anzahl: ergebnisse.length });

    return NextResponse.json({
      success: true,
      data: ergebnisse
    });

  } catch (error) {
    logError('Fehler beim Laden der KM-Ergebnisse:', error);
    return NextResponse.json({
      success: true,
      data: []
    });
  }
}