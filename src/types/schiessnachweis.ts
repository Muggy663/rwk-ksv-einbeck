export interface SchießEintrag {
  id: string;
  datum: Date;
  typ: 'training' | 'wettkampf' | 'meisterschaft' | 'pokal';
  disziplin: string;
  schussAnzahl: number;
  ergebnis: number;
  serien?: ZehnerSerie[];
  standort: string;
  schiessstand?: string;
  wetter?: string;
  munition?: string;
  waffe?: string;
  notizen?: string;
  createdAt: Date;
}

export interface ZehnerSerie {
  id: string;
  serienNummer: number;
  schuesse: Schuss[];
  summe: number;
}

export interface Schuss {
  nummer: number;
  wert: number; // Kann Kommastellen haben (z.B. 10.5)
  ring?: number; // Für Ringwertung
}

export interface SchießStatistik {
  totalSchüsse: number;
  totalTrainings: number;
  totalWettkämpfe: number;
  durchschnittErgebnis: number;
  bestesErgebnis: number;
  letzteAktivität: Date | null;
}

export const DISZIPLINEN = [
  // Gewehr
  { name: 'KK liegend 50m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Gewehr', schussAnzahl: [20, 30, 40, 60] },
  { name: 'KK Auflage 50m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Gewehr', schussAnzahl: [20, 30, 40, 60] },
  { name: 'KK Freihand 50m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Gewehr', schussAnzahl: [20, 30, 40, 60] },
  { name: 'KK 3-Stellung 50m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Gewehr', schussAnzahl: [120] },
  { name: 'KK liegend 100m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Gewehr', schussAnzahl: [20, 30, 40, 60] },
  { name: 'KK Gewehr 100m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Gewehr', schussAnzahl: [20, 30, 40, 60] },
  { name: 'Luftgewehr 10m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Gewehr', schussAnzahl: [20, 30, 40, 60] },
  { name: 'Luftgewehr 10m Auflage', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Gewehr', schussAnzahl: [20, 30, 40, 60] },
  { name: 'Luftgewehr 3-Stellung 10m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Gewehr', schussAnzahl: [30, 60] },
  
  // Pistole
  { name: 'Luftpistole 10m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Pistole', schussAnzahl: [20, 30, 40, 60] },
  { name: 'Luftpistole Auflage 10m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Pistole', schussAnzahl: [20, 30, 40, 60] },
  { name: 'Luftpistole Freihand 10m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Pistole', schussAnzahl: [20, 30, 40, 60] },
  { name: 'Sportpistole 25m', maxRinge: 10, serienGroesse: 5, kommastellen: false, kategorie: 'Pistole', schussAnzahl: [60] },
  { name: 'Sportpistole Präzision 25m', maxRinge: 10, serienGroesse: 5, kommastellen: false, kategorie: 'Pistole', schussAnzahl: [30, 60] },
  { name: 'Sportpistole Duell 25m', maxRinge: 10, serienGroesse: 5, kommastellen: false, kategorie: 'Pistole', schussAnzahl: [30, 60] },
  { name: 'Sportpistole Schnellfeuer 25m', maxRinge: 10, serienGroesse: 5, kommastellen: false, kategorie: 'Pistole', schussAnzahl: [30, 60] },
  { name: 'Freie Pistole 50m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Pistole', schussAnzahl: [60] },
  { name: 'Schnellfeuerpistole 25m', maxRinge: 10, serienGroesse: 5, kommastellen: false, kategorie: 'Pistole', schussAnzahl: [60] },
  { name: 'Zentralfeuerpistole 25m', maxRinge: 10, serienGroesse: 5, kommastellen: false, kategorie: 'Pistole', schussAnzahl: [20, 30, 60] },
  { name: 'Großkaliber Pistole 50m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Pistole', schussAnzahl: [20, 30, 60] },
  
  // Laufende Scheibe
  { name: 'Laufende Scheibe 50m', maxRinge: 10, serienGroesse: 10, kommastellen: false, kategorie: 'Laufende Scheibe', schussAnzahl: [30, 60] },
  { name: 'Laufender Keiler 50m', maxRinge: 10, serienGroesse: 5, kommastellen: false, kategorie: 'Laufende Scheibe', schussAnzahl: [30] },
  
  // Bogen
  { name: 'Recurvebogen 70m', maxRinge: 10, serienGroesse: 6, kommastellen: false, kategorie: 'Bogen', schussAnzahl: [72] },
  { name: 'Recurvebogen 50m', maxRinge: 10, serienGroesse: 6, kommastellen: false, kategorie: 'Bogen', schussAnzahl: [36, 72] },
  { name: 'Compoundbogen 50m', maxRinge: 10, serienGroesse: 6, kommastellen: false, kategorie: 'Bogen', schussAnzahl: [36, 72] },
  { name: 'Blankbogen 50m', maxRinge: 10, serienGroesse: 6, kommastellen: false, kategorie: 'Bogen', schussAnzahl: [36, 72] },
  { name: 'Bogen Halle 18m', maxRinge: 10, serienGroesse: 3, kommastellen: false, kategorie: 'Bogen', schussAnzahl: [30, 60] },
  
  // Armbrust
  { name: 'Armbrust 10m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Armbrust', schussAnzahl: [40, 60] },
  { name: 'Armbrust 30m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Armbrust', schussAnzahl: [30, 60] },
  
  // Vorderlader
  { name: 'Vorderlader 50m', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Vorderlader', schussAnzahl: [40] },
  { name: 'Perkussionspistole 25m', maxRinge: 10, serienGroesse: 5, kommastellen: false, kategorie: 'Vorderlader', schussAnzahl: [40] },
  
  // Sonstige
  { name: 'Sonstige Disziplin', maxRinge: 10, serienGroesse: 10, kommastellen: true, kategorie: 'Sonstige', schussAnzahl: [10, 20, 30, 40, 60] }
] as const;

export const DISZIPLIN_NAMES = DISZIPLINEN.map(d => d.name);

export const KATEGORIEN = [...new Set(DISZIPLINEN.map(d => d.kategorie))];

export const getDisziplinenByKategorie = (kategorie: string) => {
  return DISZIPLINEN.filter(d => d.kategorie === kategorie);
};

export const WETTKAMPF_TYPEN = [
  { value: 'training', label: 'Training', icon: '🎯' },
  { value: 'wettkampf', label: 'Wettkampf', icon: '🏆' },
  { value: 'meisterschaft', label: 'Meisterschaft', icon: '🥇' },
  { value: 'pokal', label: 'Pokalschießen', icon: '🏆' }
] as const;

export const getDisziplinConfig = (name: string): DisziplinConfig | undefined => {
  return DISZIPLINEN.find(d => d.name === name);
};

export type DisziplinConfig = typeof DISZIPLINEN[number];
export type DisziplinName = typeof DISZIPLIN_NAMES[number];
export type WettkampfTyp = typeof WETTKAMPF_TYPEN[number]['value'];

export const BELIEBTE_SCHIESSSTAENDE = [
  'Schützenhaus Einbeck',
  'Schützenverein Northeim', 
  'SV Alfeld',
  'Schützenhaus Göttingen',
  'KK-Stand Hildesheim',
  'Luftgewehr-Halle',
  'Vereinsheim',
  'Sonstiger Standort'
] as const;