import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, months, amount, currency } = await request.json();
    
    // PayPal API Credentials (aus .env)
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
    
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json({ error: 'PayPal-Konfiguration fehlt' }, { status: 500 });
    }
    
    // PayPal Access Token holen
    const authResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    
    // PayPal Order erstellen
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2)
        },
        description: `Premium Schießnachweis - ${months} Monat${months > 1 ? 'e' : ''}`,
        custom_id: JSON.stringify({ userId, months })
      }],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/schiessnachweis/premium/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/schiessnachweis/premium/cancel`,
        brand_name: 'RWK Einbeck',
        locale: 'de-DE',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW'
      }
    };
    
    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `${userId}-${Date.now()}`
      },
      body: JSON.stringify(orderData)
    });
    
    const order = await orderResponse.json();
    
    if (order.id) {
      const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href;
      
      return NextResponse.json({
        orderId: order.id,
        approvalUrl: approvalUrl
      });
    } else {
      throw new Error('PayPal Order konnte nicht erstellt werden');
    }
    
  } catch (error) {
    console.error('PayPal Order Creation Error:', error);
    return NextResponse.json({ 
      error: 'PayPal-Order konnte nicht erstellt werden' 
    }, { status: 500 });
  }
}
