
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
import type { Season, League, Club, Team, Shooter, UIDisciplineSelection, TeamValidationInfo } from '@/types/rwk';
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

  const [allTeamsForYearValidation, setAllTeamsForYearValidation] = useState<TeamValidationInfo[]>([]);
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
        console.log("AdminTeamsPage: Seasons fetched:", fetchedSeasons.length);
        if (fetchedSeasons.length === 0) toast({ title: "Keine Saisons gefunden", description: "Bitte zuerst Saisons anlegen.", variant: "destructive" });

        const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
        const fetchedLeagues: League[] = leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
        setAllLeagues(fetchedLeagues);
        console.log("AdminTeamsPage: All leagues fetched:", fetchedLeagues.length, fetchedLeagues.map(l => ({id: l.id, name: l.name, seasonId: l.seasonId, type: l.type })));


        const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
        const fetchedClubs: Club[] = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
        setAllClubs(fetchedClubs);
        console.log("AdminTeamsPage: Clubs fetched:", fetchedClubs.length);

        if (querySeasonId && fetchedSeasons.some(s => s.id === querySeasonId)) {
          setSelectedSeasonId(querySeasonId);
          console.log("AdminTeamsPage: Initial selectedSeasonId set from query param:", querySeasonId);
        } else if (fetchedSeasons.length > 0) {
          setSelectedSeasonId(fetchedSeasons[0].id);
          console.log("AdminTeamsPage: Initial selectedSeasonId set to first available season:", fetchedSeasons[0].id);
        } else {
          setSelectedSeasonId('');
          console.log("AdminTeamsPage: No seasons available, selectedSeasonId set to empty.");
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
  }, [querySeasonId, toast]); 

  useEffect(() => {
    console.log("AdminTeamsPage: selectedSeasonId or allLeagues changed. Current selectedSeasonId:", selectedSeasonId, "All leagues count:", allLeagues.length);
    if (selectedSeasonId && allLeagues.length > 0) {
      const leaguesForCurrentSeason = allLeagues
        .filter(l => l.seasonId === selectedSeasonId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setAvailableLeaguesForSeason(leaguesForCurrentSeason);
      console.log(`AdminTeamsPage: Available leagues for season ${selectedSeasonId}: ${leaguesForCurrentSeason.length}`);
      
      if (queryLeagueId && leaguesForCurrentSeason.some(l => l.id === queryLeagueId)) {
        setSelectedLeagueId(queryLeagueId);
        console.log("AdminTeamsPage: Current selectedLeagueId set from query param:", queryLeagueId);
      } else if (leaguesForCurrentSeason.length > 0) {
        setSelectedLeagueId(leaguesForCurrentSeason[0].id);
        console.log("AdminTeamsPage: Current selectedLeagueId set to first available league:", leaguesForCurrentSeason[0].id);
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
      console.log("AdminTeamsPage: fetchTeams - Current season data not found, clearing teams.");
      return;
    }
    console.log(`AdminTeamsPage: fetchTeams - Fetching teams for leagueId ${selectedLeagueId} and competitionYear ${currentSeason.competitionYear}`);
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
      console.error("AdminTeamsPage: Error fetching teams: ", error);
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

  useEffect(() => {
    const fetchShootersForClubInDialog = async () => {
      if (isFormOpen && currentTeam?.clubId && selectedLeagueId) {
        setIsLoadingShootersForDialog(true);
        console.log("AdminTeamsPage: DIALOG - Fetching shooters for clubId:", currentTeam.clubId);
        try {
          const shootersQuery = query(
            collection(db, SHOOTERS_COLLECTION),
            where("clubId", "==", currentTeam.clubId),
            orderBy("name", "asc")
          );
          const snapshot = await getDocs(shootersQuery);
          const fetchedShooters: Shooter[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shooter));
          setAvailableClubShooters(fetchedShooters);
          console.log("AdminTeamsPage: DIALOG - Fetched shooters for club:", fetchedShooters.length);
        } catch (error) {
          console.error("AdminTeamsPage: DIALOG - Error fetching shooters for club:", error);
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
    if (isFormOpen && formMode === 'edit' && currentTeam?.id && !isLoadingShootersForDialog) {
        console.log("AdminTeamsPage: DIALOG (EDIT) - Initializing form. PersistedShooterIds:", persistedShooterIdsForTeam, "AvailableClubShooters:", availableClubShooters.map(s => s.id));
        // Filter persisted IDs to only include those that are actually available for this club
        const validPersistedShooterIds = (persistedShooterIdsForTeam || []).filter(shooterId =>
            availableClubShooters.some(shooter => shooter.id === shooterId)
        );
        setSelectedShooterIdsInForm(validPersistedShooterIds);
        console.log("AdminTeamsPage: DIALOG (EDIT) - Initializing selectedShooterIdsInForm with valid persisted IDs:", validPersistedShooterIds);
    } else if (isFormOpen && formMode === 'new') {
        setSelectedShooterIdsInForm([]);
        console.log("AdminTeamsPage: DIALOG (NEW) - Initializing selectedShooterIdsInForm as empty.");
    }
  }, [isFormOpen, formMode, currentTeam?.id, isLoadingShootersForDialog, persistedShooterIdsForTeam, availableClubShooters]);


  useEffect(() => {
    const fetchValidationData = async () => {
        const relevantCompetitionYear = currentTeam?.competitionYear || allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear;
        if (isFormOpen && relevantCompetitionYear) { 
            console.log("AdminTeamsPage: VALIDATION - Fetching validation data for year:", relevantCompetitionYear);
            setIsLoadingValidationData(true);
            try {
                const teamsQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", relevantCompetitionYear));
                const teamsSnapshot = await getDocs(teamsQuery);
                const teamsForYear: TeamValidationInfo[] = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Team) }));
                
                const newLeagueTypesMap = new Map<string, UIDisciplineSelection>();
                for (const team of teamsForYear) {
                    if(team.leagueId && !newLeagueTypesMap.has(team.leagueId)){
                        const leagueDoc = allLeagues.find(l => l.id === team.leagueId);
                        if(leagueDoc && leagueDoc.type){
                            newLeagueTypesMap.set(team.leagueId, leagueDoc.type);
                        }
                    }
                    // Populate leagueType for each team in teamsForYear
                    team.leagueType = newLeagueTypesMap.get(team.leagueId);
                }
                setAllTeamsForYearValidation(teamsForYear);
                setLeagueTypesMapValidation(newLeagueTypesMap);
                console.log("AdminTeamsPage: VALIDATION - Teams for year:", teamsForYear.length, "League types map size:", newLeagueTypesMap.size);
            } catch (error) {
                console.error("AdminTeamsPage: VALIDATION - Error fetching validation data: ", error);
                setAllTeamsForYearValidation([]);
                setLeagueTypesMapValidation(new Map());
                toast({title: "Fehler Validierungsdaten", description: "Daten für Schützenprüfung konnten nicht geladen werden.", variant: "destructive"})
            } finally {
                setIsLoadingValidationData(false);
            }
        } else {
            setAllTeamsForYearValidation([]);
            setLeagueTypesMapValidation(new Map());
        }
    };
    fetchValidationData();
  }, [isFormOpen, currentTeam?.competitionYear, selectedSeasonId, allSeasons, allLeagues, toast]);


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
    console.log("AdminTeamsPage: handleEdit - Setting persistedShooterIdsForTeam:", currentTeamShooterIds);
    setPersistedShooterIdsForTeam(currentTeamShooterIds); 
    // selectedShooterIdsInForm wird durch useEffect gesetzt, sobald availableClubShooters geladen ist
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
    console.log("AdminTeamsPage: handleDeleteTeam - Attempting to delete team:", teamIdToDelete);
    setIsLoadingDelete(true); 
    try {
      const batch = writeBatch(db);
      const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdToDelete);

      const teamSnap = await getFirestoreDoc(teamDocRef);
      const teamData = teamSnap.data() as Team | undefined;
      const shooterIdsInDeletedTeam = teamData?.shooterIds || [];
      console.log("AdminTeamsPage: handleDeleteTeam - Shooter IDs in deleted team:", shooterIdsInDeletedTeam);

      if (shooterIdsInDeletedTeam.length > 0) {
        shooterIdsInDeletedTeam.forEach(shooterId => {
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayRemove(teamIdToDelete) });
          console.log("AdminTeamsPage: handleDeleteTeam - Scheduled arrayRemove of teamId from shooter:", shooterId);
        });
      }
      batch.delete(teamDocRef);
      console.log("AdminTeamsPage: handleDeleteTeam - Scheduled delete of team document:", teamIdToDelete);
      await batch.commit();
      console.log("AdminTeamsPage: handleDeleteTeam - Batch commit successful.");
      toast({ title: "Mannschaft gelöscht", description: `"${teamToDelete.name}" wurde erfolgreich entfernt.` });
      fetchTeams(); 
    } catch (error) {
      console.error(`AdminTeamsPage: handleDeleteTeam - Error deleting team ${teamToDelete.id}: `, error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingDelete(false);
      setIsAlertOpen(false);
      setTeamToDelete(null);
      console.log("AdminTeamsPage: handleDeleteTeam - Finished.");
    }
  };
  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("AdminTeamsPage: handleSubmit - Form submitted.");
    if (!currentTeam || !currentTeam.name?.trim() || !currentTeam.clubId || !currentTeam.leagueId || currentTeam.competitionYear === undefined) {
      toast({ title: "Ungültige Eingabe", description: "Bitte alle erforderlichen Felder ausfüllen.", variant: "destructive" });
      console.warn("AdminTeamsPage: handleSubmit - Invalid form input.", currentTeam);
      return;
    }

    if (selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM) {
      toast({ title: "Zu viele Schützen", description: `Eine Mannschaft darf maximal ${MAX_SHOOTERS_PER_TEAM} Schützen haben.`, variant: "destructive" });
      console.warn("AdminTeamsPage: handleSubmit - Too many shooters selected.");
      return;
    }
    
    const currentLeagueForTeam = availableLeaguesForSeason.find(l => l.id === currentTeam.leagueId) || allLeagues.find(l => l.id === currentTeam.leagueId);
    if (!currentLeagueForTeam || !currentLeagueForTeam.type) {
        toast({title: "Ligakontext Fehler", description: "Ligatyp für Schützenprüfung nicht gefunden.", variant: "destructive"});
        console.error("AdminTeamsPage: handleSubmit - League type for validation not found. League ID:", currentTeam.leagueId);
        return;
    }
    const currentTeamLeagueType = currentLeagueForTeam.type;
    const currentTeamCompetitionYear = currentTeam.competitionYear;
    console.log(`AdminTeamsPage: handleSubmit - Current team context: Year ${currentTeamCompetitionYear}, Type ${currentTeamLeagueType}`);

    // Rule: Shooter can only be in one team of a specific type (KK/LD or SP) per competition year.
    for (const shooterId of selectedShooterIdsInForm) {
      const isNewAssignment = formMode === 'new' || !persistedShooterIdsForTeam.includes(shooterId);
      if (isNewAssignment) { // Only check for new assignments or if shooter is moved to a new team
        for (const teamToCheck of allTeamsForYearValidation) {
          // Skip self-check if editing
          if (formMode === 'edit' && teamToCheck.id === currentTeam.id) continue; 
          
          const targetTeamLeagueType = teamToCheck.leagueType; // Already populated in allTeamsForYearValidation

          if (teamToCheck.competitionYear === currentTeamCompetitionYear && 
              targetTeamLeagueType && 
              (teamToCheck.shooterIds || []).includes(shooterId)) {
            
            // Check if the conflict is within the same broad category (Gewehr vs Pistole)
            const isCurrentTeamGewehr = currentTeamLeagueType === 'KK' || currentTeamLeagueType === 'LD';
            const isTargetTeamGewehr = targetTeamLeagueType === 'KK' || targetTeamLeagueType === 'LD';
            const isCurrentTeamPistole = currentTeamLeagueType === 'SP';
            const isTargetTeamPistole = targetTeamLeagueType === 'SP';

            let conflict = false;
            if (isCurrentTeamGewehr && isTargetTeamGewehr) conflict = true;
            if (isCurrentTeamPistole && isTargetTeamPistole) conflict = true;
            // No conflict if one is Gewehr and other is Pistole (or other distinct types)

            if (conflict) {
              const conflictingShooter = availableClubShooters.find(s => s.id === shooterId) || shooters.find(s => s.id === shooterId);
              toast({
                  title: "Schütze bereits zugeordnet",
                  description: `${conflictingShooter?.name || 'Ein Schütze'} ist bereits in Team "${teamToCheck.name}" (${targetTeamLeagueType} ${currentTeamCompetitionYear}) gemeldet. Ein Schütze darf pro Saison nur in einem Gewehr- UND einem Pistolenteam sein.`,
                  variant: "destructive",
                  duration: 10000
              });
              console.warn("AdminTeamsPage: handleSubmit - Shooter assignment conflict.", {shooterId, currentTeamLeagueType, targetTeamLeagueType, teamToCheckName: teamToCheck.name});
              return; // Stop submission
            }
          }
        }
      }
    }
    
    setIsLoadingForm(true);
    console.log("AdminTeamsPage: handleSubmit - Proceeding with save. Selected shooters:", selectedShooterIdsInForm);
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
        toast({ title: "Doppelter Mannschaftsname", description: `Eine Mannschaft mit dem Namen "${currentTeam.name.trim()}" existiert bereits in dieser Liga und Saison.`, variant: "destructive"});
        console.warn("AdminTeamsPage: handleSubmit - Duplicate team name found.");
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
      
      console.log("AdminTeamsPage: handleSubmit - Original Shooter IDs (persisted):", originalShooterIds);
      console.log("AdminTeamsPage: handleSubmit - Selected Shooter IDs in Form (valid & available):", selectedShooterIdsInForm);
      console.log("AdminTeamsPage: handleSubmit - Shooters to ADD to their teamIds array:", shootersToAdd);
      console.log("AdminTeamsPage: handleSubmit - Shooters to REMOVE from their teamIds array:", shootersToRemove);
      
      if (formMode === 'new') {
        const newTeamRef = doc(collection(db, TEAMS_COLLECTION)); 
        teamIdForShooterUpdates = newTeamRef.id;
        const { id, ...dataForNewTeam } = teamDataToSave; // Ensure 'id' is not part of new data
        batch.set(newTeamRef, dataForNewTeam); 
        console.log("AdminTeamsPage: handleSubmit - Scheduled SET for new team:", newTeamRef.id, dataForNewTeam);
        toast({ title: "Mannschaft erstellt", description: `"${dataForNewTeam.name}" wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentTeam.id) {
        teamIdForShooterUpdates = currentTeam.id;
        const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdForShooterUpdates);
        const { id, ...dataForTeamUpdate } = teamDataToSave; // Ensure 'id' is not part of update data
        batch.update(teamDocRef, dataForTeamUpdate); 
        console.log("AdminTeamsPage: handleSubmit - Scheduled UPDATE for team:", teamIdForShooterUpdates, dataForTeamUpdate);
        toast({ title: "Mannschaft aktualisiert", description: `"${dataForTeamUpdate.name}" wurde erfolgreich aktualisiert.` });
      } else {
        setIsLoadingForm(false);
        throw new Error("AdminTeamsPage: handleSubmit - Invalid form mode or missing team ID for edit.");
      }
      
      // Update shooters' teamIds array
      shootersToAdd.forEach(shooterId => { 
        if(availableClubShooters.some(s => s.id === shooterId)){ // Ensure shooter is valid for this club
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayUnion(teamIdForShooterUpdates) });
          console.log(`AdminTeamsPage: handleSubmit - Scheduled arrayUnion for shooter ${shooterId} with team ${teamIdForShooterUpdates}`);
        } else {
           console.warn(`AdminTeamsPage: handleSubmit - SKIPPING arrayUnion for shooter ${shooterId} (not in availableClubShooters) for team ${teamIdForShooterUpdates}`);
        }
      });

      shootersToRemove.forEach(shooterId => {
        // Check if shooter was among the initially available/valid club shooters
        if (availableClubShooters.some(s => s.id === shooterId) || persistedShooterIdsForTeam.includes(shooterId)) {
            const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
            batch.update(shooterDocRef, { teamIds: arrayRemove(teamIdForShooterUpdates) });
            console.log(`AdminTeamsPage: handleSubmit - Scheduled arrayRemove for shooter ${shooterId} from team ${teamIdForShooterUpdates}`);
        } else {
            console.warn(`AdminTeamsPage: handleSubmit - SKIPPING arrayRemove for shooter ${shooterId} (not in available/persisted lists) from team ${teamIdForShooterUpdates}`);
        }
      });
      
      await batch.commit();
      console.log("AdminTeamsPage: handleSubmit - Batch commit successful.");
      setIsFormOpen(false);
      setCurrentTeam(null);
      setSelectedShooterIdsInForm([]); 
      setPersistedShooterIdsForTeam([]);
      fetchTeams();
    } catch (error) {
      console.error("AdminTeamsPage: handleSubmit - Error saving team or updating shooters: ", error);
      const action = formMode === 'new' ? 'erstellen' : 'aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingForm(false);
      console.log("AdminTeamsPage: handleSubmit - Finished.");
    }
  };

  const handleFormInputChange = (field: keyof Pick<Team, 'name' | 'clubId'>, value: string) => {
    setCurrentTeam(prev => {
        if (!prev) return null;
        const updatedTeam = { ...prev, [field]: value };
        if (field === 'clubId' && prev.clubId !== value) {
            // Reset shooter selections if club changes, as available shooters will change
            setSelectedShooterIdsInForm([]); 
            setAvailableClubShooters([]); // This will trigger re-fetch of shooters for the new club
        }
        return updatedTeam as Partial<Team>; 
    });
  };

 const handleShooterSelectionChange = (shooterId: string, checked: boolean) => {
    console.log(`AdminTeamsPage: handleShooterSelectionChange - ShooterId: ${shooterId}, Checked: ${checked}`);
    const currentLeagueForTeam = availableLeaguesForSeason.find(l => l.id === currentTeam?.leagueId) || allLeagues.find(l => l.id === currentTeam?.leagueId);
    const currentTeamLeagueType = currentLeagueForTeam?.type;
    const currentTeamCompetitionYear = currentTeam?.competitionYear;

    if (!currentTeamCompetitionYear || !currentTeamLeagueType) {
        toast({ title: "Fehler", description: "Team-Kontext (Jahr/Typ) für Validierung nicht gefunden.", variant: "destructive" });
        return;
    }

    if (checked) {
      if (selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) {
          toast({ title: "Maximale Schützenzahl erreicht", description: `Maximal ${MAX_SHOOTERS_PER_TEAM} Schützen pro Team.`, variant: "destructive"});
          console.log("AdminTeamsPage: handleShooterSelectionChange - Max shooters per team reached.");
          return; 
      }
      
      // Check if this shooter is already in another team of the same type and year
      for (const teamToCheck of allTeamsForYearValidation) {
          if (formMode === 'edit' && teamToCheck.id === currentTeam?.id) continue; // Skip self if editing

          const targetTeamLeagueType = teamToCheck.leagueType; // Already populated

          if (teamToCheck.competitionYear === currentTeamCompetitionYear && 
              targetTeamLeagueType &&
              (teamToCheck.shooterIds || []).includes(shooterId)) {

            const isCurrentTeamGewehr = currentTeamLeagueType === 'KK' || currentTeamLeagueType === 'LD';
            const isTargetTeamGewehr = targetTeamLeagueType === 'KK' || targetTeamLeagueType === 'LD';
            const isCurrentTeamPistole = currentTeamLeagueType === 'SP';
            const isTargetTeamPistole = targetTeamLeagueType === 'SP';

            let conflict = false;
            if (isCurrentTeamGewehr && isTargetTeamGewehr) conflict = true;
            if (isCurrentTeamPistole && isTargetTeamPistole) conflict = true;

            if (conflict) {
              const conflictingShooter = availableClubShooters.find(s => s.id === shooterId) || allTeamsForYearValidation.flatMap(t => t.shooterIds || []).includes(shooterId) ? {name: "Dieser Schütze"} : {name: "Ein Schütze"}; // Simplified fallback
               toast({ 
                   title: "Schütze bereits zugeordnet", 
                   description: `${conflictingShooter?.name || 'Dieser Schütze'} ist bereits in Team "${teamToCheck.name}" (${targetTeamLeagueType} ${currentTeamCompetitionYear}) gemeldet. Ein Schütze darf pro Saison nur in einem Gewehr- UND einem Pistolenteam sein.`, 
                   variant: "destructive",
                   duration: 10000
                });
               console.log("AdminTeamsPage: handleShooterSelectionChange - Shooter assignment conflict detected.");
               return; // Prevent selection
            }
           }
      }
    }

    setSelectedShooterIdsInForm(prevSelectedIds =>
      checked ? [...prevSelectedIds, shooterId] : prevSelectedIds.filter(id => id !== shooterId)
    );
    console.log("AdminTeamsPage: handleShooterSelectionChange - Updated selectedShooterIdsInForm:", checked ? [...selectedShooterIdsInForm, shooterId] : selectedShooterIdsInForm.filter(id => id !== shooterId) );
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

  const getClubName = (clubId: string): string => {
    return allClubs.find(c => c.id === clubId)?.name || 'Unbekannt';
  };

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
                  <TableHead>Verein</TableHead>
                  <TableHead className="text-center">Schützen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{getClubName(team.clubId)}</TableCell>
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
                    <div className="space-y-1.5">
                        <Label htmlFor="teamNameDialog">Name der Mannschaft</Label>
                        <Input 
                        id="teamNameDialog" 
                        value={currentTeam.name || ''} 
                        onChange={(e) => handleFormInputChange('name', e.target.value)} 
                        placeholder="z.B. Verein XY I"
                        required 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="clubIdDialog">Verein</Label>
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
                        // Disable if max shooters are selected AND this shooter is not already one of them
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
                          `Keine Schützen für '${allClubs.find(c => c.id === currentTeam?.clubId)?.name || 'Verein'}' gefunden oder alle bereits anderweitig zugeordnet.` : 
                          'Verein wählen, um Schützen anzuzeigen.'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
    
