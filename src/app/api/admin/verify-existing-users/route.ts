import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection('user_permissions').get();
    const batch = adminDb.batch();
    let count = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Nur setzen wenn noch nicht gesetzt
      if (!data.emailVerifiedByAdmin) {
        batch.update(docSnap.ref, {
          emailVerifiedByAdmin: true,
          emailVerifiedAt: Timestamp.now(),
        });
        count++;
      }
    }

    await batch.commit();
    return NextResponse.json({ success: true, updated: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
