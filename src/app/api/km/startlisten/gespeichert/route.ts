import { NextRequest, NextResponse } from 'next/server';
import { logError, getErrorMessage } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection('km_startlisten_v2').get();
    const startlisten = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      data: startlisten
    });
  } catch (error) {
    logError('Fehler beim Laden der gespeicherten Startlisten:', error);
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}
