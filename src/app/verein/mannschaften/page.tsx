// src/app/verein/mannschaften/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users, Loader2, AlertTriangle, InfoIcon } from 'lucide-react';
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
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
  const { user } = useAuth(); // Für 'user.uid' bei Aktionen
  const { userPermission, loadingPermissions, permissionError } = useVereinAuth();
  const { toast } = useToast();

  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [activeClubName, setActiveClubName] = useState<string | null>(null);
  const [assignedClubsForSelect, setAssignedClubsForSelect] = useState<Array<{ id: string; name: string }>>([]);
  
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [leaguesForFilterDropdown, setLeaguesForFilterDropdown] = useState<League[]>([]);
  const [selectedLeagueIdFilter, setSelectedLeagueIdFilter] = useState<string>('');
  
  const [teamsOfActiveClubAndSeason, setTeamsOfActiveClubAndSeason] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);

  const [availableClubShooters, setAvailableClubShooters] = useState<Shooter[]>([]);
  const [allTeamsForYearValidation, setAllTeamsForYearValidation] = useState<TeamValidationInfo[]>([]);
  
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isLoadingAssignedClubDetails, setIsLoadingAssignedClubDetails] = useState(false);
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

  useEffect(() => {
    if (!loadingPermissions && userPermission?.clubIds) {
      setIsLoadingAssignedClubDetails(true);
      const clubIdsToFetch = userPermission.clubIds.filter(id => id && id.trim() !== "");
      if (clubIdsToFetch.length === 0) {
        setAssignedClubsForSelect([]);
        setActiveClubId(null);
        setActiveClubName(null);
        setIsLoadingAssignedClubDetails(false);
        return;
      }
      
      const fetchClubNames = async () => {
        try {
          const clubPromises = clubIdsToFetch.map(id => getFirestoreDoc(doc(db, CLUBS_COLLECTION, id)));
          const clubSnaps = await Promise.all(clubPromises);
          const clubs = clubSnaps
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, name: (snap.data() as Club).name || "Unbek. Verein" }));
          setAssignedClubsForSelect(clubs);

          if (clubs.length > 0) {
            if (clubs.length === 1) {
              setActiveClubId(clubs[0].id);
              setActiveClubName(clubs[0].name);
            } else if (activeClubId) {
              const currentActive = clubs.find(c => c.id === activeClubId);
              setActiveClubName(currentActive?.name || null);
            } else {
              // Mehrere Vereine, aber keiner aktiv ausgewählt
              setActiveClubId(null); 
              setActiveClubName(null);
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
      fetchClubNames();
    } else if (!loadingPermissions) {
      // Keine clubIds oder kein userPermission
      setAssignedClubsForSelect([]);
      setActiveClubId(null);
      setActiveClubName(null);
    }
  }, [userPermission, loadingPermissions, activeClubId, toast]);

  useEffect(() => {
    const fetchGlobalData = async () => {
      if (!activeClubId && assignedClubsForSelect.length > 1 && !loadingPermissions) {
        setIsLoadingInitialData(false);
        setAllSeasons([]);
        setAllLeagues([]);
        return;
      }
      if (!activeClubId && assignedClubsForSelect.length === 0 && !loadingPermissions && !isLoadingAssignedClubDetails) {
         setIsLoadingInitialData(false);
         setAllSeasons([]);
         setAllLeagues([]);
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

        setAllSeasons(seasonsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Season)).filter(s => s.id && s.id.trim() !== ""));
        setAllLeagues(leaguesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as League)).filter(l => l.id && l.id.trim() !== ""));
      } catch (error) {
        console.error("VereinMannschaftenPage: Error fetching global data (seasons/leagues):", error);
        toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingInitialData(false);
      }
    };
     if(userPermission && (activeClubId || (userPermission.clubIds && userPermission.clubIds.length === 1))){
        fetchGlobalData();
    } else if (!loadingPermissions && !isLoadingAssignedClubDetails) {
        // Fall, wenn VV mehrere Vereine hat, aber noch keinen ausgewählt hat oder keine Vereine zugewiesen sind
        setAllSeasons([]);
        setAllLeagues([]);
        setIsLoadingInitialData(false);
    }
  }, [userPermission, toast, activeClubId, assignedClubsForSelect, loadingPermissions, isLoadingAssignedClubDetails]);

  useEffect(() => {
    if (selectedSeasonId && allLeagues.length > 0 && activeClubId) {
      const season = allSeasons.find(s => s.id === selectedSeasonId);
      if (!season) {
        setLeaguesForFilterDropdown([]);
        return;
      }
      
      const teamsOfClubInSeasonQuery = query(
        collection(db, TEAMS_COLLECTION),
        where("clubId", "==", activeClubId),
        where("competitionYear", "==", season.competitionYear),
        where("leagueId", "!=", null) 
      );
      getDocs(teamsOfClubInSeasonQuery).then(teamsSnapshot => {
        const leagueIdsInUse = new Set(teamsSnapshot.docs.map(d => (d.data() as Team).leagueId));
        const filtered = allLeagues.filter(l => l.seasonId === selectedSeasonId && leagueIdsInUse.has(l.id));
        setLeaguesForFilterDropdown(filtered.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }).catch(error => {
        console.error("VereinMannschaftenPage: Error fetching teams to determine leagues for filter:", error);
        setLeaguesForFilterDropdown([]);
      });

    } else {
      setLeaguesForFilterDropdown([]);
    }
  }, [selectedSeasonId, allLeagues, allSeasons, activeClubId]);

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

  useEffect(() => {
    if (!selectedLeagueIdFilter) {
      setFilteredTeams(teamsOfActiveClubAndSeason);
    } else {
      setFilteredTeams(teamsOfActiveClubAndSeason.filter(team => team.leagueId === selectedLeagueIdFilter));
    }
  }, [selectedLeagueIdFilter, teamsOfActiveClubAndSeason]);

  const { id: ctId, clubId: ctClubIdDialog, competitionYear: ctCompYearDialog } = currentTeam || {};

  const fetchShootersAndValidationDataForDialog = useCallback(async () => {
    const clubIdForDialog = formMode === 'new' ? activeClubId : ctClubIdDialog;
    const compYearForDialog = formMode === 'new' 
        ? (allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear) 
        : ctCompYearDialog;

    if (!isFormOpen || !clubIdForDialog || compYearForDialog === undefined) {
      setAvailableClubShooters([]);
      setAllTeamsForYearValidation([]);
      setIsLoadingShootersForDialog(false);
      setIsLoadingValidationData(false);
      return;
    }
    
    setIsLoadingShootersForDialog(true);
    setIsLoadingValidationData(true);
    try {
      const shootersQuery = query(collection(db, SHOOTERS_COLLECTION), where("clubId", "==", clubIdForDialog), orderBy("name", "asc"));
      const teamsForYearQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", compYearForDialog));
      
      const [shootersSnapshot, teamsForYearSnapshot] = await Promise.all([
        getDocs(shootersQuery),
        getDocs(teamsForYearQuery),
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
  }, [isFormOpen, formMode, activeClubId, ctClubIdDialog, ctCompYearDialog, allSeasons, selectedSeasonId, allLeagues, toast]);
  
  useEffect(() => {
    if (isFormOpen && ((formMode === 'new' && activeClubId && selectedSeasonId) || (formMode === 'edit' && ctClubIdDialog && ctCompYearDialog !== undefined)) ) {
      fetchShootersAndValidationDataForDialog();
    }
  }, [isFormOpen, formMode, activeClubId, selectedSeasonId, ctClubIdDialog, ctCompYearDialog, fetchShootersAndValidationDataForDialog]);

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
    const currentSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeasonData) {
      toast({ title: "Saisonfehler", description: "Ausgewählte Saison nicht gefunden.", variant: "destructive" }); return;
    }
    setFormMode('new');
    setCurrentTeam({ 
      clubId: activeClubId,
      competitionYear: currentSeasonData.competitionYear,
      seasonId: selectedSeasonId, 
      name: '', 
      shooterIds: [],
      leagueId: null, 
      captainName: '',
      captainEmail: '',
      captainPhone: '',
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
    if (selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM) {
        toast({ title: "Zu viele Schützen", description: `Maximal ${MAX_SHOOTERS_PER_TEAM} Schützen ausgewählt. Bitte Auswahl korrigieren.`, variant: "destructive" });
        return;
    }
    
    setIsSubmittingForm(true);
    
    const teamDataToSave: Omit<Team, 'id'> & { id?: string } = { 
      name: currentTeam.name.trim(),
      clubId: activeClubId,
      seasonId: currentTeam.seasonId || selectedSeasonId,
      competitionYear: currentTeam.competitionYear,
      leagueId: currentTeam.leagueId || null, 
      shooterIds: selectedShooterIdsInForm,
      captainName: currentTeam.captainName?.trim() || '',
      captainEmail: currentTeam.captainEmail?.trim() || '',
      captainPhone: currentTeam.captainPhone?.trim() || '',
    };
    
    const currentTeamLeagueInfo = allLeagues.find(l => l.id === teamDataToSave.leagueId);
    const categoryOfCurrentTeamForValidation = getDisciplineCategory(currentTeamLeagueInfo?.type);
    
    if (teamDataToSave.leagueId && categoryOfCurrentTeamForValidation && teamDataToSave.competitionYear !== undefined) {
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
    
    try {
      const teamsCollectionRef = collection(db, TEAMS_COLLECTION);
      let duplicateQuery;
      const baseDuplicateConditions: any[] = [
        where("name", "==", teamDataToSave.name),
        where("clubId", "==", teamDataToSave.clubId),
        where("competitionYear", "==", teamDataToSave.competitionYear),
      ];
      
      if (formMode === 'edit' && currentTeam.id) {
        // Für Edit-Modus kann leagueId null sein, wenn sie entfernt wird
        if (teamDataToSave.leagueId) baseDuplicateConditions.push(where("leagueId", "==", teamDataToSave.leagueId));
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions, where(documentId(), "!=", currentTeam.id));
      } else { // New mode
        // Für neue Teams ist leagueId null, nicht in Duplikatsprüfung
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
        throw new Error("VereinMannschaftenPage: Invalid form mode or missing team ID for edit.");
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

  const handleFormInputChange = (
    field: keyof Pick<Team, 'name' | 'captainName' | 'captainEmail' | 'captainPhone'>, 
    value: string | null
  ) => {
    setCurrentTeam(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
 const handleShooterSelectionChange = (shooterId: string, isChecked: boolean) => {
    if (isSubmittingForm || isLoadingShootersForDialog || isLoadingValidationData) return;

    const currentTeamData = currentTeam;
    if (!currentTeamData || currentTeamData.competitionYear === undefined) return;
    
    const currentTeamLeagueData = allLeagues.find(l => l.id === currentTeamData.leagueId);
    const categoryOfCurrentTeam = getDisciplineCategory(currentTeamLeagueData?.type);

    if (isChecked) { 
      if (selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) {
          toast({ title: "Maximale Schützenzahl erreicht", variant: "warning" });
          return; 
      }
      // Nur prüfen, wenn das Team einer Liga mit einem Typ zugeordnet ist (also nicht null oder undefined)
      if (categoryOfCurrentTeam && currentTeamData.competitionYear !== undefined) {
          const shooterBeingChecked = availableClubShooters.find(s => s.id === shooterId);
          // Nur für neue Zuweisungen prüfen (Schütze war nicht vorher schon im Team)
          if (shooterBeingChecked && shooterBeingChecked.id && !persistedShooterIdsForTeam.includes(shooterId)) { 
              let conflictFound = false;
              for (const existingTeamId of (shooterBeingChecked.teamIds || [])) {
                  // Nicht mit sich selbst vergleichen, falls Edit-Modus
                  if (formMode === 'edit' && currentTeamData.id && existingTeamId === currentTeamData.id) continue; 
                  
                  const teamValidationEntry = allTeamsForYearValidation.find(t => t.id === existingTeamId);
                  if (teamValidationEntry?.leagueCompetitionYear === currentTeamData.competitionYear) { 
                      const categoryOfExistingTeam = getDisciplineCategory(teamValidationEntry.leagueType);
                      if (categoryOfExistingTeam && categoryOfExistingTeam === categoryOfCurrentTeam) {
                          conflictFound = true; break;
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
    if (!leagueId) return 'Nicht zugewiesen'; 
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
        <h1 className="text-2xl font-semibold text-primary">Meine Mannschaften</h1>
        {activeClubName && <p className="text-muted-foreground text-lg">Aktiver Verein: <span className="font-semibold text-primary">{activeClubName}</span></p>}
      </div>

      {userPermission && userPermission.clubIds && userPermission.clubIds.length > 1 && (
         <Card className="shadow-sm bg-muted/30 mb-6">
            <CardContent className="p-4">
                <Label htmlFor="vv-active-club-select" className="mb-1.5 block text-sm font-medium">Verein für Verwaltung auswählen:</Label>
                <Select
                    value={activeClubId || ""}
                    onValueChange={(value) => {
                        if(value === "SELECT_CLUB_PLACEHOLDER") {
                            setActiveClubId(null);
                            setActiveClubName(null);
                        } else {
                            setActiveClubId(value);
                            const selectedC = assignedClubsForSelect.find(c => c.id === value);
                            setActiveClubName(selectedC?.name || null);
                        }
                        setSelectedSeasonId(''); 
                        setSelectedLeagueIdFilter('');
                        setTeamsOfActiveClubAndSeason([]);
                        setFilteredTeams([]);
                    }}
                >
                    <SelectTrigger id="vv-active-club-select" className="w-full sm:w-[300px]">
                        <SelectValue placeholder="Bitte Verein wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="SELECT_CLUB_PLACEHOLDER" disabled={!activeClubId}>- Verein wählen -</SelectItem>
                        {assignedClubsForSelect.map(club => (
                            <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
         </Card>
      )}
      
      {activeClubId ? (
        <>
          <div className="flex flex-col sm:flex-row items-end gap-2 w-full">
              <div className="w-full sm:w-auto space-y-1.5">
                <Label htmlFor="vv-mannschaften-saison-select">Saison auswählen</Label>
                <Select value={selectedSeasonId} onValueChange={(value) => {setSelectedSeasonId(value); setSelectedLeagueIdFilter('');}} disabled={isLoadingInitialData || allSeasons.length === 0}>
                  <SelectTrigger id="vv-mannschaften-saison-select" className="w-full sm:w-[240px]">
                    <SelectValue placeholder={isLoadingInitialData ? "Lade Saisons..." : (allSeasons.length === 0 ? "Keine Saisons" : "Saison wählen")} />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="" disabled={!!selectedSeasonId}>- Saison wählen -</SelectItem>
                    {allSeasons.filter(s => s && typeof s.id === 'string' && s.id.trim() !== "").map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    {allSeasons.filter(s => s.id && typeof s.id === 'string' && s.id.trim() !== "").length === 0 && !isLoadingInitialData &&
                      <SelectItem value="NO_SEASONS_VV_TEAMS_PLACEHOLDER" disabled>Keine Saisons verfügbar</SelectItem>
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-auto space-y-1.5">
                <Label htmlFor="vv-mannschaften-liga-filter">Nach Liga filtern</Label>
                <Select value={selectedLeagueIdFilter} onValueChange={setSelectedLeagueIdFilter} disabled={!selectedSeasonId || leaguesForFilterDropdown.length === 0}>
                    <SelectTrigger id="vv-mannschaften-liga-filter" className="w-full sm:w-[280px]">
                        <SelectValue placeholder="Alle Ligen des Vereins anzeigen" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="">Alle Ligen</SelectItem>
                        {leaguesForFilterDropdown.filter(l => l && typeof l.id === 'string' && l.id.trim() !== "").map(l => (
                             <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                         {leaguesForFilterDropdown.length === 0 && selectedSeasonId &&
                            <SelectItem value="NO_LEAGUES_FOR_FILTER_VV_TEAMS" disabled>Keine Ligen für Filterung</SelectItem>
                        }
                    </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddNewTeam} disabled={!activeClubId || !selectedSeasonId || isLoadingTeams} className="w-full sm:w-auto whitespace-nowrap mt-2 sm:mt-0 self-end">
                <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft
              </Button>
          </div>

          <Card className="shadow-md mt-6">
            <CardHeader>
              <CardTitle>Mannschaften für {activeClubName || 'ausgewählten Verein'} ({allSeasons.find(s=>s.id === selectedSeasonId)?.name || 'Saison wählen'})</CardTitle>
              <CardDescription>Verwalten Sie hier die Mannschaften Ihres Vereins für die ausgewählte Saison.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTeams ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Mannschaften...</p></div>
              ) : (!selectedSeasonId) ? (
                 <div className="p-6 text-center text-muted-foreground"><p>Bitte wählen Sie zuerst eine Saison aus.</p></div>
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
                           <AlertDialog open={isDeletingTeam && teamToDelete?.id === team.id} onOpenChange={open => {if(!open)setTeamToDelete(null)}}>
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
        </>
      ) : (
        <div className="p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
          <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
          {userPermission && userPermission.clubIds && userPermission.clubIds.length > 1 ? (
             <p>Bitte wählen Sie oben einen Verein aus, für den Sie Mannschaften verwalten möchten.</p>
          ) : (
            <p>Es ist kein aktiver Verein für die Verwaltung ausgewählt oder verfügbar.</p>
          )}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) {setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]);} setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-2xl"> {/* Increased width for more content */}
          <form onSubmit={handleSubmitTeamForm}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}</DialogTitle>
              <DialogDescriptionComponent>
                Für Verein: {activeClubName}. Saison: {allSeasons.find(s => s.id === (currentTeam?.seasonId || selectedSeasonId))?.name || 'N/A'}
              </DialogDescriptionComponent>
            </DialogHeader>
            {currentTeam && (
              <div className="space-y-4 py-4">
                <Alert variant="default" className="bg-blue-50 border-blue-300 text-blue-700">
                    <InfoIcon className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                        Bitte kennzeichnen Sie Ihre leistungsstärkste Mannschaft mit "I", die zweitstärkste mit "II" usw. Dies hilft bei der korrekten Ligaeinteilung.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="teamNameFormDialogVerein">Name der Mannschaft</Label>
                        <Input id="teamNameFormDialogVerein" value={currentTeam.name || ''} onChange={(e) => handleFormInputChange('name', e.target.value)} required />
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="teamClubDisplayFormDialogVerein">Verein (Zugewiesen)</Label>
                        <Input id="teamClubDisplayFormDialogVerein" value={activeClubName || ''} disabled className="bg-muted/50" />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="captainName">Name Mannschaftsführer</Label>
                        <Input id="captainName" value={currentTeam.captainName || ''} onChange={(e) => handleFormInputChange('captainName', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="captainEmail">E-Mail MF</Label>
                        <Input id="captainEmail" type="email" value={currentTeam.captainEmail || ''} onChange={(e) => handleFormInputChange('captainEmail', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="captainPhone">Telefon MF</Label>
                        <Input id="captainPhone" type="tel" value={currentTeam.captainPhone || ''} onChange={(e) => handleFormInputChange('captainPhone', e.target.value)} />
                    </div>
                </div>
                
                <div className="space-y-2 pt-3 border-t mt-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <Label className="text-base font-medium">Schützen für diese Mannschaft auswählen</Label>
                    <span className="text-sm text-muted-foreground">{selectedShooterIdsInForm.length} / {MAX_SHOOTERS_PER_TEAM} ausgewählt</span>
                  </div>
                  {isLoadingShootersForDialog || isLoadingValidationData ? (
                     <div className="flex items-center justify-center p-4 h-40 border rounded-md bg-muted/30"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2">Lade Schützen...</p></div>
                  ) : availableClubShooters.length > 0 ? (
                    <ScrollArea className="h-48 rounded-md border p-3 bg-muted/20">
                      <div className="space-y-1.5">
                      {availableClubShooters.map(shooter => {
                        if (!shooter || !shooter.id) return null; 
                        const isSelected = selectedShooterIdsInForm.includes(shooter.id);
                        
                        let isDisabledByMax = !isSelected && selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM;
                        let isDisabledByDisciplineConflict = false;
                        let disableReason = "";
                        
                        const currentTeamLeagueData = allLeagues.find(l => l.id === currentTeam?.leagueId);
                        const currentTeamSpecificLeagueType = currentTeamLeagueData?.type;
                        const currentTeamCompYearForValidation = currentTeam?.competitionYear;
                        const categoryOfCurrentTeam = currentTeamSpecificLeagueType ? getDisciplineCategory(currentTeamSpecificLeagueType) : null;

                        if (!isSelected && categoryOfCurrentTeam && currentTeamCompYearForValidation !== undefined) {
                           // Nur für neue Zuweisungen prüfen (Schütze war nicht vorher schon im aktuellen Team)
                           if (!persistedShooterIdsForTeam.includes(shooter.id)) { 
                                let assignedToSameCategoryInYear = false;
                                (shooter.teamIds || []).forEach(assignedTeamId => {
                                    // Nicht mit sich selbst vergleichen, falls Edit-Modus und es das aktuell bearbeitete Team ist.
                                    if (formMode === 'edit' && currentTeam?.id === assignedTeamId) return; 
                                    
                                    const assignedTeamInfo = allTeamsForYearValidation.find(t => t.id === assignedTeamId);
                                    if (assignedTeamInfo?.leagueCompetitionYear === currentTeamCompYearForValidation) {
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
                                    disableReason = `(bereits in ${categoryOfCurrentTeam}-Team ${currentTeamCompYearForValidation})`;
                                }
                           }
                        }
                         if (isDisabledByMax && !isDisabledByDisciplineConflict) { 
                            disableReason = "(Max. Schützen erreicht)";
                        }
                        
                        const finalIsDisabled = isDisabledByMax || isLoadingValidationData || isDisabledByDisciplineConflict;
                        return (
                            <div key={shooter.id} className="flex items-center space-x-3 p-2 hover:bg-background/80 rounded-md">
                            <Checkbox
                                id={`vv-team-shooter-assign-${shooter.id}`}
                                checked={isSelected}
                                onCheckedChange={(checkedState) => handleShooterSelectionChange(shooter.id, !!checkedState)}
                                disabled={finalIsDisabled}
                                className="h-5 w-5"
                            />
                            <Label htmlFor={`vv-team-shooter-assign-${shooter.id}`} className={`font-normal text-sm leading-tight cursor-pointer flex-grow ${finalIsDisabled ? 'opacity-60 cursor-not-allowed' : '' }`}>
                                {shooter.name}
                                <span className='text-xs text-muted-foreground block'>(Schnitt Vorjahr: folgt)</span>
                                {finalIsDisabled && <span className="text-xs text-destructive block mt-0.5">{disableReason}</span>}
                            </Label>
                            </div>
                        );
                      })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 h-40 border rounded-md flex items-center justify-center bg-muted/30">
                      <p>{(activeClubId) ? `Keine Schützen für '${activeClubName || 'Verein'}' gefunden oder alle bereits gültig zugeordnet.` : 'Technischer Fehler: Kein aktiver Verein.'}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5"> 
                        <Label htmlFor="teamLeagueDisplayDialogVerein">Zugewiesene Liga (durch Admin)</Label>
                        <Input id="teamLeagueDisplayDialogVerein" value={getLeagueName(currentTeam?.leagueId)} disabled className="bg-muted/50" />
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="teamSeasonDisplayDialogVerein">Saison</Label>
                        <Input id="teamSeasonDisplayDialogVerein" value={allSeasons.find(s => s.id === (currentTeam?.seasonId || selectedSeasonId))?.name || ''} disabled className="bg-muted/50" />
                    </div>
                </div>
              </div>
            )}
            <DialogFooter className="pt-6">
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
