import { AI_CONFIG } from '@/lib/ai/config';
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const { teamName, currentTotal, teamAverage, discipline, durchgang } = await request.json();
    
    const prompt = `Analysiere diese Schießsport-Anomalie:

Team: ${teamName}
Disziplin: ${discipline}
Durchgang: ${durchgang}
Aktuelles Ergebnis: ${currentTotal} Ringe
Üblicher Durchschnitt: ${teamAverage} Ringe

Gib eine kurze Einschätzung (max 50 Wörter):
- Ist das plausibel oder verdächtig?
- Mögliche Ursachen?
- Empfehlung zur Überprüfung?`;

    const response = await genAI.models.generateContent({
      model: AI_CONFIG.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const analysis = (response.text || '').trim();
    
    return NextResponse.json({ 
      success: true, 
      analysis,
      suggestion: analysis.includes('verdächtig') || analysis.includes('ungewöhnlich') ? 'check' : 'ok'
    });

  } catch (error) {
    logError('Gemini plausibility error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed',
      fallback: 'Große Abweichung vom Durchschnitt - bitte Ergebnisse prüfen.'
    }, { status: 500 });
  }
}

