import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await adminDb.collection('km_startlisten_v2').doc(id).delete();
    
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