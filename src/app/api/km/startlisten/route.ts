import { NextRequest, NextResponse } from 'next/server';
import { logError, getErrorMessage } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { requireKMAuth } from '@/lib/auth/api-auth';

export async function GET(_request: NextRequest) {
  try {
    const snapshot = await adminDb.collection('km_startlisten_v2').orderBy('createdAt', 'desc').get();
    const startlisten = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      data: startlisten
    });
  } catch (error) {
    logError('Fehler beim Laden der Startlisten:', error);
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    const { configId, startliste, datum } = await request.json();
    
    const docRef = await adminDb.collection('km_startlisten_v2').add({
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
    logError('Fehler beim Erstellen der Startliste:', error);
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    const { id, configId, startliste, datum } = await request.json();
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID ist erforderlich für Update'
      }, { status: 400 });
    }
    
    await adminDb.collection('km_startlisten_v2').doc(id).update({
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
    logError('Fehler beim Aktualisieren der Startliste:', error);
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID ist erforderlich für Löschen'
      }, { status: 400 });
    }
    
    await adminDb.collection('km_startlisten_v2').doc(id).delete();
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    logError('Fehler beim Löschen der Startliste:', error);
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}