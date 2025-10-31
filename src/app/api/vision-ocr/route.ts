import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    
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
    console.error('Vision OCR error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'OCR processing failed' 
    }, { status: 500 });
  }
}