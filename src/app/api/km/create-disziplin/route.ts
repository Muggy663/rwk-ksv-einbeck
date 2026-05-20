import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { logInfo, logWarn, logError, logDebug, getErrorMessage } from '@/lib/utils/secure-logger';

export async function POST(request: NextRequest) {
  try {
    const { id, data } = await request.json();
    
    logInfo(`📝 Erstelle Disziplin: ${id} - ${data.spoNummer} ${data.name}`);
    
    // Erstelle Disziplin mit exakter ID
    await adminDb.collection('km_disziplinen').doc(id).set(data);
    
    return NextResponse.json({
      success: true,
      message: `Disziplin ${data.spoNummer} - ${data.name} erstellt`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}