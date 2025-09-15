import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/vereinsrecht/protokolle called');
    const body = await request.json();
    console.log('Request body:', body);
    const { titel, typ, datum, ort, tagesordnung, anwesende } = body;

    if (!titel || !typ || !datum) {
      return NextResponse.json({
        success: false,
        error: 'Titel, Typ und Datum sind erforderlich'
      }, { status: 400 });
    }

    const protokoll = {
      titel,
      typ,
      datum,
      ort: ort || '',
      tagesordnung: tagesordnung || [],
      anwesende: anwesende || [],
      beschluesse: [],
      status: 'Entwurf',
      erstelltAm: FieldValue.serverTimestamp(),
      erstelltVon: 'current-user', // TODO: Aus Auth holen
      aktualisiertAm: FieldValue.serverTimestamp()
    };

    console.log('Attempting to save to Firestore:', protokoll);
    const docRef = await adminDb.collection('vereinsrecht_protokolle').add(protokoll);
    console.log('Successfully saved with ID:', docRef.id);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...protokoll },
      message: 'Protokoll erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Fehler beim Erstellen des Protokolls:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json({
      success: false,
      error: `Fehler: ${error.message}`,
      details: error.code || 'unknown',
      fullError: error.toString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typ = searchParams.get('typ');
    const jahr = searchParams.get('jahr');

    let query = adminDb.collection('vereinsrecht_protokolle').orderBy('datum', 'desc');

    if (typ) {
      query = adminDb.collection('vereinsrecht_protokolle')
        .where('typ', '==', typ)
        .orderBy('datum', 'desc');
    }

    const snapshot = await query.get();
    const protokolle = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Jahr-Filter client-seitig
    let filteredProtokolle = protokolle;
    if (jahr) {
      filteredProtokolle = protokolle.filter(p => {
        const protokollJahr = new Date(p.datum).getFullYear().toString();
        return protokollJahr === jahr;
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredProtokolle
    });

  } catch (error) {
    console.error('Fehler beim Laden der Protokolle:', error);
    return NextResponse.json({
      success: true,
      data: [],
      message: `Fehler beim Laden: ${error.message}`
    });
  }
}