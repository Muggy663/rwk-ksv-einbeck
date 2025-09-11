import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titel, position, datum, kandidaten, wahlberechtigt, beschreibung } = body;

    if (!titel || !position || !datum || !wahlberechtigt) {
      return NextResponse.json({
        success: false,
        error: 'Titel, Position, Datum und Anzahl Wahlberechtigte sind erforderlich'
      }, { status: 400 });
    }

    const wahl = {
      titel,
      position,
      datum,
      kandidaten: kandidaten || [],
      wahlberechtigt: parseInt(wahlberechtigt),
      abgegebeneStimmen: 0,
      stimmen: {}, // { kandidatName: anzahlStimmen }
      status: 'Geplant',
      beschreibung: beschreibung || '',
      gewinner: null,
      erstelltAm: new Date(),
      erstelltVon: 'current-user', // TODO: Aus Auth holen
      aktualisiertAm: new Date()
    };

    const docRef = await addDoc(collection(db, 'vereinsrecht_wahlen'), wahl);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...wahl },
      message: 'Wahl erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Fehler beim Erstellen der Wahl:', error);
    return NextResponse.json({
      success: false,
      error: `Fehler: ${error.message}`
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const jahr = searchParams.get('jahr');

    let q = query(
      collection(db, 'vereinsrecht_wahlen'),
      orderBy('datum', 'desc')
    );

    if (status) {
      q = query(
        collection(db, 'vereinsrecht_wahlen'),
        where('status', '==', status),
        orderBy('datum', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const wahlen = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Jahr-Filter client-seitig
    let filteredWahlen = wahlen;
    if (jahr) {
      filteredWahlen = wahlen.filter(w => {
        const wahlJahr = new Date(w.datum).getFullYear().toString();
        return wahlJahr === jahr;
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredWahlen
    });

  } catch (error) {
    console.error('Fehler beim Laden der Wahlen:', error);
    return NextResponse.json({
      success: true,
      data: [],
      message: `Fehler beim Laden: ${error.message}`
    });
  }
}