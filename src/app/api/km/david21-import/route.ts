// src/app/api/km/david21-import/route.ts
// API Route für David21 Ergebnis-Import

import { NextRequest, NextResponse } from 'next/server';
import { David21Service } from '@/lib/services/david21-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const wettkampfId = formData.get('wettkampfId') as string;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Keine Datei hochgeladen' },
        { status: 400 }
      );
    }

    // Datei-Inhalt lesen
    const content = await file.text();
    
    // David21 Ergebnisse parsen
    const results = David21Service.parseResults(content);
    
    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keine gültigen Ergebnisse gefunden' },
        { status: 400 }
      );
    }

    // TODO: Hier würdest du die Ergebnisse in Firebase speichern
    // Beispiel-Struktur für KM-Ergebnisse:
    const kmErgebnisse = results.map(result => ({
      wettkampfId,
      startNummer: result.startNummer,
      schuetzeName: `${result.vorname} ${result.nachname}`,
      vereinsNummer: result.vereinsNummer,
      ringe: result.ringe,
      zehntel: result.zehntel,
      innerZehner: result.innerZehner,
      schussDetails: result.schussDetails,
      bemerkung: result.bemerkung,
      importDatum: new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      message: `${results.length} Ergebnisse erfolgreich importiert`,
      ergebnisse: kmErgebnisse,
      statistik: {
        teilnehmer: results.length,
        durchschnitt: Math.round(results.reduce((sum, r) => sum + r.ringe, 0) / results.length * 10) / 10,
        besterSchuss: Math.max(...results.map(r => r.ringe)),
        schlechtesterSchuss: Math.min(...results.map(r => r.ringe))
      }
    });

  } catch (error) {
    console.error('David21 Import Error:', error);
    return NextResponse.json(
      { success: false, error: 'Import fehlgeschlagen' },
      { status: 500 }
    );
  }
}