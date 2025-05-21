// src/app/verein/layout.tsx
"use client";
import React, { type ReactNode, useEffect, useState, createContext, useContext, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, UserCircle, ListChecks, ArrowLeft, LogOut, Building, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { UserPermission, VereinContextType } from '@/types/rwk'; // VereinContextType importieren

const USER_PERMISSIONS_COLLECTION = "user_permissions";
const ADMIN_EMAIL = "admin@rwk-einbeck.de";

// Context erstellen
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
      console.log("VereinLayout DEBUG: Auth is loading, setting loadingPermissions to true.");
      setLoadingPermissions(true);
      return;
    }

    if (!user) {
      // Dieser Redirect wird nun vom AuthProvider oder einer höheren Ebene erwartet.
      // Hier setzen wir nur den Fehler oder leeren die Permissions, wenn kein User da ist nach dem Laden.
      console.log("VereinLayout DEBUG: No user, redirecting to login by MainNav/AuthProvider.");
      // router.push('/login'); // Sollte nicht mehr hier sein, um Render-Loop zu vermeiden
      setLoadingPermissions(false);
      setUserPermission(null);
      setPermissionError("Benutzer nicht angemeldet."); // Oder eine generischere Meldung
      return;
    }
    
    // Super-Admin sollte hier nicht sein, wird durch MainNav umgeleitet.
    // Falls doch, keine VV-Permissions laden.
    if (user.email === ADMIN_EMAIL) {
        console.log("VereinLayout DEBUG: Super-Admin detected, skipping VV permission loading.");
        setLoadingPermissions(false);
        setUserPermission(null); 
        // Setze keinen Fehler, da Admins hier nicht sein sollten oder es spezielle Ansichten geben könnte.
        // Alternativ: Redirect zum Admin-Panel, aber das sollte schon in MainNav passieren.
        // setPermissionError("Admin-Benutzer im Vereinsbereich.");
        return;
    }

    setLoadingPermissions(true);
    setPermissionError(null);
    setUserPermission(null);

    const fetchPermissions = async () => {
      if (!user?.uid) {
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
          console.log("VereinLayout DEBUG: Raw permission data from Firestore:", JSON.stringify(data));
          
          const permissionDataFromDb: UserPermission = {
            uid: user.uid,
            email: data.email || user.email || "N/A",
            displayName: data.displayName || user.displayName || null,
            role: data.role || null,
            clubIds: Array.isArray(data.clubIds) ? data.clubIds.filter(id => typeof id === 'string' && id.trim() !== '') : null,
            lastUpdated: data.lastUpdated || null,
          };
          console.log("VereinLayout DEBUG: Parsed UserPermission object:", JSON.stringify(permissionDataFromDb));

          const allowedRoles: Array<UserPermission['role']> = ['vereinsvertreter', 'mannschaftsfuehrer'];

          if (permissionDataFromDb.role && allowedRoles.includes(permissionDataFromDb.role)) {
            if (permissionDataFromDb.clubIds && permissionDataFromDb.clubIds.length > 0) {
              console.log("VereinLayout DEBUG: Valid Vereinsvertreter/Mannschaftsführer permissions found.");
              setUserPermission(permissionDataFromDb);
              setPermissionError(null);
            } else {
              console.warn("VereinLayout DEBUG: Role is valid, but no clubIds assigned or clubIds array is empty. ClubIds:", permissionDataFromDb.clubIds);
              setPermissionError(`Benutzerrolle '${permissionDataFromDb.role}' ist gültig, aber keine Vereine zugewiesen.`);
              setUserPermission(null);
            }
          } else {
            console.warn(`VereinLayout DEBUG: Role is not 'vereinsvertreter' or 'mannschaftsfuehrer'. Role: ${permissionDataFromDb.role}`);
            setPermissionError(`Keine gültige Vereinsvertreter- oder Mannschaftsführer-Berechtigung für diesen Benutzer gefunden. Rolle ist nicht korrekt.`);
            setUserPermission(null);
          }
        } else {
          console.warn(`VereinLayout DEBUG: No permission document found for UID: ${user.uid}`);
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

  }, [user, authLoading, router]);

  const vereinNavItems = [
    { href: '/verein/dashboard', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/verein/mannschaften', label: 'Meine Mannschaften', icon: Users },
    { href: '/verein/schuetzen', label: 'Meine Schützen', icon: UserCircle },
    { href: '/verein/ergebnisse', label: 'Ergebnisse erfassen', icon: ListChecks },
  ];

  const contextValue: VereinContextType = {
    userPermission,
    loadingPermissions,
    permissionError,
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3">Lade Benutzerdaten...</p>
      </div>
    );
  }

  // Wenn kein Benutzer nach dem Laden des Auth-Status vorhanden ist (z.B. ausgeloggt), zeige Login-Aufforderung oder nichts.
  // Dieser Fall sollte idealerweise durch einen Redirect auf der Seitenebene oder im AuthProvider gehandhabt werden.
  if (!user && !authLoading) {
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h1 className="text-xl font-semibold text-destructive">Nicht angemeldet</h1>
            <p className="text-muted-foreground">Bitte melden Sie sich an, um diesen Bereich zu nutzen.</p>
            <Button onClick={() => router.push('/login')} className="mt-4">Zum Login</Button>
        </div>
    );
  }
  
  // Wenn der Benutzer der Super-Admin ist, sollte er hier eigentlich nicht sein.
  // Die Hauptnavigation sollte ihn zum Admin-Panel leiten.
  // Zeige eine Meldung oder leite um, falls er doch hier landet.
  if (user && user.email === ADMIN_EMAIL && !authLoading) {
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h1 className="text-xl font-semibold text-amber-600">Admin-Bereich</h1>
            <p className="text-muted-foreground">Super-Admins sollten das <Link href="/admin" className="text-primary hover:underline">Admin Panel</Link> verwenden.</p>
        </div>
    );
  }


  // Rendere Kinder nur, wenn Permissions geladen wurden und kein Fehler aufgetreten ist
  // ODER wenn Permissions noch laden und kein Fehler da ist.
  // Der eigentliche Content-Schutz basierend auf permissionError geschieht dann in den Kind-Seiten.
  const renderContent = () => {
    if (loadingPermissions) {
      return (
        <div className="flex min-h-screen justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3">Lade Berechtigungen...</p>
        </div>
      );
    }
    // Wenn ein Fehler beim Laden der Berechtigungen aufgetreten ist, zeige ihn hier.
    if (permissionError) {
        return (
            <div className="flex min-h-screen">
                <aside className="w-60 bg-background border-r p-4 shadow-md hidden md:block">
                   <div className="flex items-center space-x-2 mb-6"><Building className="h-7 w-7 text-destructive" /><h2 className="text-xl font-semibold text-destructive">Vereinsbereich</h2></div>
                   <Separator className="my-6" />
                   <Button variant="outline" onClick={() => router.push('/')} className="w-full mb-2"><ArrowLeft className="mr-2 h-4 w-4" /> Zur Startseite</Button>
                   {user && <Button variant="outline" onClick={signOut} className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10"><LogOut className="mr-2 h-4 w-4"/> Logout</Button>}
                </aside>
                <main className="flex-1 p-8 flex flex-col justify-center items-center text-center">
                    <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
                    <h1 className="text-2xl font-semibold text-destructive mb-2">Zugriffsproblem im Dashboard</h1>
                    <p className="text-muted-foreground">{permissionError}</p>
                    <p className="text-sm text-muted-foreground mt-2">Bitte kontaktieren Sie den Administrator, um diese Zuweisung vorzunehmen oder zu korrigieren.</p>
                </main>
            </div>
        );
    }
    // Wenn Berechtigungen geladen und kein Fehler -> zeige Navigation und Kinder
    return (
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
          {user && 
            <Button variant="outline" onClick={signOut} className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4"/> Logout
            </Button>
          }
        </aside>
        <main className="flex-1 p-6 lg:p-8 bg-muted/20 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  };

  return (
    <VereinContext.Provider value={contextValue}>
      {renderContent()}
    </VereinContext.Provider>
  );
}
