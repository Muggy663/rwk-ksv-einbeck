import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireKMAuth } from '@/lib/auth/api-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
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