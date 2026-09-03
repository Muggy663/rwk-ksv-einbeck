// src/app/api/admin/audit-logs/delete/route.ts
// Löscht Audit-Logs bis zu einem Stichtag (z. B. vor Saisonbeginn).
// Nur für Administratoren. Läuft über das Admin-SDK.
import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { verifyApiAuth } from '@/lib/auth/api-auth';

const ADMIN_EMAILS = ['admin@rwk-einbeck.de', 'stephanie.buenger@gmx.de'];
const COLLECTION = 'audit_logs';

export async function POST(request: NextRequest) {
  try {
    // Authentifizierung: nur Admins dürfen löschen
    const user = await verifyApiAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const email = (user.email || '').toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ success: false, error: 'Nur Administratoren dürfen Audit-Logs löschen' }, { status: 403 });
    }

    const body = await request.json();
    const { beforeDate } = body as { beforeDate?: string };

    if (!beforeDate) {
      return NextResponse.json({ success: false, error: 'Stichtag (beforeDate) fehlt' }, { status: 400 });
    }

    const cutoff = new Date(beforeDate);
    if (isNaN(cutoff.getTime())) {
      return NextResponse.json({ success: false, error: 'Ungültiges Datum' }, { status: 400 });
    }

    // Alle Einträge älter als der Stichtag laden und in Batches löschen (max. 500 pro Batch)
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where('timestamp', '<', cutoff)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, deleted: 0, message: 'Keine Einträge vor dem Stichtag gefunden' });
    }

    let deleted = 0;
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = adminDb.batch();
      const chunk = docs.slice(i, i + 500);
      chunk.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      deleted += chunk.length;
    }

    logInfo(`Audit-Logs gelöscht: ${deleted} Einträge vor ${cutoff.toISOString()} (durch ${email})`);
    return NextResponse.json({ success: true, deleted, message: `${deleted} Einträge gelöscht` });
  } catch (error) {
    logError('Fehler beim Löschen der Audit-Logs:', error);
    return NextResponse.json({ success: false, error: 'Interner Fehler beim Löschen' }, { status: 500 });
  }
}
