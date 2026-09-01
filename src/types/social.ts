export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  clubId?: string;
  clubName?: string;
  profileImage?: string;
  
  // Freigabe-Einstellungen
  isPublic: boolean;
  shareResults: boolean;
  availableForCompetitions: boolean;
  showClubAffiliation: boolean;
  
  // Statistiken (nur wenn shareResults = true)
  statistics?: {
    totalTrainings: number;
    totalCompetitions: number;
    favoriteDiscipline: string;
    bestResult: {
      discipline: string;
      score: number;
      date: Date | string;
    };
    recentActivity: Date;
  };
  
  createdAt: Date;
  lastActive: Date;
}

export interface TrainingGroup {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  joinCode: string; // 6-stellig
  members: string[]; // userIds
  admins: string[]; // userIds
  isActive: boolean;
  maxMembers: number;
  ownerId?: string; // Legacy-Feld für Eigentümer-Prüfung
  archiveReason?: string; // Grund der Archivierung (falls archiviert)
  
  settings: {
    allowCompetitions: boolean;
    publicResults: boolean;
    autoAcceptMembers: boolean;
    requiresPremium: boolean; // für Live-Wettkämpfe
  };
  
  createdAt: Date;
  lastActivity: Date;
}

export interface LiveCompetition {
  id: string;
  name: string;
  groupId: string;
  discipline: string;
  shotCount: number;
  createdBy: string;
  
  status: 'waiting' | 'active' | 'finished';
  participants: string[];
  
  startTime?: Date;
  endTime?: Date;
  
  settings: {
    timeLimit?: number; // Minuten
    allowLateJoin: boolean;
    showLiveResults: boolean;
  };
  
  // Premium Feature Check
  requiresPremium: true;
}

export interface CompetitionResult {
  userId: string;
  competitionId: string;
  serien: any[]; // Nutzt bestehende ZehnerSerie Struktur
  totalScore: number;
  totalRings: number;
  submittedAt: Date;
  position?: number;
}
