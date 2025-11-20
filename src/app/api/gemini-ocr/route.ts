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
    const textInput = formData.get('text') as string;
    const availableTeamsRaw = formData.get('availableTeams') as string;
    
    // Prüfe ob Text- oder Bild-Input
    const isTextInput = textInput !== null;
    const isImageInput = image !== null;
    
    if (!isTextInput && !isImageInput) {
      secureLogger.warn('No input provided (neither text nor image)', 'gemini-ocr');
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    let base64Image: string | undefined;
    let imageType: string | undefined;
    
    if (isImageInput) {
      // Sichere Bild-Validierung
      const imageValidation = validateImageUpload(image, {
        maxSize: MAX_IMAGE_SIZE,
        allowedMimeTypes: ALLOWED_IMAGE_TYPES
      });

      if (!imageValidation.isValid) {
        secureLogger.warn(`Image validation failed: ${imageValidation.error}`, 'gemini-ocr');
        return NextResponse.json({ error: imageValidation.error }, { status: 400 });
      }

      // Convert image to base64
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      base64Image = buffer.toString('base64');
      imageType = image.type;
    }

    // Sichere JSON-Parsing
    let availableTeams = [];
    try {
      availableTeams = availableTeamsRaw ? JSON.parse(sanitizeInput(availableTeamsRaw)) : [];
    } catch (error) {
      secureLogger.warn('Invalid availableTeams JSON', 'gemini-ocr');
      availableTeams = [];
    }

    // Erstelle Prompt basierend auf Input-Typ
    let prompt;
    if (isTextInput) {
      // Text-basierte Verarbeitung
      prompt = `Analysiere diesen Text und extrahiere Schießergebnisse:\n\n${textInput}\n\nExtrahiere alle Schützen-Namen und ihre Ergebnisse. Rückgabe als JSON-Array:\n[{"shooterName": "Name", "score": 285, "confidence": 0.9}]`;
    } else {
      // Bild-basierte Verarbeitung für Handzettel
      prompt = `Analysiere diesen Schießsport-Handzettel und extrahiere ALLE Schützen mit ihren Ergebnissen.

SUCHE NACH:
- Schützen-Namen (z.B. "Müller Hans", "Schmidt Anna")
- Ergebnisse in Ringen (z.B. 285, 297, 0 für nicht angetreten)
- Tabellen-Format mit Namen und Ringzahlen

WICHTIG:
- Extrahiere ALLE sichtbaren Schützen
- Auch Schützen mit 0 Ringen (nicht angetreten)
- Namen können handschriftlich oder gedruckt sein
- Ergebnisse sind meist 3-stellige Zahlen (200-400 Bereich)

Rückgabe als JSON-Array:
[{"shooterName": "Müller Hans", "score": 285, "confidence": 0.9}, {"shooterName": "Schmidt Anna", "score": 297, "confidence": 0.8}]`;
    }

    // Erstelle Content basierend auf Input-Typ
    const contentParts: any[] = [{ text: prompt }];
    
    if (isImageInput && base64Image && imageType) {
      contentParts.push({
        inlineData: {
          data: base64Image,
          mimeType: imageType
        }
      });
    }
    
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: contentParts
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
