// src/components/auth/AuthProvider.js
"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithEmail, signOutUser, updateUserPassword } from '@/lib/firebase/auth';
import { AuthContext } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const ADMIN_EMAIL = "admin@rwk-einbeck.de";
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 Minuten in Millisekunden

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Firebase Auth loading
  const [error, setError] = useState(null); // Firebase Auth error

  const [userAppPermissions, setUserAppPermissions] = useState(null);
  const [loadingAppPermissions, setLoadingAppPermissions] = useState(true);
  const [appPermissionsError, setAppPermissionsError] = useState(null);

  const { toast } = useToast();
  const inactivityTimerRef = useRef(null);

  // Funktion zum Zurücksetzen des Inaktivitäts-Timers
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Nur Timer setzen, wenn ein Benutzer angemeldet ist
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        // Benutzer nach Inaktivität abmelden
        signOut();
        toast({ 
          title: "Automatische Abmeldung", 
          description: "Sie wurden aufgrund von Inaktivität automatisch abgemeldet.", 
          variant: "default" 
        });
      }, INACTIVITY_TIMEOUT);
    }
  }, [user]);

  // Event-Listener für Benutzeraktivität
  useEffect(() => {
    if (!user) return;
    
    // Benutzeraktivitäten überwachen
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    
    const handleUserActivity = () => {
      resetInactivityTimer();
    };
    
    // Event-Listener hinzufügen
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Initial Timer setzen
    resetInactivityTimer();
    
    // Cleanup
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user, resetInactivityTimer]);

  const fetchUserAppPermissions = useCallback(async (firebaseUser) => {
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
          const permissionData = docSnap.data();
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
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false); // Auth loading finished
      fetchUserAppPermissions(firebaseUser);
    });
    return () => unsubscribe();
  }, [fetchUserAppPermissions]);

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      // fetchUserAppPermissions wird durch onAuthStateChanged getriggert
      toast({ title: "Erfolgreich angemeldet", description: "Willkommen zurück!" });
    } catch (err) {
      setError(err);
      toast({ title: "Anmeldefehler", description: err.message, variant: "destructive" });
      setLoading(false); // Wichtig: Loading auch im Fehlerfall beenden
    }
    // setLoading(false) wird durch onAuthStateChanged's setLoading(false) gehandhabt, oder hier explizit setzen
  };

  const signOut = async () => {
    setError(null);
    try {
      // Timer löschen beim Abmelden
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      
      await signOutUser();
      // setUser(null) und fetchUserAppPermissions(null) werden durch onAuthStateChanged getriggert
      toast({ title: "Erfolgreich abgemeldet" });
    } catch (err) {
      setError(err);
      toast({ title: "Abmeldefehler", description: err.message, variant: "destructive" });
    }
  };

  // Neue Funktion zum Ändern des Passworts
  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    if (!user) {
      throw new Error("Kein Benutzer angemeldet");
    }
    
    try {
      // Zuerst mit aktuellem Passwort erneut anmelden, um Credentials zu aktualisieren
      try {
        await signInWithEmail(user.email, currentPassword);
      } catch (signInErr) {
        console.error("Fehler bei der Reauthentifizierung:", signInErr);
        if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
          throw new Error("Das aktuelle Passwort ist nicht korrekt.");
        }
        throw signInErr;
      }
      
      // Dann Passwort ändern
      await updateUserPassword(newPassword);
      
      toast({ 
        title: "Passwort geändert", 
        description: "Ihr Passwort wurde erfolgreich aktualisiert.", 
        variant: "success" 
      });
    } catch (err) {
      setError(err);
      const errorMessage = err.message || "Ein unbekannter Fehler ist aufgetreten.";
      toast({ 
        title: "Fehler beim Ändern des Passworts", 
        description: errorMessage, 
        variant: "destructive" 
      });
      throw err; // Fehler weitergeben für die Behandlung im Formular
    }
  };

  const value = {
    user,
    loading, // Auth loading state
    error,
    signIn,
    signOut,
    changePassword, // Neue Funktion zum Ändern des Passworts
    userAppPermissions,
    loadingAppPermissions, // Permissions loading state
    appPermissionsError,
    resetInactivityTimer, // Exportiere die Funktion zum Zurücksetzen des Timers
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};