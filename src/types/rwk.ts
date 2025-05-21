// src/types/rwk.ts
import type { Timestamp } from 'firebase/firestore';

export type FirestoreLeagueSpecificDiscipline =
  | 'KKG' // Kleinkaliber Gewehr
  | 'KKP' // Kleinkaliber Pistole
  | 'LG'  // Luftgewehr (Freihand)
  | 'LGA' // Luftgewehr Auflage
  | 'LP'  // Luftpistole (Freihand)
  | 'LPA' // Luftpistole Auflage
  | 'SP'; // Sportpistole (als eigenständige Disziplin, falls noch benötigt)

export const GEWEHR_DISCIPLINES: FirestoreLeagueSpecificDiscipline[] = ['KKG', 'LG', 'LGA'];
export const PISTOL_DISCIPLINES: FirestoreLeagueSpecificDiscipline[] = ['KKP', 'LP', 'LPA', 'SP'];
export const MAX_SHOOTERS_PER_TEAM = 3;

export function getDisciplineCategory(leagueType?: FirestoreLeagueSpecificDiscipline): 'Gewehr' | 'Pistole' | null {
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
  { value: 'SP', label: 'Sportpistole' },
];

export type UIDisciplineSelection = 'KK' | 'LD' | 'SP';

export const uiDisciplineFilterOptions: { value: UIDisciplineSelection, label: string, firestoreTypes: FirestoreLeagueSpecificDiscipline[] }[] = [
  { value: 'KK', label: 'Kleinkaliber', firestoreTypes: ['KKG', 'KKP'] },
  { value: 'LD', label: 'Luftdruck', firestoreTypes: ['LGA', 'LG', 'LPA', 'LP'] },
  // SP wurde entfernt, falls es nicht mehr benötigt wird. Wenn doch, hier wieder hinzufügen:
  // { value: 'SP', label: 'Sportpistole', firestoreTypes: ['SP'] },
];


export interface CompetitionDisplayConfig {
  year: number;
  discipline: UIDisciplineSelection;
  displayName: string;
}

export interface Season {
  id: string;
  competitionYear: number;
  name: string;
  type: UIDisciplineSelection; // 'KK' oder 'LD' oder 'SP' (für die Saison-Hauptkategorie)
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  competitionYear: number;
  type: FirestoreLeagueSpecificDiscipline; // Spezifischer Typ für Validierung
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
  name: string; // Kombinierter Name
  clubId: string;
  gender?: 'male' | 'female' | string;
  teamIds?: string[];
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  leagueId?: string | null; // Kann initial leer sein, wenn VV anlegt
  seasonId?: string; // Zugehörigkeit zur Saison, in der es angelegt wurde
  competitionYear: number;
  shooterIds?: string[];
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
  clubId: string; // Club ID des Teams, für das der Score ist
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
  leagueType?: FirestoreLeagueSpecificDiscipline;
  teamId: string;
  teamName?: string;
  clubId?: string;
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
  uid: string; // User-ID, die auch die Dokument-ID in user_permissions ist
  email: string;
  displayName?: string | null;
  role: 'vereinsvertreter' | null;
  clubIds: string[] | null; // Array mit bis zu 3 Club-IDs
  lastUpdated?: Timestamp;
}

// Context type for VereinLayout
export interface VereinContextType {
  userPermission: UserPermission | null;
  loadingPermissions: boolean;
  permissionError: string | null;
  assignedClubIds: string[] | null; // For convenience, derived from userPermission
}
