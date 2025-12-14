import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    await adminDb.collection('km_startlisten_configs').doc(id).delete();
    
    return NextResponse.json({
      success: true,
      message: 'Startlisten-Konfiguration erfolgreich gelöscht'
    });
  } catch (error) {
    logError('Fehler beim Löschen der Startlisten-Konfiguration:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}