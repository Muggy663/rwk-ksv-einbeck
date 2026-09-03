/**
 * Zentrale Shooter-Utilities für RWK & KM-System
 * Verwendet von: admin/shooters, verein/schuetzen, km-orga/*, km/*
 */

import type { Shooter } from '@/types/rwk';

export type Gender = 'male' | 'female';

export interface AltersklassenParams {
  birthYear: number;
  gender: Gender;
  disziplinName: string;
  jahr?: number;
}

// ============================================================================
// DATENGETRIEBENE Altersklassen-Ermittlung (Single Source of Truth)
// Liest die Altersgrenzen aus der km_altersklassen-Collection (gepflegt über
// /km-orga/altersklassen) statt aus hartcodierten if-age-Blöcken.
// Auflage/Freihand-Trennung erfolgt über die Klassennamen-Reihe + disziplin.auflage.
// ============================================================================

/** Eine Altersklasse aus der km_altersklassen-Collection. */
export interface KmAltersklasse {
  id?: string;
  klassenId?: number;
  name: string;
  minAlter: number;
  maxAlter: number;
  geschlecht: number; // 0 = weiblich, 1 = männlich, 2 = gemischt
}

export interface ErmittleKlasseParams {
  birthYear?: number;
  gender?: 'male' | 'female' | 'unknown' | string;
  /** true = Auflage-Disziplin, false = Freihand */
  auflage: boolean;
  /** SPO-Nummer der Disziplin (für kreisinterne Ausnahmen, z. B. 1.41 / 1.11) */
  spoNummer?: string;
  /** Jahr der Saison (Alter = saisonJahr - birthYear) */
  saisonJahr: number;
  /** Liste aller Altersklassen aus km_altersklassen */
  altersklassen: KmAltersklasse[];
  /**
   * Altersgenehmigung: Erlaubt 10-/11-Jährigen das Schießen mit scharfem
   * Luftgewehr (offiziell ab 12). Dann wird für die Klassenermittlung ein
   * effektives Mindestalter von 12 angesetzt (→ Schülerklasse 12-14).
   */
  altersgenehmigung?: boolean;
}

// Offizielles Mindestalter für scharfes Gewehr/Pistole (unter 12 nur Lichtgewehr).
const MINDESTALTER_SCHARF = 12;

// Klassennamen der jungen Klassen (gelten für Auflage UND Freihand)
const JUNGE_KLASSEN_REGEX = /^(sch(ü|ue)ler|jugend|junior)/i;
// Auflage-Reihe
const AUFLAGE_KLASSEN_REGEX = /^(senior|seniorin)/i;
// Freihand-Reihe
const FREIHAND_KLASSEN_REGEX = /^(herren|damen)/i;

function passtGeschlecht(klasseGeschlecht: number, isMale: boolean): boolean {
  if (klasseGeschlecht === 2) return true;      // gemischt
  if (klasseGeschlecht === 1) return isMale;    // männlich
  if (klasseGeschlecht === 0) return !isMale;   // weiblich
  return false;
}

/**
 * Ermittelt die Einzel-Wettkampfklasse eines Schützen strikt datengetrieben
 * aus km_altersklassen. Auflage vs. Freihand entscheidet, welche Klassen-Reihe
 * gilt. Kreisinterne Ausnahme: Bei Auflage-Disziplinen 1.41 / 1.11 dürfen
 * 21- bis 40-Jährige in der Herren-/Damen-I-Klasse (Freihand-Reihe) starten.
 *
 * @returns Klassenname oder null, wenn keine passende/startberechtigte Klasse existiert.
 */
export function ermittleEinzelklasse(params: ErmittleKlasseParams): string | null {
  const { birthYear, gender, auflage, spoNummer, saisonJahr, altersklassen, altersgenehmigung } = params;

  if (!birthYear || !gender || gender === 'unknown') return null;
  if (!Array.isArray(altersklassen) || altersklassen.length === 0) return null;

  const echtesAlter = saisonJahr - birthYear;
  // Mit Altersgenehmigung wird ein 10-/11-Jähriger für die Klassenermittlung
  // wie ein 12-Jähriger behandelt (darf scharfes Luftgewehr schießen).
  const alter =
    altersgenehmigung && echtesAlter < MINDESTALTER_SCHARF
      ? MINDESTALTER_SCHARF
      : echtesAlter;
  const isMale = gender === 'male';

  // Kandidaten: passendes Alter + Geschlecht
  const passendeAlter = altersklassen.filter(
    (k) => alter >= k.minAlter && alter <= k.maxAlter && passtGeschlecht(k.geschlecht, isMale)
  );
  if (passendeAlter.length === 0) return null;

  const istJung = (name: string) => JUNGE_KLASSEN_REGEX.test(name.trim());
  const istAuflageKlasse = (name: string) => AUFLAGE_KLASSEN_REGEX.test(name.trim());
  const istFreihandKlasse = (name: string) => FREIHAND_KLASSEN_REGEX.test(name.trim());

  // Junge Klassen (Schüler/Jugend/Junioren) gelten für beide Disziplin-Arten.
  const jungeTreffer = passendeAlter.find((k) => istJung(k.name));

  // Kreisinterne Ausnahme: Auflage 1.41 / 1.11, Alter 21-40 -> Herren/Damen I.
  const istKreisinterneAuflage =
    auflage && (spoNummer === '1.41' || spoNummer === '1.11');

  if (auflage) {
    // Junge Schützen zuerst (Schüler/Jugend/Junioren)
    if (jungeTreffer) return jungeTreffer.name;

    if (istKreisinterneAuflage) {
      // 21-40 dürfen als Herren/Damen I (Freihand-Reihe) starten
      const freihandTreffer = passendeAlter.find((k) => istFreihandKlasse(k.name));
      if (alter >= 21 && alter <= 40 && freihandTreffer) return freihandTreffer.name;
    }

    // Reguläre Auflage-Klasse (Senioren/Seniorinnen)
    const auflageTreffer = passendeAlter.find((k) => istAuflageKlasse(k.name));
    if (auflageTreffer) return auflageTreffer.name;

    // Keine startberechtigte Auflage-Klasse (z. B. 21-40 ohne kreisinterne Ausnahme)
    return null;
  }

  // Freihand
  if (jungeTreffer) return jungeTreffer.name;
  const freihandTreffer = passendeAlter.find((k) => istFreihandKlasse(k.name));
  if (freihandTreffer) return freihandTreffer.name;

  return null;
}

/**
 * Ermittelt die Mannschafts-Gruppierung einer Einzelklasse anhand der
 * konfigurierten altersklassenKombinationen (system_config/mannschaftsregeln).
 * Gibt den Kombinations-Namen zurück, in dem die Einzelklasse enthalten ist,
 * sonst die Einzelklasse selbst (eigene Gruppe).
 */
export function ermittleMannschaftsgruppe(
  einzelklasse: string,
  altersklassenKombinationen: Record<string, string[]> | undefined | null
): string {
  if (!altersklassenKombinationen) return einzelklasse;
  for (const [gruppenName, klassen] of Object.entries(altersklassenKombinationen)) {
    if (Array.isArray(klassen) && klassen.includes(einzelklasse)) {
      return gruppenName;
    }
  }
  return einzelklasse;
}

/**
 * Berechnet die Altersklasse basierend auf Geburtsjahr, Geschlecht und Disziplin
 * Berücksichtigt Auflage vs. Freihand Unterscheidung
 */
export function berechneAltersklasse(params: AltersklassenParams): string {
  const { birthYear, gender, disziplinName, jahr = 2026 } = params;
  
  if (!birthYear || !gender) return 'Unbekannt';
  
  const age = jahr - birthYear;
  const isAuflage = disziplinName?.toLowerCase().includes('auflage');
  const isMale = gender === 'male';
  
  // Schüler & Jugend (gleich für Auflage und Freihand)
  if (age <= 14) return isMale ? 'Schüler m' : 'Schüler w';
  if (age <= 16) return isMale ? 'Jugend m' : 'Jugend w';
  if (age <= 18) return isMale ? 'Junioren II m' : 'Junioren II w';
  if (age <= 20) return isMale ? 'Junioren I m' : 'Junioren I w';
  
  // Auflage-Wettkampfklassen (ab 41 Jahre)
  if (isAuflage) {
    if (age <= 40) return isMale ? 'Herren I' : 'Damen I';
    if (age <= 50) return 'Senioren 0';
    if (age <= 60) return isMale ? 'Senioren I m' : 'Seniorinnen I';
    if (age <= 65) return isMale ? 'Senioren II m' : 'Seniorinnen II';
    if (age <= 70) return isMale ? 'Senioren III m' : 'Seniorinnen III';
    if (age <= 75) return isMale ? 'Senioren IV m' : 'Seniorinnen IV';
    if (age <= 80) return isMale ? 'Senioren V m' : 'Seniorinnen V';
    return isMale ? 'Senioren VI m' : 'Seniorinnen VI';
  }
  
  // Freihand-Wettkampfklassen
  if (age <= 40) return isMale ? 'Herren I' : 'Damen I';
  if (age <= 50) return isMale ? 'Herren II' : 'Damen II';
  if (age <= 60) return isMale ? 'Herren III' : 'Damen III';
  if (age <= 70) return isMale ? 'Herren IV' : 'Damen IV';
  return isMale ? 'Herren V' : 'Damen V';
}

/**
 * Formatiert Geschlecht für Anzeige
 */
export function formatGender(gender: Gender | string | undefined): string {
  if (gender === 'male') return 'M';
  if (gender === 'female') return 'W';
  return '?';
}

/**
 * Gibt Badge-Farbe für Geschlecht zurück
 */
export function getGenderBadgeClass(gender: Gender | string | undefined): string {
  if (gender === 'male') return 'bg-blue-100 text-blue-700';
  if (gender === 'female') return 'bg-pink-100 text-pink-700';
  return 'bg-yellow-100 text-yellow-700';
}

/**
 * Holt die Club-ID eines Schützen mit korrekter Fallback-Logik
 * Priorisierung: clubId > kmClubId (rwkClubId existiert nicht mehr)
 */
export function getShooterClubId(shooter: Shooter | any): string | undefined {
  // Hauptfeld: clubId (für RWK)
  if (shooter.clubId && typeof shooter.clubId === 'string' && shooter.clubId.trim() !== '') {
    return shooter.clubId;
  }
  
  // Fallback: kmClubId (für KM-spezifische Zuordnung)
  if (shooter.kmClubId && typeof shooter.kmClubId === 'string' && shooter.kmClubId.trim() !== '') {
    return shooter.kmClubId;
  }
  
  // Hinweis: rwkClubId existiert nicht in den Daten und wird ignoriert
  return undefined;
}
