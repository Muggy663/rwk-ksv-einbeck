// src/types/rwk.ts
import type { Timestamp } from 'firebase/firestore';

// Spezifische Disziplintypen, wie sie in Firestore für Ligen gespeichert werden
export type FirestoreLeagueSpecificDiscipline =
  | 'KKG'  // Kleinkaliber Gewehr
  | 'KKP'  // Kleinkaliber Pistole
  | 'LG'   // Luftgewehr (Freihand)
  | 'LGA'  // Luftgewehr Auflage
  | 'LP'   // Luftpistole (Freihand)
  | 'LPA'; // Luftpistole Auflage

export const GEWEHR_DISCIPLINES: FirestoreLeagueSpecificDiscipline[] = ['KKG', 'LG', 'LGA'];
export const PISTOL_DISCIPLINES: FirestoreLeagueSpecificDiscipline[] = ['KKP', 'LP', 'LPA']; // SP wurde entfernt
export const MAX_SHOOTERS_PER_TEAM = 3;

// Hilfsfunktion zur Kategorisierung
export function getDisciplineCategory(leagueType?: FirestoreLeagueSpecificDiscipline | null): 'Gewehr' | 'Pistole' | null {
  if (!leagueType) return null;
  if (GEWEHR_DISCIPLINES.includes(leagueType)) return 'Gewehr';
  if (PISTOL_DISCIPLINES.includes(leagueType)) return 'Pistole';
  return null;
}

// Optionen für UI-Dropdowns zur Auswahl spezifischer Ligatypen (z.B. beim Anlegen einer Liga)
export const leagueDisciplineOptions: { value: FirestoreLeagueSpecificDiscipline; label: string }[] = [
  { value: 'KKG', label: 'KK-Gewehr' },
  { value: 'KKP', label: 'KK-Pistole' },
  { value: 'LG', label: 'Luftgewehr (Freihand)' },
  { value: 'LGA', label: 'Luftgewehr Auflage' },
  { value: 'LP', label: 'Luftpistole (Freihand)' },
  { value: 'LPA', label: 'Luftpistole Auflage' },
];

// Übergeordnete UI-Filteroptionen für Disziplinen (z.B. in RWK-Tabellen)
export type UIDisciplineSelection = 'KK' | 'LD';

export const uiDisciplineFilterOptions: { value: UIDisciplineSelection, label: string, firestoreTypes: FirestoreLeagueSpecificDiscipline[] }[] = [
  { value: 'KK', label: 'Kleinkaliber (KK)', firestoreTypes: ['KKG', 'KKP'] },
  { value: 'LD', label: 'Luftdruck (LG/LP)', firestoreTypes: ['LG', 'LGA', 'LP', 'LPA'] },
];

// Hilfsfunktion, um von spezifischem Typ auf UI-Auswahlwert zu kommen
export function getUIDisciplineValueFromSpecificType(specificType?: FirestoreLeagueSpecificDiscipline): UIDisciplineSelection | '' {
  if (!specificType) return '';
  const option = uiDisciplineFilterOptions.find(opt => opt.firestoreTypes.includes(specificType));
  return option ? option.value : '';
}


// Konfiguration für die Anzeige von Wettkämpfen (Jahr und UI-Disziplin)
export interface CompetitionDisplayConfig {
  year: number;
  discipline: UIDisciplineSelection;
  displayName: string;
}

export const AVAILABLE_UI_DISCIPLINES: { value: UIDisciplineSelection; label: string }[] = [
  { value: 'KK', label: 'Kleinkaliber (KK)' },
  { value: 'LD', label: 'Luftdruck (LG/LP)' },
];

export interface Season {
  id: string;
  competitionYear: number;
  name: string;
  type: UIDisciplineSelection; // 'KK' oder 'LD' - Hauptkategorie der Saison
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  seasonId: string;
  competitionYear: number;
  type: FirestoreLeagueSpecificDiscipline;
  order?: number;
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
  name: string;
  clubId: string;
  gender?: 'male' | 'female' | string;
  teamIds?: string[];
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  leagueId?: string | null;
  seasonId: string;
  competitionYear: number;
  shooterIds?: string[];
  captainName?: string;
  captainEmail?: string;
  captainPhone?: string;
}

export interface ScoreEntry {
  id: string;
  seasonId: string;
  seasonName?: string;
  leagueId: string;
  leagueName?: string;
  leagueType: FirestoreLeagueSpecificDiscipline;
  teamId: string;
  teamName?: string;
  clubId: string;
  shooterId: string;
  shooterName?: string;
  shooterGender?: Shooter['gender'];
  durchgang: number;
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post';
  competitionYear: number;
  enteredByUserId: string;
  enteredByUserName: string;
  entryTimestamp: Timestamp;
  lastEditedByUserId?: string;
  lastEditedByUserName?: string;
  lastEditTimestamp?: Timestamp;
}

export interface ShooterDisplayResults {
  shooterId: string;
  shooterName: string;
  shooterGender?: Shooter['gender'];
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
  shooterGender?: Shooter['gender'];
  teamName: string;
  results: { [roundKey: string]: number | null };
  totalScore: number;
  averageScore: number | null;
  roundsShot: number;
  rank?: number;
  competitionYear?: number; // Hinzugefügt für Kontext im Modal
}

export interface PendingScoreEntry {
  tempId: string;
  seasonId: string;
  seasonName?: string;
  leagueId: string;
  leagueName?: string;
  leagueType: FirestoreLeagueSpecificDiscipline;
  teamId: string;
  teamName?: string;
  clubId: string;
  shooterId: string;
  shooterName?: string;
  shooterGender?: Shooter['gender'];
  durchgang: number;
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post';
  competitionYear: number;
}

export type TeamValidationInfo = Team & {
    leagueType?: FirestoreLeagueSpecificDiscipline;
    leagueCompetitionYear?: number;
    currentShooterCount?: number;
};

export interface LeagueUpdateEntry {
  id?: string;
  leagueId: string;
  leagueName: string;
  leagueType: FirestoreLeagueSpecificDiscipline;
  competitionYear: number;
  timestamp: Timestamp;
  action: 'results_added';
}

export interface SupportTicket {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: Timestamp;
  status: 'neu' | 'in Bearbeitung' | 'gelesen' | 'geschlossen';
  reportedByUserId?: string | null;
}

export interface UserPermission {
  uid: string; // Ist die Dokument-ID in Firestore, hier für Typisierung
  email: string;
  displayName?: string | null;
  role: 'vereinsvertreter' | 'mannschaftsfuehrer' | null;
  clubIds: string[] | null; // Array von Club-IDs
  lastUpdated?: Timestamp;
  forcePasswordChange?: boolean; // Für späteres Feature
}

export interface VereinContextType {
  userPermission: UserPermission | null;
  loadingPermissions: boolean;
  permissionError: string | null;
}
