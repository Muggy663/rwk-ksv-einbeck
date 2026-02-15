// src/lib/services/david21-service.ts
// David21 Integration für Meyton Shootmaster Export/Import

export interface David21StartlistEntry {
  startNummer: number;
  nachname: string;
  vorname: string;
  vereinsNummer: number;
  vereinsName: string;
  geburtsjahr: number;
  geschlecht: 'M' | 'W';
  wettkampfklasse: string;
  disziplin: string;
  startzeit?: string;
  klassenId?: number;
  disziplinCode?: string;
  individualWettkampfId?: string;
  stand?: string;
}

export interface David21ResultEntry {
  startNummer: number;
  nachname: string;
  vorname: string;
  vereinsNummer: number;
  ringe: number;
  zehntel: number;
  innerZehner: number;
  schussDetails?: string;
  bemerkung?: string;
}

export class David21Service {
  
  /**
   * Generiert David21/Meyton Startliste im TXT Format
   */
  static generateStartlist(entries: David21StartlistEntry[], wettkampfId: string = 'W111_K72_250831_1400'): string {
    let content = '';
    
    // Meyton Format: Tab-getrennt, Einzelstarter ohne Mannschaften
    const sortedEntries = entries.sort((a, b) => a.startNummer - b.startNummer);
    
    for (const entry of sortedEntries) {
      // Name ohne Umlaute-Konvertierung
      const name = `${entry.nachname}, ${entry.vorname}`;
      
      // Meyton Format mit Klassen-ID an Position 7
      const line = [
        entry.startNummer.toString(),
        `"${name}"`,
        entry.startNummer.toString(),
        '""', // Kein Mannschaftsname
        '0', // Keine Mannschafts-ID
        `"08 ${entry.vereinsName}"`, // Immer 08 vor Verein
        entry.klassenId || '10', // Klassen-ID: 10 = Herren I
        entry.stand || entry.startNummer.toString(), // Stand-Nummer
        '-m',
        entry.disziplinCode || '10110040', // Korrekte Disziplin-Kennzahl
        '-t',
        entry.individualWettkampfId || wettkampfId // Individuelle Wettkampf-ID
      ].join('\t');
      
      content += line + '\r\n';
    }
    
    return content;
  }
  
  /**
   * Generiert David21 Control File (.CTL)
   */
  static generateControlFile(
    wettkampfId: string,
    disziplin: string,
    datum: Date,
    startzeit: string,
    teilnehmerAnzahl: number
  ): string {
    const datumStr = datum.toISOString().slice(0, 10).replace(/-/g, '');
    const zeitStr = startzeit.replace(':', '');
    
    let content = '';
    content += `[WETTKAMPF]\n`;
    content += `ID=${wettkampfId}\n`;
    content += `DISZIPLIN=${disziplin}\n`;
    content += `DATUM=${datumStr}\n`;
    content += `STARTZEIT=${zeitStr}\n`;
    content += `TEILNEHMER=${teilnehmerAnzahl}\n`;
    content += `FORMAT=MEYTON\n`;
    content += `VERSION=1.0\n`;
    content += `\n`;
    content += `[EXPORT]\n`;
    content += `ERSTELLT=${new Date().toISOString()}\n`;
    content += `SOFTWARE=RWK_EINBECK_APP\n`;
    content += `VERSION=0.11.3\n`;
    
    return content;
  }
  
  /**
   * Parst Meyton Ergebnis-Datei (.TXT) - Tab-getrennt
   */
  static parseResults(content: string): David21ResultEntry[] {
    const lines = content.split('\n').filter(line => 
      line.trim() && line.startsWith('MEYT')
    );
    
    const grouped = new Map<number, any[]>();
    
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 7) {
        const startNr = parseInt(parts[3]);
        const ring = parseFloat(parts[6].replace(',', '.'));
        
        if (!grouped.has(startNr)) grouped.set(startNr, []);
        grouped.get(startNr)!.push(ring);
      }
    }
    
    const results: David21ResultEntry[] = [];
    for (const [startNr, schuesse] of grouped) {
      const summe = schuesse.reduce((a, b) => a + b, 0);
      const ringe = Math.floor(summe);
      const zehntel = Math.round((summe - ringe) * 10);
      
      results.push({
        startNummer: startNr,
        nachname: '',
        vorname: '',
        vereinsNummer: 0,
        ringe,
        zehntel,
        innerZehner: schuesse.filter(s => s >= 10.0).length,
        schussDetails: schuesse.map(s => s.toFixed(1)).join(', ')
      });
    }
    
    return results.sort((a, b) => a.startNummer - b.startNummer);
  }
  
  /**
   * Konvertiert KM-Meldungen zu David21 Format
   */
  static convertKMToStartlist(
    meldungen: any[],
    schuetzen: any[],
    vereine: any[],
    disziplinen: any[],
    wettkampfklassen: any[]
  ): David21StartlistEntry[] {
    const entries: David21StartlistEntry[] = [];
    let startNummer = 1;
    
    for (const meldung of meldungen) {
      const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
      const verein = vereine.find(v => v.id === schuetze?.vereinId);
      const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
      const wettkampfklasse = wettkampfklassen.find(w => w.id === meldung.wettkampfklasseId);
      
      if (schuetze && verein && disziplin && wettkampfklasse) {
        entries.push({
          startNummer: startNummer++,
          nachname: schuetze.nachname,
          vorname: schuetze.vorname,
          vereinsNummer: verein.nummer || 99,
          vereinsName: verein.name,
          geburtsjahr: schuetze.geburtsjahr,
          geschlecht: schuetze.geschlecht === 'male' ? 'M' : 'W',
          wettkampfklasse: wettkampfklasse.name,
          disziplin: disziplin.name
        });
      }
    }
    
    return entries;
  }
  
  /**
   * Erstellt Dateiname im David21 Format
   */
  static generateFilename(
    wettkampfId: string,
    disziplinCode: string,
    datum: Date,
    startzeit: string,
    extension: 'TXT' | 'CTL'
  ): string {
    const year = datum.getFullYear().toString().slice(-2);
    const month = (datum.getMonth() + 1).toString().padStart(2, '0');
    const day = datum.getDate().toString().padStart(2, '0');
    const datumStr = `${year}${month}${day}`;
    const zeitStr = startzeit.replace(':', '');
    
    return `${wettkampfId}_${disziplinCode}_${datumStr}_${zeitStr}.${extension}`;
  }
  
  /**
   * Download-Funktion für Browser mit korrektem Encoding
   */
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
    // UTF-8 BOM hinzufügen für korrekte Umlaute
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}
