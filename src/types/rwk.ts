
// src/types/rwk.ts

// Diese Typen repräsentieren die Werte, wie sie in Firestore gespeichert sind
export type FirestoreCompetitionDiscipline = 'KK' | 'LG' | 'LP' | 'SP';

// Diese Typen repräsentieren die Auswahlmöglichkeiten im UI-Dropdown für die Hauptfilterung
// und werden auch für die interne Logik der Ligatypen verwendet.
export type UIDisciplineSelection = 'KK' | 'LD' | 'SP';


export interface CompetitionDisplayConfig {
  year: number;
  discipline: UIDisciplineSelection; // UI relevante Auswahl
  displayName: string;
}

export interface Season {
  id: string;
  competitionYear: number;
  name: string;
  type: UIDisciplineSelection; // 'KK', 'LD' oder 'SP' (wird vom Admin bei Saisonerstellung festgelegt)
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  competitionYear: number;
  type: UIDisciplineSelection; // Sollte mit Season.type übereinstimmen oder eine spezifischere Unterteilung sein, die aber zur Season.type passt
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
  firstName?: string;
  lastName?: string;
  name: string; // Kombinierter Name, wird generiert oder gespeichert
  clubId: string;
  gender?: 'male' | 'female' | string;
  teamIds?: string[]; // Array von Team-IDs, denen der Schütze angehört
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  leagueId: string;
  competitionYear: number;
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

export interface TeamDisplay extends Omit<Team, 'shooterIds'> {
  clubName: string;
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
  id: string; // z.B. "2025-KK"
  config: CompetitionDisplayConfig;
  leagues: LeagueDisplay[];
}

export interface IndividualShooterDisplayData {
  shooterId: string;
  shooterName: string;
  shooterGender?: 'male' | 'female' | string;
  teamName: string; // Oder Vereinsname, je nach Kontext
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

// Für die Validierung bei der Schützenzuordnung
export type TeamValidationInfo = Team & {
    leagueType?: UIDisciplineSelection;
    leagueCompetitionYear?: number;
};
