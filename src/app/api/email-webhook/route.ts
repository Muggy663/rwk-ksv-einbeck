import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Resend is available
    if (!resend) {

      return NextResponse.json({ received: true, message: 'API Key fehlt' });
    }
    
    const data = await request.json();
    

    
    // Bei Bounce/Fehler nur loggen (E-Mail-Benachrichtigung deaktiviert wegen Loop)
    if (data.type === 'email.bounced' || data.type === 'email.complained' || data.type === 'email.delivery_delayed') {
      const failedEmail = data.data.to;
      const reason = data.data.bounce?.reason || data.data.complaint?.reason || 'Unbekannt';
      


      
      // TODO: Implementiere alternative Benachrichtigung (z.B. Database Log)
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook-Fehler:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
