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
  // SP wurde entfernt

export const GEWEHR_DISCIPLINES: FirestoreLeagueSpecificDiscipline[] = ['KKG', 'LG', 'LGA'];
export const PISTOL_DISCIPLINES: FirestoreLeagueSpecificDiscipline[] = ['KKP', 'LP', 'LPA'];
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
export type UIDisciplineSelection = 'KK' | 'LD'; // 'SP' wurde entfernt

export const uiDisciplineFilterOptions: { value: UIDisciplineSelection, label: string, firestoreTypes: FirestoreLeagueSpecificDiscipline[] }[] = [
  { value: 'KK', label: 'Kleinkaliber (KK)', firestoreTypes: ['KKG', 'KKP'] },
  { value: 'LD', label: 'Luftdruck (LG/LP)', firestoreTypes: ['LG', 'LGA', 'LP', 'LPA'] },
];

// Konfiguration für die Anzeige von Wettkämpfen (Jahr und UI-Disziplin)
export interface CompetitionDisplayConfig {
  year: number;
  discipline: UIDisciplineSelection;
  displayName: string;
}

// Diese statische Liste wird nicht mehr für die Jahresauswahl in RWK-Tabellen verwendet.
// Die Jahre werden jetzt dynamisch aus der 'seasons'-Collection geladen.
// export const AVAILABLE_YEARS: number[] = [currentActualYear, currentActualYear - 1, currentActualYear + 1].sort((a,b) => b - a);

export const AVAILABLE_UI_DISCIPLINES: { value: UIDisciplineSelection; label: string }[] = [
  { value: 'KK', label: 'Kleinkaliber (KK)' },
  { value: 'LD', label: 'Luftdruck (LG/LP)' },
];

export interface Season {
  id: string;
  competitionYear: number; // z.B. 2025
  name: string; // z.B. "RWK 2025 Kleinkaliber"
  type: UIDisciplineSelection; // 'KK' oder 'LD' - Hauptkategorie der Saison
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
}

export interface League {
  id: string;
  name: string; // z.B. "Kreisoberliga"
  shortName?: string; // z.B. "KOL"
  seasonId: string; // Referenz zur Season
  competitionYear: number; // z.B. 2025 (redundant, aber nützlich für Queries)
  type: FirestoreLeagueSpecificDiscipline; // Spezifischer Typ wie 'KKG', 'LGA'
  order?: number; // Für Sortierung der Ligen
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
  gender?: 'male' | 'female' | string; // 'male' oder 'female' bevorzugt
  teamIds?: string[]; // IDs der Teams, denen der Schütze (über alle Saisons/Disziplinen) zugeordnet ist
}

export interface Team {
  id: string;
  name: string; // z.B. "SV Musterdorf I"
  clubId: string;
  leagueId?: string | null; // Kann null sein, wenn Team neu vom VV angelegt und noch keiner Liga zugewiesen
  seasonId: string; // Referenz zur Saison
  competitionYear: number; // z.B. 2025
  shooterIds?: string[];
  captainName?: string;
  captainEmail?: string;
  captainPhone?: string;
}

// Repräsentiert einen einzelnen Ergebnis-Eintrag in der DB
export interface ScoreEntry {
  id: string;
  seasonId: string;
  seasonName?: string; // Denormalisiert für einfache Anzeige
  leagueId: string;
  leagueName?: string; // Denormalisiert
  leagueType: FirestoreLeagueSpecificDiscipline; // Wichtig für Validierungen und Filter
  teamId: string;
  teamName?: string; // Denormalisiert
  clubId: string; // ID des Vereins der Mannschaft
  shooterId: string;
  shooterName?: string; // Denormalisiert
  shooterGender?: Shooter['gender']; // Denormalisiert
  durchgang: number; // Rundennummer (z.B. 1, 2, 3, 4, 5)
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post'; // Normal, Vor-, Nachschießen
  competitionYear: number;
  enteredByUserId: string;
  enteredByUserName: string;
  entryTimestamp: Timestamp;
  lastEditedByUserId?: string;
  lastEditedByUserName?: string;
  lastEditTimestamp?: Timestamp;
}

// Für die Anzeige der Ergebnisse eines Schützen in einer Mannschaftstabelle
export interface ShooterDisplayResults {
  shooterId: string;
  shooterName: string;
  results: { [roundKey: string]: number | null }; // z.B. { dg1: 280, dg2: 275 }
  average: number | null;
  total: number | null;
  roundsShot: number;
  // Optional: Kontextinformationen, falls benötigt
  teamId?: string;
  leagueId?: string;
  competitionYear?: number;
}

// Für die Anzeige einer Mannschaft in der RWK-Tabelle
export interface TeamDisplay extends Team {
  clubName: string;
  rank?: number;
  shootersResults: ShooterDisplayResults[]; // Ergebnisse der Einzelschützen dieses Teams
  roundResults: { [key: string]: number | null }; // Mannschaftsergebnis pro Durchgang
  totalScore: number;
  averageScore: number | null;
  numScoredRounds: number; // Anzahl der Durchgänge mit gewertetem Mannschaftsergebnis
}

// Für die Anzeige einer Liga in der RWK-Tabelle
export interface LeagueDisplay extends League {
  teams: TeamDisplay[];
}

// Für die gesamte Datenstruktur einer Wettkampfanzeige (Jahr + Disziplin)
export interface AggregatedCompetitionData {
  id: string; // z.B. "2025-KK"
  config: CompetitionDisplayConfig;
  leagues: LeagueDisplay[];
}

// Für die Anzeige in der Einzelschützenrangliste
export interface IndividualShooterDisplayData {
  shooterId: string;
  shooterName: string;
  shooterGender?: Shooter['gender'];
  teamName: string; // Name des Teams, für das die meisten/letzten Ergebnisse erzielt wurden
  results: { [roundKey: string]: number | null }; // { dg1: 280, dg2: 275 }
  totalScore: number;
  averageScore: number | null;
  roundsShot: number;
  rank?: number;
}

// Für temporär in der UI gehaltene, noch nicht gespeicherte Ergebnisse
export interface PendingScoreEntry {
  tempId: string; // Eindeutige ID für die UI-Liste
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

// Für die Validierung von Teams bei der Schützenzuweisung
export type TeamValidationInfo = Team & {
    leagueType?: FirestoreLeagueSpecificDiscipline;
    leagueCompetitionYear?: number;
    currentShooterCount?: number;
};

// Für den "Letzte Änderungen"-Feed auf der Startseite
export interface LeagueUpdateEntry {
  id?: string;
  leagueId: string;
  leagueName: string;
  leagueType: FirestoreLeagueSpecificDiscipline; // z.B. KKG, LGA
  competitionYear: number;
  timestamp: Timestamp;
  action: 'results_added'; // Oder andere Aktionen später
}

// Für Support-Tickets
export interface SupportTicket {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: Timestamp;
  status: 'neu' | 'gelesen' | 'geschlossen'; // Optional für späteres Management
  reportedByUserId?: string | null; // UID des eingeloggten Benutzers, falls vorhanden
}

// Für Benutzerberechtigungen in Firestore
export interface UserPermission {
  uid: string; // Ist die Dokument-ID
  email: string;
  displayName?: string | null;
  role: 'vereinsvertreter' | 'mannschaftsfuehrer' | null;
  clubIds: string[] | null; // Array von Club-IDs, denen der Benutzer zugeordnet ist (max 3)
  lastUpdated?: Timestamp;
}

// Für den VereinContext
export interface VereinContextType {
  userPermission: UserPermission | null;
  loadingPermissions: boolean;
  permissionError: string | null;
  // assignedClubIds: string[] | null; // Abgeleitet von userPermission.clubIds
}
