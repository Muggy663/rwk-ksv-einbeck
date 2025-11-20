import { NextRequest, NextResponse } from 'next/server';
import { HtmlSanitizer } from '@/lib/utils/html-sanitizer';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput, validateImageUpload } from '@/lib/utils/input-validator';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      secureLogger.warn('No image provided to Vision OCR', 'vision-ocr');
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    // Sichere Bild-Validierung
    const imageValidation = validateImageUpload(imageFile, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });

    if (!imageValidation.isValid) {
      secureLogger.warn(`Vision OCR image validation failed: ${imageValidation.error}`, 'vision-ocr');
      return NextResponse.json({ success: false, error: imageValidation.error }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    
    // Sichere URL-Validierung
    const apiUrl = 'https://vision.googleapis.com/v1/images:annotate';
    const sanitizedApiKey = HtmlSanitizer.sanitizeText(apiKey);
    
    if (!apiUrl.startsWith('https://vision.googleapis.com/')) {
      throw new Error('Invalid API endpoint');
    }
    
    const response = await fetch(`${apiUrl}?key=${sanitizedApiKey}`, {
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
    
    let fullText = data.responses[0]?.fullTextAnnotation?.text || '';
    if (!fullText && data.responses[0]?.textAnnotations?.length > 0) {
      fullText = data.responses[0].textAnnotations[0].description || '';
    }
    
    const lines = fullText.split('\n').filter(line => line.trim());
    
    const shooterNames: string[] = [];
    const scores: number[] = [];
    let lastWasName = false;
    let hasSeenScore = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      const nameMatch = trimmed.match(/^([A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?\s+[A-ZÄÖÜ][a-zäöüß]+)$/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        if (!name.includes('Kreisschützenverband') && 
            !name.includes('Ansprechpartner') &&
            !name.includes('Einbeck') &&
            !shooterNames.includes(name)) {
          
          if (lastWasName && hasSeenScore) {
            scores.push(0);
          }
          
          shooterNames.push(name);
          lastWasName = true;
        }
        continue;
      }
      
      const scoreMatch = trimmed.match(/^(\d{1,3})$/);
      if (scoreMatch) {
        let score = parseInt(scoreMatch[1]);
        
        if (score > 400) {
          score = 0;
        }
        
        if (score >= 0 && score <= 400) {
          scores.push(score);
          lastWasName = false;
          hasSeenScore = true;
        }
      }
    }
    
    while (scores.length < shooterNames.length) {
      scores.push(0);
    }
    
    const shooters = [];
    for (let i = 0; i < shooterNames.length; i++) {
      const score = i < scores.length ? scores[i] : 0;
      shooters.push({
        name: shooterNames[i],
        score: score === 0 ? null : score,
        confidence: score === 0 ? 0.5 : 0.9
      });
    }
    
    return NextResponse.json({
      success: true,
      shooters,
      rawText: fullText
    });

  } catch (error) {
    secureLogger.error('Vision OCR processing failed', 'vision-ocr');
    return NextResponse.json({ 
      success: false, 
      error: 'OCR processing failed' 
    }, { status: 500 });
  }
}
