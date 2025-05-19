// src/types/rwk.ts

// Repräsentiert das Konzept eines Wettkampfjahres, wird aber nicht direkt als Dokument geladen
export interface SeasonConcept {
  year: number;
  name: string; // e.g., "RWK 2025 KK"
  leagues: LeagueDisplay[];
}

export interface League {
  id: string;
  name: string; // e.g., "Kreisoberliga"
  shortName?: string; // e.g., "KOL"
  competitionYear: number; // e.g., 2025
  order?: number; // Für die Sortierung der Ligen
}

export interface Club {
  id: string;
  name: string;
}

export interface Shooter {
  id: string;
  // firstName und lastName könnten hier sein, oder nur 'name'
  name?: string; // z.B. "Max Mustermann" - aus rwk_shooters
  firstName?: string;
  lastName?: string;
  clubId?: string; // Falls Schützen direkt einem Verein zugeordnet sind und nicht nur über das Team
  teamId?: string; // Referenz zum Team in rwk_shooters
  competitionYear?: number; // In rwk_shooters
}

export interface Team {
  id: string;
  name: string; // e.g., "Verein A - Mannschaft 1"
  clubId?: string; // Referenz zu Club, falls vorhanden
  leagueId: string; // Referenz zu League
  competitionYear: number; // e.g., 2025
  shooterIds?: string[]; // Array of Shooter IDs, falls im Team-Dokument vorhanden
  // roundResults (Mannschaftsergebnisse pro DG) wird dynamisch aus rwk_scores berechnet
}

// Struktur eines einzelnen Eintrags in der rwk_scores Collection
export interface ScoreEntry {
  id: string; // Firestore document ID
  competitionYear: number;
  durchgang: number; // 1, 2, 3, 4, 5
  leagueId: string;
  shooterId: string;
  shooterName?: string; // Denormalisiert, praktisch
  teamId: string;
  teamName?: string; // Denormalisiert, praktisch
  totalRinge: number; // Das Ergebnis des Schützen für diesen Durchgang
  // weitere Felder wie enteredByUserId, entryTimestamp etc. können hier ergänzt werden
}

// Aufbereitete Ergebnisse eines Schützen für die Anzeige
export interface ShooterDisplayResults {
  shooterId: string;
  shooterName: string; // Name des Schützen
  results: {
    [roundKey: string]: number | null; // e.g., { "dg1": 95, "dg2": 92 }
  };
  average: number;
  // Verweise auf Team, Liga, Saisonkonzept für Kontext
  teamId: string;
  leagueId: string;
  competitionYear: number;
}

// Aufbereitete Mannschaftsdaten für die Anzeige
export interface TeamDisplay extends Team {
  clubName?: string;
  rank?: number;
  // Mannschaftsergebnisse pro Durchgang
  roundResults: { [key: string]: number | null }; // e.g., { "dg1": 280, "dg2": 275 }
  totalScore: number; // Gesamtergebnis der Mannschaft über alle Durchgänge
  shootersResults: ShooterDisplayResults[];
}

// Aufbereitete Ligadaten für die Anzeige
export interface LeagueDisplay extends League {
  teams: TeamDisplay[];
}

// Dieses Interface wird jetzt eher konzeptionell verwendet,
// da wir keine einzelne "Saison" laden, sondern basierend auf TARGET_COMPETITION_YEAR arbeiten.
export interface SeasonDisplay {
  id: string; // Wird z.B. TARGET_COMPETITION_YEAR.toString() sein
  name: string; // z.B. "RWK 2025 KK"
  year: number;
  leagues: LeagueDisplay[];
}
