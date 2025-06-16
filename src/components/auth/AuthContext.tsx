// src/components/auth/AuthContext.tsx
"use client";
import { createContext, useContext } from 'react';

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
}

export interface UserPermission {
  uid: string;
  email: string;
  displayName?: string;
  role: 'vereinsvertreter' | 'mannschaftsfuehrer' | null;
  clubId: string | null;
}

export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword?: (oldPassword: string, newPassword: string) => Promise<void>;
  userAppPermissions: UserPermission | null;
  loadingAppPermissions: boolean;
  appPermissionsError: string | null;
  resetInactivityTimer?: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};