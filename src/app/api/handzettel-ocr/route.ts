import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput, validateImageUpload } from '@/lib/utils/input-validator';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  secureLogger.info('Handzettel OCR API called', 'handzettel-ocr');
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      secureLogger.error('GEMINI_API_KEY missing', 'handzettel-ocr');
      return NextResponse.json({ 
        error: 'OCR service not configured'
      }, { status: 500 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const availableTeamsRaw = formData.get('availableTeams') as string;
    
    if (!image) {
      secureLogger.warn('No image provided', 'handzettel-ocr');
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Sichere Bild-Validierung
    const imageValidation = validateImageUpload(image, {
      maxSize: MAX_IMAGE_SIZE,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES
    });

    if (!imageValidation.isValid) {
      secureLogger.warn(`Image validation failed: ${imageValidation.error}`, 'handzettel-ocr');
      return NextResponse.json({ error: imageValidation.error }, { status: 400 });
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
      secureLogger.error('Failed to parse Gemini response', 'handzettel-ocr');
      return NextResponse.json({ 
        error: 'Invalid response format from OCR service'
      }, { status: 500 });
    }

  } catch (error) {
    secureLogger.error('Handzettel OCR processing failed', 'handzettel-ocr');
    return NextResponse.json({ 
      error: 'OCR processing failed'
    }, { status: 500 });
  }
}