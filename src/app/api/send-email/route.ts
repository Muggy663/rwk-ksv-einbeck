import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;
    const recipientsJson = formData.get('recipients') as string;
    
    if (!subject || !message || !recipientsJson) {
      return NextResponse.json({ 
        success: false, 
        message: 'Betreff, Nachricht und Empfänger sind erforderlich.' 
      }, { status: 400 });
    }
    
    const recipients = JSON.parse(recipientsJson);
    
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Keine gültigen Empfänger gefunden.' 
      }, { status: 400 });
    }
    
    // Anhänge verarbeiten
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
    
    // E-Mail-Signatur aus Datenbank laden
    let signature = `---
WICHTIGER HINWEIS: 
Bitte antworten Sie NICHT auf diese E-Mail.
Bei Fragen oder Rückmeldungen schreiben Sie an: rwk-leiter-ksv@gmx.de

Mit sportlichen Grüßen
Marcel Bünger
Rundenwettkampfleiter KSV Einbeck`;
    
    try {
      const settingsDoc = await getDoc(doc(db, 'admin_settings', 'email_signature'));
      if (settingsDoc.exists()) {
        signature = settingsDoc.data().signature || signature;
      }
    } catch (error) {
      console.log('Verwende Standard-Signatur:', error);
    }
    
    // E-Mail-Inhalt mit anpassbarer Signatur
    const emailContent = `${message}

${signature}`.trim();
    
    // Batch-Versand für bessere Zustellbarkeit (Optimiert: 25 Empfänger)
    const batchSize = 25;
    const results = [];
    const errors = [];
    
    console.log(`📧 Starte E-Mail-Versand an ${recipients.length} Empfänger in Batches von ${batchSize} (Resend Limit)`);
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      try {
        const emailData = {
          from: process.env.RESEND_FROM_EMAIL || 'admin@rwk-einbeck.de',
          to: batch.map((r: any) => r.email),
          subject: subject,
          text: emailContent,
          html: emailContent.replace(/\n/g, '<br>'),
          replyTo: 'rwk-leiter-ksv@gmx.de',
          attachments: attachments.length > 0 ? attachments : undefined
        };
        
        const result = await resend.emails.send(emailData);
        
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} gesendet:`, {
          id: result.data?.id,
          recipients: batch.length,
          emails: batch.map(r => r.email)
        });
        
        results.push({
          batchNumber: Math.floor(i/batchSize) + 1,
          emailId: result.data?.id,
          recipients: batch.length,
          success: true
        });
        
        // Pause zwischen Batches (60 Sekunden für bessere Zustellbarkeit)
        if (i + batchSize < recipients.length) {
          console.log(`⏱️ Warte 60 Sekunden vor nächstem Batch...`);
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
        
      } catch (error) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} Fehler:`, error);
        errors.push({
          batchNumber: Math.floor(i/batchSize) + 1,
          recipients: batch.map(r => r.email),
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
      }
    }
    
    console.log('📊 E-Mail-Versand abgeschlossen:', {
      totalRecipients: recipients.length,
      successfulBatches: results.length,
      failedBatches: errors.length,
      results: results,
      errors: errors
    });
    
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
    console.error('E-Mail-Versand-Fehler:', error);
    
    return NextResponse.json({
      success: false,
      message: 'E-Mail konnte nicht versendet werden. Bitte versuchen Sie es später erneut.'
    }, { status: 500 });
  }
}