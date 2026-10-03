// src/app/api/access-requests/route.ts
// Einreichen eines Vereinszugang-Antrags durch einen eingeloggten Nutzer.
// Der Nutzer kann NUR einen Antrag für sich selbst (seine eigene uid) stellen.
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { verifyApiAuth } from '@/lib/auth/api-auth';

// Beantragbare Vereinsrollen (bewusst nur diese beiden – keine KV-/Plattform-Rollen).
const ERLAUBTE_ROLLEN = ['SPORTLEITER', 'MANNSCHAFTSFUEHRER'] as const;
type BeantragteRolle = (typeof ERLAUBTE_ROLLEN)[number];

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyApiAuth(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Anmeldung erforderlich' }, { status: 401 });
    }

    const body = await request.json();
    const clubId = typeof body.clubId === 'string' ? body.clubId.trim() : '';
    const requestedClubRole = body.requestedClubRole as BeantragteRolle;
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : '';

    if (!clubId) {
      return NextResponse.json({ error: 'Bitte einen Verein auswählen.' }, { status: 400 });
    }
    if (!ERLAUBTE_ROLLEN.includes(requestedClubRole)) {
      return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 });
    }

    const uid = authUser.uid;
    const email = authUser.email || '';

    // Verein serverseitig auflösen (Name wird für Admin-Liste/Mail mitgespeichert).
    const clubSnap = await adminDb.collection('clubs').doc(clubId).get();
    if (!clubSnap.exists) {
      return NextResponse.json({ error: 'Verein nicht gefunden.' }, { status: 400 });
    }
    const clubName = (clubSnap.data() as any)?.name || clubId;

    // Doppel-Antrag verhindern: existiert bereits ein offener Antrag dieses Nutzers?
    const offene = await adminDb
      .collection('access_requests')
      .where('uid', '==', uid)
      .where('status', '==', 'neu')
      .limit(1)
      .get();
    if (!offene.empty) {
      return NextResponse.json(
        { error: 'Es liegt bereits ein offener Antrag von dir vor. Bitte warte auf die Bearbeitung.' },
        { status: 409 }
      );
    }

    // Anzeigename aus dem Auth-Token (falls vorhanden) oder user_permissions.
    let displayName: string | null = (authUser as any).name || null;
    try {
      const permSnap = await adminDb.collection('user_permissions').doc(uid).get();
      if (permSnap.exists) displayName = displayName || (permSnap.data() as any)?.displayName || null;
    } catch {
      // optional – kein Blocker
    }

    const docRef = await adminDb.collection('access_requests').add({
      uid,
      email,
      displayName: displayName || null,
      clubId,
      clubName,
      requestedClubRole,
      message: message || null,
      status: 'neu',
      createdAt: new Date(),
    });

    // Benachrichtigung an den RWK-Leiter (wie bei Registrierung/Support).
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'RWK Einbeck <noreply@rwk-einbeck.de>',
        to: ['rwk-leiter-ksve@gmx.de'],
        subject: '🏆 Neuer Vereinszugang-Antrag',
        html: `
          <h2>Neuer Antrag auf Vereinszugang</h2>
          <p><strong>Name:</strong> ${displayName || 'Nicht angegeben'}</p>
          <p><strong>E-Mail:</strong> ${email}</p>
          <p><strong>Verein:</strong> ${clubName}</p>
          <p><strong>Gewünschte Rolle:</strong> ${requestedClubRole === 'SPORTLEITER' ? 'Sportleiter' : 'Mannschaftsführer'}</p>
          <p><strong>Begründung:</strong> ${message || '—'}</p>
          <hr>
          <p><small>Bearbeiten unter /admin/access-requests</small></p>
        `,
      });
    } catch (emailError) {
      logError('E-Mail-Benachrichtigung (Access-Request) fehlgeschlagen:', emailError);
      // Antrag ist gespeichert – Mail-Fehler nicht weiterwerfen.
    }

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    logError('Fehler beim Einreichen des Vereinszugang-Antrags:', error);
    return NextResponse.json({ error: 'Antrag konnte nicht gespeichert werden.' }, { status: 500 });
  }
}
