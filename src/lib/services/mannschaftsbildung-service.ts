import { logError } from '@/lib/utils/secure-logger';
export class MannschaftsbildungService {
  
  /**
   * LÃ¤dt die aktuellen Mannschaftsregeln
   * @throws {Error} Wenn das Laden der Regeln fehlschlÃ¤gt
   */
  static async loadRegeln() {
    try {
      const response = await fetch('/api/km/mannschaftsregeln');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.regeln;
    } catch (error) {
      logError('Fehler beim Laden der Mannschaftsregeln:', error);
      throw new Error('Mannschaftsregeln konnten nicht geladen werden');
    }
  }

  /**
   * PrÃ¼ft ob zwei SchÃ¼tzen in einer Mannschaft zusammen dÃ¼rfen
   * @param schuetze1 - Erster SchÃ¼tze
   * @param schuetze2 - Zweiter SchÃ¼tze
   * @param disziplin - Disziplin (z.B. 'LG', 'LP')
   * @returns Promise<boolean> - true wenn Kombination erlaubt ist
   */
  static async kannZusammenSpielen(schuetze1: any, schuetze2: any, disziplin: string): Promise<boolean> {
    const regeln = await this.loadRegeln();
    return this.isValidShooterCombination(schuetze1, schuetze2, disziplin, regeln);
  }

  /**
   * Validiert eine komplette Mannschaft
   * @param schuetzen - Array von SchÃ¼tzen
   * @param disziplin - Disziplin
   * @param regeln - Optional: Bereits geladene Regeln
   * @returns Promise mit Validierungsergebnis
   */
  static async validateMannschaft(schuetzen: any[], disziplin: string, regeln?: any): Promise<{ valid: boolean; errors: string[] }> {
    const loadedRegeln = regeln || await this.loadRegeln();
    const errors: string[] = [];
    
    if (!loadedRegeln) {
      return { valid: true, errors: [] };
    }

    if (schuetzen.length !== loadedRegeln.mannschaftsgroesse) {
      errors.push(`Mannschaft muss ${loadedRegeln.mannschaftsgroesse} SchÃ¼tzen haben`);
    }

    const disziplinRegel = loadedRegeln.disziplinRegeln?.[disziplin];
    if (!disziplinRegel || !disziplinRegel.aktiv) {
      errors.push('FÃ¼r diese Disziplin sind keine Mannschaften erlaubt');
      return { valid: false, errors };
    }

    for (let i = 0; i < schuetzen.length; i++) {
      for (let j = i + 1; j < schuetzen.length; j++) {
        if (!this.isValidShooterCombination(schuetzen[i], schuetzen[j], disziplin, loadedRegeln)) {
          errors.push(`${schuetzen[i].altersklasse} und ${schuetzen[j].altersklasse} dÃ¼rfen nicht zusammen`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static isValidShooterCombination(schuetze1: any, schuetze2: any, disziplin: string, regeln: any): boolean {
    const disziplinRegel = regeln.disziplinRegeln?.[disziplin];
    if (!disziplinRegel?.aktiv) return false;

    const erlaubteKombinationen = disziplinRegel.erlaubteKombinationen || [];
    
    for (const kombinationName of erlaubteKombinationen) {
      const kombination = regeln.altersklassenKombinationen?.[kombinationName];
      if (kombination?.includes(schuetze1?.altersklasse) && 
          kombination.includes(schuetze2?.altersklasse)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Gibt alle mÃ¶glichen Mannschaftskombinationen fÃ¼r eine Disziplin zurÃ¼ck
   */
  static async getMoeglicheMannschaften(schuetzen: any[], disziplin: string) {
    const regeln = await this.loadRegeln();
    if (!regeln) return [];

    const disziplinRegel = regeln.disziplinRegeln?.[disziplin];
    if (!disziplinRegel || !disziplinRegel.aktiv) {
      return [];
    }

    const mannschaftsgroesse = regeln.mannschaftsgroesse;
    const moeglicheMannschaften = [];
    const kombinationen = this.generateKombinationen(schuetzen, mannschaftsgroesse);
    
    for (const kombination of kombinationen) {
      const validation = this.validateMannschaftSync(kombination, disziplin, regeln);
      if (validation.valid) {
        moeglicheMannschaften.push(kombination);
      }
    }

    return moeglicheMannschaften;
  }

  /**
   * Synchrone Validierung einer Mannschaft (fÃ¼r Performance)
   */
  private static validateMannschaftSync(schuetzen: any[], disziplin: string, regeln: any) {
    const errors: string[] = [];
    
    if (!regeln) {
      return { valid: true, errors: [] };
    }

    if (schuetzen.length !== regeln.mannschaftsgroesse) {
      errors.push(`Mannschaft muss ${regeln.mannschaftsgroesse} SchÃ¼tzen haben`);
    }

    const disziplinRegel = regeln.disziplinRegeln?.[disziplin];
    if (!disziplinRegel || !disziplinRegel.aktiv) {
      errors.push('FÃ¼r diese Disziplin sind keine Mannschaften erlaubt');
      return { valid: false, errors };
    }

    for (let i = 0; i < schuetzen.length; i++) {
      for (let j = i + 1; j < schuetzen.length; j++) {
        if (!this.isValidShooterCombination(schuetzen[i], schuetzen[j], disziplin, regeln)) {
          errors.push(`${schuetzen[i].altersklasse} und ${schuetzen[j].altersklasse} dÃ¼rfen nicht zusammen`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Hilfsfunktion: Generiert alle mÃ¶glichen Kombinationen
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

