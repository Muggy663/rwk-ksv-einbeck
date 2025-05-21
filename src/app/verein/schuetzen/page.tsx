// src/app/verein/schuetzen/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2, AlertTriangle, UserCircle } from 'lucide-react';
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDescriptionComponent, // Alias to avoid conflict
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription, // Added import
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,     // Added import
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVereinAuth } from '@/app/verein/layout';
import type { Shooter, Club, Team, FirestoreLeagueSpecificDiscipline, League, UserPermission } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, getDisciplineCategory, leagueDisciplineOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, 
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayRemove, arrayUnion
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';

const SHOOTERS_COLLECTION = "rwk_shooters";
const TEAMS_COLLECTION = "rwk_teams";
const CLUBS_COLLECTION = "clubs";
const LEAGUES_COLLECTION = "rwk_leagues";

export default function VereinSchuetzenPage() {
  const { userPermission, loadingPermissions, permissionError: layoutPermissionError } = useVereinAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTeamId = searchParams.get('teamId');

  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [activeClubName, setActiveClubName] = useState<string | null>(null);
  const [assignedClubsForSelect, setAssignedClubsForSelect] = useState<Array<{ id: string; name: string }>>([]);
  
  const [shootersOfActiveClub, setShootersOfActiveClub] = useState<Shooter[]>([]);
  const [allTeamsOfActiveClub, setAllTeamsOfActiveClub] = useState<Team[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);

  const [isLoadingPageData, setIsLoadingPageData] = useState(true); // Covers initial club details & main data for selected club
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [teamsOfSelectedClubInDialog, setTeamsOfSelectedClubInDialog] = useState<Array<Team & {leagueType?: FirestoreLeagueSpecificDiscipline, leagueCompetitionYear?: number, currentShooterCount?: number}>>([]);
  const [isLoadingTeamsForDialog, setIsLoadingTeamsForDialog] = useState(false);
  const [selectedTeamIdsInForm, setSelectedTeamIdsInForm] = useState<string[]>([]);
  const [contextTeamName, setContextTeamName] = useState<string | null>(null);

  // Effect to set activeClubId based on userPermission
  useEffect(() => {
    if (!loadingPermissions && userPermission?.clubIds) {
      if (userPermission.clubIds.length === 1) {
        setActiveClubId(userPermission.clubIds[0]);
      } else if (userPermission.clubIds.length > 1 && !activeClubId) {
        // If multiple clubs and none selected yet, prompt or default (here, we wait for selection)
        setActiveClubId(null); 
      }
      // Load names for club selector dropdown
      const fetchClubNames = async () => {
        try {
          const clubPromises = userPermission.clubIds!.map(id => getFirestoreDoc(doc(db, CLUBS_COLLECTION, id)));
          const clubSnaps = await Promise.all(clubPromises);
          const clubs = clubSnaps
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, name: (snap.data() as Club).name || "Unbek. Verein" }));
          setAssignedClubsForSelect(clubs);
          if (activeClubId) {
            setActiveClubName(clubs.find(c => c.id === activeClubId)?.name || null);
          }
        } catch (error) {
          console.error("VereinSchuetzenPage: Error fetching club names for select:", error);
          toast({ title: "Fehler", description: "Vereinsnamen für Auswahl konnten nicht geladen werden.", variant: "destructive"});
        }
      };
      fetchClubNames();
    }
  }, [userPermission, loadingPermissions, activeClubId, toast]);

  // Effect to load global leagues data (once)
  useEffect(() => {
    const fetchAllLeaguesData = async () => {
      setIsLoadingPageData(true);
      try {
        const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
        setAllLeagues(leaguesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as League)));
      } catch (error) {
        console.error("VereinSchuetzenPage: Error fetching all leagues:", error);
        toast({ title: "Fehler", description: "Globale Ligadaten konnten nicht geladen werden.", variant: "destructive"});
      } finally {
        setIsLoadingPageData(false); // Consider separate loader for this if it's slow
      }
    };
    fetchAllLeaguesData();
  }, [toast]);
  
  // Effect to load shooters and teams for the active club
  const fetchShootersAndTeamsForActiveClub = useCallback(async () => {
    if (!activeClubId) {
      setShootersOfActiveClub([]);
      setAllTeamsOfActiveClub([]);
      return;
    }
    setIsLoadingPageData(true);
    try {
      const shootersQuery = query(collection(db, SHOOTERS_COLLECTION), where("clubId", "==", activeClubId), orderBy("lastName", "asc"), orderBy("firstName", "asc"));
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", activeClubId));

      const [shootersSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(shootersQuery),
        getDocs(teamsQuery),
      ]);
      
      setShootersOfActiveClub(shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), teamIds: d.data().teamIds || [] } as Shooter)));
      setAllTeamsOfActiveClub(teamsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team)));
    } catch (error) {
      console.error("VereinSchuetzenPage: Error fetching shooters/teams for active club:", error);
      toast({ title: "Fehler beim Laden der Vereinsdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingPageData(false);
    }
  }, [activeClubId, toast]);

  useEffect(() => {
    if (activeClubId) {
      fetchShootersAndTeamsForActiveClub();
    }
  }, [activeClubId, fetchShootersAndTeamsForActiveClub]);

  // Effect to load context team name if queryTeamId is present
  useEffect(() => {
    const fetchContextTeam = async () => {
      if (queryTeamId) {
        try {
          const teamSnap = await getFirestoreDoc(doc(db, TEAMS_COLLECTION, queryTeamId));
          if (teamSnap.exists()) {
            setContextTeamName((teamSnap.data() as Team).name);
          }
        } catch (error) {
          console.error("VereinSchuetzenPage: Error fetching context team name:", error);
        }
      } else {
        setContextTeamName(null);
      }
    };
    fetchContextTeam();
  }, [queryTeamId]);

  // Effect to load teams of the active club for the "New Shooter" dialog
  const fetchTeamsForClubInDialog = useCallback(async () => {
    if (!activeClubId) {
      setTeamsOfSelectedClubInDialog([]);
      return;
    }
    setIsLoadingTeamsForDialog(true);
    try {
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", activeClubId), orderBy("name", "asc"));
      const snapshot = await getDocs(teamsQuery);
      
      const fetchedTeams = snapshot.docs.map(teamDoc => {
        const teamData = teamDoc.data() as Team;
        const leagueInfo = allLeagues.find(l => l.id === teamData.leagueId);
        return {
          ...teamData,
          id: teamDoc.id,
          leagueType: leagueInfo?.type,
          leagueCompetitionYear: leagueInfo?.competitionYear,
          currentShooterCount: (teamData.shooterIds || []).length,
        } as Team & {leagueType?: FirestoreLeagueSpecificDiscipline, leagueCompetitionYear?: number, currentShooterCount?: number};
      });
      setTeamsOfSelectedClubInDialog(fetchedTeams);
      
      if (queryTeamId && formMode === 'new') {
        const contextTeamData = fetchedTeams.find(t => t.id === queryTeamId);
        if (contextTeamData && (contextTeamData.currentShooterCount || 0) < MAX_SHOOTERS_PER_TEAM) {
          setSelectedTeamIdsInForm([queryTeamId]);
        }
      }

    } catch (error) {
      console.error("VereinSchuetzenPage: Error fetching teams for dialog:", error);
      toast({ title: "Fehler", description: "Mannschaften für Auswahl konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingTeamsForDialog(false);
    }
  }, [activeClubId, allLeagues, queryTeamId, formMode, toast]);

  useEffect(() => {
    if (isFormOpen && formMode === 'new' && activeClubId) {
      fetchTeamsForClubInDialog();
    } else if (!activeClubId) {
        setTeamsOfSelectedClubInDialog([]);
        setSelectedTeamIdsInForm([]);
    }
  }, [isFormOpen, formMode, activeClubId, fetchTeamsForClubInDialog]);

  const handleAddNewShooter = () => {
    if (!activeClubId) {
      toast({ title: "Kein Verein ausgewählt", description: "Bitte zuerst einen Verein auswählen.", variant: "destructive" });
      return;
    }
    setFormMode('new');
    setCurrentShooter({ clubId: activeClubId, gender: 'male', teamIds: [] });
    setSelectedTeamIdsInForm(queryTeamId ? [queryTeamId] : []);
    setIsFormOpen(true);
  };

  const handleEditShooter = (shooter: Shooter) => {
     if (shooter.clubId !== activeClubId) {
      toast({ title: "Nicht autorisiert", description: "Sie können nur Schützen Ihres aktuell ausgewählten Vereins bearbeiten.", variant: "destructive" });
      return;
    }
    setFormMode('edit');
    setCurrentShooter(shooter);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (shooter: Shooter) => {
     if (shooter.clubId !== activeClubId) {
      toast({ title: "Nicht autorisiert", description: "Sie können nur Schützen Ihres aktuell ausgewählten Vereins löschen.", variant: "destructive" });
      return;
    }
    setShooterToDelete(shooter);
    setIsAlertOpen(true);
  };

  const handleDeleteShooter = async () => {
    if (!shooterToDelete || !shooterToDelete.id || !userPermission || shooterToDelete.clubId !== activeClubId) {
      toast({ title: "Fehler", description: "Aktion nicht möglich oder nicht autorisiert.", variant: "destructive" });
      setIsAlertOpen(false);
      setShooterToDelete(null); 
      return;
    }
    setIsDeleting(true);
    const shooterIdToDelete = shooterToDelete.id;
    const shooterName = shooterToDelete.name;
    try {
      const batch = writeBatch(db);
      const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterIdToDelete);
      batch.delete(shooterDocRef);

      const teamsToUpdate = allTeamsOfActiveClub.filter(team => (team.shooterIds || []).includes(shooterIdToDelete));
      teamsToUpdate.forEach(team => {
        if (team.id) { // Ensure team.id is valid
            batch.update(doc(db, TEAMS_COLLECTION, team.id), { shooterIds: arrayRemove(shooterIdToDelete) });
        }
      });
      
      await batch.commit();
      toast({ title: "Schütze gelöscht", description: `"${shooterName}" wurde erfolgreich entfernt.` });
      fetchShootersAndTeamsForActiveClub(); 
    } catch (error) {
      console.error("VereinSchuetzenPage: Error deleting shooter:", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setIsAlertOpen(false);
      setShooterToDelete(null);
    }
  };

  const handleSubmitShooterForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentShooter || !currentShooter.firstName?.trim() || !currentShooter.lastName?.trim() || !userPermission || !activeClubId) {
      toast({ title: "Ungültige Eingabe", description: "Vorname, Nachname sind erforderlich oder Vereinskontext fehlt.", variant: "destructive" });
      return;
    }
    
    setIsFormSubmitting(true);
    const combinedName = `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`;
    
    const shooterDataForSave: Partial<Shooter> & { clubId: string } = {
      firstName: currentShooter.firstName.trim(),
      lastName: currentShooter.lastName.trim(),
      name: combinedName,
      clubId: activeClubId, 
      gender: currentShooter.gender || 'male',
    };
    
    try {
      const shootersColRef = collection(db, SHOOTERS_COLLECTION);
      let qDuplicate = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", activeClubId));
      if (formMode === 'edit' && currentShooter.id) {
        qDuplicate = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", activeClubId), where(documentId(), "!=", currentShooter.id));
      }
      const duplicateSnap = await getDocs(qDuplicate);
      if (!duplicateSnap.empty) {
        toast({ title: "Doppelter Schütze", description: `Ein Schütze namens "${combinedName}" existiert bereits in diesem Verein.`, variant: "destructive" });
        setIsFormSubmitting(false);
        return;
      }

      const batch = writeBatch(db);

      if (formMode === 'new') {
        const assignedSeasonCategories: { year: number; category: 'Gewehr' | 'Pistole' }[] = [];
        const finalTeamIdsForNewShooter: string[] = [];

        for (const teamId of selectedTeamIdsInForm) {
          const teamInfo = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
          if (!teamInfo || !teamInfo.leagueCompetitionYear || !teamInfo.leagueType) continue;

          if ((teamInfo.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM) {
            toast({ title: "Mannschaft voll", description: `Mannschaft "${teamInfo.name}" ist bereits voll. Schütze nicht hinzugefügt.`, variant: "warning", duration: 6000 });
            continue; 
          }
          const category = getDisciplineCategory(teamInfo.leagueType);
          if (!category) continue;
          
          const currentAssignment = { year: teamInfo.leagueCompetitionYear, category };
          if (assignedSeasonCategories.some(ast => ast.year === currentAssignment.year && ast.category === currentAssignment.category)) {
            toast({ title: "Regelverstoß", description: `Ein Schütze darf pro Jahr/Disziplinkategorie nur einem Team angehören. "${teamInfo.name}" nicht zugewiesen.`, variant: "destructive", duration: 8000 });
            continue; 
          }
          assignedSeasonCategories.push(currentAssignment);
          finalTeamIdsForNewShooter.push(teamId);
        }

        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        batch.set(newShooterRef, { ...shooterDataForSave, teamIds: finalTeamIdsForNewShooter });

        finalTeamIdsForNewShooter.forEach(teamId => {
          batch.update(doc(db, TEAMS_COLLECTION, teamId), { shooterIds: arrayUnion(newShooterRef.id) });
        });
        toast({ title: "Schütze erstellt", description: `"${shooterDataForSave.name}" wurde erfolgreich für ${activeClubName} angelegt.` });

      } else if (formMode === 'edit' && currentShooter.id) {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        const { teamIds, ...updateData } = shooterDataForSave; 
        batch.update(shooterDocRef, updateData);
        toast({ title: "Schütze aktualisiert", description: `"${combinedName}" wurde erfolgreich aktualisiert.` });
      }
      
      await batch.commit();
      setIsFormOpen(false);
      setCurrentShooter(null);
      setSelectedTeamIdsInForm([]);
      fetchShootersAndTeamsForActiveClub();
    } catch (error) {
      console.error("VereinSchuetzenPage: Error saving shooter:", error);
      const action = formMode === 'new' ? 'Erstellen' : 'Aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Shooter, 'firstName' | 'lastName' | 'gender'>, value: string) => {
     setCurrentShooter(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
  const getTeamInfoForShooter = useCallback((shooter: Shooter): string => {
    const teamIds = shooter.teamIds || [];
    if (teamIds.length === 0) return '-';
    
    if (queryTeamId && contextTeamName && teamIds.includes(queryTeamId)) {
      const otherTeamCount = teamIds.filter(id => id !== queryTeamId).length;
      return otherTeamCount > 0 ? `${contextTeamName} (+${otherTeamCount} weitere)` : contextTeamName;
    }
    
    if (teamIds.length === 1 && allTeamsOfActiveClub.length > 0) {
      const team = allTeamsOfActiveClub.find(t => t.id === teamIds[0]);
      return team ? team.name : "1 Mannschaft zugeordnet";
    }
    return `${teamIds.length} Mannschaften zugeordnet`;
  }, [allTeamsOfActiveClub, queryTeamId, contextTeamName]);

  const handleTeamSelectionChangeInForm = (teamId: string, checked: boolean) => {
    const teamBeingChanged = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
    if (!teamBeingChanged || !teamBeingChanged.leagueType || teamBeingChanged.leagueCompetitionYear === undefined) {
        toast({title: "Fehler", description: "Team-Informationen unvollständig.", variant: "destructive"});
        return;
    }

    const categoryOfTeamBeingChanged = getDisciplineCategory(teamBeingChanged.leagueType);
    if (!categoryOfTeamBeingChanged) {
      toast({title: "Fehler", description: "Disziplinkategorie des Teams nicht bestimmbar.", variant: "destructive"});
      return;
    }

    if (checked) {
        if ((teamBeingChanged.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM) {
             toast({title: "Mannschaft voll", description: `Mannschaft "${teamBeingChanged.name}" ist bereits voll.`, variant: "warning"});
             return; 
        }
        const alreadySelectedTeamInSameCategoryYear = selectedTeamIdsInForm.find(id => {
            if (id === teamId) return false;
            const otherTeam = teamsOfSelectedClubInDialog.find(t => t.id === id);
            return otherTeam &&
                   otherTeam.leagueCompetitionYear === teamBeingChanged.leagueCompetitionYear &&
                   getDisciplineCategory(otherTeam.leagueType) === categoryOfTeamBeingChanged;
        });

        if (alreadySelectedTeamInSameCategoryYear) {
            toast({title: "Regelverstoß", description: `Ein Schütze darf pro Jahr/Disziplinkategorie nur einem Team angehören.`, variant: "destructive", duration: 7000});
            return; 
        }
    }

    setSelectedTeamIdsInForm(prev =>
      checked ? [...prev, teamId] : prev.filter(id => id !== teamId)
    );
  };

  if (loadingPermissions) {
     return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Lade Benutzerberechtigungen...</p></div>;
  }
  if (layoutPermissionError) {
    return <div className="p-6"><Card className="border-destructive"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Zugriffsproblem</CardTitle></CardHeader><CardContent><p>{layoutPermissionError}</p></CardContent></Card></div>;
  }
  if (!userPermission?.clubIds || userPermission.clubIds.length === 0) {
    return <div className="p-6"><Card className="border-amber-500"><CardHeader><CardTitle className="text-amber-700 flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Kein Verein zugewiesen</CardTitle></CardHeader><CardContent><p>Ihrem Konto ist kein Verein zugewiesen. Bitte kontaktieren Sie den Administrator.</p></CardContent></Card></div>;
  }

  const vvHasMultipleClubs = userPermission.clubIds.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Meine Schützen</h1>
          {activeClubName && <p className="text-muted-foreground">Aktiver Verein: {activeClubName}</p>}
          {queryTeamId && contextTeamName && <p className="text-xs text-muted-foreground">Kontext: Schützen für Mannschaft "{contextTeamName}"</p>}
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-2 w-full md:w-auto">
          {vvHasMultipleClubs && (
            <div className="w-full sm:w-auto space-y-1.5">
              <Label htmlFor="vv-schuetzen-active-club-select">Verein auswählen</Label>
              <Select
                value={activeClubId || ""}
                onValueChange={(value) => {
                  setActiveClubId(value);
                  const selectedC = assignedClubsForSelect.find(c => c.id === value);
                  setActiveClubName(selectedC?.name || null);
                  // Reset dependent data
                  setShootersOfActiveClub([]);
                  setAllTeamsOfActiveClub([]);
                }}
                disabled={isLoadingPageData}
              >
                <SelectTrigger id="vv-schuetzen-active-club-select" className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Verein wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {assignedClubsForSelect.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleAddNewShooter} disabled={isLoadingPageData || !activeClubId} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Neuen Schützen anlegen
          </Button>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Schützenliste für {activeClubName || "ausgewählten Verein"}</CardTitle>
          <CardDescription>Verwalten Sie hier die Schützen Ihres Vereins.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPageData && activeClubId ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Schützen...</p></div>
          ) : !activeClubId ? (
             <div className="p-6 text-center text-muted-foreground"><p>Bitte wählen Sie zuerst einen Verein aus.</p></div>
          ) : shootersOfActiveClub.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p>{`Keine Schützen für "${activeClubName || 'diesen Verein'}" gefunden oder angelegt.`}</p>
              <p className="text-sm mt-1">Klicken Sie auf "Neuen Schützen anlegen", um zu beginnen.</p>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Nachname</TableHead><TableHead>Vorname</TableHead><TableHead>Geschlecht</TableHead><TableHead>Mannschaften (Info)</TableHead><TableHead className="text-right">Aktionen</TableHead></TableRow></TableHeader>
              <TableBody>
                {shootersOfActiveClub.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.lastName}</TableCell>
                    <TableCell>{shooter.firstName}</TableCell>
                    <TableCell>{shooter.gender === 'female' ? 'Weiblich' : (shooter.gender === 'male' ? 'Männlich' : 'N/A')}</TableCell>
                    <TableCell className="text-xs">{getTeamInfoForShooter(shooter)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditShooter(shooter)} aria-label="Schütze bearbeiten"><Edit className="h-4 w-4" /></Button>
                       <AlertDialog open={isAlertOpen && shooterToDelete?.id === shooter.id} onOpenChange={(open) => {if(!open) setShooterToDelete(null); setIsAlertOpen(open);}}>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteConfirmation(shooter)} aria-label="Schütze löschen"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Schütze löschen?</AlertDialogTitle><AlertDialogDescription>Möchten Sie "{shooterToDelete?.name}" wirklich löschen? Dies entfernt den Schützen auch aus allen zugeordneten Mannschaften.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => {setIsAlertOpen(false); setShooterToDelete(null);}}>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteShooter} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) {setCurrentShooter(null); setSelectedTeamIdsInForm([]); setTeamsOfSelectedClubInDialog([]);} setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitShooterForm}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
              <DialogDescriptionComponent>Für Verein: {activeClubName || 'Ihr Verein'}</DialogDescriptionComponent>
            </DialogHeader>
            {currentShooter && (
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                    <Label htmlFor="vv-shooter-firstName">Vorname</Label>
                    <Input id="vv-shooter-firstName" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="vv-shooter-lastName">Nachname</Label>
                    <Input id="vv-shooter-lastName" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vv-shooter-gender">Geschlecht</Label>
                  <Select value={currentShooter.gender || 'male'} onValueChange={(v) => handleFormInputChange('gender', v as 'male' | 'female')}>
                    <SelectTrigger id="vv-shooter-gender"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Männlich</SelectItem><SelectItem value="female">Weiblich</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vv-shooter-clubDisplay">Verein (Zugewiesen)</Label>
                  <Input id="vv-shooter-clubDisplay" value={activeClubName || ''} disabled className="bg-muted/50" />
                </div>

                {formMode === 'new' && activeClubId && (
                  <div className="space-y-2 pt-2 border-t mt-4">
                    <Label>Mannschaften für "{activeClubName}" zuordnen (optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      Max. {MAX_SHOOTERS_PER_TEAM} Schützen pro Team. Ein Schütze kann pro Saison/Disziplinkategorie (Gewehr/Pistole) nur einem Team angehören.
                    </p>
                    {isLoadingTeamsForDialog ? (
                      <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Mannschaften...</div>
                    ) : teamsOfSelectedClubInDialog.length > 0 ? (
                      <ScrollArea className="h-32 rounded-md border p-2 bg-muted/20">
                        <div className="space-y-1">
                          {teamsOfSelectedClubInDialog.map(team => {
                            if (!team || !team.id) return null;
                            const isSelected = selectedTeamIdsInForm.includes(team.id);
                            let isDisabled = false;
                            let disableReason = "";

                            if ((team.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM && !isSelected) {
                              isDisabled = true;
                              disableReason = "(Voll)";
                            } else if (team.leagueType && team.leagueCompetitionYear !== undefined) {
                              const categoryOfTeamToAssign = getDisciplineCategory(team.leagueType);
                              if (categoryOfTeamToAssign) {
                                const alreadySelectedInSameCategoryYear = selectedTeamIdsInForm.some(selectedId => {
                                  if (selectedId === team.id) return false;
                                  const otherTeam = teamsOfSelectedClubInDialog.find(t => t.id === selectedId);
                                  return otherTeam &&
                                         otherTeam.leagueCompetitionYear === team.leagueCompetitionYear &&
                                         getDisciplineCategory(otherTeam.leagueType) === categoryOfTeamToAssign;
                                });
                                if (alreadySelectedInSameCategoryYear && !isSelected) {
                                  isDisabled = true;
                                  disableReason = `(bereits ${categoryOfTeamToAssign}-Team ${team.leagueCompetitionYear})`;
                                }
                              }
                            }
                            
                            return (
                              <div key={team.id} className="flex items-center space-x-2 py-1.5 hover:bg-muted/50 rounded-md">
                                <Checkbox
                                  id={`vv-team-select-${team.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checkedState) => handleTeamSelectionChangeInForm(team.id, !!checkedState)}
                                  disabled={isDisabled || isLoadingTeamsForDialog}
                                />
                                <Label htmlFor={`vv-team-select-${team.id}`} className={`font-normal ${isDisabled ? 'text-muted-foreground line-through' : 'cursor-pointer'}`}>
                                  {team.name}
                                  {team.leagueType && <span className="text-xs text-muted-foreground ml-1">({leagueDisciplineOptions.find(opt => opt.value === team.leagueType)?.label || team.leagueType}, {team.leagueCompetitionYear})</span>}
                                  {team.currentShooterCount !== undefined && <span className="text-xs text-muted-foreground ml-1">({team.currentShooterCount}/{MAX_SHOOTERS_PER_TEAM})</span>}
                                  {isDisabled && <span className="text-xs text-destructive ml-1">{disableReason}</span>}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground p-2">Keine Mannschaften für diesen Verein für eine Zuweisung gefunden oder alle sind voll/unpassend.</p>
                    )}
                  </div>
                )}

                {formMode === 'edit' && (
                  <div className="text-xs text-muted-foreground pt-2 border-t mt-4">
                    <p className="font-medium mb-1">Aktuelle Mannschafts-Zugehörigkeiten:</p>
                    <p>{getTeamInfoForShooter(currentShooter as Shooter)}</p>
                    <p className="mt-1">Die Zuordnung zu Mannschaften erfolgt primär über die Seite "Meine Mannschaften".</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {setIsFormOpen(false); setCurrentShooter(null); setSelectedTeamIdsInForm([]); setTeamsOfSelectedClubInDialog([]);}}>Abbrechen</Button>
              <Button type="submit" disabled={isFormSubmitting || (formMode === 'new' && isLoadingTeamsForDialog)}>
                {(isFormSubmitting || (formMode === 'new' && isLoadingTeamsForDialog)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    