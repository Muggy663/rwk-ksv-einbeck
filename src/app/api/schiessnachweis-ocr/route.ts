import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { secureLogger } from '@/lib/utils/secure-logger';
import { validateImageUpload } from '@/lib/utils/input-validator';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  secureLogger.info('Schießnachweis OCR API called', 'schiessnachweis-ocr');
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      secureLogger.error('GEMINI_API_KEY missing', 'schiessnachweis-ocr');
      return NextResponse.json({ 
        error: 'OCR service not configured'
      }, { status: 500 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const disziplin = formData.get('disziplin') as string;
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const imageValidation = validateImageUpload(image, {
      maxSize: MAX_IMAGE_SIZE,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES
    });

    if (!imageValidation.isValid) {
      return NextResponse.json({ error: imageValidation.error }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    const prompt = `Analysiere diesen Schießsport-Ergebnisausdruck für die Disziplin "${disziplin}".

WICHTIGE REGELN:
1. Erkenne ALLE Serien und deren Einzelschüsse
2. Einzelschüsse haben Kommastellen (z.B. 10.5, 9.8, 10.1)
3. Berechne aus Kommawerten die glatten Ringe: 10.5 → 10 Ringe, 9.8 → 9 Ringe
4. Erkenne Seriensummen und prüfe gegen Einzelschüsse
5. Ignoriere Gesamtergebnisse - nur Serien sind wichtig

Gib die Daten als JSON zurück:
{
  "serien": [
    {
      "serienNummer": 1,
      "schuesse": [
        {
          "nummer": 1,
          "wert": 10.5,
          "ring": 10
        }
      ],
      "summe": 98.6
    }
  ]
}

Antworte NUR mit dem JSON, keine Erklärungen.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
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
      }]
    });

    const text = response.text;
    
    try {
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
        serien: parsedResults.serien || [],
        ocrSource: 'gemini'
      });
    } catch (parseError) {
      secureLogger.error('Failed to parse Gemini response', 'schiessnachweis-ocr');
      return NextResponse.json({ 
        error: 'Invalid response format from OCR service'
      }, { status: 500 });
    }

  } catch (error) {
    secureLogger.error('Schießnachweis OCR processing failed', 'schiessnachweis-ocr');
    return NextResponse.json({ 
      error: 'OCR processing failed'
    }, { status: 500 });
  }
}