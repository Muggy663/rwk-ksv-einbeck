import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-Mail ist erforderlich' }, { status: 400 });
    }

    const verificationLink = await adminAuth.generateEmailVerificationLink(email);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@rwk-einbeck.de',
      to: email,
      subject: 'E-Mail bestätigen – RWK Einbeck',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #1f2937;">E-Mail-Adresse bestätigen</h2>
          <p>Ihr Bestätigungslink wurde neu angefordert. Bitte klicken Sie auf den Button, um Ihre E-Mail-Adresse zu bestätigen:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              E-Mail bestätigen
            </a>
          </div>
          <p style="font-size: 13px; color: #6b7280;">
            Falls der Button nicht funktioniert:<br>
            <a href="${verificationLink}" style="color: #3b82f6; word-break: break-all;">${verificationLink}</a>
          </p>
          <p style="font-size: 13px; color: #6b7280;">
            Bitte auch den <strong>Spam-Ordner</strong> prüfen.<br><br>
            Bei Fragen: <a href="mailto:rwk-leiter-ksve@gmx.de">rwk-leiter-ksve@gmx.de</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Fehler beim Senden' }, { status: 500 });
  }
}
