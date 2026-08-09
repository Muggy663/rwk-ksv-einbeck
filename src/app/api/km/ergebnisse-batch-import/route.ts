import { AI_CONFIG } from '@/lib/ai/config';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { secureLogger } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'OCR service not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const saisonId = formData.get('saisonId') as string;
    
    secureLogger.info(`Batch import: ${files.length} files, saison: ${saisonId?.replace(/[\r\n]/g, '')}`);
    
    if (files.length === 0 || !saisonId) {
      secureLogger.error(`Validation failed: files=${files.length}, saisonId=${saisonId?.replace(/[\r\n]/g, '')}`);
      return NextResponse.json({ 
        error: 'Dateien und Saison erforderlich',
        debug: { filesCount: files.length, hasSaisonId: !!saisonId }
      }, { status: 400 });
    }

    const saisonDoc = await adminDb.collection('km_saisons').doc(saisonId).get();
    secureLogger.info(`Saison exists: ${String(saisonDoc.exists).replace(/[\r\n]/g, '')}`);
    
    if (!saisonDoc.exists) {
      return NextResponse.json({ error: 'Saison nicht gefunden' }, { status: 404 });
    }

    const saisonData = saisonDoc.data();
    let collectionName = saisonData?.collectionName;
    
    // Generiere Collection-Name aus disziplinTyp
    if (!collectionName && saisonData?.disziplinTyp && saisonData?.jahr) {
      const typ = saisonData.disziplinTyp.toLowerCase();
      const jahr = saisonData.jahr;
      collectionName = `km_meldungen_${jahr}_${typ}`;
    }
    
    secureLogger.info(`Collection name: ${collectionName?.replace(/[\r\n]/g, '')}`);
    
    if (!collectionName) {
      return NextResponse.json({ error: 'Collection-Name fehlt' }, { status: 400 });
    }

    const meldungenSnapshot = await adminDb.collection(collectionName).get();
    let totalMatched = 0;
    let totalProcessed = files.length;

    try {
      // Lade Schützen für Namen-Mapping
      const schuetzenSnapshot = await adminDb.collection('shooters').get();
      const schuetzenMap = new Map();
      schuetzenSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const fullName = `${data.lastName}, ${data.firstName}`.toLowerCase().trim();
        schuetzenMap.set(doc.id, fullName);
      });
      
      // Lade Disziplinen für Matching
      const disziplinenSnapshot = await adminDb.collection('km_disziplinen').get();
      const disziplinenMap = new Map();
      disziplinenSnapshot.docs.forEach(doc => {
        disziplinenMap.set(doc.id, doc.data().name);
      });
      // Alle Dateien in einem Request
      const parts: any[] = [{
        text: `Analysiere diese ${files.length} Dateien und extrahiere ALLE KM-Ergebnisse mit Einzelschüssen.

Erkenne: StartNummer, Name, Disziplin, Ringe, Zehntel, Inner-Zehner, ALLE Einzelschüsse
Ringe: 90-105 (Luft) oder 280-300 (KK)
Disziplin: z.B. "Luftgewehr Auflage", "Luftpistole Auflage", "Kleinkaliber", etc.

JSON Format:
[{
  "startNummer": 1,
  "name": "Max Mustermann",
  "disziplin": "Luftgewehr Auflage",
  "ringe": 98,
  "zehntel": 5,
  "innerZehner": 8,
  "schuesse": [10.5, 10.2, 9.8, 10.1, 10.0, 9.9, 10.3, 10.4, 9.7, 10.6]
}]`
      }];

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString('base64');
        
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      }

      secureLogger.info(`Sending ${files.length} files in one request`);

      const response = await genAI.models.generateContent({
        model: AI_CONFIG.model,
        contents: [{
          role: 'user',
          parts
        }]
      });

      let jsonText = response.text;
      secureLogger.info(`Gemini response length: ${jsonText.length}`);
      secureLogger.info(`Gemini response preview: ${jsonText.substring(0, 500)}`);
      
      if (jsonText.includes('```json')) {
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1];
      }

      const parsedResults = JSON.parse(jsonText);
      secureLogger.info(`Parsed ${parsedResults.length} results`);
      const batch = adminDb.batch();

      for (const result of parsedResults) {
        secureLogger.info(`Looking for name: ${result.name?.replace(/[\r\n]/g, '')}`);
        
        const resultName = (result.name || '').toLowerCase().trim();
        const resultNameParts = resultName.split(/[,\s]+/).filter(p => p);
        
        // Finde ALLE Meldungen für diesen Schützen
        const alleMeldungen = meldungenSnapshot.docs.filter(doc => {
          const data = doc.data();
          const schuetzeId = data.schuetzeId;
          const schuetzeName = schuetzenMap.get(schuetzeId) || '';
          const schuetzeNameParts = schuetzeName.split(/[,\s]+/).filter(p => p);
          
          return resultNameParts.every(part => schuetzeNameParts.includes(part)) &&
                 schuetzeNameParts.every(part => resultNameParts.includes(part));
        });
        
        if (alleMeldungen.length === 0) {
          secureLogger.warn(`No meldung found for name: ${result.name?.replace(/[\r\n]/g, '')}`);
          continue;
        }
        
        // Wenn Disziplin erkannt wurde, filtere danach
        let gefiltert = alleMeldungen;
        if (result.disziplin) {
          const resultDisziplin = result.disziplin.toLowerCase();
          gefiltert = alleMeldungen.filter(doc => {
            const disziplinName = (disziplinenMap.get(doc.data().disziplinId) || '').toLowerCase();
            return disziplinName.includes(resultDisziplin) || resultDisziplin.includes(disziplinName);
          });
          
          if (gefiltert.length === 0) {
            secureLogger.warn(`No meldung found for ${result.name?.replace(/[\r\n]/g, '')} with disziplin ${result.disziplin?.replace(/[\r\n]/g, '')}`);
            continue;
          }
        }
        
        // Wenn mehrere Meldungen: Wähle die ohne Ergebnis oder die erste
        const meldung = gefiltert.find(doc => !doc.data().kmRinge) || gefiltert[0];
        const disziplinName = disziplinenMap.get(meldung.data().disziplinId) || 'Unbekannt';
        
        if (alleMeldungen.length > 1) {
          secureLogger.info(`Multiple meldungen for ${result.name?.replace(/[\r\n]/g, '')}, using: ${String(disziplinName).replace(/[\r\n]/g, '')}`);
        }
        
        const schuetzeName = schuetzenMap.get(meldung.data().schuetzeId);
        secureLogger.info(`Found meldung: ${String(meldung.id).replace(/[\r\n]/g, '')} for ${schuetzeName?.replace(/[\r\n]/g, '')}`);
        
        const updateData: any = {
          kmRinge: (() => {
            if (result.schuesse && Array.isArray(result.schuesse) && result.schuesse.length > 0) {
              const serien = [];
              for (let i = 0; i < result.schuesse.length; i += 10) {
                const serie = result.schuesse.slice(i, i + 10);
                const summe = serie.reduce((a, b) => a + b, 0);
                serien.push(summe);
              }
              return parseFloat(serien.reduce((a, b) => a + b, 0).toFixed(1));
            }
            return parseFloat(result.ringe.toFixed(1));
          })(),
          importDatum: new Date().toISOString(),
          importQuelle: 'gemini-pdf'
        };
        
        if (result.schuesse && Array.isArray(result.schuesse) && result.schuesse.length > 0) {
          const serien = [];
          for (let i = 0; i < result.schuesse.length; i += 10) {
            const serie = result.schuesse.slice(i, i + 10);
            const summe = serie.reduce((a, b) => a + b, 0);
            serien.push(summe.toFixed(1));
          }
          if (serien[0]) updateData.kmSerie1 = serien[0];
          if (serien[1]) updateData.kmSerie2 = serien[1];
          if (serien[2]) updateData.kmSerie3 = serien[2];
          if (serien[3]) updateData.kmSerie4 = serien[3];
        }
        
        batch.update(meldung.ref, updateData);
        totalMatched++;
        secureLogger.info(`Matched and queued for update with series: ${updateData.kmSerie1}, ${updateData.kmSerie2}, ${updateData.kmSerie3}`);
      }

      await batch.commit();

    } catch (fileError) {
      secureLogger.error('Batch processing error:', fileError);
      
      if (fileError instanceof Error && fileError.message.includes('quota')) {
        secureLogger.error('Quota exceeded');
      }
    }

    return NextResponse.json({
      success: totalMatched > 0,
      message: totalMatched > 0 
        ? `${totalMatched} Ergebnisse aus ${totalProcessed} Dateien importiert`
        : `Keine Ergebnisse importiert. ${totalProcessed} Dateien verarbeitet.`,
      matched: totalMatched,
      processed: totalProcessed
    });

  } catch (error) {
    secureLogger.error('Batch Import Error:', error);
    
    let errorMsg = 'Import fehlgeschlagen';
    if (error instanceof Error && error.message.includes('quota')) {
      errorMsg = 'Gemini Quota überschritten. Bitte 1 Minute warten und erneut versuchen.';
    }
    
    return NextResponse.json({ 
      error: errorMsg,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

