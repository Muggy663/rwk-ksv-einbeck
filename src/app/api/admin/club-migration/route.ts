import { NextRequest, NextResponse } from 'next/server';
import { ClubMigrationService } from '@/lib/services/club-migration-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clubId, action } = body;

    if (!clubId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Club-ID und Aktion sind erforderlich'
      }, { status: 400 });
    }

    let result;
    
    switch (action) {
      case 'migrate-shooters':
        await ClubMigrationService.migrateShootersToMembers(clubId);
        result = { message: 'Shooter-Migration erfolgreich' };
        break;
        
      case 'migrate-vereinsrecht':
        await ClubMigrationService.migrateVereinsrechtData(clubId);
        result = { message: 'Vereinsrecht-Migration erfolgreich' };
        break;
        
      case 'check-status':
        const isComplete = await ClubMigrationService.isMigrationComplete(clubId);
        result = { migrationComplete: isComplete };
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Unbekannte Aktion'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Migration-Fehler:', error);
    return NextResponse.json({
      success: false,
      error: `Migration fehlgeschlagen: ${error.message}`
    }, { status: 500 });
  }
}