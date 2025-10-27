// Vereinfachte OCR-Service ohne Team-Erkennung
import { secureLogger } from '@/lib/utils/secure-logger';

export interface SimpleOCRResult {
  shooters: Array<{
    name: string;
    score: number | null;
    confidence: number;
  }>;
  rawText: string;
}

export class SimpleOCRService {
  async processHandzettel(imageFile: File): Promise<SimpleOCRResult> {
    // Google Vision API Call
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_VISION_API_KEY environment variable is required');
    }
    
    const base64Image = await this.fileToBase64(imageFile);
    
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64Image },
          features: [
            { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 50 },
            { type: 'TEXT_DETECTION', maxResults: 50 }
          ]
        }]
      })
    });

    const data = await response.json();
    
    // Versuche zuerst DOCUMENT_TEXT_DETECTION (besser für Handschrift)
    let fullText = data.responses[0]?.fullTextAnnotation?.text || '';
    
    // Fallback auf normale TEXT_DETECTION wenn leer
    if (!fullText && data.responses[0]?.textAnnotations?.length > 0) {
      fullText = data.responses[0].textAnnotations[0].description || '';
    }
    
    secureLogger.debug('Using DOCUMENT_TEXT_DETECTION for handwriting', 'simple-ocr');
    const lines = fullText.split('\n').filter(line => line.trim());
    
    secureLogger.debug('OCR lines processed', 'simple-ocr');
    
    // Sammle Namen und Scores mit Lücken-Erkennung
    const shooterNames: string[] = [];
    const scores: number[] = [];
    let lastWasName = false;
    let hasSeenScore = false; // Erst nach dem ersten Score prüfen
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Namen-Erkennung
      const nameMatch = trimmed.match(/^([A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?\s+[A-ZÄÖÜ][a-zäöüß]+)$/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        if (!name.includes('Kreisschützenverband') && 
            !name.includes('Ansprechpartner') &&
            !name.includes('Einbeck') &&
            !shooterNames.includes(name)) {
          
          // Nur Lücke prüfen wenn schon Scores gesehen wurden
          if (lastWasName && hasSeenScore) {
            scores.push(0);
            secureLogger.debug('Gap detected, inserting zero', 'simple-ocr');
          }
          
          shooterNames.push(name);
          secureLogger.debug('Shooter recognized', 'simple-ocr');
          lastWasName = true;
        }
        continue;
      }
      
      // Score-Erkennung
      const scoreMatch = trimmed.match(/^(\d{1,3})$/);
      if (scoreMatch) {
        let score = parseInt(scoreMatch[1]);
        
        if (score > 400) {
          secureLogger.debug('Unrealistic score corrected to zero', 'simple-ocr');
          score = 0;
        }
        
        if (score >= 0 && score <= 400) {
          scores.push(score);
          secureLogger.debug('Score recognized', 'simple-ocr');
          lastWasName = false;
          hasSeenScore = true;
        }
      }
    }
    
    // Rest mit 0 auffüllen falls nötig
    while (scores.length < shooterNames.length) {
      scores.push(0);
      secureLogger.debug('Missing score filled with zero', 'simple-ocr');
    }
    
    secureLogger.debug('Final OCR processing completed', 'simple-ocr');
    
    // 1:1 Zuordnung - ALLE Schützen zurückgeben
    const shooters = [];
    for (let i = 0; i < shooterNames.length; i++) {
      const score = i < scores.length ? scores[i] : 0;
      shooters.push({
        name: shooterNames[i],
        score: score === 0 ? null : score,
        confidence: score === 0 ? 0.5 : 0.9
      });
      secureLogger.debug('Shooter processed', 'simple-ocr');
    }
    

    
    return { shooters, rawText: fullText };
  }
  
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const simpleOCR = new SimpleOCRService();