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
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  competitionYear: number;
  type: FirestoreCompetitionDiscipline; // KK, LG, LP, SP
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
  firstName?: string; // Neu für detailliertere Eingabe
  lastName?: string;  // Neu für detailliertere Eingabe
  name: string; // Kombinierter Name, wird generiert oder gespeichert
  clubId: string; // Geändert zu Pflichtfeld
  gender?: 'male' | 'female' | string; // 'male' oder 'female' bevorzugt
  teamIds?: string[];
  // competitionYear?: number; // Ist eher bei ScoreEntry relevant
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
  clubId?: string; // Kann nützlich sein für manche Abfragen
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
  teamId?: string; // Optional, für Kontext
  leagueId?: string; // Optional, für Kontext
  competitionYear?: number; // Optional, für Kontext
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

export interface LeagueDisplay extends League { // Erbt jetzt direkt von League
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
  tempId: string; // Für clientseitige Identifizierung vor dem Speichern
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
  // Optional: clubId und clubName könnten hier auch nützlich sein
}
