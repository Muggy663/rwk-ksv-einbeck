// src/types/rwk.ts

export interface Season {
  id: string;
  name: string; // e.g., "Rundenwettkampf 2024/2025"
  year: number; // e.g., 2024
  // leagues?: League[]; // Optional, if fetched together
}

export interface League {
  id: string;
  name: string; // e.g., "Kreisoberliga"
  shortName?: string; // e.g., "KOL"
  // teams?: Team[]; // Optional, if fetched together
}

export interface Club {
  id: string;
  name: string;
  // additional club details if needed
}

export interface Shooter {
  id: string;
  firstName: string;
  lastName: string;
  clubId: string; // Reference to Club
  // additional shooter details if needed
}

export interface Team {
  id: string;
  name: string; // e.g., "Verein A - Mannschaft 1"
  clubId: string; // Reference to Club
  leagueId: string; // Reference to League
  seasonId: string; // Reference to Season
  shooterIds: string[]; // Array of Shooter IDs
  // results per round for the team (sum or specific rule)
  roundResults?: { [key: string]: number }; // e.g., { "dg1": 280, "dg2": 275 }
}

// Represents the results of a single shooter for all rounds in a season/league context
export interface ShooterRoundResults {
  id: string; // Typically shooterId
  shooterId: string;
  teamId: string;
  leagueId: string;
  seasonId: string;
  results: {
    [roundKey: string]: number | null; // e.g., { "dg1": 95, "dg2": 92, "dg3": null }
  };
  average?: number; // Calculated average
}

// For displaying in tables, combining data
export interface TeamDisplay extends Team {
  clubName?: string;
  totalScore?: number;
  rank?: number;
  shootersResults?: ShooterDisplayResults[];
}

export interface ShooterDisplayResults extends ShooterRoundResults {
  shooterName?: string;
}

export interface LeagueDisplay extends League {
  teams: TeamDisplay[];
}

export interface SeasonDisplay extends Season {
  leagues: LeagueDisplay[];
}
