// src/lib/email-service.ts
// Nur Resend verwenden - einfacher und zuverlässiger

export interface EmailRecipient {
  name: string;
  email: string;
}

export interface EmailData {
  subject: string;
  message: string;
  recipients: EmailRecipient[];
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
  }>;
}

// SendGrid Funktion entfernt - verwenden nur Resend

// Alternative: Resend Service (einfacher zu konfigurieren)


export interface EmailServiceResponse {
  success: boolean;
  message: string;
  sentCount?: number;
}

export async function sendEmailWithResend(emailData: EmailData): Promise<EmailServiceResponse> {
  if (!process.env.RESEND_API_KEY) {
    return {
      success: false,
      message: 'Resend API Key nicht konfiguriert. Bitte RESEND_API_KEY in .env.local setzen.'
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@rwk-einbeck.de',
        to: emailData.recipients.map(r => r.email),
        subject: emailData.subject,
        html: emailData.message.replace(/\n/g, '<br>'),
        text: emailData.message,
        attachments: emailData.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          type: att.type
        })) || []
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Resend API Fehler');
    }
    
    await response.json();

    return {
      success: true,
      message: `E-Mail erfolgreich an ${emailData.recipients.length} Empfänger gesendet.`,
      sentCount: emailData.recipients.length
    };

  } catch (error: any) {
    return {
      success: false,
      message: `E-Mail-Versand fehlgeschlagen: ${error.message}`
    };
  }
}