import { AI_CONFIG } from '@/lib/ai/config';
import { NextRequest, NextResponse } from 'next/server';
import { logError, getErrorMessage } from '@/lib/utils/secure-logger';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API Key nicht konfiguriert'
      }, { status: 500 });
    }

    const { message, context, canModify } = await request.json();
    
    let systemPrompt = `Du bist ein Experte für Schießsport und die RWK Einbeck App. Du hilfst bei:
- Startlisten-Optimierung
- Vereinsregeln und Sportgeräte-Management  
- KM-Meldungen und Wettkampforganisation
- RWK-Tabellen und Ergebnisse
- Schießsport-Regelwerk

Kontext der App:
- KSV Einbeck Rundenwettkampf-System
- Kreismeisterschaften (KM) mit Saisons
- Startlisten mit Vereins-Limits (max. 2 pro Durchgang)
- Gewehr-Sharing Management
- Disziplinen: KK, LP, LG

Antworte hilfreich und kompetent auf Deutsch.`;

    if (canModify) {
      systemPrompt += `\n\nWICHTIG: Du kannst Startlisten direkt ändern! Wenn der User Änderungen wünscht:
1. Analysiere die aktuelle Startliste
2. Führe die gewünschten Änderungen durch
3. Gib die modifizierte Liste als JSON zurück

Format für Änderungen:
{
  "antwort": "Erklärung der Änderungen",
  "modifiedStartliste": [array mit geänderter Startliste]
}

Beachte dabei:
- Max. 2 Starter pro Verein pro Durchgang
- Keine Stand-Zeit-Konflikte
- Gewehr-Sharing zeitlich versetzen`;
    }

    const fullPrompt = context ? 
      `${systemPrompt}\n\nKontext: ${context}\n\nFrage: ${message}` : 
      `${systemPrompt}\n\nFrage: ${message}`;

    const response = await genAI.models.generateContent({
      model: AI_CONFIG.model,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
    });

    const reply = (response.text || '').trim();
    
    // Prüfe ob JSON-Antwort mit modifizierter Startliste
    let modifiedStartliste = null;
    let finalReply = reply;
    
    if (canModify) {
      try {
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.modifiedStartliste) {
            modifiedStartliste = parsed.modifiedStartliste;
            finalReply = parsed.antwort || 'Startliste wurde angepasst.';
          }
        }
      } catch (e) {
        // Kein JSON, normale Antwort
      }
    }
    
    return NextResponse.json({
      success: true,
      reply: finalReply,
      modifiedStartliste
    });

  } catch (error) {
    logError('Gemini Chat Fehler:', error);
    return NextResponse.json({
      success: false,
      error: `Chat Fehler: ${getErrorMessage(error)}`
    }, { status: 500 });
  }
}

