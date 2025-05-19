// src/app/admin/teams/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams, useRouter } from 'next/navigation';
import type { Season, League, Club, Team, Shooter, TeamValidationInfo, FirestoreLeagueSpecificDiscipline } from '@/types/rwk';
import { GEWEHR_DISCIPLINES, PISTOL_DISCIPLINES, leagueDisciplineOptions } from '@/types/rwk';
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
  const [leagueTypesMapValidation, setLeagueTypesMapValidation] = useState<Record<string, FirestoreLeagueSpecificDiscipline | undefined>>({});
  const [isLoadingValidationData, setIsLoadingValidationData] = useState(false);


  const fetchInitialData = useCallback(async () => {
    console.log("AdminTeamsPage: fetchInitialData called");
    setIsLoadingData(true);
    try {
      const seasonsSnapshot = await getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
      const fetchedSeasons: Season[] = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
      setAllSeasons(fetchedSeasons);
      console.log("AdminTeamsPage: Seasons fetched:", fetchedSeasons.length, fetchedSeasons.map(s => ({id: s.id, name: s.name})));
      if (fetchedSeasons.length === 0) {
          toast({ title: "Keine Saisons gefunden", description: "Bitte zuerst Saisons anlegen.", variant: "warning" });
      }

      const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      const fetchedLeagues: League[] = leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
      setAllLeagues(fetchedLeagues);
      console.log("AdminTeamsPage: All leagues fetched:", fetchedLeagues.length, fetchedLeagues.map(l => ({id: l.id, name: l.name, seasonId: l.seasonId, type: l.type, competitionYear: l.competitionYear })));
      
      const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
      const fetchedClubs: Club[] = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
      setAllClubs(fetchedClubs);
      console.log("AdminTeamsPage: Clubs fetched:", fetchedClubs.length);

      if (querySeasonId && fetchedSeasons.some(s => s.id === querySeasonId)) {
        setSelectedSeasonId(querySeasonId);
        console.log("AdminTeamsPage: Initial selectedSeasonId set from query param:", querySeasonId);
      } else if (fetchedSeasons.length > 0 && fetchedSeasons[0].id) {
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
  }, [querySeasonId, toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    console.log("AdminTeamsPage: selectedSeasonId or allLeagues changed. Current selectedSeasonId:", selectedSeasonId, "All leagues count:", allLeagues.length);
    if (selectedSeasonId && allLeagues.length > 0) {
      const leaguesForCurrentSeason = allLeagues
        .filter(l => l.seasonId === selectedSeasonId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setAvailableLeaguesForSeason(leaguesForCurrentSeason);
      console.log(`AdminTeamsPage: Available leagues for season ${selectedSeasonId}: ${leaguesForCurrentSeason.length}`, leaguesForCurrentSeason.map(l=> ({id: l.id, name:l.name, seasonId: l.seasonId})));
      
      const leaguesMap: Record<string, FirestoreLeagueSpecificDiscipline | undefined> = {};
      leaguesForCurrentSeason.forEach(l => { leaguesMap[l.id] = l.type; });
      allLeagues.forEach(l => { if (!leaguesMap[l.id]) leaguesMap[l.id] = l.type; }); // Ensure all leagues are in map
      setLeagueTypesMapValidation(leaguesMap);
      console.log("AdminTeamsPage: League types map for validation updated:", Object.keys(leaguesMap).length);


      if (queryLeagueId && leaguesForCurrentSeason.some(l => l.id === queryLeagueId)) {
        setSelectedLeagueId(queryLeagueId);
        console.log("AdminTeamsPage: Current selectedLeagueId set from query param:", queryLeagueId);
      } else if (leaguesForCurrentSeason.length > 0 && leaguesForCurrentSeason[0].id) {
        setSelectedLeagueId(leaguesForCurrentSeason[0].id);
        console.log("AdminTeamsPage: Current selectedLeagueId set to first available league:", leaguesForCurrentSeason[0].id);
      } else {
        setSelectedLeagueId('');
        console.log("AdminTeamsPage: No leagues available for selected season, selectedLeagueId set to empty.");
      }
    } else {
      setAvailableLeaguesForSeason([]);
      setSelectedLeagueId('');
      setLeagueTypesMapValidation({});
      console.log("AdminTeamsPage: No season selected or no leagues loaded, clearing availableLeaguesForSeason and selectedLeagueId.");
    }
  }, [selectedSeasonId, allLeagues, queryLeagueId]);

  const fetchTeamsForLeague = useCallback(async (leagueIdToFetch: string) => {
    const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (!leagueIdToFetch || !currentSeason) {
      setTeams([]);
      console.log("AdminTeamsPage: fetchTeams - No league or season data, clearing teams.");
      return;
    }
    console.log(`AdminTeamsPage: fetchTeams - Fetching teams for leagueId ${leagueIdToFetch} and competitionYear ${currentSeason.competitionYear}`);
    setIsLoadingTeams(true);
    try {
      const q = query(
        collection(db, TEAMS_COLLECTION),
        where("leagueId", "==", leagueIdToFetch),
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
  }, [selectedSeasonId, allSeasons, toast]);

  useEffect(() => {
    if (selectedLeagueId) {
      fetchTeamsForLeague(selectedLeagueId);
    } else {
      setTeams([]);
    }
  }, [selectedLeagueId, fetchTeamsForLeague]);

 useEffect(() => {
    const fetchShootersAndValidationData = async () => {
      if (!isFormOpen || !currentTeam?.clubId || !selectedLeagueId) {
        setAvailableClubShooters([]);
        // setAllTeamsForYearValidation([]); // Keep validation data if already fetched for the year
        return;
      }

      setIsLoadingShootersForDialog(true);
      console.log("AdminTeamsPage: DIALOG - Fetching shooters for clubId:", currentTeam.clubId);
      try {
        const shootersQuery = query(
          collection(db, SHOOTERS_COLLECTION),
          where("clubId", "==", currentTeam.clubId),
          orderBy("name", "asc")
        );
        const shootersSnapshot = await getDocs(shootersQuery);
        const fetchedShooters: Shooter[] = shootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), teamIds: doc.data().teamIds || [] } as Shooter));
        setAvailableClubShooters(fetchedShooters);
        console.log("AdminTeamsPage: DIALOG - Fetched shooters for club:", fetchedShooters.length);

      } catch (error) {
        console.error("AdminTeamsPage: DIALOG - Error fetching shooters:", error);
        toast({ title: "Fehler beim Laden der Schützen", description: (error as Error).message, variant: "destructive" });
        setAvailableClubShooters([]);
      } finally {
        setIsLoadingShootersForDialog(false);
      }

      // Fetch validation data if not already present or if year changed
      const relevantSeason = allSeasons.find(s => s.id === selectedSeasonId);
      const relevantCompetitionYear = currentTeam?.competitionYear || relevantSeason?.competitionYear;

      if (relevantCompetitionYear && (allTeamsForYearValidation.length === 0 || allTeamsForYearValidation[0]?.competitionYear !== relevantCompetitionYear)) {
        setIsLoadingValidationData(true);
        console.log("AdminTeamsPage: DIALOG - Fetching validation data for year:", relevantCompetitionYear);
        try {
            const teamsForYearQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", relevantCompetitionYear));
            const teamsForYearSnapshot = await getDocs(teamsForYearQuery);
            
            const teamsForValidation: TeamValidationInfo[] = teamsForYearSnapshot.docs.map(d => {
              const teamData = d.data() as Team;
              return { 
                id: d.id, 
                ...teamData, 
                leagueType: leagueTypesMapValidation[teamData.leagueId], // Use pre-fetched league types
                leagueCompetitionYear: teamData.competitionYear,
              };
            });
            setAllTeamsForYearValidation(teamsForValidation);
            console.log("AdminTeamsPage: DIALOG - Fetched teams for year validation:", teamsForValidation.length);
        } catch (error) {
            console.error("AdminTeamsPage: DIALOG - Error fetching validation data:", error);
            setAllTeamsForYearValidation([]);
        } finally {
            setIsLoadingValidationData(false);
        }
      }
    };

    fetchShootersAndValidationData();
  }, [isFormOpen, currentTeam?.clubId, currentTeam?.competitionYear, selectedLeagueId, selectedSeasonId, allSeasons, toast, leagueTypesMapValidation, allTeamsForYearValidation]);


 useEffect(() => {
    if (isFormOpen && formMode === 'edit' && currentTeam?.id && !isLoadingShootersForDialog && availableClubShooters.length >= 0) {
        console.log("AdminTeamsPage: DIALOG (EDIT) - Initializing form. PersistedShooterIds:", persistedShooterIdsForTeam, "AvailableClubShooters:", availableClubShooters.map(s => ({id: s.id, name: s.name})));
        const validPersistedShooterIds = (persistedShooterIdsForTeam || []).filter(shooterId =>
            availableClubShooters.some(shooter => shooter.id === shooterId)
        );
        setSelectedShooterIdsInForm(validPersistedShooterIds);
        console.log("AdminTeamsPage: DIALOG (EDIT) - Initialized selectedShooterIdsInForm with valid persisted IDs:", validPersistedShooterIds);
    } else if (isFormOpen && formMode === 'new') {
        setSelectedShooterIdsInForm([]);
        console.log("AdminTeamsPage: DIALOG (NEW) - Initializing selectedShooterIdsInForm as empty.");
    }
  }, [isFormOpen, formMode, currentTeam?.id, isLoadingShootersForDialog, persistedShooterIdsForTeam, availableClubShooters]);


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
      clubId: allClubs.length > 0 && allClubs[0].id ? allClubs[0].id : '', 
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
      if (selectedLeagueId) fetchTeamsForLeague(selectedLeagueId); 
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
    
    const currentLeagueForTeam = allLeagues.find(l => l.id === currentTeam.leagueId);
    if (!currentLeagueForTeam || !currentLeagueForTeam.type) {
        toast({title: "Ligakontext Fehler", description: "Ligatyp für Schützenprüfung nicht gefunden.", variant: "destructive"});
        console.error("AdminTeamsPage: handleSubmit - League type for validation not found. League ID:", currentTeam.leagueId);
        return;
    }
    const currentTeamSpecificLeagueType = currentLeagueForTeam.type;
    const currentTeamCompetitionYear = currentTeam.competitionYear;
    console.log(`AdminTeamsPage: handleSubmit - Current team context: Year ${currentTeamCompetitionYear}, Specific Type ${currentTeamSpecificLeagueType}`);
    
    for (const shooterId of selectedShooterIdsInForm) {
        const isNewAssignmentToThisTeam = formMode === 'new' || !persistedShooterIdsForTeam.includes(shooterId);
        if (isNewAssignmentToThisTeam) { 
            let assignedToGewehrInYear = 0;
            let assignedToPistolInYear = 0;

            const isCurrentTeamGewehr = GEWEHR_DISCIPLINES.includes(currentTeamSpecificLeagueType);
            const isCurrentTeamPistole = PISTOL_DISCIPLINES.includes(currentTeamSpecificLeagueType);

            if(isCurrentTeamGewehr) assignedToGewehrInYear++;
            if(isCurrentTeamPistole) assignedToPistolInYear++;
            
            for (const teamToCheck of allTeamsForYearValidation) {
                if (teamToCheck.id === currentTeam.id || teamToCheck.competitionYear !== currentTeamCompetitionYear) continue;
                
                if ((teamToCheck.shooterIds || []).includes(shooterId)) {
                    const targetTeamSpecificLeagueType = leagueTypesMapValidation[teamToCheck.leagueId];
                    if (!targetTeamSpecificLeagueType) continue;

                    if (GEWEHR_DISCIPLINES.includes(targetTeamSpecificLeagueType)) assignedToGewehrInYear++;
                    if (PISTOL_DISCIPLINES.includes(targetTeamSpecificLeagueType)) assignedToPistolInYear++;
                }
            }

            if (isCurrentTeamGewehr && assignedToGewehrInYear > 1) {
                const conflictingShooter = availableClubShooters.find(s => s.id === shooterId);
                toast({ title: "Konflikt Gewehrdisziplin", description: `${conflictingShooter?.name || 'Dieser Schütze'} ist bereits in einem anderen Gewehr-Team in ${currentTeamCompetitionYear} gemeldet.`, variant: "destructive", duration: 10000 });
                return;
            }
            if (isCurrentTeamPistole && assignedToPistolInYear > 1) {
                const conflictingShooter = availableClubShooters.find(s => s.id === shooterId);
                toast({ title: "Konflikt Pistolendisziplin", description: `${conflictingShooter?.name || 'Dieser Schütze'} ist bereits in einem anderen Pistolen-Team in ${currentTeamCompetitionYear} gemeldet.`, variant: "destructive", duration: 10000 });
                return;
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
      const shootersToRemove = originalShooterIds.filter(id => !selectedShooterIdsInForm.includes(id) && availableClubShooters.some(s => s.id === id)); // Ensure shooter exists for removal op
      
      console.log("AdminTeamsPage: handleSubmit - Original Shooter IDs (persisted):", originalShooterIds);
      console.log("AdminTeamsPage: handleSubmit - Selected Shooter IDs in Form (valid & available):", selectedShooterIdsInForm);
      console.log("AdminTeamsPage: handleSubmit - Shooters to ADD to their teamIds array:", shootersToAdd);
      console.log("AdminTeamsPage: handleSubmit - Shooters to REMOVE from their teamIds array:", shootersToRemove);
      
      if (formMode === 'new') {
        const newTeamRef = doc(collection(db, TEAMS_COLLECTION)); 
        teamIdForShooterUpdates = newTeamRef.id;
        const { id, ...dataForNewTeam } = teamDataToSave; 
        batch.set(newTeamRef, dataForNewTeam); 
        console.log("AdminTeamsPage: handleSubmit (NEW) - Scheduled SET for new team:", newTeamRef.id, dataForNewTeam);
        toast({ title: "Mannschaft erstellt", description: `"${dataForNewTeam.name}" wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentTeam.id) {
        teamIdForShooterUpdates = currentTeam.id;
        const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdForShooterUpdates);
        const { id, ...dataForTeamUpdate } = teamDataToSave; 
        batch.update(teamDocRef, dataForTeamUpdate as Partial<Team>); 
        console.log("AdminTeamsPage: handleSubmit (EDIT) - Scheduled UPDATE for team:", teamIdForShooterUpdates, dataForTeamUpdate);
        toast({ title: "Mannschaft aktualisiert", description: `"${dataForTeamUpdate.name}" wurde erfolgreich aktualisiert.` });
      } else {
        setIsLoadingForm(false);
        throw new Error("AdminTeamsPage: handleSubmit - Invalid form mode or missing team ID for edit.");
      }
      
      shootersToAdd.forEach(shooterId => { 
        if(availableClubShooters.some(s => s.id === shooterId)){ 
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayUnion(teamIdForShooterUpdates) });
          console.log(`AdminTeamsPage: handleSubmit - Scheduled arrayUnion for shooter ${shooterId} with team ${teamIdForShooterUpdates}`);
        } else {
           console.warn(`AdminTeamsPage: handleSubmit - SKIPPING arrayUnion for shooter ${shooterId} (not in availableClubShooters) for team ${teamIdForShooterUpdates}`);
        }
      });

      shootersToRemove.forEach(shooterId => {
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayRemove(teamIdForShooterUpdates) });
          console.log(`AdminTeamsPage: handleSubmit - Scheduled arrayRemove for shooter ${shooterId} from team ${teamIdForShooterUpdates}`);
      });
      
      await batch.commit();
      console.log("AdminTeamsPage: handleSubmit - Batch commit successful.");
      setIsFormOpen(false);
      setCurrentTeam(null);
      setSelectedShooterIdsInForm([]); 
      setPersistedShooterIdsForTeam([]);
      if (selectedLeagueId) fetchTeamsForLeague(selectedLeagueId);
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
            setSelectedShooterIdsInForm([]); 
            setAvailableClubShooters([]); 
        }
        return updatedTeam as Partial<Team>; 
    });
  };

 const handleShooterSelectionChange = (shooterId: string, checked: boolean) => {
    console.log(`AdminTeamsPage: handleShooterSelectionChange - ShooterId: ${shooterId}, Checked: ${checked}`);
    
    const currentLeague = allLeagues.find(l => l.id === currentTeam?.leagueId);
    const currentTeamSpecificLeagueType = currentLeague?.type;
    const currentTeamCompetitionYear = currentTeam?.competitionYear;

    if (!currentTeamCompetitionYear || !currentTeamSpecificLeagueType) {
        toast({ title: "Fehler", description: "Team-Kontext (Jahr/Typ) für Validierung nicht gefunden.", variant: "destructive" });
        return;
    }

    if (checked) {
      if (selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) {
          toast({ title: "Maximale Schützenzahl erreicht", description: `Maximal ${MAX_SHOOTERS_PER_TEAM} Schützen pro Team.`, variant: "warning"});
          console.log("AdminTeamsPage: handleShooterSelectionChange - Max shooters per team reached.");
          return; 
      }
      
      let assignedToGewehrInYear = 0;
      let assignedToPistolInYear = 0;

      const isCurrentTeamGewehr = GEWEHR_DISCIPLINES.includes(currentTeamSpecificLeagueType);
      const isCurrentTeamPistole = PISTOL_DISCIPLINES.includes(currentTeamSpecificLeagueType);

      if (isCurrentTeamGewehr) assignedToGewehrInYear++;
      if (isCurrentTeamPistole) assignedToPistolInYear++;
      
      const shooterBeingChecked = availableClubShooters.find(s => s.id === shooterId);
      if(shooterBeingChecked?.teamIds) {
          for (const existingTeamId of shooterBeingChecked.teamIds) {
              if (existingTeamId === currentTeam?.id) continue; // Skip self if already assigned to this team
              const teamInfo = allTeamsForYearValidation.find(t => t.id === existingTeamId);
              if (teamInfo && teamInfo.competitionYear === currentTeamCompetitionYear) {
                  const leagueType = leagueTypesMapValidation[teamInfo.leagueId];
                  if (leagueType) {
                      if (GEWEHR_DISCIPLINES.includes(leagueType)) assignedToGewehrInYear++;
                      if (PISTOL_DISCIPLINES.includes(leagueType)) assignedToPistolInYear++;
                  }
              }
          }
      }
      
      if (isCurrentTeamGewehr && assignedToGewehrInYear > 1) {
          toast({ title: "Konflikt Gewehrdisziplin", description: `${shooterBeingChecked?.name || 'Dieser Schütze'} ist bereits in einem anderen Gewehr-Team in ${currentTeamCompetitionYear} gemeldet.`, variant: "destructive", duration: 7000 });
          return;
      }
      if (isCurrentTeamPistole && assignedToPistolInYear > 1) {
          toast({ title: "Konflikt Pistolendisziplin", description: `${shooterBeingChecked?.name || 'Dieser Schütze'} ist bereits in einem anderen Pistolen-Team in ${currentTeamCompetitionYear} gemeldet.`, variant: "destructive", duration: 7000 });
          return;
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
          <Select 
            value={selectedSeasonId} 
            onValueChange={(value) => {
              setSelectedSeasonId(value);
              router.push(`/admin/teams?seasonId=${value}`, { scroll: false });
            }}  
            disabled={isLoadingData || allSeasons.length === 0}
          >
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
          <Select 
            value={selectedLeagueId} 
            onValueChange={(value) => {
              setSelectedLeagueId(value);
              router.push(`/admin/teams?seasonId=${selectedSeasonId}&leagueId=${value}`, { scroll: false });
            }} 
            disabled={isLoadingData || !selectedSeasonId || availableLeaguesForSeason.length === 0}
          >
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
                        const isDisabledByMax = !isSelected && selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM;
                        
                        let isDisabledByDisciplineConflict = false;
                        if (!isSelected && currentTeam?.leagueId && currentTeam?.competitionYear) {
                            const currentTeamLeagueType = leagueTypesMapValidation[currentTeam.leagueId];
                            if(currentTeamLeagueType && shooter.teamIds) {
                                let assignedToGewehrInYear = GEWEHR_DISCIPLINES.includes(currentTeamLeagueType) ? 1 : 0;
                                let assignedToPistolInYear = PISTOL_DISCIPLINES.includes(currentTeamLeagueType) ? 1 : 0;

                                for (const existingTeamId of shooter.teamIds) {
                                     if (existingTeamId === currentTeam.id) continue; 
                                     const teamInfo = allTeamsForYearValidation.find(t => t.id === existingTeamId);
                                     if (teamInfo && teamInfo.competitionYear === currentTeam.competitionYear) {
                                         const leagueType = leagueTypesMapValidation[teamInfo.leagueId];
                                         if (leagueType) {
                                             if (GEWEHR_DISCIPLINES.includes(leagueType)) assignedToGewehrInYear++;
                                             if (PISTOL_DISCIPLINES.includes(leagueType)) assignedToPistolInYear++;
                                         }
                                     }
                                }
                                if (GEWEHR_DISCIPLINES.includes(currentTeamLeagueType) && assignedToGewehrInYear > 1) isDisabledByDisciplineConflict = true;
                                if (PISTOL_DISCIPLINES.includes(currentTeamLeagueType) && assignedToPistolInYear > 1) isDisabledByDisciplineConflict = true;
                            }
                        }


                        return (
                            <div key={shooter.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-md">
                            <Checkbox
                                id={`shooter-${shooter.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => handleShooterSelectionChange(shooter.id, !!checked)}
                                disabled={isDisabledByMax || isLoadingValidationData || isDisabledByDisciplineConflict}
                            />
                            <Label htmlFor={`shooter-${shooter.id}`} className={`font-normal cursor-pointer flex-grow ${(isDisabledByMax || isLoadingValidationData || isDisabledByDisciplineConflict) ? 'opacity-50 cursor-not-allowed' : '' }`}>
                                {shooter.name}
                                <span className='text-xs text-muted-foreground ml-1'>(Schnitt Vorjahr: folgt)</span>
                                {isDisabledByDisciplineConflict && <span className="text-xs text-destructive ml-1">(Bereits in Team dieser Art)</span>}
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
                          `Keine Schützen für '${allClubs.find(c => c.id === currentTeam?.clubId)?.name || 'Verein'}' gefunden.` : 
                          'Verein wählen, um Schützen anzuzeigen.'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="leagueDisplayDialog">Liga</Label>
                        <Input id="leagueDisplayDialog" value={selectedLeague?.name || ''} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="seasonDisplayDialog">Saison</Label>
                        <Input id="seasonDisplayDialog" value={selectedSeason?.name || ''} disabled className="bg-muted/50" />
                    </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]);}}>Abbrechen</Button>
              <Button 
                type="submit" 
                disabled={isLoadingForm || (allClubs.length === 0 && !currentTeam?.clubId ) || isLoadingShootersForDialog || isLoadingValidationData}
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

