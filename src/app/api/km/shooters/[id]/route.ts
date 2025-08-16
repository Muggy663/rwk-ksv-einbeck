import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shooterId = params.id;
    const updateData = await request.json();

    const shooterRef = doc(db, 'shooters', shooterId);
    
    // Check if shooter exists
    const shooterSnap = await getDoc(shooterRef);
    if (!shooterSnap.exists()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Shooter not found' 
      }, { status: 404 });
    }

    // Update shooter
    await updateDoc(shooterRef, {
      ...updateData,
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Shooter updated successfully' 
    });
  } catch (error) {
    console.error('Update shooter error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update shooter' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shooterId = params.id;
    const shooterRef = doc(db, 'shooters', shooterId);
    
    // Check if shooter exists
    const shooterSnap = await getDoc(shooterRef);
    if (!shooterSnap.exists()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Shooter not found' 
      }, { status: 404 });
    }

    // Delete shooter
    await deleteDoc(shooterRef);

    return NextResponse.json({ 
      success: true, 
      message: 'Shooter deleted successfully' 
    });
  } catch (error) {
    console.error('Delete shooter error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete shooter' 
    }, { status: 500 });
  }
}