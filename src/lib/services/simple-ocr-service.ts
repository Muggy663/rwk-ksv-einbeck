// Vereinfachte OCR-Service ohne Team-Erkennung
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
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY || 'AIzaSyBlcJpndITalBIoqtXSOvefgfRQoBl6_0c';
    
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
    
    console.log('📝 DOCUMENT_TEXT_DETECTION verwendet für bessere Handschrift-Erkennung');
    const lines = fullText.split('\n').filter(line => line.trim());
    
    console.log('🔍 OCR Zeilen:', lines);
    console.log('🔍 OCR Zeilen mit Index:');
    lines.forEach((line, i) => console.log(`  ${i}: "${line}"`));
    
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
            console.log('🔄 Lücke erkannt: 0 eingefügt');
          }
          
          shooterNames.push(name);
          console.log('👤 Schütze:', name);
          lastWasName = true;
        }
        continue;
      }
      
      // Score-Erkennung
      const scoreMatch = trimmed.match(/^(\d{1,3})$/);
      if (scoreMatch) {
        let score = parseInt(scoreMatch[1]);
        
        if (score > 400) {
          console.log(`⚠️ Unrealistisch: ${score} → 0`);
          score = 0;
        }
        
        if (score >= 0 && score <= 400) {
          scores.push(score);
          console.log('🎯 Score:', score);
          lastWasName = false;
          hasSeenScore = true;
        }
      }
    }
    
    // Rest mit 0 auffüllen falls nötig
    while (scores.length < shooterNames.length) {
      scores.push(0);
      console.log('🔄 Fehlender Score am Ende: 0 hinzugefügt');
    }
    
    console.log(`📊 Final: ${shooterNames.length} Schützen, ${scores.length} Scores`);
    console.log(`📝 Alle Schützen werden zurückgegeben (auch mit null-Scores)`);
    
    // 1:1 Zuordnung - ALLE Schützen zurückgeben
    const shooters = [];
    for (let i = 0; i < shooterNames.length; i++) {
      const score = i < scores.length ? scores[i] : 0;
      shooters.push({
        name: shooterNames[i],
        score: score === 0 ? null : score,
        confidence: score === 0 ? 0.5 : 0.9
      });
      console.log(`📝 ${shooterNames[i]}: ${score === 0 ? 'Nicht angetreten' : score + ' Ringe'}`);
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