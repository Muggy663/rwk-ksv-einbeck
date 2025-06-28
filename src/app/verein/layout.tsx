"use client";
import React, { type ReactNode, createContext, useContext, useState, useEffect, useMemo } from 'react'; // Added useMemo
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, UserCircle, ListChecks, ArrowLeft, LogOut, Building, Loader2, AlertTriangle, ShieldAlert, UserCog, FileDown, CalendarDays, User, HelpCircle, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { UserPermission, VereinContextType } from '@/types/rwk';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { PasswordChangePrompt } from '@/components/auth/PasswordChangePrompt';
import { LogoutButton } from '@/components/auth/LogoutButton';

const ADMIN_EMAIL = "admin@rwk-einbeck.de";

const VereinContext = createContext<VereinContextType | undefined>(undefined);

export const useVereinAuth = (): VereinContextType => {
  const context = useContext(VereinContext);
  if (context === undefined) {
    throw new Error('useVereinAuth must be used within a VereinLayout\'s VereinContext.Provider');
  }
  return context;
};

interface VereinLayoutProps {
  children: ReactNode;
}

const vereinNavItems = [
  { href: '/verein/dashboard', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/verein/mannschaften', label: 'Meine Mannschaften', icon: Users },
  { href: '/verein/schuetzen', label: 'Meine Schützen', icon: UserCircle },
  { href: '/verein/ergebnisse', label: 'Ergebnisse erfassen', icon: ListChecks },
  { href: '/verein/handtabellen', label: 'Handtabellen', icon: FileText },
  { href: '/termine', label: 'Terminkalender', icon: CalendarDays },
  { href: '/termine/add', label: 'Termin hinzufügen', icon: CalendarDays },
  { href: '/verein/team-managers', label: 'Mannschaftsführer', icon: UserCog },
  { href: '/verein/hilfe', label: 'Hilfe & Einstellungen', icon: HelpCircle },
];

export default function VereinLayout({ children }: VereinLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const {
    user,
    loading: authLoading,
    userAppPermissions,
    loadingAppPermissions,
    appPermissionsError: authProviderPermissionError,
    signOut,
    resetInactivityTimer
  } = useAuth();

  // State for derived permission error specific to this layout's logic
  const [derivedPermissionError, setDerivedPermissionError] = useState<string | null>(null);
  // State for the UserPermission object to be passed to context
  // Initialize to a specific value (e.g., false) to distinguish from null after loading
  const [userPermissionForContext, setUserPermissionForContext] = useState<UserPermission | null | false>(false);
  // State for the array of club IDs the user is assigned to
  const [assignedClubIdArray, setAssignedClubIdArray] = useState<string[]>([]);
  // Combined loading state
  const [combinedLoading, setCombinedLoading] = useState(true);

  // Logout-Handler
  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Entferne alle Onboarding-Dialoge beim Laden der Seite
  useEffect(() => {
    const removeOnboardingDialogs = () => {
      // Alle Dialoge im DOM finden
      const dialogs = document.querySelectorAll('dialog');
      
      // Alle Dialoge durchgehen
      dialogs.forEach(dialog => {
        // Wenn der Dialog den Text "Willkommen bei der RWK Einbeck App" enthält
        if (dialog.textContent && dialog.textContent.includes('Willkommen bei der RWK Einbeck App')) {
          // Dialog aus dem DOM entfernen
          dialog.remove();
          console.log("Onboarding-Dialog entfernt");
        }
      });
      
      // Auch nach Buttons suchen, die das Onboarding öffnen könnten
      const onboardingButtons = document.querySelectorAll('button');
      onboardingButtons.forEach(button => {
        if (button.textContent && button.textContent.includes('Einführung starten')) {
          // Button deaktivieren
          button.disabled = true;
          button.style.display = 'none';
          console.log("Onboarding-Button deaktiviert");
        }
      });
    };
    
    // Führe die Funktion initial aus
    removeOnboardingDialogs();
    
    // Und mehrmals mit Verzögerung (falls der Dialog verzögert geladen wird)
    const timer1 = setTimeout(removeOnboardingDialogs, 500);
    const timer2 = setTimeout(removeOnboardingDialogs, 1000);
    const timer3 = setTimeout(removeOnboardingDialogs, 2000);
    
    // Beobachter für DOM-Änderungen einrichten
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          removeOnboardingDialogs();
        }
      }
    });
    
    // Beobachter starten
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Aufräumen
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    console.log("VereinLayout DEBUG: Auth/Permissions Effect triggered. Auth loading:", authLoading, "AppPerm loading:", loadingAppPermissions);
    console.log("VereinLayout DEBUG: User from useAuth():", user ? user.uid : "null");
    console.log("VereinLayout DEBUG: userAppPermissions from useAuth():", userAppPermissions ? JSON.stringify(userAppPermissions) : "null");
    console.log("VereinLayout DEBUG: appPermissionsError from AuthProvider:", authProviderPermissionError);

    if (authLoading || loadingAppPermissions) {
      console.log("VereinLayout DEBUG: Still loading auth or app permissions.");
      setCombinedLoading(true);
      // Don't set errors or permissions yet if still loading upstream
      return;
    }
    setCombinedLoading(false);

    if (!user) {
      // This should ideally be handled by AuthProvider, but as a safeguard
      console.warn("VereinLayout DEBUG: No user, redirecting to login (this should ideally not happen if AuthProvider handles it).");
      router.push('/login'); // Consider if this redirect is still needed or handled by AuthProvider
      return;
    }
    
    // Super-Admin should not be in /verein layout, redirect them
    if (user.email === ADMIN_EMAIL) {
      console.warn("VereinLayout DEBUG: Super-Admin detected, redirecting to /admin/dashboard.");
      router.push('/admin/dashboard');
      return; 
    }

    // Handle errors from AuthProvider first
    if (authProviderPermissionError) {
      console.warn("VereinLayout DEBUG: Error from AuthProvider:", authProviderPermissionError);
      setDerivedPermissionError(authProviderPermissionError);
      setUserPermissionForContext(null);
      setAssignedClubIdArray([]);
      return;
    }

    if (!userAppPermissions) {
      console.warn(`VereinLayout DEBUG: No userAppPermissions document found for UID: ${user.uid}. This user might not be configured for club access.`);
      setDerivedPermissionError("Keine Berechtigungen für diesen Benutzer in Firestore gefunden. Bitte kontaktieren Sie den Administrator.");
      setUserPermissionForContext(null);
      setAssignedClubIdArray([]);
    } else {
      const { role, clubId } = userAppPermissions; // Using single clubId model
      console.log("VereinLayout DEBUG: Checking permission data - Role:", role, "SingleClubId:", clubId);

      const allowedRoles = ['vereinsvertreter', 'mannschaftsfuehrer'];
      if (role && allowedRoles.includes(role)) {
        if (clubId && typeof clubId === 'string' && clubId.trim() !== '') {
          console.log("VereinLayout DEBUG: Valid role and single clubId found.", { role, singleClubId: clubId });
          setUserPermissionForContext(userAppPermissions);
          setAssignedClubIdArray([clubId]); // Create an array with the single clubId
          setDerivedPermissionError(null); // Clear previous errors
        } else {
          console.warn("VereinLayout DEBUG: Role is valid, but no valid single clubId assigned.", { role, clubId });
          setDerivedPermissionError("Benutzer hat Rolle, aber keinen gültigen Verein zugewiesen (Club-ID fehlt oder ist ungültig).");
          setUserPermissionForContext(userAppPermissions); // Store for role display, but array will be empty
          setAssignedClubIdArray([]);
        }
      } else {
        console.warn(`VereinLayout DEBUG: Role is not valid for Verein area or missing. Role: '${role || 'unbekannt'}'`);
        setDerivedPermissionError(`Ihre Rolle '${role || 'Unbekannt'}' hat keinen Zugriff auf den Vereinsbereich oder es fehlt eine Vereinszuweisung.`);
        setUserPermissionForContext(userAppPermissions); // Store for potential role display in error
        setAssignedClubIdArray([]);
      }
    }
    console.log("VereinLayout DEBUG: Finished processing permissions. CombinedLoading:", false, "DerivedPermissionError:", derivedPermissionError);
  }, [user, authLoading, userAppPermissions, loadingAppPermissions, authProviderPermissionError, router, derivedPermissionError]); // Added derivedPermissionError to dependencies

  const contextValue: VereinContextType = useMemo(() => ({
    userPermission: userPermissionForContext === false ? null : userPermissionForContext,
    loadingPermissions: combinedLoading,
    permissionError: derivedPermissionError,
    assignedClubId: assignedClubIdArray.length > 0 ? assignedClubIdArray[0] : null,
    assignedClubIdArray: assignedClubIdArray,
  }), [userPermissionForContext, combinedLoading, derivedPermissionError, assignedClubIdArray]);

  console.log("VereinLayout DEBUG: Rendering. CombinedLoading:", combinedLoading, "DerivedPermissionError:", derivedPermissionError, "UserPermissionForContext set:", userPermissionForContext !== false, "AssignedClubIdArray length:", assignedClubIdArray.length);
  console.log("VereinLayout DEBUG: Providing context value:", contextValue);


  if (combinedLoading) {
    return (
      <div className="flex min-h-screen">
        <aside className="w-60 bg-muted/40 p-4 border-r hidden md:block">
          <Skeleton className="h-8 w-3/4 mb-6" />
          <div className="space-y-2">{vereinNavItems.map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        </aside>
        <main className="flex-1 p-8 flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3">Lade Benutzer- & Vereinsdaten...</p>
        </main>
      </div>
    );
  }

  if (derivedPermissionError) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))]">
        <aside className="w-60 bg-background border-r p-4 shadow-md hidden md:block">
          <div className="flex items-center space-x-2 mb-6"><Building className="h-7 w-7 text-destructive" /><h2 className="text-xl font-semibold text-destructive">Vereinsbereich</h2></div>
          <nav className="space-y-1"><Link href="/verein/dashboard" className={cn("flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium", pathname === "/verein/dashboard" ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')}><LayoutDashboard className="h-5 w-5" /><span>Übersicht</span></Link></nav>
          <Separator className="my-6" />
          <Button variant="outline" onClick={() => router.push('/')} className="w-full mb-2"><ArrowLeft className="mr-2 h-4 w-4" /> Zur Startseite</Button>
          {user && <Button variant="outline" onClick={handleLogout} className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10"><LogOut className="mr-2 h-4 w-4" /> Logout</Button>}
        </aside>
        <main className="flex-1 p-8 flex flex-col justify-center items-center text-center">
          <Card className="w-full max-w-lg border-amber-500 bg-amber-50/50">
            <CardHeader><CardTitle className="text-amber-700 flex items-center gap-2"><ShieldAlert className="h-6 w-6" /> Zugriffsproblem im Vereinsbereich</CardTitle></CardHeader>
            <CardContent>
              <p>{derivedPermissionError}</p>
              <p className="text-sm mt-2">Bitte kontaktieren Sie den Administrator, um diese Zuweisung vorzunehmen oder zu korrigieren.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  // Fallback, if userPermissionForContext is still false after loading (should ideally be caught by derivedPermissionError)
  if (userPermissionForContext === false) { 
     console.warn("VereinLayout DEBUG: Rendering fallback because userPermissionForContext is still 'false' after loading and no error.");
      return (
          <div className="flex min-h-[calc(100vh-theme(spacing.16))]">
             <main className="flex-1 p-8 flex justify-center items-center">
                <Card className="border-red-500 bg-red-50/50">
                    <CardHeader><CardTitle className="text-red-700">Berechtigungsprüfung läuft oder unvollständig</CardTitle></CardHeader>
                    <CardContent>
                        <p>Die spezifischen Berechtigungen für den Vereinsbereich konnten nicht final festgestellt werden.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
      );
  }
  
  return (
    <VereinContext.Provider value={contextValue}>
      <div className="flex min-h-[calc(100vh-theme(spacing.16))]">
        <aside className="w-60 bg-background border-r p-4 shadow-md hidden md:block">
          <div className="flex items-center space-x-2 mb-6">
            <Building className="h-7 w-7 text-primary" />
            <h2 className="text-xl font-semibold text-primary">Mein Verein</h2>
          </div>
          <nav className="space-y-1">
            {vereinNavItems.map((item) => {
              const isItemActive = pathname === item.href || (item.href !== '/verein/dashboard' && pathname.startsWith(item.href));
              return (
                <Link 
                    key={item.href} 
                    href={item.href} 
                    className={cn(
                        "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors", 
                        isItemActive
                            ? 'bg-accent text-accent-foreground' 
                            : 'text-muted-foreground'
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <Separator className="my-6" />
          <div className="space-y-2 mb-4">
            {/* Passwort-Button entfernt, da er jetzt auf der Hilfeseite ist */}
          </div>
          <Button variant="outline" onClick={() => router.push('/')} className="w-full mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Zur Startseite
          </Button>
          
          {user && <Button variant="outline" onClick={handleLogout} className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>}
        </aside>
        <main className="flex-1 p-6 lg:p-8 bg-muted/20 overflow-y-auto">
          {/* Passwort-Änderungsdialog (nicht als Aufforderung) */}
          {user && <PasswordChangePrompt />}
          {children}
        </main>
      </div>
    </VereinContext.Provider>
  );
}