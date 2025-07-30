// src/app/api/km/meldungen/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';

const KM_MELDUNGEN_COLLECTION = 'km_meldungen';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Meldungs-ID erforderlich'
      }, { status: 400 });
    }

    await deleteDoc(doc(db, KM_MELDUNGEN_COLLECTION, id));

    return NextResponse.json({
      success: true,
      message: 'Meldung erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Fehler beim Löschen der Meldung:', error);
    return NextResponse.json({
      success: false,
      error: `Fehler: ${error.message}`
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { lmTeilnahme, anmerkung, vmErgebnis } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Meldungs-ID erforderlich'
      }, { status: 400 });
    }

    const updateData: any = {
      lmTeilnahme: !!lmTeilnahme,
      anmerkung: anmerkung || '',
      updatedAt: new Date()
    };
    
    if (vmErgebnis) {
      updateData.vmErgebnis = {
        ringe: vmErgebnis.ringe,
        datum: new Date(vmErgebnis.datum),
        bemerkung: vmErgebnis.bemerkung || ''
      };
    }

    await updateDoc(doc(db, KM_MELDUNGEN_COLLECTION, id), updateData);

    return NextResponse.json({
      success: true,
      message: 'Meldung erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Meldung:', error);
    return NextResponse.json({
      success: false,
      error: `Fehler: ${error.message}`
    }, { status: 500 });
  }
}