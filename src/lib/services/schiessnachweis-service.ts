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

  // Wartet auf die Auth-Initialisierung und liefert die aktuelle User-ID (oder null).
  private static async waitForUid(timeoutMs = 2000): Promise<string | null> {
    const { auth } = await import('@/lib/firebase/config');
    if (auth.currentUser) return auth.currentUser.uid;
    const user = await new Promise<{ uid: string } | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), timeoutMs);
      const unsubscribe = auth.onAuthStateChanged((u) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve(u);
      });
    });
    return user?.uid ?? null;
  }

  // Entfernt undefined-Werte (Firestore erlaubt kein undefined).
  private static clean(eintrag: any): any {
    const c: any = {};
    Object.entries(eintrag).forEach(([key, value]) => {
      if (value !== undefined) c[key] = value;
    });
    return c;
  }

  // Rohdaten (Firestore) → SchießEintrag mit echten Date-Objekten.
  private static fromRaw(raw: any): SchießEintrag {
    const datum = this.convertToDate(raw.datum);
    const createdAt = this.convertToDate(raw.createdAt, datum);
    return { ...raw, datum, createdAt } as SchießEintrag;
  }

  /**
   * Migriert bei Bedarf das alte Datenmodell (alle Einträge in EINEM Dokument
   * schiessnachweis_data/{uid} als Array 'einträge') in das neue Modell
   * (ein Dokument pro Eintrag in der Subcollection .../eintraege/{id}).
   *
   * Grund: Ein einzelnes Dokument ist auf 1 MB begrenzt – bei vielen Einträgen
   * würde das Speichern irgendwann fehlschlagen. Einzeldokumente skalieren
   * unbegrenzt. Die Migration läuft automatisch beim ersten Zugriff pro Nutzer,
   * genau einmal (danach ist das Array geleert und ein Flag gesetzt), und
   * verliert keine Daten.
   */
  private static async migrateIfNeeded(uid: string): Promise<void> {
    const { db } = await import('@/lib/firebase/config');
    const { doc, getDoc, collection, writeBatch } = await import('firebase/firestore');

    const parentRef = doc(db, 'schiessnachweis_data', uid);
    const parentSnap = await getDoc(parentRef);
    if (!parentSnap.exists()) return; // Nichts Altes vorhanden.

    const data = parentSnap.data() as any;
    const legacy = Array.isArray(data?.einträge) ? data.einträge : [];
    if (data?.migratedToSubcollection === true || legacy.length === 0) {
      return; // Bereits migriert oder nichts zu migrieren.
    }

    logDebug(`🔄 Migriere ${legacy.length} Schießnachweis-Einträge in Einzeldokumente …`);
    const subRef = collection(db, 'schiessnachweis_data', uid, 'eintraege');

    // In Firestore-Batches (max. 500 Operationen) schreiben.
    // WICHTIG für Idempotenz: Als Dokument-ID wird die vorhandene eintrag.id
    // verwendet. Fehlt sie ausnahmsweise, wird eine DETERMINISTISCHE Ersatz-ID
    // aus der Array-Position gebildet (nicht Zufall) – so schreibt ein
    // Wiederholungslauf (nach Abbruch oder parallel auf zwei Geräten) dasselbe
    // Dokument erneut, statt ein Duplikat anzulegen.
    for (let i = 0; i < legacy.length; i += 450) {
      const batch = writeBatch(db);
      legacy.slice(i, i + 450).forEach((eintrag: any, offset: number) => {
        const index = i + offset;
        const id = (eintrag && eintrag.id) ? String(eintrag.id) : `legacy_${index}`;
        batch.set(doc(subRef, id), this.clean({ ...eintrag, id }));
      });
      await batch.commit();
    }

    // Legacy-Array leeren und Migration markieren (Daten bleiben als Einzeldocs erhalten).
    const finalBatch = writeBatch(db);
    finalBatch.set(parentRef, { einträge: [], migratedToSubcollection: true, migratedAt: new Date() }, { merge: true });
    await finalBatch.commit();
    logDebug('✅ Migration abgeschlossen.');
  }

  static async getEinträge(): Promise<SchießEintrag[]> {
    if (typeof window === 'undefined') return [];

    try {
      const uid = await this.waitForUid();
      if (!uid) {
        logDebug('⚠️ Benutzer nicht angemeldet - keine Daten verfügbar');
        return [];
      }

      const { db } = await import('@/lib/firebase/config');
      const { doc, getDoc, collection, getDocs } = await import('firebase/firestore');

      // Alte Array-Daten bei Bedarf einmalig in Einzeldokumente migrieren.
      // Schlägt die Migration fehl (Netz/Rechte), NICHT leer zurückgeben,
      // sondern das noch vorhandene Legacy-Array als Fallback lesen – sonst
      // würde die UI fälschlich „keine Einträge" zeigen, obwohl Daten da sind.
      try {
        await this.migrateIfNeeded(uid);
      } catch (migErr) {
        logError('Migration fehlgeschlagen, lese Legacy-Array als Fallback:', migErr);
        const parentSnap = await getDoc(doc(db, 'schiessnachweis_data', uid));
        const legacy = parentSnap.exists() ? ((parentSnap.data() as any)?.einträge || []) : [];
        return (legacy as any[]).map((e) => this.fromRaw(e));
      }

      const subRef = collection(db, 'schiessnachweis_data', uid, 'eintraege');
      const snap = await getDocs(subRef);

      const einträge = snap.docs.map((d) => this.fromRaw({ ...d.data(), id: d.id }));
      logDebug(`✅ ${einträge.length} Einträge aus Datenbank geladen`);
      return einträge;
    } catch (error) {
      logError('Fehler beim Laden der Einträge aus Datenbank:', error);
      return [];
    }
  }

  // Liefert die Referenz auf die Einträge-Subcollection des angemeldeten Users
  // und stellt sicher, dass eine evtl. nötige Legacy-Migration gelaufen ist.
  private static async requireSubcollection() {
    const uid = await this.waitForUid();
    if (!uid) {
      throw new Error('❌ Sie müssen angemeldet sein, um Einträge zu speichern.\n\nBitte melden Sie sich an unter /schiessnachweis/login');
    }
    await this.migrateIfNeeded(uid);
    const { db } = await import('@/lib/firebase/config');
    const { collection } = await import('firebase/firestore');
    return { uid, db, subRef: collection(db, 'schiessnachweis_data', uid, 'eintraege') };
  }

  static async saveEintrag(eintrag: Omit<SchießEintrag, 'id' | 'createdAt'>): Promise<SchießEintrag> {
    const neuerEintrag: SchießEintrag = {
      ...eintrag,
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };

    const { subRef } = await this.requireSubcollection();
    const { doc, setDoc } = await import('firebase/firestore');
    // Ein Dokument pro Eintrag – umgeht das 1-MB-Limit und vermeidet Lost Updates.
    await setDoc(doc(subRef, neuerEintrag.id), this.clean(neuerEintrag));
    logDebug('💾 Schießnachweis-Eintrag gespeichert');
    return neuerEintrag;
  }

  static async updateEintrag(id: string, updates: Partial<Omit<SchießEintrag, 'id' | 'createdAt'>>): Promise<SchießEintrag | null> {
    const { subRef } = await this.requireSubcollection();
    const { doc, getDoc, updateDoc } = await import('firebase/firestore');
    const ref = doc(subRef, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    await updateDoc(ref, this.clean(updates));
    const updated = await getDoc(ref);
    return this.fromRaw({ ...updated.data(), id });
  }

  static async deleteEintrag(id: string): Promise<void> {
    const { subRef } = await this.requireSubcollection();
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(subRef, id));
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

      const { db, subRef } = await this.requireSubcollection();
      const { doc, writeBatch } = await import('firebase/firestore');

      // Vorhandene Einträge zur Duplikat-Erkennung laden.
      const vorhandene = await this.getEinträge();

      // Neue (nicht-doppelte) Einträge sammeln.
      const neue = importedEinträge.filter((imported: any) => {
        const importDatum = new Date(imported.datum);
        return !vorhandene.some(existing =>
          existing.datum.getTime() === importDatum.getTime() &&
          existing.disziplin === imported.disziplin &&
          existing.ergebnis === imported.ergebnis
        );
      });

      // In Firestore-Batches (max. 500 Operationen) schreiben.
      for (let i = 0; i < neue.length; i += 450) {
        const batch = writeBatch(db);
        for (const imported of neue.slice(i, i + 450)) {
          const id = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
          const eintrag = this.clean({
            ...imported,
            id,
            datum: new Date(imported.datum),
            createdAt: new Date(imported.createdAt || imported.datum),
          });
          batch.set(doc(subRef, id), eintrag);
        }
        await batch.commit();
      }

      return neue.length;
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

}