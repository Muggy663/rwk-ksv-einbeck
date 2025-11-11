import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // PayPal Webhook-Verifikation (vereinfacht)
    const eventType = body.event_type;
    
    if (eventType === 'PAYMENT.SALE.COMPLETED') {
      const payment = body.resource;
      const customData = JSON.parse(payment.custom || '{}');
      const userId = customData.userId;
      const months = customData.months || 1;
      
      if (!userId) {
        return NextResponse.json({ error: 'User ID fehlt' }, { status: 400 });
      }
      
      // Premium aktivieren
      const userRef = doc(db, 'user_permissions', userId);
      const userDoc = await getDoc(userRef);
      
      const expiresAt = new Date();
      if (userDoc.exists() && userDoc.data().premiumUntil) {
        // Verlängere bestehende Subscription
        const currentExpiry = userDoc.data().premiumUntil.toDate();
        if (currentExpiry > new Date()) {
          expiresAt.setTime(currentExpiry.getTime());
        }
      }
      expiresAt.setMonth(expiresAt.getMonth() + months);
      
      await setDoc(userRef, {
        isPremium: true,
        premiumUntil: Timestamp.fromDate(expiresAt),
        premiumActivatedAt: Timestamp.now(),
        paymentMethod: 'paypal',
        autoRenew: true,
        lastPaymentId: payment.id,
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      console.log(`✅ Premium aktiviert für User ${userId} bis ${expiresAt.toISOString()}`);
      
      return NextResponse.json({ success: true });
    }
    
    if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
      const subscription = body.resource;
      const customData = JSON.parse(subscription.custom_id || '{}');
      const userId = customData.userId;
      
      if (userId) {
        const userRef = doc(db, 'user_permissions', userId);
        await setDoc(userRef, {
          autoRenew: false,
          updatedAt: Timestamp.now()
        }, { merge: true });
        
        console.log(`🔄 Auto-Renewal deaktiviert für User ${userId}`);
      }
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ message: 'Event ignoriert' });
    
  } catch (error) {
    console.error('PayPal Webhook Fehler:', error);
    return NextResponse.json({ error: 'Webhook-Verarbeitung fehlgeschlagen' }, { status: 500 });
  }
}