// src/app/api/admin/access-requests/route.ts
// Admin-Aktion: einen Vereinszugang-Antrag genehmigen oder ablehnen.
// Nur für Admin-E-Mails zugelassen. Beim Genehmigen wird die Vereinsrolle über
// die zentrale setClubRole-Funktion in user_permissions geschrieben.
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { verifyApiAuth } from '@/lib/auth/api-auth';
import { setClubRole, type ClubRole } from '@/lib/auth/set-club-role';

// Admin-E-Mails (gleiche wie in requireKMAuth). Rechtevergabe nur hier erlaubt.
const ADMIN_EMAILS = ['admin@rwk-einbeck.de', 'stephanie.buenger@gmx.de'];

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyApiAuth(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Anmeldung erforderlich' }, { status: 401 });
    }
    const adminEmail = (authUser.email || '').toLowerCase();
    if (!ADMIN_EMAILS.includes(adminEmail)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const body = await request.json();
    const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
    const action = body.action as 'approve' | 'reject';
    const rejectReason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';

    if (!requestId || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
    }

    const reqRef = adminDb.collection('access_requests').doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) {
      return NextResponse.json({ error: 'Antrag nicht gefunden.' }, { status: 404 });
    }
    const antrag = reqSnap.data() as any;
    if (antrag.status !== 'neu') {
      return NextResponse.json({ error: 'Antrag wurde bereits bearbeitet.' }, { status: 409 });
    }

    if (action === 'approve') {
      // Rolle setzen (zentrale, mit dem Admin-Formular identische Schreib-Logik).
      await setClubRole({
        uid: antrag.uid,
        email: antrag.email,
        displayName: antrag.displayName ?? null,
        clubId: antrag.clubId,
        role: antrag.requestedClubRole as ClubRole,
      });
      await reqRef.set(
        { status: 'genehmigt', reviewedBy: adminEmail, reviewedAt: new Date() },
        { merge: true }
      );
    } else {
      await reqRef.set(
        {
          status: 'abgelehnt',
          reviewedBy: adminEmail,
          reviewedAt: new Date(),
          rejectReason: rejectReason || null,
        },
        { merge: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Fehler beim Bearbeiten des Vereinszugang-Antrags:', error);
    return NextResponse.json({ error: 'Antrag konnte nicht bearbeitet werden.' }, { status: 500 });
  }
}
