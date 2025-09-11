// src/lib/utils/club-utils.ts
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Holt die Club-ID für einen authentifizierten Benutzer
 */
export async function getUserClubId(uid: string): Promise<string | null> {
  try {
    console.log('Loading clubId for uid:', uid);
    const userDoc = await getDoc(doc(db, 'user_permissions', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('User permissions data:', data);
      return data.clubId || null;
    } else {
      console.log('No user_permissions document found for uid:', uid);
    }
    return null;
  } catch (error) {
    console.error('Fehler beim Laden der Club-ID:', error);
    return null;
  }
}

/**
 * Generiert Collection-Pfad für verein-spezifische Daten
 */
export function getClubCollection(clubId: string, collectionName: string): string {
  return `clubs/${clubId}/${collectionName}`;
}

/**
 * Validiert Club-ID Format
 */
export function isValidClubId(clubId: string): boolean {
  return /^[a-z0-9-]+$/.test(clubId) && clubId.length >= 3 && clubId.length <= 50;
}

/**
 * Normalisiert Club-Namen zu gültiger ID
 */
export function normalizeClubId(clubName: string): string {
  return clubName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Standard Club-Collections für Vereinssoftware
 */
export const CLUB_COLLECTIONS = {
  MITGLIEDER: 'mitglieder',
  PROTOKOLLE: 'vereinsrecht_protokolle',
  WAHLEN: 'vereinsrecht_wahlen',
  SATZUNG: 'vereinsrecht_satzung',
  COMPLIANCE: 'vereinsrecht_compliance',
  SPENDEN: 'vereinsrecht_spenden',
  FINANZEN: 'finanzen',
  AUFGABEN: 'aufgaben',
  BEITRAEGE: 'beitraege',
  JUBILAEEN: 'jubilaeen'
} as const;