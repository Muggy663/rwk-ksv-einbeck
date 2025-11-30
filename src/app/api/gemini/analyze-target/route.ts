import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { secureLogger } from '@/lib/utils/secure-logger';
import { validateImageUpload } from '@/lib/utils/input-validator';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API nicht konfiguriert' }, { status: 500 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: 'Kein Bild hochgeladen' }, { status: 400 });
    }

    // Validiere Bild
    const imageValidation = validateImageUpload(image, {
      maxSize: MAX_IMAGE_SIZE,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES
    });

    if (!imageValidation.isValid) {
      return NextResponse.json({ error: imageValidation.error }, { status: 400 });
    }

    // Konvertiere Bild zu Base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    const prompt = `Analysiere diese Schießscheibe und extrahiere:
- Anzahl Schüsse (Einschusslöcher)
- Gesamte Ringzahl
- Vertrauenswert (0-100%)

JSON-Format:
{"shots": <anzahl>, "rings": <summe>, "confidence": <prozent>}`;

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
    
    // Extrahiere JSON
    let jsonText = text;
    if (text.includes('```json')) {
      const match = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonText = match[1];
    }
    
    const analysis = JSON.parse(jsonText);
    return NextResponse.json(analysis);
    
  } catch (error) {
    logError('Gemini-Analyse Fehler:', error);
    return NextResponse.json({ error: 'Fehler bei der Bildanalyse' }, { status: 500 });
  }
}
