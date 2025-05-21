// src/app/verein/layout.tsx
"use client";
import React, { type ReactNode, useEffect, createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, UserCircle, ListChecks, ArrowLeft, LogOut, Building, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth'; // Use the main Auth hook
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { UserPermission, VereinContextType } from '@/types/rwk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const { 
    user, 
    loading: authLoading, 
    signOut, 
    userAppPermissions, // Get app-specific permissions from AuthContext
    loadingAppPermissions, // Get app-specific permissions loading state
    appPermissionsError // Get app-specific permissions error state
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Local state for permission error specific to this layout's validation logic
  const [layoutPermissionError, setLayoutPermissionError] = useState<string | null>(null);

  useEffect(() => {
    // This effect now primarily validates the permissions obtained from AuthContext
    if (!authLoading && !loadingAppPermissions) {
      if (!user) {
        // This should ideally be handled by a higher-level redirect (e.g. in MainNav or page itself)
        // For robustness, we can still redirect if user becomes null after initial load.
        router.push('/login');
        return;
      }
      if (user.email === ADMIN_EMAIL) {
        // Super-Admin should not be in /verein layout
        router.push('/admin');
        return;
      }

      if (appPermissionsError) {
        setLayoutPermissionError(appPermissionsError);
      } else if (!userAppPermissions) {
        setLayoutPermissionError("Benutzerberechtigungen konnten nicht initialisiert werden.");
      } else if (userAppPermissions.role !== 'vereinsvertreter' && userAppPermissions.role !== 'mannschaftsfuehrer') {
        setLayoutPermissionError(`Keine gültige Vereins-Rolle ('${userAppPermissions.role}') für diesen Benutzer gefunden.`);
      } else if (!userAppPermissions.clubIds || userAppPermissions.clubIds.length === 0) {
        setLayoutPermissionError("Ihrem Konto sind keine Vereine zugewiesen. Bitte kontaktieren Sie den Administrator.");
      } else {
        setLayoutPermissionError(null); // Clear any previous error
      }
    }
  }, [user, authLoading, userAppPermissions, loadingAppPermissions, appPermissionsError, router]);


  const vereinNavItems = [
    { href: '/verein/dashboard', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/verein/mannschaften', label: 'Meine Mannschaften', icon: Users },
    { href: '/verein/schuetzen', label: 'Meine Schützen', icon: UserCircle },
    { href: '/verein/ergebnisse', label: 'Ergebnisse erfassen', icon: ListChecks },
  ];

  const contextValue: VereinContextType = {
    userPermission: userAppPermissions, // Pass down the permissions from AuthContext
    loadingPermissions: loadingAppPermissions,
    // Use layoutPermissionError which combines appPermissionsError and local validation
    permissionError: layoutPermissionError || appPermissionsError, 
  };
  
  if (authLoading || loadingAppPermissions) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3">Lade Benutzer- & Berechtigungsdaten...</p>
      </div>
    );
  }

  if (!user) { // Should be caught by useEffect redirect, but as a fallback
    return (
        <div className="container mx-auto px-4 py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h1 className="text-xl font-semibold text-destructive">Nicht angemeldet</h1>
            <p className="text-muted-foreground">Weiterleitung zum Login...</p>
        </div>
    );
  }
  
  if (user.email === ADMIN_EMAIL) { // Should be caught by useEffect redirect
     return (
        <div className="container mx-auto px-4 py-12 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h1 className="text-xl font-semibold text-amber-600">Admin-Bereich</h1>
            <p className="text-muted-foreground">Weiterleitung zum Admin Panel...</p>
        </div>
    );
  }

  // Display error if permissions are invalid for VV/MF access
  if (layoutPermissionError || appPermissionsError) {
      return (
          <div className="flex min-h-screen">
              <aside className="w-60 bg-background border-r p-4 shadow-md hidden md:block">
                 <div className="flex items-center space-x-2 mb-6"><Building className="h-7 w-7 text-destructive" /><h2 className="text-xl font-semibold text-destructive">Vereinsbereich</h2></div>
                 <Separator className="my-6" />
                 <Button variant="outline" onClick={() => router.push('/')} className="w-full mb-2"><ArrowLeft className="mr-2 h-4 w-4" /> Zur Startseite</Button>
                 {user && <Button variant="outline" onClick={signOut} className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10"><LogOut className="mr-2 h-4 w-4"/> Logout</Button>}
              </aside>
              <main className="flex-1 p-8 flex flex-col justify-center items-center text-center">
                  <Card className="w-full max-w-lg border-destructive bg-destructive/5">
                    <CardHeader>
                      <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6" />
                        Zugriffsproblem im Vereinsbereich
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-destructive-foreground">
                      <p>{layoutPermissionError || appPermissionsError}</p>
                      <p className="text-sm mt-2">Bitte kontaktieren Sie den Administrator, um Ihre Berechtigungen zu überprüfen oder zu korrigieren.</p>
                    </CardContent>
                  </Card>
              </main>
          </div>
      );
  }
  // Only render children if permissions are valid
  if (!userAppPermissions || (!userAppPermissions.clubIds || userAppPermissions.clubIds.length === 0)) {
    // This case should be covered by layoutPermissionError above, but as a fallback
    return (
      <div className="flex min-h-screen justify-center items-center">
         <Card className="w-full max-w-lg border-amber-500 bg-amber-50/50">
            <CardHeader><CardTitle className="text-amber-700">Fehlende Vereinszuweisung</CardTitle></CardHeader>
            <CardContent><p>Ihrem Konto sind keine Vereine zugewiesen. Bitte kontaktieren Sie den Administrator.</p></CardContent>
         </Card>
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
          { React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                // Pass userPermission and loadingPermissions to child pages
                return React.cloneElement(child as React.ReactElement<any>, { 
                    userPermission: userAppPermissions, 
                    loadingPermissions: loadingAppPermissions 
                });
              }
              return child;
            })
          }
        </main>
      </div>
    </VereinContext.Provider>
  );
}
