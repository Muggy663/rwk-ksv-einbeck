export interface TrainingResult {
  id: string;
  userId: string;
  groupId?: string;
  competitionId?: string;
  
  // Basis-Daten
  discipline: string;
  shots: number;
  rings: number; // Hauptergebnis (ganze Ringe)
  ringsWithDecimals?: number; // Ergebnis mit Zehntel
  average: number;
  date: Date;
  typ: 'training' | 'wettkampf' | 'meisterschaft' | 'pokal';
  
  // Ort & Umgebung
  location: string; // standort
  shootingRange?: string; // schiessstand
  weather?: string; // wetter
  
  // Ausrüstung
  ammunition?: string; // munition
  weapon?: string; // waffe
  
  // Serien-Details
  series?: {
    id: string;
    seriesNumber: number;
    shots: { number: number; value: number; ring?: number }[];
    total: number;
  }[];
  
  // Notizen & Metadaten
  notes?: string; // notizen
  proofType: 'photo' | 'trust' | 'verified';
  photoUrl?: string;
  verified: boolean;
  verifiedBy?: string;
  sourceType?: 'manual' | 'schiessnachweis' | 'import';
  schiessnachweis_id?: string;
  createdAt: Date;
}

export interface TrainingGroup {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  members: string[];
  isPublic: boolean;
  createdAt: Date;
}

export interface LiveCompetition {
  id: string;
  name: string;
  discipline: string;
  startTime: Date;
  endTime: Date;
  participants: string[];
  results: TrainingResult[];
  status: 'upcoming' | 'active' | 'finished';
}
