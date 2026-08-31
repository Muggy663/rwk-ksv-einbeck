// src/app/api/km/david21-export/route.ts
// API Route für David21 Export

import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { David21Service } from '@/lib/services/david21-service';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startlisteId, wettkampfId, datum, startzeit } = body;

    if (!startlisteId) {
      return NextResponse.json(
        { success: false, error: 'Startliste-ID erforderlich' },
        { status: 400 }
      );
    }

    // Lade gespeicherte Startliste und Vereine direkt aus Firestore
    const [startlisteDoc, vereineSnapshot] = await Promise.all([
      adminDb.collection('km_startlisten_v2').doc(startlisteId).get(),
      adminDb.collection('clubs').get()
    ]);
    
    if (!startlisteDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Startliste nicht gefunden' },
        { status: 404 }
      );
    }
    
    const startliste = { id: startlisteDoc.id, ...startlisteDoc.data() };
    const vereine = {};
    vereineSnapshot.docs.forEach(doc => {
      vereine[doc.id] = doc.data().name;
    });

    if (!startliste || !startliste.startliste) {
      return NextResponse.json(
        { success: false, error: 'Startliste hat keine Daten' },
        { status: 404 }
      );
    }

    // Lade Schützen-Daten, Disziplinen und Altersklassen
    const [schuetzenSnapshot, disziplinenSnapshot, altersklassenSnapshot] = await Promise.all([
      adminDb.collection('shooters').get(),
      adminDb.collection('km_disziplinen').get(),
      adminDb.collection('km_altersklassen').get()
    ]);
    
    const schuetzenMap = {};
    schuetzenSnapshot.docs.forEach(doc => {
      const data = doc.data();
      schuetzenMap[data.name] = {
        gender: data.gender,
        birthYear: data.birthYear,
        mitgliedsnummer: data.mitgliedsnummer
      };
    });
    
    const disziplinenMap = {};
    disziplinenSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Erstelle Map für alle Schusszahlen einer Disziplin
      if (data.schusszahlen && Array.isArray(data.schusszahlen)) {
        data.schusszahlen.forEach(schuss => {
          if (schuss.kennziffer) {
            const key = `${data.name}_${schuss.schusszahl}_${schuss.altersklassen?.join('_') || 'alle'}`;
            disziplinenMap[key] = {
              spoNummer: data.spoNummer,
              kennziffer: schuss.kennziffer
            };
          }
        });
      }
      // Fallback: Erste Kennziffer als Standard
      if (!disziplinenMap[data.name] && data.schusszahlen?.[0]?.kennziffer) {
        disziplinenMap[data.name] = {
          spoNummer: data.spoNummer,
          kennziffer: data.schusszahlen[0].kennziffer
        };
      }
    });
    
    const altersklassenMap = {};
    altersklassenSnapshot.docs.forEach(doc => {
      const data = doc.data();
      altersklassenMap[`${data.minAlter}-${data.maxAlter}-${data.geschlecht}`] = data.klassenId;
    });
    
    // Konvertiere Startliste zu David21 Format
    const startlistEntries = startliste.startliste.map((starter: any, index: number) => {
      // Echte Schützen-Daten laden
      const schuetze = schuetzenMap[starter.name];
      
      // Verwende echte firstName/lastName falls vorhanden, sonst Name aufteilen
      const vorname = schuetze?.firstName || starter.name?.split(' ').slice(0, -1).join(' ') || 'Max';
      const nachname = schuetze?.lastName || starter.name?.split(' ').slice(-1)[0] || 'Mustermann';
      const geschlecht = schuetze?.gender === 'female' ? 'W' : 'M';
      const geburtsjahr = schuetze?.birthYear || 1990;
      const alter = 2026 - geburtsjahr;
      
      // Korrekte Klassen-ID basierend auf Alter und Geschlecht
      let klassenId = 10; // Default Herren I
      const istWeiblich = geschlecht === 'W';
      
      if (alter <= 14) klassenId = istWeiblich ? 21 : 20; // Schüler
      else if (alter <= 16) klassenId = istWeiblich ? 31 : 30; // Jugend
      else if (alter <= 18) klassenId = istWeiblich ? 43 : 42; // Junioren II
      else if (alter <= 20) klassenId = istWeiblich ? 41 : 40; // Junioren I
      else if (alter <= 40) klassenId = istWeiblich ? 11 : 10; // Herren/Damen I
      else if (alter <= 50) klassenId = istWeiblich ? 13 : 12; // Herren/Damen II
      else if (alter <= 60) klassenId = istWeiblich ? 15 : 14; // Herren/Damen III
      else klassenId = istWeiblich ? 17 : 16; // Herren/Damen IV
      
      // Korrekte Disziplin-Codes aus Datenbank - KEIN Default!
      const disziplinName = starter.disziplin || starter.discipline;
      
      // Bestimme Schusszahl basierend auf Altersklasse
      let schusszahl = 40; // Default Erwachsene
      if (alter <= 14) schusszahl = 20; // Schüler
      else if (alter <= 16) schusszahl = 20; // Jugend
      else if (alter <= 18) schusszahl = 40; // Junioren
      else schusszahl = 40; // Erwachsene/Senioren
      
      // Suche passende Kennziffer für Disziplin + Schusszahl
      let disziplinData = null;
      
      // Erst nach exakter Schusszahl suchen
      for (const [key, data] of Object.entries(disziplinenMap)) {
        if (key.includes(disziplinName) && key.includes(`_${schusszahl}_`)) {
          disziplinData = data;
          break;
        }
      }
      
      // Fallback: Erste passende Disziplin
      if (!disziplinData) {
        disziplinData = disziplinenMap[disziplinName];
      }
      
      if (!disziplinData?.kennziffer) {
        throw new Error(`Keine Kennziffer für Disziplin "${disziplinName}" mit ${schusszahl} Schuss gefunden. Bitte in Disziplinen-Verwaltung konfigurieren.`);
      }
      const disziplinCode = disziplinData.kennziffer;
      
      return {
        startNummer: index + 1,
        nachname: nachname,
        vorname: vorname,
        vereinsNummer: 1,
        vereinsName: starter.verein || 'SGi Einbeck e.V.',
        geburtsjahr: geburtsjahr,
        geschlecht: geschlecht,
        wettkampfklasse: starter.altersklasse || 'Herren I',
        disziplin: starter.disziplin || 'Luftgewehr',
        klassenId: klassenId,
        disziplinCode: disziplinCode,
        stand: starter.stand || (index + 1).toString()
      };
    });

    // Generiere kurze Wettkampf-ID im Format W111_K10_YYMMDD_HHMM
    const datumObj = new Date(datum);
    const year = datumObj.getFullYear().toString().slice(-2);
    const month = (datumObj.getMonth() + 1).toString().padStart(2, '0');
    const day = datumObj.getDate().toString().padStart(2, '0');
    const time = startzeit.replace(':', '');
    const korrekteWettkampfId = `W111_K10_${year}${month}${day}_${time}`;
    
    // Kurzer Dateiname für Linux-Kompatibilität
    const kurzeWettkampfId = `KM${year}${month}${day}`;
    
    // Generiere TXT Datei
    const txtContent = David21Service.generateStartlist(startlistEntries, korrekteWettkampfId);
    
    // Generiere CTL Datei - verwende erste Disziplin aus Startliste
    const ersteDisziplin = startliste.startliste[0]?.disziplin || 'Luftgewehr';
    const spoNummer = ersteDisziplin.includes('Luftgewehr') ? '1.10' : 
                     ersteDisziplin.includes('Pistole') ? '2.10' : '1.10';
    const ctlContent = David21Service.generateControlFile(
      wettkampfId,
      spoNummer,
      new Date(datum),
      startzeit,
      startlistEntries.length
    );

    // Kurze Dateinamen generieren für Linux
    const baseFilename = `${kurzeWettkampfId}_${spoNummer.replace('.', '')}_${time}.TXT`;

    return NextResponse.json({
      success: true,
      files: {
        txt: {
          filename: baseFilename,
          content: txtContent
        },
        ctl: {
          filename: baseFilename.replace('.TXT', '.CTL'),
          content: ctlContent
        }
      },
      teilnehmerAnzahl: startlistEntries.length
    });

  } catch (error) {
    logError('David21 Export Error:', error);
    return NextResponse.json(
      { success: false, error: 'Export fehlgeschlagen' },
      { status: 500 }
    );
  }
}
