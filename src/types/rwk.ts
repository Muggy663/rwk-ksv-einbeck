import { Timestamp } from 'firebase/firestore';

export type FirestoreLeagueSpecificDiscipline = 'KKG' | 'KKS' | 'KKP' | 'LGA' | 'LGS' | 'LP' | 'LPF';

export interface LeagueUpdateEntry {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueType: FirestoreLeagueSpecificDiscipline;
  competitionYear: number;
  timestamp: Timestamp;
}

export interface Shooter {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'unknown';
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  leagueId: string;
  competitionYear: number;
  leagueType: FirestoreLeagueSpecificDiscipline;
  shooters?: Shooter[];
}

export interface TeamDisplay {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  leagueId: string;
  competitionYear: number;
  outOfCompetition?: boolean;
  outOfCompetitionReason?: string;
  shootersResults: ShooterDisplayResults[];
  roundResults: Record<string, number | null>;
  totalScore: number;
  averageScore: number | null;
  numScoredRounds: number;
  leagueType: string;
  rank?: number;
}

export interface ShooterDisplayResults {
  shooterId: string;
  shooterName: string;
  shooterGender: string;
  results: Record<string, number | null>;
  average: number | null;
  total: number;
  roundsShot: number;
  teamId: string;
  leagueId: string;
  competitionYear: number;
  leagueType: string;
}

export interface IndividualShooterDisplayData {
  shooterId: string;
  shooterName: string;
  shooterGender: string;
  teamName: string;
  results: Record<string, number | null>;
  totalScore: number;
  averageScore: number | null;
  roundsShot: number;
  rank?: number;
  competitionYear?: number;
  leagueId?: string;
  leagueType?: string;
  teamOutOfCompetition?: boolean;
  teamOutOfCompetitionReason?: string;
}

export interface LeagueDisplay {
  id: string;
  name: string;
  type: string;
  shortName?: string;
  competitionYear: number;
  teams: TeamDisplay[];
  individualLeagueShooters: IndividualShooterDisplayData[];
}

export interface DisciplineFilterOption {
  value: string;
  label: string;
  firestoreTypes: FirestoreLeagueSpecificDiscipline[];
}

export interface LeagueDisciplineOption {
  value: string;
  label: string;
}

export interface UserPermission {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string | null;
  clubId: string | null;
  lastUpdated?: Timestamp;
  lastLogin?: Timestamp;
}

export const uiDisciplineFilterOptions: DisciplineFilterOption[] = [
  { 
    value: 'kk', 
    label: 'Kleinkaliber (KK)', 
    firestoreTypes: ['KKG', 'KKS', 'KKP'] 
  }
];

export const leagueDisciplineOptions: LeagueDisciplineOption[] = [
  { value: 'all', label: 'Alle Disziplinen' }
];

export const MAX_SHOOTERS_PER_TEAM = 3;

export function getUIDisciplineValueFromSpecificType(specificType: FirestoreLeagueSpecificDiscipline | string): string {
  const option = uiDisciplineFilterOptions.find(opt => opt.firestoreTypes.includes(specificType as FirestoreLeagueSpecificDiscipline));
  return option ? option.value : '';
}

/**
 * Gibt die Kategorie einer Disziplin zurück
 * Ein Schütze darf pro Saison in verschiedenen Kategorien antreten,
 * aber nur einmal pro Kategorie
 * @param disciplineType - Disziplintyp
 * @returns Kategorie der Disziplin
 */
export function getDisciplineCategory(disciplineType: string): string {
  if (!disciplineType) return 'unknown';
  
  const upperType = disciplineType.toUpperCase();
  
  // Kleinkaliber Gewehr (KKG, KKS)
  if (upperType === 'KKG' || upperType === 'KKS' || upperType.includes('GEWEHR')) {
    return 'kk-gewehr';
  }
  // Kleinkaliber Pistole (KKP)
  else if (upperType === 'KKP' || (upperType.includes('KK') && upperType.includes('PISTOL'))) {
    return 'kk-pistole';
  }
  // Luftgewehr (LGA, LGS)
  else if (upperType === 'LGA' || upperType === 'LGS' || upperType.includes('LUFTGEWEHR')) {
    return 'luftgewehr';
  }
  // Luftpistole (LP, LPF)
  else if (upperType === 'LP' || upperType === 'LPF' || upperType.includes('LUFTPISTOL')) {
    return 'luftpistole';
  }
  // Sportpistole
  else if (upperType.includes('SPORTPISTOL')) {
    return 'sportpistole';
  }
  
  return 'unknown';
}