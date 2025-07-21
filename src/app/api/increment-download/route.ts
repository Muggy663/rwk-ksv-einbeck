import { NextResponse } from 'next/server';
import { incrementDownloadCounter } from '@/lib/services/download-counter';

export async function GET() {
  try {
    const count = await incrementDownloadCounter();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Fehler beim Inkrementieren des Download-Zählers:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Zählen des Downloads' },
      { status: 500 }
    );
  }
}