// src/lib/services/meyton-mapping-service.ts
// Mapping für Meyton Disziplinen und Klassen

export interface MeytonKlasse {
  id: number;
  name: string;
  minAlter: number;
  maxAlter: number;
  geschlecht: 0 | 1 | 2; // 0=weiblich, 1=männlich, 2=gemischt
}

export class MeytonMappingService {
  
  // Meyton Klassen-Mapping
  static readonly KLASSEN: readonly MeytonKlasse[] = [
    { id: 10, name: 'Herren I', minAlter: 21, maxAlter: 40, geschlecht: 1 },
    { id: 11, name: 'Damen I', minAlter: 21, maxAlter: 40, geschlecht: 0 },
    { id: 12, name: 'Herren II', minAlter: 41, maxAlter: 50, geschlecht: 1 },
    { id: 13, name: 'Damen II', minAlter: 41, maxAlter: 50, geschlecht: 0 },
    { id: 14, name: 'Herren III', minAlter: 51, maxAlter: 60, geschlecht: 1 },
    { id: 15, name: 'Damen III', minAlter: 51, maxAlter: 60, geschlecht: 0 },
    { id: 16, name: 'Herren IV', minAlter: 61, maxAlter: 255, geschlecht: 1 },
    { id: 17, name: 'Damen IV', minAlter: 61, maxAlter: 255, geschlecht: 0 },
    { id: 20, name: 'Schüler männl.', minAlter: 0, maxAlter: 14, geschlecht: 1 },
    { id: 21, name: 'Schüler weibl.', minAlter: 0, maxAlter: 14, geschlecht: 0 },
    { id: 30, name: 'Jugend männl.', minAlter: 15, maxAlter: 16, geschlecht: 1 },
    { id: 31, name: 'Jugend weibl.', minAlter: 15, maxAlter: 16, geschlecht: 0 },
    { id: 40, name: 'Junioren I männl.', minAlter: 19, maxAlter: 20, geschlecht: 1 },
    { id: 41, name: 'Junioren I weibl.', minAlter: 19, maxAlter: 20, geschlecht: 0 },
    { id: 42, name: 'Junioren II männl.', minAlter: 17, maxAlter: 18, geschlecht: 1 },
    { id: 43, name: 'Junioren II weibl.', minAlter: 17, maxAlter: 18, geschlecht: 0 },
    { id: 50, name: 'Senioren 0 männl.', minAlter: 41, maxAlter: 50, geschlecht: 1 },
    { id: 51, name: 'Senioren 0 weibl.', minAlter: 41, maxAlter: 50, geschlecht: 0 },
    { id: 70, name: 'Senioren I männl.', minAlter: 51, maxAlter: 60, geschlecht: 1 },
    { id: 71, name: 'Senioren I weibl.', minAlter: 51, maxAlter: 60, geschlecht: 0 },
    { id: 72, name: 'Senioren II männl.', minAlter: 61, maxAlter: 65, geschlecht: 1 },
    { id: 73, name: 'Senioren II weibl.', minAlter: 61, maxAlter: 65, geschlecht: 0 },
    { id: 74, name: 'Senioren III männl.', minAlter: 66, maxAlter: 70, geschlecht: 1 },
    { id: 75, name: 'Senioren III weibl.', minAlter: 66, maxAlter: 70, geschlecht: 0 },
    { id: 76, name: 'Senioren IV männl.', minAlter: 71, maxAlter: 75, geschlecht: 1 },
    { id: 77, name: 'Senioren IV weibl.', minAlter: 71, maxAlter: 75, geschlecht: 0 },
    { id: 78, name: 'Senioren V männl.', minAlter: 76, maxAlter: 255, geschlecht: 1 },
    { id: 79, name: 'Senioren V weibl.', minAlter: 76, maxAlter: 255, geschlecht: 0 }
  ] as const;

  // Disziplinen-Mapping (wichtigste)
  static readonly DISZIPLINEN = {
    '10110020': 'Luftgewehr 40 Schuss', // K72
    '10210020': 'Luftpistole 40 Schuss', // K20
    '10111020': 'Luftgewehr Auflage 40 Schuss',
    '10211030': 'Luftpistole Auflage 40 Schuss'
  };

  /**
   * Finde Meyton-Klassen-ID basierend auf Altersklasse
   * @throws {Error} Wenn Altersklasse nicht zugeordnet werden kann
   */
  static getKlassenId(altersklasse: string, geschlecht: 'M' | 'W', geburtsjahr: number, saison: number = 2025): number {
    if (!altersklasse || !geschlecht || !geburtsjahr) {
      throw new Error('Ungültige Parameter: altersklasse, geschlecht und geburtsjahr sind erforderlich');
    }
    
    if (geburtsjahr < 1900 || geburtsjahr > saison) {
      throw new Error(`Ungültiges Geburtsjahr: ${geburtsjahr}`);
    }
    
    if (geschlecht !== 'M' && geschlecht !== 'W') {
      throw new Error(`Ungültiges Geschlecht: ${geschlecht}. Erwartet 'M' oder 'W'`);
    }
    
    const alter = saison - geburtsjahr;
    const isMale = geschlecht === 'M';
    
    // Direkte Zuordnung basierend auf Altersklasse
    const klassenId = this.getKlassenIdByAltersklasse(altersklasse, isMale);
    if (klassenId !== null) return klassenId;
    
    // Fallback basierend auf Alter
    return this.getKlassenIdByAge(alter, isMale);
  }
  
  private static getKlassenIdByAltersklasse(altersklasse: string, isMale: boolean): number | null {
    const klassenMap: Record<string, [number, number]> = {
      'Schüler': [20, 21],
      'Jugend': [30, 31],
      'Junioren II': [42, 43],
      'Junioren I': [40, 41],
      'Senioren 0': [50, 51],
      'Senioren I': [70, 71],
      'Senioren II': [72, 73],
      'Senioren III': [74, 75],
      'Senioren IV': [76, 77],
      'Senioren V': [78, 79],
      'Herren I': [10, 11],
      'Damen I': [10, 11],
      'Herren II': [12, 13],
      'Damen II': [12, 13],
      'Herren III': [14, 15],
      'Damen III': [14, 15],
      'Herren IV': [16, 17],
      'Damen IV': [16, 17]
    };
    
    for (const [key, [maleId, femaleId]] of Object.entries(klassenMap)) {
      if (altersklasse.includes(key)) {
        return isMale ? maleId : femaleId;
      }
    }
    
    return null;
  }
  
  private static getKlassenIdByAge(alter: number, isMale: boolean): number {
    if (typeof alter !== 'number' || isNaN(alter) || alter < 0) {
      throw new Error(`Ungültiges Alter: ${alter}`);
    }
    
    if (alter <= 14) return isMale ? 20 : 21;
    if (alter <= 16) return isMale ? 30 : 31;
    if (alter <= 18) return isMale ? 42 : 43;
    if (alter <= 20) return isMale ? 40 : 41;
    if (alter <= 40) return isMale ? 10 : 11;
    if (alter <= 50) return isMale ? 12 : 13;
    if (alter <= 60) return isMale ? 14 : 15;
    return isMale ? 16 : 17;
  }

  /**
   * Finde Disziplin-Code basierend auf Disziplin-Name
   * @throws {Error} Wenn Disziplin ungültig ist
   */
  static getDisziplinCode(disziplin: string): string {
    if (!disziplin || typeof disziplin !== 'string') {
      throw new Error('Ungültige Disziplin: String erwartet');
    }
    
    const normalized = disziplin.toLowerCase().trim();
    
    if (!normalized) {
      throw new Error('Disziplin darf nicht leer sein');
    }
    
    if (normalized.includes('luftgewehr') && normalized.includes('auflage')) return '10111020';
    if (normalized.includes('luftgewehr')) return '10110020';
    if (normalized.includes('luftpistole') && normalized.includes('auflage')) return '10211030';
    if (normalized.includes('luftpistole')) return '10210020';
    
    throw new Error(`Unbekannte Disziplin: ${disziplin}`);
  }
  
  /**
   * Finde Disziplin-Code basierend auf SPO-Nummer
   */
  static getDisziplinCodeBySpoNummer(spoNummer: string): string {
    if (!spoNummer) return '10110040';
    
    switch (spoNummer) {
      case '1.10': return '10110040';
      case '1.11': return '10111030';
      case '2.10': return '10210040';
      case '2.11': return '10211030';
      default: return '10110040';
    }
  }
}
