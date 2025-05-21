// src/app/verein/layout.tsx
"use client";
import React, { type ReactNode, useEffect, useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, UserCircle, ListChecks, ArrowLeft, LogOut, Building, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, Timestamp } from 'firebase/firestore'; // Added Timestamp
import type { UserPermission, VereinContextType } from '@/types/rwk';

const USER_PERMISSIONS_COLLECTION = "user_permissions";
const ADMIN_EMAIL = "admin@rwk-einbeck.de";

// 1. Context erstellen
const VereinContext = createContext<VereinContextType | undefined>(undefined);

// Hook zum Nutzen des Contexts
export const useVereinAuth = () => {
  const context = useContext(VereinContext);
  if (context === undefined) {
    throw new Error('useVereinAuth must be used within a VereinLayout\'s VereinProvider');
  }
  return context;
};

interface VereinLayoutProps {
  children: ReactNode;
}

export default function VereinLayout({ children }: VereinLayoutProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [userPermission, setUserPermission] = useState<UserPermission | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState<boolean>(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    console.log("VereinLayout DEBUG: useEffect for permissions triggered. Auth loading:", authLoading, "User UID:", user?.uid);

    if (authLoading) {
      setLoadingPermissions(true); // Keep loading permissions if auth is still loading
      return;
    }

    if (!user) {
      // User not logged in, redirect to login. This should ideally be handled by a top-level route guard or AuthProvider.
      // For now, let's ensure it doesn't interfere with permission loading if user becomes null during the process.
      console.log("VereinLayout DEBUG: No user, redirecting to login.");
      router.push('/login');
      setLoadingPermissions(false); // Stop permission loading as there's no user
      return;
    }
    
    // Super-Admin should be redirected by MainNav or AdminLayout, but as a safeguard:
    if (user.email === ADMIN_EMAIL) {
        console.log("VereinLayout DEBUG: Super-Admin detected, redirecting to admin area.");
        router.push('/admin');
        setLoadingPermissions(false);
        return;
    }

    setLoadingPermissions(true);
    setPermissionError(null);
    setUserPermission(null); 

    const fetchPermissions = async () => {
      if (!user || !user.uid) { // Extra safety check for user.uid
        console.warn("VereinLayout DEBUG: User object or UID is null/undefined when trying to fetch permissions.");
        setPermissionError("Benutzer-ID nicht verfügbar, um Berechtigungen zu laden.");
        setLoadingPermissions(false);
        return;
      }

      console.log(`VereinLayout DEBUG: Fetching permissions for UID: ${user.uid}`);
      try {
        const permDocRef = doc(db, USER_PERMISSIONS_COLLECTION, user.uid);
        const docSnap = await getDoc(permDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("VereinLayout DEBUG: Raw permission data from Firestore:", data);
          
          const permissionDataFromDb: UserPermission = {
            uid: user.uid, // Use the auth user's UID as the canonical one
            email: data.email || user.email || "N/A",
            displayName: data.displayName || user.displayName || null,
            role: data.role || null,
            clubIds: data.clubIds || null, // Expecting an array or null
            lastUpdated: data.lastUpdated || null,
          };
          console.log("VereinLayout DEBUG: Parsed UserPermission object:", permissionDataFromDb);

          if (permissionDataFromDb.role === 'vereinsvertreter' && permissionDataFromDb.clubIds && permissionDataFromDb.clubIds.length > 0) {
            console.log("VereinLayout DEBUG: Valid Vereinsvertreter permissions found.");
            setUserPermission(permissionDataFromDb);
            setPermissionError(null);
          } else {
            let errorMsg = "Keine gültige Vereinsvertreter-Berechtigung für diesen Benutzer gefunden.";
            if (permissionDataFromDb.role !== 'vereinsvertreter') {
              errorMsg += " Rolle ist nicht 'vereinsvertreter'.";
              console.warn("VereinLayout DEBUG: Role is not 'vereinsvertreter'. Role:", permissionDataFromDb.role);
            }
            if (!permissionDataFromDb.clubIds || permissionDataFromDb.clubIds.length === 0) {
              errorMsg += " Keine Vereine zugewiesen.";
              console.warn("VereinLayout DEBUG: No clubIds assigned or clubIds array is empty. ClubIds:", permissionDataFromDb.clubIds);
            }
            setPermissionError(errorMsg);
            setUserPermission(null);
          }
        } else {
          console.warn("VereinLayout DEBUG: No permission document found for UID:", user.uid);
          setPermissionError("Keine Berechtigungen für diesen Benutzer in Firestore gefunden. Bitte kontaktieren Sie den Administrator.");
          setUserPermission(null);
        }
      } catch (error) {
        console.error("VereinLayout DEBUG: Error fetching user permissions:", error);
        setPermissionError(`Fehler beim Laden der Benutzerberechtigungen: ${(error as Error).message}`);
        setUserPermission(null);
      } finally {
        console.log("VereinLayout DEBUG: Finished fetching permissions. LoadingPermissions set to false.");
        setLoadingPermissions(false);
      }
    };

    fetchPermissions();

  }, [user, authLoading, router]); // router added to dependency array as it's used in an effect

  const vereinNavItems = [
    { href: '/verein/dashboard', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/verein/mannschaften', label: 'Meine Mannschaften', icon: Users },
    { href: '/verein/schuetzen', label: 'Meine Schützen', icon: UserCircle },
    { href: '/verein/ergebnisse', label: 'Ergebnisse erfassen', icon: ListChecks },
  ];

  // Show a global loading indicator if auth or permissions are loading
  if (authLoading || (user && loadingPermissions && !permissionError)) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3">{authLoading ? "Lade Benutzerdaten..." : "Lade Berechtigungen..."}</p>
      </div>
    );
  }

  // If there's a permission error, display it prominently and don't render children or nav
  if (permissionError) {
    return (
      <div className="flex min-h-screen">
        <aside className="w-60 bg-background border-r p-4 shadow-md hidden md:block">
           <div className="flex items-center space-x-2 mb-6"><ShieldAlert className="h-7 w-7 text-destructive" /><h2 className="text-xl font-semibold text-destructive">Zugriffsproblem</h2></div>
           <Separator className="my-6" />
           <Button variant="outline" onClick={() => router.push('/')} className="w-full mb-2"><ArrowLeft className="mr-2 h-4 w-4" /> Zur Startseite</Button>
           <Button variant="outline" onClick={signOut} className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10"><LogOut className="mr-2 h-4 w-4"/> Logout</Button>
        </aside>
        <main className="flex-1 p-8 flex flex-col justify-center items-center text-center">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold text-destructive mb-2">Zugriffsproblem im Dashboard</h1>
            <p className="text-muted-foreground">{permissionError}</p>
            <p className="text-sm text-muted-foreground mt-2">Bitte kontaktieren Sie den Administrator, um diese Zuweisung vorzunehmen oder zu korrigieren.</p>
        </main>
      </div>
    );
  }
  
  // If permissions are loaded and valid (no error), provide context and render nav and children
  if (user && userPermission && !loadingPermissions && !permissionError) {
    const contextValue: VereinContextType = {
      userPermission: userPermission,
      loadingPermissions: loadingPermissions, // will be false here
      permissionError: permissionError,       // will be null here
      // assignedClubIds is derived from userPermission.clubIds in consumer components
    };

    return (
      <VereinContext.Provider value={contextValue}>
        <div className="flex min-h-[calc(100vh-theme(spacing.16))]">
          <aside className="w-60 bg-background border-r p-4 shadow-md hidden md:block">
            <div className="flex items-center space-x-2 mb-6">
              <Building className="h-7 w-7 text-primary" />
              <h2 className="text-xl font-semibold text-primary">Mein Verein</h2>
            </div>
            <nav className="space-y-1">
              {vereinNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <Separator className="my-6" />
            <Button variant="outline" onClick={() => router.push('/')} className="w-full mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Zur Startseite
            </Button>
            <Button variant="outline" onClick={signOut} className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4"/> Logout
            </Button>
          </aside>
          <main className="flex-1 p-6 lg:p-8 bg-muted/20 overflow-y-auto">
            {children}
          </main>
        </div>
      </VereinContext.Provider>
    );
  }

  // Fallback if user is somehow present but permissions are not yet loaded or still in an indeterminate state
  // This should ideally be covered by the loadingPermissions check above, but as a safety net:
  return (
    <div className="flex min-h-screen justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3">Prüfe Berechtigungen...</p>
    </div>
  );
}
