import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput, validateEmail } from '@/lib/utils/input-validator';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    secureLogger.info('Email API called', 'send-email-api');
    
    if (!resend) {
      secureLogger.error('RESEND_API_KEY missing', 'send-email-api');
      return NextResponse.json({ 
        success: false, 
        message: 'E-Mail-Service nicht konfiguriert. RESEND_API_KEY fehlt.' 
      }, { status: 500 });
    }
    
    const formData = await request.formData();
    
    const subject = sanitizeInput(formData.get('subject') as string);
    const message = sanitizeInput(formData.get('message') as string);
    const recipientsJson = formData.get('recipients') as string;
    
    if (!subject || !message || !recipientsJson) {
      secureLogger.warn('Missing required email fields', 'send-email-api');
      return NextResponse.json({ 
        success: false, 
        message: 'Betreff, Nachricht und Empfänger sind erforderlich.' 
      }, { status: 400 });
    }
    
    // Sichere JSON-Parsing
    let recipients;
    try {
      recipients = JSON.parse(recipientsJson);
    } catch (error) {
      secureLogger.warn('Invalid recipients JSON', 'send-email-api');
      return NextResponse.json({ 
        success: false, 
        message: 'Ungültige Empfänger-Daten.' 
      }, { status: 400 });
    }
    
    if (!Array.isArray(recipients) || recipients.length === 0) {
      secureLogger.warn('No valid recipients found', 'send-email-api');
      return NextResponse.json({ 
        success: false, 
        message: 'Keine gültigen Empfänger gefunden.' 
      }, { status: 400 });
    }

    // Validiere alle E-Mail-Adressen
    const validRecipients = recipients.filter(r => {
      if (!r.email || !validateEmail(r.email)) {
        secureLogger.warn('Invalid email address found', 'send-email-api');
        return false;
      }
      return true;
    });

    if (validRecipients.length === 0) {
      secureLogger.warn('No valid email addresses', 'send-email-api');
      return NextResponse.json({ 
        success: false, 
        message: 'Keine gültigen E-Mail-Adressen gefunden.' 
      }, { status: 400 });
    }
    
    const attachments = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attachment-') && value instanceof File) {
        const buffer = await value.arrayBuffer();
        attachments.push({
          filename: value.name,
          content: Buffer.from(buffer)
        });
      }
    }
    
    let signature = `---
WICHTIGER HINWEIS: 
Bitte antworten Sie NICHT auf diese E-Mail.
Bei Fragen oder Rückmeldungen schreiben Sie an: rwk-leiter-ksve@gmx.de

Mit sportlichen Grüßen
Marcel Bünger
Rundenwettkampfleiter KSVE Einbeck`;
    
    try {
      const settingsDoc = await getDoc(doc(db, 'admin_settings', 'email_signature'));
      if (settingsDoc.exists()) {
        signature = settingsDoc.data().signature || signature;
      }
    } catch (error) {
      // Use default signature if loading fails
    }
    
    const emailContent = `${message}

${signature}`.trim();
    
    const batchSize = 25;
    const results = [];
    const errors = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      try {
        const emailData = {
          from: 'RWK Einbeck <noreply@rwk-einbeck.de>',
          to: batch.map((r: any) => sanitizeInput(r.email)),
          subject: sanitizeInput(subject),
          text: sanitizeInput(emailContent),
          html: sanitizeInput(emailContent).replace(/\n/g, '<br>'),
          replyTo: 'rwk-leiter-ksve@gmx.de',
          attachments: attachments.length > 0 ? attachments : undefined
        };
        
        secureLogger.info('Sending email batch', 'send-email-api');
        
        const result = await resend.emails.send(emailData);
        
        secureLogger.info('Email sent successfully', 'send-email-api');
        
        results.push({
          batchNumber: Math.floor(i/batchSize) + 1,
          emailId: result.data?.id,
          recipients: batch.length,
          success: true
        });
        
      } catch (error) {
        secureLogger.error('Email batch failed', 'send-email-api');
        errors.push({
          batchNumber: Math.floor(i/batchSize) + 1,
          recipients: batch.length,
          error: 'E-Mail-Versand fehlgeschlagen'
        });
      }
    }

    const successfulRecipients = results.reduce((sum, batch) => sum + batch.recipients, 0);
    const failedRecipients = errors.reduce((sum, batch) => sum + batch.recipients.length, 0);
    
    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0 
        ? `E-Mail erfolgreich an ${successfulRecipients} Empfänger gesendet.`
        : `${successfulRecipients} erfolgreich, ${failedRecipients} fehlgeschlagen.`,
      details: {
        totalRecipients: recipients.length,
        successful: successfulRecipients,
        failed: failedRecipients,
        batches: results.length,
        errors: errors
      }
    });
    
  } catch (error) {
    secureLogger.error('Email API error', 'send-email-api');
    return NextResponse.json({
      success: false,
      message: 'E-Mail konnte nicht versendet werden. Bitte versuchen Sie es später erneut.'
    }, { status: 500 });
  }
}