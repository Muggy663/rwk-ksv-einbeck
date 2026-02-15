import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { secureLogger } from '@/lib/utils/secure-logger';
import { validateImageUpload } from '@/lib/utils/input-validator';
import { adminDb } from '@/lib/firebase/admin';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'OCR service not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const saisonId = formData.get('saisonId') as string;
    
    if (!file || !saisonId) {
      return NextResponse.json({ error: 'Datei und Saison erforderlich' }, { status: 400 });
    }

    const imageValidation = validateImageUpload(file, {
      maxSize: 10 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });

    if (!imageValidation.isValid) {
      return NextResponse.json({ error: imageValidation.error }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    const prompt = `Analysiere diesen KM-Ergebniszettel und extrahiere alle Schützenergebnisse.

WICHTIG:
1. Erkenne StartNummer, Name, Verein, Ringe, Zehntel, Inner-Zehner
2. Ringe sind meist 90-105 (Luftgewehr/Luftpistole) oder 280-300 (Kleinkaliber)
3. Zehntel sind die Nachkommastellen (z.B. 98.5 = 98 Ringe, 5 Zehntel)
4. Inner-Zehner sind 10.0+ Schüsse
5. Ignoriere Unterschriften und Notizen

Gib JSON zurück:
[{
  "startNummer": 1,
  "name": "Max Mustermann",
  "verein": "KSV Einbeck",
  "ringe": 98,
  "zehntel": 5,
  "innerZehner": 8,
  "confidence": 0.9
}]`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Data,
              mimeType: file.type
            }
          }
        ]
      }]
    });

    const text = response.text;
    let jsonText = text;
    if (text.includes('```json')) {
      const match = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonText = match[1];
    }

    const parsedResults = JSON.parse(jsonText);

    const saisonDoc = await adminDb.collection('km_saisons').doc(saisonId).get();
    if (!saisonDoc.exists) {
      return NextResponse.json({ error: 'Saison nicht gefunden' }, { status: 404 });
    }

    const collectionName = saisonDoc.data()?.collectionName;
    if (!collectionName) {
      return NextResponse.json({ error: 'Collection-Name fehlt' }, { status: 400 });
    }

    const batch = adminDb.batch();
    const meldungenSnapshot = await adminDb.collection(collectionName).get();
    let matched = 0;

    for (const result of parsedResults) {
      const meldung = meldungenSnapshot.docs.find(doc => 
        doc.data().startNummer === result.startNummer
      );
      
      if (meldung) {
        batch.update(meldung.ref, {
          ringe: result.ringe,
          zehntel: result.zehntel,
          innerZehner: result.innerZehner,
          importDatum: new Date().toISOString(),
          importQuelle: 'gemini-ocr'
        });
        matched++;
      }
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `${matched} von ${parsedResults.length} Ergebnissen importiert`,
      ergebnisse: parsedResults,
      matched
    });

  } catch (error) {
    secureLogger.error('KM OCR Import Error:', error);
    return NextResponse.json({ error: 'Import fehlgeschlagen' }, { status: 500 });
  }
}
