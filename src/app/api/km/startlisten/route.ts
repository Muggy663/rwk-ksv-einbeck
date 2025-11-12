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
    console.error('Fehler beim Laden der Startlisten:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { configId, startliste, datum } = await request.json();
    
    const docRef = await adminDb.collection('km_startlisten').add({
      configId,
      startliste,
      datum,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      id: docRef.id
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Startliste:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, configId, startliste, datum } = await request.json();
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID ist erforderlich für Update'
      }, { status: 400 });
    }
    
    await adminDb.collection('km_startlisten').doc(id).update({
      configId,
      startliste,
      datum,
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      id
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Startliste:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}