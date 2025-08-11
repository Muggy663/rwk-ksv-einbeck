// src/app/api/km/david21-export/route.ts
// API Route für David21 Export

import { NextRequest, NextResponse } from 'next/server';
import { David21Service } from '@/lib/services/david21-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      wettkampfId, 
      disziplinId, 
      datum, 
      startzeit, 
      meldungen,
      schuetzen,
      vereine,
      disziplinen,
      wettkampfklassen
    } = body;

    // Konvertiere zu David21 Format
    const startlistEntries = David21Service.convertKMToStartlist(
      meldungen,
      schuetzen,
      vereine,
      disziplinen,
      wettkampfklassen
    );

    // Generiere TXT Datei
    const txtContent = David21Service.generateStartlist(startlistEntries);
    
    // Generiere CTL Datei
    const disziplin = disziplinen.find((d: any) => d.id === disziplinId);
    const ctlContent = David21Service.generateControlFile(
      wettkampfId,
      disziplin?.spoNummer || 'UNKNOWN',
      new Date(datum),
      startzeit,
      startlistEntries.length
    );

    // Dateinamen generieren
    const baseFilename = David21Service.generateFilename(
      wettkampfId,
      disziplin?.spoNummer?.replace('.', '') || 'K72',
      new Date(datum),
      startzeit,
      'TXT'
    );

    return NextResponse.json({
      success: true,
      files: {
        txt: {
          filename: baseFilename,
          content: txtContent
        },
        ctl: {
          filename: baseFilename.replace('.TXT', '.CTL'),
          content: ctlContent
        }
      },
      teilnehmerAnzahl: startlistEntries.length
    });

  } catch (error) {
    console.error('David21 Export Error:', error);
    return NextResponse.json(
      { success: false, error: 'Export fehlgeschlagen' },
      { status: 500 }
    );
  }
}