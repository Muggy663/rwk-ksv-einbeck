import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await adminDb.collection('km_startlisten').doc(id).delete();
    
    return NextResponse.json({
      success: true,
      message: 'Startliste gelöscht'
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Löschen fehlgeschlagen' },
      { status: 500 }
    );
  }
}