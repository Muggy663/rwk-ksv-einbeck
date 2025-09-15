import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const KM_JAHRE_COLLECTION = 'km_jahre';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jahr, meldeschluss, status, beschreibung } = body;

    if (!jahr || !meldeschluss) {
      return NextResponse.json({
        success: false,
        error: 'Jahr und Meldeschluss sind erforderlich'
      }, { status: 400 });
    }

    const kmJahr = {
      jahr: parseInt(jahr),
      meldeschluss,
      status: status || 'vorbereitung',
      beschreibung: beschreibung || '',
      erstelltAm: FieldValue.serverTimestamp(),
      aktualisiertAm: FieldValue.serverTimestamp()
    };

    const docRef = await adminDb.collection(KM_JAHRE_COLLECTION).add(kmJahr);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...kmJahr },
      message: 'KM-Jahr erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Fehler beim Erstellen des KM-Jahres:', error);
    return NextResponse.json({
      success: false,
      error: `Fehler: ${error.message}`
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection(KM_JAHRE_COLLECTION)
      .orderBy('jahr', 'desc')
      .get();
    
    const jahre = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      data: jahre
    });

  } catch (error) {
    console.error('Fehler beim Laden der KM-Jahre:', error);
    return NextResponse.json({
      success: true,
      data: [],
      message: `Fehler beim Laden: ${error.message}`
    });
  }
}