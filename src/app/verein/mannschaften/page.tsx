// src/app/verein/mannschaften/page.tsx
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/hooks/use-auth'; // For user.uid when performing actions
import { useVereinAuth } from '@/app/verein/layout'; 
import type { Season, League, Club, Team, Shooter, TeamValidationInfo, FirestoreLeagueSpecificDiscipline } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, getDisciplineCategory, leagueDisciplineOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query,
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayUnion, arrayRemove, Timestamp
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "rwk_shooters";

export default function VereinMannschaftenPage() {
  const { user } = useAuth();
  const { userPermission, loadingPermissions, permissionError } = useVereinAuth();
  const { toast } = useToast();

  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [activeClubName, setActiveClubName] = useState<string | null>(null);
  const [assignedClubsForSelect, setAssignedClubsForSelect] = useState<Array<{ id: string; name: string }>>([]);
  
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]); // All leagues for name lookups and initial filter population
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [leaguesForFilterDropdown, setLeaguesForFilterDropdown] = useState<League[]>([]);
  const [selectedLeagueIdFilter, setSelectedLeagueIdFilter] = useState<string>('');
  
  const [teamsOfActiveClubAndSeason, setTeamsOfActiveClubAndSeason] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);

  const [availableClubShooters, setAvailableClubShooters] = useState<Shooter[]>([]);
  const [allTeamsForYearValidation, setAllTeamsForYearValidation] = useState<TeamValidationInfo[]>([]);
  
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // For seasons, allLeagues
  const [isLoadingAssignedClubDetails, setIsLoadingAssignedClubDetails] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingShootersForDialog, setIsLoadingShootersForDialog] = useState(false);
  const [isLoadingValidationData, setIsLoadingValidationData] = useState(false); // For allTeamsForYearValidation
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const [persistedShooterIdsForTeam, setPersistedShooterIdsForTeam] = useState<string[]>([]);
  const [selectedShooterIdsInForm, setSelectedShooterIdsInForm] = useState<string[]>([]);
  
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  // Effect to load names of assigned clubs for the dropdown if VV has multiple clubs
  useEffect(() => {
    const loadAssignedClubDetails = async () => {
      if (loadingPermissions || !userPermission) return;

      if (!userPermission.clubIds || userPermission.clubIds.length === 0) {
        setAssignedClubsForSelect([]);
        setActiveClubId(null);
        setActiveClubName(null);
        setIsLoadingAssignedClubDetails(false);
        return;
      }

      setIsLoadingAssignedClubDetails(true);
      try {
        const clubPromises = userPermission.clubIds.map(id => getFirestoreDoc(doc(db, CLUBS_COLLECTION, id)));
        const clubSnaps = await Promise.all(clubPromises);
        const clubs = clubSnaps
          .filter(snap => snap.exists())
          .map(snap => ({ id: snap.id, name: (snap.data() as Club).name || "Unbek. Verein" }));
        setAssignedClubsForSelect(clubs);

        if (clubs.length > 0) {
          if (clubs.length === 1) {
            setActiveClubId(clubs[0].id);
            setActiveClubName(clubs[0].name);
          } else {
            // If multiple clubs, user needs to select one.
            // If activeClubId is already set (e.g. from previous selection), keep it, otherwise prompt.
            if (!activeClubId && clubs[0]?.id) {
               // setActiveClubId(clubs[0].id); // Or set to null to force selection
               // setActiveClubName(clubs[0].name);
            } else if (activeClubId) {
                const currentActiveClub = clubs.find(c => c.id === activeClubId);
                setActiveClubName(currentActiveClub?.name || null);
            }
          }
        } else {
          setActiveClubId(null);
          setActiveClubName(null);
        }
      } catch (err) {
        console.error("VereinMannschaftenPage: Error fetching assigned club names:", err);
        toast({ title: "Fehler", description: "Vereinsinformationen konnten nicht geladen werden.", variant: "destructive" });
      } finally {
        setIsLoadingAssignedClubDetails(false);
      }
    };
    loadAssignedClubDetails();
  }, [userPermission, loadingPermissions, toast]);

  // Effect to load all seasons and all leagues (for lookups)
  useEffect(() => {
    const fetchGlobalData = async () => {
      if (!activeClubId && assignedClubsForSelect.length > 1) { // Don't load if multi-club VV hasn't selected a club
        setIsLoadingInitialData(false);
        return;
      }
      setIsLoadingInitialData(true);
      try {
        const seasonsSnapshotPromise = getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
        const leaguesSnapshotPromise = getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
        
        const [seasonsSnapshot, leaguesSnapshot] = await Promise.all([
          seasonsSnapshotPromise,
          leaguesSnapshotPromise,
        ]);

        setAllSeasons(seasonsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Season)));
        setAllLeagues(leaguesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as League)));
      } catch (error) {
        console.error("VereinMannschaftenPage: Error fetching global data (seasons/leagues):", error);
        toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    if(activeClubId || (userPermission?.clubIds && userPermission.clubIds.length === 1)){
        fetchGlobalData();
    }
  }, [toast, activeClubId, userPermission]);

  // Effect to populate leaguesForFilterDropdown based on selectedSeasonId
  useEffect(() => {
    if (selectedSeasonId && allLeagues.length > 0) {
      const season = allSeasons.find(s => s.id === selectedSeasonId);
      if (!season) {
        setLeaguesForFilterDropdown([]);
        return;
      }
      // Show leagues of the selected season where the active club has teams
      const teamsOfClubInSeasonQuery = query(
        collection(db, TEAMS_COLLECTION),
        where("clubId", "==", activeClubId || ""), // Ensure activeClubId is not null
        where("competitionYear", "==", season.competitionYear),
        where("leagueId", "!=", null) // Only teams assigned to a league
      );
      getDocs(teamsOfClubInSeasonQuery).then(teamsSnapshot => {
        const leagueIdsInUse = new Set(teamsSnapshot.docs.map(d => (d.data() as Team).leagueId));
        const filtered = allLeagues.filter(l => l.seasonId === selectedSeasonId && leagueIdsInUse.has(l.id));
        setLeaguesForFilterDropdown(filtered.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }).catch(error => {
        console.error("Error fetching teams to determine leagues for filter:", error);
        setLeaguesForFilterDropdown([]);
      });

    } else {
      setLeaguesForFilterDropdown([]);
    }
  }, [selectedSeasonId, allLeagues, allSeasons, activeClubId]);

  // Effect to fetch teams for the active club and selected season
  const fetchTeamsForClubAndSeason = useCallback(async () => {
    if (!activeClubId || !selectedSeasonId) {
      setTeamsOfActiveClubAndSeason([]);
      return;
    }
    setIsLoadingTeams(true);
    try {
      const selectedSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
      if (!selectedSeasonData) {
        setTeamsOfActiveClubAndSeason([]);
        setIsLoadingTeams(false);
        return;
      }
      const q = query(
        collection(db, TEAMS_COLLECTION),
        where("clubId", "==", activeClubId),
        where("competitionYear", "==", selectedSeasonData.competitionYear),
        orderBy("name", "asc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedTeams = querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), shooterIds: d.data().shooterIds || [] } as Team));
      setTeamsOfActiveClubAndSeason(fetchedTeams);
    } catch (error) {
      console.error("VereinMannschaftenPage: Error fetching teams for club/season:", error);
      toast({ title: "Fehler beim Laden der Mannschaften", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingTeams(false);
    }
  }, [activeClubId, selectedSeasonId, allSeasons, toast]);

  useEffect(() => {
    if (activeClubId && selectedSeasonId) {
      fetchTeamsForClubAndSeason();
    } else {
      setTeamsOfActiveClubAndSeason([]);
    }
  }, [activeClubId, selectedSeasonId, fetchTeamsForClubAndSeason]);

  // Effect to filter teams based on selectedLeagueIdFilter
  useEffect(() => {
    if (!selectedLeagueIdFilter) {
      setFilteredTeams(teamsOfActiveClubAndSeason);
    } else {
      setFilteredTeams(teamsOfActiveClubAndSeason.filter(team => team.leagueId === selectedLeagueIdFilter));
    }
  }, [selectedLeagueIdFilter, teamsOfActiveClubAndSeason]);

  // Destructure for dependency arrays
  const ctId = currentTeam?.id;
  const ctClubId = formMode === 'new' ? activeClubId : currentTeam?.clubId;
  const ctCompetitionYear = formMode === 'new' ? allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear : currentTeam?.competitionYear;

  const fetchShootersAndValidationDataForDialog = useCallback(async () => {
    if (!isFormOpen || !ctClubId || ctCompetitionYear === undefined) {
      setAvailableClubShooters([]);
      setAllTeamsForYearValidation([]);
      setIsLoadingShootersForDialog(false);
      setIsLoadingValidationData(false);
      return;
    }
    setIsLoadingShootersForDialog(true);
    setIsLoadingValidationData(true);
    try {
      const shootersQuery = query(collection(db, SHOOTERS_COLLECTION), where("clubId", "==", ctClubId), orderBy("name", "asc"));
      const teamsForYearQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", ctCompetitionYear));
      
      const [shootersSnapshot, teamsForYearSnapshot] = await Promise.all([
        getDocs(shootersQuery),
        getDocs(teamsForYearQuery)
      ]);

      const fetchedShooters = shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), teamIds: d.data().teamIds || [] } as Shooter));
      setAvailableClubShooters(fetchedShooters);
      
      const leagueMap: Record<string, FirestoreLeagueSpecificDiscipline | undefined> = {};
      allLeagues.forEach(l => { if (l.id) leagueMap[l.id] = l.type; });

      const teamsForValidation: TeamValidationInfo[] = teamsForYearSnapshot.docs.map(d => {
        const teamData = d.data() as Team;
        return { 
          id: d.id, 
          ...teamData, 
          shooterIds: teamData.shooterIds || [],
          leagueType: teamData.leagueId ? leagueMap[teamData.leagueId] : undefined,
          leagueCompetitionYear: teamData.competitionYear,
          currentShooterCount: (teamData.shooterIds || []).length,
        };
      });
      setAllTeamsForYearValidation(teamsForValidation);
    } catch (error) {
      console.error("VereinMannschaftenPage: DIALOG - Error fetching shooters/validation data:", error);
      toast({ title: "Fehler", description: "Schützen oder Validierungsdaten für Dialog konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setIsLoadingShootersForDialog(false);
      setIsLoadingValidationData(false);
    }
  }, [isFormOpen, ctClubId, ctCompetitionYear, allLeagues, toast]);
  
  useEffect(() => {
    if (isFormOpen && ((formMode === 'new' && activeClubId && ctCompetitionYear !== undefined) || (formMode === 'edit' && ctClubId && ctCompetitionYear !== undefined)) ) {
      fetchShootersAndValidationDataForDialog();
    }
  }, [isFormOpen, formMode, activeClubId, ctClubId, ctCompetitionYear, fetchShootersAndValidationDataForDialog]);

  useEffect(() => {
    if (isFormOpen && formMode === 'edit' && ctId && !isLoadingShootersForDialog && !isLoadingValidationData) {
        const currentTeamDataFromState = teamsOfActiveClubAndSeason.find(t => t.id === ctId);
        const persistedIdsFromDB = currentTeamDataFromState?.shooterIds || [];
        setPersistedShooterIdsForTeam(persistedIdsFromDB);
        
        const validInitialShooterIds = persistedIdsFromDB.filter(shooterId =>
            availableClubShooters.some(shooter => shooter.id === shooterId)
        );
        setSelectedShooterIdsInForm(validInitialShooterIds);
    } else if (isFormOpen && formMode === 'new') {
        setSelectedShooterIdsInForm([]); 
        setPersistedShooterIdsForTeam([]);
    }
  }, [isFormOpen, formMode, ctId, teamsOfActiveClubAndSeason, isLoadingShootersForDialog, isLoadingValidationData, availableClubShooters]);

  const handleAddNewTeam = () => {
    if (!activeClubId || !selectedSeasonId) { 
      toast({ title: "Auswahl erforderlich", description: "Bitte zuerst Verein und Saison auswählen.", variant: "destructive" }); return;
    }
    const selectedSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
    if (!selectedSeasonData) {
      toast({ title: "Saisonfehler", description: "Ausgewählte Saison nicht gefunden.", variant: "destructive" }); return;
    }
    setFormMode('new');
    setCurrentTeam({ 
      clubId: activeClubId,
      competitionYear: selectedSeasonData.competitionYear,
      seasonId: selectedSeasonId, 
      name: '', 
      shooterIds: [],
      leagueId: null, // VV legt Team ohne direkte Liga-Zuweisung an
    });
    setIsFormOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    if (team.clubId !== activeClubId) {
        toast({ title: "Nicht autorisiert", description: "Sie können nur Mannschaften Ihres aktuell ausgewählten Vereins bearbeiten.", variant: "destructive" });
        return;
    }
    setFormMode('edit');
    setCurrentTeam(team);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (team: Team) => {
    if (team.clubId !== activeClubId) {
        toast({ title: "Nicht autorisiert", description: "Sie können nur Mannschaften Ihres aktuell ausgewählten Vereins löschen.", variant: "destructive" });
        return;
    }
    setTeamToDelete(team);
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete || !teamToDelete.id || !user || teamToDelete.clubId !== activeClubId) {
        toast({ title: "Fehler", description: "Aktion nicht möglich oder nicht autorisiert.", variant: "destructive" });
        setTeamToDelete(null); 
        return;
    }
    setIsDeletingTeam(true);
    try {
      const batch = writeBatch(db);
      const teamDocRef = doc(db, TEAMS_COLLECTION, teamToDelete.id);
      batch.delete(teamDocRef);

      const shooterIdsInDeletedTeam = teamToDelete.shooterIds || [];
      shooterIdsInDeletedTeam.forEach(shooterId => {
        if (shooterId && typeof shooterId === 'string' && shooterId.trim() !== '') {
            const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
            batch.update(shooterDocRef, { teamIds: arrayRemove(teamToDelete.id) });
        }
      });
      
      await batch.commit();
      toast({ title: "Mannschaft gelöscht", description: `"${teamToDelete.name}" wurde erfolgreich entfernt.` });
      fetchTeamsForClubAndSeason(); 
    } catch (error) {
      console.error("VereinMannschaftenPage: Error deleting team:", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsDeletingTeam(false);
      setTeamToDelete(null); 
    }
  };
  
  const handleSubmitTeamForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentTeam || !currentTeam.name?.trim() || !activeClubId || currentTeam.competitionYear === undefined || !user) {
      toast({ title: "Ungültige Eingabe", description: "Name und Wettkampfjahr sind erforderlich.", variant: "destructive" });
      return;
    }
    if (formMode === 'edit' && currentTeam.clubId !== activeClubId) {
        toast({ title: "Fehler", description: "Versuch, Mannschaft für falschen Verein zu speichern.", variant: "destructive" });
        return;
    }
    if (selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM) {
      toast({ title: "Zu viele Schützen", description: `Maximal ${MAX_SHOOTERS_PER_TEAM} Schützen pro Mannschaft.`, variant: "destructive" });
      return;
    }
    
    setIsSubmittingForm(true);
    const teamDataToSave: Omit<Team, 'id'> & { id?: string } = { 
      name: currentTeam.name.trim(),
      clubId: activeClubId,
      seasonId: currentTeam.seasonId || selectedSeasonId,
      competitionYear: currentTeam.competitionYear,
      leagueId: currentTeam.leagueId || null, // VV weist keine Liga direkt zu
      shooterIds: selectedShooterIdsInForm, 
    };
    
    const currentTeamLeagueData = allLeagues.find(l => l.id === teamDataToSave.leagueId);
    const currentTeamSpecificLeagueType = currentTeamLeagueData?.type;

    if (teamDataToSave.leagueId && currentTeamSpecificLeagueType && teamDataToSave.competitionYear !== undefined) {
        const categoryOfCurrentTeamForValidation = getDisciplineCategory(currentTeamSpecificLeagueType);
        if (categoryOfCurrentTeamForValidation) {
            for (const shooterId of selectedShooterIdsInForm) {
              const isNewAssignmentToThisTeam = formMode === 'new' || !persistedShooterIdsForTeam.includes(shooterId);
              if (isNewAssignmentToThisTeam) { 
                const shooterInfo = availableClubShooters.find(s => s.id === shooterId);
                if (!shooterInfo || !shooterInfo.id) continue; 

                let conflictFound = false;
                for (const existingTeamId of (shooterInfo.teamIds || [])) {
                  if (formMode === 'edit' && currentTeam.id && existingTeamId === currentTeam.id) continue; 
                  
                  const teamValidationEntry = allTeamsForYearValidation.find(t => t.id === existingTeamId);
                  if (teamValidationEntry && teamValidationEntry.leagueCompetitionYear === teamDataToSave.competitionYear) {
                    const existingTeamSpecificTypeFromValidation = teamValidationEntry.leagueType; 
                    if (existingTeamSpecificTypeFromValidation) {
                       const categoryOfExistingTeam = getDisciplineCategory(existingTeamSpecificTypeFromValidation);
                       if (categoryOfExistingTeam && categoryOfExistingTeam === categoryOfCurrentTeamForValidation) { 
                           conflictFound = true; break;
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
        }
    }
    
    try {
      const teamsCollectionRef = collection(db, TEAMS_COLLECTION);
      let duplicateQuery;
      const baseDuplicateConditions: any[] = [
        where("name", "==", teamDataToSave.name),
        where("clubId", "==", teamDataToSave.clubId),
        where("competitionYear", "==", teamDataToSave.competitionYear),
      ];
      // Für VV: Da leagueId beim Neuanlegen null ist, wird sie nicht in die Duplikatsprüfung einbezogen.
      // Der Super-Admin würde beim Zuweisen einer Liga prüfen.

      if (formMode === 'edit' && currentTeam.id) {
        if (teamDataToSave.leagueId) baseDuplicateConditions.push(where("leagueId", "==", teamDataToSave.leagueId));
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions, where(documentId(), "!=", currentTeam.id));
      } else {
        // Für neue Teams durch VV ist leagueId null, also nicht in der Prüfung
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions);
      }
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        toast({ title: "Doppelter Mannschaftsname", description: `Eine Mannschaft mit diesem Namen existiert bereits für diesen Verein und dieses Wettkampfjahr ${teamDataToSave.leagueId ? 'und diese Liga (falls zugewiesen)' : ''}.`, variant: "destructive", duration: 7000});
        setIsSubmittingForm(false); return; 
      }

      const batch = writeBatch(db);
      let teamIdForShooterUpdates: string = currentTeam.id || '';
      
      const originalShooterIds = formMode === 'edit' ? persistedShooterIdsForTeam : [];
      const shootersToAdd = selectedShooterIdsInForm.filter(id => !originalShooterIds.includes(id));
      const shootersToRemove = originalShooterIds.filter(id => !selectedShooterIdsInForm.includes(id) && availableClubShooters.some(s => s.id === id));
      
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
        throw new Error("Invalid form mode or missing team ID for edit.");
      }
      
      shootersToAdd.forEach(shooterId => {
        if(availableClubShooters.some(s => s.id === shooterId)){ 
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayUnion(teamIdForShooterUpdates) });
        }
      });
      shootersToRemove.forEach(shooterId => {
          if(availableClubShooters.some(s => s.id === shooterId)){
            const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
            batch.update(shooterDocRef, { teamIds: arrayRemove(teamIdForShooterUpdates) });
          }
      });
      
      await batch.commit();
      setIsFormOpen(false);
      setCurrentTeam(null);
      fetchTeamsForClubAndSeason(); 
    } catch (error) {
      console.error("VereinMannschaftenPage: Error submitting team form:", error);
      const action = formMode === 'new' ? 'erstellen' : 'aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Team, 'name'>, value: string) => {
    setCurrentTeam(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
  const handleShooterSelectionChange = (shooterId: string, isChecked: boolean) => {
    if (isSubmittingForm || isLoadingShootersForDialog || isLoadingValidationData) return;

    const currentTeamData = currentTeam; 
    if (!currentTeamData || currentTeamData.competitionYear === undefined) return;
    
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
                             conflictFound = true; break;
                         }
                      }
                  }
              }
              if (conflictFound) {
                  toast({ title: "Regelverstoß", description: `${shooterBeingChecked.name} ist bereits in einem ${categoryOfCurrentTeam}-Team dieses Jahres gemeldet.`, variant: "destructive", duration: 7000 });
                  return; 
              }
          }
      }
    } 
    setSelectedShooterIdsInForm(prevSelectedIds =>
      isChecked ? [...prevSelectedIds, shooterId] : prevSelectedIds.filter(id => id !== shooterId)
    );
  };

  const getLeagueName = (leagueId?: string | null): string => {
    if (!leagueId) return 'Nicht zugewiesen (Admin Aufgabe)'; 
    return allLeagues.find(l => l.id === leagueId)?.name || 'Unbekannte Liga';
  };

  if (loadingPermissions || isLoadingAssignedClubDetails) { 
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Lade Berechtigungen & Vereinsdetails...</p></div>;
  }
  if (permissionError) {
    return <div className="p-6"><Card className="border-destructive"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Zugriffsproblem</CardTitle></CardHeader><CardContent><p>{permissionError}</p></CardContent></Card></div>;
  }
  if (!userPermission?.clubIds || userPermission.clubIds.length === 0) {
    return <div className="p-6"><Card className="border-amber-500"><CardHeader><CardTitle className="text-amber-700 flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Kein Verein zugewiesen</CardTitle></CardHeader><CardContent><p>Ihrem Konto ist kein Verein zugewiesen. Bitte kontaktieren Sie den Administrator.</p></CardContent></Card></div>;
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Meine Mannschaften</h1>
          {activeClubName && <p className="text-muted-foreground">Aktiver Verein: {activeClubName}</p>}
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-2 w-full md:w-auto">
         {userPermission && userPermission.clubIds && userPermission.clubIds.length > 1 && (
            <div className="w-full sm:w-auto space-y-1.5">
              <Label htmlFor="vv-active-club-select">Verein auswählen</Label>
              <Select
                value={activeClubId || ""}
                onValueChange={(value) => {
                  setActiveClubId(value);
                  const selectedC = assignedClubsForSelect.find(c => c.id === value);
                  setActiveClubName(selectedC?.name || null);
                  setSelectedSeasonId(''); 
                  setSelectedLeagueIdFilter('');
                  setTeamsOfActiveClubAndSeason([]);
                  setFilteredTeams([]);
                }}
              >
                <SelectTrigger id="vv-active-club-select" className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Verein wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {assignedClubsForSelect.map(club => (
                    <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="w-full sm:w-auto space-y-1.5">
            <Label htmlFor="vv-mannschaften-saison-select">Saison auswählen</Label>
            <Select value={selectedSeasonId} onValueChange={(value) => {setSelectedSeasonId(value); setSelectedLeagueIdFilter('');}} disabled={!activeClubId || isLoadingInitialData || allSeasons.length === 0}>
              <SelectTrigger id="vv-mannschaften-saison-select" className="w-full sm:w-[200px]">
                <SelectValue placeholder={isLoadingInitialData ? "Lade Saisons..." : (allSeasons.length === 0 ? "Keine Saisons" : "Saison wählen")} />
              </SelectTrigger>
              <SelectContent>
                {allSeasons.filter(s => s && typeof s.id === 'string' && s.id.trim() !== "").map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                {allSeasons.filter(s => s && typeof s.id === 'string' && s.id.trim() !== "").length === 0 && !isLoadingInitialData &&
                  <SelectItem value="NO_SEASONS_VV_TEAMS_PLACEHOLDER" disabled>Keine Saisons verfügbar</SelectItem>
                }
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddNewTeam} disabled={!activeClubId || !selectedSeasonId || isLoadingTeams} className="w-full sm:w-auto whitespace-nowrap">
            <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft
          </Button>
        </div>
      </div>

      {activeClubId && selectedSeasonId && (
        <div className="mb-4">
            <Label htmlFor="vv-mannschaften-liga-filter">Nach Liga filtern (zeigt Ligen mit Teams Ihres Vereins)</Label>
            <Select value={selectedLeagueIdFilter} onValueChange={setSelectedLeagueIdFilter} disabled={leaguesForFilterDropdown.length === 0}>
                <SelectTrigger id="vv-mannschaften-liga-filter" className="w-full sm:w-[280px] mt-1">
                    <SelectValue placeholder="Alle zugewiesenen Ligen anzeigen" />
                </SelectTrigger>
                <SelectContent>
                    {leaguesForFilterDropdown.filter(l => l && typeof l.id === 'string' && l.id.trim() !== "").map(l => (
                         <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                     {leaguesForFilterDropdown.length === 0 &&
                        <SelectItem value="NO_LEAGUES_FOR_FILTER_VV_TEAMS" disabled>Keine Ligen für Filterung</SelectItem>
                    }
                </SelectContent>
            </Select>
        </div>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Mannschaften für {activeClubName || 'ausgewählten Verein'} ({allSeasons.find(s=>s.id === selectedSeasonId)?.name || 'Saison wählen'})</CardTitle>
          <CardDescription>Verwalten Sie hier die Mannschaften Ihres Vereins.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTeams ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Mannschaften...</p></div>
          ) : (!activeClubId || !selectedSeasonId) ? (
             <div className="p-6 text-center text-muted-foreground"><p>Bitte wählen Sie zuerst einen Verein und eine Saison aus.</p></div>
          ) : filteredTeams.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Liga</TableHead><TableHead>Jahr</TableHead><TableHead className="text-center">Schützen</TableHead><TableHead className="text-right">Aktionen</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{getLeagueName(team.leagueId)}</TableCell>
                    <TableCell>{team.competitionYear}</TableCell>
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
              <p>{`Keine Mannschaften für ${activeClubName || 'diesen Verein'} in der ausgewählten Saison ${selectedLeagueIdFilter ? 'und Liga' : ''} gefunden.`}</p>
              {activeClubId && selectedSeasonId && <p className="text-sm mt-1">Klicken Sie auf "Neue Mannschaft", um eine anzulegen.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) {setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]);} setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitTeamForm}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}</DialogTitle>
              <DialogDescription>
                Für Verein: {activeClubName || 'Ihr Verein'}. Saison: {allSeasons.find(s => s.id === (currentTeam?.seasonId || selectedSeasonId))?.name || 'Saison nicht gewählt'}
              </DialogDescription>
            </DialogHeader>
            {currentTeam && (
              <div className="space-y-4 py-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="teamNameFormDialogVerein">Name der Mannschaft</Label>
                    <Input id="teamNameFormDialogVerein" value={currentTeam.name || ''} onChange={(e) => handleFormInputChange('name', e.target.value)} required />
                 </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="clubDisplayFormDialogVerein">Verein</Label>
                    <Input id="clubDisplayFormDialogVerein" value={activeClubName || ''} disabled className="bg-muted/50" />
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
                                id={`vv-team-shooter-assign-${shooter.id}`}
                                checked={isSelected}
                                onCheckedChange={(checkedState) => handleShooterSelectionChange(shooter.id, !!checkedState)}
                                disabled={finalIsDisabled}
                            />
                            <Label htmlFor={`vv-team-shooter-assign-${shooter.id}`} className={`font-normal cursor-pointer flex-grow ${finalIsDisabled ? 'opacity-50 cursor-not-allowed' : '' }`}>
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
                      <p>{activeClubId ? `Keine Schützen für '${activeClubName || 'Verein'}' gefunden oder alle bereits gültig zugeordnet.` : 'Verein wählen, um Schützen anzuzeigen.'}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                     <div className="space-y-1.5">
                        <Label htmlFor="leagueDisplayFormDialogVerein">Zugewiesene Liga (durch Admin)</Label>
                        <Input id="leagueDisplayFormDialogVerein" value={getLeagueName(currentTeam?.leagueId)} disabled className="bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="seasonDisplayFormDialogVerein">Saison</Label>
                        <Input id="seasonDisplayFormDialogVerein" value={allSeasons.find(s => s.id === (currentTeam?.seasonId || selectedSeasonId))?.name || ''} disabled className="bg-muted/50" />
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
