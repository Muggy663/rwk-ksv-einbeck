import { Timestamp } from 'firebase/firestore';

export type FirestoreLeagueSpecificDiscipline = 
  | 'KKG' 
  | 'KKS' 
  | 'KKP'
  | 'LGA' 
  | 'LGS' 
  | 'LP' 
  | 'LPF';

export interface LeagueUpdateEntry {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueType: FirestoreLeagueSpecificDiscipline;
  competitionYear: number;
  timestamp: Timestamp;
}

export const uiDisciplineFilterOptions = [
  { 
    value: 'kk', 
    label: 'Kleinkaliber (KK)', 
    firestoreTypes: ['KKG', 'KKS', 'KKP'] 
  }
];

export const leagueDisciplineOptions = [
  { value: 'all', label: 'Alle Disziplinen' }
];

export const MAX_SHOOTERS_PER_TEAM = 3;

export function getUIDisciplineValueFromSpecificType(specificType: FirestoreLeagueSpecificDiscipline): string {
  const option = uiDisciplineFilterOptions.find(opt => opt.firestoreTypes.includes(specificType));
  return option ? option.value : '';
}