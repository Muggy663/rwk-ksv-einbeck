// src/components/auth/AuthProvider.tsx
"use client";
import type { ReactNode } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmail, signOutUser, type FirebaseUser } from '@/lib/firebase/auth';
import { AuthContext, type AuthContextType } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { UserPermission } from '@/types/rwk';

interface AuthProviderProps {
  children: ReactNode;
}

const ADMIN_EMAIL = "admin@rwk-einbeck.de";

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Firebase Auth loading
  const [error, setError] = useState<Error | null>(null); // Firebase Auth error

  const [userAppPermissions, setUserAppPermissions] = useState<UserPermission | null>(null);
  const [loadingAppPermissions, setLoadingAppPermissions] = useState<boolean>(true);
  const [appPermissionsError, setAppPermissionsError] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchUserAppPermissions = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      if (firebaseUser.email === ADMIN_EMAIL) {
        // Super-Admin benötigt keine spezifischen App-Permissions aus Firestore
        setUserAppPermissions(null);
        setAppPermissionsError(null);
        setLoadingAppPermissions(false);
        return;
      }
      // Für normale Benutzer, lade Berechtigungen
      setLoadingAppPermissions(true);
      setAppPermissionsError(null);
      setUserAppPermissions(null); // Reset für neuen Benutzer
      try {
        console.log("AuthProvider DEBUG: Fetching permissions for UID:", firebaseUser.uid);
        const permDocRef = doc(db, "user_permissions", firebaseUser.uid);
        const docSnap = await getDoc(permDocRef);
        if (docSnap.exists()) {
          const permissionData = docSnap.data() as UserPermission;
          console.log("AuthProvider DEBUG: Permissions found:", permissionData);
          setUserAppPermissions(permissionData);
          // Fehlerprüfung basierend auf Rolle und clubId
          if (permissionData.role !== 'vereinsvertreter' && permissionData.role !== 'mannschaftsfuehrer') {
            setAppPermissionsError("Benutzer hat keine gültige Rolle (Vereinsvertreter/Mannschaftsführer).");
          } else if (!permissionData.clubId || typeof permissionData.clubId !== 'string' || permissionData.clubId.trim() === '') {
            // Angepasst für eine einzelne clubId
            setAppPermissionsError("Benutzer ist keinem gültigen Verein zugewiesen.");
          }
        } else {
          console.warn("AuthProvider DEBUG: No permission document found for UID:", firebaseUser.uid);
          setAppPermissionsError("Keine Berechtigungen für diesen Benutzer in Firestore gefunden.");
        }
      } catch (err) {
        console.error("AuthProvider DEBUG: Error fetching user permissions:", err);
        setAppPermissionsError("Fehler beim Laden der Benutzerberechtigungen.");
      } finally {
        setLoadingAppPermissions(false);
      }
    } else {
      // User is null (logged out)
      setUserAppPermissions(null);
      setLoadingAppPermissions(false);
      setAppPermissionsError(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser: FirebaseUser | null) => {
      setUser(firebaseUser);
      setLoading(false); // Auth loading finished
      fetchUserAppPermissions(firebaseUser);
    });
    return () => unsubscribe();
  }, [fetchUserAppPermissions]);

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      // fetchUserAppPermissions wird durch onAuthStateChanged getriggert
      toast({ title: "Erfolgreich angemeldet", description: "Willkommen zurück!" });
    } catch (err) {
      setError(err as Error);
      toast({ title: "Anmeldefehler", description: (err as Error).message, variant: "destructive" });
      setLoading(false); // Wichtig: Loading auch im Fehlerfall beenden
    }
    // setLoading(false) wird durch onAuthStateChanged's setLoading(false) gehandhabt, oder hier explizit setzen
  };

  const signOut = async (): Promise<void> => {
    setError(null);
    try {
      await signOutUser();
      // setUser(null) und fetchUserAppPermissions(null) werden durch onAuthStateChanged getriggert
      toast({ title: "Erfolgreich abgemeldet" });
    } catch (err) {
      setError(err as Error);
      toast({ title: "Abmeldefehler", description: (err as Error).message, variant: "destructive" });
    }
  };

  const value: AuthContextType = {
    user,
    loading, // Auth loading state
    error,
    signIn,
    signOut,
    userAppPermissions,
    loadingAppPermissions, // Permissions loading state
    appPermissionsError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
