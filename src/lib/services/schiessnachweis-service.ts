import { SchießEintrag, SchießStatistik } from '@/types/schiessnachweis';
import { logError, logDebug } from '@/lib/utils/secure-logger';

export class SchießnachweisService {
  private static convertToDate(value: any, fallback?: Date): Date {
    if (value && typeof value === 'object' && value.seconds) {
      return new Date(value.seconds * 1000);
    } else if (value && value.toDate) {
      return value.toDate();
    } else {
      const date = new Date(value || fallback);
      return isNaN(date.getTime()) ? (fallback || new Date()) : date;
    }
  }

  static async getEinträge(): Promise<SchießEintrag[]> {
    if (typeof window === 'undefined') return [];
    
    try {
      const { auth, db } = await import('@/lib/firebase/config');
      
      // Warte auf Auth-Initialisierung
      if (!auth.currentUser) {
        await new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
          });
        });
      }
      
      if (!auth.currentUser) {
        logDebug('⚠️ Benutzer nicht angemeldet - keine Daten verfügbar');
        return [];
      }
      
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'schiessnachweis_data', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        logDebug('📝 Keine Schießnachweis-Daten für User:', auth.currentUser.uid);
        return [];
      }
      
      const data = docSnap.data();
      const einträge = (data.einträge || []).map((eintrag: any) => {
        const datum = this.convertToDate(eintrag.datum);
        const createdAt = this.convertToDate(eintrag.createdAt, datum);
        
        return {
          ...eintrag,
          datum,
          createdAt
        };
      });
      
      logDebug(`✅ ${einträge.length} Einträge aus Datenbank geladen`);
      return einträge;
    } catch (error) {
      logError('Fehler beim Laden der Einträge aus Datenbank:', error);
      return [];
    }
  }

  static async saveEintrag(eintrag: Omit<SchießEintrag, 'id' | 'createdAt'>): Promise<SchießEintrag> {
    // Prüfe Auth-Status
    const { auth } = await import('@/lib/firebase/config');
    
    if (!auth.currentUser) {
      // Warte kurz auf Auth-Initialisierung
      await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 2000);
        const unsubscribe = auth.onAuthStateChanged((user) => {
          clearTimeout(timeout);
          unsubscribe();
          resolve(user);
        });
      });
    }
    
    if (!auth.currentUser) {
      throw new Error('❌ Sie müssen angemeldet sein, um Einträge zu speichern.\n\nBitte melden Sie sich an unter /schiessnachweis/login');
    }
    
    const neuerEintrag: SchießEintrag = {
      ...eintrag,
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };

    const einträge = await this.getEinträge();
    einträge.push(neuerEintrag);
    
    await this.saveToDatabase(einträge);
    
    return neuerEintrag;
  }

  static async updateEintrag(id: string, updates: Partial<Omit<SchießEintrag, 'id' | 'createdAt'>>): Promise<SchießEintrag | null> {
    const einträge = await this.getEinträge();
    const index = einträge.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    einträge[index] = { ...einträge[index], ...updates };
    
    await this.saveToDatabase(einträge);
    
    return einträge[index];
  }

  static async deleteEintrag(id: string): Promise<void> {
    const einträge = (await this.getEinträge()).filter(e => e.id !== id);
    
    await this.saveToDatabase(einträge);
  }
  
  private static async saveToDatabase(einträge: SchießEintrag[]): Promise<void> {
    try {
      const { auth, db } = await import('@/lib/firebase/config');
      
      if (!auth.currentUser) {
        throw new Error('Benutzer nicht angemeldet');
      }
      
      const { doc, setDoc } = await import('firebase/firestore');
      
      // Entferne undefined Werte für Firebase
      const cleanedEinträge = einträge.map(eintrag => {
        const cleaned: any = {};
        Object.entries(eintrag).forEach(([key, value]) => {
          if (value !== undefined) {
            cleaned[key] = value;
          }
        });
        return cleaned;
      });
      
      const cloudData = {
        einträge: cleanedEinträge,
        lastModified: new Date(),
        deviceId: this.getDeviceId()
      };
      
      await setDoc(doc(db, 'schiessnachweis_data', auth.currentUser.uid), cloudData);
      logDebug(`💾 ${einträge.length} Einträge in Datenbank gespeichert`);
    } catch (error) {
      logError('Speichern in Datenbank fehlgeschlagen:', error);
      throw error;
    }
  }
  
  static async getStatistik(): Promise<SchießStatistik> {
    try {
      const einträge = await this.getEinträge();
      
      if (einträge.length === 0) {
        return {
          totalSchüsse: 0,
          totalTrainings: 0,
          totalWettkämpfe: 0,
          durchschnittErgebnis: 0,
          bestesErgebnis: 0,
          letzteAktivität: null
        };
      }

      const totalSchüsse = einträge.reduce((sum, e) => sum + e.schussAnzahl, 0);
      const totalTrainings = einträge.filter(e => e.typ === 'training').length;
      const totalWettkämpfe = einträge.filter(e => e.typ === 'wettkampf').length;

      // Durchschnitt pro Eintrag (Ringe pro Schuss, für Vergleichbarkeit)
      const ergebnisse = einträge.map(e => e.ergebnis / e.schussAnzahl); // Ringe pro Schuss
      const durchschnittErgebnis = ergebnisse.reduce((sum, e) => sum + e, 0) / ergebnisse.length;
      const bestesErgebnis = Math.max(...ergebnisse);
      const letzteAktivität = new Date(Math.max(...einträge.map(e => e.datum.getTime())));

      return {
        totalSchüsse,
        totalTrainings,
        totalWettkämpfe,
        durchschnittErgebnis: Math.round(durchschnittErgebnis * 10) / 10,
        bestesErgebnis,
        letzteAktivität
      };
    } catch (error) {
      logError('Fehler beim Berechnen der Statistik:', error);
      return {
        totalSchüsse: 0,
        totalTrainings: 0,
        totalWettkämpfe: 0,
        durchschnittErgebnis: 0,
        bestesErgebnis: 0,
        letzteAktivität: null
      };
    }
  }

  static async exportData(): Promise<string> {
    const einträge = await this.getEinträge();
    return JSON.stringify(einträge, null, 2);
  }

  static async importData(rawData: string): Promise<number> {
    try {
      // BOM entfernen, falls vorhanden
      const data = rawData.replace(/^\uFEFF/, '').trim();

      if (!data) {
        throw new Error('Die Datei ist leer.');
      }

      // Format automatisch erkennen: JSON (beginnt mit [ oder {) oder CSV
      const isJson = data.startsWith('[') || data.startsWith('{');
      const importedEinträge = isJson ? JSON.parse(data) : this.parseCSV(data);

      if (!Array.isArray(importedEinträge)) {
        throw new Error('Kein gültiges Datenformat erkannt.');
      }

      const existingEinträge = await this.getEinträge();

      // Merge und Duplikate vermeiden
      const allEinträge = [...existingEinträge];
      let importCount = 0;

      importedEinträge.forEach((imported: any) => {
        const importDatum = new Date(imported.datum);
        const exists = allEinträge.some(existing =>
          existing.datum.getTime() === importDatum.getTime() &&
          existing.disziplin === imported.disziplin &&
          existing.ergebnis === imported.ergebnis
        );

        if (!exists) {
          allEinträge.push({
            ...imported,
            id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9),
            datum: importDatum,
            createdAt: new Date(imported.createdAt || imported.datum)
          });
          importCount++;
        }
      });

      await this.saveToDatabase(allEinträge);
      return importCount;
    } catch (error) {
      logError('Fehler beim Importieren der Daten:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ungültiges Datenformat';
      throw new Error(`Import fehlgeschlagen: ${errorMessage}`);
    }
  }

  /**
   * Parst eine CSV-Datei im Format des eigenen Exports (Semikolon-getrennt,
   * Werte in Anführungszeichen, deutsche Zahlenformatierung mit Komma).
   */
  private static parseCSV(csv: string): Partial<SchießEintrag>[] {
    const lines = csv.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length < 2) {
      throw new Error('CSV enthält keine Datenzeilen.');
    }

    const parseLine = (line: string): string[] => {
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"'; // Escapetes Anführungszeichen
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ';' && !inQuotes) {
          fields.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current);
      return fields.map(f => f.trim());
    };

    const headers = parseLine(lines[0]);
    const colIndex = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

    const idxDatum = colIndex('Datum');
    const idxTyp = colIndex('Typ');
    const idxDisziplin = colIndex('Disziplin');
    const idxSchuss = colIndex('Schussanzahl');
    const idxGanzeRinge = colIndex('Ergebnis_Ganze_Ringe');
    const idxGesamt = colIndex('Ergebnis_Gesamt');
    const idxStandort = colIndex('Standort');
    const idxSchiessstand = colIndex('Schießstand');
    const idxWetter = colIndex('Wetter');
    const idxMunition = colIndex('Munition');
    const idxWaffe = colIndex('Waffe');
    const idxNotizen = colIndex('Notizen');

    if (idxDatum === -1 || idxDisziplin === -1) {
      throw new Error('CSV-Format nicht erkannt (Spalten "Datum"/"Disziplin" fehlen).');
    }

    // Deutsches Datum (dd.MM.yyyy) in Date umwandeln
    const parseDate = (value: string): Date => {
      const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
      if (match) {
        const [, d, m, y] = match;
        const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
        return new Date(year, parseInt(m) - 1, parseInt(d));
      }
      const fallback = new Date(value);
      return isNaN(fallback.getTime()) ? new Date() : fallback;
    };

    // Deutsche Zahl (Komma als Dezimaltrenner) in number umwandeln
    const parseNum = (value: string): number => {
      if (!value) return 0;
      const n = parseFloat(value.replace(/\./g, '').replace(',', '.'));
      return isNaN(n) ? 0 : n;
    };

    const get = (fields: string[], idx: number) => (idx >= 0 && idx < fields.length ? fields[idx] : '');

    return lines.slice(1).map(line => {
      const fields = parseLine(line);
      const typRaw = get(fields, idxTyp).toLowerCase();
      const ganzeRinge = parseNum(get(fields, idxGanzeRinge));
      const gesamt = parseNum(get(fields, idxGesamt));

      return {
        datum: parseDate(get(fields, idxDatum)),
        typ: typRaw === 'wettkampf' ? 'wettkampf' : 'training',
        disziplin: get(fields, idxDisziplin),
        schussAnzahl: parseNum(get(fields, idxSchuss)),
        ergebnis: gesamt || ganzeRinge,
        ergebnisGanzeRinge: ganzeRinge || undefined,
        standort: get(fields, idxStandort),
        schiessstand: get(fields, idxSchiessstand) || undefined,
        wetter: get(fields, idxWetter) || undefined,
        munition: get(fields, idxMunition) || undefined,
        waffe: get(fields, idxWaffe) || undefined,
        notizen: get(fields, idxNotizen) || undefined,
      } as Partial<SchießEintrag>;
    });
  }
  
  static async refreshData(): Promise<SchießEintrag[]> {
    return await this.getEinträge();
  }
  
  static async exportToCSV(): Promise<string> {
    const einträge = await this.getEinträge();
    
    if (einträge.length === 0) {
      return 'Keine Daten zum Exportieren vorhanden';
    }
    
    // CSV Header mit deutscher Formatierung
    const headers = [
      'Datum',
      'Typ',
      'Disziplin',
      'Schussanzahl',
      'Ergebnis_Ganze_Ringe',
      'Ergebnis_Zehntel_Ringe',
      'Ergebnis_Gesamt',
      'Durchschnitt_pro_Schuss',
      'Standort',
      'Schießstand',
      'Wetter',
      'Munition',
      'Waffe',
      'Serien',
      'Notizen'
    ];
    
    const sanitizeRegex = /[<>"'&]/g;
    
    // CSV Zeilen erstellen
    const rows = einträge.map(eintrag => {
      const zehntelRinge = eintrag.ergebnis && eintrag.ergebnisGanzeRinge ? 
        (eintrag.ergebnis - eintrag.ergebnisGanzeRinge) : 0;
      
      const durchschnitt = eintrag.ergebnis && eintrag.schussAnzahl ? 
        (eintrag.ergebnis / eintrag.schussAnzahl) : 0;
      
      // Serien-Information formatieren
      const serienInfo = eintrag.serien && eintrag.serien.length > 0 ? 
        eintrag.serien.map(s => `Serie ${s.serienNummer}: ${s.summe.toLocaleString('de-DE')}`).join('; ') : 
        'Keine Serien';
      
      return [
        eintrag.datum.toLocaleDateString('de-DE'),
        eintrag.typ,
        eintrag.disziplin,
        eintrag.schussAnzahl.toString(),
        (eintrag.ergebnisGanzeRinge || 0).toString(),
        zehntelRinge.toString().replace('.', ','), // Deutsche Formatierung mit Komma
        (eintrag.ergebnis || 0).toString().replace('.', ','), // Deutsche Formatierung
        durchschnitt.toString().replace('.', ','),
        (eintrag.standort || '').replace(sanitizeRegex, ''),
        (eintrag.schiessstand || '').replace(sanitizeRegex, ''),
        (eintrag.wetter || '').replace(sanitizeRegex, ''),
        (eintrag.munition || '').replace(sanitizeRegex, ''),
        (eintrag.waffe || '').replace(sanitizeRegex, ''),
        serienInfo.replace(sanitizeRegex, ''),
        (eintrag.notizen || '').replace(sanitizeRegex, '')
      ].map(field => `"${field.toString().replace(/"/g, '""')}"`); // CSV-Escaping
    });
    
    // CSV zusammenfügen (CRLF für maximale Excel-Kompatibilität)
    const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');
    
    // UTF-8 BOM voranstellen, damit Excel Umlaute (ä, ö, ü, ß) korrekt darstellt
    return '\uFEFF' + csvContent;
  }

  // Hilfsfunktion für Device-ID
  private static getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let deviceId = localStorage.getItem('schiessnachweis_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('schiessnachweis_device_id', deviceId);
    }
    return deviceId;
  }
}