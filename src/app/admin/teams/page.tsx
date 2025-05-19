
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
  const [allLeagues, setAllLeagues] = useState<League[]>([]); // Alle jemals geladenen Ligen
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  
  const [availableClubShooters, setAvailableClubShooters] = useState<Shooter[]>([]);
  const [isLoadingShootersForDialog, setIsLoadingShootersForDialog] = useState(false);

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [availableLeaguesForSeason, setAvailableLeaguesForSeason] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  
  const [teams, setTeams] = useState<Team[]>([]); // Teams für die ausgewählte Liga/Saison
  
  const [isLoadingData, setIsLoadingData] = useState(true); // Für initiales Laden von Saisons, Ligen, Vereinen
  const [isLoadingTeams, setIsLoadingTeams] = useState(false); // Für das Laden der Teams der ausgewählten Liga
  const [isLoadingForm, setIsLoadingForm] = useState(false); // Für Speichern-Aktion im Formular
  const [isLoadingDelete, setIsLoadingDelete] = useState(false); // Für Löschen-Aktion

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team> & { id?: string } | null>(null);
  const [persistedShooterIdsForTeam, setPersistedShooterIdsForTeam] = useState<string[]>([]);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const [selectedShooterIdsInForm, setSelectedShooterIdsInForm] = useState<string[]>([]);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  // Daten für Schützen-Validierung (1 Schütze pro Saison/Typ)
  const [allTeamsForYearValidation, setAllTeamsForYearValidation] = useState<Team[]>([]);
  const [leagueTypesMapValidation, setLeagueTypesMapValidation] = useState<Map<string, UIDisciplineSelection>>(new Map());
  const [isLoadingValidationData, setIsLoadingValidationData] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      console.log("AdminTeamsPage: fetchInitialData called");
      setIsLoadingData(true);
      try {
        console.log("AdminTeamsPage: Fetching seasons...");
        const seasonsSnapshot = await getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
        const fetchedSeasons: Season[] = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
        setAllSeasons(fetchedSeasons);
        console.log("AdminTeamsPage: Seasons fetched:", fetchedSeasons.length, fetchedSeasons.map(s => s.id));
        if (fetchedSeasons.length === 0) toast({ title: "Keine Saisons gefunden", description: "Bitte zuerst Saisons anlegen.", variant: "destructive" });

        console.log("AdminTeamsPage: Fetching all leagues...");
        const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
        const fetchedLeagues: League[] = leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
        setAllLeagues(fetchedLeagues);
        console.log("AdminTeamsPage: All leagues fetched:", fetchedLeagues.length);
        fetchedLeagues.forEach(l => console.log(`AdminTeamsPage: League Detail - ID: ${l.id}, Name: ${l.name}, SeasonID: ${l.seasonId}`));


        console.log("AdminTeamsPage: Fetching clubs...");
        const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
        const fetchedClubs: Club[] = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
        setAllClubs(fetchedClubs);
        console.log("AdminTeamsPage: Clubs fetched:", fetchedClubs.length);

        if (querySeasonId && fetchedSeasons.some(s => s.id === querySeasonId)) {
          setSelectedSeasonId(querySeasonId);
           console.log("AdminTeamsPage: Initial selectedSeasonId set from query param:", querySeasonId);
        } else if (fetchedSeasons.length > 0) {
          setSelectedSeasonId(fetchedSeasons[0].id);
          console.log("AdminTeamsPage: Initial selectedSeasonId set to first fetched season:", fetchedSeasons[0].id);
        } else {
          setSelectedSeasonId('');
          console.log("AdminTeamsPage: No seasons fetched, selectedSeasonId set to empty.");
        }

      } catch (error) {
        console.error("AdminTeamsPage: Error fetching initial data: ", error);
        toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingData(false);
        console.log("AdminTeamsPage: fetchInitialData finished. isLoadingData:", false);
      }
    };
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [querySeasonId]); 

  useEffect(() => {
    console.log("AdminTeamsPage: selectedSeasonId or allLeagues changed. Current selectedSeasonId:", selectedSeasonId);
    if (selectedSeasonId && allLeagues.length > 0) {
      const leaguesForCurrentSeason = allLeagues
        .filter(l => l.seasonId === selectedSeasonId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setAvailableLeaguesForSeason(leaguesForCurrentSeason);
      console.log(`AdminTeamsPage: Available leagues for season ${selectedSeasonId}: ${leaguesForCurrentSeason.length}`, leaguesForCurrentSeason.map(l=> ({id: l.id, name: l.name, seasonId: l.seasonId})));
      
      if (queryLeagueId && leaguesForCurrentSeason.some(l => l.id === queryLeagueId)) {
        setSelectedLeagueId(queryLeagueId);
         console.log("AdminTeamsPage: Initial selectedLeagueId set from query param:", queryLeagueId);
      } else if (leaguesForCurrentSeason.length > 0) {
        setSelectedLeagueId(leaguesForCurrentSeason[0].id);
        console.log("AdminTeamsPage: Initial selectedLeagueId set to first available league:", leaguesForCurrentSeason[0].id);
      } else {
        setSelectedLeagueId('');
         console.log("AdminTeamsPage: No leagues available for selected season, selectedLeagueId set to empty.");
      }
    } else {
      setAvailableLeaguesForSeason([]);
      setSelectedLeagueId('');
      console.log("AdminTeamsPage: No season selected or no leagues loaded, clearing availableLeaguesForSeason and selectedLeagueId.");
    }
  }, [selectedSeasonId, allLeagues, queryLeagueId]);

  const fetchTeams = useMemo(() => async () => {
    if (!selectedLeagueId || !selectedSeasonId) {
      setTeams([]);
      console.log("AdminTeamsPage: fetchTeams - No league or season selected, clearing teams.");
      return;
    }
    const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeason) {
      setTeams([]);
      console.warn("AdminTeamsPage: fetchTeams - Current season not found for ID:", selectedSeasonId);
      return;
    }

    console.log(`AdminTeamsPage: fetchTeams - Fetching teams for league ${selectedLeagueId} (Season ${selectedSeasonId}, Year ${currentSeason.competitionYear})`);
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
      console.log("AdminTeamsPage: fetchTeams - Teams fetched:", fetchedTeams.length);
    } catch (error) {
      console.error("AdminTeamsPage: fetchTeams - Error fetching teams: ", error);
      toast({ title: "Fehler beim Laden der Mannschaften", description: (error as Error).message, variant: "destructive" });
      setTeams([]);
    } finally {
      setIsLoadingTeams(false);
      console.log("AdminTeamsPage: fetchTeams - Finished. isLoadingTeams:", false);
    }
  }, [selectedLeagueId, selectedSeasonId, allSeasons, toast]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Load shooters for the club of the current team when dialog opens for editing/new
  useEffect(() => {
    const fetchShootersForClubInDialog = async () => {
      if (isFormOpen && currentTeam?.clubId && selectedLeagueId) {
        console.log(`AdminTeamsPage: fetchShootersForClubInDialog - Fetching shooters for clubId ${currentTeam.clubId}`);
        setIsLoadingShootersForDialog(true);
        try {
          const shootersQuery = query(
            collection(db, SHOOTERS_COLLECTION),
            where("clubId", "==", currentTeam.clubId),
            orderBy("name", "asc") // Using combined name field
          );
          const snapshot = await getDocs(shootersQuery);
          const fetchedShooters: Shooter[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shooter));
          setAvailableClubShooters(fetchedShooters);
          console.log(`AdminTeamsPage: fetchShootersForClubInDialog - Fetched ${fetchedShooters.length} shooters for club ${currentTeam.clubId}`);
        } catch (error) {
          console.error("AdminTeamsPage: fetchShootersForClubInDialog - Error fetching shooters for club:", error);
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

  // Initialize selectedShooterIdsInForm when dialog opens for edit, AFTER shooters are loaded
  useEffect(() => {
    if (isFormOpen && formMode === 'edit' && currentTeam?.clubId && !isLoadingShootersForDialog) {
      const validPersistedShooterIds = (persistedShooterIdsForTeam || []).filter(shooterId =>
        availableClubShooters.some(shooter => shooter.id === shooterId)
      );
      setSelectedShooterIdsInForm(validPersistedShooterIds);
      // --- ADDED LOGGING ---
      console.log("AdminTeamsPage: DIALOG (EDIT): persistedShooterIdsForTeam:", persistedShooterIdsForTeam);
      console.log("AdminTeamsPage: DIALOG (EDIT): availableClubShooters (IDs):", availableClubShooters.map(s => s.id));
      console.log("AdminTeamsPage: DIALOG (EDIT): Calculated validPersistedShooterIds (for selectedShooterIdsInForm):", validPersistedShooterIds);
      // --- END ADDED LOGGING ---
    } else if (isFormOpen && formMode === 'new') {
      setSelectedShooterIdsInForm([]);
    }
  }, [isFormOpen, formMode, currentTeam?.clubId, isLoadingShootersForDialog, persistedShooterIdsForTeam, availableClubShooters]);


  // Effect to load data for "one shooter per team/season/type" validation
  useEffect(() => {
    const fetchValidationData = async () => {
        const relevantCompetitionYear = currentTeam?.competitionYear || allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear;
        if (isFormOpen && relevantCompetitionYear) { 
            console.log(`AdminTeamsPage: Validation - Fetching teams for year ${relevantCompetitionYear}`);
            setIsLoadingValidationData(true);
            try {
                const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", relevantCompetitionYear));
                const teamsSnapshot = await getDocs(teamsQuery);
                const teamsForYear = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
                setAllTeamsForYearValidation(teamsForYear);
                console.log(`AdminTeamsPage: Validation - Fetched ${teamsForYear.length} teams for year ${relevantCompetitionYear}`);

                const newLeagueTypesMap = new Map<string, UIDisciplineSelection>();
                allLeagues.forEach(league => { 
                    if (teamsForYear.some(t => t.leagueId === league.id)) {
                        newLeagueTypesMap.set(league.id, league.type);
                    }
                });
                setLeagueTypesMapValidation(newLeagueTypesMap);
                console.log(`AdminTeamsPage: Validation - League types map created for year ${relevantCompetitionYear}:`, newLeagueTypesMap);

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
    // setSelectedShooterIdsInForm will be set by the useEffect based on availableClubShooters and persistedShooterIdsForTeam
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
    console.log(`>>> teams/handleDeleteTeam: Attempting to delete team ${teamIdToDelete}`);
    setIsLoadingDelete(true); 
    try {
      const batch = writeBatch(db);
      const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdToDelete);

      const teamSnap = await getFirestoreDoc(teamDocRef);
      const teamData = teamSnap.data() as Team | undefined;
      const shooterIdsInDeletedTeam = teamData?.shooterIds || [];

      if (shooterIdsInDeletedTeam.length > 0) {
        console.log(`>>> teams/handleDeleteTeam: Removing team ${teamIdToDelete} from ${shooterIdsInDeletedTeam.length} shooters' teamIds arrays.`);
        shooterIdsInDeletedTeam.forEach(shooterId => {
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayRemove(teamIdToDelete) });
        });
      }
      batch.delete(teamDocRef);
      console.log(`>>> teams/handleDeleteTeam: Scheduled deletion of team document ${teamIdToDelete} and updates to shooters.`);
      
      await batch.commit();
      console.log(`>>> teams/handleDeleteTeam: Batch committed. Team ${teamIdToDelete} deleted and shooter associations removed.`);

      toast({ title: "Mannschaft gelöscht", description: `"${teamToDelete.name}" wurde erfolgreich entfernt.` });
      fetchTeams(); 
    } catch (error) {
      console.error(`>>> teams/handleDeleteTeam: Error deleting team ${teamToDelete.id}: `, error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingDelete(false);
      setIsAlertOpen(false);
      setTeamToDelete(null);
    }
  };
  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(">>> teams/handleSubmit: Form submitted.");
    if (!currentTeam || !currentTeam.name?.trim() || !currentTeam.clubId || !currentTeam.leagueId || currentTeam.competitionYear === undefined) {
      toast({ title: "Ungültige Eingabe", description: "Bitte alle erforderlichen Felder ausfüllen.", variant: "destructive" });
      console.warn(">>> teams/handleSubmit: Invalid form input.", currentTeam);
      return;
    }

    if (selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM) {
      toast({ title: "Zu viele Schützen", description: `Eine Mannschaft darf maximal ${MAX_SHOOTERS_PER_TEAM} Schützen haben. Aktuell ausgewählt: ${selectedShooterIdsInForm.length}.`, variant: "destructive" });
      return;
    }
    
    const currentLeagueForTeam = availableLeaguesForSeason.find(l => l.id === currentTeam.leagueId) || allLeagues.find(l => l.id === currentTeam.leagueId);
    if (!currentLeagueForTeam) {
        toast({title: "Ligakontext Fehler", description: "Ligatyp für Schützenprüfung nicht gefunden.", variant: "destructive"});
        setIsLoadingForm(false);
        return;
    }
    const currentTeamLeagueType = currentLeagueForTeam.type;
    const currentTeamCompetitionYear = currentTeam.competitionYear;

    for (const shooterId of selectedShooterIdsInForm) {
        // Nur für neu hinzugefügte Schützen prüfen oder wenn sich der Schütze ändert.
        if (formMode === 'new' || !persistedShooterIdsForTeam.includes(shooterId)) {
            for (const teamToCheck of allTeamsForYearValidation) {
                // Überspringe das aktuelle Team bei der Prüfung im Edit-Modus
                if (formMode === 'edit' && teamToCheck.id === currentTeam.id) continue; 
    
                const leagueTypeToCheck = leagueTypesMapValidation.get(teamToCheck.leagueId);

                if (teamToCheck.competitionYear === currentTeamCompetitionYear && 
                    leagueTypeToCheck === currentTeamLeagueType && 
                    (teamToCheck.shooterIds || []).includes(shooterId)) {
                    
                    const conflictingShooter = availableClubShooters.find(s => s.id === shooterId);
                    toast({
                        title: "Schütze bereits zugeordnet",
                        description: `${conflictingShooter?.name || 'Ein Schütze'} ist bereits in Team "${teamToCheck.name}" (${leagueTypeToCheck} ${currentTeamCompetitionYear}) gemeldet. Ein Schütze darf pro Saison und Disziplin nur einer Mannschaft angehören.`,
                        variant: "destructive",
                        duration: 7000
                    });
                    setIsLoadingForm(false); 
                    return;
                }
            }
        }
    }

    const teamDataToSave: Omit<Team, 'id'> = { 
      name: currentTeam.name.trim(),
      clubId: currentTeam.clubId,
      leagueId: currentTeam.leagueId,
      competitionYear: currentTeam.competitionYear,
      shooterIds: selectedShooterIdsInForm, 
    };
    console.log(">>> teams/handleSubmit: Team data to save:", teamDataToSave);
    
    setIsLoadingForm(true);

    try {
      const teamsCollectionRef = collection(db, TEAMS_COLLECTION);
      let duplicateQuery;

      const baseDuplicateConditions = [
        where("name", "==", teamDataToSave.name),
        where("leagueId", "==", teamDataToSave.leagueId),
        where("competitionYear", "==", teamDataToSave.competitionYear)
      ];

      if (formMode === 'edit' && currentTeam?.id) {
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions, where(documentId(), "!=", currentTeam.id));
      } else {
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions);
      }
      
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        toast({
          title: "Doppelter Mannschaftsname",
          description: `Eine Mannschaft mit dem Namen "${teamDataToSave.name}" existiert bereits in dieser Liga und Saison.`,
          variant: "destructive",
        });
        setIsLoadingForm(false);
        return; 
      }

      const batch = writeBatch(db);
      let teamIdForShooterUpdates: string;
      
      const originalShooterIds = persistedShooterIdsForTeam; // Genutzt für Vergleich im Edit-Modus
      const shootersToAdd = selectedShooterIdsInForm.filter(id => !originalShooterIds.includes(id));
      const shootersToRemove = originalShooterIds.filter(id => !selectedShooterIdsInForm.includes(id));
      
      console.log(">>> teams/handleSubmit: Original Shooter IDs (persisted):", originalShooterIds);
      console.log(">>> teams/handleSubmit: Selected Shooter IDs in Form:", selectedShooterIdsInForm);
      console.log(">>> teams/handleSubmit: Shooters to ADD to their teamIds array:", shootersToAdd);
      console.log(">>> teams/handleSubmit: Shooters to REMOVE from their teamIds array:", shootersToRemove);

      if (formMode === 'new') {
        const newTeamRef = doc(collection(db, TEAMS_COLLECTION)); 
        teamIdForShooterUpdates = newTeamRef.id;
        batch.set(newTeamRef, teamDataToSave); 
        toast({ title: "Mannschaft erstellt", description: `"${teamDataToSave.name}" wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentTeam.id) {
        teamIdForShooterUpdates = currentTeam.id;
        const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdForShooterUpdates);
        batch.update(teamDocRef, teamDataToSave); 
        toast({ title: "Mannschaft aktualisiert", description: `"${teamDataToSave.name}" wurde erfolgreich aktualisiert.` });
      } else {
        throw new Error(">>> teams/handleSubmit: Invalid form mode or missing team ID for edit.");
      }
      
      shootersToAdd.forEach(shooterId => { 
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
        batch.update(shooterDocRef, { teamIds: arrayUnion(teamIdForShooterUpdates) });
      });
      shootersToRemove.forEach(shooterId => {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
        batch.update(shooterDocRef, { teamIds: arrayRemove(teamIdForShooterUpdates) });
      });
      
      await batch.commit();

      setIsFormOpen(false);
      setCurrentTeam(null);
      setSelectedShooterIdsInForm([]); 
      setPersistedShooterIdsForTeam([]);
      fetchTeams();
    } catch (error) {
      console.error(">>> teams/handleSubmit: Error saving team or updating shooters: ", error);
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
      // Rule: Max 3 shooters per team
      if (selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) {
          toast({
              title: "Maximale Schützenzahl erreicht",
              description: `Eine Mannschaft darf nicht mehr als ${MAX_SHOOTERS_PER_TEAM} Schützen haben.`,
              variant: "destructive",
          });
          return; 
      }
      // Rule: Shooter can only be in one team per season/type
      if (currentTeamCompetitionYear && currentTeamLeagueType) {
          for (const teamToCheck of allTeamsForYearValidation) {
              if (formMode === 'edit' && teamToCheck.id === currentTeam?.id) continue;

              const leagueTypeToCheck = leagueTypesMapValidation.get(teamToCheck.leagueId);
              if (teamToCheck.competitionYear === currentTeamCompetitionYear && 
                  leagueTypeToCheck === currentTeamLeagueType && 
                  (teamToCheck.shooterIds || []).includes(shooterId)) {
                  
                  const conflictingShooter = availableClubShooters.find(s => s.id === shooterId);
                   toast({
                       title: "Schütze bereits zugeordnet",
                       description: `${conflictingShooter?.name || 'Ein Schütze'} ist bereits in Team "${teamToCheck.name}" (${leagueTypeToCheck} ${currentTeamCompetitionYear}) gemeldet. Ein Schütze darf pro Saison und Disziplin nur einer Mannschaft angehören.`,
                       variant: "destructive",
                       duration: 7000
                   });
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
            {allClubs.length === 0 && !isLoadingData && <span className="text-destructive block mt-1"> Hinweis: Keine Vereine angelegt. Bitte zuerst Vereine erstellen.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoadingTeams ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-3">Lade Mannschaften...</p>
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
                 (!selectedSeasonId ? 'Bitte wählen Sie eine Saison aus.' : 
                 (!selectedLeagueId ? 'Bitte wählen Sie eine Liga aus.' : 
                 (allClubs.length === 0 ? 'Bitte zuerst Vereine anlegen, um Mannschaften erstellen zu können.' :
                 `Keine Mannschaften für ${selectedLeagueName} in Saison ${selectedSeasonName} angelegt.`)))}
              </p>
               {!isLoadingData && selectedSeasonId && selectedLeagueId && allClubs.length > 0 && teams.length === 0 && (
                <p className="text-sm mt-1">Klicken Sie auf "Neue Mannschaft", um zu beginnen.</p>
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
                <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4"> 
                  <div className="space-y-1.5">
                    <Label htmlFor="teamName">Name der Mannschaft</Label>
                    <Input 
                      id="teamName" 
                      value={currentTeam.name || ''} 
                      onChange={(e) => handleFormInputChange('name', e.target.value)} 
                      placeholder="z.B. Verein XY I"
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="clubIdDialog">Verein</Label> {/* Geänderte ID um Kollision zu vermeiden */}
                    <Select 
                      value={currentTeam.clubId || ''} 
                      onValueChange={(value) => handleFormInputChange('clubId', value)}
                      required
                      disabled={allClubs.length === 0}
                    >
                        <SelectTrigger id="clubIdDialog" aria-label="Verein auswählen">
                            <SelectValue placeholder={allClubs.length === 0 ? "Keine Vereine verfügbar" : "Verein wählen"}/>
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
                      {availableClubShooters.map(shooter => (
                        <div key={shooter.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-md">
                          <Checkbox
                            id={`shooter-${shooter.id}`}
                            checked={selectedShooterIdsInForm.includes(shooter.id)}
                            onCheckedChange={(checked) => handleShooterSelectionChange(shooter.id, !!checked)}
                            disabled={
                                (!selectedShooterIdsInForm.includes(shooter.id) && 
                                selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) || isLoadingValidationData
                            }
                          />
                          <Label htmlFor={`shooter-${shooter.id}`} className={`font-normal cursor-pointer flex-grow ${(isLoadingValidationData && !selectedShooterIdsInForm.includes(shooter.id) && selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) ? 'opacity-50' : '' }`}>
                            {shooter.name}
                            <span className='text-xs text-muted-foreground ml-1'>(Schnitt Vorjahr: folgt)</span>
                          </Label>
                        </div>
                      ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 h-48 border rounded-md flex items-center justify-center bg-muted/30">
                      <p>
                        {currentTeam?.clubId ? 
                          `Keine Schützen für den Verein '${allClubs.find(c => c.id === currentTeam?.clubId)?.name || 'ausgewählten Verein'}' gefunden.` : 
                          'Bitte zuerst einen Verein auswählen, um Schützen laden zu können.'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="leagueDisplay">Liga</Label>
                        <Input id="leagueDisplay" value={selectedLeague?.name || ''} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="seasonDisplay">Saison</Label>
                        <Input id="seasonDisplay" value={selectedSeason?.name || ''} disabled className="bg-muted/50" />
                    </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]);}}>Abbrechen</Button>
              <Button 
                type="submit" 
                disabled={
                  isLoadingForm || 
                  (allClubs.length === 0 && !currentTeam?.clubId ) || 
                  selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM ||
                  isLoadingShootersForDialog ||
                  isLoadingValidationData
                }
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
                Möchten Sie die Mannschaft "{teamToDelete.name}" wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden und entfernt die Mannschaft auch aus den Zuordnungen der Schützen.
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

    