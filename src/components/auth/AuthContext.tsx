// src/components/auth/AuthContext.tsx
"use client";
import type { FirebaseUser } from '@/lib/firebase/auth';
import { createContext, useContext } from 'react';

export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
