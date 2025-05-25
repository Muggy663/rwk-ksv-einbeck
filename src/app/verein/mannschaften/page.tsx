
// /app/verein/mannschaften/page.tsx
"use client";
import React, { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Users as TeamsIcon, Loader2, AlertTriangle, InfoIcon } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/help-tooltip';
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
  const {
    userPermission,
    loadingPermissions,
    permissionError: contextPermissionError,
    assignedClubId // Single assigned club ID from context
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

  const isVereinsvertreter = userPermission?.role === 'vereinsvertreter';

  // Effect 1: Set activeClubId and activeClubName based on userPermission from context
  useEffect(() => {
    console.log("VMP DEBUG: Effect to set activeClubId. loadingPermissions:", loadingPermissions, "assignedClubId from context:", assignedClubId);
    if (!loadingPermissions) {
      if (assignedClubId && typeof assignedClubId === 'string' && assignedClubId.trim() !== '') {
        setActiveClubId(assignedClubId);
        const clubInfo = allClubsGlobal.find(c => c.id === assignedClubId);
        if (clubInfo) {
          setActiveClubName(clubInfo.name);
          console.log("VMP DEBUG: activeClubId SET to:", assignedClubId, "Name:", clubInfo.name);
        } else if (allClubsGlobal.length > 0) { // Attempt to find it if allClubsGlobal is already populated
          console.warn("VMP DEBUG: Club info for assignedClubId not found in allClubsGlobal. This might be a timing issue or invalid ID.");
          // Optionally, fetch if not found, but allClubsGlobal should be loaded by fetchInitialData
        }
      } else {
        console.warn("VMP DEBUG: No valid assignedClubId from context. Setting activeClub to null.", { assignedClubId });
        setActiveClubId(null);
        setActiveClubName(null);
      }
    }
  }, [assignedClubId, loadingPermissions, allClubsGlobal]);


  // Effect 2: Fetch initial global data (seasons, all leagues, all clubs)
  const fetchInitialData = useCallback(async () => {
    console.log("VMP DEBUG: fetchInitialData triggered.");
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
      console.log("VMP DEBUG: fetchInitialData - Running seasons fetched:", fetchedSeasons.length);

      const fetchedLeaguesRaw = leaguesSnapshot.docs.map(lDoc => ({ id: lDoc.id, ...lDoc.data() } as League));
      const fetchedLeagues = fetchedLeaguesRaw.filter(l => l.id && typeof l.id === 'string' && l.id.trim() !== "");
      setAllLeagues(fetchedLeagues);
      console.log("VMP DEBUG: fetchInitialData - All leagues fetched:", fetchedLeagues.length);
      
      const fetchedClubsRaw = clubsSnapshot.docs.map(cDoc => ({ id: cDoc.id, ...cDoc.data() } as Club));
      const fetchedClubs = fetchedClubsRaw.filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== "");
      setAllClubsGlobal(fetchedClubs);
      console.log("VMP DEBUG: fetchInitialData - All global clubs fetched:", fetchedClubs.length);

    } catch (error) {
      console.error("VMP DEBUG: fetchInitialData - Error fetching initial page data:", error);
      toast({ title: "Fehler Basisdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingPageData(false);
      console.log("VMP DEBUG: fetchInitialData finished. isLoadingPageData set to false");
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);


  // Effect 3: Populate availableLeaguesForFilter dropdown based on selectedSeason and teams of active club
  const calculatedAvailableLeaguesForFilter = useMemo(() => {
    console.log("VMP DEBUG: Calculating availableLeaguesForFilter. selectedSeasonId:", selectedSeasonId, "activeClubId:", activeClubId, "allLeagues len:", allLeagues.length, "teamsOfActiveClub len:", teamsOfActiveClub.length);
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
    console.log("VMP DEBUG: availableLeaguesForFilter computed:", filtered.map(l => ({id: l.id, name: l.name})));
    return filtered.sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [selectedSeasonId, activeClubId, allLeagues, allSeasons, teamsOfActiveClub]);

  useEffect(() => {
    setAvailableLeaguesForFilter(calculatedAvailableLeaguesForFilter);
  }, [calculatedAvailableLeaguesForFilter]);


  // Effect 4: Fetch teams for the active club and selected season
  const fetchTeamsForClubAndSeason = useCallback(async () => {
    if (!activeClubId || !selectedSeasonId) {
      setTeamsOfActiveClub([]);
      console.log("VMP DEBUG: fetchTeamsForClubAndSeason - No activeClubId or selectedSeasonId. activeClubId:", activeClubId, "selectedSeasonId:", selectedSeasonId);
      return;
    }
    console.log("VMP DEBUG: fetchTeamsForClubAndSeason - Fetching for activeClubId:", activeClubId, "selectedSeasonId:", selectedSeasonId, "leagueFilter:", selectedLeagueIdFilter);
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
      console.log(`VMP DEBUG: fetchTeamsForClubAndSeason - Fetched ${fetchedTeams.length} teams.`);
    } catch (error) {
      console.error("VMP DEBUG: fetchTeamsForClubAndSeason - Error:", error);
      toast({ title: "Fehler Mannschaftsladung", description: (error as Error).message, variant: "destructive" });
      setTeamsOfActiveClub([]);
    } finally {
      setIsLoadingTeams(false);
    }
  }, [activeClubId, selectedSeasonId, selectedLeagueIdFilter, allSeasons, toast]);

  useEffect(() => {
    console.log("VMP DEBUG: Effect for fetchTeamsForClubAndSeason. activeClubId:", activeClubId, "selectedSeasonId:", selectedSeasonId);
    if (activeClubId && selectedSeasonId) { // Only fetch if both are set
      fetchTeamsForClubAndSeason();
    } else {
      setTeamsOfActiveClub([]); // Clear teams if no active club or season
    }
  }, [activeClubId, selectedSeasonId, selectedLeagueIdFilter, fetchTeamsForClubAndSeason]);


  // Effect 5: Fetch data for the dialog (shooters of the club, all teams for year for validation)
  const fetchDialogData = useCallback(async () => {
    const clubIdForDialog = activeClubId;
    const seasonForDialog = allSeasons.find(s => s.id === (currentTeam?.seasonId || selectedSeasonId));
    const compYearForDialog = currentTeam?.competitionYear || seasonForDialog?.competitionYear;

    console.log("VMP DIALOG DEBUG: fetchDialogData triggered. clubIdForDialog:", clubIdForDialog, "compYearForDialog:", compYearForDialog, "isFormOpen:", isFormOpen);

    if (!isFormOpen || !clubIdForDialog || compYearForDialog === undefined) {
      setAllClubShootersForDialog([]);
      setAllTeamsForValidation([]);
      setIsLoadingDialogData(false);
      console.log("VMP DIALOG DEBUG: Pre-conditions for fetching dialog data not met.");
      return;
    }

    setIsLoadingDialogData(true);
    try {
      const shootersQuery = query(collection(db, SHOOTERS_COLLECTION), where("clubId", "==", clubIdForDialog), orderBy("name", "asc"));
      const teamsForYearQuery = query(collection(db, TEAMS_COLLECTION), where("competitionYear", "==", compYearForDialog));

      const [shootersSnapshot, teamsForYearSnapshot] = await Promise.all([
        getDocs(shootersQuery),
        getDocs(teamsForYearQuery),
      ]);

      const fetchedShooters = shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), teamIds: (d.data().teamIds || []) as string[] } as Shooter));
      setAllClubShootersForDialog(fetchedShooters);
      console.log("VMP DIALOG DEBUG: Fetched shooters for club:", clubIdForDialog, fetchedShooters.length);

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
      console.log("VMP DIALOG DEBUG: Fetched teams for year validation:", compYearForDialog, teamsForValidationData.length);

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
        console.log("VMP DIALOG (EDIT) DEBUG: Persisted IDs:", persistedIds, "Available Club Shooters:", allClubShootersForDialog.map(s=>s.id) ,"Valid Initial For Form:", validInitialShooterIds);
    } else if (isFormOpen && formMode === 'new') {
        setSelectedShooterIdsInForm([]);
        setPersistedShooterIdsForTeam([]);
         console.log("VMP DIALOG (NEW) DEBUG: Initializing selectedShooterIdsInForm as empty.");
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
    if (!isVereinsvertreter) { toast({ title: "Keine Berechtigung", variant: "destructive" }); setIsSubmittingForm(false); return; }

    console.log("VMP SUBMIT: Form submitted. currentTeam:", JSON.stringify(currentTeam), "activeClubId:", activeClubId, "selectedSeasonId:", selectedSeasonId);

    if (!currentTeam || !currentTeam.name?.trim() || !activeClubId || !selectedSeasonId) {
      console.warn("VMP SUBMIT VALIDATION FAILED: Missing required fields.", { currentTeam, activeClubId, selectedSeasonId });
      toast({ title: "Ungültige Eingabe", description: "Name der Mannschaft, Verein und Saison sind erforderlich.", variant: "destructive" });
      setIsSubmittingForm(false); return;
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
      shooterIds: selectedShooterIdsInForm,
      captainName: currentTeam.captainName?.trim() || '',
      captainEmail: currentTeam.captainEmail?.trim() || '',
      captainPhone: currentTeam.captainPhone?.trim() || '',
    };
    
    const teamLeagueData = teamDataToSave.leagueId ? allLeagues.find(l => l.id === teamDataToSave.leagueId) : null;
    const categoryOfCurrentTeamForValidation = getDisciplineCategory(teamLeagueData?.type);
    
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
                const categoryOfExistingTeam = getDisciplineCategory(teamValidationEntry.leagueType);
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
      if (teamDataToSave.leagueId && typeof teamDataToSave.leagueId === 'string' && teamDataToSave.leagueId.trim() !== "") {
         // For VVs, leagueId is initially null, so this part is mostly for SuperAdmin context
         // For VVs, we mainly check for duplicate name within club and year
      }

      if (formMode === 'edit' && currentTeam.id) {
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions, where(documentId(), "!=", currentTeam.id));
      } else {
        duplicateQuery = query(teamsCollectionRef, ...baseDuplicateConditions);
      }
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        toast({ title: "Doppelter Mannschaftsname", description: `Eine Mannschaft mit diesem Namen existiert bereits für diesen Verein und dieses Wettkampfjahr.`, variant: "destructive", duration: 8000});
        setIsSubmittingForm(false); return; 
      }

      const batch = writeBatch(db);
      let teamIdForShooterUpdates: string = currentTeam.id || '';
      
      const originalShooterIds = formMode === 'edit' ? persistedShooterIdsForTeam : [];
      
      const shootersToAdd = selectedShooterIdsInForm.filter(id => !originalShooterIds.includes(id));
      const shootersToRemove = originalShooterIds.filter(id => !selectedShooterIdsInForm.includes(id) && allClubShootersForDialog.some(s => s.id === id));
      
      console.log("VMP DEBUG: handleSubmit - Original Shooter IDs:", originalShooterIds);
      console.log("VMP DEBUG: handleSubmit - Shooters to Add:", shootersToAdd);
      console.log("VMP DEBUG: handleSubmit - Shooters to Remove:", shootersToRemove);
      
      if (formMode === 'new') {
        const newTeamRef = doc(collection(db, TEAMS_COLLECTION)); 
        teamIdForShooterUpdates = newTeamRef.id;
        const { id, ...dataForNewTeam } = teamDataToSave; 
        batch.set(newTeamRef, {...dataForNewTeam, shooterIds: selectedShooterIdsInForm, leagueId: null }); // Explizit leagueId: null für VV
        toast({ title: "Mannschaft erstellt", description: `"${dataForNewTeam.name}" wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentTeam.id) {
        teamIdForShooterUpdates = currentTeam.id;
        const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdForShooterUpdates);
        const { id, ...dataForTeamUpdate } = teamDataToSave; 
        batch.update(teamDocRef, {...dataForTeamUpdate, shooterIds: selectedShooterIdsInForm} as Partial<Team>); 
        toast({ title: "Mannschaft aktualisiert", description: `"${dataForTeamUpdate.name}" wurde erfolgreich aktualisiert.` });
      } else {
        setIsSubmittingForm(false);
        throw new Error("VMP DEBUG: handleSubmit - Invalid form mode or missing team ID for edit.");
      }
      
      shootersToAdd.forEach(shooterId => {
        if(allClubShootersForDialog.some(s => s.id === shooterId)){ 
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayUnion(teamIdForShooterUpdates) });
        }
      });
      shootersToRemove.forEach(shooterId => {
          if(allClubShootersForDialog.some(s => s.id === shooterId)){
            const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
            batch.update(shooterDocRef, { teamIds: arrayRemove(teamIdForShooterUpdates) });
          }
      });
      
      await batch.commit();
      setIsFormOpen(false);
      setCurrentTeam(null);
      setSelectedShooterIdsInForm([]);
      setPersistedShooterIdsForTeam([]);
      fetchTeamsForClubAndSeason(); // Refetch teams
    } catch (error: any) {
      console.error("VMP DEBUG: handleSubmit - Error saving team or updating shooters: ", error);
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

    console.log("VMP DIALOG ShooterSelect: shooterId:", shooterId, "isChecked:", isChecked, "currentTeamLeagueType:", teamLeagueData?.type, "category:", categoryOfCurrentTeam, "year:", currentTeamCompYearForValidation);

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
          console.log("VMP DIALOG ShooterSelect: Current team is not assigned to a league. Skipping discipline conflict check for now.");
      }
    } 
    setSelectedShooterIdsInForm(prevSelectedIds =>
      isChecked ? [...prevSelectedIds, shooterId] : prevSelectedIds.filter(id => id !== shooterId)
    );
  };

  const getLeagueNameDisplay = (leagueId?: string | null): string => {
    if (!leagueId) return 'Nicht zugewiesen';
    const league = allLeagues.find(l => l.id === leagueId);
    if (!league) return 'Unbek. Liga (ID: ' + leagueId + ')';
    const leagueTypeLabel = league.type ? (leagueDisciplineOptions.find(opt => opt.value === league.type)?.label || league.type) : 'Typ N/A';
    return `${league.name} (${leagueTypeLabel})`;
  };

  const getClubName = (clubId?: string | null): string => {
    if (!clubId) return 'N/A';
    return allClubsGlobal.find(c => c.id === clubId)?.name || 'Unbek. Verein';
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
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
                {console.log("VMP DEBUG: Rendering leagues for filter dropdown:", JSON.stringify(availableLeaguesForFilter.map(l => ({id: l.id, name: l.name})) ))}
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
            <Button
                onClick={handleAddNewTeam}
                disabled={!selectedSeasonId || isLoadingTeams || isSubmittingForm || !activeClubId}
                className="w-full sm:w-auto whitespace-nowrap"
            >
                <PlusCircle className="mr-2 h-5 w-5" /> Neue Mannschaft
            </Button>
        )}
      </div>

      <Card className="shadow-md">
        <CardHeader>
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
                <TableHead>Name</TableHead><TableHead>Liga (Admin-Zuw.)</TableHead><TableHead>Jahr</TableHead><TableHead className="text-center">Schützen</TableHead>
                {isVereinsvertreter && <TableHead className="text-right">Aktionen</TableHead>}
            </TableRow></TableHeader>
            <TableBody>
                {teamsOfActiveClub.map((team) => (
                <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{getLeagueNameDisplay(team.leagueId)}</TableCell>
                    <TableCell>{team.competitionYear}</TableCell>
                    <TableCell className="text-center">{team.shooterIds?.length || 0} / {MAX_SHOOTERS_PER_TEAM}</TableCell>
                    {isVereinsvertreter && (
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditTeam(team)} disabled={isSubmittingForm || isDeletingTeam}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog open={!!teamToDelete && teamToDelete.id === team.id} onOpenChange={(open) => { if (!open) setTeamToDelete(null);}}>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => handleDeleteConfirmation(team)} disabled={isSubmittingForm || isDeletingTeam}><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Mannschaft löschen?</AlertDialogTitle><AlertDialogDescription>Möchten Sie "{teamToDelete?.name}" wirklich löschen? Dies entfernt auch die Zuordnung der Schützen zu dieser Mannschaft.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setTeamToDelete(null)}>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteTeam} disabled={isDeletingTeam} className="bg-destructive hover:bg-destructive/90">{isDeletingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Löschen</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    )}
                </TableRow>
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
        <Dialog open={isFormOpen} onOpenChange={(open) => { 
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
        }}>
          <DialogContent className="sm:max-w-2xl"> {/* Increased width */}
            <form onSubmit={handleSubmitTeamForm}>
              <DialogHeader>
                <DialogTitle>{formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}</DialogTitle>
                <DialogDescriptionComponent>
                  Für Verein: {activeClubName || 'Unbekannt'}. Saison: {allSeasons.find(s => s.id === (formMode === 'new' ? selectedSeasonId : currentTeam?.seasonId ))?.name || 'Saison wählen'}
                </DialogDescriptionComponent>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <Alert variant="default" className="mb-4 bg-blue-50 border-blue-300 text-blue-700">
                    <InfoIcon className="h-4 w-4 text-blue-600" />
                    <UiAlertDescription>
                        Hinweis zur Mannschaftsstärke: Bitte wählen Sie die Stärke Ihrer Mannschaft aus (I für die stärkste, II für die zweitstärkste usw.). Der Mannschaftsname wird automatisch vorgeschlagen. Die Ligazuweisung erfolgt durch den Rundenwettkampfleiter.
                    </UiAlertDescription>
                </Alert>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
                  
                  <div className="mb-2">
                    <Input
                      type="search"
                      placeholder="Schützen suchen..."
                      value={shooterSearchQuery}
                      onChange={(e) => setShooterSearchQuery(e.target.value)}
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
                                    {shooter.name} {isSelected && '✓'}
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
              <DialogFooter className="pt-6">
                 <DialogClose asChild><Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentTeam(null); setSelectedShooterIdsInForm([]); setPersistedShooterIdsForTeam([]); setAllClubShootersForDialog([]); }}>Abbrechen</Button></DialogClose>
                 {isVereinsvertreter && (
                    <Button type="submit" disabled={isSubmittingForm || isLoadingDialogData}>{(isSubmittingForm || isLoadingDialogData) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Speichern</Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

