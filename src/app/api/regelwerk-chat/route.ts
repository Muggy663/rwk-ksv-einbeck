import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { rateLimiter } from '@/lib/services/rate-limiter';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Rate Limiting prüfen
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const maxDaily = 5;
    
    if (!rateLimiter.canMakeRequest(ip, maxDaily)) {
      const remaining = rateLimiter.getRemainingRequests(ip, maxDaily);
      return NextResponse.json({ 
        error: 'Tageslimit erreicht',
        message: `Sie haben heute bereits ${maxDaily} Fragen gestellt. Versuchen Sie es morgen erneut.`,
        remaining: 0
      }, { status: 429 });
    }

    const { question } = await request.json();
    
    // Request zählen
    rateLimiter.recordRequest(ip);
    
    const prompt = `Du bist ein Experte für deutsche Schießsport-Regelwerke, speziell RWK (Rundenwettkampf) und KM (Kreismeisterschaft).

Frage: ${question}

Beantworte die Frage basierend auf typischen deutschen Schießsport-Regeln:
- RWK-Ordnung (Rundenwettkämpfe)
- KM-Regeln (Kreismeisterschaften) 
- DSB-Sportordnung
- Auf-/Abstiegsregeln
- Mannschaftsregeln
- Disziplinen (KK, LG, LP)

Gib eine präzise, hilfreiche Antwort (max 150 Wörter). Falls unsicher, sage es ehrlich.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const answer = response.text.trim();
    
    const remaining = rateLimiter.getRemainingRequests(ip, maxDaily);
    
    return NextResponse.json({ 
      success: true, 
      answer,
      remaining
    });

  } catch (error) {
    console.error('Regelwerk chat error:', error);
    return NextResponse.json({ 
      error: 'Chat failed',
      answer: 'Entschuldigung, ich kann diese Frage gerade nicht beantworten. Bitte versuchen Sie es später erneut.'
    }, { status: 500 });
  }
}