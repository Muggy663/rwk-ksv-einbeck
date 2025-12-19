import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { getAllDisziplinen } from '@/lib/services/km-disziplinen-service';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const docRef = await adminDb.collection('km_disziplinen').add({
      ...data,
      createdAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Disziplin erfolgreich erstellt'
    });
  } catch (error) {
    logError('Fehler beim Erstellen der Disziplin:', error);
    
    return NextResponse.json({
      success: false,
      error: `Fehler beim Erstellen: ${error.message}`
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const disziplinen = await getAllDisziplinen();
    
    return NextResponse.json({
      success: true,
      data: disziplinen
    });
  } catch (error) {
    logError('Fehler beim Laden der Disziplinen:', error);
    
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Keine Disziplinen gefunden'
    });
  }
}