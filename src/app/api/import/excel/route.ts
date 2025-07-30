// src/app/api/import/excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { importMembersFromExcel } from '@/lib/services/excel-import-service';

export async function POST(request: NextRequest) {
  try {
    console.log('Excel-Import API aufgerufen');
    const body = await request.json();
    const { members } = body;
    
    console.log('Empfangene Mitglieder:', members?.length);
    console.log('Erste 2 Mitglieder:', members?.slice(0, 2));

    if (!Array.isArray(members)) {
      console.log('Fehler: Kein Array empfangen');
      return NextResponse.json({
        success: false,
        error: 'Ungültiges Datenformat'
      }, { status: 400 });
    }

    console.log('Starte Import...');
    const results = await importMembersFromExcel(members);
    console.log('Import-Ergebnisse:', results);

    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.imported} Mitglieder importiert, ${results.skipped} übersprungen`
    });

  } catch (error) {
    console.error('Fehler beim Excel-Import:', error);
    return NextResponse.json({
      success: false,
      error: `Fehler beim Import: ${error}`
    }, { status: 500 });
  }
}