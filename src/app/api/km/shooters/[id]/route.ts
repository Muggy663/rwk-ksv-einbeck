import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shooterId } = await params;
    const updateData = await request.json();

    const shooterRef = adminDb.collection('shooters').doc(shooterId);
    
    // Check if shooter exists
    const shooterSnap = await shooterRef.get();
    if (!shooterSnap.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Shooter not found' 
      }, { status: 404 });
    }

    // Update shooter
    await shooterRef.update({
      ...updateData,
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Shooter updated successfully' 
    });
  } catch (error) {
    logError('Update shooter error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update shooter' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shooterId } = await params;
    const shooterRef = adminDb.collection('shooters').doc(shooterId);
    
    // Check if shooter exists
    const shooterSnap = await shooterRef.get();
    if (!shooterSnap.exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Shooter not found' 
      }, { status: 404 });
    }

    // Delete shooter
    await shooterRef.delete();

    return NextResponse.json({ 
      success: true, 
      message: 'Shooter deleted successfully' 
    });
  } catch (error) {
    logError('Delete shooter error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete shooter' 
    }, { status: 500 });
  }
}