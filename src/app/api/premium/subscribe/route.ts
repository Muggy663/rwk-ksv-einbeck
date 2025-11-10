import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken, plan } = await request.json();
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Simulate payment processing
    const subscriptionId = `sub_${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    await adminDb.collection('premium_subscriptions').doc(userId).set({
      userId,
      subscriptionId,
      plan,
      status: 'active',
      createdAt: new Date(),
      expiresAt,
      features: {
        cloudSync: true,
        multiDevice: true,
        advancedStats: true,
        performanceAnalysis: true
      }
    });
    
    return NextResponse.json({
      success: true,
      subscriptionId,
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }
}