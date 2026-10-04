// src/app/api/admin/user-actions/route.ts
// Gebündelte schreibende Admin-Aktionen für die Nutzer-Troubleshooting-Oberfläche.
// Nur für Administratoren. Jede Aktion wird im audit_logs protokolliert.
//
// Aktionen (action):
//   markVerified   -> E-Mail als bestätigt markieren (Auth emailVerified + Firestore emailVerifiedByAdmin)
//   resetPassword  -> Passwort-Zurücksetzen-Mail senden
//   disable        -> Konto sperren
//   enable         -> Konto entsperren
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/api-auth';
import { logError } from '@/lib/utils/secure-logger';

type Action = 'markVerified' | 'resetPassword' | 'disable' | 'enable';
const ERLAUBTE_AKTIONEN: Action[] = ['markVerified', 'resetPassword', 'disable', 'enable'];

async function schreibeAuditLog(params: {
  adminEmail: string;
  action: Action;
  targetUid: string;
  targetEmail: string;
}) {
  try {
    await adminDb.collection('audit_logs').add({
      userEmail: params.adminEmail,
      action: `user_${params.action}`,
      entity: 'user_account',
      entityId: params.targetUid,
      details: { targetEmail: params.targetEmail },
      timestamp: new Date(),
    });
  } catch (e) {
    // Audit-Fehler darf die eigentliche Aktion nicht blockieren.
    logError('Audit-Log (user-actions) fehlgeschlagen:', e);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let uid: string | undefined;
  let email: string | undefined;
  let action: Action | undefined;
  try {
    const body = await request.json();
    uid = body?.uid;
    email = body?.email;
    action = body?.action;
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  if (!uid || !action || !ERLAUBTE_AKTIONEN.includes(action)) {
    return NextResponse.json({ error: 'uid und gültige action sind erforderlich' }, { status: 400 });
  }

  // Sicherheitsnetz: Admin-Konten nicht aus Versehen selbst sperren.
  if (action === 'disable' && email && ['admin@rwk-einbeck.de', 'stephanie.buenger@gmx.de'].includes(email.toLowerCase())) {
    return NextResponse.json({ error: 'Admin-Konten können nicht gesperrt werden.' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'markVerified': {
        // BEIDE Ebenen: Firebase Auth + Firestore-Flag (genau der Joschka-Fall).
        await adminAuth.updateUser(uid, { emailVerified: true });
        await adminDb.collection('user_permissions').doc(uid).set(
          { emailVerifiedByAdmin: true, emailVerifiedAt: new Date() },
          { merge: true }
        );
        break;
      }
      case 'resetPassword': {
        if (!email) return NextResponse.json({ error: 'E-Mail für Passwort-Reset erforderlich' }, { status: 400 });
        const link = await adminAuth.generatePasswordResetLink(email);
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@rwk-einbeck.de',
          to: email,
          subject: 'Passwort zurücksetzen – RWK Einbeck',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
              <h2>Passwort zurücksetzen</h2>
              <p>Für dein Konto wurde ein Zurücksetzen des Passworts angefordert. Klicke auf den Button, um ein neues Passwort zu vergeben:</p>
              <div style="text-align:center;margin:30px 0;">
                <a href="${link}" style="background:#3b82f6;color:#fff;padding:12px 30px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Neues Passwort vergeben</a>
              </div>
              <p style="font-size:13px;color:#6b7280;">Falls der Button nicht geht:<br><a href="${link}" style="color:#3b82f6;word-break:break-all;">${link}</a></p>
            </div>
          `,
        });
        break;
      }
      case 'disable': {
        await adminAuth.updateUser(uid, { disabled: true });
        break;
      }
      case 'enable': {
        await adminAuth.updateUser(uid, { disabled: false });
        break;
      }
    }

    await schreibeAuditLog({ adminEmail: auth.email, action, targetUid: uid, targetEmail: email || '' });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logError(`user-actions (${action}) fehlgeschlagen:`, error);
    return NextResponse.json({ error: error.message || 'Aktion fehlgeschlagen' }, { status: 500 });
  }
}
