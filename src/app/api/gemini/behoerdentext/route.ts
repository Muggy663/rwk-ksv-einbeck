import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Gemini Behördentext API aufgerufen');
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Gemini API Key fehlt');
      return NextResponse.json({
        success: false,
        error: 'Gemini API Key nicht konfiguriert'
      }, { status: 500 });
    }

    const body = await request.json();
    console.log('📝 Request Body:', body);
    const { personalData, stats } = body;
    
    const systemPrompt = `Du bist ein Experte für offizielle Behördenschreiben im Schießsport. 
Erstelle einen professionellen Begleittext für einen Schießnachweis in ICH-FORM.

Der Text soll:
- In der ICH-Form geschrieben sein
- Professionell und behördenfreundlich klingen
- Die Schießtätigkeit als regelmäßig und gesetzeskonform darstellen
- Bezug zum Waffengesetz nehmen
- Höflich und respektvoll formuliert sein
- Korrekte deutsche Präpositionen verwenden ("im" für maskuline Vereine, "in der" für feminine)

WICHTIG: Verwende die korrekten deutschen Präpositionen:
- "im [Vereinsname]" für maskuline Vereine (z.B. "im SC Naensen", "im KSV Einbeck")
- "in der [Vereinsname]" für feminine Vereine (z.B. "in der Einbecker Schützengilde")

Format: Kurzer, prägnanter Text ohne Anrede/Grußformel (wird separat hinzugefügt).`;

    const prompt = `${systemPrompt}

Persönliche Daten:
- Name: ${personalData.vorname} ${personalData.name}
- Verein: ${personalData.vereinsname || 'Schützenverein'}
- WBK-Nr.: ${personalData.waffenbesitzkarte || 'nicht angegeben'}

Statistiken:
- Zeitraum: ${stats.zeitraum}
- Trainingseinheiten: ${stats.totalTrainings}
- Wettkämpfe: ${stats.totalWettkämpfe}
- Gesamtschüsse: ${stats.totalSchüsse}

Erstelle einen kurzen, professionellen Text in ICH-FORM für Behörden.`;

    console.log('🚀 Sende Anfrage an Gemini...');
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    console.log('✅ Gemini Response erhalten');

    const text = response.text.trim();
    console.log('📄 Generierter Text:', text.substring(0, 100) + '...');
    
    return NextResponse.json({
      success: true,
      text
    });

  } catch (error) {
    console.error('❌ Gemini Behördentext Fehler:', error);
    console.error('Error Details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    try {
      // Fallback-Text mit korrekter deutscher Grammatik
      const vereinsname = personalData?.vereinsname || 'meinem Schützenverein';
      let vereinText;
      
      if (personalData?.vereinsname) {
        if (vereinsname.includes('Schützengilde') || vereinsname.includes('Gilde')) {
          vereinText = `in der ${vereinsname}`;
        } else if (vereinsname.startsWith('SC ') || vereinsname.startsWith('KSV ') || vereinsname.includes('Verein')) {
          vereinText = `im ${vereinsname}`;
        } else {
          vereinText = `im ${vereinsname}`; // Default für unbekannte Vereine
        }
      } else {
        vereinText = 'in meinem Schützenverein';
      }
      
      const fallbackText = `hiermit bestätige ich, dass ich ${vereinText} aktiv bin und regelmäßig trainiere. Im dokumentierten Zeitraum ${stats?.zeitraum || 'des letzten Jahres'} habe ich ${stats?.totalTrainings > 0 ? `${stats.totalTrainings} Trainingseinheiten absolviert` : 'regelmäßig trainiert'} und ${stats?.totalWettkämpfe > 0 ? `an ${stats.totalWettkämpfe} Wettkämpfen teilgenommen` : 'an Wettkämpfen teilgenommen'}. Insgesamt habe ich ${stats?.totalSchüsse || 0} Schüsse abgegeben.\n\nDie nachfolgende Aufstellung dokumentiert meine regelmäßige Schießtätigkeit gemäß den Anforderungen des Waffengesetzes.`;
      
      console.log('🔄 Verwende Fallback-Text');
      return NextResponse.json({
        success: true,
        text: fallbackText,
        fallback: true
      });
    } catch (fallbackError) {
      console.error('❌ Auch Fallback fehlgeschlagen:', fallbackError);
      return NextResponse.json({
        success: false,
        error: `Fehler bei Textgenerierung: ${error.message}`,
        fallbackError: fallbackError.message
      }, { status: 500 });
    }
  }
}