import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

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
      erstelltAm: new Date(),
      aktualisiertAm: new Date()
    };

    const docRef = await addDoc(collection(db, KM_JAHRE_COLLECTION), kmJahr);

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
    const q = query(
      collection(db, KM_JAHRE_COLLECTION),
      orderBy('jahr', 'desc')
    );
    
    const snapshot = await getDocs(q);
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