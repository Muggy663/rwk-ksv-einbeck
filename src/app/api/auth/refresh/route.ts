import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { verifyApiAuth } from '@/lib/auth/api-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyApiAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Session ist gültig, einfach OK zurückgeben
    return NextResponse.json({ 
      success: true,
      message: 'Session refreshed',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 Stunde
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Session refresh failed' },
      { status: 500 }
    );
  }
}
