// src/app/api/km/mannschaften/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { schuetzenIds } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Mannschafts-ID fehlt'
      }, { status: 400 });
    }

    await updateDoc(doc(db, 'km_mannschaften', id), {
      schuetzenIds: schuetzenIds || [],
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Mannschaft erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Mannschaft:', error);
    return NextResponse.json({
      success: false,
      error: `Fehler: ${error.message}`
    }, { status: 500 });
  }
}