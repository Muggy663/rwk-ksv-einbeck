// src/lib/constants/km-constants.ts
// Konstanten für KM-System - Client-seitig verwendbar

export const ALTERSKLASSEN = [
  'Schüler',
  'Jugend', 
  'Junioren',
  'Erwachsene',
  'Senioren'
] as const;

export type Altersklasse = typeof ALTERSKLASSEN[number];

// Hilfsfunktion: Bestimme Schießzeit basierend auf Altersklasse
export function getSchiesszeit(disziplin: any, altersklasse: string, anlagensystem: 'zuganlagen' | 'andere'): number {
  if (!disziplin?.schusszahlen) {
    // Fallback für alte Disziplinen ohne Schusszahl-System
    return anlagensystem === 'zuganlagen' 
      ? (disziplin?.schiesszeit_zuganlagen || 90)
      : (disziplin?.schiesszeit_andere || 90);
  }
  
  // Finde passende Schusszahl für Altersklasse
  const schusszahlConfig = disziplin.schusszahlen.find((config: any) => 
    config.altersklassen.includes(altersklasse) || config.altersklassen.includes('Alle')
  );
  
  if (!schusszahlConfig) {
    // Fallback: Erste verfügbare Schusszahl
    const fallback = disziplin.schusszahlen[0];
    return anlagensystem === 'zuganlagen' 
      ? fallback.schiesszeit_zuganlagen 
      : fallback.schiesszeit_andere;
  }
  
  return anlagensystem === 'zuganlagen' 
    ? schusszahlConfig.schiesszeit_zuganlagen 
    : schusszahlConfig.schiesszeit_andere;
}