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
    const question = sanitizeInput(body.question);
    
    if (!question || question.length < 3) {
      secureLogger.warn('Invalid question in regelwerk chat', 'regelwerk-chat');
      return NextResponse.json({ 
        error: 'Ungültige Frage',
        message: 'Bitte stellen Sie eine gültige Frage.'
      }, { status: 400 });
    }
    
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
    
    return NextResponse.json({ 
      success: true, 
      answer
    });

  } catch (error) {
    secureLogger.error('Regelwerk chat failed', 'regelwerk-chat');
    return NextResponse.json({ 
      error: 'Chat failed',
      answer: 'Entschuldigung, ich kann diese Frage gerade nicht beantworten. Bitte versuchen Sie es später erneut.'
    }, { status: 500 });
  }
}