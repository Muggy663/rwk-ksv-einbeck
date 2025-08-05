// src/types/rwk.ts
export type FirestoreLeagueSpecificDiscipline = 'KK' | 'KKP' | 'KKG' | 'LG' | 'LGA' | 'LP' | 'LPA';

export interface Season {
  id: string;
  name: string;
  competitionYear: number;
  type: string;
  status: 'Vorbereitung' | 'Laufend' | 'Abgeschlossen';
  startDate?: Date;
  endDate?: Date;
}

export interface League {
  id: string;
  name: string;
  shortName?: string;
  type: FirestoreLeagueSpecificDiscipline;
  seasonId: string;
  competitionYear: number;
  order?: number;
  shotSettings?: {
    discipline: string;
    shotCount: number;
    maxRings: number;
    description?: string;
    customDiscipline?: string;
  };
}

export interface Club {
  id: string;
  name: string;
  shortName?: string;
  address?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  leagueId: string;
  competitionYear: number;
  shooterIds: string[];
  teamLeader?: string;
  teamLeaderEmail?: string;
  teamLeaderPhone?: string;
  outOfCompetition?: boolean;
  outOfCompetitionReason?: string;
}

export interface Shooter {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  gender: 'male' | 'female' | 'unknown';
  birthYear?: number;
  birthDate?: Date;
  clubId?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  // KM-spezifische Felder
  mitgliedsnummer?: string;
  sondergenehmigung?: boolean; // Für Schützen unter 12 Jahren
}

// Wettkampfklassen für automatische Zuordnung
export interface AgeClass {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'mixed';
  minBirthYear: number;
  maxBirthYear: number;
  competitionYear: number;
  discipline?: FirestoreLeagueSpecificDiscipline;
}

// Funktion zur Berechnung der Altersklasse
export function calculateAgeClass(birthYear: number, gender: 'male' | 'female', competitionYear: number = 2026): string {
  const age = competitionYear - birthYear;
  const genderSuffix = gender === 'male' ? ' m' : ' w';
  
  if (age <= 12) return 'Schüler' + genderSuffix;
  if (age <= 17) return 'Jugend' + genderSuffix;
  if (age <= 20) return 'Junioren A' + genderSuffix;
  if (age <= 22) return 'Junioren B' + genderSuffix;
  if (age <= 41) return gender === 'male' ? 'Herren I' : 'Damen I';
  if (age <= 51) return gender === 'male' ? 'Herren II' : 'Damen II';
  if (age <= 61) return gender === 'male' ? 'Herren III' : 'Damen III';
  if (age <= 71) return gender === 'male' ? 'Herren IV' : 'Damen IV';
  if (age <= 76) return gender === 'male' ? 'Senioren 0' : 'Seniorinnen 0';
  if (age <= 81) return gender === 'male' ? 'Senioren I' : 'Seniorinnen I';
  if (age <= 86) return gender === 'male' ? 'Senioren II' : 'Seniorinnen II';
  if (age <= 91) return gender === 'male' ? 'Senioren III' : 'Seniorinnen III';
  if (age <= 96) return gender === 'male' ? 'Senioren IV' : 'Seniorinnen IV';
  return gender === 'male' ? 'Senioren V' : 'Seniorinnen V';
}

export function getBirthYearFromAge(age: number, competitionYear: number = 2026): number {
  return competitionYear - age;
}

export interface ScoreEntry {
  id: string;
  shooterId: string;
  shooterName: string;
  shooterGender?: string;
  teamId: string;
  teamName: string;
  clubId: string;
  leagueId: string;
  leagueType: FirestoreLeagueSpecificDiscipline;
  competitionYear: number;
  durchgang: number;
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post';
  enteredByUserId?: string;
  enteredByUserName?: string;
  entryTimestamp?: any;
  teamOutOfCompetition?: boolean;
  teamOutOfCompetitionReason?: string;
}

// Neue Interfaces für Ersatzschützen
export interface TeamSubstitution {
  id: string;
  teamId: string;
  teamName: string;
  leagueId: string;
  competitionYear: number;
  originalShooterId: string;
  originalShooterName: string;
  replacementShooterId: string;
  replacementShooterName: string;
  substitutionDate: Date;
  fromRound: number; // Ab welchem Durchgang der Ersatz gilt
  type: 'individual_to_team' | 'new_shooter';
  reason?: string; // z.B. "Krankheit", "Umzug", etc.
  transferredResults?: ScoreEntry[]; // Bei Einzelschütze → Team
  createdByUserId: string;
  createdByUserName: string;
  createdAt: Date;
}

export interface UserPermission {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'vereinsvertreter' | 'mannschaftsfuehrer';
  clubId?: string;
  representedClubs?: string[]; // Array von Club-IDs für Multi-Verein-Support
  isActive: boolean;
  createdAt?: Date;
  lastLogin?: Date;
}

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'bug' | 'feature' | 'question' | 'other';
  createdAt: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  response?: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: 'ausschreibung' | 'protokoll' | 'sonstiges';
  uploadedBy: string;
  uploadedAt: Date;
  isPublic: boolean;
  downloadCount?: number;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface LeagueUpdateEntry {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueType: FirestoreLeagueSpecificDiscipline;
  competitionYear: number;
  timestamp: Date;
  action: string;
}

// UI-spezifische Typen
export type UIDisciplineSelection = 'KK' | 'LG' | 'LP';

export interface UIDisciplineFilterOption {
  value: UIDisciplineSelection;
  label: string;
  firestoreTypes: FirestoreLeagueSpecificDiscipline[];
}

export interface LeagueDisciplineOption {
  value: FirestoreLeagueSpecificDiscipline;
  label: string;
}

export interface CompetitionDisplayConfig {
  year: number;
  discipline: UIDisciplineSelection;
  displayName: string;
}

export interface ShooterDisplayResults {
  shooterId: string;
  shooterName: string;
  shooterGender: string;
  results: { [key: string]: number | null };
  total: number | null;
  average: number | null;
  roundsShot: number;
  teamId: string;
  leagueId: string;
  competitionYear: number;
  leagueType: FirestoreLeagueSpecificDiscipline;
}

export interface TeamDisplay {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  leagueId: string;
  competitionYear: number;
  shooterIds: string[];
  shootersResults: ShooterDisplayResults[];
  roundResults: { [key: string]: number | null };
  totalScore: number | null;
  averageScore: number | null;
  numScoredRounds: number;
  leagueType: FirestoreLeagueSpecificDiscipline;
  teamLeader?: string;
  teamLeaderEmail?: string;
  teamLeaderPhone?: string;
  outOfCompetition?: boolean;
  outOfCompetitionReason?: string;
  rank?: number | null;
  sortingScore?: number;
  sortingAverage?: number;
}

export interface IndividualShooterDisplayData {
  shooterId: string;
  shooterName: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  shooterGender: string;
  teamName: string;
  results: { [key: string]: number | null };
  totalScore: number;
  averageScore: number | null;
  roundsShot: number;
  competitionYear?: number;
  leagueId?: string;
  leagueType?: FirestoreLeagueSpecificDiscipline;
  teamOutOfCompetition?: boolean;
  teamOutOfCompetitionReason?: string;
  rank?: number | null;
}

export interface LeagueDisplay {
  id: string;
  name: string;
  shortName?: string;
  type: FirestoreLeagueSpecificDiscipline;
  seasonId: string;
  competitionYear: number;
  order?: number;
  teams: TeamDisplay[];
  individualLeagueShooters: IndividualShooterDisplayData[];
}

export interface AggregatedCompetitionData {
  id: string;
  config: CompetitionDisplayConfig;
  leagues: LeagueDisplay[];
}

export interface PendingScoreEntry {
  tempId: string;
  seasonId: string;
  seasonName: string;
  leagueId: string;
  leagueName: string;
  leagueType: FirestoreLeagueSpecificDiscipline;
  teamId: string;
  teamName: string;
  clubId: string;
  shooterId: string;
  shooterName: string;
  shooterGender: string;
  durchgang: number;
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post';
  competitionYear: number;
}

export interface VereinContextType {
  userPermission: UserPermission | null;
  loadingPermissions: boolean;
  permissionError: string | null;
  assignedClubId: string | null;
  assignedClubIdArray: string[];
  currentClubId: string | null;
  switchClub: (clubId: string) => void;
}

// Konstanten
export const MAX_SHOOTERS_PER_TEAM = 3;

export const uiDisciplineFilterOptions: UIDisciplineFilterOption[] = [
  { value: 'KK', label: 'Kleinkaliber (KK, KKP, KKG)', firestoreTypes: ['KK', 'KKP', 'KKG'] },
  { value: 'LG', label: 'Luftgewehr (LG, LGA)', firestoreTypes: ['LG', 'LGA'] },
  { value: 'LP', label: 'Luftpistole (LP, LPA)', firestoreTypes: ['LP', 'LPA'] },
];

export const leagueDisciplineOptions: LeagueDisciplineOption[] = [
  { value: 'KK', label: 'Kleinkaliber Gewehr' },
  { value: 'KKP', label: 'Kleinkaliber Pistole' },
  { value: 'KKG', label: 'Kleinkaliber Gewehr (Gruppe)' },
  { value: 'LG', label: 'Luftgewehr' },
  { value: 'LGA', label: 'Luftgewehr Auflage' },
  { value: 'LP', label: 'Luftpistole' },
  { value: 'LPA', label: 'Luftpistole Auflage' },
];

export function getUIDisciplineValueFromSpecificType(specificType: FirestoreLeagueSpecificDiscipline): UIDisciplineSelection {
  if (['KK', 'KKP', 'KKG'].includes(specificType)) return 'KK';
  if (['LG', 'LGA'].includes(specificType)) return 'LG';
  if (['LP', 'LPA'].includes(specificType)) return 'LP';
  return 'KK';
}

export function getDisciplineCategory(leagueType?: FirestoreLeagueSpecificDiscipline): string | null {
  if (!leagueType) return null;
  if (['KK', 'KKP', 'KKG'].includes(leagueType)) return 'KK';
  if (['LG', 'LGA'].includes(leagueType)) return 'LG';
  if (['LP', 'LPA'].includes(leagueType)) return 'LP';
  return null;
}