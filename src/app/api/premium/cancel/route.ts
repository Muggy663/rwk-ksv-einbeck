import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Cancel subscription
    await adminDb.collection('premium_subscriptions').doc(userId).update({
      status: 'cancelled',
      cancelledAt: new Date()
    });
    
    // Update user profile
    await adminDb.collection('users').doc(userId).update({
      premiumStatus: 'cancelled'
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Cancellation failed' }, { status: 500 });
  }
}