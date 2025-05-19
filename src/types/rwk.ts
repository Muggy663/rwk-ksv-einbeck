// src/types/rwk.ts

// Diese Typen repräsentieren die Werte, wie sie in Firestore gespeichert sind
export type FirestoreCompetitionDiscipline = 'KK' | 'LG' | 'LP' | 'SP';

// Diese Typen repräsentieren die Auswahlmöglichkeiten im UI-Dropdown
export type UIDisciplineSelection = 'KK' | 'LD'; // LD für Luftdruck (LG/LP)

export interface CompetitionDisplayConfig {
  year: number;
  discipline: UIDisciplineSelection;
  displayName: string;
}

export interface Season {
  id: string;
  year: number;
  type: FirestoreCompetitionDiscipline; // 'KK' oder 'LD' (als Haupttyp der Saison)
  name: string;
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
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
  contactName?: string;
  contactEmail?: string;
}

export interface Shooter {
  id: string;
  name?: string; // Wird aus firstName und lastName generiert
  firstName?: string;
  lastName?: string;
  clubId?: string;
  gender?: 'male' | 'female' | string; // string für Flexibilität, 'diverse' evtl. später
  teamIds?: string[]; // In welchen Teams ist der Schütze gemeldet
}

export interface Team {
  id: string;
  name: string;
  clubId: string; // Pflichtfeld
  leagueId: string;
  competitionYear: number;
  shooterIds?: string[]; // Liste der zugeordneten Schützen-IDs
}

// Struktur für einen einzelnen Ergebniseintrag in Firestore (Collection: rwk_scores)
export interface ScoreEntry {
  id?: string; // Optional, da es von Firestore generiert wird
  competitionYear: number;
  durchgang: number; // Runde (z.B. 1, 2, 3, 4, 5)
  leagueId: string;
  leagueName?: string; // Denormalisiert für einfachere Anzeige
  teamId: string;
  teamName?: string; // Denormalisiert
  shooterId: string;
  shooterName?: string; // Denormalisiert
  shooterGender?: 'male' | 'female' | string;
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post'; // Regulär, Vorschießen, Nachschießen
  enteredByUserId?: string; // ID des Benutzers, der das Ergebnis eingetragen hat
  enteredByUserName?: string; // Name des Benutzers
  entryTimestamp?: any; // Firestore Timestamp (beim Schreiben serverTimestamp())
  clubId?: string; // Denormalisiert, Verein des Schützen/Teams
  clubName?: string; // Denormalisiert
}


// Wird für die Anzeige in der Mannschaftstabelle verwendet (aufgeklappte Details)
export interface ShooterDisplayResults {
  shooterId: string;
  shooterName: string;
  results: { [roundKey: string]: number | null }; // z.B. { dg1: 280, dg2: 275, ... }
  average: number | null;
  total: number | null;
  roundsShot: number;
  teamId: string; // Hinzugefügt für Kontext
  leagueId: string; // Hinzugefügt für Kontext
  competitionYear: number; // Hinzugefügt für Kontext
}

// Wird für die Anzeige der Mannschaftstabelle verwendet
export interface TeamDisplay extends Team {
  clubName?: string;
  rank?: number;
  shootersResults: ShooterDisplayResults[]; // Detaillierte Ergebnisse der Schützen
  roundResults: { [key: string]: number | null }; // Mannschaftsergebnis pro Durchgang
  totalScore: number;
  averageScore: number | null;
  numScoredRounds: number;
}

// Wird für die Anzeige der Ligen verwendet
export interface LeagueDisplay extends League {
  teams: TeamDisplay[];
}

// Hauptdatenstruktur für die RWK-Tabellenansicht
export interface AggregatedCompetitionData {
  id: string; // z.B. "2025-KK"
  config: CompetitionDisplayConfig;
  leagues: LeagueDisplay[];
}

// Wird für die Anzeige der Einzelschützen-Rangliste verwendet
export interface IndividualShooterDisplayData {
  shooterId: string;
  shooterName: string;
  shooterGender?: 'male' | 'female' | string;
  teamName: string; // Oder Clubname, je nach Datenquelle
  clubName?: string; // Explizit Clubname
  results: { [roundKey: string]: number | null };
  totalScore: number;
  averageScore: number | null;
  roundsShot: number;
  rank?: number;
}

// Für die Admin-Seite "Ergebniserfassung" - zwischengespeicherte Einträge
export interface PendingScoreEntry {
  // Enthält alle Felder von ScoreEntry, aber id ist hier client-generiert für die Liste
  tempId: string; // Eindeutige ID für die Liste im Client
  seasonId: string; // Zur Anzeige und späterem Speichern
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
  competitionYear: number; // Wichtig für die Firestore-Abfrage
}
