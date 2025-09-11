import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getUserClubId, getClubCollection, CLUB_COLLECTIONS } from '@/lib/utils/club-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clubId: string; id: string } }
) {
  try {
    const body = await request.json();
    const { titel, typ, datum, ort, tagesordnung, anwesende, beschluesse, status } = body;

    // TODO: Auth-Validierung
    // const userClubId = await getUserClubId(request.auth.uid);
    // if (userClubId !== params.clubId) {
    //   return NextResponse.json({ success: false, error: 'Keine Berechtigung' }, { status: 403 });
    // }

    const collectionPath = getClubCollection(params.clubId, CLUB_COLLECTIONS.PROTOKOLLE);
    const docRef = doc(db, collectionPath, params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Protokoll nicht gefunden'
      }, { status: 404 });
    }

    const updateData: any = {
      aktualisiertAm: new Date()
    };

    if (titel !== undefined) updateData.titel = titel;
    if (typ !== undefined) updateData.typ = typ;
    if (datum !== undefined) updateData.datum = datum;
    if (ort !== undefined) updateData.ort = ort;
    if (tagesordnung !== undefined) updateData.tagesordnung = tagesordnung;
    if (anwesende !== undefined) updateData.anwesende = anwesende;
    if (beschluesse !== undefined) updateData.beschluesse = beschluesse;
    if (status !== undefined) updateData.status = status;

    await updateDoc(docRef, updateData);

    return NextResponse.json({
      success: true,
      message: 'Protokoll aktualisiert'
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
  { params }: { params: { clubId: string; id: string } }
) {
  try {
    // TODO: Auth-Validierung
    // const userClubId = await getUserClubId(request.auth.uid);
    // if (userClubId !== params.clubId) {
    //   return NextResponse.json({ success: false, error: 'Keine Berechtigung' }, { status: 403 });
    // }

    const collectionPath = getClubCollection(params.clubId, CLUB_COLLECTIONS.PROTOKOLLE);
    const docRef = doc(db, collectionPath, params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Protokoll nicht gefunden'
      }, { status: 404 });
    }

    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: 'Protokoll gelöscht'
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
  { params }: { params: { clubId: string; id: string } }
) {
  try {
    // TODO: Auth-Validierung
    // const userClubId = await getUserClubId(request.auth.uid);
    // if (userClubId !== params.clubId) {
    //   return NextResponse.json({ success: false, error: 'Keine Berechtigung' }, { status: 403 });
    // }

    const collectionPath = getClubCollection(params.clubId, CLUB_COLLECTIONS.PROTOKOLLE);
    const docRef = doc(db, collectionPath, params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Protokoll nicht gefunden'
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