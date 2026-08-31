import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { uid, email, displayName } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'UID und E-Mail sind erforderlich' },
        { status: 400 }
      );
    }

    await adminDb.collection('user_permissions').doc(uid).set({
      userType: 'INDIVIDUAL',
      email: email,
      displayName: displayName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      permissions: {
        schiessnachweis: true,
        rwk: false,
        km: false,
        admin: false
      },
      premium: {
        isActive: true,
        type: 'free_premium',
        startDate: new Date(),
        endDate: new Date('2099-12-31') // Läuft nie ab
      }
    });

    // Info-Mail über neue Registrierung senden
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: 'RWK Einbeck <noreply@rwk-einbeck.de>',
        to: ['rwk-leiter-ksve@gmx.de'],
        subject: '🎯 Neue Schießnachweis-Registrierung',
        html: `
          <h2>Neue Benutzer-Registrierung</h2>
          <p><strong>E-Mail:</strong> ${email}</p>
          <p><strong>Name:</strong> ${displayName || 'Nicht angegeben'}</p>
          <p><strong>User ID:</strong> ${uid}</p>
          <p><strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE')}</p>
          <p><strong>Berechtigung:</strong> Schießnachweis + Social Training</p>
          <hr>
          <p><small>Automatische Benachrichtigung vom RWK Einbeck System</small></p>
        `
      });
    } catch (emailError) {
      logError('E-Mail-Benachrichtigung fehlgeschlagen:', emailError);
      // Fehler nicht weiterwerfen - Registrierung soll trotzdem funktionieren
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Fehler beim Erstellen der user_permissions:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Benutzerberechtigungen' },
      { status: 500 }
    );
  }
}
