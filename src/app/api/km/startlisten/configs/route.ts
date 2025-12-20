import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const docRef = await adminDb.collection('km_startlisten_configs').add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Austragungsort erfolgreich erstellt'
    });
  } catch (error) {
    logError('Fehler beim Erstellen des Austragungsorts:', error);
    
    return NextResponse.json({
      success: false,
      error: `Fehler beim Erstellen: ${error.message}`
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID ist erforderlich für Update'
      }, { status: 400 });
    }
    
    await adminDb.collection('km_startlisten_configs').doc(id).update({
      ...data,
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      id,
      message: 'Austragungsort erfolgreich aktualisiert'
    });
  } catch (error) {
    logError('Fehler beim Aktualisieren des Austragungsorts:', error);
    
    return NextResponse.json({
      success: false,
      error: `Fehler beim Aktualisieren: ${error.message}`
    }, { status: 500 });
  }
}