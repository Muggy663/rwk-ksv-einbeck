// src/components/auth/AuthContext.tsx
"use client";
import type { FirebaseUser } from '@/lib/firebase/auth';
import type { UserPermission } from '@/types/rwk'; // Import UserPermission
import { createContext, useContext } from 'react';

export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean; // Loading state for Firebase Auth user
  error: Error | null; // Error from Firebase Auth
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  userAppPermissions: UserPermission | null; // App-specific permissions from Firestore
  loadingAppPermissions: boolean; // Loading state for app-specific permissions
  appPermissionsError: string | null; // Error from fetching app-specific permissions
  resetInactivityTimer?: () => void; // Funktion zum Zurücksetzen des Inaktivitäts-Timers
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};