import { NextRequest, NextResponse } from 'next/server';
import { logWarn } from '@/lib/utils/secure-logger';
import { verifyApiAuth } from '@/lib/auth/api-auth';
import { adminDb } from '@/lib/firebase/admin';

// Diese Route war ein einmaliger Datenbereinigungsfix.
// Die IDs-Liste ist bewusst leer – Löschoperationen nur noch über
// den Admin-Bereich in der UI oder direkt in der Firebase Console.
const IDS_TO_DELETE: string[] = [];

export async function POST(request: NextRequest) {
  // SuperAdmin-Authentifizierung erforderlich
  const user = await verifyApiAuth(request);
  if (!user) {
    logWarn('Unauthorized access attempt to bulk-delete', 'bulk-delete-api');
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Nur SuperAdmin darf diese Route nutzen
  if (user.email !== 'admin@rwk-einbeck.de') {
    logWarn(`Forbidden access attempt to bulk-delete by ${user.email}`, 'bulk-delete-api');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (IDS_TO_DELETE.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'Keine IDs zum Löschen konfiguriert.',
      results: []
    });
  }

  const results = [];
  for (const id of IDS_TO_DELETE) {
    try {
      await adminDb.collection('rwk_scores').doc(id).delete();
      results.push({ id, status: 'deleted' });
    } catch (error) {
      results.push({ id, status: 'error', error: (error as Error).message });
    }
  }

  return NextResponse.json({ results });
}
