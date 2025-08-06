// src/types/km.ts - Kreismeisterschaft spezifische Typen
// 
// WICHTIG: Schüler haben nur 20 Schuss statt 40 Schuss!
// Daher gibt es für die Hauptdisziplinen separate Schüler-Varianten mit "S" Suffix
// Diese haben reduzierte Schusszahl (20) und angepasste Schießzeiten

export interface KMDisziplin {
  id: string;
  spoNummer: string; // z.B. "1.10"
  name: string; // z.B. "Luftgewehr Freihand"
  kategorie: 'LG' | 'LP' | 'KKG' | 'KKP' | 'AB' | 'LI' | 'BR'; // LI = Lichtgewehr/Lichtpistole, BR = Blasrohr
  schusszahl: number;
  schiesszeit?: number; // in Minuten
  mindestalter: number;
  auflage: boolean;
  aktiv: boolean;
  nurVereinsmeisterschaft?: boolean; // Wird nur von VM durchgemeldet
}

export interface KMWettkampfklasse {
  id: string;
  name: string; // z.B. "Schüler m", "Senioren I"
  geschlecht: 'male' | 'female' | 'mixed';
  minJahrgang: number;
  maxJahrgang: number;
  saison: string; // z.B. "2025"
}

export interface KMMeldung {
  id: string;
  schuetzeId: string;
  disziplinId: string;
  wettkampfklasseId: string;
  lmTeilnahme: boolean;
  anmerkung?: string;
  saison: string;
  meldedatum: Date;
  status: 'gemeldet' | 'bestaetigt' | 'abgelehnt';
  gemeldeteVon: string; // User ID
  // VM-Ergebnis für Durchmeldungs-Disziplinen
  vmErgebnis?: {
    ringe: number;
    datum: Date;
    bemerkung?: string;
  };
}

export interface KMMannschaft {
  id: string;
  vereinId: string;
  disziplinId: string;
  wettkampfklassen: string[]; // Kann mehrere Klassen enthalten (z.B. Schüler m+w)
  saison: string;
  schuetzenIds: string[]; // Genau 3 Schützen
  name?: string; // Optional, wird automatisch generiert
  geschlechtGemischt?: boolean; // Ob m/w gemischt
}

// Hilfsfunktionen
export function getCorrectDisciplineForAge(
  spoNummer: string,
  birthYear: number,
  saison: number = 2026
): string {
  const age = saison - birthYear;
  const isSchueler = age <= 14;
  
  // Für Schüler die spezielle Schüler-Disziplin verwenden
  if (isSchueler && !spoNummer.endsWith('S')) {
    // Prüfe ob es eine Schüler-Variante gibt
    const schuelerVariante = spoNummer + 'S';
    const availableDisciplines = KM_DISZIPLINEN_2026.map(d => d.spoNummer);
    if (availableDisciplines.includes(schuelerVariante)) {
      return schuelerVariante;
    }
  }
  
  return spoNummer;
}

export function calculateKMWettkampfklasse(
  birthYear: number, 
  gender: 'male' | 'female', 
  saison: number = 2026,
  auflage: boolean = false
): string {
  // Sportjahr = Kalenderjahr - Alter im Sportjahr ist entscheidend
  const age = saison - birthYear;
  const suffix = gender === 'male' ? ' m' : ' w';
  
  // Standard-Wettkampfklassen (Freihand)
  if (!auflage) {
    if (age <= 14) return 'Schüler' + suffix;
    if (age <= 16) return 'Jugend' + suffix;
    if (age <= 18) return 'Junioren II' + suffix;
    if (age <= 20) return 'Junioren I' + suffix;
    if (age <= 40) return (gender === 'male' ? 'Herren' : 'Damen') + ' I';
    if (age <= 50) return (gender === 'male' ? 'Herren' : 'Damen') + ' II';
    if (age <= 60) return (gender === 'male' ? 'Herren' : 'Damen') + ' III';
    if (age <= 70) return (gender === 'male' ? 'Herren' : 'Damen') + ' IV';
    return (gender === 'male' ? 'Herren' : 'Damen') + ' V';
  }
  
  // Auflage-Wettkampfklassen - NUR für Schüler und ab Senioren 0
  if (age <= 14) return 'Schüler' + suffix; // Schüler dürfen Auflage
  if (age <= 40) return 'NICHT STARTBERECHTIGT - Auflage erst ab 41 Jahren';
  
  // Ab 41 Jahren: Senioren-Klassen für Auflage
  if (age <= 50) return (gender === 'male' ? 'Senioren' : 'Seniorinnen') + ' 0'; // 41-50 Jahre
  if (age <= 60) return (gender === 'male' ? 'Senioren' : 'Seniorinnen') + ' I';
  if (age <= 65) return (gender === 'male' ? 'Senioren' : 'Seniorinnen') + ' II';
  if (age <= 70) return (gender === 'male' ? 'Senioren' : 'Seniorinnen') + ' III';
  if (age <= 75) return (gender === 'male' ? 'Senioren' : 'Seniorinnen') + ' IV';
  if (age <= 80) return (gender === 'male' ? 'Senioren' : 'Seniorinnen') + ' V';
  return (gender === 'male' ? 'Senioren' : 'Seniorinnen') + ' VI'; // ≥ 81 Jahre
}

// Vollständige Disziplinen-Liste für KM 2026
export const KM_DISZIPLINEN_2026: Omit<KMDisziplin, 'id'>[] = [
  // Luftgewehr - Schüler haben 20 Schuss, alle anderen 40 Schuss
  { spoNummer: '1.10', name: 'Luftgewehr', kategorie: 'LG', schusszahl: 40, schiesszeit: 75, mindestalter: 12, auflage: false, aktiv: true },
  { spoNummer: '1.10S', name: 'Luftgewehr Schüler', kategorie: 'LG', schusszahl: 20, schiesszeit: 45, mindestalter: 12, auflage: false, aktiv: true },
  { spoNummer: '1.11', name: 'Luftgewehr Auflage', kategorie: 'LG', schusszahl: 40, schiesszeit: 60, mindestalter: 12, auflage: true, aktiv: true },
  { spoNummer: '1.11S', name: 'Luftgewehr Auflage Schüler', kategorie: 'LG', schusszahl: 20, schiesszeit: 40, mindestalter: 12, auflage: true, aktiv: true },
  { spoNummer: '1.12', name: '10m Luftgewehr MixTeam', kategorie: 'LG', schusszahl: 40, schiesszeit: 75, mindestalter: 12, auflage: false, aktiv: true },
  { spoNummer: '1.19', name: 'Luftgewehr Auflage sitzend', kategorie: 'LG', schusszahl: 40, schiesszeit: 60, mindestalter: 12, auflage: true, aktiv: true },
  { spoNummer: '1.20', name: '10m Luftgewehr 3-Stellung', kategorie: 'LG', schusszahl: 120, schiesszeit: 150, mindestalter: 14, auflage: false, aktiv: true, nurVereinsmeisterschaft: true },
  { spoNummer: '1.30', name: 'Zimmerstutzen', kategorie: 'LG', schusszahl: 40, schiesszeit: 75, mindestalter: 12, auflage: false, aktiv: true },
  { spoNummer: '1.31', name: 'Zimmerstutzen Auflage', kategorie: 'LG', schusszahl: 40, schiesszeit: 60, mindestalter: 12, auflage: true, aktiv: true },
  
  // Kleinkaliber Gewehr
  { spoNummer: '1.35', name: 'KK Gewehr - 100m', kategorie: 'KKG', schusszahl: 40, schiesszeit: 90, mindestalter: 14, auflage: false, aktiv: true, nurVereinsmeisterschaft: true },
  { spoNummer: '1.36', name: 'KK Gewehr Auflage 100m', kategorie: 'KKG', schusszahl: 40, schiesszeit: 75, mindestalter: 14, auflage: true, aktiv: true },
  { spoNummer: '1.39', name: 'KK Gewehr Auflage 100m sitzend', kategorie: 'KKG', schusszahl: 40, schiesszeit: 75, mindestalter: 14, auflage: true, aktiv: true },
  { spoNummer: '1.40', name: 'KK Gewehr - 3x20 ( 3 Pos )', kategorie: 'KKG', schusszahl: 60, schiesszeit: 120, mindestalter: 16, auflage: false, aktiv: true, nurVereinsmeisterschaft: true },
  { spoNummer: '1.41', name: 'KK-Gewehr Auflage 50m', kategorie: 'KKG', schusszahl: 40, schiesszeit: 60, mindestalter: 14, auflage: true, aktiv: true },
  { spoNummer: '1.42', name: 'KK Gewehr - 30 Schuss', kategorie: 'KKG', schusszahl: 30, schiesszeit: 60, mindestalter: 14, auflage: false, aktiv: true },
  { spoNummer: '1.43', name: 'KK Gewehr 50 m Zielf. aufgelegt', kategorie: 'KKG', schusszahl: 40, schiesszeit: 60, mindestalter: 14, auflage: true, aktiv: true },
  { spoNummer: '1.44', name: 'KK Gewehr 100 m Zielf. aufgelegt', kategorie: 'KKG', schusszahl: 40, schiesszeit: 75, mindestalter: 14, auflage: true, aktiv: true },
  { spoNummer: '1.49', name: 'KK-Gewehr Auflage 50m sitzend', kategorie: 'KKG', schusszahl: 40, schiesszeit: 60, mindestalter: 14, auflage: true, aktiv: true },
  { spoNummer: '1.60', name: 'KK Gewehr - 3x40', kategorie: 'KKG', schusszahl: 120, schiesszeit: 180, mindestalter: 18, auflage: false, aktiv: true },
  { spoNummer: '1.80', name: 'KK Gewehr - Liegendkampf', kategorie: 'KKG', schusszahl: 60, schiesszeit: 90, mindestalter: 14, auflage: false, aktiv: true },
  
  // Luftpistole - Schüler haben 20 Schuss, alle anderen 40 Schuss
  { spoNummer: '2.10', name: '10m Luftpistole', kategorie: 'LP', schusszahl: 40, schiesszeit: 75, mindestalter: 14, auflage: false, aktiv: true },
  { spoNummer: '2.10S', name: '10m Luftpistole Schüler', kategorie: 'LP', schusszahl: 20, schiesszeit: 45, mindestalter: 12, auflage: false, aktiv: true },
  { spoNummer: '2.11', name: '10 m Luftpistole Auflage', kategorie: 'LP', schusszahl: 40, schiesszeit: 60, mindestalter: 14, auflage: true, aktiv: true },
  { spoNummer: '2.11S', name: '10 m Luftpistole Auflage Schüler', kategorie: 'LP', schusszahl: 20, schiesszeit: 40, mindestalter: 12, auflage: true, aktiv: true },
  { spoNummer: '2.12', name: '10m LP MixTeam', kategorie: 'LP', schusszahl: 40, schiesszeit: 75, mindestalter: 14, auflage: false, aktiv: true },
  { spoNummer: '2.17', name: '10m LP Mehrkampf', kategorie: 'LP', schusszahl: 60, schiesszeit: 90, mindestalter: 14, auflage: false, aktiv: true },
  { spoNummer: '2.18', name: '10m LP Standard', kategorie: 'LP', schusszahl: 40, schiesszeit: 75, mindestalter: 14, auflage: false, aktiv: true },
  
  // Kleinkaliber Pistole
  { spoNummer: '2.20', name: '50m KK Pistole', kategorie: 'KKP', schusszahl: 60, schiesszeit: 120, mindestalter: 18, auflage: false, aktiv: true },
  { spoNummer: '2.21', name: '50 m Freie Pistole Auflage', kategorie: 'KKP', schusszahl: 60, schiesszeit: 90, mindestalter: 18, auflage: true, aktiv: true },
  { spoNummer: '2.30', name: '25m KK Schnellfeuerpistole', kategorie: 'KKP', schusszahl: 60, schiesszeit: 45, mindestalter: 18, auflage: false, aktiv: true },
  { spoNummer: '2.40', name: '25m KK Pistole', kategorie: 'KKP', schusszahl: 60, schiesszeit: 90, mindestalter: 16, auflage: false, aktiv: true },
  { spoNummer: '2.42', name: '25 m Sportpistole Auflage', kategorie: 'KKP', schusszahl: 60, schiesszeit: 75, mindestalter: 16, auflage: true, aktiv: true },
  { spoNummer: '2.45', name: '25m KK Zentralfeuerpistole', kategorie: 'KKP', schusszahl: 60, schiesszeit: 90, mindestalter: 18, auflage: false, aktiv: true },
  { spoNummer: '2.60', name: '25m KK Standardpistole', kategorie: 'KKP', schusszahl: 60, schiesszeit: 90, mindestalter: 16, auflage: false, aktiv: true },
  
  // Armbrust
  { spoNummer: '5.10', name: 'Armbrust 10m', kategorie: 'AB', schusszahl: 30, schiesszeit: 60, mindestalter: 12, auflage: false, aktiv: true },
  { spoNummer: '5.11', name: 'Armbrust 10m Auflage', kategorie: 'AB', schusszahl: 30, schiesszeit: 60, mindestalter: 12, auflage: true, aktiv: true },
  { spoNummer: '5.20', name: 'Armbrust 30m', kategorie: 'AB', schusszahl: 30, schiesszeit: 75, mindestalter: 14, auflage: false, aktiv: true },
  
  // Lichtgewehr/Lichtpistole - Schüler haben 20 Schuss, alle anderen 40 Schuss
  { spoNummer: '11.10', name: 'Lichtgewehr', kategorie: 'LI', schusszahl: 40, schiesszeit: 60, mindestalter: 8, auflage: false, aktiv: true },
  { spoNummer: '11.10S', name: 'Lichtgewehr Schüler', kategorie: 'LI', schusszahl: 20, schiesszeit: 40, mindestalter: 8, auflage: false, aktiv: true },
  { spoNummer: '11.11', name: 'Faszination Lichtgewehr', kategorie: 'LI', schusszahl: 40, schiesszeit: 60, mindestalter: 8, auflage: false, aktiv: true },
  { spoNummer: '11.11S', name: 'Faszination Lichtgewehr Schüler', kategorie: 'LI', schusszahl: 20, schiesszeit: 40, mindestalter: 8, auflage: false, aktiv: true },
  { spoNummer: '11.20', name: 'Lichtgewehr 3-stellung', kategorie: 'LI', schusszahl: 120, schiesszeit: 90, mindestalter: 10, auflage: false, aktiv: true },
  { spoNummer: '11.50', name: 'Lichtpistole', kategorie: 'LI', schusszahl: 40, schiesszeit: 60, mindestalter: 8, auflage: false, aktiv: true },
  { spoNummer: '11.50S', name: 'Lichtpistole Schüler', kategorie: 'LI', schusszahl: 20, schiesszeit: 40, mindestalter: 8, auflage: false, aktiv: true },
  { spoNummer: '11.51', name: 'Faszination Lichtpistole', kategorie: 'LI', schusszahl: 40, schiesszeit: 60, mindestalter: 8, auflage: false, aktiv: true },
  { spoNummer: '11.51S', name: 'Faszination Lichtpistole Schüler', kategorie: 'LI', schusszahl: 20, schiesszeit: 40, mindestalter: 8, auflage: false, aktiv: true },
  
  // Blasrohr
  { spoNummer: '12.10', name: 'Blasrohrsport', kategorie: 'BR', schusszahl: 30, schiesszeit: 45, mindestalter: 8, auflage: false, aktiv: true }
];
