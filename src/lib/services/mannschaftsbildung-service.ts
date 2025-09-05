export class MannschaftsbildungService {
  
  /**
   * Lädt die aktuellen Mannschaftsregeln
   */
  static async loadRegeln() {
    try {
      const response = await fetch('/api/km/mannschaftsregeln');
      if (response.ok) {
        const data = await response.json();
        return data.regeln;
      }
    } catch (error) {
      console.error('Fehler beim Laden der Mannschaftsregeln:', error);
    }
    return null;
  }

  /**
   * Prüft ob zwei Schützen in einer Mannschaft zusammen dürfen
   */
  static async kannZusammenSpielen(schuetze1: any, schuetze2: any, disziplin: string) {
    const regeln = await this.loadRegeln();
    if (!regeln) return true; // Fallback: erlauben wenn keine Regeln

    const disziplinRegel = regeln.disziplinRegeln?.[disziplin];
    if (!disziplinRegel || !disziplinRegel.aktiv) {
      return false; // Keine Mannschaften für diese Disziplin
    }

    const erlaubteKombinationen = disziplinRegel.erlaubteKombinationen || [];
    
    // Prüfe alle erlaubten Kombinationen
    for (const kombinationName of erlaubteKombinationen) {
      const kombination = regeln.altersklassenKombinationen[kombinationName];
      if (kombination && 
          kombination.includes(schuetze1.altersklasse) && 
          kombination.includes(schuetze2.altersklasse)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Validiert eine komplette Mannschaft
   */
  static async validateMannschaft(schuetzen: any[], disziplin: string) {
    const regeln = await this.loadRegeln();
    const errors: string[] = [];
    
    if (!regeln) {
      return { valid: true, errors: [] };
    }

    // Grundregeln prüfen
    if (schuetzen.length !== regeln.mannschaftsgroesse) {
      errors.push(`Mannschaft muss ${regeln.mannschaftsgroesse} Schützen haben`);
    }

    // Disziplin-Regel prüfen
    const disziplinRegel = regeln.disziplinRegeln?.[disziplin];
    if (!disziplinRegel || !disziplinRegel.aktiv) {
      errors.push('Für diese Disziplin sind keine Mannschaften erlaubt');
      return { valid: false, errors };
    }

    // Altersklassen-Kompatibilität prüfen
    for (let i = 0; i < schuetzen.length; i++) {
      for (let j = i + 1; j < schuetzen.length; j++) {
        const kannZusammen = await this.kannZusammenSpielen(schuetzen[i], schuetzen[j], disziplin);
        if (!kannZusammen) {
          errors.push(`${schuetzen[i].altersklasse} und ${schuetzen[j].altersklasse} dürfen nicht zusammen`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gibt alle möglichen Mannschaftskombinationen für eine Disziplin zurück
   */
  static async getMoeglicheMannschaften(schuetzen: any[], disziplin: string) {
    const regeln = await this.loadRegeln();
    if (!regeln) return [];

    const disziplinRegel = regeln.disziplinRegeln?.[disziplin];
    if (!disziplinRegel || !disziplinRegel.aktiv) {
      return []; // Keine Mannschaften für diese Disziplin
    }

    const mannschaftsgroesse = regeln.mannschaftsgroesse;
    const moeglicheMannschaften = [];

    // Generiere alle möglichen Kombinationen
    const kombinationen = this.generateKombinationen(schuetzen, mannschaftsgroesse);
    
    for (const kombination of kombinationen) {
      const validation = await this.validateMannschaft(kombination, disziplin);
      if (validation.valid) {
        moeglicheMannschaften.push(kombination);
      }
    }

    return moeglicheMannschaften;
  }

  /**
   * Hilfsfunktion: Generiert alle möglichen Kombinationen
   */
  private static generateKombinationen(array: any[], size: number): any[][] {
    if (size > array.length) return [];
    if (size === 1) return array.map(item => [item]);
    
    const result = [];
    for (let i = 0; i <= array.length - size; i++) {
      const head = array[i];
      const tailCombinations = this.generateKombinationen(array.slice(i + 1), size - 1);
      for (const tail of tailCombinations) {
        result.push([head, ...tail]);
      }
    }
    return result;
  }
}