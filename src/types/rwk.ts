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

// Diese Typen repräsentieren die Auswahlmöglichkeiten im UI-Dropdown für die Hauptfilterung
export type UIDisciplineSelection = 'KK' | 'LD' | 'SP'; // Kleinkaliber, Luftdruck, Sportpistole (grob)

export const leagueDisciplineOptions: { value: FirestoreLeagueSpecificDiscipline; label: string }[] = [
  { value: 'KKG', label: 'KK-Gewehr' },
  { value: 'KKP', label: 'KK-Pistole' },
  { value: 'LG', label: 'Luftgewehr (Freihand)' },
  { value: 'LGA', label: 'Luftgewehr Auflage' },
  { value: 'LP', label: 'Luftpistole (Freihand)' },
  { value: 'LPA', label: 'Luftpistole Auflage' },
  { value: 'SP', label: 'Sportpistole' },
];

export interface CompetitionDisplayConfig {
  year: number;
  discipline: UIDisciplineSelection; // UI relevante Auswahl (KK, LD, SP)
  displayName: string;
}

export interface Season {
  id: string;
  competitionYear: number;
  name: string;
  type: UIDisciplineSelection; // Hauptkategorie der Saison (KK, LD, SP)
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  competitionYear: number;
  type: FirestoreLeagueSpecificDiscipline; // Jetzt spezifisch!
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
  leagueName?: string; // Denormalisiert
  leagueType?: FirestoreLeagueSpecificDiscipline; // Denormalisiert, spezifischer Typ
  teamId: string;
  teamName?: string; // Denormalisiert
  clubId?: string; // Denormalisiert
  clubName?: string; // Denormalisiert
  shooterId: string;
  shooterName?: string; // Denormalisiert
  shooterGender?: 'male' | 'female' | string; // Denormalisiert
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post'; // Art der Ergebniseingabe
  enteredByUserId?: string;
  enteredByUserName?: string;
  entryTimestamp?: any; // Firestore Timestamp
}


// --- Anzeige-spezifische Typen (abgeleitet/aggregiert für die RWK Tabellenansicht) ---

export interface ShooterDisplayResults {
  shooterId: string;
  shooterName: string;
  results: { [roundKey: string]: number | null }; // z.B. { dg1: 280, dg2: 285 }
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
  roundResults: { [key: string]: number | null }; // Mannschaftsergebnis pro Durchgang
  totalScore: number;
  averageScore: number | null;
  numScoredRounds: number;
}

export interface LeagueDisplay extends Omit<League, 'type'> {
  type: FirestoreLeagueSpecificDiscipline;
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
    leagueType?: FirestoreLeagueSpecificDiscipline;
    leagueCompetitionYear?: number;
    currentShooterCount?: number;
};