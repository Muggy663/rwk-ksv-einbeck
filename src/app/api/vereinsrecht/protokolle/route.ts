import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';

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
      erstelltAm: new Date(),
      erstelltVon: 'current-user', // TODO: Aus Auth holen
      aktualisiertAm: new Date()
    };

    console.log('Attempting to save to Firestore:', protokoll);
    const docRef = await addDoc(collection(db, 'vereinsrecht_protokolle'), protokoll);
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

    let q = query(
      collection(db, 'vereinsrecht_protokolle'),
      orderBy('datum', 'desc')
    );

    if (typ) {
      q = query(
        collection(db, 'vereinsrecht_protokolle'),
        where('typ', '==', typ),
        orderBy('datum', 'desc')
      );
    }

    const snapshot = await getDocs(q);
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