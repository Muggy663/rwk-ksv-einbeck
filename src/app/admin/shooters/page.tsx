
// src/app/admin/shooters/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
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
  DialogDescription,
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
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams, useRouter } from 'next/navigation';
import type { Shooter, Club, Team, League, TeamValidationInfo, FirestoreLeagueSpecificDiscipline } from '@/types/rwk';
import { GEWEHR_DISCIPLINES, PISTOL_DISCIPLINES, leagueDisciplineOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, documentId, getDoc as getFirestoreDoc, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const SHOOTERS_COLLECTION = "rwk_shooters";
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";
const LEAGUES_COLLECTION = "rwk_leagues";
const ALL_CLUBS_FILTER_VALUE = "__ALL_CLUBS__";
const MAX_SHOOTERS_PER_TEAM = 3;

// Helper function to categorize disciplines
const getDisciplineCategory = (leagueType?: FirestoreLeagueSpecificDiscipline): 'Gewehr' | 'Pistole' | null => {
  if (!leagueType) return null;
  if (GEWEHR_DISCIPLINES.includes(leagueType)) return 'Gewehr';
  if (PISTOL_DISCIPLINES.includes(leagueType)) return 'Pistole';
  return null;
};

export default function AdminShootersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTeamId = searchParams.get('teamId');
  const queryClubIdFromParams = searchParams.get('clubId');

  const { toast } = useToast();

  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [allLeaguesForValidation, setAllLeaguesForValidation] = useState<League[]>([]);
  const [allTeamsData, setAllTeamsData] = useState<Team[]>([]); // Stores all teams for shooter info display
  const [shooters, setShooters] = useState<Shooter[]>([]);
  const [filteredShooters, setFilteredShooters] = useState<Shooter[]>([]);

  const [contextTeamName, setContextTeamName] = useState<string | null>(null);
  const [isContextTeamNameLoading, setIsContextTeamNameLoading] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false); // For dialog submit button
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  const [selectedClubIdFilter, setSelectedClubIdFilter] = useState<string>(ALL_CLUBS_FILTER_VALUE);

  const [teamsOfSelectedClubInDialog, setTeamsOfSelectedClubInDialog] = useState<TeamValidationInfo[]>([]);
  const [isLoadingTeamsForDialog, setIsLoadingTeamsForDialog] = useState(false);
  const [selectedTeamIdsInForm, setSelectedTeamIdsInForm] = useState<string[]>([]);

  const fetchContextTeamName = useCallback(async () => {
    if (queryTeamId) {
      setIsContextTeamNameLoading(true);
      setContextTeamName(null); // Reset while loading
      try {
        console.log(`AdminShootersPage: Fetching context team name for ID: ${queryTeamId}`);
        const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
        const teamSnap = await getFirestoreDoc(teamDocRef);
        if (teamSnap.exists()) {
          const teamData = teamSnap.data() as Team;
          setContextTeamName(teamData.name);
          console.log(`AdminShootersPage: Context team name "${teamData.name}" loaded.`);
        } else {
          console.warn(`AdminShootersPage: Context team with ID ${queryTeamId} not found.`);
          toast({ title: "Kontext-Team nicht gefunden", description: `Team mit ID ${queryTeamId} konnte nicht geladen werden.`, variant: "warning" });
        }
      } catch (error) {
        console.error("AdminShootersPage: Error fetching context team name: ", error);
      } finally {
        setIsContextTeamNameLoading(false);
      }
    } else {
      setContextTeamName(null);
      setIsContextTeamNameLoading(false); // Ensure it's false if no queryTeamId
    }
  }, [queryTeamId, toast]);

  const fetchInitialData = useCallback(async () => {
    // Only set isLoading to true if it's not already true to prevent re-triggering if called multiple times rapidly
    // setIsLoading(true); // Moved to useEffect to ensure it's called once per relevant change
    console.log("AdminShootersPage: Fetching initial data (clubs, shooters, leagues, all teams)...");
    try {
      const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
      const fetchedClubs: Club[] = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
      setAllClubs(fetchedClubs);
      console.log("AdminShootersPage: Clubs fetched:", fetchedClubs.length);

      const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      setAllLeaguesForValidation(leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League)));
      console.log("AdminShootersPage: All leagues for validation fetched:", leaguesSnapshot.docs.length);
      
      const allTeamsSnapshot = await getDocs(query(collection(db, TEAMS_COLLECTION), orderBy("name", "asc")));
      const fetchedAllTeams: Team[] = allTeamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setAllTeamsData(fetchedAllTeams); // Store all teams for getTeamInfoForShooter
      console.log("AdminShootersPage: All teams data fetched:", fetchedAllTeams.length);

      let initialClubFilter = ALL_CLUBS_FILTER_VALUE;
      if (queryClubIdFromParams && fetchedClubs.some(c => c.id === queryClubIdFromParams)) {
        initialClubFilter = queryClubIdFromParams;
      } else if (queryTeamId && !queryClubIdFromParams) {
        const teamContextDoc = fetchedAllTeams.find(t => t.id === queryTeamId);
        if (teamContextDoc?.clubId && fetchedClubs.some(c => c.id === teamContextDoc.clubId)) {
           initialClubFilter = teamContextDoc.clubId;
        }
      }
      setSelectedClubIdFilter(initialClubFilter);
      console.log("AdminShootersPage: Initial club filter set to:", initialClubFilter);

      const shootersSnapshot = await getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("lastName", "asc"), orderBy("firstName", "asc")));
      const fetchedShooters: Shooter[] = shootersSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data(), teamIds: docData.data().teamIds || [] } as Shooter));
      setShooters(fetchedShooters);
      console.log("AdminShootersPage: Shooters fetched:", fetchedShooters.length);

    } catch (error) {
      console.error("AdminShootersPage: Error fetching initial data: ", error);
      toast({ title: "Fehler beim Laden der Daten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      console.log("AdminShootersPage: Finished fetching initial data. isLoading is now false.");
    }
  }, [toast, queryClubIdFromParams, queryTeamId]); // fetchInitialData depends on these query params and toast


  useEffect(() => {
    setIsLoading(true); // Set loading true when these query params change
    fetchContextTeamName();
    fetchInitialData();
  }, [fetchContextTeamName, fetchInitialData, queryClubIdFromParams, queryTeamId]); // Rerun if query params change

  useEffect(() => {
    if (selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE) {
      setFilteredShooters(shooters);
    } else {
      const newFiltered = shooters.filter(s => s.clubId === selectedClubIdFilter);
      setFilteredShooters(newFiltered);
    }
  }, [selectedClubIdFilter, shooters]);

  const fetchTeamsForNewShooterDialog = useCallback(async (clubId: string) => {
    if (!clubId) {
      setTeamsOfSelectedClubInDialog([]);
      return;
    }
    setIsLoadingTeamsForDialog(true);
    setTeamsOfSelectedClubInDialog([]);
    console.log(`AdminShootersPage: DIALOG - Fetching teams for club ID: ${clubId}`);
    try {
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", clubId), orderBy("name", "asc"));
      const snapshot = await getDocs(teamsQuery);
      
      const fetchedTeamsPromises = snapshot.docs.map(async (teamDoc) => {
        const teamData = teamDoc.data() as Team;
        const leagueInfo = allLeaguesForValidation.find(l => l.id === teamData.leagueId);
        return {
          id: teamDoc.id,
          name: teamData.name,
          clubId: teamData.clubId,
          leagueId: teamData.leagueId,
          competitionYear: teamData.competitionYear,
          shooterIds: teamData.shooterIds || [],
          currentShooterCount: (teamData.shooterIds || []).length,
          leagueType: leagueInfo?.type,
          leagueCompetitionYear: leagueInfo?.competitionYear,
        } as TeamValidationInfo;
      });
      const fetchedTeams = await Promise.all(fetchedTeamsPromises);
      setTeamsOfSelectedClubInDialog(fetchedTeams);
      console.log(`AdminShootersPage: DIALOG - Fetched ${fetchedTeams.length} teams for club ${clubId}.`);

      if (queryTeamId && fetchedTeams.some(t => t.id === queryTeamId)) {
        const contextTeamForDialog = fetchedTeams.find(t => t.id === queryTeamId);
        if (contextTeamForDialog && (contextTeamForDialog.currentShooterCount || 0) < MAX_SHOOTERS_PER_TEAM) {
             setSelectedTeamIdsInForm([queryTeamId]);
        } else if (contextTeamForDialog) {
             toast({title: "Mannschaft voll", description: `Die Kontext-Mannschaft "${contextTeamForDialog.name}" hat bereits ${MAX_SHOOTERS_PER_TEAM} Schützen.`, variant: "warning", duration: 5000});
             setSelectedTeamIdsInForm([]);
        }
      } else {
         setSelectedTeamIdsInForm([]);
      }

    } catch (error) {
      console.error("AdminShootersPage: DIALOG - Error fetching teams for club:", error);
      toast({ title: "Fehler", description: "Mannschaften für Vereinsauswahl konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingTeamsForDialog(false);
    }
  }, [allLeaguesForValidation, queryTeamId, toast]);

  useEffect(() => {
    if (isFormOpen && formMode === 'new' && currentShooter?.clubId) {
      fetchTeamsForNewShooterDialog(currentShooter.clubId);
    } else if (!currentShooter?.clubId) {
      setTeamsOfSelectedClubInDialog([]); // Clear if no club selected
      setSelectedTeamIdsInForm([]);
    }
  }, [isFormOpen, formMode, currentShooter?.clubId, fetchTeamsForNewShooterDialog]);

  const handleAddNew = () => {
    if (allClubs.length === 0) {
      toast({ title: "Keine Vereine", description: "Bitte zuerst Vereine anlegen.", variant: "destructive"});
      return;
    }
    setFormMode('new');
    let resolvedInitialClubId = '';
    if (selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE && allClubs.some(c => c.id === selectedClubIdFilter)) {
        resolvedInitialClubId = selectedClubIdFilter;
    } else if (queryClubIdFromParams && allClubs.some(c => c.id === queryClubIdFromParams)) {
        const clubFromParam = allClubs.find(c => c.id === queryClubIdFromParams);
        if(clubFromParam) resolvedInitialClubId = clubFromParam.id;
    }
    
    setCurrentShooter({
      firstName: '',
      lastName: '',
      clubId: resolvedInitialClubId,
      gender: 'male',
      teamIds: [], 
    });
    setTeamsOfSelectedClubInDialog([]);
    // Pre-select team if in context of a team and club matches
    if (queryTeamId && resolvedInitialClubId && teamsOfSelectedClubInDialog.find(t => t.id === queryTeamId && t.clubId === resolvedInitialClubId)) {
        setSelectedTeamIdsInForm([queryTeamId]);
    } else {
        setSelectedTeamIdsInForm([]);
    }
    setIsFormOpen(true);
  };

  const handleEdit = (shooter: Shooter) => {
    setFormMode('edit');
    setCurrentShooter(shooter);
    setSelectedTeamIdsInForm([]); 
    setTeamsOfSelectedClubInDialog([]);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (shooter: Shooter) => {
    setShooterToDelete(shooter);
    setIsAlertOpen(true);
  };

  const handleDeleteShooter = async () => {
    if (!shooterToDelete || !shooterToDelete.id) {
      toast({ title: "Fehler", description: "Kein Schütze zum Löschen ausgewählt.", variant: "destructive" });
      setIsAlertOpen(false);
      return;
    }
    const shooterIdToDelete = shooterToDelete.id;
    setIsFormLoading(true); 
    try {
      const batch = writeBatch(db);
      const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterIdToDelete);
      
      const shooterData = shooters.find(s => s.id === shooterIdToDelete) || (await getFirestoreDoc(shooterDocRef)).data() as Shooter | undefined;
      const teamsToUpdateFromShooterDoc = shooterData?.teamIds || [];

      if (teamsToUpdateFromShooterDoc.length > 0) {
        teamsToUpdateFromShooterDoc.forEach(teamId => {
          const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
          batch.update(teamDocRef, { shooterIds: arrayRemove(shooterIdToDelete) });
        });
      }
      batch.delete(shooterDocRef);
      await batch.commit();
      toast({ title: "Schütze gelöscht", description: `${shooterToDelete.firstName} ${shooterToDelete.lastName} wurde erfolgreich entfernt.` });
      // Re-fetch data by triggering the useEffect dependency
      // This is a common pattern, but ensure fetchInitialData is efficient
      // Or, update state locally: setShooters(prev => prev.filter(s => s.id !== shooterIdToDelete));
      fetchInitialData(); 
    } catch (error) {
      console.error("AdminShootersPage: handleDeleteShooter - Error: ", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormLoading(false);
      setIsAlertOpen(false);
      setShooterToDelete(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentShooter || !currentShooter.firstName?.trim() || !currentShooter.lastName?.trim() || !currentShooter.clubId) {
      toast({ title: "Ungültige Eingabe", description: "Vorname, Nachname und Verein sind erforderlich.", variant: "destructive" });
      return;
    }

    const combinedName = `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`;
    setIsFormLoading(true);

    try {
      const shootersCollectionRef = collection(db, SHOOTERS_COLLECTION);
      let duplicateQuery = query(shootersCollectionRef,
        where("name", "==", combinedName),
        where("clubId", "==", currentShooter.clubId)
      );
      if (formMode === 'edit' && currentShooter.id) {
        duplicateQuery = query(shootersCollectionRef,
          where("name", "==", combinedName),
          where("clubId", "==", currentShooter.clubId),
          where(documentId(), "!=", currentShooter.id)
        );
      }
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        toast({ title: "Doppelter Schütze", description: `Ein Schütze mit dem Namen "${combinedName}" existiert bereits in diesem Verein.`, variant: "destructive"});
        setIsFormLoading(false);
        return;
      }

      const batch = writeBatch(db);

      if (formMode === 'new') {
        const assignedSeasonCategories: { year: number; category: 'Gewehr' | 'Pistole' }[] = [];
        const validTeamAssignmentsForNewShooter: string[] = [];

        for (const teamId of selectedTeamIdsInForm) {
          const teamInfo = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
          if (!teamInfo || !teamInfo.leagueCompetitionYear || !teamInfo.leagueType) {
            console.warn(`AdminShootersPage: handleSubmit (NEW) - Missing info for team ${teamId}, skipping.`);
            continue;
          }
          // Rule: Max 3 shooters per team
          if ((teamInfo.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM) {
            toast({ title: "Mannschaft voll", description: `Mannschaft "${teamInfo.name}" ist bereits voll. Schütze nicht hinzugefügt.`, variant: "warning", duration: 6000 });
            continue; 
          }

          const category = getDisciplineCategory(teamInfo.leagueType);
          if (!category) {
            console.warn(`AdminShootersPage: handleSubmit (NEW) - Could not determine category for league type ${teamInfo.leagueType}`);
            continue;
          }
          
          const currentAssignment = { year: teamInfo.leagueCompetitionYear, category: category };
          if (assignedSeasonCategories.some(ast => ast.year === currentAssignment.year && ast.category === currentAssignment.category)) {
            toast({ title: "Ungültige Mannschaftszuordnung", description: `Ein Schütze darf pro Jahr nur einer Mannschaft der Kategorie '${category}' zugeordnet werden. "${teamInfo.name}" wurde nicht zugewiesen.`, variant: "destructive", duration: 8000 });
            continue; // Skip this assignment
          }
          assignedSeasonCategories.push(currentAssignment);
          validTeamAssignmentsForNewShooter.push(teamId); // Add to valid assignments
        }
        
        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        const shooterDataToSave: Omit<Shooter, 'id'> = {
          firstName: currentShooter.firstName.trim(),
          lastName: currentShooter.lastName.trim(),
          name: combinedName,
          clubId: currentShooter.clubId as string,
          gender: currentShooter.gender || 'male',
          teamIds: validTeamAssignmentsForNewShooter,
        };
        batch.set(newShooterRef, shooterDataToSave);

        // Update teams with the new shooter
        validTeamAssignmentsForNewShooter.forEach(teamId => {
          const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
          batch.update(teamDocRef, { shooterIds: arrayUnion(newShooterRef.id) });
        });
        toast({ title: "Schütze erstellt", description: `${shooterDataToSave.name} wurde erfolgreich angelegt.` });

      } else if (formMode === 'edit' && currentShooter.id) {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        const originalShooterDoc = shooters.find(s => s.id === currentShooter.id);
        const dataForUpdate: Partial<Shooter> = {
          firstName: currentShooter.firstName.trim(),
          lastName: currentShooter.lastName.trim(),
          name: combinedName,
          clubId: currentShooter.clubId as string,
          gender: currentShooter.gender || 'male',
        };

        // If clubId changed, teamIds must be cleared and shooter removed from old teams.
        if (originalShooterDoc && originalShooterDoc.clubId !== currentShooter.clubId) {
          dataForUpdate.teamIds = []; 
          (originalShooterDoc.teamIds || []).forEach(oldTeamId => {
            const teamDocRef = doc(db, TEAMS_COLLECTION, oldTeamId);
            batch.update(teamDocRef, { shooterIds: arrayRemove(currentShooter.id as string) });
          });
          toast({ title: "Vereinswechsel", description: `Mannschaftszugehörigkeiten für ${combinedName} wurden aufgrund des Vereinswechsels zurückgesetzt.`, variant: "info", duration: 7000 });
        }
        batch.update(shooterDocRef, dataForUpdate);
        toast({ title: "Schütze aktualisiert", description: `${combinedName} wurde erfolgreich aktualisiert.` });
      }

      await batch.commit();
      setIsFormOpen(false);
      setCurrentShooter(null);
      setSelectedTeamIdsInForm([]);
      setTeamsOfSelectedClubInDialog([]);
      fetchInitialData(); 
    } catch (error) {
      console.error("AdminShootersPage: handleSubmit - Error: ", error);
      const action = formMode === 'new' ? 'Erstellen' : 'Aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Shooter, 'firstName' | 'lastName' | 'clubId' | 'gender'>, value: string) => {
     setCurrentShooter(prev => {
        if (!prev) return null;
        const updatedShooter = { ...prev, [field]: value };
        if (field === 'clubId' && prev.clubId !== value) {
            setSelectedTeamIdsInForm([]);
            setTeamsOfSelectedClubInDialog([]); 
            if (value) { 
              fetchTeamsForNewShooterDialog(value);
            }
        }
        return updatedShooter;
     });
  };

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
        const alreadySelectedTeamInSameCategoryYear = selectedTeamIdsInForm.find(id => {
            if (id === teamId) return false;
            const otherTeam = teamsOfSelectedClubInDialog.find(t => t.id === id);
            return otherTeam &&
                   otherTeam.leagueCompetitionYear === teamBeingChanged.leagueCompetitionYear &&
                   getDisciplineCategory(otherTeam.leagueType) === categoryOfTeamBeingChanged;
        });

        if (alreadySelectedTeamInSameCategoryYear) {
            toast({title: "Regelverstoß", description: `Schütze ist bereits einem Team der Kategorie '${categoryOfTeamBeingChanged}' im Jahr ${teamBeingChanged.leagueCompetitionYear} zugeordnet.`, variant: "destructive", duration: 7000});
            return; 
        }
    }

    setSelectedTeamIdsInForm(prev =>
      checked ? [...prev, teamId] : prev.filter(id => id !== teamId)
    );
  };


  const getClubName = (clubId: string): string => {
    return allClubs.find(c => c.id === clubId)?.name || 'Unbekannt';
  };

  const getTeamInfoForShooter = (shooter: Shooter): string => {
    const teamIds = shooter.teamIds || [];
    if (teamIds.length === 0) return '-';

    if (queryTeamId && contextTeamName && teamIds.includes(queryTeamId)) {
      const otherTeamCount = teamIds.filter(id => id !== queryTeamId).length;
      return otherTeamCount > 0 ? `${contextTeamName} (+${otherTeamCount} weitere)` : contextTeamName;
    }
    
    if (teamIds.length === 1 && allTeamsData.length > 0) { // Check if allTeamsData is loaded
      const team = allTeamsData.find(t => t.id === teamIds[0]);
      return team ? team.name : "1 Mannschaft zugeordnet";
    }
    return `${teamIds.length} Mannschaften zugeordnet`;
  };

  const selectedClubObject = allClubs.find(c => c.id === selectedClubIdFilter);
  const selectedClubNameForTitle = selectedClubObject ? selectedClubObject.name : 'aller Vereine';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary">Schützenverwaltung</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
           <Select
            value={selectedClubIdFilter}
            onValueChange={(value) => {
              setSelectedClubIdFilter(value);
              if (value !== queryClubIdFromParams) { // Avoid re-pushing the same URL
                 router.push('/admin/shooters' + (value === ALL_CLUBS_FILTER_VALUE ? '' : `?clubId=${value}`), {scroll: false});
              }
            }}
            disabled={allClubs.length === 0 && isLoading}
           >
            <SelectTrigger className="w-full sm:w-[220px]" aria-label="Verein filtern">
              <SelectValue placeholder={isLoading && allClubs.length === 0 ? "Lade Vereine..." : (allClubs.length > 0 ? "Verein filtern" : "Keine Vereine")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLUBS_FILTER_VALUE}>Alle Vereine</SelectItem>
              {allClubs.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew} disabled={allClubs.length === 0 && !isLoading} className="w-full sm:w-auto whitespace-nowrap">
            <PlusCircle className="mr-2 h-5 w-5" /> Neuen Schützen anlegen
          </Button>
        </div>
      </div>
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>
            Schützen für {selectedClubNameForTitle}
          </CardTitle>
          <CardDescription>
            Verwalten Sie hier alle Schützen.
            {isContextTeamNameLoading && ` (Lade Kontext-Mannschaft Namen...)`}
            {!isContextTeamNameLoading && queryTeamId && contextTeamName && ` (Aktueller Kontext: Mannschaft "${contextTeamName}")`}
            {!isContextTeamNameLoading && queryTeamId && !contextTeamName && ` (Kontext-Mannschaft ID ${queryTeamId} nicht gefunden)`}
            {allClubs.length === 0 && !isLoading && <span className="text-destructive block mt-1"> Hinweis: Keine Vereine angelegt.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3">Lade Schützen...</p>
            </div>
           ) : filteredShooters.length > 0 ? (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vorname</TableHead>
                  <TableHead>Nachname</TableHead>
                  <TableHead>Verein</TableHead>
                  <TableHead>Geschlecht</TableHead>
                  <TableHead>Mannschaften (Info)</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShooters.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.firstName}</TableCell>
                    <TableCell>{shooter.lastName}</TableCell>
                    <TableCell>{getClubName(shooter.clubId)}</TableCell>
                    <TableCell>{shooter.gender === 'male' ? 'Männlich' : (shooter.gender === 'female' ? 'Weiblich' : 'N/A')}</TableCell>
                    <TableCell className="text-xs">{getTeamInfoForShooter(shooter)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(shooter)} aria-label="Schütze bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteConfirmation(shooter)} className="text-destructive hover:text-destructive/80" aria-label="Schütze löschen">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">{selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE ? 'Keine Schützen für diesen Verein gefunden.' : 'Keine Schützen angelegt.'}</p>
               {allClubs.length > 0 && <p className="text-sm">Klicken Sie auf "Neuen Schützen anlegen", um zu beginnen.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) { setCurrentShooter(null); setTeamsOfSelectedClubInDialog([]); setSelectedTeamIdsInForm([]); } }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
                <DialogDescription>
                    {formMode === 'new'
                        ? 'Tragen Sie die Daten des Schützen ein und wählen Sie optional Mannschaften aus.'
                        : 'Bearbeiten Sie die Daten des Schützen.'
                    }
                    {formMode === 'new' && queryTeamId && contextTeamName &&
                        ` Kontext: Schütze wird initial der Mannschaft "${contextTeamName}" zugeordnet, falls Kapazität vorhanden und unten ausgewählt.`
                    }
                </DialogDescription>
            </DialogHeader>
            {currentShooter && (
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstNameForm">Vorname</Label>
                  <Input id="firstNameForm" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastNameForm">Nachname</Label>
                  <Input id="lastNameForm" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clubIdFormShooter">Verein</Label>
                  <Select
                    value={currentShooter.clubId || ''}
                    onValueChange={(value) => handleFormInputChange('clubId', value)}
                    required
                    disabled={allClubs.length === 0}
                  >
                    <SelectTrigger id="clubIdFormShooter" aria-label="Verein auswählen">
                      <SelectValue placeholder={allClubs.length === 0 ? "Keine Vereine" : "Verein wählen"}/>
                    </SelectTrigger>
                    <SelectContent>
                      {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                   {formMode === 'edit' && <p className="text-xs text-muted-foreground mt-1">Hinweis: Bei Vereinswechsel werden bestehende Mannschaftszuordnungen zurückgesetzt. Die Zuordnung zu Mannschaften erfolgt primär über die Mannschaftsverwaltung.</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="genderForm">Geschlecht</Label>
                  <Select
                    value={currentShooter.gender || 'male'}
                    onValueChange={(value) => handleFormInputChange('gender', value as 'male' | 'female')}
                  >
                    <SelectTrigger id="genderForm" aria-label="Geschlecht auswählen">
                      <SelectValue placeholder="Geschlecht wählen"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Männlich</SelectItem>
                      <SelectItem value="female">Weiblich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formMode === 'new' && currentShooter.clubId && (
                  <div className="space-y-2 mt-3 p-3 border rounded-md bg-muted/30">
                    <Label>Mannschaften für "{allClubs.find(c => c.id === currentShooter.clubId)?.name || 'ausgewählten Verein'}" zuordnen</Label>
                    <p className="text-xs text-muted-foreground">Max. {MAX_SHOOTERS_PER_TEAM} Schützen pro Team. Ein Schütze kann pro Jahr nur einem Gewehr- und einem Pistolen-Team angehören.</p>
                    {isLoadingTeamsForDialog ? (
                      <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Mannschaften...</div>
                    ) : teamsOfSelectedClubInDialog.length > 0 ? (
                      <ScrollArea className="h-32">
                        {teamsOfSelectedClubInDialog.map(team => {
                          const isChecked = selectedTeamIdsInForm.includes(team.id);
                          let isDisabled = false;
                          let disableReason = "";
                          
                          const teamIsFull = (team.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM;
                          if (teamIsFull && !isChecked) {
                            isDisabled = true;
                            disableReason = "(Voll)";
                          } else {
                            const teamCategory = getDisciplineCategory(team.leagueType);
                            if (teamCategory) {
                              // Check if another selected team in the same category and year already exists
                              const alreadySelectedInSameCategoryYear = selectedTeamIdsInForm.some(selectedId => {
                                if (selectedId === team.id) return false; 
                                const otherTeam = teamsOfSelectedClubInDialog.find(t => t.id === selectedId);
                                return otherTeam &&
                                       otherTeam.leagueCompetitionYear === team.leagueCompetitionYear &&
                                       getDisciplineCategory(otherTeam.leagueType) === teamCategory;
                              });
                              if (alreadySelectedInSameCategoryYear && !isChecked) {
                                isDisabled = true;
                                disableReason = `(Bereits ${teamCategory}-Team für ${team.leagueCompetitionYear})`;
                              }
                            }
                          }

                          const leagueTypeInfo = leagueDisciplineOptions.find(opt => opt.value === team.leagueType);
                          const leagueTypeLabel = leagueTypeInfo?.label || team.leagueType || 'Unbek. Typ';
                          return (
                            <div key={team.id} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`team-assign-${team.id}`}
                                checked={isChecked}
                                onCheckedChange={(checkedState) => handleTeamSelectionChangeInForm(team.id, !!checkedState)}
                                disabled={isDisabled || isLoadingTeamsForDialog}
                              />
                              <Label htmlFor={`team-assign-${team.id}`} className={`font-normal ${isDisabled ? 'text-muted-foreground line-through cursor-not-allowed' : 'cursor-pointer'}`}>
                                {team.name}
                                <span className='text-xs text-muted-foreground'> ({team.currentShooterCount || 0}/{MAX_SHOOTERS_PER_TEAM})</span>
                                {team.leagueType && team.leagueCompetitionYear && <span className='text-xs text-muted-foreground ml-1'>({leagueTypeLabel} {team.leagueCompetitionYear})</span>}
                                {isDisabled && <span className="text-xs text-destructive ml-1">{disableReason}</span>}
                              </Label>
                            </div>
                          );
                        })}
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {currentShooter.clubId && !isLoadingTeamsForDialog
                          ? "Keine Mannschaften für diesen Verein gefunden."
                          : "Verein wählen, um Mannschaften anzuzeigen."}
                      </p>
                    )}
                  </div>
                )}
                 {formMode === 'edit' && (
                  <div className="text-xs text-muted-foreground p-3 rounded-md bg-secondary/30 mt-3">
                    <p className="font-medium mb-1">Aktuelle Mannschafts-Zuordnungen:</p>
                    <p>{getTeamInfoForShooter(currentShooter as Shooter)}</p>
                    <p className="mt-1">Die Zuordnung zu Mannschaften erfolgt primär über die Mannschaftsverwaltung.</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentShooter(null); setTeamsOfSelectedClubInDialog([]); setSelectedTeamIdsInForm([]);}}>Abbrechen</Button>
              <Button type="submit" disabled={isFormLoading || (formMode === 'new' && isLoadingTeamsForDialog)}>
                {(isFormLoading || (formMode === 'new' && isLoadingTeamsForDialog)) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {shooterToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Schütze löschen bestätigen</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie den Schützen "{shooterToDelete.firstName} {shooterToDelete.lastName}" wirklich endgültig löschen? Dies entfernt den Schützen auch aus allen zugeordneten Mannschaften.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setShooterToDelete(null); }}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteShooter}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isFormLoading && isAlertOpen}
              >
                {(isFormLoading && isAlertOpen) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Endgültig löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

    