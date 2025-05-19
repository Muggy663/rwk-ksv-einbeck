// src/components/auth/AuthProvider.tsx
"use client";
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmail, signOutUser, type FirebaseUser } from '@/lib/firebase/auth';
import { AuthContext, type AuthContextType } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser: FirebaseUser | null) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      // User state will be updated by onAuthStateChanged
      toast({ title: "Erfolgreich angemeldet", description: "Willkommen zurück!" });
    } catch (err) {
      setError(err as Error);
      toast({ title: "Anmeldefehler", description: (err as Error).message, variant: "destructive" });
      setLoading(false); // Explicitly set loading to false on error
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await signOutUser();
      // User state will be updated by onAuthStateChanged
      toast({ title: "Erfolgreich abgemeldet" });
    } catch (err) {
      setError(err as Error);
      toast({ title: "Abmeldefehler", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
