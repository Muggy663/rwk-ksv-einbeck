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
  competitionYear: number; // Ersetzt year und type für die eindeutige Identifizierung der Wettkampfperiode
  name: string; // z.B. "RWK 2025 Kleinkaliber"
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
  // UIDiscipline repräsentiert, ob es eine KK oder LD Saison ist (für die UI-Filterung)
  // Dieses Feld könnte auch direkt im Dokument gespeichert werden oder aus dem Namen/Typ abgeleitet werden.
  // Vorerst wird angenommen, dass es Teil des Saison-Objekts ist, das von Firestore kommt.
  uiDiscipline: UIDisciplineSelection;
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  competitionYear: number; // z.B. 2025
  type: FirestoreCompetitionDiscipline; // 'KK', 'LG', 'LP', 'SP' -> Wichtig für Firestore-Abfragen
  order?: number;
  // seasonId wurde durch competitionYear ersetzt/ergänzt
}

export interface Club {
  id: string; // Wird client- oder serverseitig generiert
  name: string;
  shortName?: string;
  clubNumber?: string; // Format: 08-XXX
  contactName?: string;
  contactEmail?: string;
}

export interface Shooter {
  id: string;
  name?: string; // Wird aus firstName und lastName generiert
  firstName?: string;
  lastName?: string;
  clubId?: string; // Referenz zum Verein
  gender?: 'male' | 'female' | string; // string für Flexibilität
  teamIds?: string[]; // In welchen Teams ist der Schütze gemeldet für eine best. Saison/Disziplin
  // competitionYear?: number; // Wenn Schützen pro Saison verwaltet werden
}

export interface Team {
  id: string;
  name: string;
  clubId?: string; // Kann optional sein, wenn Vereine nicht streng geführt werden
  leagueId: string;
  competitionYear: number;
  shooterIds?: string[];
}

// Dieser Typ repräsentiert einen einzelnen Ergebnis-Eintrag, wie er in rwk_scores gespeichert ist
export interface ScoreEntry {
  id?: string; // Firestore-Dokument-ID
  competitionYear: number;
  durchgang: number; // Runde, z.B. 1, 2, 3, 4, 5
  leagueId: string;
  leagueName?: string; // Denormalisiert für einfachere Anzeige
  teamId: string;
  teamName?: string; // Denormalisiert
  clubId?: string;
  clubName?: string; // Denormalisiert
  shooterId: string;
  shooterName?: string; // Denormalisiert
  shooterGender?: 'male' | 'female' | string; // Für "Beste Dame" etc.
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post'; // Regulär, Vor-, Nachschießen
  enteredByUserId?: string;
  enteredByUserName?: string;
  entryTimestamp?: any; // Firestore Timestamp
}


// --- Anzeige-spezifische Typen (abgeleitet/aggregiert für die RWK Tabellenansicht) ---

export interface ShooterDisplayResults {
  shooterId: string;
  shooterName: string;
  results: { [roundKey: string]: number | null }; // z.B. { dg1: 280, dg2: 275, ... }
  average: number | null;
  total: number | null;
  roundsShot: number;
  // Optional: Referenzen, falls benötigt
  teamId?: string;
  leagueId?: string;
  competitionYear?: number;
}

export interface TeamDisplay extends Team {
  clubName: string; // Wird versucht aus clubId zu laden oder aus team.name zu extrahieren
  rank?: number;
  shootersResults: ShooterDisplayResults[]; // Individuelle Ergebnisse der Schützen dieses Teams
  roundResults: { [key: string]: number | null }; // Mannschaftsergebnisse pro Durchgang, z.B. { dg1: 850, dg2: 840 }
  totalScore: number; // Gesamt Mannschaftspunkte
  averageScore: number | null; // Durchschnitt der Mannschaftspunkte pro gewertetem Durchgang
  numScoredRounds: number; // Anzahl der Durchgänge, für die ein Mannschaftsergebnis vorliegt
}

export interface LeagueDisplay extends League {
  teams: TeamDisplay[];
}

export interface AggregatedCompetitionData {
  id: string; // z.B. "2025-KK"
  config: CompetitionDisplayConfig;
  leagues: LeagueDisplay[];
}

// Für die Einzelschützen-Rangliste
export interface IndividualShooterDisplayData {
  shooterId: string;
  shooterName: string;
  shooterGender?: 'male' | 'female' | string;
  teamName: string; // In welchem Team/Verein hat der Schütze geschossen (aus Score-Daten)
  results: { [roundKey: string]: number | null }; // { dg1: 95, dg2: 92, ... }
  totalScore: number;
  averageScore: number | null;
  roundsShot: number;
  rank?: number;
}

export interface PendingScoreEntry {
  tempId: string;
  seasonId: string; // Wird im Formular ausgewählt, aber competitionYear ist für DB relevant
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
