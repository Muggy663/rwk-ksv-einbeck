// src/app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmailWithResend, EmailData } from '@/lib/email-service';
import { db } from '@/lib/firebase/config';
import { addDoc, collection } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;
    const recipients = JSON.parse(formData.get('recipients') as string);
    
    // Validierung
    if (!subject || !message || !recipients?.length) {
      return NextResponse.json(
        { success: false, message: 'Betreff, Nachricht und Empfänger sind erforderlich.' },
        { status: 400 }
      );
    }

    // Anhänge verarbeiten
    const attachments = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attachment-') && value instanceof File) {
        const buffer = await value.arrayBuffer();
        attachments.push({
          content: Buffer.from(buffer).toString('base64'),
          filename: value.name,
          type: value.type || 'application/octet-stream'
        });
      }
    }

    const emailData: EmailData = {
      subject,
      message,
      recipients,
      attachments
    };

    // Resend mit eigener Domain verwenden
    const result = await sendEmailWithResend(emailData);

    // Protokolliere E-Mail in Firestore
    try {
      await addDoc(collection(db, 'email_history'), {
        subject: emailData.subject,
        message: emailData.message,
        recipients: emailData.recipients,
        recipientCount: emailData.recipients.length,
        attachmentCount: attachments.length,
        sentAt: new Date(),
        sentBy: 'admin@rwk-einbeck.de', // TODO: Aktuellen Benutzer ermitteln
        status: result.success ? 'sent' : 'failed',
        service: 'resend',
        errorMessage: result.success ? null : result.message
      });
    } catch (logError) {
      console.error('Fehler beim Protokollieren der E-Mail:', logError);
      // E-Mail-Versand nicht blockieren wenn Protokollierung fehlschlägt
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('API Route Fehler:', error);
    return NextResponse.json(
      { success: false, message: 'Server-Fehler beim E-Mail-Versand.' },
      { status: 500 }
    );
  }
}