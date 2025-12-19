import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const doc = await adminDb.collection('km_startlisten').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Startliste nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Fehler beim Laden der Startliste' },
      { status: 500 }
    );
  }
}
