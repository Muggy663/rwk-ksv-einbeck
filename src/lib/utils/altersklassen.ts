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
