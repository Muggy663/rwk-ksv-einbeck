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
    
    const prompt = `WICHTIGER HINWEIS: Du hilfst bei allgemeinen Schießsport-Fragen, kennst aber NICHT die spezifische RWK-Ordnung des KSV Einbeck.

Frage: ${question}

ANTWORTE NUR wenn es eine allgemeine Schießsport-Frage ist zu:
- Grundlagen des Schießsports
- Allgemeine Disziplinen (KK, LG, LP)
- Sicherheitsregeln
- Wettkampfarten

Bei spezifischen RWK-Regeln, Punkteverteilung oder lokalen Bestimmungen antworte:
"Für spezifische RWK-Regeln des KSV Einbeck wenden Sie sich bitte an den RWK-Leiter oder schauen in die offizielle RWK-Ordnung."

Max 100 Wörter, ehrlich bei Unsicherheit.`;

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
