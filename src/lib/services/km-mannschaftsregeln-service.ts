import mannschaftsregeln from '@/config/km-mannschaftsregeln.json';

export interface MannschaftsRegelConfig {
  mannschaftsregeln: {
    version: string;
    lastUpdated: string;
    description: string;
    grundregeln: {
      mannschaftsgroesse: number;
      minTeilnehmer: number;
      maxTeilnehmer: number;
      ersatzschuetzen: boolean;
    };
    altersklassenRegeln: {
      auflage: {
        description: string;
        erlaubteKombinationen: Array<{
          name: string;
          klassen: string[];
          beschreibung: string;
        }>;
      };
      freihand: {
        description: string;
        erlaubteKombinationen: Array<{
          name: string;
          klassen: string[];
          beschreibung: string;
        }>;
      };
    };
    vereinsregeln: {
      gleicheVereinePflicht: boolean;
      beschreibung: string;
      ausnahmen: string[];
    };
    disziplinRegeln: {
      gleicheDisziplinPflicht: boolean;
      beschreibung: string;
    };
    sortierungsRegeln: {
      prioritaet: string[];
      beschreibung: string;
    };
    spezialRegeln: {
      gewehrSharing: {
        aktiv: boolean;
        beschreibung: string;
        zeitabstand: number;
        zeitabstandEinheit: string;
      };
      startlistenOptimierung: {
        vereineGetrennt: boolean;
        beschreibung: string;
      };
    };
    validierungsRegeln: {
      minMeldungenFuerMannschaft: number;
      maxMannschaftenProVereinProDisziplin: number;
      warnungBeiUnvollstaendigerMannschaft: boolean;
    };
  };
}

export class KMMannschaftsRegelnService {
  private static config: MannschaftsRegelConfig = mannschaftsregeln as MannschaftsRegelConfig;

  /**
   * Prüft ob zwei Altersklassen in einer Mannschaft zusammen dürfen
   */
  static kannZusammenSpielen(altersklasse1: string, altersklasse2: string, disziplin: string): boolean {
    const isAuflage = disziplin.toLowerCase().includes('auflage');
    const regeln = isAuflage ? this.config.mannschaftsregeln.altersklassenRegeln.auflage : this.config.mannschaftsregeln.altersklassenRegeln.freihand;
    
    // Bei Freihand sind alle Kombinationen erlaubt
    if (!isAuflage) {
      return true;
    }
    
    // Prüfe alle erlaubten Kombinationen
    for (const kombination of regeln.erlaubteKombinationen) {
      const klassen = kombination.klassen;
      
      // Wenn beide Klassen in der gleichen Kombination sind
      if (klassen.includes(altersklasse1) && klassen.includes(altersklasse2)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Gibt alle erlaubten Altersklassen für eine gegebene Altersklasse zurück
   */
  static getErlaubteAltersklassen(altersklasse: string, disziplin: string): string[] {
    const isAuflage = disziplin.toLowerCase().includes('auflage');
    const regeln = isAuflage ? this.config.mannschaftsregeln.altersklassenRegeln.auflage : this.config.mannschaftsregeln.altersklassenRegeln.freihand;
    
    if (!isAuflage) {
      return ['*']; // Alle erlaubt
    }
    
    for (const kombination of regeln.erlaubteKombinationen) {
      if (kombination.klassen.includes(altersklasse)) {
        return kombination.klassen;
      }
    }
    
    return [altersklasse]; // Nur sich selbst
  }

  /**
   * Validiert eine komplette Mannschaft
   */
  static validateMannschaft(schuetzen: Array<{altersklasse: string, verein: string, disziplin: string}>, disziplin: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const regeln = this.config.mannschaftsregeln;

    // Grundregeln prüfen
    if (schuetzen.length < regeln.grundregeln.minTeilnehmer) {
      errors.push(`Mindestens ${regeln.grundregeln.minTeilnehmer} Schützen erforderlich`);
    }
    if (schuetzen.length > regeln.grundregeln.maxTeilnehmer) {
      errors.push(`Maximal ${regeln.grundregeln.maxTeilnehmer} Schützen erlaubt`);
    }

    // Vereinsregeln prüfen
    if (regeln.vereinsregeln.gleicheVereinePflicht) {
      const vereine = new Set(schuetzen.map(s => s.verein));
      if (vereine.size > 1) {
        errors.push('Alle Schützen müssen aus dem gleichen Verein sein');
      }
    }

    // Disziplinregeln prüfen
    if (regeln.disziplinRegeln.gleicheDisziplinPflicht) {
      const disziplinen = new Set(schuetzen.map(s => s.disziplin));
      if (disziplinen.size > 1) {
        errors.push('Alle Schützen müssen für die gleiche Disziplin gemeldet sein');
      }
    }

    // Altersklassen-Kompatibilität prüfen
    for (let i = 0; i < schuetzen.length; i++) {
      for (let j = i + 1; j < schuetzen.length; j++) {
        if (!this.kannZusammenSpielen(schuetzen[i].altersklasse, schuetzen[j].altersklasse, disziplin)) {
          errors.push(`${schuetzen[i].altersklasse} und ${schuetzen[j].altersklasse} dürfen nicht zusammen in einer Mannschaft`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Gibt die aktuellen Regeln zurück
   */
  static getRegeln(): MannschaftsRegelConfig {
    return this.config;
  }

  /**
   * Gibt Informationen über die Regelversion zurück
   */
  static getRegelInfo(): {version: string, lastUpdated: string, description: string} {
    return {
      version: this.config.mannschaftsregeln.version,
      lastUpdated: this.config.mannschaftsregeln.lastUpdated,
      description: this.config.mannschaftsregeln.description
    };
  }
}