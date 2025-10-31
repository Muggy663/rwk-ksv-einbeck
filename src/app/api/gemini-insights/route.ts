import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { rateLimiter } from '@/lib/services/rate-limiter';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Rate Limiting (weniger streng für Statistiken)
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const maxDaily = 3; // Nur 3 Liga-Analysen pro Tag
    
    if (!rateLimiter.canMakeRequest(ip + '_insights', maxDaily)) {
      return NextResponse.json({ 
        error: 'Tageslimit erreicht',
        message: `Sie haben heute bereits ${maxDaily} Liga-Analysen erstellt. Versuchen Sie es morgen erneut.`
      }, { status: 429 });
    }

    const { leagueId, leagueName, seasonYear, teamData } = await request.json();
    
    // Vereinfachte Team-Daten für Prompt
    const teamSummary = teamData.slice(0, 8).map((team: any, index: number) => 
      `${index + 1}. ${team.name}: ${team.totalRings || 0} Ringe, ${team.matchesPlayed || 0} Spiele`
    ).join('\n');
    
    const prompt = `Analysiere diese deutsche Schießsport-Liga:

Liga: ${leagueName}
Saison: ${seasonYear}

Aktuelle Tabelle (Top 8):
${teamSummary}

Erstelle eine kurze, interessante Analyse (max 200 Wörter):
- Wer führt und warum?
- Spannende Kämpfe um Plätze?
- Auf-/Abstiegskampf?
- Besondere Leistungen?
- Prognose für Saisonende?

Schreibe wie ein Sportjournalist - interessant und verständlich.`;

    rateLimiter.recordRequest(ip + '_insights');

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
    console.error('Gemini insights error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed',
      message: 'Liga-Analyse konnte nicht erstellt werden.'
    }, { status: 500 });
  }
}