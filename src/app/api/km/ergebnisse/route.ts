import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection('km_vm_ergebnisse').get();
    const ergebnisse = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      data: ergebnisse
    });
  } catch (error) {
    console.error('Fehler beim Laden der KM-Ergebnisse:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Prüfe ob bereits ein Ergebnis existiert
    const existingQuery = await adminDb.collection('km_vm_ergebnisse')
      .where('meldung_id', '==', body.meldung_id)
      .get();
    
    const ergebnisData = {
      ...body,
      eingegeben_am: FieldValue.serverTimestamp()
    };
    
    let created = false;
    if (existingQuery.empty) {
      // Neuen Eintrag erstellen
      await adminDb.collection('km_vm_ergebnisse').add(ergebnisData);
      created = true;
    } else {
      // Bestehenden Eintrag aktualisieren
      const docId = existingQuery.docs[0].id;
      await adminDb.collection('km_vm_ergebnisse').doc(docId).update(ergebnisData);
    }
    
    return NextResponse.json({
      success: true,
      created
    });
  } catch (error) {
    console.error('Fehler beim Speichern des KM-Ergebnisses:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
