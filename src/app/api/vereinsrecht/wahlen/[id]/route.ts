import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { titel, position, datum, kandidaten, wahlberechtigt, status, stimmen, gewinner } = body;

    const docRef = doc(db, 'vereinsrecht_wahlen', params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Wahl nicht gefunden'
      }, { status: 404 });
    }

    const updateData: any = {
      aktualisiertAm: new Date()
    };

    if (titel !== undefined) updateData.titel = titel;
    if (position !== undefined) updateData.position = position;
    if (datum !== undefined) updateData.datum = datum;
    if (kandidaten !== undefined) updateData.kandidaten = kandidaten;
    if (wahlberechtigt !== undefined) updateData.wahlberechtigt = parseInt(wahlberechtigt);
    if (status !== undefined) updateData.status = status;
    if (stimmen !== undefined) {
      updateData.stimmen = stimmen;
      // Berechne Gesamtstimmen
      const gesamtStimmen = Object.values(stimmen).reduce((sum: number, count: any) => sum + (count || 0), 0);
      updateData.abgegebeneStimmen = gesamtStimmen;
    }
    if (gewinner !== undefined) updateData.gewinner = gewinner;

    await updateDoc(docRef, updateData);

    return NextResponse.json({
      success: true,
      message: 'Wahl aktualisiert'
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren:', error);
    return NextResponse.json({
      success: false,
      error: 'Update fehlgeschlagen'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, 'vereinsrecht_wahlen', params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Wahl nicht gefunden'
      }, { status: 404 });
    }

    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: 'Wahl gelöscht'
    });

  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    return NextResponse.json({
      success: false,
      error: 'Löschen fehlgeschlagen'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, 'vereinsrecht_wahlen', params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Wahl nicht gefunden'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { id: docSnap.id, ...docSnap.data() }
    });

  } catch (error) {
    console.error('Fehler beim Laden:', error);
    return NextResponse.json({
      success: false,
      error: 'Laden fehlgeschlagen'
    }, { status: 500 });
  }
}