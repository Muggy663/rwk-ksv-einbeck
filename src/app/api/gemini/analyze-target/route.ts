import { AI_CONFIG } from '@/lib/ai/config';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { secureLogger } from '@/lib/utils/secure-logger';
import { validateImageUpload } from '@/lib/utils/input-validator';
import { logError } from '@/lib/utils/secure-logger';

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
    const discipline = formData.get('discipline') as string || 'LG'; // LG, LP, KK
    const shotCount = parseInt(formData.get('shotCount') as string || '10');
    
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

    // Detaillierter Prompt je nach Disziplin
    const scheibenInfo = {
      'LG': 'Luftgewehr 10m Scheibe mit 10 Ringen. Ring 10 = Zentrum (0.5mm), Ring 1 = Außen. Max pro Schuss: 10.9 (Zehntel-Wertung)',
      'LP': 'Luftpistole 10m Scheibe mit 10 Ringen. Ring 10 = Zentrum, Ring 1 = Außen. Max pro Schuss: 10.9',
      'KK': 'Kleinkaliberscheibe 50m mit 10 Ringen. Ring 10 = Zentrum, Ring 1 = Außen. Max pro Schuss: 10.9',
    }[discipline] || 'Schießscheibe mit 10 Ringen';

    const prompt = `Analysiere dieses Foto einer Schießscheibe.
Scheibentyp: ${scheibenInfo}
Erwartete Schussanzahl: ${shotCount}

Aufgabe:
1. Erkenne alle Einschusslöcher auf der Scheibe
2. Bestimme für jedes Loch die Ringzahl (mit Zehntel wenn erkennbar, z.B. 9.8, 10.2)
3. Falls Zehntel nicht erkennbar: ganze Ringe (z.B. 9, 10, 8)
4. Berechne die Gesamtsumme

Antworte NUR mit diesem JSON-Format:
{
  "shots": [10.2, 9.8, 10.0, 9.5, 8.7],
  "totalWithDecimal": 48.2,
  "totalWholeRings": 48,
  "shotCount": 5,
  "confidence": 85,
  "notes": "Kurze Anmerkung falls nötig"
}

Wichtig:
- "shots" Array mit den erkannten Ringwerten pro Schuss (höchster zuerst)
- "confidence" = Vertrauenswert 0-100%
- Falls Löcher nicht klar erkennbar: niedrigeren confidence angeben
- Bei überlappenden Schüssen: bestmögliche Schätzung`;

    const response = await genAI.models.generateContent({
      model: AI_CONFIG.model,
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
    let jsonText = text || '';
    if (jsonText.includes('```json')) {
      const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonText = match[1];
    } else if (jsonText.includes('{')) {
      const start = jsonText.indexOf('{');
      const end = jsonText.lastIndexOf('}');
      if (start >= 0 && end > start) jsonText = jsonText.substring(start, end + 1);
    }
    
    const analysis = JSON.parse(jsonText);
    return NextResponse.json({
      success: true,
      ...analysis,
      discipline,
    });
    
  } catch (error) {
    logError('Scheiben-Analyse Fehler:', error);
    return NextResponse.json({ error: 'Fehler bei der Bildanalyse' }, { status: 500 });
  }
}

