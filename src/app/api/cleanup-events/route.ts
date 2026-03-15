import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/secure-logger';

export async function GET() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const snapshot = await adminDb.collection('events')
      .where('date', '<', cutoff)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ deleted: 0 });
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    logInfo(`Auto-Cleanup: ${snapshot.size} abgelaufene Termine gelöscht`, 'cleanup-events');
    return NextResponse.json({ deleted: snapshot.size });
  } catch (error) {
    logError('Fehler beim Cleanup der Termine:', error);
    return NextResponse.json({ error: 'Cleanup fehlgeschlagen' }, { status: 500 });
  }
}
