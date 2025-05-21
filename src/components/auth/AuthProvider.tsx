// src/components/auth/AuthProvider.tsx
"use client";
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmail, signOutUser, type FirebaseUser } from '@/lib/firebase/auth';
import { AuthContext, type AuthContextType } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config'; // Import db
import { doc, getDoc } from 'firebase/firestore'; // Import doc and getDoc
import type { UserPermission } from '@/types/rwk'; // Import UserPermission

interface AuthProviderProps {
  children: ReactNode;
}

const ADMIN_EMAIL = "admin@rwk-einbeck.de"; // Define Super Admin Email

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Firebase Auth loading
  const [error, setError] = useState<Error | null>(null); // Firebase Auth error

  const [userAppPermissions, setUserAppPermissions] = useState<UserPermission | null>(null);
  const [loadingAppPermissions, setLoadingAppPermissions] = useState<boolean>(true);
  const [appPermissionsError, setAppPermissionsError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      setUser(firebaseUser);
      setLoading(false); // Auth loading finished

      if (firebaseUser && firebaseUser.email !== ADMIN_EMAIL) {
        setLoadingAppPermissions(true);
        setAppPermissionsError(null);
        setUserAppPermissions(null);
        try {
          const permDocRef = doc(db, "user_permissions", firebaseUser.uid);
          const docSnap = await getDoc(permDocRef);
          if (docSnap.exists()) {
            const permissionData = docSnap.data() as UserPermission;
            setUserAppPermissions(permissionData);
            if (permissionData.role !== 'vereinsvertreter' && permissionData.role !== 'mannschaftsfuehrer') {
                setAppPermissionsError("Benutzer hat keine gültige Rolle (Vereinsvertreter/Mannschaftsführer).");
            } else if (!permissionData.clubIds || permissionData.clubIds.length === 0) {
                setAppPermissionsError("Benutzer ist keinem Verein zugewiesen.");
            }
          } else {
            setAppPermissionsError("Keine Berechtigungen für diesen Benutzer in Firestore gefunden.");
          }
        } catch (err) {
          console.error("AuthProvider: Error fetching user permissions:", err);
          setAppPermissionsError("Fehler beim Laden der Benutzerberechtigungen.");
        } finally {
          setLoadingAppPermissions(false);
        }
      } else {
        // User is null (logged out) or is Admin (Admin doesn't need app permissions here)
        setUserAppPermissions(null);
        setLoadingAppPermissions(false);
        setAppPermissionsError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true); // Auth loading
    setError(null);
    try {
      await signInWithEmail(email, password);
      toast({ title: "Erfolgreich angemeldet", description: "Willkommen zurück!" });
    } catch (err) {
      setError(err as Error);
      toast({ title: "Anmeldefehler", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false); // Auth loading finished
    }
  };

  const signOut = async (): Promise<void> => {
    // No need to set loading for signout, as onAuthStateChanged will handle it
    setError(null);
    try {
      await signOutUser();
      toast({ title: "Erfolgreich abgemeldet" });
      setUserAppPermissions(null); // Clear app permissions on sign out
      setAppPermissionsError(null);
    } catch (err) {
      setError(err as Error);
      toast({ title: "Abmeldefehler", description: (err as Error).message, variant: "destructive" });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signOut,
    userAppPermissions,
    loadingAppPermissions,
    appPermissionsError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
