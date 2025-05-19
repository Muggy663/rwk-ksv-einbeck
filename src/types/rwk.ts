// src/types/rwk.ts

// Diese Typen repräsentieren die Werte, wie sie in Firestore gespeichert sind
export type FirestoreCompetitionDiscipline = 'KK' | 'LG' | 'LP' | 'SP';

// Diese Typen repräsentieren die Auswahlmöglichkeiten im UI-Dropdown
export type UIDisciplineSelection = 'KK' | 'LD'; // LD für Luftdruck (LG/LP)


export interface CompetitionDisplayConfig {
  year: number;
  discipline: UIDisciplineSelection; // UI relevante Auswahl
  displayName: string;
}

export interface Season {
  id: string;
  competitionYear: number;
  name: string; 
  type: UIDisciplineSelection; // 'KK' oder 'LD' für die UI Unterscheidung
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
  // uiDiscipline wurde durch 'type' ersetzt für Konsistenz
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  competitionYear: number; 
  type: FirestoreCompetitionDiscipline; 
  order?: number;
  seasonId: string; // Referenz zur Saison
}

export interface Club {
  id: string; 
  name: string;
  shortName?: string;
  clubNumber?: string; 
}

export interface Shooter {
  id: string;
  name?: string; 
  firstName?: string;
  lastName?: string;
  clubId?: string; 
  gender?: 'male' | 'female' | string; 
  teamIds?: string[]; 
}

export interface Team {
  id: string;
  name: string;
  clubId: string; 
  leagueId: string;
  competitionYear: number; // Wichtig für die Zuordnung zur korrekten Saisoninstanz
  shooterIds?: string[];
}

export interface ScoreEntry {
  id?: string; 
  competitionYear: number;
  durchgang: number; 
  leagueId: string;
  leagueName?: string; 
  teamId: string;
  teamName?: string; 
  clubId?: string;
  clubName?: string; 
  shooterId: string;
  shooterName?: string; 
  shooterGender?: 'male' | 'female' | string; 
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post'; 
  enteredByUserId?: string;
  enteredByUserName?: string;
  entryTimestamp?: any; 
}


// --- Anzeige-spezifische Typen (abgeleitet/aggregiert für die RWK Tabellenansicht) ---

export interface ShooterDisplayResults {
  shooterId: string;
  shooterName: string;
  results: { [roundKey: string]: number | null }; 
  average: number | null;
  total: number | null;
  roundsShot: number;
  teamId?: string;
  leagueId?: string;
  competitionYear?: number;
}

export interface TeamDisplay extends Team {
  clubName: string; 
  rank?: number;
  shootersResults: ShooterDisplayResults[]; 
  roundResults: { [key: string]: number | null }; 
  totalScore: number; 
  averageScore: number | null; 
  numScoredRounds: number; 
}

export interface LeagueDisplay extends Omit<League, 'seasonId'> { // seasonId wird nicht direkt in der Anzeige benötigt
  teams: TeamDisplay[];
}

export interface AggregatedCompetitionData {
  id: string; // z.B. "2025-KK"
  config: CompetitionDisplayConfig;
  leagues: LeagueDisplay[];
}

export interface IndividualShooterDisplayData {
  shooterId: string;
  shooterName: string;
  shooterGender?: 'male' | 'female' | string;
  teamName: string; 
  results: { [roundKey: string]: number | null }; 
  totalScore: number;
  averageScore: number | null;
  roundsShot: number;
  rank?: number;
}

export interface PendingScoreEntry {
  tempId: string;
  seasonId: string; 
  seasonName?: string;
  leagueId: string;
  leagueName?: string;
  teamId: string;
  teamName?: string;
  shooterId: string;
  shooterName?: string;
  durchgang: number;
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post';
  competitionYear: number;
}
