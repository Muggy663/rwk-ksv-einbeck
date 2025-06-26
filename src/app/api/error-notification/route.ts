// src/app/api/error-notification/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const errorReport = await request.json();
    
    // Hier würde normalerweise eine E-Mail gesendet werden
    // Für jetzt loggen wir nur den kritischen Fehler
    console.error('CRITICAL ERROR NOTIFICATION:', {
      message: errorReport.message,
      page: errorReport.page,
      timestamp: new Date(errorReport.timestamp).toISOString(),
      userAgent: errorReport.userAgent?.substring(0, 100)
    });

    // TODO: E-Mail-Service integrieren (z.B. Nodemailer, SendGrid, etc.)
    // await sendErrorEmail(errorReport);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in error notification:', error);
    return NextResponse.json(
      { error: 'Failed to process error notification' },
      { status: 500 }
    );
  }
}

// Beispiel für E-Mail-Funktion (nicht implementiert)
/*
async function sendErrorEmail(errorReport: any) {
  const emailContent = `
    KRITISCHER FEHLER in RWK App Einbeck:
    
    Seite: ${errorReport.page}
    Fehler: ${errorReport.message}
    Zeit: ${new Date(errorReport.timestamp).toLocaleString('de-DE')}
    Browser: ${errorReport.userAgent?.substring(0, 100)}
    
    Stack Trace:
    ${errorReport.stack || 'Nicht verfügbar'}
  `;
  
  // E-Mail senden an rwk-leiter-ksve@gmx.de
}
*/