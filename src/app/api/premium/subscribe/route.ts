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
    
    // Korrekte Laufzeit je nach Plan
    if (plan === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      // Trial: 30 Tage
      expiresAt.setDate(expiresAt.getDate() + 30);
    }
    
    // Premium-Subscription erstellen
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
    
    // Premium-Status in user_permissions setzen
    await adminDb.collection('user_permissions').doc(userId).update({
      isPremium: true,
      premiumUntil: expiresAt,
      premiumPlan: plan,
      updatedAt: new Date()
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
