// /app/verein/schuetzen/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2, AlertTriangle, UserCircle as UserIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDescriptionComponent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox"; // Keep for potential future team assignment in dialog
import { ScrollArea } from "@/components/ui/scroll-area"; // Keep for potential future team assignment in dialog
import { useVereinAuth } from '@/app/verein/layout';
import type { Shooter, Club, Team, UserPermission, FirestoreLeagueSpecificDiscipline, TeamValidationInfo } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, getDisciplineCategory, leagueDisciplineOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  documentId,
  writeBatch,
  getDoc as getFirestoreDoc,
  arrayRemove,
  arrayUnion,
  Timestamp
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams

const SHOOTERS_COLLECTION = "rwk_shooters";
const TEAMS_COLLECTION = "rwk_teams";
const CLUBS_COLLECTION = "clubs";
const LEAGUES_COLLECTION = "rwk_leagues";

export default function VereinSchuetzenPage() {
  const { userPermission, loadingPermissions, permissionError, assignedClubId } = useVereinAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTeamId = searchParams.get('teamId');

  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [activeClubName, setActiveClubName] = useState<string | null>(null);
  
  const [allClubsGlobal, setAllClubsGlobal] = useState<Club[]>([]);
  const [allLeaguesGlobal, setAllLeaguesGlobal] = useState<League[]>([]);

  const [shootersOfActiveClub, setShootersOfActiveClub] = useState<Shooter[]>([]);
  const [allTeamsDataForClub, setAllTeamsDataForClub] = useState<Team[]>([]);

  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isLoadingClubSpecificData, setIsLoadingClubSpecificData] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [contextTeamName, setContextTeamName] = useState<string | null>(null);
  const [isContextTeamNameLoading, setIsContextTeamNameLoading] = useState<boolean>(false);

  // States for team assignment in "New Shooter" dialog (simplified for VV)
  const [teamsOfSelectedClubInDialog, setTeamsOfSelectedClubInDialog] = useState<Array<Team & { leagueType?: FirestoreLeagueSpecificDiscipline, leagueCompetitionYear?: number, currentShooterCount?: number }>>([]);
  const [isLoadingTeamsForDialog, setIsLoadingTeamsForDialog] = useState(false);
  const [selectedTeamIdsInForm, setSelectedTeamIdsInForm] = useState<string[]>([]);


  const isVereinsvertreter = useMemo(() => userPermission?.role === 'vereinsvertreter', [userPermission]);

  // Effect 1: Fetch all clubs globally once for name lookups
  const fetchAllClubsAndLeaguesGlobal = useCallback(async () => {
    console.log("VSP DEBUG: Fetching all clubs and leagues globally.");
    setIsLoadingPageData(true); // Indicates global data is loading
    try {
      const clubsSnapshotPromise = getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
      const leaguesSnapshotPromise = getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      
      const [clubsSnapshot, leaguesSnapshot] = await Promise.all([clubsSnapshotPromise, leaguesSnapshotPromise]);

      const fetchedClubs = clubsSnapshot.docs
        .map(docData => ({ id: docData.id, ...docData.data() } as Club))
        .filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== "");
      setAllClubsGlobal(fetchedClubs);
      console.log("VSP DEBUG: All global clubs fetched:", fetchedClubs.length);

      const fetchedLeagues = leaguesSnapshot.docs
        .map(lDoc => ({ id: lDoc.id, ...lDoc.data() } as League))
        .filter(l => l.id && typeof l.id === 'string' && l.id.trim() !== "");
      setAllLeaguesGlobal(fetchedLeagues);
      console.log("VSP DEBUG: All global leagues fetched:", fetchedLeagues.length);

    } catch (error) {
      console.error("VSP DEBUG: Error fetching global clubs/leagues:", error);
      toast({ title: "Fehler", description: "Globale Vereins- oder Ligadaten konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingPageData(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllClubsAndLeaguesGlobal();
  }, [fetchAllClubsAndLeaguesGlobal]);

  // Effect 2: Set activeClubId and activeClubName based on userPermission from context
  useEffect(() => {
    console.log("VSP DEBUG: Effect for activeClubId. loadingPermissions:", loadingPermissions, "assignedClubId from context:", assignedClubId);
    if (!loadingPermissions) { // Wait for permissions to be loaded
      if (assignedClubId && typeof assignedClubId === 'string' && assignedClubId.trim() !== '') {
        setActiveClubId(assignedClubId);
        const clubInfo = allClubsGlobal.find(c => c.id === assignedClubId);
        if (clubInfo) {
          setActiveClubName(clubInfo.name);
          console.log("VSP DEBUG: activeClubId SET to:", assignedClubId, "Name:", clubInfo.name);
        } else if (allClubsGlobal.length > 0) {
          console.warn("VSP DEBUG: Club info for assignedClubId not found in allClubsGlobal. ID:", assignedClubId);
          setActiveClubName("Verein nicht gefunden"); 
        } else {
           // allClubsGlobal might not be loaded yet if this effect runs before fetchAllClubsAndLeaguesGlobal finishes
           console.log("VSP DEBUG: allClubsGlobal not yet populated, will try to set name later.");
           setActiveClubName("Lade Vereinsname...");
        }
      } else {
        console.warn("VSP DEBUG: No valid assignedClubId in userPermission from context. Setting activeClub to null.", { assignedClubId });
        setActiveClubId(null);
        setActiveClubName(null);
      }
    }
  }, [assignedClubId, loadingPermissions, allClubsGlobal]);
  
  // Re-attempt to set club name if allClubsGlobal loads after assignedClubId is set
  useEffect(() => {
    if (activeClubId && allClubsGlobal.length > 0 && (!activeClubName || activeClubName === "Lade Vereinsname...")) {
        const clubInfo = allClubsGlobal.find(c => c.id === activeClubId);
        if (clubInfo) {
            setActiveClubName(clubInfo.name);
            console.log("VSP DEBUG: ActiveClubName updated from allClubsGlobal to:", clubInfo.name);
        } else {
            setActiveClubName("Verein nicht gefunden");
            console.warn("VSP DEBUG: (Re-check) Club info for activeClubId not found in allClubsGlobal. ID:", activeClubId);
        }
    }
  }, [activeClubId, allClubsGlobal, activeClubName]);


  // Effect 3: Fetch page-specific data (shooters and teams of active club)
  const fetchPageDataForActiveClub = useCallback(async () => {
    if (!activeClubId) {
      setShootersOfActiveClub([]);
      setAllTeamsDataForClub([]);
      console.log("VSP DEBUG: fetchPageData - No activeClubId, clearing data.");
      return;
    }
    console.log(`VSP DEBUG: fetchPageData - Fetching for activeClubId: ${activeClubId}`);
    setIsLoadingClubSpecificData(true);
    try {
      const shootersQuery = query(collection(db, SHOOTERS_COLLECTION), where("clubId", "==", activeClubId), orderBy("lastName", "asc"), orderBy("firstName", "asc"));
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", activeClubId));

      const [shootersSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(shootersQuery), getDocs(teamsQuery)
      ]);

      const fetchedShooters = shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), teamIds: (d.data().teamIds || []) } as Shooter));
      setShootersOfActiveClub(fetchedShooters);
      console.log(`VSP DEBUG: Fetched ${fetchedShooters.length} shooters for club ${activeClubId}`);

      const fetchedTeams = teamsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team));
      setAllTeamsDataForClub(fetchedTeams);
      console.log(`VSP DEBUG: Fetched ${fetchedTeams.length} teams for club ${activeClubId} (for info column).`);

    } catch (error) {
      console.error(`VSP DEBUG: Error fetching page data for club ${activeClubId}:`, error);
      toast({ title: "Fehler", description: "Schützen- oder Mannschaftsdaten konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingClubSpecificData(false);
    }
  }, [activeClubId, toast]);

  useEffect(() => {
    if (activeClubId) {
      fetchPageDataForActiveClub();
    } else {
      setShootersOfActiveClub([]);
      setAllTeamsDataForClub([]);
    }
  }, [activeClubId, fetchPageDataForActiveClub]);
  
  // Effect 4: Fetch teams for "New Shooter" dialog's team assignment section
  const fetchTeamsForClubInDialog = useCallback(async () => {
    if (!isFormOpen || formMode !== 'new' || !activeClubId || !isVereinsvertreter) {
      setTeamsOfSelectedClubInDialog([]);
      return;
    }
    console.log("VSP DIALOG DEBUG: Fetching teams for new shooter dialog, activeClubId:", activeClubId);
    setIsLoadingTeamsForDialog(true);
    try {
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", activeClubId), orderBy("name", "asc"));
      const snapshot = await getDocs(teamsQuery);
      
      const teamsData = snapshot.docs.map(teamDoc => {
        const teamData = teamDoc.data() as Team;
        const leagueInfo = allLeaguesGlobal.find(l => l.id === teamData.leagueId);
        return {
          ...teamData,
          id: teamDoc.id,
          leagueType: leagueInfo?.type,
          leagueCompetitionYear: leagueInfo?.competitionYear,
          currentShooterCount: (teamData.shooterIds || []).length,
        };
      });
      setTeamsOfSelectedClubInDialog(teamsData);
      console.log("VSP DIALOG DEBUG: Fetched teams for dialog:", teamsData.length);

      if (queryTeamId && teamsData.some(t => t.id === queryTeamId)) {
        const contextTeam = teamsData.find(t => t.id === queryTeamId);
        if (contextTeam && (contextTeam.currentShooterCount || 0) < MAX_SHOOTERS_PER_TEAM) {
          setSelectedTeamIdsInForm([queryTeamId]);
        } else if (contextTeam) {
          toast({ title: "Mannschaft voll", description: `Kontext-Mannschaft "${contextTeam.name}" ist voll.`, variant: "warning" });
        }
      } else {
        setSelectedTeamIdsInForm([]);
      }

    } catch (error) {
      console.error("VSP DIALOG DEBUG: Error fetching teams for dialog:", error);
      toast({ title: "Fehler", description: "Mannschaften für Dialog konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingTeamsForDialog(false);
    }
  }, [isFormOpen, formMode, activeClubId, isVereinsvertreter, allLeaguesGlobal, queryTeamId, toast]);

  useEffect(() => {
    if (isFormOpen && formMode === 'new' && activeClubId && isVereinsvertreter) {
      fetchTeamsForClubInDialog();
    }
  }, [isFormOpen, formMode, activeClubId, isVereinsvertreter, fetchTeamsForClubInDialog]);


  const handleAddNewShooter = () => {
    if (!isVereinsvertreter || !activeClubId) {
      toast({ title: "Aktion nicht erlaubt", variant: "destructive" }); return;
    }
    setFormMode('new');
    setCurrentShooter({
      clubId: activeClubId,
      gender: 'male',
      teamIds: [],
    });
    // Team pre-selection based on queryTeamId will be handled by fetchTeamsForClubInDialog
    setIsFormOpen(true);
  };

  const handleEditShooter = (shooter: Shooter) => {
    if (!isVereinsvertreter || shooter.clubId !== activeClubId) {
      toast({ title: "Nicht autorisiert", variant: "destructive" }); return;
    }
    setFormMode('edit');
    setCurrentShooter(shooter);
    setSelectedTeamIdsInForm([]); // Reset, not editing teams here
    setTeamsOfSelectedClubInDialog([]); // Reset, not showing team list for edit
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (shooter: Shooter) => {
    if (!isVereinsvertreter || shooter.clubId !== activeClubId) {
      toast({ title: "Nicht autorisiert", variant: "destructive" }); return;
    }
    setShooterToDelete(shooter);
    setIsAlertOpen(true);
  };

  const handleDeleteShooter = async () => {
    if (!shooterToDelete || !shooterToDelete.id || !userPermission?.uid || !isVereinsvertreter || shooterToDelete.clubId !== activeClubId) {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
      setShooterToDelete(null); setIsAlertOpen(false); return;
    }
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterToDelete.id);
      batch.delete(shooterDocRef);

      const teamsToUpdateQuery = query(
        collection(db, TEAMS_COLLECTION),
        where("clubId", "==", activeClubId),
        where("shooterIds", "array-contains", shooterToDelete.id)
      );
      const teamsToUpdateSnap = await getDocs(teamsToUpdateQuery);
      teamsToUpdateSnap.forEach(teamDoc => {
        batch.update(teamDoc.ref, { shooterIds: arrayRemove(shooterToDelete.id) });
      });
      
      await batch.commit();
      toast({ title: "Schütze gelöscht", description: `"${shooterToDelete.name}" wurde entfernt.` });
      fetchPageDataForActiveClub();
    } catch (error: any) {
      console.error("VSP DELETE DEBUG: Error deleting shooter:", error);
      toast({ title: "Fehler beim Löschen", description: error.message || "Unbekannter Fehler.", variant: "destructive" });
    } finally {
      setIsDeleting(false); setIsAlertOpen(false); setShooterToDelete(null);
    }
  };

  const handleSubmitShooterForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isVereinsvertreter || !activeClubId) {
      toast({ title: "Nicht autorisiert", variant: "destructive" }); setIsFormSubmitting(false); return;
    }
    if (!currentShooter || !currentShooter.lastName?.trim() || !currentShooter.firstName?.trim()) {
      toast({ title: "Ungültige Eingabe", description: "Nachname und Vorname sind erforderlich.", variant: "destructive" });
      setIsFormSubmitting(false); return;
    }

    setIsFormSubmitting(true);
    const combinedName = `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`;

    try {
      const shootersColRef = collection(db, SHOOTERS_COLLECTION);
      let qDuplicateName = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", activeClubId));
      if (formMode === 'edit' && currentShooter.id) {
        qDuplicateName = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", activeClubId), where(documentId(), "!=", currentShooter.id));
      }
      const duplicateSnap = await getDocs(qDuplicateName);
      if (!duplicateSnap.empty) {
        toast({ title: "Doppelter Schütze", description: `"${combinedName}" existiert bereits in ${activeClubName || 'diesem Verein'}.`, variant: "destructive" });
        setIsFormSubmitting(false); return;
      }

      const batch = writeBatch(db);

      if (formMode === 'new') {
        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        const shooterDataForSave: Omit<Shooter, 'id'> = {
          firstName: currentShooter.firstName.trim(),
          lastName: currentShooter.lastName.trim(),
          name: combinedName,
          clubId: activeClubId,
          gender: currentShooter.gender || 'male',
          teamIds: selectedTeamIdsInForm || [],
        };
        batch.set(newShooterRef, shooterDataForSave);

        (selectedTeamIdsInForm || []).forEach(teamId => {
           const teamInfo = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
           if(teamInfo && (teamInfo.currentShooterCount || 0) < MAX_SHOOTERS_PER_TEAM) {
             batch.update(doc(db, TEAMS_COLLECTION, teamId), { shooterIds: arrayUnion(newShooterRef.id) });
           }
        });
        toast({ title: "Schütze erstellt", description: `${shooterDataForSave.name} wurde für ${activeClubName} angelegt.` });

      } else if (formMode === 'edit' && currentShooter.id) {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        const updateData: Partial<Shooter> = {
          firstName: currentShooter.firstName.trim(),
          lastName: currentShooter.lastName.trim(),
          name: combinedName,
          gender: currentShooter.gender || 'male',
        };
        batch.update(shooterDocRef, updateData);
        toast({ title: "Schütze aktualisiert", description: `${combinedName} wurde aktualisiert.` });
      }
      
      await batch.commit();
      setIsFormOpen(false); setCurrentShooter(null); setSelectedTeamIdsInForm([]);
      fetchPageDataForActiveClub();
    } catch (error: any) {
      console.error("VSP SUBMIT DEBUG: Error saving shooter:", error);
      toast({ title: `Fehler beim Speichern`, description: error.message || "Ein unbekannter Fehler.", variant: "destructive" });
    } finally {
      setIsFormSubmitting(false);
    }
  };
  
  const handleFormInputChange = (field: keyof Pick<Shooter, 'lastName' | 'firstName' | 'gender'>, value: string) => {
    setCurrentShooter(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleTeamSelectionChangeInForm = (teamId: string, checked: boolean) => {
    if (!isVereinsvertreter || isFormSubmitting || isLoadingTeamsForDialog) return;
    
    const teamBeingChanged = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
    if (!teamBeingChanged) return;

    if (checked) { 
      if ((teamBeingChanged.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM) {
        toast({ title: "Mannschaft voll", variant: "warning" }); return; 
      }
      const categoryOfTeamBeingChanged = getDisciplineCategory(teamBeingChanged.leagueType);
      const yearOfTeamBeingChanged = teamBeingChanged.leagueCompetitionYear;

      if (categoryOfTeamBeingChanged && yearOfTeamBeingChanged !== undefined) {
        const conflict = selectedTeamIdsInForm.some(id => {
          if (id === teamId) return false;
          const otherTeam = teamsOfSelectedClubInDialog.find(t => t.id === id);
          return otherTeam && getDisciplineCategory(otherTeam.leagueType) === categoryOfTeamBeingChanged && otherTeam.leagueCompetitionYear === yearOfTeamBeingChanged;
        });
        if (conflict) {
          toast({ title: "Regelverstoß", description: `Schütze kann pro Saison/Disziplinkategorie nur einem Team angehören.`, variant: "destructive", duration: 7000 });
          return;
        }
      }
    }
    setSelectedTeamIdsInForm(prev => checked ? [...prev, teamId] : prev.filter(id => id !== teamId));
  };

  const getTeamInfoForShooter = useCallback((shooter: Shooter): string => {
    const teamIds = shooter.teamIds || [];
    if (teamIds.length === 0) return '-';
    if (allTeamsDataForClub.length === 0 && teamIds.length > 0) return `${teamIds.length} (Lade Teamnamen...)`;
    
    const assignedTeamNames = teamIds
        .map(tid => allTeamsDataForClub.find(t => t.id === tid)?.name)
        .filter(name => !!name);

    if (assignedTeamNames.length === 1) return assignedTeamNames[0]!;
    if (assignedTeamNames.length > 0) return `${assignedTeamNames.length} Mannschaften`;
    
    return teamIds.length > 0 ? `${teamIds.length} (IDs)` : '-';
  }, [allTeamsDataForClub]);

  if (loadingPermissions || isLoadingPageData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-primary">Meine Schützen</h1>
           <p className="text-muted-foreground text-lg md:text-right">Verein: <Loader2 className="inline h-4 w-4 animate-spin" /> lädt...</p>
        </div>
        <div className="flex justify-center items-center py-10"> <Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-3">Lade Vereinsdaten und Schützen...</p></div>
      </div>
    );
  }

  if (permissionError) {
    return <div className="p-6"><Card className="border-destructive bg-destructive/5"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> {permissionError}</CardTitle></CardHeader></Card></div>;
  }
  
  if (!activeClubId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><h1 className="text-2xl font-semibold text-primary">Meine Schützen</h1></div>
        <Card className="border-amber-500 bg-amber-50/50">
          <CardHeader><CardTitle className="text-amber-700 flex items-center gap-2"><AlertTriangle />Kein Verein zugewiesen</CardTitle></CardHeader>
          <CardContent><p>Ihrem Konto ist kein Verein für die Schützenverwaltung zugewiesen oder der Verein konnte nicht geladen werden. Bitte kontaktieren Sie den Administrator.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Meine Schützen</h1>
          {activeClubName && <p className="text-muted-foreground">Verein: <span className="font-semibold">{activeClubName}</span></p>}
          {contextTeamName && <p className="text-xs text-muted-foreground">Kontext: Mannschaft "{contextTeamName}" {isContextTeamNameLoading && "(Lade...)"}</p>}
        </div>
        {isVereinsvertreter && (
          <Button onClick={handleAddNewShooter} disabled={isLoadingClubSpecificData || isFormSubmitting || isDeleting}>
            <PlusCircle className="mr-2 h-5 w-5" /> Neuen Schützen anlegen
          </Button>
        )}
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Schützenliste für {activeClubName || "Ihren Verein"}</CardTitle>
          <CardDescription>
            {isVereinsvertreter ? "Verwalten Sie hier die Schützen Ihres Vereins." : "Übersicht der Schützen Ihres Vereins."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingClubSpecificData && <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Schützen...</p></div>}
          {!isLoadingClubSpecificData && shootersOfActiveClub.length === 0 && (
            <div className="p-4 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <AlertTriangle className="mx-auto h-8 w-8 text-primary/70 mb-2" />
              <p>{`Keine Schützen für "${activeClubName || 'diesen Verein'}" gefunden.`}</p>
              {isVereinsvertreter && <p className="text-sm mt-1">Klicken Sie auf "Neuen Schützen anlegen".</p>}
            </div>
          )}
          {!isLoadingClubSpecificData && shootersOfActiveClub.length > 0 && (
            <Table>
              <TableHeader><TableRow>
                  <TableHead>Nachname</TableHead><TableHead>Vorname</TableHead>
                  <TableHead>Geschlecht</TableHead><TableHead>Mannschaften (Info)</TableHead>
                  {isVereinsvertreter && <TableHead className="text-right">Aktionen</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {shootersOfActiveClub.map((shooter) => (
                <TableRow key={shooter.id}>
                    <TableCell>{shooter.lastName}</TableCell>
                    <TableCell>{shooter.firstName}</TableCell>
                    <TableCell>{shooter.gender === 'female' ? 'Weiblich' : (shooter.gender === 'male' ? 'Männlich' : 'N/A')}</TableCell>
                    <TableCell className="text-xs">{getTeamInfoForShooter(shooter)}</TableCell>
                    {isVereinsvertreter && (
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditShooter(shooter)} disabled={isFormSubmitting || isDeleting}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog open={isAlertOpen && shooterToDelete?.id === shooter.id} onOpenChange={(open) => {if(!open) setShooterToDelete(null); setIsAlertOpen(open);}}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteConfirmation(shooter)} disabled={isFormSubmitting || isDeleting}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Schütze löschen?</AlertDialogTitle><AlertDialogDescription>Möchten Sie "{shooterToDelete?.name}" wirklich löschen? Dies entfernt den Schützen auch aus allen zugeordneten Mannschaften dieses Vereins.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => {setIsAlertOpen(false); setShooterToDelete(null);}}>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteShooter} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Löschen</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
                </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isFormOpen && currentShooter && (
        <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setCurrentShooter(null); setSelectedTeamIdsInForm([]); setTeamsOfSelectedClubInDialog([]);} setIsFormOpen(open); }}>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleSubmitShooterForm}>
              <DialogHeader>
                <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
                <DialogDescriptionComponent>Für Verein: {activeClubName || 'Ihr Verein'}.
                 {formMode === 'edit' && <span className="block text-xs mt-1">Die Mannschaftszuordnung erfolgt über "Meine Mannschaften".</span>}
                 {formMode === 'new' && queryTeamId && contextTeamName &&
                        ` Kontext: Schütze wird ggf. initial der Mannschaft "${contextTeamName}" zugeordnet (falls Kapazität & unten ausgewählt).`
                 }
                </DialogDescriptionComponent>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-1.5"><Label htmlFor="vsp-lastName-dialog">Nachname</Label><Input id="vsp-lastName-dialog" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} required disabled={!isVereinsvertreter && formMode ==='edit'} /></div>
                <div className="space-y-1.5"><Label htmlFor="vsp-firstName-dialog">Vorname</Label><Input id="vsp-firstName-dialog" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} required disabled={!isVereinsvertreter && formMode ==='edit'}/></div>
                <div className="space-y-1.5"> <Label htmlFor="vsp-clubDisplay-dialog">Verein</Label> <Input id="vsp-clubDisplay-dialog" value={activeClubName || ''} disabled className="bg-muted/50" /> </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vsp-gender-dialog">Geschlecht</Label>
                  <Select value={currentShooter.gender || 'male'} onValueChange={(v) => handleFormInputChange('gender', v as 'male' | 'female')} disabled={!isVereinsvertreter && formMode ==='edit'}>
                    <SelectTrigger id="vsp-gender-dialog"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Männlich</SelectItem><SelectItem value="female">Weiblich</SelectItem></SelectContent>
                  </Select>
                </div>

                {formMode === 'new' && activeClubId && isVereinsvertreter && (
                  <div className="space-y-2 pt-3 border-t mt-3">
                    <Label className="text-base font-medium">Mannschaften für "{activeClubName}" zuordnen (Optional)</Label>
                    <p className="text-xs text-muted-foreground">Ein Schütze darf pro Saison und Disziplinkategorie (Gewehr/Pistole) nur einer Mannschaft angehören. Max. {MAX_SHOOTERS_PER_TEAM} Schützen pro Team.</p>
                    {isLoadingTeamsForDialog ? (
                      <div className="flex items-center justify-center p-4 h-32 border rounded-md bg-muted/30"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2">Lade Mannschaften...</p></div>
                    ): teamsOfSelectedClubInDialog.length > 0 ? (
                      <ScrollArea className="h-40 rounded-md border p-3 bg-background">
                        <div className="space-y-1">
                          {teamsOfSelectedClubInDialog.map(team => {
                            if(!team || !team.id) return null;
                            const isSelected = selectedTeamIdsInForm.includes(team.id);
                            
                            let isDisabled = false;
                            let disableReason = "";
                            const teamIsFull = (team.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM;

                            if (teamIsFull && !isSelected) {
                                isDisabled = true; disableReason = "(Voll)";
                            } else if (!isSelected) { // Nur prüfen, wenn versucht wird, das Team neu auszuwählen
                                const categoryOfCurrentTeamDialog = getDisciplineCategory(team.leagueType);
                                const yearOfCurrentTeamDialog = team.leagueCompetitionYear;
                                if (categoryOfCurrentTeamDialog && yearOfCurrentTeamDialog !== undefined) {
                                    const conflictExists = selectedTeamIdsInForm.some(selectedTeamIdInForm => {
                                        const otherSelectedTeamData = teamsOfSelectedClubInDialog.find(t => t.id === selectedTeamIdInForm);
                                        return otherSelectedTeamData &&
                                               getDisciplineCategory(otherSelectedTeamData.leagueType) === categoryOfCurrentTeamDialog &&
                                               otherSelectedTeamData.leagueCompetitionYear === yearOfCurrentTeamDialog;
                                    });
                                    if (conflictExists) {
                                        isDisabled = true;
                                        disableReason = `(bereits ${categoryOfCurrentTeamDialog}-Team ${yearOfCurrentTeamDialog} gewählt)`;
                                    }
                                }
                            }
                            const leagueTypeLabel = team.leagueType ? (leagueDisciplineOptions.find(opt => opt.value === team.leagueType)?.label || team.leagueType) : "Liga-los";
                            return (
                              <div key={team.id} className="flex items-center space-x-3 p-1.5 hover:bg-muted/50 rounded-md">
                                <Checkbox id={`team-select-vv-shooter-${team.id}`} checked={isSelected} onCheckedChange={(checkedState) => handleTeamSelectionChangeInForm(team.id, !!checkedState)} disabled={isDisabled} />
                                <Label htmlFor={`team-select-vv-shooter-${team.id}`} className={`font-normal text-sm leading-tight ${isDisabled ? 'text-muted-foreground line-through' : 'cursor-pointer'}`}>
                                  {team.name}
                                  {(team.leagueType && team.leagueCompetitionYear !== undefined) && <span className="text-xs text-muted-foreground ml-1">({leagueTypeLabel}, {team.leagueCompetitionYear})</span>}
                                  {team.currentShooterCount !== undefined && <span className="text-xs text-muted-foreground ml-1">({team.currentShooterCount}/{MAX_SHOOTERS_PER_TEAM})</span>}
                                  {isDisabled && disableReason && <span className="text-xs text-destructive block mt-0.5">{disableReason}</span>}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground p-4 h-32 border rounded-md flex items-center justify-center bg-muted/30">
                        Keine Mannschaften für diesen Verein gefunden oder alle sind voll/ungeeignet für eine direkte Zuweisung hier.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter className="pt-4">
                 <DialogClose asChild><Button type="button" variant="outline" onClick={() => {setIsFormOpen(false); setCurrentShooter(null); setSelectedTeamIdsInForm([]); setTeamsOfSelectedClubInDialog([]);}}>Abbrechen</Button></DialogClose>
                 {isVereinsvertreter && (
                    <Button type="submit" disabled={isFormSubmitting || isLoadingTeamsForDialog}>
                        {(isFormSubmitting || isLoadingTeamsForDialog) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Speichern
                    </Button>
                 )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
