import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { getUserClubId, getClubCollection, CLUB_COLLECTIONS } from '@/lib/utils/club-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    console.log('POST /api/clubs/[clubId]/vereinsrecht/protokolle called');
    const body = await request.json();
    console.log('Request body:', body);
    const { titel, typ, datum, ort, tagesordnung, anwesende } = body;

    if (!titel || !typ || !datum) {
      return NextResponse.json({
        success: false,
        error: 'Titel, Typ und Datum sind erforderlich'
      }, { status: 400 });
    }

    // Auth-Validierung - Benutzer muss zu diesem Verein gehören
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Keine Authentifizierung' }, { status: 401 });
    }
    
    // TODO: JWT Token validieren und Club-ID prüfen
    // const userClubId = await getUserClubId(request.auth.uid);
    // if (userClubId !== params.clubId) {
    //   return NextResponse.json({ success: false, error: 'Keine Berechtigung' }, { status: 403 });
    // }

    const protokoll = {
      titel,
      typ,
      datum,
      ort: ort || '',
      tagesordnung: tagesordnung || [],
      anwesende: anwesende || [],
      beschluesse: [],
      status: 'Entwurf',
      clubId: params.clubId, // Redundant für Sicherheit
      erstelltAm: new Date(),
      erstelltVon: 'current-user', // TODO: Aus Auth holen
      aktualisiertAm: new Date()
    };

    console.log('Attempting to save to Firestore:', protokoll);
    const collectionPath = getClubCollection(params.clubId, CLUB_COLLECTIONS.PROTOKOLLE);
    const docRef = await addDoc(collection(db, collectionPath), protokoll);
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

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const typ = searchParams.get('typ');
    const jahr = searchParams.get('jahr');

    // TODO: Auth-Validierung
    // const userClubId = await getUserClubId(request.auth.uid);
    // if (userClubId !== params.clubId) {
    //   return NextResponse.json({ success: false, error: 'Keine Berechtigung' }, { status: 403 });
    // }

    const collectionPath = getClubCollection(params.clubId, CLUB_COLLECTIONS.PROTOKOLLE);
    let q = query(
      collection(db, collectionPath),
      orderBy('datum', 'desc')
    );

    if (typ) {
      q = query(
        collection(db, collectionPath),
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