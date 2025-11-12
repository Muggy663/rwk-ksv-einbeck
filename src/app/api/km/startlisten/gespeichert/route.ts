import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection('km_startlisten').orderBy('createdAt', 'desc').get();
    const startlisten = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      data: startlisten
    });
  } catch (error) {
    console.error('Fehler beim Laden der gespeicherten Startlisten:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}