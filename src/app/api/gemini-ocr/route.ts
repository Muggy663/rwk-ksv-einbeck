import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput, validateImageUpload } from '@/lib/utils/input-validator';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Sichere Konfiguration
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  secureLogger.info('Gemini OCR API called', 'gemini-ocr');
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      secureLogger.error('GEMINI_API_KEY missing', 'gemini-ocr');
      return NextResponse.json({ 
        error: 'OCR service not configured'
      }, { status: 500 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const availableTeamsRaw = formData.get('availableTeams') as string;
    
    if (!image) {
      secureLogger.warn('No image provided', 'gemini-ocr');
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Sichere Bild-Validierung
    const imageValidation = validateImageUpload(image, {
      maxSize: MAX_IMAGE_SIZE,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES
    });

    if (!imageValidation.isValid) {
      secureLogger.warn(`Image validation failed: ${imageValidation.error}`, 'gemini-ocr');
      return NextResponse.json({ error: imageValidation.error }, { status: 400 });
    }

    // Sichere JSON-Parsing
    let availableTeams = [];
    try {
      availableTeams = availableTeamsRaw ? JSON.parse(sanitizeInput(availableTeamsRaw)) : [];
    } catch (error) {
      secureLogger.warn('Invalid availableTeams JSON', 'gemini-ocr');
      availableTeams = [];
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    const prompt = `Analysiere diesen MEYTON/SIUS/DISAG Schießergebnis-Ausdruck und extrahiere ALLE Einzelschuss-Werte.

MEYTON ERKENNUNG:
- Tabellen mit "Serie 1", "Serie 2" etc.
- Spalten: Schuss 1, Schuss 2, Schuss 3...
- Werte wie: 10.5, 9.8, 10.1, 9.9, 10.0
- Oft 10 Schuss pro Serie
- Manchmal Summen am Ende (IGNORIEREN!)

SIUS/DISAG ERKENNUNG:
- Komma-getrennte Werte: "9.1,9.3,9.7,9.8,9.2"
- Pipe-getrennte: "9.1|9.3|9.7|9.8|9.2"
- Spalten-Format mit Zahlen

WICHTIG:
- NUR Einzelschuss-Werte zwischen 0.0-10.9
- KEINE Summen, Namen, Daten
- Ganze Zahlen als .0 ("10" = "10.0")
- Auch handschriftliche Werte

Rückgabe als JSON-Array:
[{"score": "10.5"}, {"score": "9.8"}, {"score": "10.1"}]`;

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
      secureLogger.error('Failed to parse Gemini response', 'gemini-ocr');
      return NextResponse.json({ 
        error: 'Invalid response format from OCR service'
      }, { status: 500 });
    }

  } catch (error) {
    secureLogger.error('Gemini OCR processing failed', 'gemini-ocr');
    return NextResponse.json({ 
      error: 'OCR processing failed'
    }, { status: 500 });
  }
}
