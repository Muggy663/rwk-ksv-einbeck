import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meldungId, kmErgebnis } = body;
    
    if (!meldungId || !kmErgebnis) {
      return NextResponse.json({ success: false, error: 'Daten fehlen' }, { status: 400 });
    }
    
    // Direkt in km_meldungen_2026_kk suchen und updaten
    const docRef = adminDb.collection('km_meldungen_2026_kk').doc(meldungId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Meldung nicht gefunden' }, { status: 404 });
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
    return NextResponse.json({ success: true });
    
  } catch (error) {
    logError('Fehler beim Speichern:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}