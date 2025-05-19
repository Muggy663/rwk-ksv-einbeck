
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
import type { Season, League, Club, Team, Shooter } from '@/types/rwk';
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
  const [originalShooterIds, setOriginalShooterIds] = useState<string[]>([]);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');
  const [selectedShooterIdsInForm, setSelectedShooterIdsInForm] = useState<string[]>([]);


  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      console.log(">>> teams/fetchInitialData: Fetching initial data...");
      setIsLoadingData(true);
      try {
        const seasonsSnapshot = await getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
        const fetchedSeasons: Season[] = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
        setAllSeasons(fetchedSeasons);
        console.log(">>> teams/fetchInitialData: Seasons fetched:", fetchedSeasons.length);
        if (fetchedSeasons.length === 0) toast({ title: "Keine Saisons gefunden", description: "Bitte zuerst Saisons anlegen.", variant: "destructive" });

        const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
        const fetchedLeagues: League[] = leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
        setAllLeagues(fetchedLeagues);
         fetchedLeagues.forEach(league => {
           console.log(`>>> teams/fetchInitialData: League Detail - ID: ${league.id}, Name: ${league.name}, SeasonID: ${league.seasonId}`);
        });
        console.log(">>> teams/fetchInitialData: All leagues fetched:", fetchedLeagues.length);

        const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
        const fetchedClubs: Club[] = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
        setAllClubs(fetchedClubs);
        console.log(">>> teams/fetchInitialData: Clubs fetched:", fetchedClubs.length);

        if (querySeasonId && fetchedSeasons.some(s => s.id === querySeasonId)) {
          setSelectedSeasonId(querySeasonId);
        } else if (fetchedSeasons.length > 0) {
          setSelectedSeasonId(fetchedSeasons[0].id);
        } else {
          setSelectedSeasonId('');
        }
        console.log(">>> teams/fetchInitialData: Initial selectedSeasonId:", selectedSeasonId);

      } catch (error) {
        console.error(">>> teams/fetchInitialData: Error fetching initial data: ", error);
        toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingData(false);
        console.log(">>> teams/fetchInitialData: Finished. isLoadingData:", false);
      }
    };
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); 

  useEffect(() => {
    console.log(">>> teams/useEffect[selectedSeasonId, allLeagues]: Filtering leagues. Selected seasonId:", selectedSeasonId);
    if (selectedSeasonId && allLeagues.length > 0) {
      const leaguesForSeason = allLeagues
        .filter(l => l.seasonId === selectedSeasonId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setAvailableLeaguesForSeason(leaguesForSeason);
      console.log(`>>> teams/useEffect[selectedSeasonId, allLeagues]: Available leagues for season ${selectedSeasonId}: ${leaguesForSeason.length}`);
      
      if (queryLeagueId && leaguesForSeason.some(l => l.id === queryLeagueId)) {
        setSelectedLeagueId(queryLeagueId);
      } else if (leaguesForSeason.length > 0) {
        setSelectedLeagueId(leaguesForSeason[0].id);
      } else {
        setSelectedLeagueId('');
      }
    } else {
      setAvailableLeaguesForSeason([]);
      setSelectedLeagueId('');
    }
    console.log(">>> teams/useEffect[selectedSeasonId, allLeagues]: Current selectedLeagueId:", selectedLeagueId);
  }, [selectedSeasonId, allLeagues, queryLeagueId]);

  const fetchTeams = useMemo(() => async () => {
    if (!selectedLeagueId || !selectedSeasonId) {
      setTeams([]);
      console.log(">>> teams/fetchTeams: No league or season selected, clearing teams.");
      return;
    }
    const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeason) {
      setTeams([]);
      console.warn(">>> teams/fetchTeams: Current season not found for ID:", selectedSeasonId);
      return;
    }

    console.log(`>>> teams/fetchTeams: Fetching teams for league ${selectedLeagueId} and year ${currentSeason.competitionYear}`);
    setIsLoadingTeams(true);
    try {
      const q = query(
        collection(db, TEAMS_COLLECTION),
        where("leagueId", "==", selectedLeagueId),
        where("competitionYear", "==", currentSeason.competitionYear),
        orderBy("name", "asc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedTeams: Team[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setTeams(fetchedTeams);
      console.log(">>> teams/fetchTeams: Teams fetched:", fetchedTeams.length);
    } catch (error) {
      console.error(">>> teams/fetchTeams: Error fetching teams: ", error);
      toast({ title: "Fehler beim Laden der Mannschaften", description: (error as Error).message, variant: "destructive" });
      setTeams([]);
    } finally {
      setIsLoadingTeams(false);
      console.log(">>> teams/fetchTeams: Finished. isLoadingTeams:", false);
    }
  }, [selectedLeagueId, selectedSeasonId, allSeasons, toast]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    const fetchShootersForClub = async () => {
      if (isFormOpen && currentTeam?.clubId) {
        console.log(`>>> teams/fetchShootersForClub: Fetching shooters for clubId ${currentTeam.clubId}`);
        setIsLoadingShootersForDialog(true);
        try {
          const shootersQuery = query(
            collection(db, SHOOTERS_COLLECTION),
            where("clubId", "==", currentTeam.clubId),
            orderBy("lastName", "asc"),
            orderBy("firstName", "asc")
          );
          const snapshot = await getDocs(shootersQuery);
          const fetchedShooters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shooter));
          setAvailableClubShooters(fetchedShooters);
          console.log(`>>> teams/fetchShootersForClub: Fetched ${fetchedShooters.length} shooters for club ${currentTeam.clubId}`);
        } catch (error) {
          console.error(">>> teams/fetchShootersForClub: Error fetching shooters for club:", error);
          toast({ title: "Fehler beim Laden der Schützen", description: (error as Error).message, variant: "destructive" });
          setAvailableClubShooters([]);
        } finally {
          setIsLoadingShootersForDialog(false);
        }
      } else {
        setAvailableClubShooters([]);
      }
    };
    fetchShootersForClub();
  }, [isFormOpen, currentTeam?.clubId, toast]);


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
    setOriginalShooterIds([]);
    setIsFormOpen(true);
    console.log(">>> teams/handleAddNew: Opening form for new team.");
  };

  const handleEdit = (team: Team) => {
    if (allClubs.length === 0 && !team.clubId) {
        toast({ title: "Keine Vereine", description: "Vereinsauswahl nicht möglich. Bitte Vereine anlegen.", variant: "destructive" });
    }
    setFormMode('edit');
    setCurrentTeam(team);
    const currentShooterIds = team.shooterIds || [];
    setSelectedShooterIdsInForm(currentShooterIds); 
    setOriginalShooterIds(currentShooterIds);
    setIsFormOpen(true);
    console.log(">>> teams/handleEdit: Opening form to edit team:", team.id, "Current shooters:", currentShooterIds);
  };

  const handleDeleteConfirmation = (team: Team) => {
    setTeamToDelete(team);
    setIsAlertOpen(true);
    console.log(">>> teams/handleDeleteConfirmation: Marked team for deletion:", team.id);
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
      console.log(">>> teams/handleDeleteTeam: Finished for team", teamToDelete?.id);
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

    const teamDataToSave: Omit<Team, 'id'> = { 
      name: currentTeam.name.trim(),
      clubId: currentTeam.clubId,
      leagueId: currentTeam.leagueId,
      competitionYear: currentTeam.competitionYear,
      shooterIds: selectedShooterIdsInForm, 
    };
    console.log(">>> teams/handleSubmit: Team data to save:", teamDataToSave);
    console.log(">>> teams/handleSubmit: Original Shooter IDs:", originalShooterIds);
    console.log(">>> teams/handleSubmit: Selected Shooter IDs in Form:", selectedShooterIdsInForm);
    
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
        console.warn(">>> teams/handleSubmit: Duplicate team name found.");
        setIsLoadingForm(false);
        return; 
      }

      const batch = writeBatch(db);
      let teamIdForShooterUpdates: string;
      
      const shootersToAdd = selectedShooterIdsInForm.filter(id => !originalShooterIds.includes(id));
      const shootersToRemove = originalShooterIds.filter(id => !selectedShooterIdsInForm.includes(id));
      console.log(">>> teams/handleSubmit: Shooters to ADD to their teamIds array:", shootersToAdd);
      console.log(">>> teams/handleSubmit: Shooters to REMOVE from their teamIds array:", shootersToRemove);


      if (formMode === 'new') {
        const newTeamRef = doc(collection(db, TEAMS_COLLECTION)); 
        teamIdForShooterUpdates = newTeamRef.id;
        batch.set(newTeamRef, teamDataToSave); 
        console.log(`>>> teams/handleSubmit: NEW team to be created with ID ${teamIdForShooterUpdates}.`);

        shootersToAdd.forEach(shooterId => { 
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayUnion(teamIdForShooterUpdates) });
           console.log(`>>> teams/handleSubmit: Adding team ${teamIdForShooterUpdates} to shooter ${shooterId}'s teamIds.`);
        });
        toast({ title: "Mannschaft erstellt", description: `"${teamDataToSave.name}" wurde erfolgreich angelegt.` });

      } else if (formMode === 'edit' && currentTeam.id) {
        teamIdForShooterUpdates = currentTeam.id;
        const teamDocRef = doc(db, TEAMS_COLLECTION, teamIdForShooterUpdates);
        batch.update(teamDocRef, teamDataToSave); 
        console.log(`>>> teams/handleSubmit: EDIT team ${teamIdForShooterUpdates}.`);

        shootersToAdd.forEach(shooterId => {
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayUnion(teamIdForShooterUpdates) });
          console.log(`>>> teams/handleSubmit: Adding team ${teamIdForShooterUpdates} to shooter ${shooterId}'s teamIds.`);
        });
        shootersToRemove.forEach(shooterId => {
          const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
          batch.update(shooterDocRef, { teamIds: arrayRemove(teamIdForShooterUpdates) });
          console.log(`>>> teams/handleSubmit: Removing team ${teamIdForShooterUpdates} from shooter ${shooterId}'s teamIds.`);
        });
        toast({ title: "Mannschaft aktualisiert", description: `"${teamDataToSave.name}" wurde erfolgreich aktualisiert.` });
      } else {
        throw new Error("Invalid form mode or missing team ID for edit.");
      }
      
      console.log(">>> teams/handleSubmit: Committing batch...");
      await batch.commit();
      console.log(">>> teams/handleSubmit: Batch committed successfully.");

      setIsFormOpen(false);
      setCurrentTeam(null);
      setSelectedShooterIdsInForm([]); 
      setOriginalShooterIds([]);
      fetchTeams();
    } catch (error) {
      console.error(">>> teams/handleSubmit: Error saving team or updating shooters: ", error);
      const action = formMode === 'new' ? 'erstellen' : 'aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingForm(false);
      console.log(">>> teams/handleSubmit: Finished.");
    }
  };

  const handleFormInputChange = (field: keyof Pick<Team, 'name' | 'clubId'>, value: string) => {
    setCurrentTeam(prev => {
        if (!prev) return null;
        const updatedTeam = { ...prev, [field]: value };
        if (field === 'clubId' && prev.clubId !== value) {
            setSelectedShooterIdsInForm([]); 
            setOriginalShooterIds( formMode === 'edit' && prev.shooterIds ? prev.shooterIds : []); 
            setAvailableClubShooters([]); 
            console.log(">>> teams/handleFormInputChange: Club changed, reset selected/available shooters. Original shooters (if edit):", originalShooterIds);
        }
        return updatedTeam as Partial<Team>; 
    });
  };

  const handleShooterSelectionChange = (shooterId: string, checked: boolean) => {
    setSelectedShooterIdsInForm(prevSelectedIds => {
      let newSelectedIds;
      if (checked) {
        if (prevSelectedIds.length < MAX_SHOOTERS_PER_TEAM) {
          newSelectedIds = [...prevSelectedIds, shooterId];
        } else {
          toast({
            title: "Maximale Schützenzahl erreicht",
            description: `Eine Mannschaft darf nicht mehr als ${MAX_SHOOTERS_PER_TEAM} Schützen haben.`,
            variant: "destructive",
          });
          return prevSelectedIds; // Verhindere das Hinzufügen
        }
      } else {
        newSelectedIds = prevSelectedIds.filter(id => id !== shooterId);
      }
      return newSelectedIds;
    });
  };
  
  const navigateToShootersAdmin = (clubIdOfTeam: string, teamId?: string) => {
    if (!clubIdOfTeam) {
        console.error("navigateToShootersAdmin: clubId is missing for team.");
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
                  {/* <TableHead>Verein</TableHead> entfernt */}
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    {/* <TableCell>{allClubs.find(c => c.id === team.clubId)?.name || 'Unbekannt'}</TableCell> entfernt */}
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => navigateToShootersAdmin(team.clubId, team.id)} disabled={!team.clubId}>
                        <Users className="mr-1 h-4 w-4" /> Schützen ({team.shooterIds?.length || 0})
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

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) {setCurrentTeam(null); setSelectedShooterIdsInForm([]); setOriginalShooterIds([]); setAvailableClubShooters([]);} }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}</DialogTitle>
              <DialogDescription>
                Für Liga: {selectedLeague?.name || 'Unbekannte Liga'} (Saison: {selectedSeason?.name || 'Unbekannte Saison'})
              </DialogDescription>
            </DialogHeader>
            {currentTeam && (
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
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
                    <Label htmlFor="clubId">Verein</Label>
                    <Select 
                      value={currentTeam.clubId || ''} 
                      onValueChange={(value) => handleFormInputChange('clubId', value)}
                      required
                      disabled={allClubs.length === 0}
                    >
                        <SelectTrigger id="clubId" aria-label="Verein auswählen">
                            <SelectValue placeholder={allClubs.length === 0 ? "Keine Vereine verfügbar" : "Verein wählen"}/>
                        </SelectTrigger>
                        <SelectContent>
                            {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Schützen für diese Mannschaft auswählen</Label>
                    <span className="text-sm text-muted-foreground">
                      {selectedShooterIdsInForm.length} / {MAX_SHOOTERS_PER_TEAM} ausgewählt
                    </span>
                  </div>
                  {isLoadingShootersForDialog ? (
                     <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2">Lade Schützen...</p></div>
                  ) : availableClubShooters.length > 0 ? (
                    <ScrollArea className="h-48 rounded-md border p-2">
                      <div className="space-y-1">
                      {availableClubShooters.map(shooter => (
                        <div key={shooter.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-md">
                          <Checkbox
                            id={`shooter-${shooter.id}`}
                            checked={selectedShooterIdsInForm.includes(shooter.id)}
                            onCheckedChange={(checked) => handleShooterSelectionChange(shooter.id, !!checked)}
                            disabled={!selectedShooterIdsInForm.includes(shooter.id) && selectedShooterIdsInForm.length >= MAX_SHOOTERS_PER_TEAM}
                          />
                          <Label htmlFor={`shooter-${shooter.id}`} className="font-normal cursor-pointer flex-grow">
                            {shooter.name || `${shooter.firstName} ${shooter.lastName}`}
                            <span className="text-xs text-muted-foreground ml-2">(Schnitt Vorjahr: folgt)</span>
                          </Label>
                        </div>
                      ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground p-2">
                      {currentTeam?.clubId ? 
                        `Keine Schützen für den Verein '${allClubs.find(c => c.id === currentTeam?.clubId)?.name || 'ausgewählten Verein'}' gefunden.` : 
                        'Bitte zuerst einen Verein auswählen, um Schützen laden zu können.'}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2 mt-2">
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
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentTeam(null); setSelectedShooterIdsInForm([]); setOriginalShooterIds([]); setAvailableClubShooters([]);}}>Abbrechen</Button>
              <Button type="submit" disabled={isLoadingForm || (allClubs.length === 0 && !currentTeam?.clubId ) || selectedShooterIdsInForm.length > MAX_SHOOTERS_PER_TEAM}>
                 {isLoadingForm && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
    
