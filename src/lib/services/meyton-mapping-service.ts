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
  static readonly KLASSEN: MeytonKlasse[] = [
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
  ];

  // Disziplinen-Mapping (wichtigste)
  static readonly DISZIPLINEN = {
    '10110020': 'Luftgewehr 40 Schuss', // K72
    '10210020': 'Luftpistole 40 Schuss', // K20
    '10111020': 'Luftgewehr Auflage 40 Schuss',
    '10211030': 'Luftpistole Auflage 40 Schuss'
  };

  /**
   * Finde Meyton-Klassen-ID basierend auf Altersklasse
   */
  static getKlassenId(altersklasse: string, geschlecht: 'M' | 'W', geburtsjahr: number, saison: number = 2025): number {
    const alter = saison - geburtsjahr;
    const isMale = geschlecht === 'M';
    
    // Direkte Zuordnung basierend auf Altersklasse
    if (altersklasse.includes('Schüler')) return isMale ? 20 : 21;
    if (altersklasse.includes('Jugend')) return isMale ? 30 : 31;
    if (altersklasse.includes('Junioren II')) return isMale ? 42 : 43;
    if (altersklasse.includes('Junioren I')) return isMale ? 40 : 41;
    
    // Senioren (Auflage)
    if (altersklasse.includes('Senioren 0')) return isMale ? 50 : 51;
    if (altersklasse.includes('Senioren I')) return isMale ? 70 : 71;
    if (altersklasse.includes('Senioren II')) return isMale ? 72 : 73;
    if (altersklasse.includes('Senioren III')) return isMale ? 74 : 75;
    if (altersklasse.includes('Senioren IV')) return isMale ? 76 : 77;
    if (altersklasse.includes('Senioren V')) return isMale ? 78 : 79;
    
    // Herren/Damen (Freihand) - Korrekte IDs
    if (altersklasse.includes('Herren I') || altersklasse.includes('Damen I')) {
      return isMale ? 10 : 11; // Herren I / Damen I
    }
    if (altersklasse.includes('Herren II') || altersklasse.includes('Damen II')) return isMale ? 12 : 13;
    if (altersklasse.includes('Herren III') || altersklasse.includes('Damen III')) return isMale ? 14 : 15;
    if (altersklasse.includes('Herren IV') || altersklasse.includes('Damen IV')) return isMale ? 16 : 17;
    
    // Fallback basierend auf Alter
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
   */
  static getDisziplinCode(disziplin: string): string {
    if (disziplin.includes('Luftgewehr') && disziplin.includes('Auflage')) return '10111020';
    if (disziplin.includes('Luftgewehr')) return '10110020';
    if (disziplin.includes('Luftpistole') && disziplin.includes('Auflage')) return '10211030';
    if (disziplin.includes('Luftpistole')) return '10210020';
    return '10110020'; // Fallback
  }
  
  /**
   * Finde Disziplin-Code basierend auf SPO-Nummer
   */
  static getDisziplinCodeBySpoNummer(spoNummer: string): string {
    // Format: [Entfernung][DSB-Regel][Schusszahl]
    // 1=10m, 2=15m, 3=25m, 4=50m, 5=100m, 6=300m, 7=andere
    switch (spoNummer) {
      case '1.10': return '10110040'; // LG Freihand 40 Schuss
      case '1.11': return '10111030'; // LG Auflage 30 Schuss
      case '2.10': return '10210040'; // LP Freihand 40 Schuss
      case '2.11': return '10211030'; // LP Auflage 30 Schuss
      default: return '10110040';
    }
  }
}