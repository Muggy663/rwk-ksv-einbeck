import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📧 Webhook erhalten:', data.type);
    
    // Bei Bounce/Fehler Admin benachrichtigen
    if (data.type === 'email.bounced' || data.type === 'email.complained' || data.type === 'email.delivery_delayed') {
      const failedEmail = data.data.to;
      const reason = data.data.bounce?.reason || data.data.complaint?.reason || 'Unbekannt';
      
      console.log(`❌ E-Mail-Problem: ${failedEmail} - ${reason}`);
      
      // Admin benachrichtigen
      try {
        await resend.emails.send({
          from: 'noreply@rwk-einbeck.de',
          to: 'rwk-leiter-ksv@gmx.de',
          subject: `❌ E-Mail-Zustellproblem: ${failedEmail}`,
          html: `
            <h3>E-Mail-Zustellproblem</h3>
            <p><strong>E-Mail:</strong> ${failedEmail}</p>
            <p><strong>Problem:</strong> ${data.type}</p>
            <p><strong>Grund:</strong> ${reason}</p>
            <p><strong>Zeit:</strong> ${new Date().toLocaleString('de-DE')}</p>
            
            <hr>
            <p><small>Automatische Benachrichtigung von rwk-einbeck.de</small></p>
          `
        });
        
        console.log('✅ Admin-Benachrichtigung gesendet');
      } catch (emailError) {
        console.error('❌ Fehler beim Senden der Admin-Benachrichtigung:', emailError);
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook-Fehler:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}