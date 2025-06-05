// src/lib/firebase/functions.ts
// Firebase Callable Cloud Functions werden aktuell nicht für die Benutzer-Rechteverwaltung verwendet.
// Die Zuweisung von Rollen/Vereinen erfolgt durch den Super-Admin direkt
// in die Firestore-Collection 'user_permissions'.
// Das Anlegen von Firebase Authentication Benutzern erfolgt manuell durch den Super-Admin
// in der Firebase Konsole.

/*
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { app } from './config';
import type { UserDetailsResult, SetUserRoleAndClubData, SetUserRoleAndClubResult, UsersWithoutRoleResult } from '@/types/rwk';

const functionsInstance: Functions = getFunctions(app, 'europe-west1');

// Funktion zum Setzen von Rolle und Vereins-IDs über eine Cloud Function
// Wird aktuell NICHT verwendet, da Rechte direkt in 'user_permissions' geschrieben werden.
export const setUserRoleAndClubClient = async (
  data: SetUserRoleAndClubData
): Promise<SetUserRoleAndClubResult> => {
  const setUserRoleAndClubFunction = httpsCallable<
    SetUserRoleAndClubData,
    SetUserRoleAndClubResult
  >(functionsInstance, 'setUserRoleAndClub'); // Name der Cloud Function
  try {
    const result = await setUserRoleAndClubFunction(data);
    return result.data;
  } catch (error: any) {
    console.error("Error calling setUserRoleAndClub function from client:", error);
    throw error;
  }
};

// Funktion zum Abrufen von Benutzerdetails per E-Mail über eine Cloud Function
// Wird aktuell NICHT verwendet. UID wird manuell eingegeben.
export const getUserDetailsByEmailClient = async (
  email: string
): Promise<UserDetailsResult> => {
  const getUserDetailsFunction = httpsCallable<
    { email: string },
    UserDetailsResult
  >(functionsInstance, 'getUserDetailsByEmail');
  try {
    const result = await getUserDetailsFunction({ email });
    return result.data;
  } catch (error: any) {
    console.error("Error calling getUserDetailsByEmail function from client:", error);
    throw error;
  }
};

// Funktion zum Abrufen von Benutzern ohne Rolle über eine Cloud Function
// Wird aktuell NICHT verwendet.
export const getUsersWithoutRoleClient = async (): Promise<UsersWithoutRoleResult['users']> => {
  const getUsersFunction = httpsCallable<
    unknown,
    UsersWithoutRoleResult
  >(functionsInstance, 'getUsersWithoutRole');
  try {
    const result = await getUsersFunction();
    return result.data.users;
  } catch (error: any) {
    console.error("Error calling getUsersWithoutRole function from client:", error);
    throw error;
  }
};
*/

// Placeholder, falls die Datei für andere Zwecke benötigt wird
export {};
