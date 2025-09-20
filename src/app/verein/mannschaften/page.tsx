
// /app/verein/mannschaften/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users as TeamsIcon, Loader2, AlertTriangle, InfoIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import {
  MobileTable as Table,
  MobileTableBody as TableBody,
  MobileTableCell as TableCell,
  MobileTableHead as TableHead,
  MobileTableHeader as TableHeader,
  MobileTableRow as TableRow,
} from "@/components/ui/mobile-table";
import {
  MobileSelect as Select,
  MobileSelectContent as SelectContent,
  MobileSelectItem as SelectItem,
  MobileSelectTrigger as SelectTrigger,
  MobileSelectValue as SelectValue,
} from "@/components/ui/mobile-select";
import { GlobalResponsiveDialog } from '@/components/ui/global-responsive-dialog-wrapper';
import { MobilePageWrapper } from '@/components/ui/mobile-page-wrapper';
import { MobileFormWrapper } from '@/components/ui/mobile-form-wrapper';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDescriptionComponent, // Renamed to avoid conflict
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription, // Use this one
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription as UiAlertDescription } from "@/components/ui/alert"; // Renamed to avoid conflict
import { useVereinAuth } from '@/app/verein/layout';
import type { Season, League, Club, Team, Shooter, TeamValidationInfo, FirestoreLeagueSpecificDiscipline, UserPermission } from '@/types/rwk';
import { GEWEHR_DISCIPLINES, PISTOL_DISCIPLINES, leagueDisciplineOptions, MAX_SHOOTERS_PER_TEAM, getDisciplineCategory } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query,
  where, orderBy, documentId, writeBatch, getDoc as getFirestoreDoc, arrayUnion, arrayRemove, Timestamp, setDoc
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "shooters";

export default function VereinMannschaftenPage() {
  const {
    userPermission,
    loadingPermissions,
    permissionError: contextPermissionError,
    assignedClubId, // Single assigned club ID from context
    currentClubId // Multi-Verein aktiver Club
  } = useVereinAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [activeClubName, setActiveClubName] = useState<string | null>(null);

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  const [allLeagues, setAllLeagues] = useState<League[]>([]); // All leagues for naming and validation
  const [availableLeaguesForFilter, setAvailableLeaguesForFilter] = useState<League[]>([]);
  const [selectedLeagueIdFilter, setSelectedLeagueIdFilter] = useState<string>("");

  const [teamsOfActiveClub, setTeamsOfActiveClub] = useState<Team[]>([]);
  const [allClubsGlobal, setAllClubsGlobal] = useState<Club[]>([]); // For club name lookup

  const [allClubShootersForDialog, setAllClubShootersForDialog] = useState<Shooter[]>([]);
  const [allClubShootersForDisplay, setAllClubShootersForDisplay] = useState<Shooter[]>([]);
  const [allTeamsForValidation, setAllTeamsForValidation] = useState<TeamValidationInfo[]>([]);

  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingDialogData, setIsLoadingDialogData] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  const [persistedShooterIdsForTeam, setPersistedShooterIdsForTeam] = useState<string[]>([]);
  const [selectedShooterIdsInForm, setSelectedShooterIdsInForm] = useState<string[]>([]);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  
  // Neue Zustandsvariablen für die vereinfachte Mannschaftsanlage
  const [teamStrength, setTeamStrength] = useState<string>("");
  const [suggestedTeamName, setSuggestedTeamName] = useState<string>("");
  const [shooterSearchQuery, setShooterSearchQuery] = useState<string>("");
  
  // Aufklappbare Schützen-Anzeige (aus Admin übernommen)
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [teamShooters, setTeamShooters] = useState<Map<string, Shooter[]>>(new Map());
  const [loadingShooters, setLoadingShooters] = useState<Set<string>>(new Set());
  const [teamsWithResults, setTeamsWithResults] = useState<Set<string>>(new Set());

  const isVereinsvertreter = userPermission?.clubRoles && 
                           Object.values(userPermission.clubRoles).includes('SPORTLEITER');
  const isAdmin = userPermission?.role === 'superadmin';

  // Effect 1: Set activeClubId and activeClubName based on userPermission from context
  useEffect(() => {

    if (!loadingPermissions) {
      const effectiveClubId = currentClubId || assignedClubId;
      if (effectiveClubId && typeof effectiveClubId === 'string' && effectiveClubId.trim() !== '') {
        setActiveClubId(effectiveClubId);
        const clubInfo = allClubsGlobal.find(c => c.id === effectiveClubId);
        if (clubInfo) {
          setActiveClubName(clubInfo.name);

        } else if (allClubsGlobal.length > 0) { // Attempt to find it if allClubsGlobal is already populated
          console.warn("VMP DEBUG: Club info for assignedClubId not found in allClubsGlobal. This might be a timing issue or invalid ID.");
          // Optionally, fetch if not found, but allClubsGlobal should be loaded by fetchInitialData
        }
      } else {
        console.warn("VMP DEBUG: No valid effectiveClubId from context. Setting activeClub to null.", { currentClubId, assignedClubId });
        setActiveClubId(null);
        setActiveClubName(null);
      }
    }
  }, [assignedClubId, currentClubId, loadingPermissions, allClubsGlobal]);


  // Effect 2: Fetch initial global data (seasons, all leagues, all clubs)
  const fetchInitialData = useCallback(async () => {

    setIsLoadingPageData(true);
    try {
      const seasonsSnapshotPromise = getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
      const leaguesSnapshotPromise = getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      const clubsSnapshotPromise = getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));

      const [seasonsSnapshot, leaguesSnapshot, clubsSnapshot] = await Promise.all([
        seasonsSnapshotPromise, leaguesSnapshotPromise, clubsSnapshotPromise
      ]);

      // Alle Saisons laden, aber nur laufende Saisons anzeigen
      const fetchedSeasons = seasonsSnapshot.docs.map(sDoc => ({ id: sDoc.id, ...sDoc.data() } as Season))
        .filter(s => s.id && typeof s.id === 'string' && s.id.trim() !== "" && s.status === 'Laufend');
      setAllSeasons(fetchedSeasons);


      const fetchedLeaguesRaw = leaguesSnapshot.docs.map(lDoc => ({ id: lDoc.id, ...lDoc.data() } as League));
      const fetchedLeagues = fetchedLeaguesRaw.filter(l => l.id && typeof l.id === 'string' && l.id.trim() !== "");
      setAllLeagues(fetchedLeagues);

      
      const fetchedClubsRaw = clubsSnapshot.docs.map(cDoc => ({ id: cDoc.id, ...cDoc.data() } as Club));
      const fetchedClubs = fetchedClubsRaw.filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== "");
      setAllClubsGlobal(fetchedClubs);


    } catch (error) {
      console.error("VMP DEBUG: fetchInitialData - Error fetching initial page data:", error);
      toast({ title: "Fehler Basisdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingPageData(false);

    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);


  // Effect 3: Populate availableLeaguesForFilter dropdown based on selectedSeason and teams of active club
  const calculatedAvailableLeaguesForFilter = useMemo(() => {

    if (!selectedSeasonId || !activeClubId || !allLeagues || allLeagues.length === 0) {
      return [];
    }
    const currentYear = allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear;
    if (currentYear === undefined) { // Check for undefined explicitly
      return [];
    }
  
    // Get league IDs from teams that belong to the active club and the selected competition year
    const leagueIdsOfActiveClubTeamsInYear = Array.from(new Set(
      teamsOfActiveClub // Use teamsOfActiveClub which is already filtered for activeClubId and current year
        .filter(team => team.leagueId) // Ensure leagueId exists
        .map(team => team.leagueId!)
    ));
  
    // Nur Ligen anzeigen, in denen der Verein Mannschaften hat
    const filtered = allLeagues.filter(l =>
      l.seasonId === selectedSeasonId && // Belongs to the selected season
      leagueIdsOfActiveClubTeamsInYear.includes(l.id) && // The active club has a team in this league for this season
      l.id && typeof l.id === 'string' && l.id.trim() !== ""
    );

    return filtered.sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [selectedSeasonId, activeClubId, allLeagues, allSeasons, teamsOfActiveClub]);

  useEffect(() => {
    setAvailableLeaguesForFilter(calculatedAvailableLeaguesForFilter);
  }, [calculatedAvailableLeaguesForFilter]);


  // Effect 4: Fetch teams for the active club and selected season
  const fetchTeamsForClubAndSeason = useCallback(async () => {
    if (!activeClubId || !selectedSeasonId) {
      setTeamsOfActiveClub([]);

      return;
    }

    setIsLoadingTeams(true);
    try {
      const selectedSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
      if (!selectedSeasonData?.competitionYear) {
        setTeamsOfActiveClub([]);
        console.warn("VMP DEBUG: fetchTeamsForClubAndSeason - No competitionYear for selectedSeasonId:", selectedSeasonId);
        setIsLoadingTeams(false);
        return;
      }

      let teamsQueryConstraints: any[] = [
        where("clubId", "==", activeClubId),
        where("competitionYear", "==", selectedSeasonData.competitionYear),
      ];
      // Only add leagueId filter if a specific league is selected
      if (selectedLeagueIdFilter && selectedLeagueIdFilter !== "") {
          teamsQueryConstraints.push(where("leagueId", "==", selectedLeagueIdFilter));
      }


      const teamsQuery = query(collection(db, TEAMS_COLLECTION), ...teamsQueryConstraints, orderBy("name", "asc"));
      const querySnapshot = await getDocs(teamsQuery);
      const fetchedTeams = querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), shooterIds: (d.data().shooterIds || []) as string[] } as Team));
      setTeamsOfActiveClub(fetchedTeams);

    } catch (error) {
      console.error("VMP DEBUG: fetchTeamsForClubAndSeason - Error:", error);
      toast({ title: "Fehler Mannschaftsladung", description: (error as Error).message, variant: "destructive" });
      setTeamsOfActiveClub([]);
    } finally {
      setIsLoadingTeams(false);
    }
  }, [activeClubId, selectedSeasonId, selectedLeagueIdFilter, allSeasons, toast]);

  useEffect(() => {

    if (activeClubId && selectedSeasonId) { // Only fetch if both are set
      fetchTeamsForClubAndSeason();
      // Lade auch Schützen für Anzeige
      fetchShootersForDisplay();
    } else {
      setTeamsOfActiveClub([]); // Clear teams if no active club or season
      setAllClubShootersForDisplay([]);
    }
  }, [activeClubId, selectedSeasonId, selectedLeagueIdFilter, fetchTeamsForClubAndSeason]);

  const fetchShootersForDisplay = async () => {
    if (!activeClubId) return;
    
    try {
      const shootersQuery = query(
        collection(db, SHOOTERS_COLLECTION), 
        orderBy("name", "asc")
      );
      const shootersSnapshot = await getDocs(shootersQuery);
      
      const allShooters = shootersSnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        teamIds: (d.data().teamIds || []) as string[] 
      } as Shooter));
      
      const clubShooters = allShooters.filter(shooter => {
        const shooterClubId = shooter.clubId || shooter.rwkClubId || (shooter as any).kmClubId;
        return shooterClubId === activeClubId;
      });
      
      setAllClubShootersForDisplay(clubShooters);
    } catch (error) {
      console.error('Fehler beim Laden der Schützen für Anzeige:', error);
    }
  };

  // Check which teams have results
  const checkTeamsWithResults = useCallback(async () => {
    if (!selectedSeasonId || teamsOfActiveClub.length === 0) {
      setTeamsWithResults(new Set());
      return;
    }

    try {
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (!currentSeason?.competitionYear) return;

      const teamIds = teamsOfActiveClub.map(team => team.id).filter(Boolean);
      if (teamIds.length === 0) return;

      const scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('teamId', 'in', teamIds),
        where('competitionYear', '==', currentSeason.competitionYear)
      );
      
      const scoresSnapshot = await getDocs(scoresQuery);
      const teamsWithResultsSet = new Set<string>();
      
      scoresSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.teamId) {
          teamsWithResultsSet.add(data.teamId);
        }
      });
      
      setTeamsWithResults(teamsWithResultsSet);
    } catch (error) {
      console.error('Fehler beim Prüfen der Ergebnisse:', error);
    }
  }, [selectedSeasonId, teamsOfActiveClub, allSeasons]);

  useEffect(() => {
    checkTeamsWithResults();
  }, [checkTeamsWithResults]);


  // Effect 5: Fetch data for the dialog (shooters of the club, all teams for year for validation)
  const fetchDialogData = useCallback(async () => {
    const clubIdForDialog = activeClubId;
    const seasonForDialog = allSeasons.find(s => s.id === (currentTeam?.seasonId || selectedSeasonId));
    const compYearForDialog = currentTeam?.competitionYear || seasonForDialog?.competitionYear;



    if (!isFormOpen || !clubIdForDialog || compYearForDialog === undefined) {
      setAllClubShootersForDialog([]);
      setAllTeamsForValidation([]);
      setIsLoadingDialogData(false);

      return;
    }

    setIsLoadingDialogData(true);
    try {
      // Hole Vereinsname für Excel-Import-Abfrage
      const clubDoc = await getFirestoreDoc(doc(db, 'clubs', clubIdForDialog));
      const clubName = clubDoc.exists() ? clubDoc.data()?.name : null;
      
      // Lade alle RWK-Schützen und filtere client-seitig
      const shootersQuery = query(
        collection(db, SHOOTERS_COLLECTION), 
        orderBy("name", "asc")
      );
      
      const kmShootersQuery = null; // Nicht mehr nötig, da wir alle laden
      const teamsForYearQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", compYearForDialog));

      const promises = [
        getDocs(shootersQuery),
        getDocs(teamsForYearQuery)
      ];
      
      if (kmShootersQuery) {
        promises.splice(1, 0, getDocs(kmShootersQuery));
      }
      
      const results = await Promise.all(promises);
      const shootersSnapshot = results[0];
      const teamsForYearSnapshot = results[1];

      // Alle Schützen laden und nach Verein filtern
      const allShooters = shootersSnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        teamIds: (d.data().teamIds || []) as string[] 
      } as Shooter));
      
      // Filtere nach clubId/rwkClubId/kmClubId
      const clubShooters = allShooters.filter(shooter => {
        const shooterClubId = shooter.clubId || shooter.rwkClubId || (shooter as any).kmClubId;
        return shooterClubId === clubIdForDialog;
      });
      
      setAllClubShootersForDialog(clubShooters);


      const leagueMap = new Map(allLeagues.map(l => [l.id, l]));

      const teamsForValidationData: TeamValidationInfo[] = teamsForYearSnapshot.docs.map(d => {
        const teamData = d.data() as Team;
        const leagueInfo = teamData.leagueId ? leagueMap.get(teamData.leagueId) : null;
        return {
          ...teamData,
          id: d.id,
          shooterIds: teamData.shooterIds || [],
          leagueType: leagueInfo?.type,
          leagueCompetitionYear: leagueInfo?.competitionYear,
          currentShooterCount: (teamData.shooterIds || []).length,
        };
      });
      setAllTeamsForValidation(teamsForValidationData);


    } catch (error) {
      console.error("VMP DIALOG DEBUG: Error fetching dialog data:", error);
      toast({title: "Fehler Dialogdaten", description: (error as Error).message, variant: "destructive"});
    } finally {
      setIsLoadingDialogData(false);
    }
  }, [isFormOpen, activeClubId, selectedSeasonId, currentTeam, allSeasons, allLeagues, toast]);

  useEffect(() => {
    if (isFormOpen) {
      fetchDialogData();
    }
  }, [isFormOpen, fetchDialogData]);

  // Effect 6: Set initial shooter selection in dialog for edit mode
  useEffect(() => {
    if (isFormOpen && formMode === 'edit' && currentTeam?.id && !isLoadingDialogData) {
        const teamBeingEdited = teamsOfActiveClub.find(t => t.id === currentTeam.id);
        const persistedIds = teamBeingEdited?.shooterIds || currentTeam?.shooterIds || [];
        setPersistedShooterIdsForTeam(persistedIds);

        // Filter persisted IDs to only include those available in allClubShootersForDialog
        const validInitialShooterIds = persistedIds.filter(shooterId =>
            allClubShootersForDialog.some(shooter => shooter.id === shooterId)
        );
        setSelectedShooterIdsInForm(validInitialShooterIds);

    } else if (isFormOpen && formMode === 'new') {
        setSelectedShooterIdsInForm([]);
        setPersistedShooterIdsForTeam([]);

    }
  }, [isFormOpen, formMode, currentTeam?.id, currentTeam?.shooterIds, teamsOfActiveClub, isLoadingDialogData, allClubShootersForDialog]);


  const handleAddNewTeam = () => {
    if (!isVereinsvertreter) { toast({ title: "Keine Berechtigung", variant: "destructive" }); return; }
    if (!activeClubId || !selectedSeasonId) {
      toast({ title: "Verein/Saison fehlt", description: "Bitte zuerst Verein und Saison auswählen.", variant: "warning" }); return;
    }
    const currentSeasonData = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeasonData) {
      toast({ title: "Saisonfehler", description: "Ausgewählte Saisondaten nicht gefunden.", variant: "destructive" }); return;
    }
    setFormMode('new');
    setCurrentTeam({
      clubId: activeClubId,
      competitionYear: currentSeasonData.competitionYear,
      seasonId: selectedSeasonId,
      name: '',
      shooterIds: [],
      leagueId: null, // VV legt Team ohne direkte Liga-Zuweisung an
      captainName: '',
      captainEmail: '',
      captainPhone: '',
    });
    // Zurücksetzen der Mannschaftsstärke und des vorgeschlagenen Namens
    setTeamStrength("");
    setSuggestedTeamName("");
    setIsFormOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    if (!isVereinsvertreter) { toast({ title: "Keine Berechtigung", variant: "destructive" }); return; }
    if (team.clubId !== activeClubId) {
      toast({ title: "Nicht autorisiert", description: "Sie können nur Mannschaften Ihres aktuell ausgewählten Vereins bearbeiten.", variant: "destructive" }); return;
    }
    
    // Prüfung ob Team Ergebnisse hat und Benutzer kein Admin ist
    if (!isAdmin && teamsWithResults.has(team.id)) {
      toast({ 
        title: "Bearbeitung nicht möglich", 
        description: "Diese Mannschaft hat bereits Ergebnisse eingetragen. Nur der RWK-Leiter (Admin) kann Mannschaften mit Ergebnissen bearbeiten.", 
        variant: "destructive",
        duration: 8000
      }); 
      return; 
    }
    
    setFormMode('edit');
    setCurrentTeam(team);
    
    // Versuche, die Mannschaftsstärke aus dem Namen zu extrahieren (z.B. "Verein I" -> "I")
    const strengthMatch = team.name.match(/\s([IVX]+)$/);
    if (strengthMatch) {
      setTeamStrength(strengthMatch[1]);
    } else {
      setTeamStrength("");
    }
    
    setSuggestedTeamName(team.name);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (team: Team) => {
    if (!isVereinsvertreter) { toast({ title: "Keine Berechtigung", variant: "destructive" }); return; }
    if (team.clubId !== activeClubId) { toast({ title: "Nicht autorisiert", variant: "destructive" }); return; }
    
    // Prüfung ob Team Ergebnisse hat und Benutzer kein Admin ist
    if (!isAdmin && teamsWithResults.has(team.id)) {
      toast({ 
        title: "Löschen nicht möglich", 
        description: "Diese Mannschaft hat bereits Ergebnisse eingetragen. Nur der RWK-Leiter (Admin) kann Mannschaften mit Ergebnissen löschen.", 
        variant: "destructive",
        duration: 8000
      }); 
      return; 
    }
    
    setTeamToDelete(team);
    // setIsAlertOpen(true); // This should be handled by AlertDialogTrigger
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete || !teamToDelete.id || !userPermission?.uid || !isVereinsvertreter || teamToDelete.clubId !== activeClubId) {
        toast({ title: "Fehler beim Löschen", description:"Voraussetzungen nicht erfüllt.", variant: "destructive" });
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
      fetchTeamsForClubAndSeason(); // Refetch teams for the current view
    } catch (error: any) {
      console.error("VMP DEBUG: Error deleting team:", error);
      toast({ title: "Fehler beim Löschen", description: error.message || "Unbekannter Fehler", variant: "destructive" });
    } finally {
      setIsDeletingTeam(false);
      setTeamToDelete(null); 
      // setIsAlertOpen(false); // Should be handled by AlertDialog onOpenChange
    }
  };
  
  const handleSubmitTeamForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!isVereinsvertreter) { 
      toast({ title: "Keine Berechtigung", variant: "destructive" }); 
      setIsSubmittingForm(false); 
      return; 
    }

    if (!currentTeam || !currentTeam.name?.trim() || !activeClubId || !selectedSeasonId) {
      toast({ title: "Ungültige Eingabe", description: "Name der Mannschaft, Verein und Saison sind erforderlich.", variant: "destructive" });
      setIsSubmittingForm(false); 
      return;
    }

    const currentSeasonForSubmit = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeasonForSubmit || currentSeasonForSubmit.competitionYear === undefined) {
      console.warn("VMP SUBMIT VALIDATION FAILED: Season data not found or invalid for selectedSeasonId:", selectedSeasonId);
      toast({ title: "Ungültige Eingabe", description: "Saisondaten nicht gefunden oder ungültig.", variant: "destructive" });
      setIsSubmittingForm(false); return;
    }

    if (selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM) {
        toast({ title: "Zu viele Schützen", description: `Maximal ${MAX_SHOOTERS_PER_TEAM} Schützen ausgewählt. Bitte Auswahl korrigieren.`, variant: "destructive" });
        setIsSubmittingForm(false); return;
    }

    setIsSubmittingForm(true);

    const teamDataToSave: Omit<Team, 'id'> & { id?: string } = {
      name: currentTeam.name.trim(),
      clubId: activeClubId,
      seasonId: currentSeasonForSubmit.id,
      competitionYear: currentSeasonForSubmit.competitionYear,
      leagueId: formMode === 'new' ? null : (currentTeam.leagueId || null),
      leagueType: currentTeam.leagueType,
      shooterIds: selectedShooterIdsInForm,
      captainName: currentTeam.captainName?.trim() || '',
      captainEmail: currentTeam.captainEmail?.trim() || '',
      captainPhone: currentTeam.captainPhone?.trim() || '',
      outOfCompetition: currentTeam.outOfCompetition || false,
      outOfCompetitionReason: currentTeam.outOfCompetitionReason?.trim() || '',
    };
    
    const teamLeagueData = teamDataToSave.leagueId ? allLeagues.find(l => l.id === teamDataToSave.leagueId) : null;
    const categoryOfCurrentTeamForValidation = teamLeagueData?.type;
    
    if (teamLeagueData && categoryOfCurrentTeamForValidation && teamDataToSave.competitionYear !== undefined) {
        for (const shooterId of selectedShooterIdsInForm) {
          const isNewAssignmentToThisTeam = formMode === 'new' || !persistedShooterIdsForTeam.includes(shooterId);
          if (isNewAssignmentToThisTeam) { 
            const shooterInfo = allClubShootersForDialog.find(s => s.id === shooterId);
            if (!shooterInfo?.id) continue; 

            let conflictFound = false;
            for (const existingTeamId of (shooterInfo.teamIds || [])) {
              if (formMode === 'edit' && currentTeam.id && existingTeamId === currentTeam.id) continue; 
              
              const teamValidationEntry = allTeamsForValidation.find(t => t.id === existingTeamId);
              if (teamValidationEntry?.leagueCompetitionYear === teamDataToSave.competitionYear) { 
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
        toast({ title: "Doppelter Mannschaftsname", description: `Eine Mannschaft mit diesem Namen existiert bereits für diesen Verein und dieses Wettkampfjahr.`, variant: "destructive", duration: 8000});
        setIsSubmittingForm(false); 
        return; 
      }

      let teamIdForShooterUpdates: string = currentTeam.id || '';
      
      const originalShooterIds = formMode === 'edit' ? persistedShooterIdsForTeam : [];
      
      const shootersToAdd = selectedShooterIdsInForm.filter(id => !originalShooterIds.includes(id));
      const shootersToRemove = originalShooterIds.filter(id => !selectedShooterIdsInForm.includes(id) && allClubShootersForDialog.some(s => s.id === id));
      
      // SCHRITT 1: Team erstellen/aktualisieren
      if (formMode === 'new') {
        const newTeamRef = doc(collection(db, TEAMS_COLLECTION)); 
        teamIdForShooterUpdates = newTeamRef.id;
        const { id, ...dataForNewTeam } = teamDataToSave; 
        const teamData = {...dataForNewTeam, shooterIds: selectedShooterIdsInForm, leagueId: null, leagueType: currentTeam.leagueType || null };
        await setDoc(newTeamRef, teamData);
        
        // E-Mail-Benachrichtigung senden
        try {
          const clubName = allClubsGlobal.find(c => c.id === activeClubId)?.name || 'Unbekannter Verein';
          const seasonName = allSeasons.find(s => s.id === selectedSeasonId)?.name || 'Unbekannte Saison';
          
          const emailData = new FormData();
          emailData.append('subject', `🆕 Neue Mannschaft angelegt: ${dataForNewTeam.name}`);
          emailData.append('message', `Neue Mannschaft wurde angelegt:

Mannschaft: ${dataForNewTeam.name}
Verein: ${clubName}
Saison: ${seasonName}
Disziplin: ${dataForNewTeam.leagueType || 'Nicht angegeben'}
Schützen: ${selectedShooterIdsInForm.length}
Außer Konkurrenz: ${dataForNewTeam.outOfCompetition ? 'Ja' : 'Nein'}`);
          emailData.append('recipients', JSON.stringify([{name: 'RWK-Leiter', email: 'rwk-leiter-ksve@gmx.de'}]));
          
          await fetch('/api/send-email', {
            method: 'POST',
            body: emailData
          });
        } catch (emailError) {
          console.warn('E-Mail-Benachrichtigung fehlgeschlagen:', emailError);
        }
        
        toast({ 
          title: "✅ Mannschaft erfolgreich erstellt!", 
          description: `"${dataForNewTeam.name}" wurde angelegt und ist jetzt in der Liste sichtbar.`,
          duration: 5000
        });
      } else if (formMode === 'edit' && currentTeam.id) {
        teamIdForShooterUpdates = currentTeam.id;
        const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdForShooterUpdates);
        const { id, ...dataForTeamUpdate } = teamDataToSave; 
        await updateDoc(teamDocRef, {...dataForTeamUpdate, shooterIds: selectedShooterIdsInForm} as Partial<Team>);
        toast({ 
          title: "✅ Mannschaft erfolgreich gespeichert!", 
          description: `"${dataForTeamUpdate.name}" wurde aktualisiert und Änderungen sind sofort sichtbar.`,
          duration: 5000
        });
      } else {
        setIsSubmittingForm(false);
        throw new Error("Invalid form mode or missing team ID for edit.");
      }
      
      // SCHRITT 2: Schützen aktualisieren
      const validShootersToAdd = [];
      const validShootersToRemove = [];
      
      // Prüfe shootersToAdd
      for (const shooterId of shootersToAdd) {
        try {
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          const shooterDoc = await getFirestoreDoc(shooterDocRef);
          if (shooterDoc.exists()) {
            validShootersToAdd.push(shooterId);
          }
        } catch (error) {
          console.warn(`Error checking shooter ${shooterId}:`, error);
        }
      }
      
      // Prüfe shootersToRemove
      for (const shooterId of shootersToRemove) {
        try {
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          const shooterDoc = await getFirestoreDoc(shooterDocRef);
          if (shooterDoc.exists()) {
            validShootersToRemove.push(shooterId);
          }
        } catch (error) {
          console.warn(`Error checking shooter ${shooterId}:`, error);
        }
      }
      
      // SCHRITT 3: Schützen einzeln aktualisieren
      for (const shooterId of validShootersToAdd) {
        try {
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          await updateDoc(shooterDocRef, { teamIds: arrayUnion(teamIdForShooterUpdates) });
        } catch (error) {
          console.error(`Error adding team to shooter ${shooterId}:`, error);
        }
      }
      
      for (const shooterId of validShootersToRemove) {
        try {
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          await updateDoc(shooterDocRef, { teamIds: arrayRemove(teamIdForShooterUpdates) });
        } catch (error) {
          console.error(`Error removing team from shooter ${shooterId}:`, error);
        }
      }
      setIsFormOpen(false);
      setCurrentTeam(null);
      setSelectedShooterIdsInForm([]);
      setPersistedShooterIdsForTeam([]);
      fetchTeamsForClubAndSeason(); // Refetch teams
    } catch (error: any) {
      console.error("Error saving team or updating shooters:", error);
      const action = formMode === 'new' ? 'erstellen' : 'aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: error.message || "Unbekannter Fehler", variant: "destructive" });
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
  
  // Funktion zur Generierung von Mannschaftsnamen basierend auf Verein und Stärke
  const generateTeamName = useCallback((clubName: string | null, strength: string): string => {
    if (!clubName) return strength;
    
    // Wenn der Vereinsname ein Kürzel enthält (in Klammern), verwenden wir das
    const clubShortMatch = clubName.match(/\(([^)]+)\)/);
    const clubShort = clubShortMatch ? clubShortMatch[1] : clubName;
    
    // Wenn kein Kürzel gefunden wurde, verwenden wir den vollen Namen
    return `${clubShort} ${strength}`;
  }, []);
  
  // Handler für Änderungen an der Mannschaftsstärke
  const handleTeamStrengthChange = (value: string) => {
    setTeamStrength(value);
    
    // Automatisch den Mannschaftsnamen aktualisieren
    const newTeamName = generateTeamName(activeClubName, value);
    setSuggestedTeamName(newTeamName);
    
    // Aktualisiere das currentTeam-Objekt mit dem neuen Namen
    setCurrentTeam(prev => prev ? ({ ...prev, name: newTeamName }) : null);
  };

 const handleShooterSelectionChange = (shooterId: string, isChecked: boolean) => {
    if (!isVereinsvertreter || isSubmittingForm || isLoadingDialogData) return;

    const teamBeingEdited = currentTeam;
    if (!teamBeingEdited || teamBeingEdited.competitionYear === undefined) {
        console.warn("VMP DIALOG ShooterSelect: currentTeam or its competitionYear is undefined for validation.");
        return;
    }
    
    const teamLeagueData = teamBeingEdited.leagueId ? allLeagues.find(l => l.id === teamBeingEdited.leagueId) : null;
    const categoryOfCurrentTeam = getDisciplineCategory(teamLeagueData?.type);
    const currentTeamCompYearForValidation = teamBeingEdited.competitionYear;



    if (isChecked) { 
      if (selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM) {
          toast({ title: "Maximale Schützenzahl erreicht", description: `Eine Mannschaft darf maximal ${MAX_SHOOTERS_PER_TEAM} Schützen haben.`, variant: "warning" });
          return; 
      }
      // Disziplin-Konflikt-Prüfung
      if (categoryOfCurrentTeam && currentTeamCompYearForValidation !== undefined) {
          const shooterBeingChecked = allClubShootersForDialog.find(s => s.id === shooterId);
          if (shooterBeingChecked?.id && (formMode === 'new' || !persistedShooterIdsForTeam.includes(shooterId))) { 
              let conflictFound = false;
              (shooterBeingChecked.teamIds || []).forEach(assignedTeamId => {
                  if (formMode === 'edit' && teamBeingEdited?.id === assignedTeamId) return; 
                  
                  const assignedTeamInfo = allTeamsForValidation.find(t => t.id === assignedTeamId);
                  if (assignedTeamInfo?.leagueCompetitionYear === currentTeamCompYearForValidation) { 
                      const categoryOfAssignedTeam = getDisciplineCategory(assignedTeamInfo.leagueType);
                      if (categoryOfAssignedTeam && categoryOfAssignedTeam === categoryOfCurrentTeam) {
                          console.warn(`VMP DIALOG ShooterSelect: Conflict for ${shooterBeingChecked.name}. Already in ${assignedTeamInfo.name} (Category: ${categoryOfAssignedTeam}, Year: ${assignedTeamInfo.leagueCompetitionYear})`);
                          conflictFound = true;
                      }
                  }
              });
              if (conflictFound) {
                  toast({ title: "Regelverstoß", description: `${shooterBeingChecked.name} ist bereits in einem ${categoryOfCurrentTeam}-Team dieses Jahres (${currentTeamCompYearForValidation}) gemeldet.`, variant: "destructive", duration: 7000 });
                  return; 
              }
          }
      } else if (teamLeagueData && !categoryOfCurrentTeam){
          console.warn("VMP DIALOG ShooterSelect: Cannot perform discipline conflict check because category of current team's league type is unknown or team has no league.", teamLeagueData?.type);
      } else if (!teamLeagueData) {

      }
    } 
    setSelectedShooterIdsInForm(prevSelectedIds =>
      isChecked ? [...prevSelectedIds, shooterId] : prevSelectedIds.filter(id => id !== shooterId)
    );
  };

  const getLeagueNameDisplay = (leagueId?: string | null): string => {
    if (!leagueId) return 'Nicht zugewiesen';
    const league = allLeagues.find(l => l.id === leagueId);
    if (!league) return 'Unbek. Liga';
    // Entferne "Gruppe" und "(Gruppe)" aus dem Namen
    let cleanName = league.name
      .replace(/\s*\(Gruppe\)\s*/g, '')
      .replace(/\s+Gruppe\s*$/g, '')
      .trim();
    return cleanName;
  };
  
  const getLeagueTypeDisplay = (team: Team): string => {
    if (team.leagueId) {
      const league = allLeagues.find(l => l.id === team.leagueId);
      return league?.type || '-';
    }
    // Fallback: Verwende leagueType direkt vom Team
    return team.leagueType || '-';
  };

  const getClubName = (clubId?: string | null): string => {
    if (!clubId) return 'N/A';
    return allClubsGlobal.find(c => c.id === clubId)?.name || 'Unbek. Verein';
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

  if (loadingPermissions || isLoadingPageData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <h1 className="text-2xl font-semibold text-primary">Meine Mannschaften</h1>
           <p className="text-muted-foreground text-lg md:text-right">Verein: <Loader2 className="inline h-4 w-4 animate-spin" /> lädt...</p>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mr-3" />
          <p>Lade Vereinsdaten und Mannschaften...</p>
        </div>
      </div>
    );
  }

  if (contextPermissionError) {
    return (
        <div className="p-6">
            <Card className="border-destructive bg-destructive/5">
                <CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> {contextPermissionError}</CardTitle></CardHeader>
                <CardContent><p>Bitte kontaktieren Sie den Administrator.</p></CardContent>
            </Card>
        </div>
    );
  }

  if (!activeClubId) {
    return (
        <div className="space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-2xl font-semibold text-primary">Meine Mannschaften</h1>
          </div>
        <Card className="border-amber-500 bg-amber-50/50">
            <CardHeader><CardTitle className="text-amber-700 flex items-center gap-2"><AlertTriangle />Kein Verein zugewiesen</CardTitle></CardHeader>
            <CardContent>
                <p>Ihrem Konto ist kein Verein für die Mannschaftsverwaltung zugewiesen oder der Verein konnte nicht geladen werden. Bitte kontaktieren Sie den Administrator.</p>
                {userPermission && <p className="text-xs mt-2">DEBUG: UserPermission ClubId from Context: {userPermission.assignedClubId}</p>}
            </CardContent>
        </Card>
        </div>
     );
  }

  const currentSelectedSeasonName = allSeasons.find(s => s.id === selectedSeasonId)?.name;

  return (
    <MobilePageWrapper 
      title="Meine Mannschaften"
      description={isVereinsvertreter ? "Verwalten Sie hier die Mannschaften Ihres Vereins." : "Übersicht der Mannschaften Ihres Vereins."}
    >
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <BackButton className="mr-2" fallbackHref="/verein/dashboard" />
          <h1 className="text-2xl font-semibold text-primary">Meine Mannschaften</h1>
          <HelpTooltip 
            text="Hier können Sie Mannschaften für Ihren Verein anlegen und verwalten." 
            side="right" 
            className="ml-2"
          />
        </div>
        {activeClubName && <p className="text-muted-foreground text-lg md:text-right">Verein: <span className="font-semibold text-primary">{activeClubName}</span></p>}
      </div>

      <div className="flex flex-col sm:flex-row items-end gap-3 mb-4 p-4 border rounded-md shadow-sm bg-card">
        <div className="flex-grow space-y-1.5 w-full sm:w-auto">
          <div className="flex items-center">
            <Label htmlFor="vvm-saison-select">Saison auswählen</Label>
            <HelpTooltip 
              text="Wählen Sie die Saison aus, für die Sie Mannschaften anzeigen oder anlegen möchten." 
              className="ml-2"
            />
          </div>
          <Select
            value={selectedSeasonId}
            onValueChange={(value) => { setSelectedSeasonId(value); setSelectedLeagueIdFilter(""); }}
            disabled={allSeasons.length === 0}
          >
            <SelectTrigger id="vvm-saison-select" className="w-full">
                <SelectValue placeholder={allSeasons.length === 0 ? "Keine Saisons" : "Saison wählen"} />
            </SelectTrigger>
            <SelectContent>
                {allSeasons
                    .filter(s => s && typeof s.id === 'string' && s.id.trim() !== "")
                    .map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                {allSeasons.filter(s => s && typeof s.id === 'string' && s.id.trim() !== "").length === 0 &&
                    <SelectItem value="NO_SEASONS_VMP_PLACEHOLDER" disabled>Keine Saisons verfügbar</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-grow space-y-1.5 w-full sm:w-auto">
          <div className="flex items-center">
            <Label htmlFor="vvm-liga-filter">Nach Liga filtern (Optional)</Label>
            <HelpTooltip 
              text="Filtern Sie optional nach einer bestimmten Liga." 
              className="ml-2"
            />
          </div>
           <Select
            value={selectedLeagueIdFilter}
            onValueChange={(value) => {
              // Wenn "Alle Ligen anzeigen" ausgewählt wurde, setze den Filter zurück
              setSelectedLeagueIdFilter(value === "ALL_LEAGUES" ? "" : value);
            }}
            disabled={!selectedSeasonId || isLoadingTeams || availableLeaguesForFilter.length === 0}
           >
            <SelectTrigger id="vvm-liga-filter" className="w-full">
                <SelectValue placeholder={!selectedSeasonId ? "Saison wählen" : (isLoadingTeams ? "Lade Ligen..." : (availableLeaguesForFilter.length === 0 ? "Keine Ligen für Verein/Saison" : "Alle Ligen des Vereins"))} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL_LEAGUES">Alle Ligen anzeigen</SelectItem>

                {availableLeaguesForFilter
                    .filter(l => l && typeof l.id === 'string' && l.id.trim() !== "") // Strict filter
                    .map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)
                }
                {availableLeaguesForFilter.filter(l => l && typeof l.id === 'string' && l.id.trim() !== "").length === 0 && selectedSeasonId &&
                    <SelectItem value="NO_LEAGUES_FILTER_VMP" disabled>Keine Ligen für diese Auswahl</SelectItem>
                }
            </SelectContent>
          </Select>
        </div>
         {isVereinsvertreter && (
            <div className="flex flex-col gap-2">
              <Button
                  onClick={handleAddNewTeam}
                  disabled={!selectedSeasonId || isLoadingTeams || isSubmittingForm || !activeClubId}
                  className="w-full sm:w-auto whitespace-nowrap bg-green-600 hover:bg-green-700 text-white font-medium"
                  size="default"
              >
                  <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft anlegen
              </Button>
              {(!selectedSeasonId || !activeClubId) && (
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                  {!activeClubId ? 'Verein fehlt' : 'Saison wählen'}
                </p>
              )}
            </div>
        )}
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>
                Mannschaften
                {currentSelectedSeasonName && ` (${currentSelectedSeasonName})`}
                {selectedLeagueIdFilter && ` / Liga: ${allLeagues.find(l => l.id === selectedLeagueIdFilter)?.name || 'Unbekannt'}`}
              </CardTitle>
              <CardDescription>
                {isVereinsvertreter
                  ? "Verwalten Sie hier die Mannschaften Ihres Vereins."
                  : "Übersicht der Mannschaften Ihres Vereins."
                }
                {!selectedSeasonId && " Bitte wählen Sie zuerst eine Saison."}
              </CardDescription>
            </div>
            {isVereinsvertreter && selectedSeasonId && activeClubId && (
              <Button
                  onClick={handleAddNewTeam}
                  disabled={isLoadingTeams || isSubmittingForm}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium whitespace-nowrap"
                  size="default"
              >
                  <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTeams && activeClubId && selectedSeasonId && <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Lade Mannschaften...</p></div>}
          {!isLoadingTeams && teamsOfActiveClub.length === 0 && activeClubId && selectedSeasonId && (
            <div className="p-4 text-center text-muted-foreground bg-secondary/30 rounded-md">
              <AlertTriangle className="mx-auto h-8 w-8 text-primary/70 mb-2" />
              <p>{`Keine Mannschaften für die aktuelle Auswahl gefunden.`}</p>
              {isVereinsvertreter && <p className="text-sm mt-1">Klicken Sie auf "Neue Mannschaft", um eine anzulegen.</p>}
            </div>
          )}
          {!isLoadingTeams && teamsOfActiveClub.length > 0 && activeClubId && selectedSeasonId && (
            <Table><TableHeader><TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Liga</TableHead>
                <TableHead className="text-center">Typ</TableHead>
                <TableHead className="text-center">AK</TableHead>
                <TableHead className="text-center hidden md:table-cell">Jahr</TableHead>
                <TableHead className="text-center">Schützen</TableHead>
                {isVereinsvertreter && <TableHead className="text-right">Aktionen</TableHead>}
            </TableRow></TableHeader>
            <TableBody>
                {teamsOfActiveClub.map((team) => (
                  <React.Fragment key={team.id}>
                    <TableRow>
                      <TableCell label="Name" className="font-medium">
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
                        </div>
                      </TableCell>
                    <TableCell label="Liga" hideOnMobile>{getLeagueNameDisplay(team.leagueId)}</TableCell>
                    <TableCell label="Typ" className="text-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                        {getLeagueTypeDisplay(team)}
                      </span>
                    </TableCell>
                    <TableCell label="AK" className="text-center">
                      {team.outOfCompetition ? (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                          AK
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell label="Jahr" hideOnMobile>{team.competitionYear}</TableCell>
                    <TableCell label="Schützen" className="text-center">
                      {(() => {
                        const availableShooters = (team.shooterIds || []).filter(shooterId => 
                          allClubShootersForDisplay.some(shooter => shooter.id === shooterId)
                        ).length;
                        return `${availableShooters} / ${MAX_SHOOTERS_PER_TEAM}`;
                      })()}
                    </TableCell>
                    {isVereinsvertreter && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditTeam(team)} 
                            disabled={isSubmittingForm || isDeletingTeam || (!isAdmin && teamsWithResults.has(team.id))}
                            className={`h-8 w-8 hover:bg-primary/10 ${
                              !isAdmin && teamsWithResults.has(team.id) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title={!isAdmin && teamsWithResults.has(team.id) 
                              ? "Bearbeitung gesperrt - Team hat Ergebnisse (nur Admin)" 
                              : "Mannschaft bearbeiten"
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog open={!!teamToDelete && teamToDelete.id === team.id} onOpenChange={(open) => { if (!open) setTeamToDelete(null);}}>
                            <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={`h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10 ${
                                    !isAdmin && teamsWithResults.has(team.id) ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  onClick={() => handleDeleteConfirmation(team)} 
                                  disabled={isSubmittingForm || isDeletingTeam || (!isAdmin && teamsWithResults.has(team.id))}
                                  title={!isAdmin && teamsWithResults.has(team.id) 
                                    ? "Löschen gesperrt - Team hat Ergebnisse (nur Admin)" 
                                    : "Mannschaft löschen"
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mannschaft löschen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Möchten Sie "{teamToDelete?.name}" wirklich löschen? Dies entfernt auch die Zuordnung der Schützen zu dieser Mannschaft.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setTeamToDelete(null)}>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDeleteTeam} 
                                  disabled={isDeletingTeam} 
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  {isDeletingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                    </TableRow>
                    {expandedTeams.has(team.id) && (
                      <TableRow>
                        <TableCell colSpan={isVereinsvertreter ? 7 : 6} className="bg-muted/30 p-4">
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
            </TableBody></Table>
          )}
           {!activeClubId && !loadingPermissions && !contextPermissionError &&(
                <div className="p-4 text-center text-muted-foreground bg-amber-50/50 rounded-md border border-amber-300">
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-600 mb-2" />
                    <p>Ihrem Konto ist kein Verein für die Mannschaftsverwaltung zugewiesen oder der Verein konnte nicht geladen werden. Bitte kontaktieren Sie den Administrator.</p>
                </div>
            )}
           {!selectedSeasonId && activeClubId && !loadingPermissions && !contextPermissionError &&(
                <div className="p-4 text-center text-muted-foreground bg-blue-50/50 rounded-md border border-blue-300">
                    <InfoIcon className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                    <p>Bitte wählen Sie eine Saison aus, um Mannschaften anzuzeigen oder anzulegen.</p>
                </div>
            )}
        </CardContent>
      </Card>

      {isFormOpen && currentTeam && activeClubId && isVereinsvertreter && (
        <GlobalResponsiveDialog 
          open={isFormOpen} 
          onOpenChange={(open) => { 
            if (!open) {
              setCurrentTeam(null); 
              setSelectedShooterIdsInForm([]); 
              setPersistedShooterIdsForTeam([]); 
              setAllClubShootersForDialog([]);
              setTeamStrength("");
              setSuggestedTeamName("");
              setShooterSearchQuery("");
            } 
            setIsFormOpen(open); 
          }}
          title={formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}
          description={`Für Verein: ${activeClubName || 'Unbekannt'}. Saison: ${allSeasons.find(s => s.id === (formMode === 'new' ? selectedSeasonId : currentTeam?.seasonId ))?.name || 'Saison wählen'}`}
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { 
                  setIsFormOpen(false); 
                  setCurrentTeam(null); 
                  setSelectedShooterIdsInForm([]); 
                  setPersistedShooterIdsForTeam([]); 
                  setAllClubShootersForDialog([]); 
                }}
                className="flex-1 sm:flex-none"
              >
                Abbrechen
              </Button>
              {isVereinsvertreter && (
                <Button 
                  type="submit" 
                  disabled={isSubmittingForm || isLoadingDialogData}
                  className="flex-1 sm:flex-none"
                  form="team-form"
                >
                  {(isSubmittingForm || isLoadingDialogData) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                  Speichern
                </Button>
              )}
            </div>
          }
        >
          <form id="team-form" onSubmit={handleSubmitTeamForm}>
            <div className="space-y-4">
                <Alert variant="default" className="mb-4 bg-blue-50 border-blue-300 text-blue-700">
                    <InfoIcon className="h-4 w-4 text-blue-600" />
                    <UiAlertDescription>
                        Hinweis zur Mannschaftsstärke: Bitte wählen Sie die Stärke Ihrer Mannschaft aus (I für die stärkste, II für die zweitstärkste usw.). Der Mannschaftsname wird automatisch vorgeschlagen. Die Ligazuweisung erfolgt durch den Rundenwettkampfleiter.
                    </UiAlertDescription>
                </Alert>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center">
                          <Label htmlFor="vvm-teamStrengthDialog">Mannschaftsstärke</Label>
                          <HelpTooltip 
                            text="Wählen Sie die Stärke Ihrer Mannschaft (I für die stärkste, II für die zweitstärkste usw.)." 
                            className="ml-2"
                          />
                        </div>
                        <Select
                          value={teamStrength}
                          onValueChange={handleTeamStrengthChange}
                        >
                          <SelectTrigger id="vvm-teamStrengthDialog" className="w-full">
                            <SelectValue placeholder="Mannschaftsstärke wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="I">I (Erste Mannschaft)</SelectItem>
                            <SelectItem value="II">II (Zweite Mannschaft)</SelectItem>
                            <SelectItem value="III">III (Dritte Mannschaft)</SelectItem>
                            <SelectItem value="IV">IV (Vierte Mannschaft)</SelectItem>
                            <SelectItem value="V">V (Fünfte Mannschaft)</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center">
                          <Label htmlFor="vvm-teamDisciplineDialog">Disziplin</Label>
                          <HelpTooltip 
                            text="Wählen Sie die Disziplin, in der diese Mannschaft antreten soll." 
                            className="ml-2"
                          />
                        </div>
                        <Select
                          value={currentTeam?.leagueType || ""}
                          onValueChange={(value) => setCurrentTeam(prev => prev ? {...prev, leagueType: value as FirestoreLeagueSpecificDiscipline} : null)}
                          required
                        >
                          <SelectTrigger id="vvm-teamDisciplineDialog" className="w-full">
                            <SelectValue placeholder="Disziplin wählen" />
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
                        <div className="flex items-center">
                          <Label htmlFor="vvm-teamOutOfCompetitionDialog">Außer Konkurrenz</Label>
                          <HelpTooltip 
                            text="Mannschaften außer Konkurrenz nehmen am Wettkampf teil, werden aber nicht in der Tabelle gewertet." 
                            className="ml-2"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="vvm-teamOutOfCompetitionDialog"
                            checked={currentTeam?.outOfCompetition || false}
                            onCheckedChange={(checked) => setCurrentTeam(prev => prev ? {...prev, outOfCompetition: !!checked} : null)}
                          />
                          <Label htmlFor="vvm-teamOutOfCompetitionDialog" className="text-sm font-normal">
                            Diese Mannschaft außer Konkurrenz melden
                          </Label>
                        </div>
                        {currentTeam?.outOfCompetition && (
                          <div className="mt-2">
                            <Label htmlFor="vvm-teamOutOfCompetitionReasonDialog" className="text-sm">Grund (optional)</Label>
                            <Input
                              id="vvm-teamOutOfCompetitionReasonDialog"
                              value={currentTeam?.outOfCompetitionReason || ''}
                              onChange={(e) => setCurrentTeam(prev => prev ? {...prev, outOfCompetitionReason: e.target.value} : null)}
                              placeholder="z.B. Nachwuchsmannschaft, Gastmannschaft"
                              className="mt-1"
                            />
                          </div>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="vvm-teamClubDialog">Verein (Zugewiesen)</Label>
                        <Input id="vvm-teamClubDialog" value={activeClubName || ''} disabled className="bg-muted/50" />
                    </div>
                </div>
                
                <div className="space-y-1.5 mt-3">
                    <div className="flex items-center">
                      <Label htmlFor="vvm-teamNameDialog">Name der Mannschaft</Label>
                      <HelpTooltip 
                        text="Der Name wird automatisch aus dem Vereinsnamen und der Mannschaftsstärke generiert, kann aber angepasst werden." 
                        className="ml-2"
                      />
                    </div>
                    <Input 
                      id="vvm-teamNameDialog" 
                      value={currentTeam?.name || ''} 
                      onChange={(e) => handleFormInputChange('name', e.target.value)} 
                      placeholder={suggestedTeamName || "Wird automatisch generiert nach Auswahl der Mannschaftsstärke"}
                      required 
                    />
                    {suggestedTeamName && formMode === 'new' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Vorschlag basierend auf Verein und Mannschaftsstärke. Sie können den Namen bei Bedarf anpassen.
                      </p>
                    )}
                </div>
                
                <div className="space-y-1.5 mt-3">
                    <Label htmlFor="vvm-teamLeagueDialogDisplay">Zugewiesene Liga (durch Admin)</Label>
                    <Input 
                        id="vvm-teamLeagueDialogDisplay" 
                        value={getLeagueNameDisplay(currentTeam.leagueId)} 
                        disabled 
                        className="bg-muted/50" 
                    />
                </div>

                <div className="pt-4 border-t mt-4">
                    <Label className="text-md font-medium text-accent">Kontaktdaten Mannschaftsführer (Optional)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-2">
                        <div className="space-y-1.5"><Label htmlFor="vvm-captainNameDialog">Name MF</Label><Input id="vvm-captainNameDialog" value={currentTeam.captainName || ''} onChange={(e) => handleFormInputChange('captainName', e.target.value)} /></div>
                        <div className="space-y-1.5"><Label htmlFor="vvm-captainEmailDialog">E-Mail MF</Label><Input id="vvm-captainEmailDialog" type="email" value={currentTeam.captainEmail || ''} onChange={(e) => handleFormInputChange('captainEmail', e.target.value)} /></div>
                        <div className="space-y-1.5"><Label htmlFor="vvm-captainPhoneDialog">Telefon MF</Label><Input id="vvm-captainPhoneDialog" type="tel" value={currentTeam.captainPhone || ''} onChange={(e) => handleFormInputChange('captainPhone', e.target.value)} /></div>
                    </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <Label className="text-base font-medium">Schützen für diese Mannschaft auswählen</Label>
                    <span className="text-sm text-muted-foreground">{selectedShooterIdsInForm.length} / {MAX_SHOOTERS_PER_TEAM} ausgewählt</span>
                  </div>
                  
                  {/* Anzeige der bereits ausgewählten Schützen */}
                  {selectedShooterIdsInForm.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Bereits ausgewählte Schützen ({selectedShooterIdsInForm.length}):</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedShooterIdsInForm.map(shooterId => {
                          const shooter = allClubShootersForDialog.find(s => s.id === shooterId);
                          if (!shooter) return null;
                          return (
                            <div key={shooterId} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              <span>{shooter.firstName && shooter.lastName ? `${shooter.firstName} ${shooter.lastName}` : shooter.name}</span>
                              <button
                                type="button"
                                onClick={() => handleShooterSelectionChange(shooterId, false)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                                disabled={isSubmittingForm || isLoadingDialogData}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-2">
                    <Input
                      type="search"
                      placeholder="Schützen suchen..."
                      value={shooterSearchQuery}
                      onChange={(e) => {
                        setShooterSearchQuery(e.target.value);
                        // Debounce: Warte 300ms bevor Filter angewendet wird
                        clearTimeout(window.shooterSearchTimeout);
                        window.shooterSearchTimeout = setTimeout(() => {
                          // Filter wird nur alle 300ms angewendet, nicht bei jedem Tastendruck
                        }, 300);
                      }}
                      className="w-full"
                    />
                  </div>
                  
                  {isLoadingDialogData ? (
                     <div className="flex items-center justify-center p-4 h-40 border rounded-md bg-muted/30">
                       <Loader2 className="h-6 w-6 animate-spin text-primary" />
                       <p className="ml-2">Lade Schützen...</p>
                     </div>
                  ) : allClubShootersForDialog.length > 0 ? (
                      <ScrollArea className="h-40 rounded-md border p-3 bg-background">
                        <div className="space-y-1">
                          {allClubShootersForDialog
                            .filter(shooter => {
                              if (!shooter || !shooter.name) return false;
                              if (!shooterSearchQuery.trim()) return true;
                              return shooter.name.toLowerCase().includes(shooterSearchQuery.toLowerCase());
                            })
                            .map(shooter => {
                              if (!shooter || !shooter.id) return null; 
                              const isSelected = selectedShooterIdsInForm.includes(shooter.id);
                              
                              let isDisabledByMax = !isSelected && selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM;
                              let isDisabledByDisciplineConflict = false;
                              let disableReason = "";
                              
                              const teamBeingEdited = currentTeam;
                              const teamLeagueData = teamBeingEdited?.leagueId ? allLeagues.find(l => l.id === teamBeingEdited.leagueId) : null;
                              const categoryOfCurrentTeam = getDisciplineCategory(teamLeagueData?.type);
                              const currentTeamCompYearForValidation = teamBeingEdited?.competitionYear || allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear;

                              if (!isSelected && teamLeagueData && categoryOfCurrentTeam && currentTeamCompYearForValidation !== undefined) {
                                if (formMode === 'new' || !persistedShooterIdsForTeam.includes(shooter.id)) { 
                                  let assignedToSameCategoryInYear = false;
                                  (shooter.teamIds || []).forEach(assignedTeamId => {
                                    if (formMode === 'edit' && teamBeingEdited?.id === assignedTeamId) return; 
                                    
                                    const assignedTeamInfo = allTeamsForValidation.find(t => t.id === assignedTeamId);
                                    if (assignedTeamInfo?.leagueCompetitionYear === currentTeamCompYearForValidation) { 
                                      const categoryOfAssignedTeam = getDisciplineCategory(assignedTeamInfo.leagueType);
                                      if (categoryOfAssignedTeam && categoryOfAssignedTeam === categoryOfCurrentTeam) assignedToSameCategoryInYear = true;
                                    }
                                  });
                                  if (assignedToSameCategoryInYear) {
                                    isDisabledByDisciplineConflict = true;
                                    disableReason = `(bereits in ${categoryOfCurrentTeam}-Team ${currentTeamCompYearForValidation})`;
                                  }
                                }
                              }
                              if (isDisabledByMax && !isDisabledByDisciplineConflict) disableReason = "(Max. Schützen erreicht)";
                              
                              const finalIsDisabled = isDisabledByMax || isLoadingDialogData || isDisabledByDisciplineConflict;
                              return (
                                <div key={shooter.id} className="flex items-center space-x-3 p-1.5 hover:bg-muted/50 rounded-md">
                                  <Checkbox
                                    id={`vvm-team-shooter-assign-${shooter.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checkedState) => handleShooterSelectionChange(shooter.id, !!checkedState)}
                                    disabled={finalIsDisabled}
                                  />
                                  <Label htmlFor={`vvm-team-shooter-assign-${shooter.id}`} className={`font-normal cursor-pointer flex-grow ${finalIsDisabled ? 'opacity-50 cursor-not-allowed' : '' } ${isSelected ? 'text-primary font-medium' : ''}`}>
                                    <div>
                                      {shooter.title && <span className="text-xs text-gray-500">{shooter.title} </span>}
                                      <span>{(shooter.firstName || '') + ' ' + (shooter.lastName || shooter.name || '')}</span>
                                      {isSelected && ' ✓'}
                                    </div>
                                    <span className='text-xs text-muted-foreground block'>(Schnitt Vorjahr: folgt)</span>
                                    {finalIsDisabled && disableReason && <span className="text-xs text-destructive ml-1">{disableReason}</span>}
                                  </Label>
                                </div>
                              );
                            })
                          }
                        </div>
                      </ScrollArea>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 h-40 border rounded-md flex items-center justify-center bg-muted/30">
                      <p>
                        {shooterSearchQuery.trim() && allClubShootersForDialog.length > 0 
                          ? `Keine Schützen gefunden, die "${shooterSearchQuery}" enthalten.` 
                          : (activeClubId) 
                            ? `Keine Schützen für '${activeClubName || 'diesen Verein'}' verfügbar oder alle für diese Kriterien bereits zugewiesen/ungeeignet.` 
                            : 'Verein nicht aktiv.'
                        }
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-3">
                    <div className="space-y-1.5"> 
                        <Label htmlFor="vvm-teamSeasonDialogDisplay">Saison (Zugewiesen)</Label>
                        <Input id="vvm-teamSeasonDialogDisplay" value={allSeasons.find(s => s.id === (formMode === 'new' ? selectedSeasonId : currentTeam?.seasonId))?.name || ''} disabled className="bg-muted/50" />
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="vvm-teamCompYearDialog">Wettkampfjahr</Label>
                        <Input id="vvm-teamCompYearDialog" value={currentTeam?.competitionYear?.toString() || allSeasons.find(s => s.id === selectedSeasonId)?.competitionYear?.toString() || ''} disabled className="bg-muted/50" />
                    </div>
                </div>
            </div>
          </form>
        </GlobalResponsiveDialog>
      )}
    </div>
    </MobilePageWrapper>
  );
}

