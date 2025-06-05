// src/lib/firebase/auth.js
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged as onFirebaseAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import { auth } from './config'; // Assuming auth is exported from config.js

/**
 * @typedef {import('firebase/auth').User} FirebaseUser
 */

/**
 * Meldet einen Benutzer mit E-Mail und Passwort an
 * @param {string} email - E-Mail-Adresse des Benutzers
 * @param {string} password - Passwort des Benutzers
 * @returns {Promise<FirebaseUser>} Angemeldeter Benutzer
 */
export const signInWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Meldet den aktuellen Benutzer ab
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
  return signOut(auth);
};

/**
 * Registriert einen Callback für Änderungen am Authentifizierungsstatus
 * @param {function(FirebaseUser|null): void} callback - Callback-Funktion
 * @returns {function(): void} Funktion zum Abmelden des Callbacks
 */
export const onAuthStateChanged = (callback) => {
  return onFirebaseAuthStateChanged(auth, callback);
};

/**
 * Gibt den aktuellen Benutzer zurück
 * @returns {FirebaseUser|null} Aktueller Benutzer oder null
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Ändert das Passwort des aktuellen Benutzers
 * @param {string} newPassword - Neues Passwort
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (newPassword) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Kein Benutzer angemeldet");
  }
  return updatePassword(user, newPassword);
};