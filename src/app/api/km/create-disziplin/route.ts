import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { logInfo, getErrorMessage } from '@/lib/utils/secure-logger';
import { requireKMAuth } from '@/lib/auth/api-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
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