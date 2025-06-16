import { NextResponse } from 'next/server';
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
    const { name, email, subject, message } = data;

    // Konfiguriere den E-Mail-Transporter
    const transporter = nodemailer.createTransport({
      host: 'mail.gmx.com',
      port: 587,
      secure: false, // true für 465, false für andere Ports
      auth: {
        user: process.env.EMAIL_USER || 'rwk-leiter-ksve@gmx.de',
        pass: process.env.EMAIL_PASSWORD || '', // Passwort sollte in Umgebungsvariablen gespeichert werden
      },
    });

    // E-Mail-Inhalt
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

    // Sende die E-Mail
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden der E-Mail' },
      { status: 500 }
    );
  }
}