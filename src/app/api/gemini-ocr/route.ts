import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  console.log('🔍 Gemini API Route aufgerufen');
  console.log('🔑 GEMINI_API_KEY vorhanden:', !!process.env.GEMINI_API_KEY);
  console.log('🔑 GEMINI_API_KEY Wert:', process.env.GEMINI_API_KEY?.substring(0, 20) + '...');
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY fehlt');
      return NextResponse.json({ 
        error: 'Gemini API key not configured',
        debug: 'GEMINI_API_KEY environment variable is missing'
      }, { status: 500 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const availableTeams = JSON.parse(formData.get('availableTeams') as string || '[]');
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    const prompt = `Analysiere diesen handschriftlichen Schießsport-Ergebniszettel und extrahiere alle Schützenergebnisse.

WICHTIGE REGELN:
1. Erkenne ALLE Namen und Ringzahlen aus der Tabelle
2. Erkenne auch Teamnamen wenn möglich
3. Ringzahlen sind meist 2-3 stellige Zahlen (z.B. 285, 167, 294)
4. IGNORIERE Nachschießen-Spalten komplett - nur reguläre Ergebnisse
5. Wenn ein Schütze sowohl reguläres Ergebnis als auch Nachschießen hat, nimm nur das reguläre
6. Ignoriere Unterschriften und Notizen am Ende
7. Confidence: 0.9 für klare Handschrift, 0.7 für mittlere, 0.5 für schwer lesbare
8. Extrahiere ALLE Schützen, nicht nur bestimmte Teams

Gib die Daten als JSON-Array zurück mit shooterName, teamName, score und confidence.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Image,
                mimeType: image.type
              }
            }
          ]
        }
      ]
    });

    const text = response.text;
    
    try {
      // Extrahiere JSON aus Markdown Code-Block
      let jsonText = text;
      if (text.includes('```json')) {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonText = match[1];
        }
      }
      
      const parsedResults = JSON.parse(jsonText);
      return NextResponse.json({ 
        success: true, 
        results: parsedResults,
        ocrSource: 'gemini'
      });
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      return NextResponse.json({ 
        error: 'Invalid response format from Gemini',
        rawResponse: text 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Gemini OCR error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ 
      error: 'OCR processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    }, { status: 500 });
  }
}