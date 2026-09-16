// src/app/api/admin/delete-user/route.ts
// Vollständiges Löschen eines Benutzers durch den Admin:
//  - user_permissions/{uid}        (App-Berechtigungen)
//  - km_user_permissions/{uid}     (falls vorhanden)
//  - email_contacts (Einträge mit passender E-Mail)   -> saubere Verteilerliste
//  - Firebase-Authentication-Account (damit kein Wieder-Login/Neu-Anlage)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { verifyApiAuth } from '@/lib/auth/api-auth';
import { logError, logInfo } from '@/lib/utils/secure-logger';

const ADMIN_EMAIL = 'admin@rwk-einbeck.de';

export async function POST(request: NextRequest) {
  const user = await verifyApiAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if ((user.email || '').toLowerCase() !== ADMIN_EMAIL) {
    logError(`Unerlaubter delete-user-Versuch durch ${user.email}`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let uid: string | undefined;
  let email: string | undefined;
  try {
    const body = await request.json();
    uid = body?.uid;
    email = body?.email;
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  if (!uid) {
    return NextResponse.json({ error: 'uid ist erforderlich' }, { status: 400 });
  }

  const entfernt: string[] = [];

  // 1. App-Berechtigungen löschen
  try {
    await adminDb.collection('user_permissions').doc(uid).delete();
    entfernt.push('user_permissions');
  } catch (e) {
    logError(`delete-user: user_permissions (${uid}) fehlgeschlagen`, e);
  }

  // 2. KM-Berechtigungen löschen (falls vorhanden)
  try {
    const kmRef = adminDb.collection('km_user_permissions').doc(uid);
    if ((await kmRef.get()).exists) {
      await kmRef.delete();
      entfernt.push('km_user_permissions');
    }
  } catch (e) {
    logError(`delete-user: km_user_permissions (${uid}) fehlgeschlagen`, e);
  }

  // 3. Passende E-Mail-Kontakte aus der Verteilerliste entfernen
  if (email) {
    try {
      const snap = await adminDb
        .collection('email_contacts')
        .where('email', '==', email)
        .get();
      for (const d of snap.docs) {
        await d.ref.delete();
        entfernt.push('email_contacts');
      }
    } catch (e) {
      logError(`delete-user: email_contacts (${email}) fehlgeschlagen`, e);
    }
  }

  // 4. Firebase-Authentication-Account löschen (endgültig)
  let authGeloescht = false;
  try {
    await adminAuth.deleteUser(uid);
    authGeloescht = true;
    entfernt.push('auth');
  } catch (e: any) {
    // auth/user-not-found ist okay (Account war schon weg)
    if (e?.errorInfo?.code !== 'auth/user-not-found' && e?.code !== 'auth/user-not-found') {
      logError(`delete-user: Auth-Account (${uid}) fehlgeschlagen`, e);
    } else {
      authGeloescht = true; // nicht mehr vorhanden = Ziel erreicht
    }
  }

  logInfo(`Benutzer vollständig gelöscht: ${email || uid} (entfernt: ${entfernt.join(', ') || 'nichts'})`);

  return NextResponse.json({ success: true, authDeleted: authGeloescht, removed: entfernt });
}
