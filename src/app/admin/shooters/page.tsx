
// src/app/admin/shooters/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, UserCircle as UserIcon, Loader2, AlertTriangle } from 'lucide-react';
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription, // Use this one for AlertDialog
  AlertDialogFooter,    // Ensure this is imported
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams, useRouter } from 'next/navigation';
import type { Shooter, Club, Team, FirestoreLeagueSpecificDiscipline, League, TeamValidationInfo, UserPermission } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, getDisciplineCategory, leagueDisciplineOptions, GEWEHR_DISCIPLINES, PISTOL_DISCIPLINES } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, 
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayRemove, arrayUnion, Timestamp
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

const SHOOTERS_COLLECTION = "rwk_shooters";
const TEAMS_COLLECTION = "rwk_teams";
const CLUBS_COLLECTION = "clubs";
const LEAGUES_COLLECTION = "rwk_leagues";
const ALL_CLUBS_FILTER_VALUE = "__ALL_CLUBS__";

export default function AdminShootersPage() {
  const { user } = useAuth(); // Get current user for admin check
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTeamId = searchParams.get('teamId');
  const queryClubIdFromParams = searchParams.get('clubId');

  const { toast } = useToast();

  const [allClubsGlobal, setAllClubsGlobal] = useState<Club[]>([]);
  const [allLeaguesGlobal, setAllLeaguesGlobal] = useState<League[]>([]);
  const [shootersOfActiveClub, setShootersOfActiveClub] = useState<Shooter[]>([]);
  const [allTeamsDataForClub, setAllTeamsDataForClub] = useState<Team[]>([]); // Teams for the active club

  const [contextTeamName, setContextTeamName] = useState<string | null>(null);
  const [isContextTeamNameLoading, setIsContextTeamNameLoading] = useState<boolean>(false);

  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isLoadingClubSpecificData, setIsLoadingClubSpecificData] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentShooter, setCurrentShooter] = useState<Partial<Shooter> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  const [selectedClubIdFilter, setSelectedClubIdFilter] = useState<string>(queryClubIdFromParams || ALL_CLUBS_FILTER_VALUE);

  const [teamsOfSelectedClubInDialog, setTeamsOfSelectedClubInDialog] = useState<TeamValidationInfo[]>([]);
  const [isLoadingTeamsForDialog, setIsLoadingTeamsForDialog] = useState(false);
  const [selectedTeamIdsInForm, setSelectedTeamIdsInForm] = useState<string[]>([]);

  const fetchInitialData = useCallback(async () => {
    console.log("ASP DEBUG: Fetching initial global data (clubs, leagues)...");
    setIsLoadingPageData(true);
    try {
      const clubsSnapshotPromise = getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
      const leaguesSnapshotPromise = getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));

      const [clubsSnapshot, leaguesSnapshot] = await Promise.all([clubsSnapshotPromise, leaguesSnapshotPromise]);

      const fetchedClubs = clubsSnapshot.docs
        .map(docData => ({ id: docData.id, ...docData.data() } as Club))
        .filter(c => c && typeof c.id === 'string' && c.id.trim() !== "");
      setAllClubsGlobal(fetchedClubs);
      console.log("ASP DEBUG: All global clubs fetched:", fetchedClubs.length);

      const fetchedLeagues = leaguesSnapshot.docs
        .map(lDoc => ({ id: lDoc.id, ...lDoc.data() } as League))
        .filter(l => l.id && typeof l.id === 'string' && l.id.trim() !== "");
      setAllLeaguesGlobal(fetchedLeagues);
      console.log("ASP DEBUG: All global leagues fetched:", fetchedLeagues.length);
      
      // Set initial club filter based on query params
      if (queryClubIdFromParams && fetchedClubs.some(c => c.id === queryClubIdFromParams)) {
        setSelectedClubIdFilter(queryClubIdFromParams);
      } else if (queryTeamId && !queryClubIdFromParams) {
        // If teamId is present, try to find its club and set the filter
        const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
        const teamSnap = await getFirestoreDoc(teamDocRef);
        if (teamSnap.exists()) {
          const teamData = teamSnap.data() as Team;
          if (teamData.clubId && fetchedClubs.some(c => c.id === teamData.clubId)) {
            setSelectedClubIdFilter(teamData.clubId);
          }
        }
      }

    } catch (error) {
      console.error("ASP DEBUG: Error fetching initial page data:", error);
      toast({ title: "Fehler", description: "Basisdaten (Vereine/Ligen) konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingPageData(false);
    }
  }, [toast, queryClubIdFromParams, queryTeamId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchPageDataForActiveClub = useCallback(async () => {
    if (!selectedClubIdFilter || selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE) {
      // Fetch all shooters if "All Clubs" is selected
      console.log("ASP DEBUG: Fetching all shooters (no club filter).");
      setIsLoadingClubSpecificData(true);
      try {
        const shootersSnapshot = await getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("lastName", "asc"), orderBy("firstName", "asc")));
        const fetchedShooters = shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), teamIds: (d.data().teamIds || []) } as Shooter));
        setShootersOfActiveClub(fetchedShooters);

        const teamsSnapshot = await getDocs(query(collection(db, TEAMS_COLLECTION), orderBy("name", "asc")));
        const fetchedTeams = teamsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team));
        setAllTeamsDataForClub(fetchedTeams); // Store all teams for info column

      } catch (error) {
        console.error("ASP DEBUG: Error fetching all shooters:", error);
        toast({ title: "Fehler", description: "Schützendaten konnten nicht geladen werden.", variant: "destructive" });
      } finally {
        setIsLoadingClubSpecificData(false);
      }
      return;
    }

    console.log(`ASP DEBUG: Fetching page data for activeClubId: ${selectedClubIdFilter}`);
    setIsLoadingClubSpecificData(true);
    try {
      const shootersQuery = query(collection(db, SHOOTERS_COLLECTION), where("clubId", "==", selectedClubIdFilter), orderBy("lastName", "asc"), orderBy("firstName", "asc"));
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", selectedClubIdFilter));

      const [shootersSnapshot, teamsSnapshot] = await Promise.all([
        getDocs(shootersQuery), getDocs(teamsQuery)
      ]);

      const fetchedShooters = shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), teamIds: (d.data().teamIds || []) } as Shooter));
      setShootersOfActiveClub(fetchedShooters);
      console.log(`ASP DEBUG: Fetched ${fetchedShooters.length} shooters for club ${selectedClubIdFilter}`);

      const fetchedTeams = teamsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team));
      setAllTeamsDataForClub(fetchedTeams);
      console.log(`ASP DEBUG: Fetched ${fetchedTeams.length} teams for club ${selectedClubIdFilter} (for info column).`);

    } catch (error) {
      console.error(`ASP DEBUG: Error fetching page data for club ${selectedClubIdFilter}:`, error);
      toast({ title: "Fehler", description: "Schützen- oder Mannschaftsdaten für Verein konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingClubSpecificData(false);
    }
  }, [selectedClubIdFilter, toast]);

  useEffect(() => {
    fetchPageDataForActiveClub();
  }, [fetchPageDataForActiveClub]);

  const fetchContextTeamName = useCallback(async () => {
    if (queryTeamId) {
      setIsContextTeamNameLoading(true);
      try {
        const teamDocRef = doc(db, TEAMS_COLLECTION, queryTeamId);
        const teamSnap = await getFirestoreDoc(teamDocRef);
        if (teamSnap.exists()) {
          setContextTeamName((teamSnap.data() as Team).name);
        } else {
          console.warn("ASP DEBUG: Context team with ID not found:", queryTeamId);
          setContextTeamName(null);
        }
      } catch (err) {
        console.error("ASP DEBUG: Error fetching context team name:", err);
        setContextTeamName(null);
      }
      setIsContextTeamNameLoading(false);
    } else {
      setContextTeamName(null);
    }
  }, [queryTeamId]);

  useEffect(() => {
    fetchContextTeamName();
  }, [fetchContextTeamName]);
  
  const fetchTeamsForNewShooterDialog = useCallback(async (clubId: string) => {
    if (!clubId) {
      setTeamsOfSelectedClubInDialog([]);
      return;
    }
    console.log("ASP DIALOG DEBUG: Fetching teams for new shooter dialog, clubId:", clubId);
    setIsLoadingTeamsForDialog(true);
    try {
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("clubId", "==", clubId), orderBy("name", "asc"));
      const snapshot = await getDocs(teamsQuery);
      
      const teamsDataPromises = snapshot.docs.map(async (teamDoc) => {
        const teamData = teamDoc.data() as Team;
        let leagueType: FirestoreLeagueSpecificDiscipline | undefined = undefined;
        let leagueCompetitionYear: number | undefined = undefined;

        if (teamData.leagueId) {
          const leagueInfo = allLeaguesGlobal.find(l => l.id === teamData.leagueId);
          if (leagueInfo) {
            leagueType = leagueInfo.type;
            leagueCompetitionYear = leagueInfo.competitionYear;
          } else {
            console.warn(`ASP DIALOG DEBUG: League info not found in allLeaguesGlobal for leagueId: ${teamData.leagueId}`);
          }
        }
        return {
          ...teamData,
          id: teamDoc.id,
          leagueType,
          leagueCompetitionYear,
          currentShooterCount: (teamData.shooterIds || []).length,
        } as TeamValidationInfo;
      });
      const resolvedTeamsData = await Promise.all(teamsDataPromises);
      setTeamsOfSelectedClubInDialog(resolvedTeamsData);
      console.log("ASP DIALOG DEBUG: Fetched teams for dialog:", resolvedTeamsData.length);

      if (queryTeamId && resolvedTeamsData.some(t => t.id === queryTeamId)) {
        const contextTeam = resolvedTeamsData.find(t => t.id === queryTeamId);
        if (contextTeam && (contextTeam.currentShooterCount || 0) < MAX_SHOOTERS_PER_TEAM) {
          setSelectedTeamIdsInForm([queryTeamId]);
        } else if (contextTeam) {
          toast({ title: "Mannschaft voll", description: `Kontext-Mannschaft "${contextTeam.name}" ist bereits voll.`, variant: "warning", duration: 4000 });
          setSelectedTeamIdsInForm([]);
        }
      } else {
        setSelectedTeamIdsInForm([]);
      }

    } catch (error) {
      console.error("ASP DIALOG DEBUG: Error fetching teams for dialog:", error);
      toast({ title: "Fehler", description: "Mannschaften für Dialog konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingTeamsForDialog(false);
    }
  }, [allLeaguesGlobal, queryTeamId, toast]);

  useEffect(() => {
    if (isFormOpen && formMode === 'new' && currentShooter?.clubId) {
      fetchTeamsForNewShooterDialog(currentShooter.clubId);
    }
  }, [isFormOpen, formMode, currentShooter?.clubId, fetchTeamsForNewShooterDialog]);


  const handleAddNewShooter = () => {
    if (allClubsGlobal.length === 0) {
      toast({ title: "Keine Vereine", description: "Bitte zuerst Vereine anlegen, um Schützen hinzuzufügen.", variant: "destructive"});
      return;
    }
    setFormMode('new');
    let initialClubIdForNewShooter = '';
    if (selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE && allClubsGlobal.some(c => c.id === selectedClubIdFilter)) {
        initialClubIdForNewShooter = selectedClubIdFilter;
    } else if (queryClubIdFromParams && allClubsGlobal.some(c => c.id === queryClubIdFromParams)) {
        initialClubIdForNewShooter = queryClubIdFromParams;
    } else if (allClubsGlobal.length > 0) {
        // If no specific context, but clubs exist, do not pre-select a club to force user choice
        // initialClubIdForNewShooter = allClubsGlobal[0].id; // Or leave empty to force selection
    }
    
    setCurrentShooter({
      firstName: '',
      lastName: '',
      clubId: initialClubIdForNewShooter, // May be empty if no filter/param
      gender: 'male',
      teamIds: queryTeamId && initialClubIdForNewShooter ? [queryTeamId] : [], // Pre-select context team if club matches
    });
    
    // Fetch teams for dialog only if a club is pre-selected
    if (initialClubIdForNewShooter) {
      fetchTeamsForNewShooterDialog(initialClubIdForNewShooter);
    } else {
      setTeamsOfSelectedClubInDialog([]); // Clear if no club is pre-selected
      setSelectedTeamIdsInForm([]);
    }
    setIsFormOpen(true);
  };

  const handleEditShooter = (shooter: Shooter) => {
    setFormMode('edit');
    setCurrentShooter(shooter);
    // Team assignments are not edited here directly, this dialog is for shooter's personal data
    setSelectedTeamIdsInForm(shooter.teamIds || []); 
    setTeamsOfSelectedClubInDialog([]); // Not needed for edit mode as we don't change teams here
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (shooter: Shooter) => {
    setShooterToDelete(shooter);
    setIsAlertOpen(true);
  };

  const handleDeleteShooter = async () => {
    if (!shooterToDelete || !shooterToDelete.id) {
      toast({ title: "Fehler", description: "Kein Schütze zum Löschen ausgewählt.", variant: "destructive" });
      setIsAlertOpen(false); setShooterToDelete(null); return;
    }
    console.log(`ASP DELETE: Attempting to delete shooter: ${shooterToDelete.name} (ID: ${shooterToDelete.id})`);
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterToDelete.id);
      batch.delete(shooterDocRef);

      (shooterToDelete.teamIds || []).forEach(teamId => {
        if (teamId && typeof teamId === 'string' && teamId.trim() !== '') {
            const teamDocRef = doc(db, TEAMS_COLLECTION, teamId);
            batch.update(teamDocRef, { shooterIds: arrayRemove(shooterToDelete.id) });
        }
      });
      
      await batch.commit();
      toast({ title: "Schütze gelöscht", description: `"${shooterToDelete.name}" wurde erfolgreich entfernt.` });
      fetchPageDataForActiveClub(); 
    } catch (error: any) {
      console.error("ASP DELETE: Error deleting shooter:", error);
      toast({ title: "Fehler beim Löschen", description: error.message || "Der Schütze konnte nicht gelöscht werden.", variant: "destructive" });
    } finally {
      setIsDeleting(false); setIsAlertOpen(false); setShooterToDelete(null);
    }
  };
  
  const handleSubmitShooterForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentShooter || !currentShooter.lastName?.trim() || !currentShooter.firstName?.trim() || !currentShooter.clubId) {
      toast({ title: "Ungültige Eingabe", description: "Nachname, Vorname und Verein sind erforderlich.", variant: "destructive" });
      return;
    }
    setIsFormSubmitting(true);
    const combinedName = `${currentShooter.firstName.trim()} ${currentShooter.lastName.trim()}`;

    try {
      // Check for duplicates
      const shootersColRef = collection(db, SHOOTERS_COLLECTION);
      let qDuplicateName = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", currentShooter.clubId));
      if (formMode === 'edit' && currentShooter.id) {
        qDuplicateName = query(shootersColRef, where("name", "==", combinedName), where("clubId", "==", currentShooter.clubId), where(documentId(), "!=", currentShooter.id));
      }
      const duplicateSnap = await getDocs(qDuplicateName);
      if (!duplicateSnap.empty) {
        toast({ title: "Doppelter Schütze", description: `Ein Schütze mit dem Namen "${combinedName}" existiert bereits in diesem Verein.`, variant: "destructive"});
        setIsFormSubmitting(false); return;
      }

      const batch = writeBatch(db);
      if (formMode === 'new') {
        // Validate team assignments before saving new shooter
        let invalidAssignment = false;
        const assignedCategoriesPerYear: Record<string, { teamId: string; teamName: string; category: 'Gewehr' | 'Pistole' | null }> = {};

        for (const teamId of selectedTeamIdsInForm) {
          const teamInfo = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
          if (!teamInfo) continue;
          if ((teamInfo.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM && !invalidAssignment) { // Check if team is full
            toast({ title: "Mannschaft voll", description: `Mannschaft "${teamInfo.name}" ist bereits voll. Schütze kann nicht hinzugefügt werden.`, variant: "destructive", duration: 7000 });
            invalidAssignment = true; break;
          }
          
          if (teamInfo.leagueType && teamInfo.leagueCompetitionYear !== undefined) {
            const category = getDisciplineCategory(teamInfo.leagueType);
            if (category) { // Only validate if category is known
              const yearCategoryKey = `${teamInfo.leagueCompetitionYear}_${category}`;
              if (assignedCategoriesPerYear[yearCategoryKey]) {
                toast({ title: "Regelverstoß", description: `Neuer Schütze kann nicht gleichzeitig Team "${teamInfo.name}" und Team "${assignedCategoriesPerYear[yearCategoryKey].teamName}" zugewiesen werden (gleiches Jahr ${teamInfo.leagueCompetitionYear}, gleiche Disziplinkategorie '${category}').`, variant: "destructive", duration: 10000 });
                invalidAssignment = true; break;
              }
              assignedCategoriesPerYear[yearCategoryKey] = { teamId, teamName: teamInfo.name, category };
            }
          }
        }
        if (invalidAssignment) { setIsFormSubmitting(false); return; }

        const newShooterRef = doc(collection(db, SHOOTERS_COLLECTION));
        const shooterDataForSave: Omit<Shooter, 'id'> = {
          firstName: currentShooter.firstName.trim(),
          lastName: currentShooter.lastName.trim(),
          name: combinedName,
          clubId: currentShooter.clubId as string,
          gender: currentShooter.gender || 'male',
          teamIds: selectedTeamIdsInForm, // Store selected teams
        };
        batch.set(newShooterRef, shooterDataForSave);
        // Update team documents
        selectedTeamIdsInForm.forEach(teamId => {
          batch.update(doc(db, TEAMS_COLLECTION, teamId), { shooterIds: arrayUnion(newShooterRef.id) });
        });
        toast({ title: "Schütze erstellt", description: `${shooterDataForSave.name} wurde angelegt und den ausgewählten Mannschaften zugeordnet.` });

      } else if (formMode === 'edit' && currentShooter.id) {
        // Editing shooter's personal data. Team assignments are managed on the team page.
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, currentShooter.id);
        batch.update(shooterDocRef, {
          firstName: currentShooter.firstName.trim(),
          lastName: currentShooter.lastName.trim(),
          name: combinedName,
          gender: currentShooter.gender || 'male',
          // clubId is not changed here as per simplified VV workflow
        });
        toast({ title: "Schütze aktualisiert", description: `Die Daten für "${combinedName}" wurden aktualisiert.` });
      }
      
      await batch.commit();
      setIsFormOpen(false); setCurrentShooter(null); setSelectedTeamIdsInForm([]);
      fetchPageDataForActiveClub();
    } catch (error: any) {
      console.error("ASP SUBMIT DEBUG: Error saving shooter:", error);
      toast({ title: `Fehler beim Speichern`, description: error.message || "Ein unbekannter Fehler ist aufgetreten.", variant: "destructive" });
    } finally {
      setIsFormSubmitting(false);
    }
  };
  
  const handleFormInputChange = (field: keyof Pick<Shooter, 'lastName' | 'firstName' | 'clubId' | 'gender'>, value: string) => {
     setCurrentShooter(prev => {
        if (!prev) return null;
        const updatedShooter = { ...prev, [field]: value };
        if (field === 'clubId' && prev.clubId !== value && formMode === 'new') { 
            setSelectedTeamIdsInForm([]); 
            if (value) { 
              fetchTeamsForNewShooterDialog(value);
            } else {
              setTeamsOfSelectedClubInDialog([]);
            }
        }
        return updatedShooter;
     });
  };
  
  const handleTeamSelectionChangeInForm = (teamId: string, checked: boolean) => {
    if (isFormSubmitting || isLoadingTeamsForDialog) return;
    
    const teamBeingChanged = teamsOfSelectedClubInDialog.find(t => t.id === teamId);
    if (!teamBeingChanged) {
        console.warn("ASP DIALOG TeamSelect: Team info not found for ID", teamId);
        return;
    }

    if (checked) { 
      if (selectedTeamIdsInForm.length >= 3 && !selectedTeamIdsInForm.includes(teamId)) { // Allow unchecking, but not checking more than 3 in total
          toast({ title: "Maximal 3 Mannschaften", description: "Ein Schütze kann maximal 3 Mannschaften gleichzeitig zugeordnet werden.", variant: "warning" });
          return;
      }
      if ((teamBeingChanged.currentShooterCount || 0) >= MAX_SHOOTERS_PER_TEAM) {
        toast({ title: "Mannschaft voll", description: `Mannschaft "${teamBeingChanged.name}" ist bereits voll.`, variant: "warning" });
        return; 
      }
      
      const categoryOfTeamBeingChanged = getDisciplineCategory(teamBeingChanged.leagueType);
      const yearOfTeamBeingChanged = teamBeingChanged.leagueCompetitionYear;

      if (categoryOfTeamBeingChanged && yearOfTeamBeingChanged !== undefined) {
          const conflict = selectedTeamIdsInForm.some(id => {
            if (id === teamId) return false; // Don't check against itself
            const otherTeam = teamsOfSelectedClubInDialog.find(t => t.id === id);
            return otherTeam && 
                   getDisciplineCategory(otherTeam.leagueType) === categoryOfTeamBeingChanged && 
                   otherTeam.leagueCompetitionYear === yearOfTeamBeingChanged;
          });
          if (conflict) {
            toast({ title: "Regelverstoß", description: `Ein Schütze kann pro Saison (${yearOfTeamBeingChanged}) und Disziplinkategorie ('${categoryOfTeamBeingChanged}') nur einer Mannschaft angehören.`, variant: "destructive", duration: 8000 });
            return; 
          }
      }
    }
    setSelectedTeamIdsInForm(prev =>
      checked ? [...prev, teamId] : prev.filter(id => id !== teamId)
    );
  };

  const getClubName = useCallback((clubId?: string | null): string => {
    if (!clubId) return 'N/A';
    return allClubsGlobal.find(c => c.id === clubId)?.name || 'Unbek. Verein';
  }, [allClubsGlobal]);

  const getTeamInfoForShooter = useCallback((shooter: Shooter): string => {
    const teamIds = shooter.teamIds || [];
    if (teamIds.length === 0) return '-';
    if (allTeamsDataForClub.length === 0 && teamIds.length > 0) return `${teamIds.length} (Lade Teaminfo...)`;
    
    // Prioritize context team name if available
    if (contextTeamName && queryTeamId && teamIds.includes(queryTeamId)) {
      const otherTeamCount = teamIds.filter(id => id !== queryTeamId && allTeamsDataForClub.find(t => t.id === id)).length;
      return otherTeamCount > 0 ? `${contextTeamName} (+${otherTeamCount} weitere)` : contextTeamName;
    }
    
    const assignedTeamNames = teamIds
        .map(tid => allTeamsDataForClub.find(t => t.id === tid)?.name)
        .filter(name => !!name);

    if (assignedTeamNames.length === 1) return assignedTeamNames[0]!;
    if (assignedTeamNames.length > 0) return `${assignedTeamNames.length} Mannschaften`;
    
    return teamIds.length > 0 ? `${teamIds.length} (Namen nicht geladen)` : '-';
  }, [allTeamsDataForClub, queryTeamId, contextTeamName]);

  const selectedClubNameForTitle = useMemo(() => {
    if (selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE) return 'aller Vereine';
    return allClubsGlobal.find(c => c.id === selectedClubIdFilter)?.name || 'Unbekannt';
  }, [selectedClubIdFilter, allClubsGlobal]);

  if (isLoadingPageData) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-3">Lade Basisdaten...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Schützenverwaltung (Admin)</h1>
          {contextTeamName && !isContextTeamNameLoading && <p className="text-sm text-muted-foreground">Kontext: Schützen für Mannschaft "{contextTeamName}"</p>}
          {queryTeamId && isContextTeamNameLoading && <p className="text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 mr-1 animate-spin" /> Lade Teamkontext...</p>}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
           <Select
            value={selectedClubIdFilter}
            onValueChange={(value) => {
              setSelectedClubIdFilter(value);
              const newPath = value === ALL_CLUBS_FILTER_VALUE ? '/admin/shooters' : `/admin/shooters?clubId=${value}${queryTeamId ? `&teamId=${queryTeamId}`: ''}`;
              router.push(newPath, {scroll: false});
            }}
            disabled={allClubsGlobal.length === 0}
           >
            <SelectTrigger className="w-full sm:w-[220px]" aria-label="Verein filtern">
              <SelectValue placeholder={allClubsGlobal.length > 0 ? "Verein filtern" : "Keine Vereine"}/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLUBS_FILTER_VALUE}>Alle Vereine</SelectItem>
              {allClubsGlobal.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAddNewShooter} disabled={allClubsGlobal.length === 0}>
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
            Verwalten Sie hier die Schützen. Die Zuweisung zu Mannschaften erfolgt primär über die Mannschaftsverwaltung oder direkt hier beim Anlegen eines neuen Schützen.
            {allClubsGlobal.length === 0 && <span className="text-destructive block mt-1"> Hinweis: Keine Vereine angelegt.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoadingClubSpecificData ? (
             <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Schützen...</p></div>
           ) : shootersOfActiveClub.length > 0 ? (
             <Table>
              <TableHeader><TableRow>
                  <TableHead>Nachname</TableHead><TableHead>Vorname</TableHead>
                  <TableHead>Verein</TableHead><TableHead>Geschlecht</TableHead>
                  <TableHead>Mannschaften (Info)</TableHead><TableHead className="text-right">Aktionen</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {shootersOfActiveClub.map((shooter) => (
                  <TableRow key={shooter.id}>
                    <TableCell>{shooter.lastName}</TableCell><TableCell>{shooter.firstName}</TableCell>
                    <TableCell>{getClubName(shooter.clubId)}</TableCell>
                    <TableCell>{shooter.gender === 'male' ? 'Männlich' : (shooter.gender === 'female' ? 'Weiblich' : 'N/A')}</TableCell>
                    <TableCell className="text-xs">{getTeamInfoForShooter(shooter)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditShooter(shooter)} disabled={isFormSubmitting || isDeleting}><Edit className="h-4 w-4" /></Button>
                       <AlertDialog open={isAlertOpen && shooterToDelete?.id === shooter.id} onOpenChange={(open) => {if(!open)setShooterToDelete(null); setIsAlertOpen(open);}}>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteConfirmation(shooter)} disabled={isFormSubmitting || isDeleting}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Schütze löschen?</AlertDialogTitle><AlertDialogDescription>Möchten Sie "{shooterToDelete?.name}" wirklich löschen? Dies entfernt den Schützen auch aus allen zugeordneten Mannschaften dieses Vereins.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => {setIsAlertOpen(false); setShooterToDelete(null);}}>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteShooter} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Löschen</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">{selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE ? `Keine Schützen für "${selectedClubNameForTitle}" gefunden.` : 'Keine Schützen angelegt oder Filter aktiv.'}</p>
               {allClubsGlobal.length > 0 && <p className="text-sm mt-1">Klicken Sie auf "Neuen Schützen anlegen".</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setCurrentShooter(null); setTeamsOfSelectedClubInDialog([]); setSelectedTeamIdsInForm([]); } setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitShooterForm}>
            <DialogHeader>
                <DialogTitle>{formMode === 'new' ? 'Neuen Schützen anlegen' : 'Schütze bearbeiten'}</DialogTitle>
                <DialogDescriptionComponent>
                    {formMode === 'new'
                        ? 'Tragen Sie die Daten des Schützen ein. Optional können Sie ihn direkt Mannschaften zuordnen.'
                        : `Bearbeiten Sie die Daten für ${currentShooter?.name || 'den Schützen'}. Die Mannschaftszuordnung erfolgt über die Mannschaftsverwaltung.`
                    }
                    {formMode === 'new' && queryTeamId && contextTeamName &&
                        ` Kontext: Schütze wird initial der Mannschaft "${contextTeamName}" zugeordnet, falls Kapazität vorhanden und unten ausgewählt.`
                    }
                </DialogDescriptionComponent>
            </DialogHeader>
            {currentShooter && (
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-1.5"><Label htmlFor="lastNameFormDialogShooterAdmin">Nachname</Label><Input id="lastNameFormDialogShooterAdmin" value={currentShooter.lastName || ''} onChange={(e) => handleFormInputChange('lastName', e.target.value)} required /></div>
                <div className="space-y-1.5"><Label htmlFor="firstNameFormDialogShooterAdmin">Vorname</Label><Input id="firstNameFormDialogShooterAdmin" value={currentShooter.firstName || ''} onChange={(e) => handleFormInputChange('firstName', e.target.value)} required /></div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="clubIdFormShooterAdmin">Verein</Label>
                  <Select 
                    value={currentShooter.clubId || ''} 
                    onValueChange={(value) => handleFormInputChange('clubId', value)} 
                    required 
                    disabled={allClubsGlobal.length === 0 || formMode === 'edit'}
                  >
                    <SelectTrigger id="clubIdFormShooterAdmin" aria-label="Verein auswählen">
                        <SelectValue placeholder={allClubsGlobal.length === 0 ? "Keine Vereine" : "Verein wählen"}/>
                    </SelectTrigger>
                    <SelectContent>
                      {allClubsGlobal.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                   {formMode === 'edit' && currentShooter.clubId && <p className="text-xs text-muted-foreground pt-1">Der Verein eines bestehenden Schützen kann hier nicht geändert werden. Löschen Sie den Schützen ggf. und legen Sie ihn neu an, wenn ein Vereinswechsel erfolgt ist.</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="genderFormDialogShooterAdmin">Geschlecht</Label>
                  <Select value={currentShooter.gender || 'male'} onValueChange={(value) => handleFormInputChange('gender', value as 'male' | 'female')}>
                    <SelectTrigger id="genderFormDialogShooterAdmin" aria-label="Geschlecht auswählen"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Männlich</SelectItem><SelectItem value="female">Weiblich</SelectItem></SelectContent>
                  </Select>
                </div>

                {formMode === 'new' && currentShooter.clubId && (
                  <div className="space-y-2 pt-3 border-t mt-3">
                    <Label className="text-base font-medium">Mannschaften für "{allClubsGlobal.find(c => c.id === currentShooter!.clubId)?.name || 'ausgewählten Verein'}" zuordnen (Optional)</Label>
                    <p className="text-xs text-muted-foreground">Maximal 3 Mannschaften. Ein Schütze darf pro Saison und Disziplinkategorie (Gewehr/Pistole) nur einer Mannschaft angehören. Max. {MAX_SHOOTERS_PER_TEAM} Schützen pro Team.</p>
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
                            } else if (!isSelected) {
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
                                <Checkbox 
                                  id={`team-select-admin-shooter-${team.id}`} 
                                  checked={isSelected} 
                                  onCheckedChange={(checkedState) => handleTeamSelectionChangeInForm(team.id, !!checkedState)} 
                                  disabled={isDisabled} 
                                />
                                <Label htmlFor={`team-select-admin-shooter-${team.id}`} className={`font-normal text-sm leading-tight ${isDisabled ? 'text-muted-foreground line-through' : 'cursor-pointer'}`}>
                                  {team.name}
                                  {(team.leagueType || team.leagueCompetitionYear !== undefined) && <span className="text-xs text-muted-foreground ml-1">({leagueTypeLabel}, {team.leagueCompetitionYear || 'Jahr N/A'})</span>}
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
                 {formMode === 'edit' && (
                  <div className="text-xs text-muted-foreground pt-2 border-t mt-3">
                    <p className="font-medium mb-1">Aktuelle Mannschafts-Zugehörigkeiten:</p>
                    <p>{currentShooter.id ? getTeamInfoForShooter(currentShooter as Shooter) : '-'}</p>
                    <p className="mt-1">Die Zuordnung zu Mannschaften erfolgt primär über die Mannschaftsverwaltung auf der Seite "/admin/teams".</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Abbrechen</Button></DialogClose>
              <Button type="submit" disabled={isFormSubmitting || isLoadingTeamsForDialog}>
                {(isFormSubmitting || isLoadingTeamsForDialog) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
