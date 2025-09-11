// src/lib/auth/club-auth.ts
import { auth } from '@/lib/firebase/config';
import { getUserClubId } from '@/lib/utils/club-utils';

/**
 * Validiert ob der aktuelle Benutzer Zugriff auf einen bestimmten Verein hat
 */
export async function validateClubAccess(clubId: string): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }

    const userClubId = await getUserClubId(currentUser.uid);
    return userClubId === clubId;
  } catch (error) {
    console.error('Fehler bei Club-Berechtigung:', error);
    return false;
  }
}

/**
 * Holt die Club-ID des aktuell eingeloggten Benutzers
 */
export async function getCurrentUserClubId(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }

    return await getUserClubId(currentUser.uid);
  } catch (error) {
    console.error('Fehler beim Laden der Club-ID:', error);
    return null;
  }
}

/**
 * Prüft ob der Benutzer Vereinsvorstand oder Admin ist
 */
export async function hasClubAdminAccess(clubId: string): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }

    const hasAccess = await validateClubAccess(clubId);
    if (!hasAccess) {
      return false;
    }

    return true; // Temporär alle mit Club-Zugriff als Admin
  } catch (error) {
    console.error('Fehler bei Admin-Berechtigung:', error);
    return false;
  }
}