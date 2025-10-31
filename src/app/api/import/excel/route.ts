// src/app/api/import/excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { importMembersFromExcel } from '@/lib/services/excel-import-service';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput } from '@/lib/utils/input-validator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawMembers = body.members;
    
    if (!Array.isArray(rawMembers)) {
      secureLogger.warn('Invalid data format in Excel import', 'excel-import');
      return NextResponse.json({
        success: false,
        error: 'Ungültiges Datenformat'
      }, { status: 400 });
    }

    // Sichere Input-Validierung für jeden Member
    const members = rawMembers.map(member => ({
      firstName: sanitizeInput(member.firstName),
      lastName: sanitizeInput(member.lastName),
      email: sanitizeInput(member.email),
      birthYear: parseInt(sanitizeInput(member.birthYear)) || null,
      gender: sanitizeInput(member.gender),
      mitgliedsnummer: sanitizeInput(member.mitgliedsnummer)
    })).filter(member => 
      member.firstName && member.lastName // Nur gültige Mitglieder
    );

    if (members.length === 0) {
      secureLogger.warn('No valid members in Excel import', 'excel-import');
      return NextResponse.json({
        success: false,
        error: 'Keine gültigen Mitgliederdaten gefunden'
      }, { status: 400 });
    }


    const results = await importMembersFromExcel(members);


    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.imported} Mitglieder importiert, ${results.skipped} übersprungen`
    });

  } catch (error) {
    secureLogger.error('Excel import failed', 'excel-import');
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Import'
    }, { status: 500 });
  }
}
