import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, verificationLink, displayName } = await request.json();

    if (!email || !verificationLink) {
      return NextResponse.json(
        { error: 'E-Mail und Bestätigungslink sind erforderlich' },
        { status: 400 }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>E-Mail bestätigen - RWK Einbeck</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">RWK Einbeck</h1>
            <p style="color: #6b7280; font-size: 16px;">Schießnachweis - E-Mail bestätigen</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin-top: 0;">Willkommen ${displayName ? displayName : 'beim Schießnachweis'}</h2>
            <p>Vielen Dank für Ihre Registrierung beim digitalen Schießnachweis der RWK Einbeck App.</p>
            <p>Um Ihr Konto zu aktivieren, bestätigen Sie bitte Ihre E-Mail-Adresse:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                E-Mail bestätigen
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
              <a href="${verificationLink}" style="color: #3b82f6; word-break: break-all;">${verificationLink}</a>
            </p>
          </div>
          
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #065f46; margin-top: 0;">Was Sie erwartet:</h3>
            <ul style="color: #047857; margin: 0; padding-left: 20px;">
              <li>Digitales Schießtagebuch für Training und Wettkampf</li>
              <li>Import von elektronischen Anlagen (Meyton, Sius, etc.)</li>
              <li>Detaillierte Statistiken und Auswertungen</li>
              <li>PDF-Export für Behörden</li>
              <li>30 Tage Premium kostenlos testen</li>
            </ul>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 14px; color: #6b7280;">
            <p><strong>Wichtiger Hinweis:</strong> Diese E-Mail wurde automatisch generiert. Falls Sie sich nicht registriert haben, ignorieren Sie diese E-Mail.</p>
            <p>Bei Fragen wenden Sie sich an: <a href="mailto:rwk-leiter-ksve@gmx.de" style="color: #3b82f6;">rwk-leiter-ksve@gmx.de</a></p>
            <p style="text-align: center; margin-top: 30px;">
              <strong>RWK Einbeck</strong><br>
              Kreisschützenverband Einbeck e.V.<br>
              Digitale Schießsport-Verwaltung<br>
              2025 KSV Einbeck
            </p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'admin@rwk-einbeck.de',
      to: email,
      subject: 'E-Mail Bestätigung - RWK Einbeck Schießnachweis',
      html: emailHtml,
      // Spam-Score verbessern
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal'
      },
      tags: [
        {
          name: 'category',
          value: 'email-verification'
        }
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Senden der Bestätigungs-E-Mail:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden der E-Mail' },
      { status: 500 }
    );
  }
}