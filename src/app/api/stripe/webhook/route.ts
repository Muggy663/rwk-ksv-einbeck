import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const plan = session.metadata.plan;
      
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (plan === 'yearly' ? 12 : 1));
      
      await adminDb.collection('premium_subscriptions').doc(userId).set({
        userId,
        subscriptionId: session.subscription,
        plan,
        status: 'active',
        createdAt: new Date(),
        expiresAt,
        stripeCustomerId: session.customer,
        features: {
          cloudSync: true,
          multiDevice: true,
          advancedStats: true,
          performanceAnalysis: true
        }
      });
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const subUserId = subscription.metadata.userId;
      
      await adminDb.collection('premium_subscriptions').doc(subUserId).update({
        status: 'cancelled',
        cancelledAt: new Date()
      });
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}
