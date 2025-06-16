// src/lib/firebase/auth.ts
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged as onFirebaseAuthStateChanged,
  updatePassword,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './config'; // Assuming auth is exported from config.js

/**
 * Meldet einen Benutzer mit E-Mail und Passwort an
 * @param email - E-Mail-Adresse des Benutzers
 * @param password - Passwort des Benutzers
 * @returns Angemeldeter Benutzer
 */
export const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Meldet den aktuellen Benutzer ab
 */
export const signOutUser = async (): Promise<void> => {
  return signOut(auth);
};

/**
 * Registriert einen Callback für Änderungen am Authentifizierungsstatus
 * @param callback - Callback-Funktion
 * @returns Funktion zum Abmelden des Callbacks
 */
export const onAuthStateChanged = (callback: (user: FirebaseUser | null) => void): (() => void) => {
  return onFirebaseAuthStateChanged(auth, callback);
};

/**
 * Gibt den aktuellen Benutzer zurück
 * @returns Aktueller Benutzer oder null
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Ändert das Passwort des aktuellen Benutzers
 * @param newPassword - Neues Passwort
 */
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Kein Benutzer angemeldet");
  }
  return updatePassword(user, newPassword);
};