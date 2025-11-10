import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);
    
    switch (event.type) {
      case 'checkout.session.completed':
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
        
        break;
        
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const subUserId = subscription.metadata.userId;
        
        await adminDb.collection('premium_subscriptions').doc(subUserId).update({
          status: 'cancelled',
          cancelledAt: new Date()
        });
        
        break;
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}