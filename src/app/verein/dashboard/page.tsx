// src/app/verein/dashboard/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, UserCircle, ListChecks, Building, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Club, UserPermission } from '@/types/rwk';
import { useVereinAuth } from '@/app/verein/layout'; // Use the context hook from VereinLayout

const CLUBS_COLLECTION = "clubs";

// Define a type for the props that this page component will receive
interface VereinDashboardPageProps {
  userPermission?: UserPermission | null; // Made optional as it comes from context now
  loadingPermissions?: boolean; // Made optional
}

export default function VereinDashboardPage(props: VereinDashboardPageProps) {
  // Get permission data from context provided by VereinLayout
  const { userPermission, loadingPermissions, permissionError } = useVereinAuth();

  const [assignedClubsInfo, setAssignedClubsInfo] = useState<{ id: string, name: string }[]>([]);
  const [isLoadingClubNames, setIsLoadingClubNames] = useState(false);
  const [clubNamesError, setClubNamesError] = useState<string | null>(null);

  useEffect(() => {
    console.log("VereinDashboard DEBUG: Context values - loadingPermissions:", loadingPermissions, "userPermission:", userPermission, "permissionError (from layout):", permissionError);

    if (loadingPermissions) {
      setIsLoadingClubNames(true);
      return;
    }
    // If layout already determined a permission error, reflect it.
    if (permissionError) {
        setClubNamesError(permissionError);
        setIsLoadingClubNames(false);
        setAssignedClubsInfo([]);
        return;
    }

    const fetchClubNames = async () => {
      if (!userPermission || !userPermission.clubIds || userPermission.clubIds.length === 0) {
        setAssignedClubsInfo([]);
        setIsLoadingClubNames(false);
        if (!loadingPermissions && userPermission && (!userPermission.clubIds || userPermission.clubIds.length === 0) && userPermission.role === 'vereinsvertreter') {
          // Only show this specific error if role is correct but no clubs
          setClubNamesError("Ihrem Konto sind als Vereinsvertreter keine Vereine zugewiesen. Bitte kontaktieren Sie den Administrator.");
        } else if (!loadingPermissions && !userPermission && !permissionError) {
          setClubNamesError("Keine Berechtigungsdaten für Anzeige vorhanden.");
        }
        return;
      }

      setIsLoadingClubNames(true);
      setClubNamesError(null);
      
      try {
        const validClubIds = userPermission.clubIds.filter(id => typeof id === 'string' && id.trim() !== '');
        if (validClubIds.length === 0) {
          setAssignedClubsInfo([]);
          setIsLoadingClubNames(false);
          setClubNamesError("Keine gültigen Vereins-IDs zur Abfrage vorhanden.");
          return;
        }
        
        const fetchedClubsPromises = validClubIds.map(id => getDoc(doc(db, CLUBS_COLLECTION, id)));
        const clubDocsSnaps = await Promise.all(fetchedClubsPromises);
        
        const fetchedClubs = clubDocsSnaps
          .filter(docSnap => docSnap.exists())
          .map(docSnap => ({
            id: docSnap.id,
            name: (docSnap.data() as Club).name || "Unbekannter Verein"
          }));
        
        setAssignedClubsInfo(fetchedClubs);

        if (fetchedClubs.length === 0 && validClubIds.length > 0) {
            setClubNamesError("Die zugewiesenen Vereine konnten nicht in der Datenbank gefunden werden.");
        }

      } catch (error) {
        console.error("VereinDashboard DEBUG: Fehler beim Laden der Vereinsnamen:", error);
        setClubNamesError(`Fehler beim Laden der Vereinsdetails: ${(error as Error).message}`);
        setAssignedClubsInfo([]);
      } finally {
        setIsLoadingClubNames(false);
      }
    };

    if (!loadingPermissions && userPermission && !permissionError) {
      fetchClubNames();
    }
  }, [userPermission, loadingPermissions, permissionError]);


  if (loadingPermissions) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mr-3" />
        <p>Lade Berechtigungen und Vereinsdaten...</p>
      </div>
    );
  }

  if (permissionError) { 
     return (
      <div className="space-y-6 p-4 md:p-6">
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" /> Zugriffsproblem im Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-destructive-foreground">{permissionError}</p></CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoadingClubNames) {
     return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mr-3" />
        <p>Lade Vereinsdetails...</p>
      </div>
    );
  }
  
  const roleDisplay = userPermission?.role === 'vereinsvertreter' 
    ? 'Vereinsvertreter' 
    : userPermission?.role === 'mannschaftsfuehrer' 
    ? 'Mannschaftsführer' 
    : 'Unbekannte Rolle';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Vereins-Dashboard</h1>
          <p className="text-muted-foreground">
            Willkommen, {userPermission?.displayName || userPermission?.email || 'Benutzer'}!
          </p>
          {userPermission?.role && (
            <p className="text-sm text-accent font-medium mt-1">
              Ihre Rolle: {roleDisplay}
            </p>
          )}
          {assignedClubsInfo.length > 0 && (
            <div className="mt-1">
              <span className="text-muted-foreground">Zugewiesene Vereine: </span>
              {assignedClubsInfo.map((club, index) => (
                <span key={club.id} className="font-semibold text-primary">
                  {club.name}{index < assignedClubsInfo.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
           {clubNamesError && !permissionError && ( // Show specific club name loading errors if no general permission error
             <p className="text-destructive text-sm mt-1">{clubNamesError}</p>
           )}
           {/* Specific message if no clubs assigned for a valid role */}
           {userPermission && (userPermission.role === 'vereinsvertreter' || userPermission.role === 'mannschaftsfuehrer') && 
            (!userPermission.clubIds || userPermission.clubIds.length === 0) && 
            !loadingPermissions && !permissionError && !clubNamesError && (
             <p className="text-amber-600 text-sm mt-1">Ihrem Konto sind aktuell keine Vereine zugewiesen. Bitte kontaktieren Sie den Administrator.</p>
           )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-accent">Meine Mannschaften</CardTitle>
            <Users className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Mannschaften Ihrer Vereine anlegen, bearbeiten und Schützen zuweisen.
            </CardDescription>
            <Link href="/verein/mannschaften" passHref>
              <Button className="w-full" disabled={!userPermission?.clubIds || userPermission.clubIds.length === 0}>Mannschaften verwalten</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-accent">Meine Schützen</CardTitle>
            <UserCircle className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Schützen Ihrer Vereine anlegen und bearbeiten.
            </CardDescription>
            <Link href="/verein/schuetzen" passHref>
              <Button className="w-full" disabled={!userPermission?.clubIds || userPermission.clubIds.length === 0}>Schützen verwalten</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-accent">Ergebniserfassung</CardTitle>
            <ListChecks className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Ergebnisse für die Wettkampfrunden Ihrer Mannschaften eintragen.
            </CardDescription>
            <Link href="/verein/ergebnisse" passHref>
              <Button className="w-full" disabled={!userPermission?.clubIds || userPermission.clubIds.length === 0}>Ergebnisse erfassen</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
       <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-accent">Wichtige Hinweise</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Dies ist Ihr persönlicher Verwaltungsbereich für Ihre zugewiesenen Vereine.</p>
          {userPermission?.role === 'mannschaftsfuehrer' && 
            <p>Als Mannschaftsführer können Sie Ergebnisse eintragen. Die Verwaltung von Mannschaften und Schützen obliegt dem Vereinsvertreter oder Super-Admin.</p>
          }
          {userPermission?.role === 'vereinsvertreter' &&
             <p>Die Zuweisung von Mannschaften zu spezifischen Ligen (z.B. Kreisoberliga) erfolgt durch den Super-Admin.</p>
          }
           <p>Wenn Sie Ihre Vereine nicht verwalten können oder falsche Vereine zugewiesen sind, kontaktieren Sie bitte den Administrator.</p>
        </CardContent>
      </Card>
    </div>
  );
}
