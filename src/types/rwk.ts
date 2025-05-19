// src/types/rwk.ts

// Diese Typen repräsentieren die Werte, wie sie in Firestore gespeichert sind
export type FirestoreCompetitionDiscipline = 'KK' | 'LG' | 'LP' | 'SP';

// Diese Typen repräsentieren die Auswahlmöglichkeiten im UI-Dropdown
export type UIDisciplineSelection = 'KK' | 'LD'; // LD für Luftdruck (LG/LP)

export interface CompetitionDisplayConfig {
  year: number;
  discipline: UIDisciplineSelection; // Nimmt jetzt die UI-Auswahlwerte an
  displayName: string;
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  competitionYear: number;
  type?: FirestoreCompetitionDiscipline; // Disziplin der Liga aus Firestore
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
  teamId?: string;
  competitionYear?: number;
  gender?: 'male' | 'female' | 'diverse' | string;
}

export interface Team {
  id: string;
  name: string;
  clubId?: string;
  leagueId: string;
  competitionYear: number;
  shooterIds?: string[];
  roundResults?: { [key: string]: number | null };
  totalScore?: number;
  averageScore?: number | null; // Durchschnitt für die Mannschaft
  numScoredRounds?: number;
}

export interface ScoreEntry {
  id: string;
  competitionYear: number;
  durchgang: number;
  leagueId: string;
  shooterId: string;
  shooterName?: string;
  shooterGender?: 'male' | 'female' | 'diverse' | string;
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
  roundResults: { [key: string]: number | null };
  totalScore: number;
  averageScore: number | null;
  numScoredRounds: number;
}

export interface LeagueDisplay extends League {
  teams: TeamDisplay[];
}

export interface AggregatedCompetitionData {
  id: string;
  config: CompetitionDisplayConfig;
  leagues: LeagueDisplay[];
}

export interface IndividualShooterDisplayData {
  shooterId: string;
  shooterName: string;
  shooterGender?: 'male' | 'female' | 'diverse' | string;
  teamName: string;
  results: { [roundKey: string]: number | null };
  totalScore: number;
  averageScore: number | null;
  roundsShot: number;
  rank?: number;
}
