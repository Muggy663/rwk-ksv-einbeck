// src/app/admin/teams/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users, Loader2, AlertTriangle, InfoIcon, UserPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { TeamStatusBadge } from '@/components/ui/team-status-badge';
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
import type { Season, League, Club, Team, Shooter, TeamValidationInfo, FirestoreLeagueSpecificDiscipline, UIDisciplineSelection, TeamCompetitionStatus } from '@/types/rwk';
import { MAX_SHOOTERS_PER_TEAM, leagueDisciplineOptions } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query,
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayUnion, arrayRemove, Timestamp,
  setDoc, limit
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SubstitutionDialog } from '@/components/admin/SubstitutionDialog';
import { BackButton } from '@/components/ui/back-button';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "shooters";
const ALL_CLUBS_FILTER_VALUE = "__ALL_CLUBS__";
const ALL_LEAGUES_FILTER_VALUE = "__ALL_LEAGUES__";

export default function AdminTeamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [queryParams, setQueryParams] = useState<{seasonId: string | null, leagueId: string | null, clubId: string | null}>({
    seasonId: null,
    leagueId: null,
    clubId: null
  });
  
  // Extrahiere URL-Parameter auf Client-Seite
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setQueryParams({
        seasonId: urlParams.get('seasonId'),
        leagueId: urlParams.get('leagueId'),
        clubId: urlParams.get('clubId')
      });
    }
  }, []);
  
  const querySeasonId = queryParams.seasonId;
  const queryLeagueId = queryParams.leagueId;
  const queryClubId = queryParams.clubId;

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(querySeasonId || '');
  const [selectedClubIdFilter, setSelectedClubIdFilter] = useState<string>(queryClubId || ALL_CLUBS_FILTER_VALUE);
  const [selectedLeagueIdFilter, setSelectedLeagueIdFilter] = useState<string>(queryLeagueId || ALL_LEAGUES_FILTER_VALUE);
  
  const [teamsForDisplay, setTeamsForDisplay] = useState<Team[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const TEAMS_PER_PAGE = 20;
  
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
  const [shooterSearchTerm, setShooterSearchTerm] = useState<string>('');
  
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [substitutionDialogOpen, setSubstitutionDialogOpen] = useState(false);
  const [selectedTeamForSubstitution, setSelectedTeamForSubstitution] = useState<Team | null>(null);
  
  // Aufklappbare Schützen-Anzeige
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [teamShooters, setTeamShooters] = useState<Map<string, Shooter[]>>(new Map());
  const [loadingShooters, setLoadingShooters] = useState<Set<string>>(new Set());

  const fetchInitialData = useCallback(async () => {
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


      const rawLeagues = leaguesSnapshot.docs.map(lDoc => ({ id: lDoc.id, ...lDoc.data() } as League));
      const fetchedLeagues = rawLeagues.filter(l => l.id && typeof l.id === 'string' && l.id.trim() !== "");
      setAllLeagues(fetchedLeagues);

            
      const rawClubs = clubsSnapshot.docs.map(cDoc => ({ id: cDoc.id, ...cDoc.data() } as Club));
      const filteredClubs = rawClubs.filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== "");
      setAllClubs(filteredClubs);

      
      // Set initial selections based on query params if valid
      if (querySeasonId && fetchedSeasons.some(s => s.id === querySeasonId)) {
        setSelectedSeasonId(querySeasonId);
      } else if (!selectedSeasonId && fetchedSeasons.length > 0) {
        setSelectedSeasonId(fetchedSeasons[0].id); // Auto-select first season if none selected
      }
      
      if (queryClubId && filteredClubs.some(c => c.id === queryClubId)) {
        setSelectedClubIdFilter(queryClubId);
      }
      
      if (queryLeagueId && fetchedLeagues.some(l => l.id === queryLeagueId && l.seasonId === (querySeasonId || selectedSeasonId))) {
         setSelectedLeagueIdFilter(queryLeagueId);
      }

    } catch (error) {
      console.error("AdminTeamsPage: Error fetching initial data (seasons/leagues/clubs): ", error);
      toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingData(false);

    }
  }, [toast, querySeasonId, queryClubId, queryLeagueId, selectedSeasonId]); 

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const leaguesForFilterDropdown = useMemo(() => {
    if (!selectedSeasonId || allLeagues.length === 0) return [];
    const filtered = allLeagues.filter(l => l.seasonId === selectedSeasonId);

    return filtered.sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [selectedSeasonId, allLeagues]);

  const availableLeaguesForDialog = useMemo(() => {
    const seasonIdForDialog = currentTeam?.seasonId || selectedSeasonId;
    if (!seasonIdForDialog || allLeagues.length === 0) return [];
    const filtered = allLeagues.filter(l => l.seasonId === seasonIdForDialog);

    return filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [currentTeam?.seasonId, selectedSeasonId, allLeagues]);


  const handleSearchTeams = useCallback(async () => {
    // Wenn keine Saison ausgewählt ist, aber wir haben eine im State, verwenden wir diese
    const effectiveSeasonId = selectedSeasonId || (allSeasons.length > 0 ? allSeasons[0].id : null);
    
    if (!effectiveSeasonId) {
      toast({ title: "Saison fehlt", description: "Bitte wählen Sie eine Saison aus.", variant: "warning" });
      setTeamsForDisplay([]);
      return;
    }
    
    // Background Sync: Zeige gecachte Daten sofort, lade frische im Hintergrund
    const cacheKey = `admin-teams-${effectiveSeasonId}-${selectedClubIdFilter}-${selectedLeagueIdFilter}`;
    const cachedTeams = sessionStorage.getItem(cacheKey);
    
    if (cachedTeams) {
      setTeamsForDisplay(JSON.parse(cachedTeams));
    }
    
    setIsLoadingTeams(true);

    try {
      const selectedSeasonData = allSeasons.find(s => s.id === effectiveSeasonId);
      if (!selectedSeasonData) {
        toast({ title: "Saisondaten nicht gefunden", variant: "destructive" });
        setIsLoadingTeams(false);
        return;
      }

      // Optimierte Query mit seasonId als Hauptfilter (sehr selektiv)
      let qConstraints: any[] = [
        where("seasonId", "==", effectiveSeasonId), // Hauptfilter: seasonId (sehr selektiv)
      ];
      
      // Weitere Filter nur wenn nötig
      if (selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE) {
        qConstraints.push(where("clubId", "==", selectedClubIdFilter));
      }
      if (selectedLeagueIdFilter === "NO_LEAGUE_ASSIGNED") {
        qConstraints.push(where("leagueId", "==", null));
      } else if (selectedLeagueIdFilter !== ALL_LEAGUES_FILTER_VALUE) {
        qConstraints.push(where("leagueId", "==", selectedLeagueIdFilter));
      }
      
      // Einfache Query - Composite Index macht es blitzschnell
      const teamsQuery = query(
        collection(db, TEAMS_COLLECTION), 
        ...qConstraints, 
        orderBy("name", "asc")
        // Kein limit() - Index optimiert die Performance
      );
      
      const querySnapshot = await getDocs(teamsQuery);
      const fetchedTeams = querySnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        shooterIds: d.data().shooterIds || [] 
      } as Team));
      
      setTeamsForDisplay(fetchedTeams);
      
      // Cache für Background Sync speichern
      sessionStorage.setItem(cacheKey, JSON.stringify(fetchedTeams));
      

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
  
  const { clubId: ctClubIdDialog, competitionYear: ctCompYearDialog, id: ctIdDialog } = currentTeam || {};

  const fetchShootersAndValidationDataForDialog = useCallback(async () => {
    const clubIdToFetch = formMode === 'new' ? currentTeam?.clubId : ctClubIdDialog;
    const compYearToFetch = formMode === 'new' ? currentTeam?.competitionYear : ctCompYearDialog;

    if (!isFormOpen || !clubIdToFetch || compYearToFetch === undefined) {
      setAvailableClubShooters([]);
      setAllTeamsForYearValidation([]);
      setIsLoadingShootersForDialog(false);
      setIsLoadingValidationData(false);
      return;
    }
    
    // Alle Caches löschen für frische Daten
    if (typeof window !== 'undefined') {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('admin-teams') || key.includes('shooters') || key.includes('cache')) {
          sessionStorage.removeItem(key);
        }
      });
      // Auch localStorage leeren
      Object.keys(localStorage).forEach(key => {
        if (key.includes('admin-teams') || key.includes('shooters') || key.includes('cache')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    setIsLoadingShootersForDialog(true);
    setIsLoadingValidationData(true);
    try {
      // Lade nur RWK-Schützen aus shooters Collection
      const shootersQuery = query(
        collection(db, SHOOTERS_COLLECTION), 
        orderBy("name", "asc")
      );
      const teamsForYearQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", compYearToFetch));
      
      const [shootersSnapshot, teamsForYearSnapshot] = await Promise.all([
        getDocs(shootersQuery),
        getDocs(teamsForYearQuery),
      ]);

      // Lade auch km_shooters als Fallback für alte Team-Zuordnungen
      let kmShootersSnapshot;
      try {
        kmShootersSnapshot = await getDocs(query(collection(db, 'km_shooters')));
      } catch {
        kmShootersSnapshot = { docs: [] };
      }
      
      // Kombiniere shooters und km_shooters
      const rwkShooters = shootersSnapshot.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, teamIds: data.teamIds || [], source: 'rwk' } as Shooter;
      });
      
      const kmShooters = kmShootersSnapshot.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, teamIds: data.teamIds || [], source: 'km' } as Shooter;
      });
      
      const allShooters = [...rwkShooters, ...kmShooters];
      
      const fetchedShooters = allShooters.filter(shooter => {
        const shooterClubId = shooter.clubId || shooter.rwkClubId || (shooter as any).kmClubId;
        return shooterClubId === clubIdToFetch;
      });
      
      // Entferne Duplikate (bevorzuge shooters)
      const uniqueShooters = fetchedShooters.filter((shooter, index, self) => 
        index === self.findIndex(s => s.id === shooter.id && (shooter.source === 'rwk' || !self.some(other => other.id === s.id && other.source === 'rwk')))
      );
      
      setAvailableClubShooters(uniqueShooters);

      
      const leagueMap = new Map(allLeagues.map(l => [l.id, l.type]));

      const teamsForValidation: TeamValidationInfo[] = teamsForYearSnapshot.docs.map(d => {
        const teamData = d.data() as Team;
        return { 
          id: d.id, 
          ...teamData, 
          shooterIds: teamData.shooterIds || [],
          leagueType: teamData.leagueId ? leagueMap.get(teamData.leagueId) : undefined,
          leagueCompetitionYear: teamData.competitionYear,
          currentShooterCount: (teamData.shooterIds || []).length,
        };
      });
      setAllTeamsForYearValidation(teamsForValidation);


    } catch (error) {
      console.error("AdminTeamsPage: DIALOG - Error fetching shooters/validation data:", error);
    } finally {
      setIsLoadingShootersForDialog(false);
      setIsLoadingValidationData(false);
    }
  }, [isFormOpen, formMode, currentTeam, ctClubIdDialog, ctCompYearDialog, allLeagues, toast]);
  
  useEffect(() => {
    if (isFormOpen) {
      fetchShootersAndValidationDataForDialog();
    }
  }, [isFormOpen, fetchShootersAndValidationDataForDialog]);


  useEffect(() => {
    if (isFormOpen && formMode === 'edit' && ctIdDialog && !isLoadingShootersForDialog && !isLoadingValidationData) {
        const currentTeamDataFromState = teamsForDisplay.find(t => t.id === ctIdDialog);
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
  }, [isFormOpen, formMode, ctIdDialog, teamsForDisplay, isLoadingShootersForDialog, isLoadingValidationData, availableClubShooters]);


  const handleAddNewTeam = () => {
    if (!selectedSeasonId) { 
      toast({ title: "Saison fehlt", description: "Bitte zuerst eine Saison auswählen.", variant: "destructive" }); return;
    }
    const currentSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeasonData) {
      toast({ title: "Saisonfehler", description: "Ausgewählte Saisondaten nicht gefunden.", variant: "destructive" }); return;
    }

    setCurrentTeam({ 
      clubId: selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE ? selectedClubIdFilter : '', // Require a club to be selected for new team
      competitionYear: currentSeasonData.competitionYear,
      seasonId: selectedSeasonId, 
      name: '', 
      shooterIds: [],
      leagueId: selectedLeagueIdFilter !== ALL_LEAGUES_FILTER_VALUE ? selectedLeagueIdFilter : null, 
      captainName: '',
      captainEmail: '',
      captainPhone: '',
      outOfCompetition: false,
    });
    setFormMode('new');
    setIsFormOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setFormMode('edit');
    // Stelle sicher, dass seasonId gesetzt ist
    const teamWithSeasonId = {
      ...team,
      seasonId: team.seasonId || selectedSeasonId
    };
    setCurrentTeam(teamWithSeasonId);
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

      // Versuche alle Schützen-IDs zu aktualisieren, ignoriere Fehler bei ungültigen IDs
      const shooterIdsInDeletedTeam = teamToDelete.shooterIds || [];
      
      // Prüfe welche Schützen tatsächlich existieren
      const existingShooterIds: string[] = [];
      for (const shooterId of shooterIdsInDeletedTeam) {
        if (shooterId && typeof shooterId === 'string' && shooterId.trim() !== '') {
          try {
            const shooterDoc = await getFirestoreDoc(doc(db, SHOOTERS_COLLECTION, shooterId));
            if (shooterDoc.exists()) {
              existingShooterIds.push(shooterId);
            }
          } catch (error) {

          }
        }
      }
      
      // Nur existierende Schützen aktualisieren
      existingShooterIds.forEach(shooterId => {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
        batch.update(shooterDocRef, { teamIds: arrayRemove(teamToDelete.id) });
      });
      
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
        toast({ title: "Zu viele Schützen", description: `Maximal ${MAX_SHOOTERS_PER_TEAM} Schützen ausgewählt. Bitte Auswahl korrigieren.`, variant: "destructive" });
        return;
    }
    
    setIsSubmittingForm(true);
    
    const teamDataToSave: Omit<Team, 'id'> & { id?: string } = { 
      name: currentTeam.name.trim(),
      clubId: currentTeam.clubId,
      seasonId: currentTeam.seasonId,
      competitionYear: currentTeam.competitionYear,
      leagueId: currentTeam.leagueId || null,
      leagueType: currentTeam.leagueType,
      shooterIds: selectedShooterIdsInForm, 
      captainName: currentTeam.captainName?.trim() || '',
      captainEmail: currentTeam.captainEmail?.trim() || '',
      captainPhone: currentTeam.captainPhone?.trim() || '',
      outOfCompetition: currentTeam.outOfCompetition || false,
    };
    
    const currentTeamLeagueInfo = allLeagues.find(l => l.id === teamDataToSave.leagueId);
    const categoryOfCurrentTeamForValidation = currentTeamLeagueInfo?.type;
    
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
                const categoryOfExistingTeam = teamValidationEntry.leagueType;
                if (categoryOfExistingTeam && categoryOfExistingTeam === categoryOfCurrentTeamForValidation) { 
                   conflictFound = true; break;
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
      
      // Füge leagueType zur Duplikat-Prüfung hinzu, damit gleiche Namen in verschiedenen Disziplinen erlaubt sind
      if (teamDataToSave.leagueType) {
        baseDuplicateConditions.push(where("leagueType", "==", teamDataToSave.leagueType));
      }

      if (formMode === 'edit' && currentTeam.id) {
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions, where(documentId(), "!=", currentTeam.id));
      } else {
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions);
      }
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        toast({ title: "Doppelter Mannschaftsname", description: `Eine Mannschaft mit diesem Namen existiert bereits für diesen Verein und dieses Wettkampfjahr in derselben Disziplin.`, variant: "destructive", duration: 7000});
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
        throw new Error("AdminTeamsPage: handleSubmit - Invalid form mode or missing team ID for edit.");
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

      
      // Warte kurz und aktualisiere dann die Schützen-Daten
      setTimeout(async () => {

        await fetchShootersAndValidationDataForDialog();
      }, 1000);
      
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

  const handleFormInputChange = (
    field: keyof Pick<Team, 'name' | 'leagueId' | 'clubId' | 'captainName' | 'captainEmail' | 'captainPhone'>, 
    value: string | null
  ) => {
    setCurrentTeam(prev => {
        if (!prev) return null;
        const updatedTeam = { ...prev, [field]: value };
        if (field === 'clubId' && prev.clubId !== value) { // If club changes, reset shooters
            setAvailableClubShooters([]);
            setSelectedShooterIdsInForm([]);
            setPersistedShooterIdsForTeam([]);
            setShooterSearchTerm('');
        }
        return updatedTeam;
    });
  };

  const filteredShooters = useMemo(() => {
    if (!shooterSearchTerm.trim()) return availableClubShooters;
    const searchLower = shooterSearchTerm.toLowerCase();
    return availableClubShooters.filter(shooter => {
      const fullName = shooter.firstName && shooter.lastName 
        ? `${shooter.firstName} ${shooter.lastName}`.toLowerCase()
        : (shooter.name || '').toLowerCase();
      return fullName.includes(searchLower);
    });
  }, [availableClubShooters, shooterSearchTerm]);

 const handleShooterSelectionChange = (shooterId: string, isChecked: boolean) => {
    if (isSubmittingForm || isLoadingShootersForDialog || isLoadingValidationData) return;

    const currentTeamData = currentTeam;
    if (!currentTeamData || currentTeamData.competitionYear === undefined) return;
    
    const currentTeamLeagueData = allLeagues.find(l => l.id === currentTeamData.leagueId);
    const categoryOfCurrentTeam = currentTeamLeagueData?.type;

    if (isChecked) { 
      if (selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) {
          toast({ title: "Maximale Schützenzahl erreicht", variant: "warning" });
          return; 
      }
      if (categoryOfCurrentTeam && currentTeamData.competitionYear !== undefined) {
          const shooterBeingChecked = availableClubShooters.find(s => s.id === shooterId);
          if (shooterBeingChecked?.id && !persistedShooterIdsForTeam.includes(shooterId)) { 
              let conflictFound = false;
              for (const existingTeamId of (shooterBeingChecked.teamIds || [])) {
                  if (formMode === 'edit' && currentTeamData.id && existingTeamId === currentTeamData.id) continue; 
                  
                  const teamValidationEntry = allTeamsForYearValidation.find(t => t.id === existingTeamId);
                  if (teamValidationEntry?.leagueCompetitionYear === currentTeamData.competitionYear) { 
                      const categoryOfExistingTeam = teamValidationEntry.leagueType;
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


  const getClubName = (clubId?: string | null): string => {
    if (!clubId) return 'N/A';
    return allClubs.find(c => c.id === clubId)?.name || 'Unbek. Verein';
  };

  const getLeagueName = (leagueId?: string | null): string => {
    if (!leagueId) return 'Nicht zugewiesen'; 
    return allLeagues.find(l => l.id === leagueId)?.name || 'Unbek. Liga';
  };

  const toggleTeamExpansion = async (teamId: string, shooterIds: string[]) => {
    const newExpanded = new Set(expandedTeams);
    
    if (expandedTeams.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
      
      // Lade Schützen nur wenn noch nicht geladen
      if (!teamShooters.has(teamId) && shooterIds.length > 0) {
        setLoadingShooters(prev => new Set(prev).add(teamId));
        
        try {
          const shooterPromises = shooterIds.map(async (shooterId) => {
            // Prüfe shooters
            const rwkShooterDoc = await getFirestoreDoc(doc(db, SHOOTERS_COLLECTION, shooterId));
            if (rwkShooterDoc.exists()) {
              return { id: rwkShooterDoc.id, ...rwkShooterDoc.data() } as Shooter;
            }
            
            // Prüfe km_shooters als Fallback
            try {
              const kmShooterDoc = await getFirestoreDoc(doc(db, 'km_shooters', shooterId));
              if (kmShooterDoc.exists()) {
                    return { id: kmShooterDoc.id, ...kmShooterDoc.data() } as Shooter;
              }
            } catch (kmError) {
              // km_shooters nicht verfügbar
            }
            
            // Zeige auch nicht gefundene IDs als Platzhalter
            return { 
              id: shooterId, 
              name: `Schütze nicht gefunden (ID: ${shooterId.substring(0, 8)}...)`,
              firstName: 'Nicht',
              lastName: 'gefunden',
              gender: 'unknown',
              birthYear: null
            } as Shooter;
          });
          
          const shooters = await Promise.all(shooterPromises);
          console.log(`DEBUG: Team ${teamId} - ${shooters.length} Schützen geladen:`, shooters.map(s => s.name));
          setTeamShooters(prev => new Map(prev).set(teamId, shooters));
        } catch (error) {
          console.error('Fehler beim Laden der Schützen:', error);
          toast({ title: "Fehler", description: "Schützen konnten nicht geladen werden.", variant: "destructive" });
        } finally {
          setLoadingShooters(prev => {
            const newSet = new Set(prev);
            newSet.delete(teamId);
            return newSet;
          });
        }
      }
    }
    
    setExpandedTeams(newExpanded);
  };

  if (isLoadingData) { 
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Lade Basisdaten...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center">
            <BackButton className="mr-2 md:hidden" fallbackHref="/admin" />
            <h1 className="text-2xl font-semibold text-primary">Mannschaftsverwaltung (Admin)</h1>
          </div>
          <Link href="/admin" className="md:hidden">
            <Button variant="outline" size="sm">
              Zurück
            </Button>
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-2 w-full md:w-auto">
          <div className="hidden md:flex items-center">
            <BackButton className="mr-2" fallbackHref="/admin" />
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Zurück zum Dashboard
              </Button>
            </Link>
          </div>
           <div className="w-full sm:w-auto space-y-1.5">
            <Label htmlFor="saison-select-admin-teams">Saison</Label>
            <Select value={selectedSeasonId} onValueChange={(val) => { setSelectedSeasonId(val); setSelectedLeagueIdFilter(ALL_LEAGUES_FILTER_VALUE); setTeamsForDisplay([]); }}>
              <SelectTrigger id="saison-select-admin-teams" className="w-full sm:w-[200px]">
                 <SelectValue placeholder={allSeasons.length === 0 ? "Keine Saisons" : "Saison wählen"} />
              </SelectTrigger>
              <SelectContent>
                {allSeasons.filter(s => s && typeof s.id === 'string' && s.id.trim() !== "").map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                {allSeasons.filter(s => s.id && typeof s.id === 'string' && s.id.trim() !== "").length === 0 && 
                  <SelectItem value="NO_SEASONS_PLACEHOLDER_ADMIN_TEAMS" disabled>Keine Saisons verfügbar</SelectItem>
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
                    {allClubs.filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== "").length === 0 &&
                        <SelectItem value="NO_CLUBS_PLACEHOLDER_ADMIN_TEAMS" disabled>Keine Vereine verfügbar</SelectItem>
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
                    <SelectItem value="NO_LEAGUE_ASSIGNED">Nicht zugewiesen</SelectItem>
                    {leaguesForFilterDropdown.filter(l => l && typeof l.id === 'string' && l.id.trim() !== "").map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                     {leaguesForFilterDropdown.length === 0 && selectedSeasonId &&
                        <SelectItem value="NO_LEAGUES_FOR_SEASON_FILTER_ADMIN_TEAMS" disabled>Keine Ligen für diese Saison</SelectItem>
                    }
                </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearchTeams} disabled={!selectedSeasonId || isLoadingTeams} className="w-full sm:w-auto whitespace-nowrap">
            {isLoadingTeams ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Users className="h-4 w-4 mr-2" />} Mannschaften suchen
          </Button>
          <Button onClick={handleAddNewTeam} disabled={!selectedSeasonId || selectedClubIdFilter === ALL_CLUBS_FILTER_VALUE} className="w-full sm:w-auto whitespace-nowrap">
            <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft
          </Button>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>
            Gefundene Mannschaften ({teamsForDisplay.length})
          </CardTitle>
          <CardDescription>
            {selectedSeasonId ? `Für Saison: ${allSeasons.find(s=>s.id === selectedSeasonId)?.name}` : "Bitte Saison wählen."}
            {selectedClubIdFilter !== ALL_CLUBS_FILTER_VALUE && ` / Verein: ${allClubs.find(c=>c.id===selectedClubIdFilter)?.name}`}
            {selectedLeagueIdFilter !== ALL_LEAGUES_FILTER_VALUE && ` / Liga: ${allLeagues.find(l=>l.id===selectedLeagueIdFilter)?.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTeams ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Mannschaften...</p></div>
          ) : (!selectedSeasonId) ? (
             <div className="p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p>Bitte wählen Sie Filter aus und klicken Sie auf "Mannschaften suchen".</p>
             </div>
          ) : teamsForDisplay.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Verein</TableHead><TableHead>Liga</TableHead><TableHead>Jahr</TableHead><TableHead className="text-center">Schützen</TableHead><TableHead className="text-right">Aktionen</TableHead></TableRow></TableHeader>
              <TableBody>
                {teamsForDisplay.map((team) => (
                  <React.Fragment key={team.id}>
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTeamExpansion(team.id, team.shooterIds || [])}
                            className="h-6 w-6 p-0"
                            disabled={!team.shooterIds?.length}
                          >
                            {expandedTeams.has(team.id) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </Button>
                          {team.name}
                          <TeamStatusBadge 
                            outOfCompetition={team.outOfCompetition} 
                            className="ml-2" 
                          />
                        </div>
                      </TableCell>
                      <TableCell>{getClubName(team.clubId)}</TableCell>
                      <TableCell>
                        {getLeagueName(team.leagueId)}
                        {team.leagueType && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                            {team.leagueType}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{team.competitionYear}</TableCell>
                      <TableCell className="text-center">{team.shooterIds?.length || 0} / {MAX_SHOOTERS_PER_TEAM}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditTeam(team)} aria-label="Mannschaft bearbeiten"><Edit className="h-4 w-4" /></Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedTeamForSubstitution(team);
                            setSubstitutionDialogOpen(true);
                          }} 
                          aria-label="Ersatzschütze hinzufügen"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
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
                    {expandedTeams.has(team.id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          {loadingShooters.has(team.id) ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm text-muted-foreground">Lade Schützen...</span>
                            </div>
                          ) : teamShooters.has(team.id) ? (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Gemeldete Schützen ({teamShooters.get(team.id)?.length || 0}):</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {teamShooters.get(team.id)?.map((shooter) => (
                                  <div key={shooter.id} className={`flex items-center gap-2 p-2 rounded border ${
                                    shooter.name?.includes('nicht gefunden') ? 'bg-red-50 border-red-200' : 'bg-background'
                                  }`}>
                                    <div className="text-sm">
                                      <div className={`font-medium ${
                                        shooter.name?.includes('nicht gefunden') ? 'text-red-600' : ''
                                      }`}>
                                        {shooter.firstName && shooter.lastName ? `${shooter.firstName} ${shooter.lastName}` : shooter.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {shooter.gender === 'male' ? 'M' : shooter.gender === 'female' ? 'W' : '?'} • {shooter.birthYear || 'Jg. N/A'}
                                      </div>
                                    </div>
                                  </div>
                                )) || []}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              Keine Schützen zugeordnet
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
              <p>Keine Mannschaften für die gewählten Filter gefunden.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) {setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]); setShooterSearchTerm('');} setIsFormOpen(open); }}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmitTeamForm(e);
          }}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}</DialogTitle>
              <DialogDescriptionComponent>
                Saison: {currentTeam?.seasonId ? (allSeasons.find(s => s.id === currentTeam.seasonId)?.name) : (allSeasons.find(s => s.id === selectedSeasonId)?.name || 'Saison nicht gewählt')}
              </DialogDescriptionComponent>
            </DialogHeader>
            {currentTeam && (
              <div className="space-y-4 py-4">
                <Alert variant="default" className="mb-4 bg-blue-50 border-blue-300 text-blue-700">
                    <InfoIcon className="h-4 w-4 text-blue-600" />
                    <AlertDescription>
                        Bitte kennzeichnen Sie Ihre leistungsstärkste Mannschaft mit "I", die zweitstärkste mit "II" usw. Dies hilft bei der korrekten Ligaeinteilung.
                    </AlertDescription>
                </Alert>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="teamNameFormAdmin">Name der Mannschaft</Label>
                        <Input id="teamNameFormAdmin" value={currentTeam.name || ''} onChange={(e) => handleFormInputChange('name', e.target.value)} required />
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
                                <SelectValue placeholder={allClubs.length === 0 ? "Keine Vereine" : "Verein wählen..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {allClubs.filter(c => c.id && typeof c.id.trim() === 'string' && c.id.trim() !== "").map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                                {allClubs.filter(c => c.id && typeof c.id.trim() === 'string' && c.id.trim() !== "").length === 0 && 
                                    <SelectItem value="NO_CLUBS_DIALOG_ADMIN_TEAMS" disabled>Keine Vereine verfügbar</SelectItem>
                                }
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="teamDisciplineSelectAdmin">Disziplin</Label>
                    <Select
                      value={currentTeam.leagueType || ""}
                      onValueChange={(value) => setCurrentTeam(prev => prev ? {...prev, leagueType: value as FirestoreLeagueSpecificDiscipline} : null)}
                      required
                    >
                      <SelectTrigger id="teamDisciplineSelectAdmin">
                        <SelectValue placeholder="Disziplin wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KKG">Kleinkaliber Gewehr</SelectItem>

                        <SelectItem value="KKP">Kleinkaliber Pistole</SelectItem>
                        <SelectItem value="LGA">Luftgewehr Auflage</SelectItem>
                        <SelectItem value="LGS">Luftgewehr Freihand</SelectItem>
                        <SelectItem value="LP">Luftpistole</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dialogLeagueSelectAdmin">Liga zuweisen</Label>
                  <Select
                    value={currentTeam.leagueId || ""}
                    onValueChange={(value) => handleFormInputChange('leagueId', value === "NO_LEAGUE_ASSIGNED_PLACEHOLDER_ADMIN_TEAMS" ? null : value)}
                    disabled={isLoadingData || availableLeaguesForDialog.length === 0}
                  >
                    <SelectTrigger id="dialogLeagueSelectAdmin">
                      <SelectValue placeholder="- Liga auswählen / Nicht zugewiesen -" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_LEAGUE_ASSIGNED_PLACEHOLDER_ADMIN_TEAMS">- Nicht zugewiesen -</SelectItem>
                      {availableLeaguesForDialog.filter(league => league && typeof league.id === 'string' && league.id.trim() !== "").map(league => (
                          <SelectItem key={league.id} value={league.id}>
                            {league.name} ({leagueDisciplineOptions.find(opt => opt.value === league.type)?.label || league.type})
                          </SelectItem>
                        ))}
                      {availableLeaguesForDialog.filter(l => l.id && typeof l.id.trim() === 'string' && l.id.trim() !== "").length === 0 &&
                        <SelectItem value="NO_LEAGUES_DIALOG_ADMIN_TEAMS_PLACEHOLDER" disabled>Keine Ligen für diese Saison verfügbar</SelectItem>
                      }
                    </SelectContent>
                  </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="captainNameAdmin">Name Mannschaftsführer</Label>
                        <Input id="captainNameAdmin" value={currentTeam.captainName || ''} onChange={(e) => handleFormInputChange('captainName', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="captainEmailAdmin">E-Mail MF</Label>
                        <Input id="captainEmailAdmin" type="email" value={currentTeam.captainEmail || ''} onChange={(e) => handleFormInputChange('captainEmail', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="captainPhoneAdmin">Telefon MF</Label>
                        <Input id="captainPhoneAdmin" type="tel" value={currentTeam.captainPhone || ''} onChange={(e) => handleFormInputChange('captainPhone', e.target.value)} />
                    </div>
                </div>
                
                <div className="border border-amber-200 bg-amber-50 rounded-md p-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="outOfCompetitionCheckbox" 
                            checked={currentTeam.outOfCompetition || false}
                            onCheckedChange={(checked) => {
                                setCurrentTeam(prev => prev ? {...prev, outOfCompetition: !!checked} : null);
                            }}
                        />
                        <Label htmlFor="outOfCompetitionCheckbox" className="font-medium text-amber-800">
                            Außer Konkurrenz
                        </Label>
                    </div>
                    <p className="text-xs text-amber-700 mt-2">
                        Mannschaften "außer Konkurrenz" nehmen an Wettkämpfen teil, fließen aber nicht in die offizielle Wertung ein.
                    </p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <Label>Schützen für diese Mannschaft auswählen</Label>
                    <span className="text-sm text-muted-foreground">{selectedShooterIdsInForm.length} / {MAX_SHOOTERS_PER_TEAM} ausgewählt</span>
                  </div>
                  {availableClubShooters.length > 0 && (
                    <div className="mb-2">
                      <Input
                        placeholder="Schützen suchen..."
                        value={shooterSearchTerm}
                        onChange={(e) => setShooterSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                  {isLoadingShootersForDialog || isLoadingValidationData ? (
                     <div className="flex items-center justify-center p-4 h-40 border rounded-md bg-muted/30"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2">Lade Schützen...</p></div>
                  ) : availableClubShooters.length > 0 ? (
                    <ScrollArea className="h-32 md:h-40 rounded-md border p-2 bg-muted/20">
                      <div className="space-y-1">
                      {filteredShooters.map(shooter => {
                        if (!shooter || !shooter.id) return null; 
                        const isSelected = selectedShooterIdsInForm.includes(shooter.id);
                        
                        let isDisabledByMax = !isSelected && selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM;
                        let isDisabledByDisciplineConflict = false;
                        let disableReason = "";
                        
                        const currentTeamLeague = allLeagues.find(l => l.id === currentTeam?.leagueId);
                        const currentTeamSpecificLeagueType = currentTeamLeague?.type;
                        const currentTeamCompYearForValidation = currentTeam?.competitionYear;
                        const categoryOfCurrentTeam = currentTeamSpecificLeagueType;

                        if (!isSelected && categoryOfCurrentTeam && currentTeamCompYearForValidation !== undefined) {
                           if (!persistedShooterIdsForTeam.includes(shooter.id)) { // Only check for new assignments
                                let assignedToSameCategoryInYear = false;
                                (shooter.teamIds || []).forEach(assignedTeamId => {
                                    if (formMode === 'edit' && currentTeam?.id === assignedTeamId) return; 
                                    
                                    const assignedTeamInfo = allTeamsForYearValidation.find(t => t.id === assignedTeamId);
                                    if (assignedTeamInfo?.leagueCompetitionYear === currentTeamCompYearForValidation) {
                                        const categoryOfAssignedTeam = assignedTeamInfo.leagueType;
                                        // WICHTIG: Nur prüfen wenn GLEICHE Liga UND gleiche Disziplin
                                        if (categoryOfAssignedTeam && categoryOfAssignedTeam === categoryOfCurrentTeam && 
                                            assignedTeamInfo.leagueId === currentTeam?.leagueId) {
                                            assignedToSameCategoryInYear = true;
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
                            <div key={shooter.id} className="flex items-center space-x-2 py-1.5 hover:bg-muted/50 rounded-md">
                            <Checkbox
                                id={`admin-team-shooter-assign-${shooter.id}`}
                                checked={isSelected}
                                onCheckedChange={(checkedState) => handleShooterSelectionChange(shooter.id, !!checkedState)}
                                disabled={finalIsDisabled}
                            />
                            <Label htmlFor={`admin-team-shooter-assign-${shooter.id}`} className={`font-normal cursor-pointer flex-grow ${finalIsDisabled ? 'opacity-50 cursor-not-allowed' : '' }`}>
                                {shooter.firstName && shooter.lastName ? `${shooter.firstName} ${shooter.lastName}` : shooter.name}
                                <span className='text-xs text-muted-foreground ml-1'>({shooter.gender === 'male' ? 'M' : 'W'}, {shooter.birthYear || 'Jg. N/A'})</span>
                                {finalIsDisabled && <span className="text-xs text-destructive ml-1">{disableReason}</span>}
                            </Label>
                            </div>
                        );
                      })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 h-40 border rounded-md flex items-center justify-center bg-muted/30">
                      <p>{(currentTeam?.clubId && currentTeam.clubId !== ALL_CLUBS_FILTER_VALUE) ? `Keine Schützen für '${getClubName(currentTeam?.clubId)}' gefunden.` : 'Verein für Mannschaft wählen, um Schützen anzuzeigen.'}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5"> 
                        <Label htmlFor="teamSeasonDisplayAdmin">Saison</Label>
                        <Input id="teamSeasonDisplayAdmin" value={allSeasons.find(s => s.id === (currentTeam?.seasonId || selectedSeasonId))?.name || ''} disabled className="bg-muted/50" />
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="teamCompetitionYearDisplayAdmin">Wettkampfjahr</Label>
                        <Input id="teamCompetitionYearDisplayAdmin" value={currentTeam?.competitionYear?.toString() || ''} disabled className="bg-muted/50" />
                    </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAvailableClubShooters([]); setShooterSearchTerm('');}} className="w-full sm:w-auto">Abbrechen</Button>
              <Button 
                type="button"
                disabled={isSubmittingForm}
                className="w-full sm:w-auto"
                onClick={() => {

                  
                  if (!currentTeam || !currentTeam.name?.trim() || !currentTeam.clubId || !currentTeam.seasonId || currentTeam.competitionYear === undefined) {

                    toast({ title: "Ungültige Eingabe", description: "Name, Verein, Saison und Wettkampfjahr sind erforderlich.", variant: "destructive" });
                    return;
                  }
                  


                  
                  setIsSubmittingForm(true);

                  
                  const teamRef = formMode === 'edit' && currentTeam.id 
                    ? doc(db, TEAMS_COLLECTION, currentTeam.id)
                    : doc(collection(db, TEAMS_COLLECTION));
                  
                  const teamData = {
                    name: currentTeam.name.trim(),
                    clubId: currentTeam.clubId,
                    seasonId: currentTeam.seasonId,
                    competitionYear: currentTeam.competitionYear,
                    leagueId: currentTeam.leagueId || null,
                    leagueType: currentTeam.leagueType,
                    shooterIds: selectedShooterIdsInForm,
                    captainName: currentTeam.captainName?.trim() || '',
                    captainEmail: currentTeam.captainEmail?.trim() || '',
                    captainPhone: currentTeam.captainPhone?.trim() || '',
                    outOfCompetition: currentTeam.outOfCompetition || false
                  };
                  

                  
                  if (formMode === 'edit' && currentTeam.id) {

                    
                    // Verwende die normale handleSubmitTeamForm Funktion
                    const fakeEvent = { preventDefault: () => {} } as FormEvent<HTMLFormElement>;
                    handleSubmitTeamForm(fakeEvent);
                    return;
                  } else {

                    
                    // Verwende die normale handleSubmitTeamForm Funktion
                    const fakeEvent = { preventDefault: () => {} } as FormEvent<HTMLFormElement>;
                    handleSubmitTeamForm(fakeEvent);
                    return;
                  }
                }}
              >
                {isSubmittingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ersatzschützen Dialog */}
      {selectedTeamForSubstitution && user && (
        <SubstitutionDialog
          isOpen={substitutionDialogOpen}
          onClose={() => {
            setSubstitutionDialogOpen(false);
            setSelectedTeamForSubstitution(null);
          }}
          team={selectedTeamForSubstitution}
          userPermission={{
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName,
            role: 'admin',
            isActive: true
          }}
          onSubstitutionCreated={() => {
            handleSearchTeams(); // Aktualisiere die Mannschaftsliste
          }}
        />
      )}
    </div>
  );
}
