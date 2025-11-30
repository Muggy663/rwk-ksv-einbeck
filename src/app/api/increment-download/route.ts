import { NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { incrementDownloadCounter } from '@/lib/services/download-counter';

export async function GET() {
  try {
    const count = await incrementDownloadCounter();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    logError('Fehler beim Inkrementieren des Download-Zählers:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Zählen des Downloads' },
      { status: 500 }
    );
  }
}
