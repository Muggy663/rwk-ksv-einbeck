import { AI_CONFIG } from '@/lib/ai/config';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput, validateImageUpload } from '@/lib/utils/input-validator';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Sichere Konfiguration
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB Desktop
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const userAgent = request.headers.get('user-agent') || '';
  const isMobileRequest = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  secureLogger.info(`Gemini OCR API called (${isMobileRequest ? 'Mobile' : 'Desktop'})`, 'gemini-ocr');
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      secureLogger.error('GEMINI_API_KEY missing', undefined, 'gemini-ocr');
      return NextResponse.json({ 
        error: 'OCR service not configured'
      }, { status: 500 });
    }

    // Prüfe Content-Type für JSON vs FormData
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // JSON Text-Input (Schießnachweis)
      try {
        const body = await request.json();
        const textInput = body.text;
        const contextFromBody = body.context;
        
        if (textInput) {
          const prompt = contextFromBody || `Analysiere diesen Text und extrahiere Schießergebnisse:\n\n${textInput}\n\nExtrahiere alle Schützen-Namen und ihre Ergebnisse. Rückgabe als JSON-Array:\n[{"shooterName": "Name", "score": 285, "confidence": 0.9}]`;
          
          const response = await genAI.models.generateContent({
            model: AI_CONFIG.model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
          
          const text = response.text || '';
          let jsonText = text;
          if (text.includes('```json')) {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            if (match) jsonText = match[1] || '';
          }
          
          const parsedResults = JSON.parse(jsonText);
          return NextResponse.json({ 
            success: true, 
            results: parsedResults,
            ocrSource: 'gemini'
          });
        }
      } catch (jsonError) {
        secureLogger.error('JSON processing failed', undefined, 'gemini-ocr');
        return NextResponse.json({ 
          error: 'Invalid JSON request'
        }, { status: 400 });
      }
    }
    
    // FormData Input (Bild)
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const contextRaw = formData.get('context') as string;
    
    if (!image) {
      secureLogger.warn('No image provided', 'gemini-ocr');
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Mobile-spezifische Validierung
    const maxSize = isMobileRequest ? 3 * 1024 * 1024 : MAX_IMAGE_SIZE; // 3MB für Mobile, 5MB für Desktop
    
    const imageValidation = validateImageUpload(image, {
      maxSize,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES
    });

    if (!imageValidation.isValid) {
      secureLogger.warn(`Image validation failed: ${imageValidation.error}`, 'gemini-ocr');
      return NextResponse.json({ 
        error: `${imageValidation.error}${isMobileRequest ? ' (Mobile: max 3MB)' : ''}` 
      }, { status: 400 });
    }

    // Logging für Mobile Debug
    if (isMobileRequest) {
      secureLogger.info(`Mobile OCR: ${Math.round(image.size/1024)}KB ${image.type}`, 'gemini-ocr');
    }

    // Convert image to base64 mit Fehlerbehandlung
    let base64Image: string;
    try {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      base64Image = buffer.toString('base64');
      
      // Validiere Base64
      if (!base64Image || base64Image.length < 100) {
        throw new Error('Invalid image data');
      }
    } catch (conversionError) {
      secureLogger.error('Image conversion failed', undefined, 'gemini-ocr');
      return NextResponse.json({ 
        error: 'Failed to process image data'
      }, { status: 400 });
    }

    // Mobile-optimierter Prompt
    let prompt;
    if (contextRaw) {
      prompt = sanitizeInput(contextRaw);
    } else {
      prompt = `Analysiere diesen handschriftlichen Schießsport-Ergebniszettel und extrahiere alle Schützenergebnisse.

WICHTIGE REGELN:
1. Erkenne ALLE Namen und Ringzahlen aus der Tabelle
2. Erkenne auch Teamnamen wenn möglich
3. Ringzahlen sind meist 2-3 stellige Zahlen (z.B. 285, 167, 294)
4. IGNORIERE Nachschießen-Spalten komplett - nur reguläre Ergebnisse
5. Wenn ein Schütze sowohl reguläres Ergebnis als auch Nachschießen hat, nimm nur das reguläre
6. Ignoriere Unterschriften und Notizen am Ende
7. Confidence: 0.9 für klare Handschrift, 0.7 für mittlere, 0.5 für schwer lesbare
8. Extrahiere ALLE Schützen, nicht nur bestimmte Teams
9. Maximal 25 Ergebnisse pro Anfrage

Gib die Daten als JSON-Array zurück mit shooterName, teamName, score und confidence.
Format: [{"shooterName": "Max Mustermann", "teamName": "Team A", "score": 285, "confidence": 0.9}]`;
    }

    // Gemini API Call mit Timeout und Retry-Logic
    let response;
    let attempts = 0;
    const maxAttempts = isMobileRequest ? 2 : 1; // Mobile: 2 Versuche
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        // Timeout für Mobile länger
        const timeoutMs = isMobileRequest ? 40000 : 25000;
        
        const responsePromise = genAI.models.generateContent({
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
        
        // Race zwischen Response und Timeout
        response = await Promise.race([
          responsePromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Gemini API timeout')), timeoutMs)
          )
        ]);
        
        break; // Erfolgreich, verlasse Loop
        
      } catch (attemptError) {
        secureLogger.warn(`Gemini attempt ${attempts} failed`, 'gemini-ocr');
        
        if (attempts >= maxAttempts) {
          throw attemptError;
        }
        
        // Kurze Pause vor Retry (nur bei Mobile)
        if (isMobileRequest && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    const text = response!.text || '';
    const processingTime = Date.now() - startTime;
    
    if (isMobileRequest) {
      secureLogger.info(`Mobile OCR completed in ${processingTime}ms`, 'gemini-ocr');
    }
    
    try {
      let jsonText = text;
      if (text.includes('```json')) {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonText = match[1] || '';
        }
      }
      
      const parsedResults = JSON.parse(jsonText);
      
      // Validiere und begrenze Ergebnisse
      const validResults = Array.isArray(parsedResults) 
        ? parsedResults.slice(0, 25).filter(result => 
            result && 
            typeof result.shooterName === 'string' && 
            result.shooterName.trim().length > 0 &&
            typeof result.score === 'number' &&
            result.score >= 0 && result.score <= 400
          )
        : [];
      
      return NextResponse.json({ 
        success: true, 
        results: validResults,
        ocrSource: 'gemini',
        processingTime: isMobileRequest ? processingTime : undefined,
        attempts: isMobileRequest ? attempts : undefined
      });
      
    } catch (parseError) {
      secureLogger.error('Failed to parse Gemini response', undefined, 'gemini-ocr');
      
      // Für Mobile: Detailliertere Fehlermeldung
      const errorDetails = isMobileRequest 
        ? `Parse error after ${processingTime}ms (attempt ${attempts})`
        : 'Invalid response format';
      
      return NextResponse.json({ 
        error: `Invalid response format from OCR service: ${errorDetails}`,
        rawResponse: isMobileRequest ? text.substring(0, 200) : undefined
      }, { status: 500 });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    secureLogger.error(`Gemini OCR processing failed after ${processingTime}ms`, undefined, 'gemini-ocr');
    
    // Mobile-spezifische Fehlermeldungen
    let errorMessage = 'OCR processing failed';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = isMobileRequest 
          ? 'Timeout: Mobile Verbindung zu langsam. Versuchen Sie ein kleineres Bild oder besseres WLAN.'
          : 'Timeout: Verarbeitung dauerte zu lange';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = isMobileRequest
          ? 'Netzwerkfehler: Prüfen Sie Ihre Internetverbindung'
          : 'Network error occurred';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      isMobile: isMobileRequest,
      processingTime
    }, { status: 500 });
  }
}

