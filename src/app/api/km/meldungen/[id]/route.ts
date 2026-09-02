import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/secure-logger';
import { requireKMAuth } from '@/lib/auth/api-auth';

// Alle möglichen Collections, in denen eine Meldung liegen kann
const MELDUNGEN_COLLECTIONS = [
  'km_meldungen_2026_kk', 'km_meldungen_2026_kkp', 'km_meldungen_2026_ld',
  'km_meldungen_2027_kk', 'km_meldungen_2027_kkp', 'km_meldungen_2027_ld'
];

// PUT /api/km/meldungen/[id] — bestehende Meldung bearbeiten
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
    if (!id) {
      return NextResponse.json({ success: false, error: 'Meldungs-ID fehlt' }, { status: 400 });
    }

    const body = await request.json();
    const { lmTeilnahme, anmerkung, vmErgebnis } = body;

    // Nur definierte Felder übernehmen, damit nichts versehentlich gelöscht wird
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (lmTeilnahme !== undefined) updateData.lmTeilnahme = !!lmTeilnahme;
    if (anmerkung !== undefined) updateData.anmerkung = anmerkung || '';
    if (vmErgebnis !== undefined) updateData.vmErgebnis = vmErgebnis || null;

    // Meldung in allen möglichen Collections suchen und aktualisieren
    for (const col of MELDUNGEN_COLLECTIONS) {
      try {
        const docRef = adminDb.collection(col).doc(id);
        const doc = await docRef.get();
        if (doc.exists) {
          await docRef.update(updateData);
          logInfo(`Meldung ${id} in ${col} aktualisiert`);
          return NextResponse.json({ success: true, message: 'Meldung aktualisiert' });
        }
      } catch {
        // Collection existiert nicht, weiter
      }
    }

    return NextResponse.json({ success: false, error: 'Meldung nicht gefunden' }, { status: 404 });
  } catch (error) {
    logError('Fehler beim Aktualisieren der Meldung:', error);
    return NextResponse.json({ success: false, error: 'Interner Fehler' }, { status: 500 });
  }
}

// DELETE /api/km/meldungen/[id]
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
      return NextResponse.json({ success: false, error: 'Meldungs-ID fehlt' }, { status: 400 });
    }

    // Suche die Meldung in allen möglichen Collections
    let deleted = false;
    for (const col of MELDUNGEN_COLLECTIONS) {
      try {
        const docRef = adminDb.collection(col).doc(id);
        const doc = await docRef.get();
        if (doc.exists) {
          await docRef.delete();
          logInfo(`Meldung ${id} aus ${col} gelöscht`);
          deleted = true;
          break;
        }
      } catch {
        // Collection existiert nicht, weiter
      }
    }

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Meldung nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Meldung gelöscht' });
  } catch (error) {
    logError('Fehler beim Löschen der Meldung:', error);
    return NextResponse.json({ success: false, error: 'Interner Fehler' }, { status: 500 });
  }
}
