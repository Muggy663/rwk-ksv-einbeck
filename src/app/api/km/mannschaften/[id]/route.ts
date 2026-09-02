// src/app/api/km/mannschaften/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logError, getErrorMessage } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { requireKMAuth } from '@/lib/auth/api-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { id } = await params;
    const body = await request.json();
    const { schuetzenIds } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Mannschafts-ID fehlt'
      }, { status: 400 });
    }

    await adminDb.collection('km_mannschaften').doc(id).update({
      schuetzenIds: schuetzenIds || [],
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Mannschaft erfolgreich aktualisiert'
    });

  } catch (error) {
    logError('Fehler beim Aktualisieren der Mannschaft:', error);
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Mannschafts-ID fehlt'
      }, { status: 400 });
    }

    await adminDb.collection('km_mannschaften').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Mannschaft erfolgreich gelöscht'
    });

  } catch (error) {
    logError('Fehler beim Löschen der Mannschaft:', error);
    return NextResponse.json({
      success: false,
      error: `Fehler: ${getErrorMessage(error)}`
    }, { status: 500 });
  }
}