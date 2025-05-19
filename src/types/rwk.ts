// src/types/rwk.ts

// Diese Typen repräsentieren die spezifischen Disziplinen, wie sie im League.type gespeichert sein sollten
export type FirestoreLeagueSpecificDiscipline =
  | 'KKG' // Kleinkaliber Gewehr
  | 'KKP' // Kleinkaliber Pistole
  | 'LG'  // Luftgewehr (Freihand)
  | 'LGA' // Luftgewehr Auflage
  | 'LP'  // Luftpistole (Freihand)
  | 'LPA' // Luftpistole Auflage
  | 'SP'; // Sportpistole

export const GEWEHR_DISCIPLINES: FirestoreLeagueSpecificDiscipline[] = ['KKG', 'LG', 'LGA'];
export const PISTOL_DISCIPLINES: FirestoreLeagueSpecificDiscipline[] = ['KKP', 'LP', 'LPA', 'SP'];

export const leagueDisciplineOptions: { value: FirestoreLeagueSpecificDiscipline; label: string }[] = [
  { value: 'KKG', label: 'KK-Gewehr' },
  { value: 'KKP', label: 'KK-Pistole' },
  { value: 'LG', label: 'Luftgewehr (Freihand)' },
  { value: 'LGA', label: 'Luftgewehr Auflage' },
  { value: 'LP', label: 'Luftpistole (Freihand)' },
  { value: 'LPA', label: 'Luftpistole Auflage' },
  { value: 'SP', label: 'Sportpistole' },
];

// Diese Typen repräsentieren die Auswahlmöglichkeiten im UI-Dropdown für die Hauptfilterung der RWK-Tabellen
export type UIDisciplineSelection = 'KK' | 'LD' | 'SP'; // Kleinkaliber (alle KK-Arten), Luftdruck (alle LD-Arten), Sportpistole (als Überbegriff)

export const uiDisciplineFilterOptions: { value: UIDisciplineSelection, label: string, firestoreTypes: FirestoreLeagueSpecificDiscipline[] }[] = [
  { value: 'KK', label: 'Kleinkaliber', firestoreTypes: ['KKG', 'KKP'] },
  { value: 'LD', label: 'Luftdruck', firestoreTypes: ['LG', 'LGA', 'LP', 'LPA'] },
  { value: 'SP', label: 'Sportpistole', firestoreTypes: ['SP'] }, // Annahme: SP ist eigenständig
];


export interface CompetitionDisplayConfig {
  year: number;
  discipline: UIDisciplineSelection;
  displayName: string;
}

export interface Season {
  id: string;
  competitionYear: number;
  name: string; // z.B. "RWK 2025 Kleinkaliber" - wird dynamisch generiert
  type: UIDisciplineSelection; // Grobfilter: 'KK', 'LD'
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  competitionYear: number;
  type: FirestoreLeagueSpecificDiscipline; // Spezifischer Typ wie KKG, LGA etc.
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

// Repräsentiert einen einzelnen Ergebnis-Eintrag in der DB
export interface ScoreEntry {
  id?: string;
  competitionYear: number;
  durchgang: number;
  leagueId: string;
  leagueName?: string;
  leagueType?: FirestoreLeagueSpecificDiscipline;
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

export interface LeagueDisplay extends Omit<League, 'type'> {
  type: FirestoreLeagueSpecificDiscipline; // Hier spezifisch
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
  seasonId: string; // ID der Saison, nicht das Jahr
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
  competitionYear: number; // Das Wettkampfjahr
}

export type TeamValidationInfo = Team & {
    leagueType?: FirestoreLeagueSpecificDiscipline;
    leagueCompetitionYear?: number;
    currentShooterCount?: number;
};
