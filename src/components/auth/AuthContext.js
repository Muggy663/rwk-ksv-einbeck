// src/components/auth/AuthContext.js
"use client";
import { createContext, useContext } from 'react';

/**
 * @typedef {Object} FirebaseUser
 * @property {string} uid
 * @property {string} email
 * @property {string} [displayName]
 * @property {boolean} emailVerified
 */

/**
 * @typedef {Object} UserPermission
 * @property {string} uid
 * @property {string} email
 * @property {string} [displayName]
 * @property {'vereinsvertreter'|'mannschaftsfuehrer'|null} role
 * @property {string|null} clubId
 */

/**
 * @typedef {Object} AuthContextType
 * @property {FirebaseUser|null} user
 * @property {boolean} loading
 * @property {Error|null} error
 * @property {function(string, string): Promise<void>} signIn
 * @property {function(): Promise<void>} signOut
 * @property {function(string, string): Promise<void>} [changePassword]
 * @property {UserPermission|null} userAppPermissions
 * @property {boolean} loadingAppPermissions
 * @property {string|null} appPermissionsError
 * @property {function(): void} [resetInactivityTimer]
 */

export const AuthContext = createContext(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};