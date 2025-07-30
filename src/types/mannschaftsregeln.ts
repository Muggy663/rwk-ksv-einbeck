// src/types/mannschaftsregeln.ts - Regeln für Mannschaftsbildung

export interface MannschaftsRegel {
  wettkampfklassen: string[]; // Welche Klassen zusammen eine Mannschaft bilden können
  geschlechtGemischt: boolean; // Ob m/w gemischt werden darf
  beschreibung: string;
}

// Mannschaftsregeln für KM 2026
export const MANNSCHAFTS_REGELN: MannschaftsRegel[] = [
  // Schüler - m/w gemischt erlaubt
  {
    wettkampfklassen: ['Schüler I m', 'Schüler I w'],
    geschlechtGemischt: true,
    beschreibung: 'Schüler m/w können gemischte Mannschaften bilden'
  },
  
  // Jugend - m/w gemischt erlaubt  
  {
    wettkampfklassen: ['Jugend m', 'Jugend w'],
    geschlechtGemischt: true,
    beschreibung: 'Jugend m/w können gemischte Mannschaften bilden'
  },
  
  // Junioren - getrennt nach Geschlecht
  {
    wettkampfklassen: ['Junioren I m'],
    geschlechtGemischt: false,
    beschreibung: 'Junioren I - nur männlich'
  },
  {
    wettkampfklassen: ['Junioren II m'],
    geschlechtGemischt: false,
    beschreibung: 'Junioren II - nur männlich'
  },
  
  // Juniorinnen - getrennt nach Geschlecht
  {
    wettkampfklassen: ['Junioren I w'],
    geschlechtGemischt: false,
    beschreibung: 'Juniorinnen I - nur weiblich'
  },
  {
    wettkampfklassen: ['Junioren II w'],
    geschlechtGemischt: false,
    beschreibung: 'Juniorinnen II - nur weiblich'
  },
  
  // Herren/Damen I-V - getrennt nach Geschlecht
  {
    wettkampfklassen: ['Herren I'],
    geschlechtGemischt: false,
    beschreibung: 'Herren I - nur männlich'
  },
  {
    wettkampfklassen: ['Damen I'],
    geschlechtGemischt: false,
    beschreibung: 'Damen I - nur weiblich'
  },
  {
    wettkampfklassen: ['Herren II'],
    geschlechtGemischt: false,
    beschreibung: 'Herren II - nur männlich'
  },
  {
    wettkampfklassen: ['Damen II'],
    geschlechtGemischt: false,
    beschreibung: 'Damen II - nur weiblich'
  },
  {
    wettkampfklassen: ['Herren III'],
    geschlechtGemischt: false,
    beschreibung: 'Herren III - nur männlich'
  },
  {
    wettkampfklassen: ['Damen III'],
    geschlechtGemischt: false,
    beschreibung: 'Damen III - nur weiblich'
  },
  {
    wettkampfklassen: ['Herren IV'],
    geschlechtGemischt: false,
    beschreibung: 'Herren IV - nur männlich'
  },
  {
    wettkampfklassen: ['Damen IV'],
    geschlechtGemischt: false,
    beschreibung: 'Damen IV - nur weiblich'
  },
  {
    wettkampfklassen: ['Herren V'],
    geschlechtGemischt: false,
    beschreibung: 'Herren V - nur männlich'
  },
  {
    wettkampfklassen: ['Damen V'],
    geschlechtGemischt: false,
    beschreibung: 'Damen V - nur weiblich'
  },
  
  // Senioren 0 - m/w gemischt erlaubt
  {
    wettkampfklassen: ['Senioren 0 m', 'Seniorinnen 0'],
    geschlechtGemischt: true,
    beschreibung: 'Senioren 0 m/w können gemischte Mannschaften bilden'
  },
  
  // Senioren I und II - m/w gemischt erlaubt
  {
    wettkampfklassen: ['Senioren I m', 'Seniorinnen I', 'Senioren II m', 'Seniorinnen II'],
    geschlechtGemischt: true,
    beschreibung: 'Senioren I/II m/w können gemischte Mannschaften bilden'
  },
  
  // Senioren III-VI - m/w gemischt erlaubt
  {
    wettkampfklassen: ['Senioren III m', 'Seniorinnen III', 'Senioren IV m', 'Seniorinnen IV', 'Senioren V m', 'Seniorinnen V'],
    geschlechtGemischt: true,
    beschreibung: 'Senioren III-VI m/w können gemischte Mannschaften bilden'
  }
];

// Hilfsfunktion: Prüft ob Schützen eine gültige Mannschaft bilden können
export function kannMannschaftBilden(
  wettkampfklassen: string[], 
  geschlechter: ('male' | 'female')[]
): { erlaubt: boolean; regel?: MannschaftsRegel } {
  
  for (const regel of MANNSCHAFTS_REGELN) {
    // Prüfe ob alle Wettkampfklassen in der Regel enthalten sind
    const klassenErlaubt = wettkampfklassen.every(klasse => 
      regel.wettkampfklassen.includes(klasse)
    );
    
    if (klassenErlaubt) {
      // Wenn gemischte Mannschaften nicht erlaubt sind, prüfe Geschlechter
      if (!regel.geschlechtGemischt) {
        const einheitlichesGeschlecht = geschlechter.every(g => g === geschlechter[0]);
        if (!einheitlichesGeschlecht) {
          continue; // Diese Regel passt nicht
        }
      }
      
      return { erlaubt: true, regel };
    }
  }
  
  return { erlaubt: false };
}