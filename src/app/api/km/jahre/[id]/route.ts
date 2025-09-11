import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

const KM_JAHRE_COLLECTION = 'km_jahre';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, meldeschluss, beschreibung } = body;

    const updateData: any = {
      aktualisiertAm: new Date()
    };
    
    if (status !== undefined) updateData.status = status;
    if (meldeschluss !== undefined) updateData.meldeschluss = meldeschluss;
    if (beschreibung !== undefined) updateData.beschreibung = beschreibung;

    await updateDoc(doc(db, KM_JAHRE_COLLECTION, params.id), updateData);

    return NextResponse.json({
      success: true,
      message: 'KM-Jahr aktualisiert'
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren:', error);
    return NextResponse.json({
      success: false,
      error: 'Aktualisierung fehlgeschlagen'
    }, { status: 500 });
  }
}