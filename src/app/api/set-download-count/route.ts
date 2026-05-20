import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn } from '@/lib/utils/secure-logger';
import { verifyApiAuth } from '@/lib/auth/api-auth';
import { setDownloadCount } from '@/lib/services/download-counter';

export async function POST(request: NextRequest) {
  // Nur SuperAdmin darf den Download-Zähler manuell setzen
  const user = await verifyApiAuth(request);
  if (!user) {
    logWarn('Unauthorized access attempt to set-download-count', 'download-count-api');
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  if (user.email !== 'admin@rwk-einbeck.de') {
    logWarn(`Forbidden access attempt to set-download-count by ${user.email}`, 'download-count-api');
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

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
