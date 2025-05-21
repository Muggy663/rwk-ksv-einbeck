// src/app/verein/dashboard/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, UserCircle, ListChecks, Building, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDoc, doc, collection, getDocs, query, where } from 'firebase/firestore'; // Added collection, getDocs, query, where
import { db } from '@/lib/firebase/config';
import type { Club, UserPermission } from '@/types/rwk';
import { useVereinAuth } from '@/app/verein/layout'; 

const CLUBS_COLLECTION = "clubs";

export default function VereinDashboardPage() {
  const { userPermission, loadingPermissions, permissionError } = useVereinAuth();

  const [assignedClubsInfo, setAssignedClubsInfo] = useState<{ id: string, name: string }[]>([]);
  const [isLoadingClubNames, setIsLoadingClubNames] = useState(false);
  const [clubNamesError, setClubNamesError] = useState<string | null>(null);

  useEffect(() => {
    console.log("VereinDashboard DEBUG: Props from context - loadingPermissions:", loadingPermissions, "userPermission:", userPermission, "permissionError (from layout):", permissionError);

    if (loadingPermissions) {
      setIsLoadingClubNames(true);
      return;
    }
    // If layout already determined a permission error, reflect it.
    if (permissionError) {
        setClubNamesError(permissionError); // Use the error message from layout
        setIsLoadingClubNames(false);
        setAssignedClubsInfo([]);
        return;
    }

    const fetchClubNames = async () => {
      if (!userPermission || !userPermission.clubIds || userPermission.clubIds.length === 0) {
        console.log("VereinDashboard DEBUG: No clubIds in userPermission or userPermission is null.");
        setAssignedClubsInfo([]);
        setIsLoadingClubNames(false);
        if (userPermission && (!userPermission.clubIds || userPermission.clubIds.length === 0)) {
          setClubNamesError("Ihrem Konto sind keine Vereine zugewiesen. Bitte kontaktieren Sie den Administrator.");
        } else if (!userPermission && !loadingPermissions) { // Should be caught by layout's error handling
          setClubNamesError("Keine Berechtigungsdaten für diesen Benutzer gefunden.");
        }
        return;
      }

      setIsLoadingClubNames(true);
      setClubNamesError(null);
      console.log("VereinDashboard DEBUG: Fetching club names for clubIds:", userPermission.clubIds);
      
      try {
        const validClubIds = userPermission.clubIds.filter(id => typeof id === 'string' && id.trim() !== '');
        if (validClubIds.length === 0) {
          setAssignedClubsInfo([]);
          setIsLoadingClubNames(false);
          setClubNamesError("Keine gültigen Vereins-IDs zur Abfrage vorhanden.");
          return;
        }
        
        // Fetch multiple club documents. Consider 'in' query if many clubs.
        // For 1-3 clubs, individual getDoc is fine.
        const fetchedClubsPromises = validClubIds.map(id => getDoc(doc(db, CLUBS_COLLECTION, id)));
        const clubDocsSnaps = await Promise.all(fetchedClubsPromises);
        
        const fetchedClubs = clubDocsSnaps
          .filter(docSnap => docSnap.exists())
          .map(docSnap => ({
            id: docSnap.id,
            name: (docSnap.data() as Club).name || "Unbekannter Verein"
          }));
        
        console.log("VereinDashboard DEBUG: Fetched club names:", fetchedClubs);
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

    // Only fetch if permissions are loaded and no error from layout
    if (!loadingPermissions && userPermission && !permissionError) {
      fetchClubNames();
    } else if (!loadingPermissions && !userPermission && !permissionError) {
      // This case should be handled by the layout's permission error display,
      // but as a fallback for the dashboard itself.
      setClubNamesError("Keine Berechtigungsdaten für Anzeige vorhanden.");
      setAssignedClubsInfo([]);
      setIsLoadingClubNames(false);
    }
  }, [userPermission, loadingPermissions, permissionError]);


  if (loadingPermissions) { // Use loadingPermissions from context
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mr-3" />
        <p>Lade Berechtigungen und Vereinsdaten...</p>
      </div>
    );
  }

  // If layout determined an error, this component might not even render its main content
  // due to layout's error handling. But if it does, it can show its own error state.
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
  
  // If permissions are loaded, but club name fetching is in progress
  if (isLoadingClubNames) {
     return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mr-3" />
        <p>Lade Vereinsdetails...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Vereins-Dashboard</h1>
          <p className="text-muted-foreground">
            Willkommen, {userPermission?.displayName || userPermission?.email || 'Vereinsvertreter'}!
          </p>
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
           {clubNamesError && ( // Show specific club name loading errors
             <p className="text-destructive text-sm mt-1">{clubNamesError}</p>
           )}
           {assignedClubsInfo.length === 0 && !isLoadingClubNames && !clubNamesError && userPermission?.clubIds && userPermission.clubIds.length > 0 && (
             <p className="text-amber-600 text-sm mt-1">Die zugewiesenen Vereine konnten nicht geladen werden oder existieren nicht.</p>
           )}
           {assignedClubsInfo.length === 0 && !isLoadingClubNames && !clubNamesError && (!userPermission?.clubIds || userPermission.clubIds.length === 0) && (
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
          <p>Die Zuweisung von Mannschaften zu spezifischen Ligen (z.B. Kreisoberliga) erfolgt durch den Super-Admin.</p>
           <p>Wenn Sie Ihre Vereine nicht verwalten können oder falsche Vereine zugewiesen sind, kontaktieren Sie bitte den Administrator.</p>
        </CardContent>
      </Card>
    </div>
  );
}
