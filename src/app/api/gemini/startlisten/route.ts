import { AI_CONFIG } from '@/lib/ai/config';
import { NextRequest, NextResponse } from 'next/server';
import { logError, getErrorMessage } from '@/lib/utils/secure-logger';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    const { meldungen, config, aktion } = await request.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API Key nicht konfiguriert. Bitte GEMINI_API_KEY in .env.local setzen.'
      }, { status: 500 });
    }

    let prompt = '';
    
    if (aktion === 'generieren') {
      prompt = `
Du bist ein Experte für Schießsport-Startlisten. Erstelle eine optimale Startliste basierend auf folgenden Daten:

MELDUNGEN (${meldungen.length} Starter):
${meldungen.map((m, i) => `${i+1}. ${m.schuetzeName} (${m.verein}) - ${m.disziplin} - ${m.wettkampfklasse}${m.gewehrSharing ? ' [GEWEHR GETEILT]' : ''}`).join('\n')}

KONFIGURATION:
- Verfügbare Stände: ${config.verfuegbareStaende?.join(', ') || 'Nicht definiert'} (${config.verfuegbareStaende?.length || 0} Stände)
- Startzeit: ${config.startUhrzeit || 'Nicht definiert'}
- Durchgangsdauer: ${config.durchgangsDauer || 30} Minuten
- Wechselzeit: ${config.wechselzeit || 10} Minuten
- Pausen: ${config.pausen?.map(p => `${p.nach} Durchgängen: ${p.dauer} Min`).join(', ') || 'Keine'}

WICHTIGE REGELN:
1. **ALLE VERFÜGBAREN STÄNDE NUTZEN**: Nutze ALLE ${config.verfuegbareStaende?.length || 0} verfügbaren Stände pro Durchgang für minimale Durchgangsanzahl
2. **MINIMALE DURCHGÄNGE**: Ziel ist die geringstmögliche Anzahl von Durchgängen bei optimaler Standausnutzung
3. **STAND-OPTIMIERUNG**: Bei ${meldungen.length} Startern und ${config.verfuegbareStaende?.length || 0} Ständen sollten es maximal ${Math.ceil(meldungen.length / (config.verfuegbareStaende?.length || 1))} Durchgänge werden
4. **GEWEHR-SHARING KRITISCH**: 
   - Starter mit gleichem Nachnamen teilen sich ein Gewehr
   - Diese dürfen NIEMALS im gleichen Durchgang starten
   - Gewehr-Sharing Partner müssen in aufeinanderfolgenden Durchgängen starten (z.B. DG1 und DG2)
   - Beispiel: "Müller, Hans" in DG1, "Müller, Anna" in DG2
5. VEREINS-LIMIT: ${config.vereinsLimit ? `Maximal ${config.vereinsLimit} Starter pro Verein pro Durchgang` : `Kein Vereinslimit`} (Sportgeräte-Knappheit)
6. Wettkampfklassen: Gleiche Klassen möglichst gruppieren  
7. Berücksichtige Pausen zwischen Durchgängen
8. Vereinsgruppen: Starter vom gleichen Verein zeitlich nah beieinander

Erstelle eine JSON-Antwort mit folgendem Format:
{
  "startliste": [
    {
      "id": "unique_id",
      "schuetzeId": "original_id",
      "name": "Name des Schützen",
      "verein": "Vereinsname", 
      "disziplin": "Disziplin",
      "wettkampfklasse": "Klasse",
      "stand": "Standnummer",
      "startzeit": "HH:MM",
      "durchgang": 1,
      "hinweise": "Gewehr geteilt" oder ""
    }
  ],
  "analyse": {
    "konflikte": ["Liste von erkannten Problemen"],
    "optimierungen": ["Liste von Verbesserungen"],
    "statistik": {
      "gesamtDauer": "Geschätzte Gesamtdauer",
      "durchgaenge": "Anzahl Durchgänge",
      "staendeAuslastung": "Prozentuale Auslastung"
    }
  }
}

Antworte NUR mit dem JSON, keine zusätzlichen Erklärungen.`;
    } else if (aktion === 'optimieren') {
      prompt = `
Du bist ein Experte für Schießsport-Startlisten. Analysiere die bestehende Startliste und schlage Verbesserungen vor:

AKTUELLE STARTLISTE:
${meldungen.map((m, i) => `${i+1}. ${m.name} - Stand ${m.stand} - ${m.startzeit} - ${m.verein}`).join('\n')}

Analysiere auf:
1. Stand-Zeit-Konflikte (mehrere Starter gleicher Stand zur gleichen Zeit)
2. Gewehr-Sharing Probleme
3. VEREINS-LIMIT VERLETZUNGEN ${config.vereinsLimit ? `(mehr als ${config.vereinsLimit} Starter pro Verein pro Durchgang)` : `(falls Limit gesetzt)`}
4. Suboptimale Vereinsgruppierung
5. Ungleichmäßige Standverteilung
6. Sportgeräte-Konflikte
7. Verbesserungsmöglichkeiten

Antworte mit JSON:
{
  "konflikte": [
    {
      "typ": "Konflikttyp",
      "beschreibung": "Detailbeschreibung",
      "betroffene": ["Starter IDs"],
      "loesungen": ["Lösungsvorschläge"]
    }
  ],
  "optimierungen": [
    {
      "titel": "Optimierungstitel", 
      "beschreibung": "Was kann verbessert werden",
      "vorschlag": "Konkreter Vorschlag"
    }
  ],
  "score": 85
}`;
    }

    const response = await genAI.models.generateContent({
      model: AI_CONFIG.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = response.text.trim();
    
    // Versuche JSON zu parsen
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          success: true,
          data: jsonData,
          rawResponse: text
        });
      } else {
        throw new Error('Kein JSON gefunden');
      }
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'Gemini Antwort konnte nicht geparst werden',
        rawResponse: text
      }, { status: 500 });
    }

  } catch (error) {
    logError('Gemini API Fehler:', error);
    return NextResponse.json({
      success: false,
      error: `Gemini API Fehler: ${getErrorMessage(error)}. Prüfe API Key und Internetverbindung.`
    }, { status: 500 });
  }
}
