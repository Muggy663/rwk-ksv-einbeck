
// src/app/admin/teams/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users, Loader2, AlertTriangle } from 'lucide-react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/hooks/use-auth';
import type { Season, League, Club, Team, Shooter, TeamValidationInfo, FirestoreLeagueSpecificDiscipline } from '@/types/rwk';
import { GEWEHR_DISCIPLINES, PISTOL_DISCIPLINES, leagueDisciplineOptions, MAX_SHOOTERS_PER_TEAM, getDisciplineCategory } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query,
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayUnion, arrayRemove, Timestamp
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "rwk_shooters";
const ALL_CLUBS_FILTER_VALUE = "__ALL_CLUBS__";
const ALL_LEAGUES_FILTER_VALUE = "__ALL_LEAGUES__";

export default function AdminTeamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const querySeasonId = searchParams.get('seasonId');
  const queryLeagueId = searchParams.get('leagueId');
  const queryClubId = searchParams.get('clubId');

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(querySeasonId || '');
  const [selectedClubIdFilter, setSelectedClubIdFilter] = useState<string>(queryClubId || ALL_CLUBS_FILTER_VALUE);
  const [selectedLeagueIdFilter, setSelectedLeagueIdFilter] = useState<string>(queryLeagueId || ALL_LEAGUES_FILTER_VALUE);
  
  const [teamsForDisplay, setTeamsForDisplay] = useState<Team[]>([]);
  
  const [availableClubShooters, setAvailableClubShooters] = useState<Shooter[]>([]);
  const [allTeamsForYearValidation, setAllTeamsForYearValidation] = useState<TeamValidationInfo[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingShootersForDialog, setIsLoadingShootersForDialog] = useState(false);
  const [isLoadingValidationData, setIsLoadingValidationData] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  
  const [persistedShooterIdsForTeam, setPersistedShooterIdsForTeam] = useState<string[]>([]);
  const [selectedShooterIdsInForm, setSelectedShooterIdsInForm] = useState<string[]>([]);
  
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const leagueTypesMapValidation = useMemo(() => {
    const map: Record<string, FirestoreLeagueSpecificDiscipline | undefined> = {};
    allLeagues.forEach(l => { map[l.id] = l.type; });
    return map;
  }, [allLeagues]);


  const fetchInitialData = useCallback(async () => {
    console.log("AdminTeamsPage: fetchInitialData called");
    setIsLoadingData(true);
    try {
      const seasonsSnapshotPromise = getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
      const leaguesSnapshotPromise = getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      const clubsSnapshotPromise = getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));

      const [seasonsSnapshot, leaguesSnapshot, clubsSnapshot] = await Promise.all([
        seasonsSnapshotPromise,
        leaguesSnapshotPromise,
        clubsSnapshotPromise,
      ]);
      
      const fetchedSeasonsRaw = seasonsSnapshot.docs.map(sDoc => ({ id: sDoc.id, ...sDoc.data() } as Season));
      const fetchedSeasons = fetchedSeasonsRaw.filter(s => s.id && typeof s.id === 'string' && s.id.trim() !== "");
      setAllSeasons(fetchedSeasons);
      console.log("AdminTeamsPage: Seasons fetched:", fetchedSeasons.length, fetchedSeasons.map(s => ({id: s.id, name: s.name})));

      const rawLeagues = leaguesSnapshot.docs.map(lDoc => ({ id: lDoc.id, ...lDoc.data() } as League));
      const filteredLeagues = rawLeagues.filter(l => l.id && typeof l.id === 'string' && l.id.trim() !== ""); // Filter here
      setAllLeagues(filteredLeagues);
      console.log("AdminTeamsPage: All leagues fetched:", filteredLeagues.length);
            
      const rawClubs = clubsSnapshot.docs.map(cDoc => ({ id: cDoc.id, ...cDoc.data() } as Club));
      const filteredClubs = rawClubs.filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== ""); // Filter here
      setAllClubs(filteredClubs);
      console.log("AdminTeamsPage: Clubs fetched:", filteredClubs.length);
      
      if (querySeasonId && fetchedSeasons.some(s => s.id === querySeasonId)) {
        setSelectedSeasonId(querySeasonId);
      } else if (fetchedSeasons.length > 0 && !selectedSeasonId && !querySeasonId) {
        // setSelectedSeasonId(fetchedSeasons[0].id); // Default to first season
      }
      if (queryClubId && filteredClubs.some(c => c.id === queryClubId)) {
        setSelectedClubIdFilter(queryClubId);
      }
      if (queryLeagueId && filteredLeagues.some(l => l.id === queryLeagueId)) {
         setSelectedLeagueIdFilter(queryLeagueId);
      }
       console.log("AdminTeamsPage: Initial filters - Season:", selectedSeasonId, "Club:", selectedClubIdFilter, "League:", selectedLeagueIdFilter);

    } catch (error) {
      console.error("AdminTeamsPage: Error fetching initial data (seasons/leagues/clubs): ", error);
      toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
      console.log("AdminTeamsPage: fetchInitialData finished. isLoadingData:", false);
    }
  }, [toast, querySeasonId, queryClubId, queryLeagueId, selectedSeasonId, selectedClubIdFilter, selectedLeagueIdFilter]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSearchTeams = useCallback(async () => {
    if (!selectedSeasonId) {
      toast({ title: "Saison fehlt", description: "Bitte wählen Sie eine Saison aus.", variant: "warning" });
      setTeamsForDisplay([]);
      return;
    }
    
    setIsLoadingTeams(true);
    setTeamsForDisplay([]); 
    console.log(`AdminTeamsPage: handleSearchTeams - Searching for seasonId: ${selectedSeasonId}, clubId: ${selectedClubIdFilter}, leagueId: ${selectedLeagueIdFilter}`);
    try {
      const selectedSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
      if (!selectedSeasonData) {
        toast({ title: "Saisondaten nicht gefunden", variant: "destructive" });
        setIsLoadingTeams(false);
        return;
      }

      let qConstraints: any[] = [
        where("competitionYear", "==", selectedSeasonData.competitionYear),
      ];
      if (selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE) {
        qConstraints.push(where("clubId", "==", selectedClubIdFilter));
      }
      if (selectedLeagueIdFilter !== ALL_LEAGUES_FILTER_VALUE) {
        qConstraints.push(where("leagueId", "==", selectedLeagueIdFilter));
      }
      
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), ...qConstraints, orderBy("name", "asc"));
      
      const querySnapshot = await getDocs(teamsQuery);
      const fetchedTeams = querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), shooterIds: d.data().shooterIds || [] } as Team));
      setTeamsForDisplay(fetchedTeams);
      console.log(`AdminTeamsPage: handleSearchTeams - Found ${fetchedTeams.length} teams.`);
      if (fetchedTeams.length === 0) {
        toast({title: "Keine Mannschaften", description: "Für die gewählten Filter wurden keine Mannschaften gefunden."});
      }
    } catch (error) {
      console.error("AdminTeamsPage: Error fetching teams for display:", error);
      toast({ title: "Fehler beim Laden der Mannschaften", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingTeams(false);
    }
  }, [selectedSeasonId, selectedClubIdFilter, selectedLeagueIdFilter, allSeasons, toast]);

  const { id: ctId, clubId: ctClubId, competitionYear: ctCompYear, seasonId: ctSeasonIdFromTeam, leagueId: ctLeagueIdFromTeam } = currentTeam || {};
  const currentTeamClubId = formMode === 'new' ? currentTeam?.clubId : ctClubId;
  const currentTeamCompetitionYear = formMode === 'new' ? allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear : ctCompYear;

  const fetchShootersAndValidationDataForDialog = useCallback(async () => {
    if (!isFormOpen || !currentTeamClubId || currentTeamCompetitionYear === undefined) {
      setAvailableClubShooters([]);
      setAllTeamsForYearValidation([]);
      console.log("AdminTeamsPage: DIALOG - Conditions not met for fetching shooters/validation data.", {isFormOpen, currentTeamClubId, currentTeamCompetitionYear});
      setIsLoadingShootersForDialog(false);
      setIsLoadingValidationData(false);
      return;
    }
    
    console.log(`AdminTeamsPage: DIALOG - Fetching shooters for clubId: ${currentTeamClubId}, validation data for year: ${currentTeamCompetitionYear}`);
    setIsLoadingShootersForDialog(true);
    setIsLoadingValidationData(true);
    try {
      const shootersQuery = query(collection(db, SHOOTERS_COLLECTION), where("clubId", "==", currentTeamClubId), orderBy("name", "asc"));
      const teamsForYearQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", currentTeamCompetitionYear));
      
      const [shootersSnapshot, teamsForYearSnapshot] = await Promise.all([
        getDocs(shootersQuery),
        getDocs(teamsForYearQuery),
      ]);

      const fetchedShooters = shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), teamIds: d.data().teamIds || [] } as Shooter));
      setAvailableClubShooters(fetchedShooters);
      console.log(`AdminTeamsPage: DIALOG - Fetched ${fetchedShooters.length} shooters for club ${currentTeamClubId}.`);
      
      const leagueMap: Record<string, FirestoreLeagueSpecificDiscipline | undefined> = {};
      allLeagues.forEach(l => { if (l.id) leagueMap[l.id] = l.type; });

      const teamsForValidation = teamsForYearSnapshot.docs.map(d => {
        const teamData = d.data() as Team;
        return { 
          id: d.id, 
          ...teamData, 
          shooterIds: teamData.shooterIds || [],
          leagueType: teamData.leagueId ? leagueMap[teamData.leagueId] : undefined,
          leagueCompetitionYear: teamData.competitionYear,
          currentShooterCount: (teamData.shooterIds || []).length,
        } as TeamValidationInfo;
      });
      setAllTeamsForYearValidation(teamsForValidation);
      console.log(`AdminTeamsPage: DIALOG - Fetched ${teamsForValidation.length} teams for year ${currentTeamCompetitionYear} validation.`);

    } catch (error) {
      console.error("AdminTeamsPage: DIALOG - Error fetching shooters/validation data:", error);
      toast({ title: "Fehler", description: "Schützen oder Validierungsdaten für Dialog konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingShootersForDialog(false);
      setIsLoadingValidationData(false);
    }
  }, [isFormOpen, currentTeamClubId, currentTeamCompetitionYear, allLeagues, toast]);
  
  useEffect(() => {
    if (isFormOpen && ((formMode === 'new' && currentTeamClubId && currentTeamCompetitionYear !== undefined) || (formMode === 'edit' && ctClubId && ctCompYear !== undefined))) {
      fetchShootersAndValidationDataForDialog();
    }
  }, [isFormOpen, formMode, currentTeamClubId, currentTeamCompetitionYear, ctClubId, ctCompYear, fetchShootersAndValidationDataForDialog]);


  useEffect(() => {
    console.log("AdminTeamsPage: DIALOG (EDIT) - useEffect for selectedShooterIdsInForm triggered. isFormOpen:", isFormOpen, "formMode:", formMode, "ctId:", ctId, "isLoadingShootersForDialog:", isLoadingShootersForDialog, "isLoadingValidationData:", isLoadingValidationData, "availableClubShooters length:", availableClubShooters.length);
    if (isFormOpen && formMode === 'edit' && ctId && !isLoadingShootersForDialog && !isLoadingValidationData) {
        const currentTeamDataFromState = teamsForDisplay.find(t => t.id === ctId);
        const persistedIdsFromDB = currentTeamDataFromState?.shooterIds || [];
        setPersistedShooterIdsForTeam(persistedIdsFromDB);
        
        const validInitialShooterIds = persistedIdsFromDB.filter(shooterId =>
            availableClubShooters.some(shooter => shooter.id === shooterId)
        );
        
        console.log("AdminTeamsPage: DIALOG (EDIT) - Persisted IDs from DB:", JSON.stringify(persistedIdsFromDB));
        console.log("AdminTeamsPage: DIALOG (EDIT) - Available Club Shooters for check:", JSON.stringify(availableClubShooters.map(s=>s.id)));
        console.log("AdminTeamsPage: DIALOG (EDIT) - Setting selectedShooterIdsInForm to valid initial IDs:", JSON.stringify(validInitialShooterIds));
        setSelectedShooterIdsInForm(validInitialShooterIds);

    } else if (isFormOpen && formMode === 'new') {
        setSelectedShooterIdsInForm([]); 
        setPersistedShooterIdsForTeam([]);
        console.log("AdminTeamsPage: DIALOG (NEW) - Initializing/Clearing selectedShooterIdsInForm.");
    }
  }, [isFormOpen, formMode, ctId, teamsForDisplay, isLoadingShootersForDialog, isLoadingValidationData, availableClubShooters]);


  const handleAddNewTeam = () => {
    if (!selectedSeasonId) { 
      toast({ title: "Saison fehlt", description: "Bitte zuerst eine Saison auswählen.", variant: "destructive" }); return;
    }
    const currentSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeasonData) {
      toast({ title: "Saisonfehler", description: "Ausgewählte Saisondaten nicht gefunden.", variant: "destructive" }); return;
    }

    setCurrentTeam({ 
      clubId: selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE ? selectedClubIdFilter : '', // Pre-select club if filter is active
      competitionYear: currentSeasonData.competitionYear,
      seasonId: selectedSeasonId, 
      name: '', 
      shooterIds: [],
      leagueId: selectedLeagueIdFilter !== ALL_LEAGUES_FILTER_VALUE ? selectedLeagueIdFilter : null, 
    });
    setFormMode('new');
    setIsFormOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setFormMode('edit');
    setCurrentTeam(team);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (team: Team) => {
    setTeamToDelete(team);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete || !teamToDelete.id || !user) {
        toast({ title: "Fehler", description: "Keine Mannschaft zum Löschen ausgewählt oder Benutzer nicht authentifiziert.", variant: "destructive" });
        setTeamToDelete(null); 
        return;
    }
    setIsDeletingTeam(true);
    try {
      const batch = writeBatch(db);
      const teamDocRef = doc(db, TEAMS_COLLECTION, teamToDelete.id);
      batch.delete(teamDocRef);

      const shooterIdsInDeletedTeam = teamToDelete.shooterIds || [];
      if (shooterIdsInDeletedTeam.length > 0) {
        shooterIdsInDeletedTeam.forEach(shooterId => {
          if (shooterId && typeof shooterId === 'string' && shooterId.trim() !== '') {
            const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
            batch.update(shooterDocRef, { teamIds: arrayRemove(teamToDelete.id) });
          }
        });
      }
      
      await batch.commit();
      toast({ title: "Mannschaft gelöscht", description: `"${teamToDelete.name}" wurde erfolgreich entfernt.` });
      handleSearchTeams(); 
    } catch (error) {
      console.error("AdminTeamsPage: Error deleting team:", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsDeletingTeam(false);
      setTeamToDelete(null); 
    }
  };
  
  const handleSubmitTeamForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentTeam || !currentTeam.name?.trim() || !currentTeam.clubId || !currentTeam.seasonId || currentTeam.competitionYear === undefined || !user) {
      toast({ title: "Ungültige Eingabe", description: "Name, Verein, Saison und Wettkampfjahr sind erforderlich.", variant: "destructive" });
      return;
    }

    if (selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM) {
      toast({ title: "Zu viele Schützen", description: `Maximal ${MAX_SHOOTERS_PER_TEAM} Schützen pro Mannschaft. Aktuell: ${selectedShooterIdsInForm.length}`, variant: "destructive" });
      return;
    }
    
    setIsSubmittingForm(true);
    
    const teamDataToSave: Omit<Team, 'id'> & { id?: string } = { 
      name: currentTeam.name.trim(),
      clubId: currentTeam.clubId,
      seasonId: currentTeam.seasonId,
      competitionYear: currentTeam.competitionYear,
      leagueId: currentTeam.leagueId || null, 
      shooterIds: selectedShooterIdsInForm, 
    };
    
    const currentTeamLeague = allLeagues.find(l => l.id === teamDataToSave.leagueId);
    const currentTeamSpecificLeagueType = currentTeamLeague?.type;
    
    console.log("AdminTeamsPage: handleSubmit - Validating shooter assignments. Current team league type:", currentTeamSpecificLeagueType);

    if (teamDataToSave.leagueId && currentTeamSpecificLeagueType && teamDataToSave.competitionYear !== undefined) {
        const categoryOfCurrentTeamForValidation = getDisciplineCategory(currentTeamSpecificLeagueType);
        console.log("AdminTeamsPage: handleSubmit - Category for current team:", categoryOfCurrentTeamForValidation);
        
        if (categoryOfCurrentTeamForValidation) {
            for (const shooterId of selectedShooterIdsInForm) {
              const isNewAssignmentToThisTeam = formMode === 'new' || !persistedShooterIdsForTeam.includes(shooterId);
              
              if (isNewAssignmentToThisTeam) { 
                const shooterInfo = availableClubShooters.find(s => s.id === shooterId);
                if (!shooterInfo || !shooterInfo.id) {
                    console.warn(`AdminTeamsPage: handleSubmit - Shooter info for ID ${shooterId} not found in availableClubShooters. Skipping validation for this shooter.`);
                    continue; 
                }

                let conflictFound = false;
                for (const existingTeamId of (shooterInfo.teamIds || [])) {
                  if (formMode === 'edit' && currentTeam.id && existingTeamId === currentTeam.id) continue; 
                  
                  const teamValidationEntry = allTeamsForYearValidation.find(t => t.id === existingTeamId);
                  if (teamValidationEntry && teamValidationEntry.leagueCompetitionYear === teamDataToSave.competitionYear) {
                    const existingTeamSpecificTypeFromValidation = teamValidationEntry.leagueType; 
                    if (existingTeamSpecificTypeFromValidation) {
                       const categoryOfExistingTeam = getDisciplineCategory(existingTeamSpecificTypeFromValidation);
                       if (categoryOfExistingTeam && categoryOfExistingTeam === categoryOfCurrentTeamForValidation) { 
                           console.warn(`AdminTeamsPage: handleSubmit - Conflict for shooter ${shooterInfo.name} (ID: ${shooterId}). Already in team ${teamValidationEntry.name} (ID: ${existingTeamId}) of same category ${categoryOfCurrentTeamForValidation} in year ${teamDataToSave.competitionYear}.`);
                           conflictFound = true;
                           break;
                       }
                    }
                  }
                }
                if (conflictFound) {
                     toast({ title: "Regelverstoß Schützenzuordnung", description: `${shooterInfo.name} ist bereits in einem ${categoryOfCurrentTeamForValidation}-Team in ${teamDataToSave.competitionYear} gemeldet.`, variant: "destructive", duration: 10000 });
                     setIsSubmittingForm(false); return;
                }
              }
            }
        } else {
            console.log("AdminTeamsPage: handleSubmit - No specific category for current team's league type, skipping shooter discipline conflict validation.");
        }
    } else {
        console.log("AdminTeamsPage: handleSubmit - No league assigned to current team or league type/year missing, skipping shooter discipline conflict validation.");
    }
    
    try {
      const teamsCollectionRef = collection(db, TEAMS_COLLECTION);
      let duplicateQuery;
      const baseDuplicateConditions: any[] = [
        where("name", "==", teamDataToSave.name),
        where("clubId", "==", teamDataToSave.clubId),
        where("competitionYear", "==", teamDataToSave.competitionYear),
      ];
      // Only include leagueId in duplicate check if it's actually set (not null/empty)
      if (teamDataToSave.leagueId && typeof teamDataToSave.leagueId === 'string' && teamDataToSave.leagueId.trim() !== "") {
        baseDuplicateConditions.push(where("leagueId", "==", teamDataToSave.leagueId));
      }

      if (formMode === 'edit' && currentTeam.id) {
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions, where(documentId(), "!=", currentTeam.id));
      } else {
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions);
      }
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        toast({ title: "Doppelter Mannschaftsname", description: `Eine Mannschaft mit diesem Namen existiert bereits für diesen Verein, dieses Wettkampfjahr ${teamDataToSave.leagueId ? 'und diese Liga' : ''}.`, variant: "destructive", duration: 7000});
        setIsSubmittingForm(false); return; 
      }

      const batch = writeBatch(db);
      let teamIdForShooterUpdates: string = currentTeam.id || '';
      
      const originalShooterIds = formMode === 'edit' ? persistedShooterIdsForTeam : [];
      const shootersToAdd = selectedShooterIdsInForm.filter(id => !originalShooterIds.includes(id));
      const shootersToRemove = originalShooterIds.filter(id => !selectedShooterIdsInForm.includes(id) && availableClubShooters.some(s => s.id === id)); // Ensure shooter still exists in club
      
      console.log("AdminTeamsPage: handleSubmit - Original shooter IDs:", JSON.stringify(originalShooterIds));
      console.log("AdminTeamsPage: handleSubmit - Selected shooter IDs in form:", JSON.stringify(selectedShooterIdsInForm));
      console.log("AdminTeamsPage: handleSubmit - Shooters to add to team:", JSON.stringify(shootersToAdd));
      console.log("AdminTeamsPage: handleSubmit - Shooters to remove from team:", JSON.stringify(shootersToRemove));

      if (formMode === 'new') {
        const newTeamRef = doc(collection(db, TEAMS_COLLECTION)); 
        teamIdForShooterUpdates = newTeamRef.id;
        const { id, ...dataForNewTeam } = teamDataToSave; 
        batch.set(newTeamRef, {...dataForNewTeam, shooterIds: selectedShooterIdsInForm});
        toast({ title: "Mannschaft erstellt", description: `"${dataForNewTeam.name}" wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentTeam.id) {
        teamIdForShooterUpdates = currentTeam.id;
        const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdForShooterUpdates);
        const { id, ...dataForTeamUpdate } = teamDataToSave; 
        batch.update(teamDocRef, {...dataForTeamUpdate, shooterIds: selectedShooterIdsInForm} as Partial<Team>); 
        toast({ title: "Mannschaft aktualisiert", description: `"${dataForTeamUpdate.name}" wurde erfolgreich aktualisiert.` });
      } else {
        setIsSubmittingForm(false);
        throw new Error("AdminTeamsPage: handleSubmit - Invalid form mode or missing team ID for edit.");
      }
      
      for (const shooterId of shootersToAdd) {
        if(availableClubShooters.some(s => s.id === shooterId && s.id)){ 
          console.log(`AdminTeamsPage: handleSubmit - Adding team ${teamIdForShooterUpdates} to shooter ${shooterId}`);
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayUnion(teamIdForShooterUpdates) });
        } else {
          console.warn(`AdminTeamsPage: handleSubmit - Shooter ID ${shooterId} to add not found in availableClubShooters. Skipping update for this shooter.`);
        }
      }
      for (const shooterId of shootersToRemove) {
        if(availableClubShooters.some(s => s.id === shooterId && s.id)){
          console.log(`AdminTeamsPage: handleSubmit - Removing team ${teamIdForShooterUpdates} from shooter ${shooterId}`);
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayRemove(teamIdForShooterUpdates) });
        } else {
           console.warn(`AdminTeamsPage: handleSubmit - Shooter ID ${shooterId} to remove not found in availableClubShooters. Skipping update for this shooter.`);
        }
      }
      
      await batch.commit();
      console.log("AdminTeamsPage: handleSubmit - Batch commit successful.");
      setIsFormOpen(false);
      setCurrentTeam(null);
      handleSearchTeams(); 
    } catch (error) {
      console.error("AdminTeamsPage: handleSubmit - Error saving team or updating shooters: ", error);
      const action = formMode === 'new' ? 'erstellen' : 'aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Team, 'name' | 'clubId' | 'leagueId'>, value: string | null) => {
    setCurrentTeam(prev => {
        if (!prev) return null;
        const updatedTeam = { ...prev, [field]: value };
        if (field === 'clubId' && value !== prev.clubId) {
          console.log("AdminTeamsPage: DIALOG - Club changed to:", value);
          setAvailableClubShooters([]); 
          setSelectedShooterIdsInForm([]); 
          if (value && prev.competitionYear !== undefined) {
            // Trigger refetch in useEffect listening to currentTeam.clubId & currentTeam.competitionYear
          }
        }
        return updatedTeam;
    });
  };

  const handleShooterSelectionChange = (shooterId: string, isChecked: boolean) => {
    if (isSubmittingForm || isLoadingShootersForDialog || isLoadingValidationData) return;

    const currentTeamData = currentTeam; 
    if (!currentTeamData || currentTeamData.competitionYear === undefined) {
      console.warn("AdminTeamsPage: handleShooterSelectionChange - currentTeam or competitionYear is undefined.");
      return;
    }
    
    const currentTeamLeagueData = allLeagues.find(l => l.id === currentTeamData.leagueId);
    const currentTeamSpecificLeagueType = currentTeamLeagueData?.type;
    const categoryOfCurrentTeam = currentTeamSpecificLeagueType ? getDisciplineCategory(currentTeamSpecificLeagueType) : null;

    if (isChecked) { 
      if (selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) {
          toast({ title: "Maximale Schützenzahl erreicht", description: `Maximal ${MAX_SHOOTERS_PER_TEAM} Schützen pro Team.`, variant: "warning"});
          return; 
      }
      if (categoryOfCurrentTeam && currentTeamData.competitionYear !== undefined) {
          const shooterBeingChecked = availableClubShooters.find(s => s.id === shooterId);
          if (shooterBeingChecked && shooterBeingChecked.id) { 
              let conflictFound = false;
              for (const existingTeamId of (shooterBeingChecked.teamIds || [])) {
                  if (formMode === 'edit' && currentTeamData.id && existingTeamId === currentTeamData.id) continue; 
                  
                  const teamValidationEntry = allTeamsForYearValidation.find(t => t.id === existingTeamId);
                  if (teamValidationEntry && teamValidationEntry.leagueCompetitionYear === currentTeamData.competitionYear) { 
                      const existingTeamType = teamValidationEntry.leagueType; 
                      if (existingTeamType) {
                         const categoryOfExistingTeam = getDisciplineCategory(existingTeamType);
                         if (categoryOfExistingTeam && categoryOfExistingTeam === categoryOfCurrentTeam) { 
                             conflictFound = true;
                             break;
                         }
                      }
                  }
              }
              if (conflictFound) {
                  toast({ title: "Regelverstoß", description: `${shooterBeingChecked.name} ist bereits in einem ${categoryOfCurrentTeam}-Team dieses Jahres gemeldet.`, variant: "destructive", duration: 7000 });
                  return; 
              }
          } else {
            console.warn(`AdminTeamsPage: handleShooterSelectionChange - Shooter with ID ${shooterId} not found in availableClubShooters.`);
          }
      } else {
        console.log("AdminTeamsPage: handleShooterSelectionChange - No category for current team or year undefined, skipping discipline conflict check.");
      }
    } 
    setSelectedShooterIdsInForm(prevSelectedIds =>
      isChecked ? [...prevSelectedIds, shooterId] : prevSelectedIds.filter(id => id !== shooterId)
    );
  };
  
  const getClubName = (clubId?: string | null): string => {
    if (!clubId) return 'N/A';
    return allClubs.find(c => c.id === clubId)?.name || 'Unbek. Verein';
  };

  const getLeagueName = (leagueId?: string | null): string => {
    if (!leagueId) return 'Nicht zugewiesen'; 
    return allLeagues.find(l => l.id === leagueId)?.name || 'Unbekannte Liga';
  };

  const leaguesForFilterDropdown = useMemo(() => {
    if (!selectedSeasonId || allLeagues.length === 0) return [];
    return allLeagues
      .filter(l => l.seasonId === selectedSeasonId && l.id && typeof l.id === 'string' && l.id.trim() !== '') // defensive filter
      .sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [selectedSeasonId, allLeagues]);
  
  const availableLeaguesForDialog = useMemo(() => {
    const seasonOfCurrentTeam = currentTeam?.seasonId || selectedSeasonId;
    if (!seasonOfCurrentTeam || allLeagues.length === 0) return [];
    return allLeagues
        .filter(l => l.seasonId === seasonOfCurrentTeam && l.id && typeof l.id === 'string' && l.id.trim() !== '') // defensive filter
        .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [currentTeam?.seasonId, selectedSeasonId, allLeagues]);


  if (isLoadingData) { 
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Lade Basisdaten...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary">Mannschaftsverwaltung (Admin)</h1>
        <div className="flex flex-col sm:flex-row items-end gap-2 w-full md:w-auto">
           <div className="w-full sm:w-auto space-y-1.5">
            <Label htmlFor="saison-select-admin-teams">Saison</Label>
            <Select value={selectedSeasonId} onValueChange={(val) => { setSelectedSeasonId(val); setSelectedLeagueIdFilter(ALL_LEAGUES_FILTER_VALUE); setTeamsForDisplay([]); }}>
              <SelectTrigger id="saison-select-admin-teams" className="w-full sm:w-[200px]">
                 <SelectValue placeholder={isLoadingData && allSeasons.length === 0 ? "Lade Saisons..." : (allSeasons.filter(s => s && typeof s.id === 'string' && s.id.trim() !== "").length === 0 ? "Keine Saisons" : "Saison wählen")} />
              </SelectTrigger>
              <SelectContent>
                {allSeasons
                  .filter(s => s && typeof s.id === 'string' && s.id.trim() !== "")
                  .map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                }
                {allSeasons.filter(s => s && typeof s.id === 'string' && s.id.trim() !== "").length === 0 && !isLoadingData && 
                  <SelectItem value="NO_SEASONS_TEAMS_ADMIN_PLACEHOLDER_FILTER" disabled>Keine Saisons verfügbar</SelectItem>
                }
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-auto space-y-1.5">
            <Label htmlFor="club-filter-admin-teams">Verein</Label>
            <Select value={selectedClubIdFilter} onValueChange={(val) => {setSelectedClubIdFilter(val); setTeamsForDisplay([]);}}>
                <SelectTrigger id="club-filter-admin-teams" className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Alle Vereine filtern" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_CLUBS_FILTER_VALUE}>Alle Vereine</SelectItem>
                    {allClubs.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    {allClubs.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").length === 0 && !isLoadingData &&
                        <SelectItem value="NO_CLUBS_TEAMS_ADMIN_PLACEHOLDER_FILTER" disabled>Keine Vereine verfügbar</SelectItem>
                    }
                </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-auto space-y-1.5">
            <Label htmlFor="liga-filter-admin-teams">Liga</Label>
            <Select value={selectedLeagueIdFilter} onValueChange={(val) => {setSelectedLeagueIdFilter(val); setTeamsForDisplay([]);}} disabled={!selectedSeasonId || leaguesForFilterDropdown.length === 0}>
                <SelectTrigger id="liga-filter-admin-teams" className="w-full sm:w-[220px]">
                    <SelectValue placeholder={!selectedSeasonId ? "Saison wählen" : (leaguesForFilterDropdown.length === 0 ? "Keine Ligen für Saison" : "Alle Ligen")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_LEAGUES_FILTER_VALUE}>Alle Ligen</SelectItem>
                    {leaguesForFilterDropdown.filter(l => l && typeof l.id === 'string' && l.id.trim() !== "").map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                     {leaguesForFilterDropdown.length === 0 && selectedSeasonId &&
                        <SelectItem value="NO_LEAGUES_FOR_SEASON_FILTER" disabled>Keine Ligen für diese Saison</SelectItem>
                    }
                </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearchTeams} disabled={!selectedSeasonId || isLoadingTeams || isLoadingData} className="w-full sm:w-auto whitespace-nowrap">
            {isLoadingTeams ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Users className="h-4 w-4 mr-2" />} Mannschaften suchen
          </Button>
          <Button onClick={handleAddNewTeam} disabled={isLoadingData || !selectedSeasonId || !selectedClubIdFilter || selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE} className="w-full sm:w-auto whitespace-nowrap">
            <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft
          </Button>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>
            Mannschaften für {allSeasons.find(s=>s.id === selectedSeasonId)?.name || (selectedSeasonId ? "gewählte Saison" : "Saison wählen")}
            {selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE && ` / ${allClubs.find(c=>c.id===selectedClubIdFilter)?.name || ''}`}
            {selectedLeagueIdFilter !== ALL_LEAGUES_FILTER_VALUE && ` / ${allLeagues.find(l=>l.id===selectedLeagueIdFilter)?.name || ''}`}
          </CardTitle>
          <CardDescription>
            {selectedSeasonId ? "Verwalten Sie hier alle Mannschaften." : "Bitte wählen Sie Filter aus, um Mannschaften anzuzeigen oder anzulegen."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTeams ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Mannschaften...</p></div>
          ) : (!selectedSeasonId) ? (
             <div className="p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p>Bitte wählen Sie zuerst oben eine Saison aus.</p>
             </div>
          ) : teamsForDisplay.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Liga</TableHead><TableHead>Jahr</TableHead><TableHead>Verein</TableHead><TableHead className="text-center">Schützen</TableHead><TableHead className="text-right">Aktionen</TableHead></TableRow></TableHeader>
              <TableBody>
                {teamsForDisplay.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{getLeagueName(team.leagueId)}</TableCell>
                    <TableCell>{team.competitionYear}</TableCell>
                    <TableCell>{getClubName(team.clubId)}</TableCell>
                    <TableCell className="text-center">{team.shooterIds?.length || 0} / {MAX_SHOOTERS_PER_TEAM}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditTeam(team)} aria-label="Mannschaft bearbeiten"><Edit className="h-4 w-4" /></Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteConfirmation(team)} aria-label="Mannschaft löschen"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Mannschaft löschen?</AlertDialogTitle><AlertDialogDescription>Möchten Sie "{teamToDelete?.name}" wirklich löschen? Dies entfernt auch die Zuordnung der Schützen zu dieser Mannschaft.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setTeamToDelete(null)}>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteTeam} disabled={isDeletingTeam} className="bg-destructive hover:bg-destructive/90">
                                {isDeletingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Löschen
                              </AlertDialogAction>
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
              <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
              <p>Keine Mannschaften für die gewählten Filter gefunden.</p>
              {selectedSeasonId && selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE && <p className="text-sm mt-1">Klicken Sie auf "Neue Mannschaft", um eine für den gewählten Verein anzulegen.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) {setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]);} setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitTeamForm}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}</DialogTitle>
              <DialogDescriptionComponent>
                Für Liga: {currentTeam?.leagueId ? getLeagueName(currentTeam.leagueId) : "Nicht zugewiesen"} (Saison: {currentTeam?.seasonId ? (allSeasons.find(s => s.id === currentTeam.seasonId)?.name) : (allSeasons.find(s => s.id === selectedSeasonId)?.name || 'Keine Saison gewählt')})
              </DialogDescriptionComponent>
            </DialogHeader>
            {currentTeam && (
              <div className="space-y-4 py-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="teamNameFormDialogAdmin">Name der Mannschaft</Label>
                        <Input id="teamNameFormDialogAdmin" value={currentTeam.name || ''} onChange={(e) => handleFormInputChange('name', e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="teamClubSelectAdmin">Verein</Label>
                        <Select 
                            value={currentTeam.clubId || ''} 
                            onValueChange={(value) => handleFormInputChange('clubId', value)}
                            disabled={isLoadingData || allClubs.length === 0 || formMode === 'edit'}
                            required
                        >
                            <SelectTrigger id="teamClubSelectAdmin">
                                <SelectValue placeholder={isLoadingData && allClubs.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").length === 0 ? "Lade Vereine..." : (allClubs.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").length === 0 ? "Keine Vereine" : "Verein wählen...")} />
                            </SelectTrigger>
                            <SelectContent>
                                {allClubs
                                    .filter(c => c && typeof c.id === 'string' && c.id.trim() !== "")
                                    .map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)
                                }
                                {allClubs.filter(c => c && typeof c.id === 'string' && c.id.trim() !== "").length === 0 && !isLoadingData && 
                                    <SelectItem value="NO_CLUBS_TEAMS_ADMIN_DIALOG_FORM" disabled>Keine Vereine verfügbar</SelectItem>
                                }
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="teamLeagueSelectDialogAdmin">Liga zuweisen (Admin)</Label>
                   <Select 
                        value={currentTeam.leagueId || ""}
                        onValueChange={(value) => handleFormInputChange('leagueId', value === "NO_LEAGUE_SELECTED_PLACEHOLDER" ? null : value)}
                        disabled={isLoadingData || availableLeaguesForDialog.length === 0}
                    >
                        <SelectTrigger id="teamLeagueSelectDialogAdmin">
                            <SelectValue placeholder="- Liga auswählen / Nicht zugewiesen -" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NO_LEAGUE_SELECTED_PLACEHOLDER">- Nicht zugewiesen -</SelectItem>
                            {console.log("AdminTeamsPage: DIALOG - Rendering leagues for Select (FINAL FILTERED):", JSON.stringify(availableLeaguesForDialog.filter(league => league && typeof league.id === 'string' && league.id.trim() !== "")))}
                            {availableLeaguesForDialog
                                .filter(league => league && typeof league.id === 'string' && league.id.trim() !== "")
                                .map(league => <SelectItem key={league.id} value={league.id}>{league.name} ({league.type})</SelectItem>)
                            }
                            {availableLeaguesForDialog.filter(l => l && typeof l.id === 'string' && l.id.trim() !== "").length === 0 && (
                                <SelectItem value="NO_LEAGUES_AVAILABLE_PLACEHOLDER" disabled>Keine Ligen für diese Saison verfügbar</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <Label>Schützen für diese Mannschaft auswählen</Label>
                    <span className="text-sm text-muted-foreground">{selectedShooterIdsInForm.length} / {MAX_SHOOTERS_PER_TEAM} ausgewählt</span>
                  </div>
                  {isLoadingShootersForDialog || isLoadingValidationData ? (
                     <div className="flex items-center justify-center p-4 h-40 border rounded-md bg-muted/30"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2">Lade Schützen...</p></div>
                  ) : availableClubShooters.length > 0 ? (
                    <ScrollArea className="h-40 rounded-md border p-2 bg-muted/20">
                      <div className="space-y-1">
                      {availableClubShooters.map(shooter => {
                        if (!shooter || !shooter.id) return null; 
                        const isSelected = selectedShooterIdsInForm.includes(shooter.id);
                        let isDisabledByMax = !isSelected && selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM;
                        let isDisabledByDisciplineConflict = false;
                        let disableReason = "";
                        
                        const currentTeamLeagueInfo = allLeagues.find(l => l.id === currentTeam?.leagueId);
                        const currentTeamSpecificLeagueType = currentTeamLeagueInfo?.type;
                        const currentTeamCompYear = currentTeam?.competitionYear;
                        const categoryOfCurrentTeam = currentTeamSpecificLeagueType ? getDisciplineCategory(currentTeamSpecificLeagueType) : null;

                        if (!isSelected && categoryOfCurrentTeam && currentTeamCompYear !== undefined) {
                            let assignedToSameCategoryInYear = false;
                            (shooter.teamIds || []).forEach(assignedTeamId => {
                                if (formMode === 'edit' && currentTeam?.id === assignedTeamId) return; 

                                const assignedTeamInfo = allTeamsForYearValidation.find(t => t.id === assignedTeamId);
                                if (assignedTeamInfo && assignedTeamInfo.leagueCompetitionYear === currentTeamCompYear) {
                                    const leagueTypeForValidation = assignedTeamInfo.leagueType; 
                                    if (leagueTypeForValidation) {
                                        const categoryOfAssignedTeam = getDisciplineCategory(leagueTypeForValidation);
                                        if (categoryOfAssignedTeam && categoryOfAssignedTeam === categoryOfCurrentTeam) {
                                            assignedToSameCategoryInYear = true;
                                        }
                                    }
                                }
                            });
                            if (assignedToSameCategoryInYear) {
                                isDisabledByDisciplineConflict = true;
                                disableReason = `(bereits in ${categoryOfCurrentTeam}-Team ${currentTeamCompYear})`;
                            }
                        }
                         if (isDisabledByMax && !isDisabledByDisciplineConflict) { 
                            disableReason = "(Max. Schützen erreicht)";
                        }
                        
                        const finalIsDisabled = isDisabledByMax || isLoadingValidationData || isDisabledByDisciplineConflict;
                        return (
                            <div key={shooter.id} className="flex items-center space-x-2 py-1.5 hover:bg-muted/50 rounded-md">
                            <Checkbox
                                id={`admin-team-shooter-assign-${shooter.id}`}
                                checked={isSelected}
                                onCheckedChange={(checkedState) => handleShooterSelectionChange(shooter.id, !!checkedState)}
                                disabled={finalIsDisabled}
                            />
                            <Label htmlFor={`admin-team-shooter-assign-${shooter.id}`} className={`font-normal cursor-pointer flex-grow ${finalIsDisabled ? 'opacity-50 cursor-not-allowed' : '' }`}>
                                {shooter.name}
                                <span className='text-xs text-muted-foreground ml-1'>(Schnitt Vorjahr: folgt)</span>
                                {finalIsDisabled && <span className="text-xs text-destructive ml-1">{disableReason}</span>}
                            </Label>
                            </div>
                        );
                      })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 h-40 border rounded-md flex items-center justify-center bg-muted/30">
                      <p>{(currentTeam?.clubId) ? `Keine Schützen für '${getClubName(currentTeam?.clubId) || 'Verein'}' gefunden oder alle bereits gültig zugeordnet.` : 'Verein für Mannschaft wählen, um Schützen anzuzeigen.'}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5"> 
                        <Label htmlFor="teamSeasonDisplayFormDialogAdmin">Saison</Label>
                        <Input id="teamSeasonDisplayFormDialogAdmin" value={allSeasons.find(s => s.id === (currentTeam?.seasonId || selectedSeasonId))?.name || ''} disabled className="bg-muted/50" />
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="teamCompetitionYearDisplayFormDialogAdmin">Wettkampfjahr</Label>
                        <Input id="teamCompetitionYearDisplayFormDialogAdmin" value={currentTeam?.competitionYear?.toString() || ''} disabled className="bg-muted/50" />
                    </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]);}}>Abbrechen</Button>
              <Button type="submit" disabled={isSubmittingForm || isLoadingShootersForDialog || isLoadingValidationData}>
                 {(isSubmittingForm || isLoadingShootersForDialog || isLoadingValidationData) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

