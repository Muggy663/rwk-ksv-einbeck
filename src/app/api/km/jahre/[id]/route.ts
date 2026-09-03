import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireKMAuth } from '@/lib/auth/api-auth';

const KM_SAISONS_COLLECTION = 'km_saisons';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    ({ id } = await params);
    const body = await request.json();
    const { status, meldeschluss, beschreibung } = body;

    const updateData: any = {
      aktualisiertAm: FieldValue.serverTimestamp()
    };
    
    if (status !== undefined) updateData.status = status;
    if (meldeschluss !== undefined) updateData.meldeschluss = meldeschluss;
    if (beschreibung !== undefined) updateData.beschreibung = beschreibung;

    await adminDb.collection(KM_SAISONS_COLLECTION).doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'KM-Saison aktualisiert'
    });

  } catch (error) {
    logError('Fehler beim Aktualisieren der KM-Saison:', {
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({
      success: false,
      error: `Aktualisierung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}