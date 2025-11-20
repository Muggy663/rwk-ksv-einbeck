import { NextRequest, NextResponse } from 'next/server';
import { TrainingGroupsService } from '@/lib/services/training-groups-service';

export async function POST(request: NextRequest) {
  try {
    const result = await TrainingGroupsService.cleanupInactiveGroups();
    
    return NextResponse.json({
      success: true,
      message: `Cleanup abgeschlossen: ${result.warned} Gruppen gewarnt, ${result.archived} Gruppen archiviert`,
      ...result
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup fehlgeschlagen' },
      { status: 500 }
    );
  }
}
