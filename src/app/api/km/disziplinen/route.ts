// src/app/api/km/disziplinen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateDisziplinen2026, getAllDisziplinen } from '@/lib/services/km-disziplinen-service';

export async function POST(request: NextRequest) {
  try {
    await generateDisziplinen2026();
    
    return NextResponse.json({
      success: true,
      message: 'Disziplinen für 2026 erfolgreich initialisiert'
    });
  } catch (error) {
    console.error('Fehler beim Initialisieren der Disziplinen:', error);
    
    return NextResponse.json({
      success: false,
      error: `Fehler beim Initialisieren der Disziplinen: ${error.message}`,
      details: error.toString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const disziplinen = await getAllDisziplinen();
    
    return NextResponse.json({
      success: true,
      data: disziplinen
    });
  } catch (error) {
    console.error('Fehler beim Laden der Disziplinen:', error);
    
    // Fallback: Leere Liste zurückgeben statt 500-Fehler
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Keine Disziplinen gefunden - System muss initialisiert werden'
    });
  }
}