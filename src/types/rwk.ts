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
  id: string; // z.B. s2025
  year: number;
  // type: UIDisciplineSelection; // UI relevante Auswahl, könnte hier auch FirestoreCompetitionDiscipline sein, je nach Anwendungsfall
  name: string;
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
  // Optional: Array von FirestoreCompetitionDiscipline, die in dieser Saison angeboten werden, z.B. ['KK', 'SP'] oder ['LG', 'LP']
  activeDisciplines?: FirestoreCompetitionDiscipline[];
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  competitionYear: number; // z.B. 2025
  type: FirestoreCompetitionDiscipline; // 'KK', 'LG', 'LP', 'SP'
  order?: number;
  // seasonId: string; // Referenz zur Saison, wenn Seasons eine eigene Collection sind und competitionYear nicht ausreicht
}

export interface Club {
  id: string; // Wird client- oder serverseitig generiert
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
  clubId?: string; // Referenz zum Verein
  gender?: 'male' | 'female' | string; // string für Flexibilität
  teamIds?: string[]; // In welchen Teams ist der Schütze gemeldet für eine best. Saison/Disziplin
                      // Evtl. besser als Subcollection unter Schütze oder Team
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  leagueId: string;
  competitionYear: number;
  shooterIds?: string[]; // Liste der zugeordneten Stamm-Schützen-IDs
                        // Für Wettkampfergebnisse werden die Scores in rwk_scores pro Schütze/Team/Durchgang gespeichert
}

export interface ScoreEntry {
  id?: string;
  competitionYear: number;
  durchgang: number;
  leagueId: string;
  leagueName?: string;
  teamId: string;
  teamName?: string;
  clubId?: string; // Verein des Teams/Schützen zum Zeitpunkt des Eintrags
  clubName?: string;
  shooterId: string;
  shooterName?: string;
  shooterGender?: 'male' | 'female' | string;
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post';
  enteredByUserId?: string;
  enteredByUserName?: string;
  entryTimestamp?: any; // Firestore Timestamp
}


// --- Anzeige-spezifische Typen (abgeleitet/aggregiert) ---

export interface ShooterDisplayResults {
  shooterId: string;
  shooterName: string;
  results: { [roundKey: string]: number | null };
  average: number | null;
  total: number | null;
  roundsShot: number;
  teamId: string;
  leagueId: string;
  competitionYear: number;
}

export interface TeamDisplay extends Team {
  clubName: string; // Nicht-optional für die Anzeige
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
  teamName: string; // Verein/Team des Schützen, wie im Score vermerkt
  results: { [roundKey: string]: number | null };
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
