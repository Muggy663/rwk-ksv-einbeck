import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken, data, action } = await request.json();
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Check premium status
    const premiumDoc = await adminDb.collection('premium_subscriptions').doc(userId).get();
    if (!premiumDoc.exists || premiumDoc.data()?.status !== 'active') {
      return NextResponse.json({ error: 'Premium required' }, { status: 403 });
    }
    
    if (action === 'upload') {
      await adminDb.collection('schiessnachweis_data').doc(userId).set({
        userId,
        data,
        lastModified: new Date(),
        deviceId: data.deviceId
      });
      
      return NextResponse.json({ success: true });
    }
    
    if (action === 'download') {
      const doc = await adminDb.collection('schiessnachweis_data').doc(userId).get();
      if (!doc.exists) {
        return NextResponse.json({ data: null });
      }
      
      return NextResponse.json({ data: doc.data() });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const idToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    const premiumDoc = await adminDb.collection('premium_subscriptions').doc(userId).get();
    const isPremium = premiumDoc.exists && premiumDoc.data()?.status === 'active';
    
    return NextResponse.json({ isPremium });
    
  } catch (error) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
  }
}
