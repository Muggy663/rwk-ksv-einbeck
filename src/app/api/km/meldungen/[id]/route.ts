import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/secure-logger';

// DELETE /api/km/meldungen/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Meldungs-ID fehlt' }, { status: 400 });
    }

    // Suche die Meldung in allen möglichen Collections
    const collections = ['km_meldungen_2026_kk', 'km_meldungen_2026_kkp', 'km_meldungen_2026_ld',
                         'km_meldungen_2027_kk', 'km_meldungen_2027_kkp', 'km_meldungen_2027_ld'];
    
    let deleted = false;
    for (const col of collections) {
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
