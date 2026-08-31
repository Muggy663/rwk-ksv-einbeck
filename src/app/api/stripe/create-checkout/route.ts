import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken, plan } = await request.json();
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Simulate Stripe checkout (replace with real Stripe)
    const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({ 
      sessionId,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/schiessnachweis/premium?session=${sessionId}&plan=${plan}`
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
