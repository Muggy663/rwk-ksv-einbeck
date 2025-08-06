// src/app/api/import/excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { importMembersFromExcel } from '@/lib/services/excel-import-service';

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const { members } = body;
    



    if (!Array.isArray(members)) {

      return NextResponse.json({
        success: false,
        error: 'Ungültiges Datenformat'
      }, { status: 400 });
    }


    const results = await importMembersFromExcel(members);


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
