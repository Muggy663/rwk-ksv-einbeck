import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    await adminDb.collection('km_disziplinen').doc(id).update(data);
    
    return NextResponse.json({
      success: true,
      message: 'Disziplin aktualisiert'
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Update fehlgeschlagen' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await adminDb.collection('km_disziplinen').doc(id).delete();
    
    return NextResponse.json({
      success: true,
      message: 'Disziplin gelöscht'
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Löschen fehlgeschlagen' },
      { status: 500 }
    );
  }
}