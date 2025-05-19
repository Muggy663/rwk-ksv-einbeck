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
const LEAGUES_COLLECTION = "rwk_leagues"; // Added to fetch league types
const ALL_CLUBS_FILTER_VALUE = "__ALL_CLUBS__";
const MAX_SHOOTERS_PER_TEAM = 3;

export default function AdminShootersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTeamId = searchParams.get('teamId');
  const queryClubIdFromParams = searchParams.get('clubId');

  const { toast } = useToast();

  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [allLeaguesForValidation, setAllLeaguesForValidation] = useState<League[]>([]);
  const [shooters, setShooters] = useState<Shooter[]>([]);
  const [filteredShooters, setFilteredShooters] = useState<Shooter[]>([]);

  const [contextTeamName, setContextTeamName] = useState<string | null>(null);
  const [isContextTeamNameLoading, setIsContextTeamNameLoading] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(true); 
  const [isFormLoading, setIsFormLoading] = useState(false); 
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  const [selectedClubIdFilter, setSelectedClubIdFilter] = useState<string>(ALL_CLUBS_FILTER_VALUE);

  const [teamsOfSelectedClubInDialog, setTeamsOfSelectedClubInDialog] = useState<TeamValidationInfo[]>([]);
  const [isLoadingTeamsForDialog, setIsLoadingTeamsForDialog] = useState(false);
  const [selectedTeamIdsInForm, setSelectedTeamIdsInForm] = useState<string[]>([]);

  useEffect(() => {
    const fetchContextTeamName = async () => {
      if (queryTeamId) {
        setIsContextTeamNameLoading(true);
        setContextTeamName(null); // Reset while loading
        try {
          const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
          const teamSnap = await getFirestoreDoc(teamDocRef);
          if (teamSnap.exists()) {
            const teamName = (teamSnap.data() as Team).name;
            setContextTeamName(teamName);
          } else {
            setContextTeamName(null); // Team not found
            toast({title: "Team nicht gefunden", description: `Kontext-Team mit ID ${queryTeamId} konnte nicht geladen werden.`, variant: "warning"})
          }
        } catch (error) {
          console.error("AdminShootersPage: Error fetching context team name: ", error);
          setContextTeamName(null);
        } finally {
          setIsContextTeamNameLoading(false);
        }
      } else {
        setContextTeamName(null); // No teamId in query
        setIsContextTeamNameLoading(false);
      }
    };
    fetchContextTeamName();
  }, [queryTeamId, toast]);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    console.log("AdminShootersPage: Fetching initial data (clubs, shooters, leagues)...");
    try {
      const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
      const fetchedClubs: Club[] = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
      setAllClubs(fetchedClubs);
      console.log("AdminShootersPage: Clubs fetched:", fetchedClubs.length);

      // Fetch all leagues to get their types for validation
      const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      const fetchedLeagues: League[] = leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
      setAllLeaguesForValidation(fetchedLeagues);
      console.log("AdminShootersPage: All leagues (for validation) fetched:", fetchedLeagues.length);

      let initialClubFilter = ALL_CLUBS_FILTER_VALUE;
      if (queryClubIdFromParams && fetchedClubs.some(c => c.id === queryClubIdFromParams)) {
        initialClubFilter = queryClubIdFromParams;
      } else if (queryTeamId && !queryClubIdFromParams) {
        // If coming from a team context, try to pre-filter by the team's club
        const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
        const teamSnap = await getFirestoreDoc(teamDocRef);
        if (teamSnap.exists() && teamSnap.data()?.clubId) {
          const teamClubId = teamSnap.data()?.clubId;
          if (fetchedClubs.some(c => c.id === teamClubId)) {
             initialClubFilter = teamClubId;
          }
        }
      }
      setSelectedClubIdFilter(initialClubFilter);

      const shootersSnapshot = await getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("lastName", "asc"), orderBy("firstName", "asc")));
      const fetchedShooters: Shooter[] = shootersSnapshot.docs.map(docData => ({ id: docData.id, ...docData.data(), teamIds: docData.data().teamIds || [] } as Shooter));
      setShooters(fetchedShooters);
      console.log("AdminShootersPage: Shooters fetched:", fetchedShooters.length);

    } catch (error) {
      console.error("AdminShootersPage: Error fetching initial data: ", error);
      toast({ title: "Fehler beim Laden der Daten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [queryClubIdFromParams, queryTeamId, toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    // This effect filters shooters based on the selectedClubIdFilter
    if (selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE) {
      setFilteredShooters(shooters);
    } else {
      const newFiltered = shooters.filter(s => s.clubId === selectedClubIdFilter);
      setFilteredShooters(newFiltered);
    }
  }, [selectedClubIdFilter, shooters]);

  // Effect to fetch teams for the "New Shooter" dialog when clubId changes in the form
  useEffect(() => {
    const fetchTeamsForNewShooterDialog = async () => {
      if (isFormOpen && formMode === 'new' && currentShooter?.clubId && allLeaguesForValidation.length > 0) {
        setIsLoadingTeamsForDialog(true);
        setTeamsOfSelectedClubInDialog([]); // Reset previous teams
        console.log("AdminShootersPage: DIALOG (NEW) - Fetching teams for clubId:", currentShooter.clubId);
        try {
          const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", currentShooter.clubId), orderBy("name", "asc"));
          const snapshot = await getDocs(teamsQuery);
          console.log("AdminShootersPage: DIALOG (NEW) - Teams query snapshot size:", snapshot.docs.length);

          const fetchedTeamsPromises = snapshot.docs.map(async (d) => {
            const teamData = d.data() as Team;
            const leagueInfo = allLeaguesForValidation.find(l => l.id === teamData.leagueId);
            return {
              id: d.id,
              ...teamData,
              currentShooterCount: (teamData.shooterIds || []).length, // Get current shooter count
              leagueType: leagueInfo?.type, // Get specific league type (KKG, LGA etc.)
              leagueCompetitionYear: leagueInfo?.competitionYear
            } as TeamValidationInfo;
          });
          const fetchedTeams = await Promise.all(fetchedTeamsPromises);
          setTeamsOfSelectedClubInDialog(fetchedTeams);
          console.log("AdminShootersPage: DIALOG (NEW) - Teams for dialog:", fetchedTeams.map(t => ({name: t.name, count: t.currentShooterCount, id: t.id, leagueType: t.leagueType, year: t.leagueCompetitionYear })));

          // Pre-select context team if available and not full
          if (queryTeamId && fetchedTeams.some(t => t.id === queryTeamId)) {
            const contextTeam = fetchedTeams.find(t => t.id === queryTeamId);
            if (contextTeam && (contextTeam.currentShooterCount || 0) < MAX_SHOOTERS_PER_TEAM) {
                 setSelectedTeamIdsInForm([queryTeamId]);
                 console.log("AdminShootersPage: DIALOG (NEW) - Context team pre-selected:", queryTeamId);
            } else if (contextTeam) {
                 // Context team is full, don't pre-select and inform user
                 toast({title: "Mannschaft voll", description: `Die Kontext-Mannschaft "${contextTeam.name}" hat bereits die maximale Anzahl von ${MAX_SHOOTERS_PER_TEAM} Schützen.`, variant: "warning", duration: 5000});
                 setSelectedTeamIdsInForm([]);
            } else {
                setSelectedTeamIdsInForm([]);
            }
          } else {
             setSelectedTeamIdsInForm([]);
          }

        } catch (error) {
          console.error("AdminShootersPage: DIALOG (NEW) - Error fetching teams for club:", error);
          toast({ title: "Fehler", description: "Mannschaften für Vereinsauswahl konnten nicht geladen werden.", variant: "destructive" });
        } finally {
          setIsLoadingTeamsForDialog(false);
        }
      } else {
        setTeamsOfSelectedClubInDialog([]); // Clear teams if no club selected or not in 'new' mode
        if (formMode !== 'edit') { // Don't clear selection if just switching to edit mode
            setSelectedTeamIdsInForm([]);
        }
      }
    };

    fetchTeamsForNewShooterDialog();
  }, [isFormOpen, formMode, currentShooter?.clubId, queryTeamId, toast, allLeaguesForValidation]);


  const handleAddNew = () => {
    if (allClubs.length === 0) {
      toast({ title: "Keine Vereine", description: "Bitte zuerst Vereine anlegen, um Schützen erstellen zu können.", variant: "destructive"});
      return;
    }
    setFormMode('new');

    let resolvedInitialClubId = '';
    if (selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE && allClubs.some(c => c.id === selectedClubIdFilter)) {
        resolvedInitialClubId = selectedClubIdFilter;
    } else if (queryClubIdFromParams && allClubs.some(c => c.id === queryClubIdFromParams)) {
        resolvedInitialClubId = queryClubIdFromParams;
    }
    
    setCurrentShooter({
      firstName: '',
      lastName: '',
      clubId: resolvedInitialClubId, // Standardmäßig keinen Verein vorauswählen, außer Filter ist aktiv
      gender: 'male',
      teamIds: [], // Initial leer, wird durch Checkboxen befüllt
    });
    setTeamsOfSelectedClubInDialog([]); // Wird durch useEffect getriggert, wenn clubId gesetzt wird
    setSelectedTeamIdsInForm([]); // Team-Auswahl zurücksetzen
    setIsFormOpen(true);
  };

  const handleEdit = (shooter: Shooter) => {
     if (allClubs.length === 0 && !shooter.clubId) {
      toast({ title: "Keine Vereine", description: "Vereinsauswahl nicht möglich. Bitte Vereine anlegen.", variant: "destructive"});
      // return; // Allow opening to see info text
    }
    setFormMode('edit');
    setCurrentShooter(shooter);
    // Team IDs are not edited here, this dialog is for shooter's personal data
    setSelectedTeamIdsInForm(shooter.teamIds || []); // Nur zur Info, nicht zur Bearbeitung
    setTeamsOfSelectedClubInDialog([]); // Keine Mannschaftsauswahl im Edit-Modus
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

      // Get current team assignments of the shooter
      const shooterData = (await getFirestoreDoc(shooterDocRef)).data() as Shooter | undefined;
      const teamsToUpdateFromShooterDoc = shooterData?.teamIds || [];

      // Remove shooter from all their assigned teams
      if (teamsToUpdateFromShooterDoc.length > 0) {
        teamsToUpdateFromShooterDoc.forEach(teamId => {
          const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
          batch.update(teamDocRef, { shooterIds: arrayRemove(shooterIdToDelete) });
        });
      }

      // Delete the shooter document
      batch.delete(shooterDocRef);
      await batch.commit();
      toast({ title: "Schütze gelöscht", description: `${shooterToDelete.firstName} ${shooterToDelete.lastName} wurde erfolgreich entfernt.` });
      fetchInitialData(); // Refresh the main shooter list
    } catch (error) {
      console.error("AdminShootersPage: handleDeleteShooter - Error deleting shooter: ", error);
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
      // Duplicate check
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
        const assignedTeamsPerYearAndCategory: Record<string, { gewehrCount: number, pistolCount: number }> = {};
        const actualTeamIdsForShooter: string[] = [];

        for (const teamId of selectedTeamIdsInForm) {
            const teamInfo = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
            if (!teamInfo || !teamInfo.leagueCompetitionYear || !teamInfo.leagueType) {
                console.warn("AdminShootersPage: handleSubmit (NEW) - Missing league info for teamId:", teamId);
                continue; 
            }

            if ((teamInfo.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM) {
                toast({ title: "Mannschaft voll", description: `Mannschaft "${teamInfo.name}" ist bereits voll. Schütze nicht hinzugefügt.`, variant: "warning", duration: 6000 });
                continue; 
            }
            
            const year = teamInfo.leagueCompetitionYear;
            const leagueType = teamInfo.leagueType;
            const yearCategoryKey = `${year}`;

            if (!assignedTeamsPerYearAndCategory[yearCategoryKey]) {
                assignedTeamsPerYearAndCategory[yearCategoryKey] = { gewehrCount: 0, pistolCount: 0 };
            }

            let categoryConflict = false;
            if (GEWEHR_DISCIPLINES.includes(leagueType)) {
                if (assignedTeamsPerYearAndCategory[yearCategoryKey].gewehrCount >= 1) categoryConflict = true;
                else assignedTeamsPerYearAndCategory[yearCategoryKey].gewehrCount++;
            } else if (PISTOL_DISCIPLINES.includes(leagueType)) {
                if (assignedTeamsPerYearAndCategory[yearCategoryKey].pistolCount >= 1) categoryConflict = true;
                else assignedTeamsPerYearAndCategory[yearCategoryKey].pistolCount++;
            }

            if (categoryConflict) {
                 const categoryName = GEWEHR_DISCIPLINES.includes(leagueType) ? "Gewehr" : "Pistolen";
                 toast({ title: `Konflikt ${categoryName}disziplin`, description: `Schütze kann nicht mehreren ${categoryName}-Mannschaften in Saison ${year} zugewiesen werden.`, variant: "destructive", duration: 7000 });
                 setIsFormLoading(false); return;
            }
            actualTeamIdsForShooter.push(teamId);
        }
        console.log("AdminShootersPage: handleSubmit (NEW) - Actual team IDs for shooter after validation:", actualTeamIdsForShooter);

        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        const shooterDataToSave: Omit<Shooter, 'id'> = {
          firstName: currentShooter.firstName.trim(),
          lastName: currentShooter.lastName.trim(),
          name: combinedName,
          clubId: currentShooter.clubId as string,
          gender: currentShooter.gender || 'male',
          teamIds: actualTeamIdsForShooter, 
        };
        batch.set(newShooterRef, shooterDataToSave);

        // Update team documents
        for (const teamId of actualTeamIdsForShooter) {
          const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
          batch.update(teamDocRef, { shooterIds: arrayUnion(newShooterRef.id) });
        }
        toast({ title: "Schütze erstellt", description: `${shooterDataToSave.name} wurde erfolgreich angelegt.` });

      } else if (formMode === 'edit' && currentShooter.id) {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        const originalShooterDoc = shooters.find(s => s.id === currentShooter.id); // Get original for comparison
        
        const dataForUpdate: Partial<Shooter> = { // Use Partial for update
            firstName: currentShooter.firstName.trim(),
            lastName: currentShooter.lastName.trim(),
            name: combinedName,
            clubId: currentShooter.clubId as string,
            gender: currentShooter.gender || 'male',
            // teamIds are NOT updated here. This is done via team management.
        };

        // Handle club change: If clubId changed, shooter should be removed from all previous teams.
        if (originalShooterDoc && originalShooterDoc.clubId !== currentShooter.clubId) {
            // Remove shooter from all their old teams
            if(originalShooterDoc.teamIds && originalShooterDoc.teamIds.length > 0) {
                originalShooterDoc.teamIds.forEach(oldTeamId => {
                    const teamDocRef = doc(db, TEAMS_COLLECTION, oldTeamId);
                    batch.update(teamDocRef, { shooterIds: arrayRemove(currentShooter.id as string) });
                });
            }
            dataForUpdate.teamIds = []; // Reset teamIds for the shooter
            toast({ title: "Vereinswechsel", description: `Mannschaftszugehörigkeiten für ${combinedName} wurden aufgrund des Vereinswechsels zurückgesetzt. Bitte über Mannschaftsverwaltung neu zuordnen.`, variant: "info", duration: 7000 });
        }

        batch.update(shooterDocRef, dataForUpdate);
        toast({ title: "Schütze aktualisiert", description: `${combinedName} wurde erfolgreich aktualisiert.` });
      }

      await batch.commit();
      setIsFormOpen(false);
      setCurrentShooter(null);
      setSelectedTeamIdsInForm([]);
      setTeamsOfSelectedClubInDialog([]);
      fetchInitialData(); // Refresh main list
    } catch (error) {
      console.error("AdminShootersPage: handleSubmit - Error saving shooter: ", error);
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
        // If clubId changes, reset team selections and trigger refetch for teams of new club
        if (field === 'clubId' && prev.clubId !== value) {
            setSelectedTeamIdsInForm([]);
            setTeamsOfSelectedClubInDialog([]); // This will trigger the useEffect to fetch new teams
        }
        return updatedShooter;
     });
  };

  // Handles selection of teams in the "New Shooter" dialog
  const handleTeamSelectionChangeInForm = (teamId: string, checked: boolean) => {
    console.log("AdminShootersPage: DIALOG (NEW) - Team selection change. TeamId:", teamId, "Checked:", checked);
    const team = teamsOfSelectedClubInDialog.find(t => t.id === teamId);

    // Rule: Max 3 shooters per team
    if (checked && team && (team.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM && !selectedTeamIdsInForm.includes(teamId) ) {
        toast({
            title: "Mannschaft voll",
            description: `Die Mannschaft "${team.name}" hat bereits die maximale Anzahl von ${MAX_SHOOTERS_PER_TEAM} Schützen.`,
            variant: "destructive"
        });
        return; // Prevent selection
    }

    // Rule: Shooter only in one team per discipline category per year
    if (checked) {
        const teamInfo = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
        if (!teamInfo || !teamInfo.leagueCompetitionYear || !teamInfo.leagueType) {
            console.warn("AdminShootersPage: DIALOG (NEW) - Missing league info for teamId:", teamId);
            return;
        }

        const year = teamInfo.leagueCompetitionYear;
        const newTeamLeagueType = teamInfo.leagueType;
        let gewehrAssignmentsInYear = 0;
        let pistolAssignmentsInYear = 0;

        // Check current selections
        selectedTeamIdsInForm.forEach(existingTeamId => {
            const existingTeamInfo = teamsOfSelectedClubInDialog.find(t => t.id === existingTeamId);
            if (existingTeamInfo && existingTeamInfo.leagueCompetitionYear === year) {
                if (existingTeamInfo.leagueType && GEWEHR_DISCIPLINES.includes(existingTeamInfo.leagueType)) gewehrAssignmentsInYear++;
                if (existingTeamInfo.leagueType && PISTOL_DISCIPLINES.includes(existingTeamInfo.leagueType)) pistolAssignmentsInYear++;
            }
        });
        
        // Check if adding the new team violates the rule
        if (GEWEHR_DISCIPLINES.includes(newTeamLeagueType) && gewehrAssignmentsInYear >= 1) {
             toast({ title: "Konflikt Gewehrdisziplin", description: `Schütze kann nicht mehreren Gewehr-Mannschaften in Saison ${year} zugewiesen werden. Bitte eine Auswahl entfernen.`, variant: "destructive", duration: 7000 });
             return;
        }
        if (PISTOL_DISCIPLINES.includes(newTeamLeagueType) && pistolAssignmentsInYear >= 1) {
            toast({ title: "Konflikt Pistolendisziplin", description: `Schütze kann nicht mehreren Pistolen-Mannschaften in Saison ${year} zugewiesen werden. Bitte eine Auswahl entfernen.`, variant: "destructive", duration: 7000 });
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

    if (queryTeamId && isContextTeamNameLoading) {
        return "Lädt Mannschafts-Info...";
    }

    if (queryTeamId && contextTeamName) { // Context from team page
        if (teamIds.includes(queryTeamId)) {
            const otherTeamCount = teamIds.filter(id => id !== queryTeamId).length;
            return otherTeamCount > 0 ? `${contextTeamName} (+${otherTeamCount} weitere)` : contextTeamName;
        } else {
            // This case should ideally not happen if data is consistent (shooter opened in context of a team they are not in)
            if (teamIds.length === 0) return '-';
            if (teamIds.length === 1) return `1 andere Mannschaft`; 
            return `${teamIds.length} andere Mannschaften`;
        }
    }

    // No specific team context from URL query params
    if (teamIds.length === 0) return '-';
    // If we want to show the name of the single team, we'd need to fetch team names here (N+1 potential)
    // For now, just showing count for simplicity on this overview page.
    if (teamIds.length === 1) return "1 Mannschaft zugeordnet"; 
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
              if(queryTeamId || queryClubIdFromParams) router.push('/admin/shooters', {scroll: false});
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
            {queryTeamId && isContextTeamNameLoading && ` (Lade Kontext-Mannschaft Namen...)`}
            {queryTeamId && contextTeamName && ` (Aktueller Kontext: Mannschaft "${contextTeamName}")`}
            {queryTeamId && !contextTeamName && !isContextTeamNameLoading && ` (Kontext-Mannschaft ID ${queryTeamId} nicht gefunden)`}
            {allClubs.length === 0 && !isLoading && <span className="text-destructive block mt-1"> Hinweis: Keine Vereine angelegt. Bitte zuerst Vereine erstellen.</span>}
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
                  <TableHead>Nachname</TableHead>
                  <TableHead>Vorname</TableHead>
                  <TableHead>Verein</TableHead>
                  <TableHead>Geschlecht</TableHead>
                  <TableHead>Mannschaften (Info)</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShooters.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.lastName}</TableCell>
                    <TableCell>{shooter.firstName}</TableCell>
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
                        ` Kontext: Der Schütze wird initial der Mannschaft "${contextTeamName}" zugeordnet, falls diese unten ausgewählt wird und zum gewählten Verein passt.`
                    }
                </DialogDescription>
            </DialogHeader>
            {currentShooter && (
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input id="lastName" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input id="firstName" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clubIdForm">Verein</Label>
                  <Select
                    value={currentShooter.clubId || ''}
                    onValueChange={(value) => handleFormInputChange('clubId', value)}
                    required
                    disabled={allClubs.length === 0}
                  >
                    <SelectTrigger id="clubIdForm" aria-label="Verein auswählen">
                      <SelectValue placeholder={allClubs.length === 0 ? "Keine Vereine" : "Verein wählen"}/>
                    </SelectTrigger>
                    <SelectContent>
                      {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                   {formMode === 'edit' && <p className="text-xs text-muted-foreground mt-1">Hinweis: Bei Vereinswechsel werden bestehende Mannschaftszuordnungen zurückgesetzt.</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gender">Geschlecht</Label>
                  <Select
                    value={currentShooter.gender || 'male'}
                    onValueChange={(value) => handleFormInputChange('gender', value as 'male' | 'female')}
                  >
                    <SelectTrigger id="gender" aria-label="Geschlecht auswählen">
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
                    <Label>Mannschaften für "{allClubs.find(c => c.id === currentShooter.clubId)?.name}" zuordnen (max. 1 Gewehr & 1 Pistole pro Jahr)</Label>
                     <p className="text-xs text-muted-foreground">Max. {MAX_SHOOTERS_PER_TEAM} Schützen pro Team.</p>
                    {isLoadingTeamsForDialog ? (
                      <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Mannschaften...</div>
                    ) : teamsOfSelectedClubInDialog.length > 0 ? (
                      <ScrollArea className="h-32">
                        {teamsOfSelectedClubInDialog.map(team => {
                          const isFull = (team.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM;
                          const isDisabledByMax = isFull && !selectedTeamIdsInForm.includes(team.id);
                          const leagueTypeInfo = leagueDisciplineOptions.find(opt => opt.value === team.leagueType);
                          const leagueTypeLabel = leagueTypeInfo?.label || team.leagueType || 'Unbek. Typ';
                          return (
                            <div key={team.id} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`team-assign-${team.id}`}
                                checked={selectedTeamIdsInForm.includes(team.id)}
                                onCheckedChange={(checked) => handleTeamSelectionChangeInForm(team.id, !!checked)}
                                disabled={isDisabledByMax}
                              />
                              <Label htmlFor={`team-assign-${team.id}`} className={`font-normal ${isDisabledByMax ? 'text-muted-foreground line-through cursor-not-allowed' : 'cursor-pointer'}`}>
                                {team.name}
                                <span className='text-xs text-muted-foreground'> ({team.currentShooterCount || 0}/{MAX_SHOOTERS_PER_TEAM})</span>
                                {team.leagueType && team.leagueCompetitionYear && <span className='text-xs text-muted-foreground ml-1'>({leagueTypeLabel} {team.leagueCompetitionYear})</span>}
                                {isFull && !selectedTeamIdsInForm.includes(team.id) && <span className="text-xs text-destructive ml-1">(Voll)</span>}
                              </Label>
                            </div>
                          );
                        })}
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {currentShooter.clubId && !isLoadingTeamsForDialog
                          ? "Keine Mannschaften für diesen Verein gefunden."
                          : "Bitte zuerst einen Verein auswählen, um Mannschaften anzuzeigen."}
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
                Möchten Sie den Schützen "{shooterToDelete.firstName} {shooterToDelete.lastName}" wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden und entfernt den Schützen auch aus allen zugeordneten Mannschaften.
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
    
