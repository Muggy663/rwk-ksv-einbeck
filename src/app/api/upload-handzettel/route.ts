// src/app/api/upload-handzettel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    logDebug('🔍 Debug - RESEND_API_KEY vorhanden:', !!process.env.RESEND_API_KEY);
    logDebug('🔍 Debug - Alle RESEND env vars:', Object.keys(process.env).filter(key => key.includes('RESEND')));
    
    if (!resend) {
      return NextResponse.json({ 
        error: 'E-Mail-Service nicht konfiguriert. RESEND_API_KEY fehlt.' 
      }, { status: 500 });
    }
    
    logDebug('📧 Handzettel-Upload gestartet');
    const formData = await request.formData();
    
    const teamId = formData.get('teamId') as string;
    const round = formData.get('round') as string;
    const leagueName = formData.get('leagueName') as string;
    const teamName = formData.get('teamName') as string;
    const fileCount = parseInt(formData.get('fileCount') as string || '0');
    
    logDebug('📧 FormData erhalten:', { teamId, round, leagueName, teamName, fileCount });

    if (fileCount === 0) {
      logDebug('❌ Keine Dateien hochgeladen');
      return NextResponse.json({ error: 'Keine Dateien hochgeladen' }, { status: 400 });
    }

    // Alle Handzettel-Dateien sammeln und verarbeiten
    const attachments = [];
    
    for (let i = 0; i < fileCount; i++) {
      const handzettelFile = formData.get(`handzettel_${i}`) as File;
      
      if (handzettelFile) {
        const bytes = await handzettelFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const fileExtension = handzettelFile.name.split('.').pop() || 'jpg';
        const filename = fileCount > 1 
          ? `Handzettel_${teamName.replace(/[^a-zA-Z0-9]/g, '_')}_DG${round}_Seite${i + 1}.${fileExtension}`
          : `Handzettel_${teamName.replace(/[^a-zA-Z0-9]/g, '_')}_DG${round}.${fileExtension}`;
        
        attachments.push({
          filename,
          content: buffer,
        });
      }
    }

    if (attachments.length === 0) {
      return NextResponse.json({ error: 'Keine gültigen Dateien gefunden' }, { status: 400 });
    }

    // E-Mail mit Handzettel-Anhängen senden
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'RWK System <noreply@rwk-einbeck.de>',
      to: ['rwk-leiter-ksve@gmx.de'],
      subject: `📋 Handzettel-Beleg: ${teamName} - Durchgang ${round}${attachments.length > 1 ? ` (${attachments.length} Seiten)` : ''}`,
      html: `
        <h2>Handzettel-Beleg eingegangen</h2>
        <p><strong>Mannschaft:</strong> ${teamName}</p>
        <p><strong>Liga:</strong> ${leagueName}</p>
        <p><strong>Durchgang:</strong> ${round}</p>
        <p><strong>Team-ID:</strong> ${teamId}</p>
        <p><strong>Anzahl Seiten:</strong> ${attachments.length}</p>
        <p><strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE')}</p>
        
        <p>${attachments.length > 1 ? 'Die ausgefüllten Handzettel sind' : 'Der ausgefüllte Handzettel ist'} als Anhang beigefügt.</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">
          Automatisch gesendet vom RWK-System
        </p>
      `,
      replyTo: 'rwk-leiter-ksve@gmx.de',
      attachments,
    });

    if (emailResult.error) {
      logError('❌ E-Mail-Fehler:', emailResult.error);
      return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 });
    }

    logDebug('✅ E-Mail erfolgreich gesendet:', emailResult.data?.id);
    return NextResponse.json({ 
      success: true, 
      message: `Handzettel erfolgreich per E-Mail gesendet (${attachments.length} Seite(n))`,
      emailId: emailResult.data?.id,
      fileCount: attachments.length
    });

  } catch (error) {
    logError('Handzettel-Upload Fehler:', error);
    return NextResponse.json({ error: 'Server-Fehler beim Handzettel-Versand' }, { status: 500 });
  }
}
