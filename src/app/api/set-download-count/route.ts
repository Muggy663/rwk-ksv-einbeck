import { NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { setDownloadCount } from '@/lib/services/download-counter';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { count } = data;
    
    if (typeof count !== 'number' || count < 0) {
      return NextResponse.json(
        { success: false, error: 'Ungültiger Zählerwert' },
        { status: 400 }
      );
    }

    await setDownloadCount(count);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    logError('Fehler beim Setzen des Download-Zählers:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Setzen des Download-Zählers' },
      { status: 500 }
    );
  }
}
