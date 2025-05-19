
// src/app/admin/teams/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users, Loader2 } from 'lucide-react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams, useRouter } from 'next/navigation';
import type { Season, League, Club, Team, Shooter, UIDisciplineSelection } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "rwk_shooters";
const MAX_SHOOTERS_PER_TEAM = 3;

export default function AdminTeamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySeasonId = searchParams.get('seasonId');
  const queryLeagueId = searchParams.get('leagueId');

  const { toast } = useToast();

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  
  const [availableClubShooters, setAvailableClubShooters] = useState<Shooter[]>([]);
  const [isLoadingShootersForDialog, setIsLoadingShootersForDialog] = useState(false);

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [availableLeaguesForSeason, setAvailableLeaguesForSeason] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team> & { id?: string } | null>(null);
  const [persistedShooterIdsForTeam, setPersistedShooterIdsForTeam] = useState<string[]>([]);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const [selectedShooterIdsInForm, setSelectedShooterIdsInForm] = useState<string[]>([]);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const [allTeamsForYearValidation, setAllTeamsForYearValidation] = useState<Team[]>([]);
  const [leagueTypesMapValidation, setLeagueTypesMapValidation] = useState<Map<string, UIDisciplineSelection>>(new Map());
  const [isLoadingValidationData, setIsLoadingValidationData] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      console.log("AdminTeamsPage: fetchInitialData called");
      setIsLoadingData(true);
      try {
        const seasonsSnapshot = await getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
        const fetchedSeasons: Season[] = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
        setAllSeasons(fetchedSeasons);
        console.log("AdminTeamsPage: Seasons fetched:", fetchedSeasons.length, fetchedSeasons.map(s => s.id));
        if (fetchedSeasons.length === 0) toast({ title: "Keine Saisons gefunden", description: "Bitte zuerst Saisons anlegen.", variant: "destructive" });

        const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
        const fetchedLeagues: League[] = leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
        setAllLeagues(fetchedLeagues);
        console.log("AdminTeamsPage: All leagues fetched:", fetchedLeagues.length);
        fetchedLeagues.forEach(l => console.log(`AdminTeamsPage: League Detail - ID: ${l.id}, Name: ${l.name}, SeasonID: ${l.seasonId}`));

        const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
        const fetchedClubs: Club[] = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
        setAllClubs(fetchedClubs);
        console.log("AdminTeamsPage: Clubs fetched:", fetchedClubs.length);

        if (querySeasonId && fetchedSeasons.some(s => s.id === querySeasonId)) {
          setSelectedSeasonId(querySeasonId);
        } else if (fetchedSeasons.length > 0) {
          setSelectedSeasonId(fetchedSeasons[0].id);
        } else {
          setSelectedSeasonId('');
        }
      } catch (error) {
        console.error("AdminTeamsPage: Error fetching initial data: ", error);
        toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [querySeasonId, toast]); 

  useEffect(() => {
    if (selectedSeasonId && allLeagues.length > 0) {
      const leaguesForCurrentSeason = allLeagues
        .filter(l => l.seasonId === selectedSeasonId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setAvailableLeaguesForSeason(leaguesForCurrentSeason);
      console.log(`AdminTeamsPage: Available leagues for season ${selectedSeasonId}: ${leaguesForCurrentSeason.length}`, leaguesForCurrentSeason.map(l=> ({id: l.id, name: l.name, seasonId: l.seasonId})));
      
      if (queryLeagueId && leaguesForCurrentSeason.some(l => l.id === queryLeagueId)) {
        setSelectedLeagueId(queryLeagueId);
      } else if (leaguesForCurrentSeason.length > 0) {
        setSelectedLeagueId(leaguesForCurrentSeason[0].id);
      } else {
        setSelectedLeagueId('');
      }
    } else {
      setAvailableLeaguesForSeason([]);
      setSelectedLeagueId('');
    }
  }, [selectedSeasonId, allLeagues, queryLeagueId]);

  const fetchTeams = useMemo(() => async () => {
    if (!selectedLeagueId || !selectedSeasonId) {
      setTeams([]);
      return;
    }
    const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeason) {
      setTeams([]);
      return;
    }
    setIsLoadingTeams(true);
    try {
      const q = query(
        collection(db, TEAMS_COLLECTION),
        where("leagueId", "==", selectedLeagueId),
        where("competitionYear", "==", currentSeason.competitionYear),
        orderBy("name", "asc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedTeams: Team[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), shooterIds: (doc.data().shooterIds || []) } as Team));
      setTeams(fetchedTeams);
    } catch (error) {
      console.error("AdminTeamsPage: Error fetching teams: ", error);
      toast({ title: "Fehler beim Laden der Mannschaften", description: (error as Error).message, variant: "destructive" });
      setTeams([]);
    } finally {
      setIsLoadingTeams(false);
    }
  }, [selectedLeagueId, selectedSeasonId, allSeasons, toast]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    const fetchShootersForClubInDialog = async () => {
      if (isFormOpen && currentTeam?.clubId && selectedLeagueId) {
        setIsLoadingShootersForDialog(true);
        try {
          const shootersQuery = query(
            collection(db, SHOOTERS_COLLECTION),
            where("clubId", "==", currentTeam.clubId),
            orderBy("name", "asc")
          );
          const snapshot = await getDocs(shootersQuery);
          const fetchedShooters: Shooter[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shooter));
          setAvailableClubShooters(fetchedShooters);
        } catch (error) {
          console.error("AdminTeamsPage: Error fetching shooters for club:", error);
          toast({ title: "Fehler beim Laden der Schützen", description: (error as Error).message, variant: "destructive" });
          setAvailableClubShooters([]);
        } finally {
          setIsLoadingShootersForDialog(false);
        }
      } else {
        setAvailableClubShooters([]);
      }
    };
    fetchShootersForClubInDialog();
  }, [isFormOpen, currentTeam?.clubId, selectedLeagueId, toast]);

  useEffect(() => {
    if (isFormOpen && formMode === 'edit' && currentTeam?.id && !isLoadingShootersForDialog && availableClubShooters.length > 0) {
        console.log("AdminTeamsPage: DIALOG (EDIT): persistedShooterIdsForTeam (from DB):", persistedShooterIdsForTeam);
        console.log("AdminTeamsPage: DIALOG (EDIT): availableClubShooters (IDs):", availableClubShooters.map(s => s.id));
        const validPersistedShooterIds = (persistedShooterIdsForTeam || []).filter(shooterId =>
            availableClubShooters.some(shooter => shooter.id === shooterId)
        );
        setSelectedShooterIdsInForm(validPersistedShooterIds);
        console.log("AdminTeamsPage: DIALOG (EDIT): Initializing selectedShooterIdsInForm with:", validPersistedShooterIds);
    } else if (isFormOpen && formMode === 'new') {
        setSelectedShooterIdsInForm([]);
    }
  }, [isFormOpen, formMode, currentTeam?.id, isLoadingShootersForDialog, persistedShooterIdsForTeam, availableClubShooters]);


  useEffect(() => {
    const fetchValidationData = async () => {
        const relevantCompetitionYear = currentTeam?.competitionYear || allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear;
        if (isFormOpen && relevantCompetitionYear) { 
            setIsLoadingValidationData(true);
            try {
                const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", relevantCompetitionYear));
                const teamsSnapshot = await getDocs(teamsQuery);
                const teamsForYear = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
                setAllTeamsForYearValidation(teamsForYear);

                const newLeagueTypesMap = new Map<string, UIDisciplineSelection>();
                allLeagues.forEach(league => { 
                    if (teamsForYear.some(t => t.leagueId === league.id)) {
                        newLeagueTypesMap.set(league.id, league.type);
                    }
                });
                setLeagueTypesMapValidation(newLeagueTypesMap);
            } catch (error) {
                console.error("AdminTeamsPage: Validation - Error fetching validation data: ", error);
                setAllTeamsForYearValidation([]);
                setLeagueTypesMapValidation(new Map());
            } finally {
                setIsLoadingValidationData(false);
            }
        } else {
            setAllTeamsForYearValidation([]);
            setLeagueTypesMapValidation(new Map());
        }
    };
    fetchValidationData();
  }, [isFormOpen, currentTeam?.competitionYear, selectedSeasonId, allSeasons, allLeagues]);


  const handleAddNew = () => {
    if (!selectedLeagueId || !selectedSeasonId) {
      toast({ title: "Auswahl erforderlich", description: "Bitte zuerst eine Saison und Liga auswählen.", variant: "destructive" });
      return;
    }
    const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeason) {
      toast({ title: "Fehler", description: "Saisondaten nicht gefunden.", variant: "destructive" });
      return;
    }
    if (allClubs.length === 0) {
      toast({ title: "Keine Vereine", description: "Bitte zuerst Vereine in der Vereinsverwaltung anlegen.", variant: "destructive" });
      return;
    }

    setFormMode('new');
    setCurrentTeam({ 
      leagueId: selectedLeagueId, 
      competitionYear: currentSeason.competitionYear, 
      name: '', 
      clubId: allClubs.length > 0 ? allClubs[0].id : '', 
      shooterIds: [] 
    });
    setSelectedShooterIdsInForm([]); 
    setPersistedShooterIdsForTeam([]);
    setIsFormOpen(true);
  };

  const handleEdit = (team: Team) => {
    if (allClubs.length === 0 && !team.clubId) {
        toast({ title: "Keine Vereine", description: "Vereinsauswahl nicht möglich. Bitte Vereine anlegen.", variant: "destructive" });
    }
    setFormMode('edit');
    setCurrentTeam(team);
    const currentTeamShooterIds = team.shooterIds || [];
    setPersistedShooterIdsForTeam(currentTeamShooterIds); 
    // selectedShooterIdsInForm wird durch useEffect gesetzt
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (team: Team) => {
    setTeamToDelete(team);
    setIsAlertOpen(true);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete || !teamToDelete.id) {
      toast({ title: "Fehler", description: "Keine Mannschaft zum Löschen ausgewählt.", variant: "destructive" });
      setIsAlertOpen(false);
      return;
    }
    
    const teamIdToDelete = teamToDelete.id;
    setIsLoadingDelete(true); 
    try {
      const batch = writeBatch(db);
      const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdToDelete);

      const teamSnap = await getFirestoreDoc(teamDocRef);
      const teamData = teamSnap.data() as Team | undefined;
      const shooterIdsInDeletedTeam = teamData?.shooterIds || [];

      if (shooterIdsInDeletedTeam.length > 0) {
        shooterIdsInDeletedTeam.forEach(shooterId => {
          // Nur versuchen zu aktualisieren, wenn der Schütze noch existiert (theoretisch)
          // Eine robustere Lösung wäre, die Existenz jedes shooterDocs zu prüfen, hier aber vereinfacht
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayRemove(teamIdToDelete) });
        });
      }
      batch.delete(teamDocRef);
      await batch.commit();
      toast({ title: "Mannschaft gelöscht", description: `"${teamToDelete.name}" wurde erfolgreich entfernt.` });
      fetchTeams(); 
    } catch (error) {
      console.error(`Error deleting team ${teamToDelete.id}: `, error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingDelete(false);
      setIsAlertOpen(false);
      setTeamToDelete(null);
    }
  };
  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentTeam || !currentTeam.name?.trim() || !currentTeam.clubId || !currentTeam.leagueId || currentTeam.competitionYear === undefined) {
      toast({ title: "Ungültige Eingabe", description: "Bitte alle erforderlichen Felder ausfüllen.", variant: "destructive" });
      return;
    }

    if (selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM) {
      toast({ title: "Zu viele Schützen", description: `Eine Mannschaft darf maximal ${MAX_SHOOTERS_PER_TEAM} Schützen haben.`, variant: "destructive" });
      return;
    }
    
    const currentLeagueForTeam = availableLeaguesForSeason.find(l => l.id === currentTeam.leagueId) || allLeagues.find(l => l.id === currentTeam.leagueId);
    if (!currentLeagueForTeam) {
        toast({title: "Ligakontext Fehler", description: "Ligatyp für Schützenprüfung nicht gefunden.", variant: "destructive"});
        return;
    }
    const currentTeamLeagueType = currentLeagueForTeam.type;
    const currentTeamCompetitionYear = currentTeam.competitionYear;

    for (const shooterId of selectedShooterIdsInForm) {
        if (formMode === 'new' || !persistedShooterIdsForTeam.includes(shooterId)) {
            for (const teamToCheck of allTeamsForYearValidation) {
                if (formMode === 'edit' && teamToCheck.id === currentTeam.id) continue; 
                const leagueTypeToCheck = leagueTypesMapValidation.get(teamToCheck.leagueId);
                if (teamToCheck.competitionYear === currentTeamCompetitionYear && 
                    leagueTypeToCheck === currentTeamLeagueType && 
                    (teamToCheck.shooterIds || []).includes(shooterId)) {
                    const conflictingShooter = availableClubShooters.find(s => s.id === shooterId);
                    toast({
                        title: "Schütze bereits zugeordnet",
                        description: `${conflictingShooter?.name || 'Ein Schütze'} ist bereits in Team "${teamToCheck.name}" (${leagueTypeToCheck} ${currentTeamCompetitionYear}) gemeldet.`,
                        variant: "destructive",
                        duration: 7000
                    });
                    return;
                }
            }
        }
    }
    
    setIsLoadingForm(true);
    try {
      const teamsCollectionRef = collection(db, TEAMS_COLLECTION);
      let duplicateQuery;
      const baseDuplicateConditions = [
        where("name", "==", currentTeam.name.trim()),
        where("leagueId", "==", currentTeam.leagueId),
        where("competitionYear", "==", currentTeam.competitionYear)
      ];
      if (formMode === 'edit' && currentTeam?.id) {
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions, where(documentId(), "!=", currentTeam.id));
      } else {
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions);
      }
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        toast({ title: "Doppelter Mannschaftsname", description: `Eine Mannschaft mit dem Namen "${currentTeam.name.trim()}" existiert bereits.`, variant: "destructive"});
        setIsLoadingForm(false);
        return; 
      }

      const batch = writeBatch(db);
      let teamIdForShooterUpdates: string;
      
      const teamDataToSave: Omit<Team, 'id'> & { id?: string } = { 
        name: currentTeam.name.trim(),
        clubId: currentTeam.clubId,
        leagueId: currentTeam.leagueId,
        competitionYear: currentTeam.competitionYear,
        shooterIds: selectedShooterIdsInForm, 
      };
      
      const originalShooterIds = formMode === 'edit' ? persistedShooterIdsForTeam : [];
      const shootersToAdd = selectedShooterIdsInForm.filter(id => !originalShooterIds.includes(id));
      const shootersToRemove = originalShooterIds.filter(id => !selectedShooterIdsInForm.includes(id));
      
      console.log(">>> teams/handleSubmit: Original Shooter IDs (persisted):", originalShooterIds);
      console.log(">>> teams/handleSubmit: Selected Shooter IDs in Form (valid & available):", selectedShooterIdsInForm);
      console.log(">>> teams/handleSubmit: Shooters to ADD to their teamIds array:", shootersToAdd);
      console.log(">>> teams/handleSubmit: Shooters to REMOVE from their teamIds array:", shootersToRemove);
      
      if (formMode === 'new') {
        const newTeamRef = doc(collection(db, TEAMS_COLLECTION)); 
        teamIdForShooterUpdates = newTeamRef.id;
        // Ensure teamDataToSave doesn't have 'id' when using set on new ref
        const { id, ...dataForNewTeam } = teamDataToSave;
        batch.set(newTeamRef, dataForNewTeam); 
        toast({ title: "Mannschaft erstellt", description: `"${dataForNewTeam.name}" wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentTeam.id) {
        teamIdForShooterUpdates = currentTeam.id;
        const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdForShooterUpdates);
        // Ensure teamDataToSave doesn't pass 'id' in update payload
        const { id, ...dataForTeamUpdate } = teamDataToSave;
        batch.update(teamDocRef, dataForTeamUpdate); 
        toast({ title: "Mannschaft aktualisiert", description: `"${dataForTeamUpdate.name}" wurde erfolgreich aktualisiert.` });
      } else {
        throw new Error("Invalid form mode or missing team ID for edit.");
      }
      
      shootersToAdd.forEach(shooterId => { 
        // These shooterIds come from selectedShooterIdsInForm, which are filtered by availableClubShooters
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
        console.log(`>>> teams/handleSubmit: Scheduling arrayUnion for shooter ${shooterId} with team ${teamIdForShooterUpdates}`);
        batch.update(shooterDocRef, { teamIds: arrayUnion(teamIdForShooterUpdates) });
      });

      shootersToRemove.forEach(shooterId => {
        // Only attempt to update shooters that are confirmed to be available (exist for this club)
        if (availableClubShooters.some(s => s.id === shooterId)) {
            const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
            console.log(`>>> teams/handleSubmit: Scheduling arrayRemove for existing shooter ${shooterId} from team ${teamIdForShooterUpdates}`);
            batch.update(shooterDocRef, { teamIds: arrayRemove(teamIdForShooterUpdates) });
        } else {
            console.warn(`>>> teams/handleSubmit: SKIPPING arrayRemove for shooter ${shooterId} (not in availableClubShooters or no longer exists) from team ${teamIdForShooterUpdates}`);
        }
      });
      
      await batch.commit();
      setIsFormOpen(false);
      setCurrentTeam(null);
      setSelectedShooterIdsInForm([]); 
      setPersistedShooterIdsForTeam([]);
      fetchTeams();
    } catch (error) {
      console.error("Error saving team or updating shooters: ", error);
      const action = formMode === 'new' ? 'erstellen' : 'aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Team, 'name' | 'clubId'>, value: string) => {
    setCurrentTeam(prev => {
        if (!prev) return null;
        const updatedTeam = { ...prev, [field]: value };
        if (field === 'clubId' && prev.clubId !== value) {
            setSelectedShooterIdsInForm([]); 
            setAvailableClubShooters([]); 
        }
        return updatedTeam as Partial<Team>; 
    });
  };

 const handleShooterSelectionChange = (shooterId: string, checked: boolean) => {
    const currentLeagueForTeam = availableLeaguesForSeason.find(l => l.id === currentTeam?.leagueId) || allLeagues.find(l => l.id === currentTeam?.leagueId);
    const currentTeamLeagueType = currentLeagueForTeam?.type;
    const currentTeamCompetitionYear = currentTeam?.competitionYear;

    if (checked) {
      if (selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) {
          toast({ title: "Maximale Schützenzahl erreicht", description: `Maximal ${MAX_SHOOTERS_PER_TEAM} Schützen pro Team.`, variant: "destructive"});
          return; 
      }
      if (currentTeamCompetitionYear && currentTeamLeagueType) {
          for (const teamToCheck of allTeamsForYearValidation) {
              if (formMode === 'edit' && teamToCheck.id === currentTeam?.id) continue;
              const leagueTypeToCheck = leagueTypesMapValidation.get(teamToCheck.leagueId);
              if (teamToCheck.competitionYear === currentTeamCompetitionYear && 
                  leagueTypeToCheck === currentTeamLeagueType && 
                  (teamToCheck.shooterIds || []).includes(shooterId)) {
                  const conflictingShooter = availableClubShooters.find(s => s.id === shooterId);
                   toast({ title: "Schütze bereits zugeordnet", description: `${conflictingShooter?.name || 'Schütze'} ist bereits in Team "${teamToCheck.name}" (${leagueTypeToCheck} ${currentTeamCompetitionYear}) gemeldet.`, variant: "destructive", duration: 7000 });
                   return; 
               }
          }
      }
    }

    setSelectedShooterIdsInForm(prevSelectedIds =>
      checked ? [...prevSelectedIds, shooterId] : prevSelectedIds.filter(id => id !== shooterId)
    );
  };
  
  const navigateToShootersAdmin = (clubIdOfTeam: string, teamId?: string) => {
    if (!clubIdOfTeam) {
        console.error("AdminTeamsPage: navigateToShootersAdmin - clubId is missing for team.");
        toast({title: "Fehler", description: "Vereins-ID der Mannschaft nicht gefunden.", variant: "destructive"});
        return;
    }
    let path = `/admin/shooters?clubId=${clubIdOfTeam}`;
    if (teamId && selectedSeasonId && selectedLeagueId) { 
      path += `&teamId=${teamId}&seasonId=${selectedSeasonId}&leagueId=${selectedLeagueId}`;
    }
    router.push(path);
  };

  const selectedSeason = allSeasons.find(s => s.id === selectedSeasonId);
  const selectedLeague = availableLeaguesForSeason.find(l => l.id === selectedLeagueId);
  const selectedSeasonName = selectedSeason?.name || (isLoadingData ? 'Lade...' : 'Saison');
  const selectedLeagueName = selectedLeague?.name || (isLoadingData ? 'Lade...' : (selectedSeasonId ? 'Liga' : ''));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold text-primary w-full sm:w-auto">Mannschaftsverwaltung</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId} disabled={isLoadingData || allSeasons.length === 0}>
            <SelectTrigger className="w-full sm:w-[200px]" aria-label="Saison auswählen">
              <SelectValue placeholder={isLoadingData ? "Lade Saisons..." : (allSeasons.length === 0 ? "Keine Saisons" : "Saison wählen")} />
            </SelectTrigger>
            <SelectContent>
              {allSeasons.length > 0 ? 
                allSeasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>) :
                <SelectItem value="no-season" disabled>Keine Saisons verfügbar</SelectItem>
              }
            </SelectContent>
          </Select>
          <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId} disabled={isLoadingData || !selectedSeasonId || availableLeaguesForSeason.length === 0}>
            <SelectTrigger className="w-full sm:w-[200px]" aria-label="Liga auswählen">
              <SelectValue placeholder={isLoadingData ? "Lade Ligen..." : (!selectedSeasonId ? "Saison wählen" : (availableLeaguesForSeason.length === 0 ? "Keine Ligen" : "Liga wählen"))} />
            </SelectTrigger>
            <SelectContent>
              {availableLeaguesForSeason.length > 0 ? 
                availableLeaguesForSeason.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>) :
                <SelectItem value="no-league" disabled>{isLoadingData ? "Lade..." : (selectedSeasonId ? 'Keine Ligen für Saison' : 'Saison wählen')}</SelectItem>
              }
            </SelectContent>
          </Select>
          <Button onClick={handleAddNew} disabled={isLoadingData || !selectedLeagueId || allClubs.length === 0} className="whitespace-nowrap w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft
          </Button>
        </div>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Mannschaften in {selectedLeagueName} ({selectedSeasonName})</CardTitle>
          <CardDescription>
            Verwalten Sie hier die Mannschaften für die ausgewählte Liga und Saison.
            {allClubs.length === 0 && !isLoadingData && <span className="text-destructive block mt-1"> Hinweis: Keine Vereine angelegt.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoadingTeams ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3">Lade Mannschaften...</p>
            </div>
           ) : teams.length > 0 ? (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Schützen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell className="text-center">{team.shooterIds?.length || 0} / {MAX_SHOOTERS_PER_TEAM}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => navigateToShootersAdmin(team.clubId, team.id)} disabled={!team.clubId}>
                        <Users className="mr-1 h-4 w-4" /> Schützen verwalten
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(team)} aria-label="Mannschaft bearbeiten">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteConfirmation(team)} className="text-destructive hover:text-destructive/80" aria-label="Mannschaft löschen">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p className="text-lg">
                {isLoadingData ? 'Lade Filterdaten...' : 
                 (!selectedSeasonId ? 'Saison wählen.' : 
                 (!selectedLeagueId ? 'Liga wählen.' : 
                 (allClubs.length === 0 ? 'Vereine anlegen.' :
                 `Keine Mannschaften für ${selectedLeagueName}.`)))}
              </p>
               {!isLoadingData && selectedSeasonId && selectedLeagueId && allClubs.length > 0 && teams.length === 0 && (
                <p className="text-sm mt-1">Klicken Sie auf "Neue Mannschaft".</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) {setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]);} }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}</DialogTitle>
              <DialogDescription>
                Für Liga: {selectedLeague?.name || 'Unbekannte Liga'} (Saison: {selectedSeason?.name || 'Unbekannte Saison'})
              </DialogDescription>
            </DialogHeader>
            {currentTeam && (
              <div className="space-y-4 py-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="teamNameDialog" className="block mb-1.5">Name der Mannschaft</Label>
                        <Input 
                        id="teamNameDialog" 
                        value={currentTeam.name || ''} 
                        onChange={(e) => handleFormInputChange('name', e.target.value)} 
                        placeholder="z.B. Verein XY I"
                        required 
                        />
                    </div>
                    <div>
                        <Label htmlFor="clubIdDialog" className="block mb-1.5">Verein</Label>
                        <Select 
                        value={currentTeam.clubId || ''} 
                        onValueChange={(value) => handleFormInputChange('clubId', value)}
                        required
                        disabled={allClubs.length === 0}
                        >
                            <SelectTrigger id="clubIdDialog" aria-label="Verein auswählen">
                                <SelectValue placeholder={allClubs.length === 0 ? "Keine Vereine" : "Verein wählen"}/>
                            </SelectTrigger>
                            <SelectContent>
                                {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <Label>Schützen für diese Mannschaft auswählen</Label>
                    <span className="text-sm text-muted-foreground">
                      {selectedShooterIdsInForm.length} / {MAX_SHOOTERS_PER_TEAM} ausgewählt
                    </span>
                  </div>
                  {isLoadingShootersForDialog || isLoadingValidationData ? (
                     <div className="flex items-center justify-center p-4 h-48 border rounded-md bg-muted/30"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2">Lade Schützen...</p></div>
                  ) : availableClubShooters.length > 0 ? (
                    <ScrollArea className="h-48 rounded-md border p-2 bg-muted/20">
                      <div className="space-y-1">
                      {availableClubShooters.map(shooter => {
                        const isSelected = selectedShooterIdsInForm.includes(shooter.id);
                        const isDisabledByMax = !isSelected && selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM;
                        return (
                            <div key={shooter.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-md">
                            <Checkbox
                                id={`shooter-${shooter.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => handleShooterSelectionChange(shooter.id, !!checked)}
                                disabled={isDisabledByMax || isLoadingValidationData}
                            />
                            <Label htmlFor={`shooter-${shooter.id}`} className={`font-normal cursor-pointer flex-grow ${(isDisabledByMax || isLoadingValidationData) ? 'opacity-50' : '' }`}>
                                {shooter.name}
                                <span className='text-xs text-muted-foreground ml-1'>(Schnitt Vorjahr: folgt)</span>
                            </Label>
                            </div>
                        );
                      })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 h-48 border rounded-md flex items-center justify-center bg-muted/30">
                      <p>
                        {currentTeam?.clubId ? 
                          `Keine Schützen für '${allClubs.find(c => c.id === currentTeam?.clubId)?.name || 'Verein'}'` : 
                          'Verein wählen.'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <Label htmlFor="leagueDisplay" className="block mb-1.5">Liga</Label>
                        <Input id="leagueDisplay" value={selectedLeague?.name || ''} disabled className="bg-muted/50" />
                    </div>
                    <div>
                        <Label htmlFor="seasonDisplay" className="block mb-1.5">Saison</Label>
                        <Input id="seasonDisplay" value={selectedSeason?.name || ''} disabled className="bg-muted/50" />
                    </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]);}}>Abbrechen</Button>
              <Button 
                type="submit" 
                disabled={isLoadingForm || (allClubs.length === 0 && !currentTeam?.clubId ) || selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM || isLoadingShootersForDialog || isLoadingValidationData}
              >
                 {(isLoadingForm || isLoadingShootersForDialog || isLoadingValidationData) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {teamToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mannschaft löschen bestätigen</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie die Mannschaft "{teamToDelete.name}" wirklich endgültig löschen? Dies entfernt auch die Zuordnung der Schützen zu dieser Mannschaft.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setTeamToDelete(null); }}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTeam}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isLoadingDelete}
              >
                {isLoadingDelete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Endgültig löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
    
