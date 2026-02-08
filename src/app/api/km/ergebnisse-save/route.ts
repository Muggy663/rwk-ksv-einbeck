import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meldungId, kmErgebnis, saisonId } = body;
    
    if (!meldungId || !kmErgebnis) {
      return NextResponse.json({ success: false, error: 'Daten fehlen' }, { status: 400 });
    }
    
    // Bestimme Collection basierend auf Saison
    let collectionName = 'km_meldungen';
    
    if (saisonId) {
      // Lade Saison-Info um Collection-Namen zu bestimmen
      const saisonDoc = await adminDb.collection('km_saisons').doc(saisonId).get();
      if (saisonDoc.exists) {
        const saisonData = saisonDoc.data();
        const saisonName = saisonData?.name || '';
        
        // Bestimme Collection basierend auf Saison-Namen
        if (saisonName.includes('Luftdruck')) {
          collectionName = 'km_meldungen_2026_ld';
        } else if (saisonName.includes('Kleinkaliber Pistole')) {
          collectionName = 'km_meldungen_2026_kkp';
        } else if (saisonName.includes('Kleinkaliber')) {
          collectionName = 'km_meldungen_2026_kk';
        }
      }
    }
    
    // Suche in der ermittelten Collection
    const docRef = adminDb.collection(collectionName).doc(meldungId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: `Meldung nicht gefunden in ${collectionName}` }, { status: 404 });
    }
    
    // Serien als separate String-Felder
    const updateData = {
      kmRinge: kmErgebnis.ringe
    };
    
    if (kmErgebnis.serien && kmErgebnis.serien.length > 0) {
      kmErgebnis.serien.forEach((serie, index) => {
        updateData[`kmSerie${index + 1}`] = serie.join(',');
      });
    }
    
    await docRef.update(updateData);
    return NextResponse.json({ success: true, collection: collectionName });
    
  } catch (error) {
    logError('Fehler beim Speichern:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}