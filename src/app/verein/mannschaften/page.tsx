// /app/verein/mannschaften/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users as TeamsIcon, Loader2, AlertTriangle, InfoIcon } from 'lucide-react';
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
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVereinAuth } from '@/app/verein/layout';
import type { Season, League, Club, Team, Shooter, TeamValidationInfo, FirestoreLeagueSpecificDiscipline, UserPermission } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, getDisciplineCategory, leagueDisciplineOptions, GEWEHR_DISCIPLINES, PISTOL_DISCIPLINES } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query,
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayUnion, arrayRemove, Timestamp
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "rwk_shooters";

export default function VereinMannschaftenPage() {
  const { user, userPermission, loadingPermissions, permissionError } = useVereinAuth();
  const { toast } = useToast();
  
  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [activeClubName, setActiveClubName] = useState<string | null>(null);
  const [assignedClubsForSelect, setAssignedClubsForSelect] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingAssignedClubDetails, setIsLoadingAssignedClubDetails] = useState(true);

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedLeagueIdFilter, setSelectedLeagueIdFilter] = useState<string>('');

  const [teamsOfAssignedClub, setTeamsOfAssignedClub] = useState<Team[]>([]);
  
  const [availableClubShooters, setAvailableClubShooters] = useState<Shooter[]>([]);
  const [allTeamsForYearValidation, setAllTeamsForYearValidation] = useState<TeamValidationInfo[]>([]);
  
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
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

  // Effect to set activeClubId based on userPermission
  useEffect(() => {
    if (loadingPermissions) {
      setIsLoadingAssignedClubDetails(true);
      return;
    }
    if (permissionError || !userPermission) {
      setIsLoadingAssignedClubDetails(false);
      return;
    }

    if (userPermission.clubIds && userPermission.clubIds.length > 0) {
      setIsLoadingAssignedClubDetails(true);
      const fetchClubNames = async () => {
        try {
          const clubPromises = userPermission.clubIds!.map(id => getFirestoreDoc(doc(db, CLUBS_COLLECTION, id)));
          const clubSnaps = await Promise.all(clubPromises);
          const clubsData = clubSnaps
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, name: (snap.data() as Club).name || "Unbek. Verein" }));
          
          setAssignedClubsForSelect(clubsData);

          if (clubsData.length === 1) {
            setActiveClubId(clubsData[0].id);
            setActiveClubName(clubsData[0].name);
          } else if (clubsData.length > 0 && !activeClubId) {
            // If multiple clubs assigned, prompt user to select one.
            // activeClubId will be set by the Select component's onValueChange
          } else if (activeClubId) {
            // If activeClubId is already set (e.g. from previous selection), find its name
            const currentActive = clubsData.find(c => c.id === activeClubId);
            setActiveClubName(currentActive?.name || null);
          }
        } catch (err) {
          console.error("VereinMannschaftenPage: Error fetching assigned club names:", err);
          toast({ title: "Fehler", description: "Vereinsinformationen konnten nicht geladen werden.", variant: "destructive" });
        } finally {
          setIsLoadingAssignedClubDetails(false);
        }
      };
      fetchClubNames();
    } else {
      setAssignedClubsForSelect([]);
      setActiveClubId(null);
      setActiveClubName(null);
      setIsLoadingAssignedClubDetails(false);
    }
  }, [userPermission, loadingPermissions, permissionError, toast, activeClubId]);


  const fetchInitialData = useCallback(async () => {
    if (!activeClubId && assignedClubsForSelect.length > 1) {
      setIsLoadingInitialData(false);
      return; 
    }
     if (!activeClubId && assignedClubsForSelect.length === 0 && !isLoadingAssignedClubDetails && !loadingPermissions) {
        setIsLoadingInitialData(false);
        return; 
    }
    if (loadingPermissions || isLoadingAssignedClubDetails || !activeClubId) {
        setIsLoadingInitialData(true); 
        return;
    }

    console.log("VereinMannschaftenPage: fetchInitialData (Saisons, Ligen) for activeClubId:", activeClubId);
    setIsLoadingInitialData(true);
    try {
      const seasonsSnapshotPromise = getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
      const leaguesSnapshotPromise = getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      
      const [seasonsSnapshot, leaguesSnapshot] = await Promise.all([
        seasonsSnapshotPromise,
        leaguesSnapshotPromise,
      ]);

      const fetchedSeasons = seasonsSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Season))
        .filter(s => s && typeof s.id === 'string' && s.id.trim() !== "");
      setAllSeasons(fetchedSeasons);

      const rawLeagues = leaguesSnapshot.docs.map(lDoc => ({ id: lDoc.id, ...lDoc.data() } as League));
      const fetchedLeagues = rawLeagues.filter(l => l.id && typeof l.id === 'string' && l.id.trim() !== "");
      setAllLeagues(fetchedLeagues);

    } catch (error) {
      console.error("VereinMannschaftenPage: Error fetching initial data (seasons/leagues): ", error);
      toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingInitialData(false);
    }
  }, [toast, activeClubId, assignedClubsForSelect, isLoadingAssignedClubDetails, loadingPermissions]);

  useEffect(() => {
    if (activeClubId) {
      fetchInitialData();
    }
  }, [activeClubId, fetchInitialData]);

  const availableLeaguesForFilter = useMemo(() => {
    if (!selectedSeasonId || !activeClubId || allLeagues.length === 0 || teamsOfAssignedClub.length === 0) return [];
    const leagueIdsInUseByClubForSeason = new Set(
      teamsOfAssignedClub
        .filter(t => t.seasonId === selectedSeasonId && t.leagueId)
        .map(t => t.leagueId)
    );
    return allLeagues
      .filter(l => l.seasonId === selectedSeasonId && leagueIdsInUseByClubForSeason.has(l.id))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [selectedSeasonId, activeClubId, allLeagues, teamsOfAssignedClub]);

  const fetchTeamsForClubAndSeason = useCallback(async () => {
    if (!activeClubId || !selectedSeasonId) {
      setTeamsOfAssignedClub([]);
      return;
    }
    setIsLoadingTeams(true);
    try {
      const selectedSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
      if (!selectedSeasonData) {
        setTeamsOfAssignedClub([]);
        setIsLoadingTeams(false);
        return;
      }
      
      let qConstraints = [
        where("clubId", "==", activeClubId),
        where("competitionYear", "==", selectedSeasonData.competitionYear),
      ];

      if (selectedLeagueIdFilter) {
        qConstraints.push(where("leagueId", "==", selectedLeagueIdFilter));
      }
      
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), ...qConstraints, orderBy("name", "asc"));
      const querySnapshot = await getDocs(teamsQuery);
      setTeamsOfAssignedClub(querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), shooterIds: d.data().shooterIds || [] } as Team)));
    } catch (error) {
      console.error("VereinMannschaftenPage: Error fetching teams:", error);
      toast({ title: "Fehler beim Laden der Mannschaften", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingTeams(false);
    }
  }, [activeClubId, selectedSeasonId, selectedLeagueIdFilter, allSeasons, toast]);

  useEffect(() => {
    if (activeClubId && selectedSeasonId) {
      fetchTeamsForClubAndSeason();
    }
  }, [activeClubId, selectedSeasonId, selectedLeagueIdFilter, fetchTeamsForClubAndSeason]);
  
  const { clubId: ctClubIdDialog, competitionYear: ctCompYearDialog, id: ctTeamIdDialog } = currentTeam || {};

  const fetchShootersAndValidationDataForDialog = useCallback(async () => {
    const clubIdForShooters = formMode === 'new' ? activeClubId : ctClubIdDialog;
    const compYearForValidation = formMode === 'new' 
        ? allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear 
        : ctCompYearDialog;

    if (!isFormOpen || !clubIdForShooters || compYearForValidation === undefined) {
      setAvailableClubShooters([]);
      setAllTeamsForYearValidation([]);
      setIsLoadingShootersForDialog(false);
      setIsLoadingValidationData(false);
      return;
    }
    
    setIsLoadingShootersForDialog(true);
    setIsLoadingValidationData(true);
    try {
      const shootersQuery = query(collection(db, SHOOTERS_COLLECTION), where("clubId", "==", clubIdForShooters), orderBy("name", "asc"));
      const teamsForYearQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", compYearForValidation));
      
      const [shootersSnapshot, teamsForYearSnapshot] = await Promise.all([getDocs(shootersQuery), getDocs(teamsForYearQuery)]);

      setAvailableClubShooters(shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), teamIds: d.data().teamIds || [] } as Shooter)));
      
      const leagueTypesMap = new Map(allLeagues.map(l => [l.id, {type: l.type, year: l.competitionYear}]));
      const teamsForValidation: TeamValidationInfo[] = teamsForYearSnapshot.docs.map(d => {
        const teamData = d.data() as Team;
        const leagueDetails = teamData.leagueId ? leagueTypesMap.get(teamData.leagueId) : undefined;
        return { 
          ...teamData, id: d.id, 
          shooterIds: teamData.shooterIds || [],
          leagueType: leagueDetails?.type,
          leagueCompetitionYear: leagueDetails?.year,
          currentShooterCount: (teamData.shooterIds || []).length,
        };
      });
      setAllTeamsForYearValidation(teamsForValidation);
    } catch (error) {
      console.error("VereinMannschaftenPage: Error fetching shooters/validation data for dialog:", error);
    } finally {
      setIsLoadingShootersForDialog(false);
      setIsLoadingValidationData(false);
    }
  }, [isFormOpen, formMode, activeClubId, ctClubIdDialog, ctCompYearDialog, allLeagues, selectedSeasonId, allSeasons]);
  
  useEffect(() => {
    if (isFormOpen) {
      fetchShootersAndValidationDataForDialog();
    }
  }, [isFormOpen, fetchShootersAndValidationDataForDialog]);

 useEffect(() => {
    if (isFormOpen && formMode === 'edit' && ctTeamIdDialog && !isLoadingShootersForDialog && !isLoadingValidationData && availableClubShooters.length > 0) {
        const teamDataFromState = teamsOfAssignedClub.find(t => t.id === ctTeamIdDialog);
        const persistedIdsFromDB = teamDataFromState?.shooterIds || [];
        setPersistedShooterIdsForTeam(persistedIdsFromDB);
        const validInitialShooterIds = persistedIdsFromDB.filter(shooterId => availableClubShooters.some(shooter => shooter.id === shooterId));
        setSelectedShooterIdsInForm(validInitialShooterIds);
    } else if (isFormOpen && formMode === 'new') {
        setSelectedShooterIdsInForm([]); 
        setPersistedShooterIdsForTeam([]);
    }
  }, [isFormOpen, formMode, ctTeamIdDialog, teamsOfAssignedClub, isLoadingShootersForDialog, isLoadingValidationData, availableClubShooters]);

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
      name: '', shooterIds: [], leagueId: null,
      captainName: '', captainEmail: '', captainPhone: '',
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
        setTeamToDelete(null); return;
    }
    setIsDeletingTeam(true);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, TEAMS_COLLECTION, teamToDelete.id));
      (teamToDelete.shooterIds || []).forEach(shooterId => {
        if (shooterId) batch.update(doc(db, SHOOTERS_COLLECTION, shooterId), { teamIds: arrayRemove(teamToDelete.id) });
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
    if (!currentTeam || !currentTeam.name?.trim() || !activeClubId || !currentTeam.seasonId || currentTeam.competitionYear === undefined || !user) {
      toast({ title: "Ungültige Eingabe", variant: "destructive" }); return;
    }
    if (selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM) {
        toast({ title: "Zu viele Schützen", variant: "destructive" }); return;
    }
    
    setIsSubmittingForm(true);
    const teamDataToSave: Omit<Team, 'id'> & { id?: string } = { 
      name: currentTeam.name.trim(),
      clubId: activeClubId, 
      seasonId: currentTeam.seasonId,
      competitionYear: currentTeam.competitionYear,
      leagueId: formMode === 'edit' ? (currentTeam.leagueId || null) : null, 
      shooterIds: selectedShooterIdsInForm, 
      captainName: currentTeam.captainName?.trim() || '',
      captainEmail: currentTeam.captainEmail?.trim() || '',
      captainPhone: currentTeam.captainPhone?.trim() || '',
    };
    
    const currentTeamLeagueData = teamDataToSave.leagueId ? allLeagues.find(l => l.id === teamDataToSave.leagueId) : null;
    const categoryOfCurrentTeamForValidation = getDisciplineCategory(currentTeamLeagueData?.type);
    
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
                const categoryOfExistingTeam = getDisciplineCategory(teamValidationEntry.leagueType);
                if (categoryOfExistingTeam && categoryOfExistingTeam === categoryOfCurrentTeamForValidation) { 
                   conflictFound = true; break;
                }
              }
            }
            if (conflictFound) {
                 toast({ title: "Regelverstoß", description: `${shooterInfo.name} ist bereits in einem ${categoryOfCurrentTeamForValidation}-Team in ${teamDataToSave.competitionYear} gemeldet.`, variant: "destructive", duration: 7000 });
                 setIsSubmittingForm(false); return;
            }
          }
        }
    }
    
    try {
      const teamsCollectionRef = collection(db, TEAMS_COLLECTION);
      let duplicateQuery;
      const baseDuplicateConditions: any[] = [where("name", "==", teamDataToSave.name), where("clubId", "==", teamDataToSave.clubId), where("competitionYear", "==", teamDataToSave.competitionYear)];
      if (formMode === 'edit' && currentTeam.id) {
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions, where(documentId(), "!=", currentTeam.id));
      } else { duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions); }
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        toast({ title: "Doppelter Mannschaftsname", variant: "destructive" });
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
        batch.set(newTeamRef, {...teamDataToSave, shooterIds: selectedShooterIdsInForm, leagueId: null, id: newTeamRef.id});
        toast({ title: "Mannschaft erstellt" });
      } else if (formMode === 'edit' && currentTeam.id) {
        teamIdForShooterUpdates = currentTeam.id;
        const { id, leagueId: _leagueIdIgnored, ...dataForUpdate } = teamDataToSave;
        batch.update(doc(db, TEAMS_COLLECTION, teamIdForShooterUpdates), {...dataForUpdate, shooterIds: selectedShooterIdsInForm} as Partial<Omit<Team, 'leagueId'>>); 
        toast({ title: "Mannschaft aktualisiert" });
      }
      
      shootersToAdd.forEach(shooterId => {
        if(availableClubShooters.some(s => s.id === shooterId)){ 
          batch.update(doc(db, SHOOTERS_COLLECTION, shooterId), { teamIds: arrayUnion(teamIdForShooterUpdates) });
        }
      });
      shootersToRemove.forEach(shooterId => {
          if(availableClubShooters.some(s => s.id === shooterId)){
            batch.update(doc(db, SHOOTERS_COLLECTION, shooterId), { teamIds: arrayRemove(teamIdForShooterUpdates) });
          }
      });
      
      await batch.commit();
      setIsFormOpen(false);
      setCurrentTeam(null);
      fetchTeamsForClubAndSeason(); 
    } catch (error) {
      console.error("VereinMannschaftenPage: Error submitting team form:", error);
      toast({ title: `Fehler`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Team, 'name' | 'captainName' | 'captainEmail' | 'captainPhone'>, value: string | null) => {
    setCurrentTeam(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
  
  const handleShooterSelectionChange = (shooterId: string, isChecked: boolean) => {
    if (isSubmittingForm || isLoadingShootersForDialog || isLoadingValidationData) return;
    const teamBeingEdited = currentTeam;
    if (!teamBeingEdited || teamBeingEdited.competitionYear === undefined) return;
    
    const teamLeagueData = teamBeingEdited.leagueId ? allLeagues.find(l => l.id === teamBeingEdited.leagueId) : null;
    const categoryOfTeamBeingEdited = getDisciplineCategory(teamLeagueData?.type);

    if (isChecked) { 
      if (selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) {
          toast({ title: "Maximale Schützenzahl erreicht", variant: "warning" }); return; 
      }
      if (teamLeagueData && categoryOfTeamBeingEdited && teamBeingEdited.competitionYear !== undefined) {
          const shooterBeingChecked = availableClubShooters.find(s => s.id === shooterId);
          if (shooterBeingChecked?.id && !persistedShooterIdsForTeam.includes(shooterId)) { 
              let conflictFound = false;
              for (const existingTeamId of (shooterBeingChecked.teamIds || [])) {
                  if (formMode === 'edit' && teamBeingEdited.id && existingTeamId === teamBeingEdited.id) continue; 
                  const teamValidationEntry = allTeamsForYearValidation.find(t => t.id === existingTeamId);
                  if (teamValidationEntry?.leagueCompetitionYear === teamBeingEdited.competitionYear) { 
                      const categoryOfExistingTeam = getDisciplineCategory(teamValidationEntry.leagueType);
                      if (categoryOfExistingTeam && categoryOfExistingTeam === categoryOfTeamBeingEdited) {
                          conflictFound = true; break;
                      }
                  }
              }
              if (conflictFound) {
                  toast({ title: "Regelverstoß", description: `${shooterBeingChecked.name} ist bereits in einem ${categoryOfTeamBeingEdited}-Team dieses Jahres gemeldet.`, variant: "destructive", duration: 7000 });
                  return; 
              }
          }
      }
    } 
    setSelectedShooterIdsInForm(prevSelectedIds =>
      isChecked 
        ? (prevSelectedIds.length < MAX_SHOOTERS_PER_TEAM ? [...prevSelectedIds, shooterId] : prevSelectedIds)
        : prevSelectedIds.filter(id => id !== shooterId)
    );
  };

  const getLeagueName = (leagueId?: string | null): string => {
    if (!leagueId) return 'Nicht zugewiesen'; 
    const league = allLeagues.find(l => l.id === leagueId);
    return league ? `${league.name} (${leagueDisciplineOptions.find(opt => opt.value === league.type)?.label || league.type})` : 'Unbek. Liga';
  };
  
  const isVV = userPermission?.role === 'vereinsvertreter';

  if (loadingPermissions || isLoadingAssignedClubDetails) { 
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Lade Benutzer- & Vereinsdaten...</p></div>;
  }
  if (permissionError) {
    return <div className="p-6"><Card className="border-destructive bg-destructive/10"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Zugriffsproblem</CardTitle></CardHeader><CardContent><p>{permissionError}</p></CardContent></Card></div>;
  }
  if (!userPermission || (!userPermission.clubIds || userPermission.clubIds.length === 0)) {
     return <div className="p-6"><Card className="border-amber-500 bg-amber-50/50"><CardHeader><CardTitle className="text-amber-700">Keine Vereinszuweisung</CardTitle></CardHeader><CardContent><p>Ihrem Konto ist kein Verein für die Mannschaftsverwaltung zugewiesen.</p></CardContent></Card></div>;
  }
  if (assignedClubsForSelect.length > 1 && !activeClubId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><h1 className="text-2xl font-semibold text-primary">Meine Mannschaften</h1></div>
        <Card className="shadow-md">
          <CardHeader><CardTitle>Verein auswählen</CardTitle><CardDescription>Bitte wählen Sie den Verein aus, dessen Mannschaften Sie verwalten möchten.</CardDescription></CardHeader>
          <CardContent>
            <Select onValueChange={(value) => {setActiveClubId(value); const c = assignedClubsForSelect.find(cl => cl.id === value); setActiveClubName(c?.name || null); setSelectedSeasonId(''); setSelectedLeagueIdFilter(''); setTeamsOfAssignedClub([]); }}>
              <SelectTrigger className="w-full sm:w-[300px]"><SelectValue placeholder="Verein wählen..." /></SelectTrigger>
              <SelectContent>
                {assignedClubsForSelect.filter(c => c.id && c.id.trim() !== "").map(club => (<SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }
   if (!activeClubId) { // Fallback, falls trotz einer Zuweisung kein activeClubId gesetzt werden konnte
    return (
      <div className="p-6">
        <Card className="border-amber-500 bg-amber-50/50">
          <CardHeader><CardTitle className="text-amber-700">Fehler bei Vereinsauswahl</CardTitle></CardHeader>
          <CardContent><p>Der zu verwaltende Verein konnte nicht ermittelt werden. Bitte kontaktieren Sie den Administrator.</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary">Meine Mannschaften</h1>
        {activeClubName && <p className="text-muted-foreground text-lg md:text-right">Verein: <span className="font-semibold text-primary">{activeClubName}</span></p>}
      </div>
      
      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div><CardTitle className="text-lg">Filter & Aktionen</CardTitle><CardDescription className="text-xs mt-1">Wählen Sie Saison und optional eine Liga.</CardDescription></div>
            {isVV && (
                 <Button onClick={handleAddNewTeam} disabled={!activeClubId || !selectedSeasonId || isLoadingTeams || isSubmittingForm || isLoadingInitialData} className="w-full sm:w-auto whitespace-nowrap">
                    <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft
                </Button>
            )}
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-grow space-y-1.5 w-full sm:w-auto">
                    <Label htmlFor="vv-saison-select-teams">Saison auswählen</Label>
                    <Select value={selectedSeasonId} onValueChange={(val) => {setSelectedSeasonId(val); setSelectedLeagueIdFilter('');}} disabled={isLoadingInitialData || allSeasons.length === 0}>
                    <SelectTrigger id="vv-saison-select-teams" className="w-full">
                        <SelectValue placeholder={isLoadingInitialData ? "Lade Saisons..." : (allSeasons.length === 0 ? "Keine Saisons" : "Saison wählen")} />
                    </SelectTrigger>
                    <SelectContent>
                        {allSeasons.filter(s => s && typeof s.id === 'string' && s.id.trim() !== "").map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        {allSeasons.filter(s => s.id && typeof s.id.trim() !== "").length === 0 && !isLoadingInitialData &&
                            <SelectItem value="NO_SEASONS_PLACEHOLDER_VV_TEAMS" disabled>Keine Saisons</SelectItem>
                        }
                    </SelectContent>
                    </Select>
                </div>
                 <div className="flex-grow space-y-1.5 w-full sm:w-auto">
                    <Label htmlFor="vv-liga-filter-teams">Nach Liga filtern (Optional)</Label>
                    <Select value={selectedLeagueIdFilter} onValueChange={setSelectedLeagueIdFilter} disabled={!selectedSeasonId || isLoadingInitialData || availableLeaguesForFilter.length === 0}>
                        <SelectTrigger id="vv-liga-filter-teams" className="w-full">
                            <SelectValue placeholder={!selectedSeasonId ? "Saison wählen" : (availableLeaguesForFilter.length === 0 ? "Keine Ligen für Verein/Saison" : "Alle Ligen")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Alle Ligen</SelectItem> {/* Leerstring für "Alle Ligen" ist problematisch */}
                            {availableLeaguesForFilter
                                .filter(l => l && typeof l.id === 'string' && l.id.trim() !== "")
                                .map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                             {availableLeaguesForFilter.length === 0 && selectedSeasonId && 
                                <SelectItem value="NO_LEAGUES_FOR_FILTER_PLACEHOLDER" disabled>Keine Ligen für Filter</SelectItem>
                             }
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-md mt-6">
        <CardHeader>
          <CardTitle>Mannschaften von {activeClubName || 'Ihrem Verein'}</CardTitle>
          <CardDescription>Saison: {allSeasons.find(s=>s.id === selectedSeasonId)?.name || (selectedSeasonId ? 'Saison wählen' : 'Bitte Saison wählen')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTeams && <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Mannschaften...</p></div>}
          {!isLoadingTeams && !selectedSeasonId && activeClubId && <div className="p-6 text-center text-muted-foreground"><p>Bitte wählen Sie zuerst eine Saison aus.</p></div>}
          {!isLoadingTeams && selectedSeasonId && teamsOfAssignedClub.length === 0 && (
            <div className="p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <p>{`Keine Mannschaften für ${activeClubName || 'diesen Verein'} in dieser Saison ${selectedLeagueIdFilter ? `und Liga "${allLeagues.find(l=>l.id===selectedLeagueIdFilter)?.name || ''}"` : ''} gefunden.`}</p>
              {isVV && <p className="text-sm mt-1">Klicken Sie auf "Neue Mannschaft", um eine anzulegen.</p>}
            </div>
          )}
          {!isLoadingTeams && selectedSeasonId && teamsOfAssignedClub.length > 0 && (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Liga</TableHead><TableHead>Jahr</TableHead><TableHead className="text-center">Schützen</TableHead>
                {isVV && <TableHead className="text-right">Aktionen</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {teamsOfAssignedClub.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{getLeagueName(team.leagueId)}</TableCell>
                    <TableCell>{team.competitionYear}</TableCell>
                    <TableCell className="text-center">{team.shooterIds?.length || 0} / {MAX_SHOOTERS_PER_TEAM}</TableCell>
                    {isVV && (
                        <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditTeam(team)} disabled={isSubmittingForm || isDeletingTeam}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog open={!!teamToDelete && teamToDelete.id === team.id} onOpenChange={(open) => { if(!open) setTeamToDelete(null);}}>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteConfirmation(team)} disabled={isSubmittingForm || isDeletingTeam}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
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
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) {setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]);} setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleSubmitTeamForm}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}</DialogTitle>
              <DialogDescriptionComponent>
                Für Verein: {activeClubName}. Saison: {allSeasons.find(s => s.id === (currentTeam?.seasonId || selectedSeasonId))?.name || 'Saison wählen'}
              </DialogDescriptionComponent>
            </DialogHeader>
            {currentTeam && (
              <div className="space-y-4 py-4">
                <Alert variant="default" className="mb-4 bg-blue-50 border-blue-300 text-blue-700"><InfoIcon className="h-4 w-4 text-blue-600" /><AlertDescription>Bitte kennzeichnen Sie Ihre leistungsstärkste Mannschaft mit "I", die zweitstärkste mit "II" usw. Dies hilft bei der korrekten Ligaeinteilung durch den Super-Admin.</AlertDescription></Alert>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label htmlFor="vv-teamNameFormDialog">Name der Mannschaft</Label><Input id="vv-teamNameFormDialog" value={currentTeam.name || ''} onChange={(e) => handleFormInputChange('name', e.target.value)} required /></div>
                    <div className="space-y-1.5"><Label htmlFor="vv-teamClubDisplayDialog">Verein</Label><Input id="vv-teamClubDisplayDialog" value={activeClubName || ''} disabled className="bg-muted/50" /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="vv-teamLeagueDisplayDialog">Zugewiesene Liga (durch Admin)</Label><Input id="vv-teamLeagueDisplayDialog" value={currentTeam.leagueId ? getLeagueName(currentTeam.leagueId) : 'Nicht zugewiesen'} disabled className="bg-muted/50" /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1.5"><Label htmlFor="vv-captainNameDialog">Name Mannschaftsführer</Label><Input id="vv-captainNameDialog" value={currentTeam.captainName || ''} onChange={(e) => handleFormInputChange('captainName', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label htmlFor="vv-captainEmailDialog">E-Mail MF</Label><Input id="vv-captainEmailDialog" type="email" value={currentTeam.captainEmail || ''} onChange={(e) => handleFormInputChange('captainEmail', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label htmlFor="vv-captainPhoneDialog">Telefon MF</Label><Input id="vv-captainPhoneDialog" type="tel" value={currentTeam.captainPhone || ''} onChange={(e) => handleFormInputChange('captainPhone', e.target.value)} /></div>
                </div>
                {isVV && (
                  <div className="space-y-2 pt-3 border-t mt-3">
                    <div className="flex justify-between items-center mb-1.5"><Label className="text-base font-medium">Schützen für diese Mannschaft auswählen</Label><span className="text-sm text-muted-foreground">{selectedShooterIdsInForm.length} / {MAX_SHOOTERS_PER_TEAM} ausgewählt</span></div>
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
                          const teamBeingEdited = currentTeam;
                          const teamLeagueData = teamBeingEdited?.leagueId ? allLeagues.find(l => l.id === teamBeingEdited.leagueId) : null;
                          const categoryOfTeamBeingEdited = getDisciplineCategory(teamLeagueData?.type);
                          if (!isSelected && teamLeagueData && categoryOfTeamBeingEdited && teamBeingEdited?.competitionYear !== undefined) {
                             if (!persistedShooterIdsForTeam.includes(shooter.id)) { 
                                  let assignedToSameCategoryInYear = false;
                                  (shooter.teamIds || []).forEach(assignedTeamId => {
                                      if (formMode === 'edit' && teamBeingEdited?.id === assignedTeamId) return; 
                                      const assignedTeamInfo = allTeamsForYearValidation.find(t => t.id === assignedTeamId);
                                      if (assignedTeamInfo?.leagueCompetitionYear === teamBeingEdited?.competitionYear) { 
                                          const categoryOfAssignedTeam = getDisciplineCategory(assignedTeamInfo.leagueType);
                                          if (categoryOfAssignedTeam && categoryOfAssignedTeam === categoryOfTeamBeingEdited) {
                                              assignedToSameCategoryInYear = true;
                                          }
                                      }
                                  });
                                  if (assignedToSameCategoryInYear) {
                                      isDisabledByDisciplineConflict = true;
                                      disableReason = `(bereits in ${categoryOfTeamBeingEdited}-Team ${teamBeingEdited?.competitionYear})`;
                                  }
                             }
                          }
                           if (isDisabledByMax && !isDisabledByDisciplineConflict) { 
                              disableReason = "(Max. Schützen erreicht)";
                          }
                          const finalIsDisabled = isDisabledByMax || isLoadingValidationData || isDisabledByDisciplineConflict;
                          return (
                              <div key={shooter.id} className="flex items-center space-x-3 p-1.5 hover:bg-background/80 rounded-md">
                              <Checkbox id={`vv-team-shooter-assign-${shooter.id}`} checked={isSelected} onCheckedChange={(checkedState) => handleShooterSelectionChange(shooter.id, !!checkedState)} disabled={finalIsDisabled} className="h-5 w-5" />
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
                        <p>{(activeClubId) ? `Keine Schützen für '${activeClubName || 'Verein'}' gefunden.` : 'Technischer Fehler.'}</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                     <div className="space-y-1.5"><Label htmlFor="vv-teamSeasonDisplayDialog">Saison</Label><Input id="vv-teamSeasonDisplayDialog" value={allSeasons.find(s => s.id === (currentTeam?.seasonId || selectedSeasonId))?.name || ''} disabled className="bg-muted/50" /></div>
                     <div className="space-y-1.5"><Label htmlFor="vv-teamCompetitionYearDisplayDialog">Wettkampfjahr</Label><Input id="vv-teamCompetitionYearDisplayDialog" value={currentTeam?.competitionYear?.toString() || allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear?.toString() || ''} disabled className="bg-muted/50" /></div>
                </div>
              </div>
            )}
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]);}}>Abbrechen</Button>
              {isVV && (<Button type="submit" disabled={isSubmittingForm || isLoadingShootersForDialog || isLoadingValidationData}>{(isSubmittingForm || isLoadingShootersForDialog || isLoadingValidationData) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Speichern</Button>)}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
