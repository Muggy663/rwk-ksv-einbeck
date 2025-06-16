"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, UserCircle, ListChecks, Building, Loader2, AlertTriangle, ShieldAlert, FileDown, Settings, Key, CalendarDays } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useVereinAuth } from '@/app/verein/layout'; 
import { FirstStepsWizard } from '@/components/onboarding/FirstStepsWizard';

const CLUBS_COLLECTION = "clubs";

interface ClubInfo {
  id: string;
  name: string;
}

export default function VereinDashboardPage() {
  const { 
    userPermission, 
    loadingPermissions, 
    permissionError: contextPermissionError,
    assignedClubIdArray 
  } = useVereinAuth();

  const [assignedClubsInfo, setAssignedClubsInfo] = useState<ClubInfo[]>([]);
  const [isLoadingClubNames, setIsLoadingClubNames] = useState<boolean>(false);
  const [clubNameError, setClubNameError] = useState<string | null>(null);

  useEffect(() => {
    console.log("VereinDashboard DEBUG: Props from context - loadingPermissions:", loadingPermissions, "contextPermissionError:", contextPermissionError, "assignedClubIdArray:", assignedClubIdArray);
    console.log("VereinDashboard DEBUG: userPermission from context:", userPermission);

    const fetchClubNames = async () => {
      if (loadingPermissions) {
          console.log("VereinDashboard DEBUG: Still loading permissions, deferring club name fetch.");
          return;
      }
      if (!userPermission || !assignedClubIdArray || assignedClubIdArray.length === 0) {
        console.log("VereinDashboard DEBUG: No userPermission or no assigned club IDs. Clearing club names.");
        setAssignedClubsInfo([]);
        if (!contextPermissionError && userPermission && (!assignedClubIdArray || assignedClubIdArray.length === 0) ) {
            setClubNameError("Ihrem Konto sind aktuell keine spezifischen Vereine zugewiesen.");
        }
        return;
      }

      setIsLoadingClubNames(true);
      setClubNameError(null);
      
      try {
        console.log("VereinDashboard DEBUG: Fetching names for club IDs:", assignedClubIdArray);
        const validClubIds = assignedClubIdArray.filter(id => typeof id === 'string' && id.trim() !== '');
        if (validClubIds.length === 0) {
            setAssignedClubsInfo([]);
            setClubNameError("Keine gültigen Vereins-IDs zur Abfrage vorhanden.");
            setIsLoadingClubNames(false);
            return;
        }

        const clubsQuery = query(collection(db, CLUBS_COLLECTION), where(documentId(), "in", validClubIds));
        const clubsSnap = await getDocs(clubsQuery);
        
        const fetchedClubs = clubsSnap.docs.map(snap => ({
            id: snap.id,
            name: (snap.data()).name || "Unbekannter Verein"
        }));
        setAssignedClubsInfo(fetchedClubs);

        if (fetchedClubs.length === 0 && validClubIds.length > 0) {
             console.warn("VereinDashboard DEBUG: No clubs found in Firestore for the assigned IDs:", validClubIds);
             setClubNameError(`Die zugewiesenen Vereine konnten nicht in der Datenbank gefunden werden.`);
        }
        
      } catch (error: any) {
        console.error("VereinDashboard DEBUG: Fehler beim Laden der Vereinsnamen:", error);
        setClubNameError(`Fehler beim Laden der Vereinsdetails: ${error.message}`);
        setAssignedClubsInfo([]);
      } finally {
        setIsLoadingClubNames(false);
      }
    };

    fetchClubNames();
  }, [assignedClubIdArray, userPermission, loadingPermissions, contextPermissionError]);


  if (loadingPermissions) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mr-3" />
        <p>Lade Vereins- und Berechtigungsdaten...</p>
      </div>
    );
  }

  // Fehler vom VereinLayout (z.B. keine Rolle, keine clubIds im user_permissions Dokument)
  if (contextPermissionError) {
    return (
      <div className="p-6">
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" /> Zugriffsproblem im Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{contextPermissionError}</p>
            <p className="text-sm mt-1">Bitte kontaktieren Sie den Administrator, um diese Zuweisung vorzunehmen oder zu korrigieren.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Fall, dass userPermission da ist, aber aus irgendeinem Grund keine clubIds (sollte durch Layout abgefangen werden, aber als Sicherheit)
  if (!userPermission || !assignedClubIdArray || assignedClubIdArray.length === 0) {
    return (
        <Card className="border-amber-500 bg-amber-50/50">
            <CardHeader><CardTitle className="text-amber-700 flex items-center gap-2"><AlertTriangle />Kein Verein zugewiesen</CardTitle></CardHeader>
            <CardContent><p>Ihrem Konto ist kein Verein für die Nutzung dieses Bereichs zugewiesen. Bitte kontaktieren Sie den Administrator.</p></CardContent>
        </Card>
     );
  }

  const roleDisplay = userPermission?.role === 'vereinsvertreter' 
    ? 'Vereinsvertreter' 
    : userPermission?.role === 'mannschaftsfuehrer' 
    ? 'Mannschaftsführer' 
    : (userPermission?.role ? userPermission.role : 'Unbekannte Rolle');
  
  const isVereinsvertreter = userPermission?.role === 'vereinsvertreter';

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

          {isLoadingClubNames && <div className="flex items-center mt-1"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Lade Vereinsnamen...</div>}
          
          {!isLoadingClubNames && assignedClubsInfo.length > 0 && (
            <div className="mt-1">
              <span className="text-sm text-muted-foreground">Aktuell aktiv für Verein(e): </span>
              <ul className="list-disc list-inside ml-1">
                {assignedClubsInfo.map(club => (
                    <li key={club.id} className="text-sm font-semibold text-primary">{club.name}</li>
                ))}
              </ul>
               {assignedClubsInfo.length > 1 && <p className="text-xs text-muted-foreground mt-1">Auf den jeweiligen Verwaltungsseiten können Sie den aktiven Verein auswählen.</p>}
            </div>
          )}
           {!isLoadingClubNames && clubNameError && (
             <p className="text-destructive text-sm mt-1">{clubNameError}</p>
           )}
           {!isLoadingClubNames && assignedClubsInfo.length === 0 && !clubNameError && (
             <p className="text-amber-700 text-sm mt-1">Keine Vereinsdetails für die zugewiesenen IDs gefunden oder keine Vereine zugewiesen.</p>
           )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              <Button className="w-full">Ergebnisse erfassen</Button>
              </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-accent">Handtabellen</CardTitle>
              <FileDown className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <CardDescription className="mb-4">
              Leere Tabellen zum Handausfüllen für den Saisonbeginn herunterladen.
              </CardDescription>
              <Link href="/verein/handtabellen" passHref>
              <Button className="w-full">Handtabellen erstellen</Button>
              </Link>
          </CardContent>
        </Card>

        {/* Erste Schritte Wizard */}
        <FirstStepsWizard />

        {/* Passwort ändern */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-accent">Passwort ändern</CardTitle>
              <Key className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <CardDescription className="mb-4">
              Ändern Sie Ihr Passwort regelmäßig für mehr Sicherheit.
              </CardDescription>
              <Link href="/change-password" passHref>
              <Button className="w-full">Passwort ändern</Button>
              </Link>
          </CardContent>
        </Card>
        
        {/* Terminverwaltung (kombiniert) */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-accent">Terminkalender</CardTitle>
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <CardDescription className="mb-4">
              Termine einsehen und neue Termine für Ihren Verein hinzufügen.
              </CardDescription>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/termine" passHref>
                  <Button className="w-full" variant="outline">Termine ansehen</Button>
                </Link>
                <Link href="/termine/add" passHref>
                  <Button className="w-full">Termin hinzufügen</Button>
                </Link>
              </div>
          </CardContent>
        </Card>

        {/* Zeige Mannschafts- und Schützenverwaltung nur für Vereinsvertreter */}
        {isVereinsvertreter && (
          <>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-accent">Meine Mannschaften</CardTitle>
                <Users className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Mannschaften Ihres Vereins anlegen und verwalten.
                </CardDescription>
                <Link href="/verein/mannschaften" passHref>
                  <Button className="w-full">Mannschaften verwalten</Button>
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
                  Schützen Ihres Vereins anlegen und verwalten.
                </CardDescription>
                <Link href="/verein/schuetzen" passHref>
                  <Button className="w-full">Schützen verwalten</Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
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
           <p>Wenn Sie Ihren Verein nicht verwalten können oder ein falscher Verein zugewiesen ist, kontaktieren Sie bitte den Administrator.</p>
        </CardContent>
      </Card>
    </div>
  );
}