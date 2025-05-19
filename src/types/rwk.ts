// src/types/rwk.ts

export type CompetitionDiscipline = 'KK' | 'LG' | 'LP' | 'SP'; // Kleinkaliber, Luftgewehr, Luftpistole, Sportpistole etc.

export interface CompetitionDisplayConfig {
  year: number;
  discipline: CompetitionDiscipline;
  displayName: string; // e.g., "RWK 2025 KK"
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  competitionYear: number;
  type?: CompetitionDiscipline; // Disziplin der Liga
  order?: number;
}

export interface Club {
  id: string;
  name: string;
}

export interface Shooter {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  clubId?: string;
  teamId?: string; // Referenz zum Team in rwk_shooters, falls vorhanden
  competitionYear?: number; // In rwk_shooters
  gender?: 'male' | 'female' | 'diverse' | string; // Geschlecht des Schützen
}

export interface Team {
  id: string;
  name: string;
  clubId?: string;
  leagueId: string;
  competitionYear: number;
  shooterIds?: string[];
  // roundResults werden dynamisch aus rwk_scores berechnet oder sind optional in Firestore
  roundResults?: { [key: string]: number | null };
  totalScore?: number;
  averageScore?: number;
  numScoredRounds?: number;
}

export interface ScoreEntry {
  id: string;
  competitionYear: number;
  durchgang: number;
  leagueId: string;
  shooterId: string;
  shooterName?: string;
  shooterGender?: 'male' | 'female' | 'diverse' | string; // Geschlecht aus rwk_scores
  teamId: string;
  teamName?: string;
  totalRinge: number;
}

export interface ShooterDisplayResults {
  shooterId: string;
  shooterName: string;
  results: { [roundKey: string]: number | null };
  average: number | null;
  total: number | null;
  roundsShot: number;
  teamId: string;
  leagueId: string;
  competitionYear: number;
}

export interface TeamDisplay extends Team {
  clubName?: string;
  rank?: number;
  shootersResults: ShooterDisplayResults[];
  // Diese werden nun dynamisch berechnet und sind hier ggf. redundant,
  // aber für die Übergabe an die Komponente praktisch
  roundResults: { [key: string]: number | null };
  totalScore: number;
  averageScore: number | null;
  numScoredRounds: number;
}

export interface LeagueDisplay extends League {
  teams: TeamDisplay[];
}

// Dieses Interface repräsentiert die geladenen und aufbereiteten Daten für die Anzeige
// einer spezifischen Wettkampfkombination (Jahr + Disziplin)
export interface AggregatedCompetitionData {
  id: string; // z.B. "2025-KK"
  config: CompetitionDisplayConfig;
  leagues: LeagueDisplay[];
}

// Für die Einzelschützen-Rangliste
export interface IndividualShooterDisplayData {
  shooterId: string;
  shooterName: string;
  shooterGender?: 'male' | 'female' | 'diverse' | string;
  teamName: string; // Verein/Mannschaft des Schützen aus dem Score-Eintrag
  results: { [roundKey: string]: number | null }; // dg1, dg2, ...
  totalScore: number;
  averageScore: number | null;
  roundsShot: number;
  rank?: number;
}
