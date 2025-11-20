import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput } from '@/lib/utils/input-validator';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const leagueId = sanitizeInput(body.leagueId);
    const leagueName = sanitizeInput(body.leagueName);
    const seasonYear = sanitizeInput(body.seasonYear);
    const teamData = Array.isArray(body.teamData) ? body.teamData : [];
    
    if (!leagueName || !teamData.length) {
      secureLogger.warn('Invalid data for league insights', 'gemini-insights');
      return NextResponse.json({ 
        error: 'Ungültige Liga-Daten'
      }, { status: 400 });
    }
    
    // Vereinfachte Team-Daten für Prompt
    const teamSummary = teamData.slice(0, 8).map((team: any, index: number) => 
      `${index + 1}. ${team.name}: ${team.totalRings || 0} Ringe, ${team.matchesPlayed || 0} Spiele`
    ).join('\n');
    
    const prompt = `Analysiere diese RWK-Liga des KSV Einbeck:

Liga: ${leagueName}
Saison: ${seasonYear}

Aktuelle Tabelle (Top 8):
${teamSummary}

KONTEXT: Dies ist ein Rundenwettkampf (RWK) im deutschen Schießsport mit:
- Mannschaften aus verschiedenen Vereinen
- Regelmäßige Wettkampftage
- Auf-/Abstiegsregelung zwischen Ligen
- Disziplinen: Kleinkaliber (KK), Luftgewehr (LG), Luftpistole (LP)

Erstelle eine fundierte Analyse (max 180 Wörter):
- Tabellenführung und Gründe
- Spannende Positionskämpfe
- Auf-/Abstiegssituation
- Auffallige Leistungen
- Realistische Saisonprognose

Schreibe sachlich und kompetent für Schießsport-Kenner.`;



    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const insights = response.text.trim();
    
    return NextResponse.json({ 
      success: true, 
      insights
    });

  } catch (error) {
    secureLogger.error('League insights generation failed', 'gemini-insights');
    return NextResponse.json({ 
      error: 'Analysis failed',
      message: 'Liga-Analyse konnte nicht erstellt werden.'
    }, { status: 500 });
  }
}
