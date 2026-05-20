import { NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { sanitizeInput, validateEmail } from '@/lib/utils/input-validator';
import nodemailer from 'nodemailer';

interface SupportTicketData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const data: SupportTicketData = await request.json();

    // Alle Eingaben sanitisieren (verhindert HTML-Injection in E-Mails)
    const name = sanitizeInput(data.name);
    const email = sanitizeInput(data.email);
    const subject = sanitizeInput(data.subject);
    const message = sanitizeInput(data.message);

    // Pflichtfelder prüfen
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Alle Felder sind erforderlich' },
        { status: 400 }
      );
    }

    // E-Mail-Adresse validieren
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: 'mail.gmx.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Alle Werte sind bereits sanitisiert – sicher für HTML-Templates
    const mailOptions = {
      from: '"RWK App Einbeck" <rwk-leiter-ksve@gmx.de>',
      to: 'rwk-leiter-ksve@gmx.de',
      subject: `Neues Support-Ticket: ${subject}`,
      html: `
        <h2>Neues Support-Ticket eingegangen</h2>
        <p><strong>Von:</strong> ${name} (${email})</p>
        <p><strong>Betreff:</strong> ${subject}</p>
        <p><strong>Nachricht:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p style="margin-top: 20px;">
          <a href="https://rwk-app-einbeck.vercel.app/admin/support-tickets" style="background-color: #0070f3; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
            Zum Support-Bereich
          </a>
        </p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Fehler beim Senden der E-Mail:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden der E-Mail' },
      { status: 500 }
    );
  }
}
