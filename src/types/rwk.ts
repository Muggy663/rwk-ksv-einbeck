// src/types/rwk.ts
import type { Timestamp } from 'firebase/firestore';

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

export function getDisciplineCategory(leagueType?: FirestoreLeagueSpecificDiscipline | null): 'Gewehr' | 'Pistole' | null {
  if (!leagueType) return null;
  if (GEWEHR_DISCIPLINES.includes(leagueType)) return 'Gewehr';
  if (PISTOL_DISCIPLINES.includes(leagueType)) return 'Pistole';
  return null;
}

export const leagueDisciplineOptions: { value: FirestoreLeagueSpecificDiscipline; label: string }[] = [
  { value: 'KKG', label: 'KK-Gewehr' },
  { value: 'KKP', label: 'KK-Pistole' },
  { value: 'LG', label: 'Luftgewehr (Freihand)' },
  { value: 'LGA', label: 'Luftgewehr Auflage' },
  { value: 'LP', label: 'Luftpistole (Freihand)' },
  { value: 'LPA', label: 'Luftpistole Auflage' },
];

export type UIDisciplineSelection = 'KK' | 'LD'; // SP wurde entfernt

export const uiDisciplineFilterOptions: { value: UIDisciplineSelection, label: string, firestoreTypes: FirestoreLeagueSpecificDiscipline[] }[] = [
  { value: 'KK', label: 'Kleinkaliber (KK)', firestoreTypes: ['KKG', 'KKP'] },
  { value: 'LD', label: 'Luftdruck (LG/LP)', firestoreTypes: ['LG', 'LGA', 'LP', 'LPA'] },
];

export interface CompetitionDisplayConfig {
  year: number;
  discipline: UIDisciplineSelection;
  displayName: string;
}

const currentActualYear = new Date().getFullYear();
export const AVAILABLE_YEARS: number[] = [currentActualYear, currentActualYear - 1, currentActualYear - 2, currentActualYear + 1].sort((a,b) => a - b); // Sortiert aufsteigend, Default wird separat gesetzt


export const AVAILABLE_UI_DISCIPLINES: { value: UIDisciplineSelection; label: string }[] = [
  { value: 'KK', label: 'Kleinkaliber (KK)' },
  { value: 'LD', label: 'Luftdruck (LG/LP)' },
];

export interface Season {
  id: string;
  competitionYear: number;
  name: string;
  type: UIDisciplineSelection;
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  competitionYear: number;
  type: FirestoreLeagueSpecificDiscipline;
  order?: number;
  seasonId: string;
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
  status: 'neu' | 'gelesen' | 'geschlossen';
  reportedByUserId?: string | null;
}

export interface UserPermission {
  uid: string; // UID des Benutzers (Dokument-ID in user_permissions)
  email: string; // E-Mail des Benutzers
  displayName?: string | null; // Anzeigename des Benutzers
  role: 'vereinsvertreter' | 'mannschaftsfuehrer' | null;
  clubIds: string[] | null; // Array von Club-IDs, denen der Benutzer zugeordnet ist
  lastUpdated?: Timestamp;
}

export interface VereinContextType {
  userPermission: UserPermission | null;
  loadingPermissions: boolean;
  permissionError: string | null;
  assignedClubIds: string[] | null; // Abgeleitet von userPermission.clubIds
  // assignedClubNames: Array<{id: string, name: string}>; // Wird jetzt in den Komponenten selbst geladen
}
