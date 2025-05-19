
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
import { useSearchParams, useRouter } from 'next/navigation';
import type { Season, League, Club, Team } from '@/types/rwk';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, documentId, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues"; // Korrigierter Collection-Name
const CLUBS_COLLECTION = "clubs";
const TEAMS_COLLECTION = "rwk_teams";

export default function AdminTeamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySeasonId = searchParams.get('seasonId');
  const queryLeagueId = searchParams.get('leagueId');

  const { toast } = useToast();

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]); // Wird jetzt alle Ligen halten
  const [allClubs, setAllClubs] = useState<Club[]>([]);

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [availableLeaguesForSeason, setAvailableLeaguesForSeason] = useState<League[]>([]); // Gefilterte Ligen für die Saison
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  
  const [teams, setTeams] = useState<Team[]>([]); // Mannschaften für die ausgewählte Liga/Saison
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team> & { id?: string } | null>(null);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      console.log("AdminTeamsPage: fetchInitialData called");
      setIsLoadingData(true);
      try {
        console.log("AdminTeamsPage: Fetching seasons...");
        const seasonsSnapshot = await getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
        const fetchedSeasons: Season[] = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
        setAllSeasons(fetchedSeasons);
        console.log("AdminTeamsPage: Seasons fetched:", fetchedSeasons.length);

        if (fetchedSeasons.length === 0) {
          toast({ title: "Keine Saisons gefunden", description: "Bitte zuerst Saisons anlegen.", variant: "destructive" });
        }

        console.log("AdminTeamsPage: Fetching all leagues...");
        const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
        const fetchedLeagues: League[] = leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League));
        setAllLeagues(fetchedLeagues); // Alle Ligen laden
        console.log("AdminTeamsPage: All leagues fetched:", fetchedLeagues.length);

        console.log("AdminTeamsPage: Fetching clubs...");
        const clubsSnapshot = await getDocs(query(collection(db, CLUBS_COLLECTION), orderBy("name", "asc")));
        const fetchedClubs: Club[] = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
        setAllClubs(fetchedClubs);
        console.log("AdminTeamsPage: Clubs fetched:", fetchedClubs.length);

        if (querySeasonId && fetchedSeasons.some(s => s.id === querySeasonId)) {
          setSelectedSeasonId(querySeasonId);
        } else if (fetchedSeasons.length > 0) {
          setSelectedSeasonId(fetchedSeasons[0].id);
        } else {
          setSelectedSeasonId(''); // Keine Saisons, also nichts auswählen
        }
        console.log("AdminTeamsPage: Initial selectedSeasonId set to:", selectedSeasonId);

      } catch (error) {
        console.error("AdminTeamsPage: Error fetching initial data for teams admin: ", error);
        toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingData(false);
        console.log("AdminTeamsPage: fetchInitialData finished. isLoadingData:", false);
      }
    };
    fetchInitialData();
  }, [querySeasonId, toast]); // querySeasonId Abhängigkeit hinzugefügt

  // Effekt zum Filtern der Ligen basierend auf der ausgewählten Saison
  useEffect(() => {
    console.log("AdminTeamsPage: selectedSeasonId or allLeagues changed. Current selectedSeasonId:", selectedSeasonId);
    if (selectedSeasonId && allLeagues.length > 0) {
      const leaguesForSeason = allLeagues
        .filter(l => l.seasonId === selectedSeasonId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setAvailableLeaguesForSeason(leaguesForSeason);
      console.log("AdminTeamsPage: Available leagues for season:", leaguesForSeason.length);
      
      if (queryLeagueId && leaguesForSeason.some(l => l.id === queryLeagueId)) {
        setSelectedLeagueId(queryLeagueId);
      } else if (leaguesForSeason.length > 0) {
        setSelectedLeagueId(leaguesForSeason[0].id);
      } else {
        setSelectedLeagueId(''); // Keine Ligen für diese Saison
      }
    } else {
      setAvailableLeaguesForSeason([]);
      setSelectedLeagueId('');
    }
    console.log("AdminTeamsPage: Current selectedLeagueId set to:", selectedLeagueId);
  }, [selectedSeasonId, allLeagues, queryLeagueId]); // queryLeagueId Abhängigkeit hinzugefügt

  const fetchTeams = useMemo(() => async () => {
    if (!selectedLeagueId || !selectedSeasonId) {
      setTeams([]);
      console.log("AdminTeamsPage: fetchTeams - No league or season selected, clearing teams.");
      return;
    }
    const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeason) {
      setTeams([]);
      console.warn("AdminTeamsPage: fetchTeams - Current season not found for ID:", selectedSeasonId);
      return;
    }

    console.log(`AdminTeamsPage: Fetching teams for league ${selectedLeagueId} and year ${currentSeason.competitionYear}`);
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
      console.log("AdminTeamsPage: Teams fetched:", fetchedTeams.length);
    } catch (error) {
      console.error("AdminTeamsPage: Error fetching teams: ", error);
      toast({ title: "Fehler beim Laden der Mannschaften", description: (error as Error).message, variant: "destructive" });
      setTeams([]);
    } finally {
      setIsLoadingTeams(false);
      console.log("AdminTeamsPage: fetchTeams finished. isLoadingTeams:", false);
    }
  }, [selectedLeagueId, selectedSeasonId, allSeasons, toast]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);


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
      clubId: allClubs[0].id // Wähle ersten Verein als Standard
    });
    setIsFormOpen(true);
  };

  const handleEdit = (team: Team) => {
    if (allClubs.length === 0) {
        toast({ title: "Keine Vereine", description: "Vereinsauswahl nicht möglich. Bitte Vereine anlegen.", variant: "destructive" });
        // Optional: Form nicht öffnen oder clubId-Feld deaktivieren
    }
    setFormMode('edit');
    setCurrentTeam(team);
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
    
    setIsLoadingDelete(true); 
    try {
      await deleteDoc(doc(db, TEAMS_COLLECTION, teamToDelete.id));
      toast({ title: "Mannschaft gelöscht", description: `"${teamToDelete.name}" wurde erfolgreich entfernt.` });
      fetchTeams(); 
    } catch (error) {
      console.error("Error deleting team: ", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingDelete(false);
      setIsAlertOpen(false);
      setTeamToDelete(null);
    }
  };
  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentTeam || !currentTeam.name?.trim() || !currentTeam.clubId || !currentTeam.leagueId || currentTeam.competitionYear === undefined) {
      toast({ title: "Ungültige Eingabe", description: "Bitte alle erforderlichen Felder ausfüllen.", variant: "destructive" });
      return;
    }

    const teamDataToSave: Omit<Team, 'id' | 'shooterIds'> = { // shooterIds wird hier nicht direkt gespeichert
      name: currentTeam.name.trim(),
      clubId: currentTeam.clubId,
      leagueId: currentTeam.leagueId,
      competitionYear: currentTeam.competitionYear,
    };
    
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
        setIsLoadingForm(false);
        return; 
      }

      if (formMode === 'new') {
        await addDoc(teamsCollectionRef, teamDataToSave);
        toast({ title: "Mannschaft erstellt", description: `"${teamDataToSave.name}" wurde erfolgreich angelegt.` });
      } else if (formMode === 'edit' && currentTeam.id) {
        await updateDoc(doc(db, TEAMS_COLLECTION, currentTeam.id), teamDataToSave);
        toast({ title: "Mannschaft aktualisiert", description: `"${teamDataToSave.name}" wurde erfolgreich aktualisiert.` });
      }
      setIsFormOpen(false);
      setCurrentTeam(null);
      fetchTeams();
    } catch (error) {
      console.error("Error saving team: ", error);
      const action = formMode === 'new' ? 'erstellen' : 'aktualisieren';
      toast({ title: `Fehler beim ${action}`, description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingForm(false);
    }
  };

  const handleFormInputChange = (field: keyof Pick<Team, 'name' | 'clubId'>, value: string) => {
    setCurrentTeam(prev => {
        if (!prev) return null;
        // Sicherstellen, dass competitionYear und leagueId nicht überschrieben werden, wenn sie nicht explizit geändert werden
        const updatedTeam = { ...prev, [field]: value };
        return updatedTeam as Partial<Team>;
    });
  };
  
  const navigateToShooters = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      router.push(`/admin/shooters?clubId=${team.clubId}&teamId=${teamId}&seasonId=${selectedSeasonId}&leagueId=${selectedLeagueId}`);
    }
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
                  <TableHead>Verein</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{allClubs.find(c => c.id === team.clubId)?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => navigateToShooters(team.id)}>
                        <Users className="mr-1 h-4 w-4" /> Schützen
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
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setCurrentTeam(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{formMode === 'new' ? 'Neue Mannschaft anlegen' : 'Mannschaft bearbeiten'}</DialogTitle>
              <DialogDescription>
                Für Liga: {selectedLeague?.name || 'Unbekannte Liga'} (Saison: {selectedSeason?.name || 'Unbekannte Saison'})
              </DialogDescription>
            </DialogHeader>
            {currentTeam && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teamName" className="text-right">Name</Label>
                  <Input 
                    id="teamName" 
                    value={currentTeam.name || ''} 
                    onChange={(e) => handleFormInputChange('name', e.target.value)} 
                    className="col-span-3" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="clubId" className="text-right">Verein</Label>
                  <Select 
                    value={currentTeam.clubId || ''} 
                    onValueChange={(value) => handleFormInputChange('clubId', value)}
                    required
                    disabled={allClubs.length === 0}
                  >
                      <SelectTrigger id="clubId" className="col-span-3" aria-label="Verein auswählen">
                          <SelectValue placeholder={allClubs.length === 0 ? "Keine Vereine verfügbar" : "Verein wählen"}/>
                      </SelectTrigger>
                      <SelectContent>
                          {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
                  {/* leagueId und competitionYear werden nicht direkt im Formular geändert, sondern vom Kontext übernommen */}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentTeam(null); }}>Abbrechen</Button>
              <Button type="submit" disabled={isLoadingForm || allClubs.length === 0}>
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
                Möchten Sie die Mannschaft "{teamToDelete.name}" wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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

