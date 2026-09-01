// src/app/admin/edit-results/page.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit3, Search, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import type { Season, League, Team, Shooter, ScoreEntry, FirestoreLeagueSpecificDiscipline } from '@/types/rwk';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc, serverTimestamp, documentId, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { getSeasonSpecificScoresCollection } from '@/lib/utils/collection-names';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "shooters";
const SCORES_COLLECTION = "rwk_scores";

type EditableScoreEntry = ScoreEntry & {
  leagueName?: string;
  lastEditTimestamp?: any;
  lastEditedByUserName?: string;
};

export default function AdminEditResultsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter States
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [availableLeagues, setAvailableLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [availableShooters, setAvailableShooters] = useState<Shooter[]>([]);
  const [selectedShooterId, setSelectedShooterId] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<string>('');

  const [displayedScores, setDisplayedScores] = useState<EditableScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  // Edit Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentScoreToEdit, setCurrentScoreToEdit] = useState<EditableScoreEntry | null>(null);
  const [editFormScore, setEditFormScore] = useState<string>('');
  const [editFormResultType, setEditFormResultType] = useState<'regular' | 'pre' | 'post'>('regular');
  const [editFormRound, setEditFormRound] = useState<string>('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Alert States
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [scoreToDelete, setScoreToDelete] = useState<ScoreEntry | null>(null);
  const [isDeletingScore, setIsDeletingScore] = useState(false);


  const fetchInitialFilterData = useCallback(async () => {
    setIsLoadingFilters(true);
    try {
      const seasonsQuery = query(
        collection(db, SEASONS_COLLECTION),
        where("status", "in", ["Laufend", "Abgeschlossen"]),
        orderBy("competitionYear", "desc")
      );
      const seasonsSnapshot = await getDocs(seasonsQuery);
      setAllSeasons(seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season)));
    } catch (error) {
      logError("Error fetching seasons for edit-results page:", error); 
      toast({
        title: "Fehler beim Laden der Saisons",
        description: (error as Error).message || "Ein unbekannter Fehler ist aufgetreten. Bitte prüfen Sie die Browser-Konsole für Details und erstellen Sie ggf. den vorgeschlagenen Firestore-Index.",
        variant: "destructive",
      });
      setAllSeasons([]); 
    } finally {
      setIsLoadingFilters(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialFilterData();
  }, [fetchInitialFilterData]);

  useEffect(() => {
    const loadLeagues = async () => {
      if (!selectedSeasonId) {
        setAvailableLeagues([]);
        setSelectedLeagueId('');
        return;
      }
      setIsLoading(true);
      try {
        const q = query(
          collection(db, LEAGUES_COLLECTION),
          where("seasonId", "==", selectedSeasonId),
          orderBy("order", "asc")
        );
        const snapshot = await getDocs(q);
        setAvailableLeagues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League)));
      } catch (error) {
        logError("Error fetching leagues for edit-results:", error);
        toast({ title: "Fehler beim Laden der Ligen", description: (error as Error).message, variant: "destructive" });
        setAvailableLeagues([]);
      } finally {
        setIsLoading(false);
        setSelectedLeagueId('');
      }
    };
    if (selectedSeasonId) {
        loadLeagues();
    } else {
        setAvailableLeagues([]);
        setSelectedLeagueId('');
    }
  }, [selectedSeasonId, toast]);

  useEffect(() => {
    const loadTeams = async () => {
      if (!selectedLeagueId) {
        setAvailableTeams([]);
        setSelectedTeamId('');
        return;
      }
      setIsLoading(true);
      try {
        const leagueData = availableLeagues.find(l => l.id === selectedLeagueId);
        if (!leagueData) {
            setAvailableTeams([]);
            setSelectedTeamId('');
            setIsLoading(false);
            return;
        }
        const seasonData = allSeasons.find(s => s.id === leagueData.seasonId);
        if (!seasonData) {
            setAvailableTeams([]);
            setSelectedTeamId('');
            setIsLoading(false);
            return;
        }
        const q = query(
          collection(db, TEAMS_COLLECTION),
          where("leagueId", "==", selectedLeagueId),
          where("competitionYear", "==", seasonData.competitionYear),
          orderBy("name", "asc")
        );
        const snapshot = await getDocs(q);
        setAvailableTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
      } catch (error) {
        logError("Error fetching teams for edit-results:", error);
        toast({ title: "Fehler beim Laden der Mannschaften", description: (error as Error).message, variant: "destructive" });
        setAvailableTeams([]);
      } finally {
        setIsLoading(false);
        setSelectedTeamId('');
      }
    };
     if (selectedLeagueId) {
        loadTeams();
    } else {
        setAvailableTeams([]);
        setSelectedTeamId('');
    }
  }, [selectedLeagueId, availableLeagues, allSeasons, toast]);

   useEffect(() => {
    const loadShooters = async () => {
      if (!selectedTeamId) {
        setAvailableShooters([]);
        setSelectedShooterId('');
        return;
      }
      setIsLoading(true);
      try {
        const teamData = availableTeams.find(t => t.id === selectedTeamId);
        if (!teamData || !teamData.shooterIds || teamData.shooterIds.length === 0) {
          setAvailableShooters([]);
          setSelectedShooterId('');
          setIsLoading(false);
          return;
        }

        if (teamData.shooterIds.length > 0) {
             const shootersQuery = query(
                collection(db, SHOOTERS_COLLECTION),
                where(documentId(), "in", teamData.shooterIds),
                orderBy("name", "asc")
            );
            const snapshot = await getDocs(shootersQuery);
            setAvailableShooters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shooter)));
        } else {
            setAvailableShooters([]);
        }

      } catch (error) {
        logError("Error fetching shooters for edit-results:", error);
        toast({ title: "Fehler beim Laden der Schützen", description: (error as Error).message, variant: "destructive" });
        setAvailableShooters([]);
      } finally {
        setIsLoading(false);
        setSelectedShooterId('');
      }
    };
    if (selectedTeamId) {
        loadShooters();
    } else {
        setAvailableShooters([]);
        setSelectedShooterId('');
    }
  }, [selectedTeamId, availableTeams, toast]);


  const handleSearchScores = async () => {
    if (!selectedSeasonId) {
      toast({ title: "Bitte Saison wählen", description: "Eine Saison ist für die Suche erforderlich.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setDisplayedScores([]);
    try {
      const seasonData = allSeasons.find(s => s.id === selectedSeasonId);
      if (!seasonData) {
        toast({ title: "Saison nicht gefunden", description: "Die ausgewählte Saison konnte nicht geladen werden.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      let qConstraints: any[] = [
        where("competitionYear", "==", seasonData.competitionYear)
      ];
      if (selectedLeagueId) qConstraints.push(where("leagueId", "==", selectedLeagueId));
      if (selectedTeamId) qConstraints.push(where("teamId", "==", selectedTeamId));
      if (selectedShooterId) qConstraints.push(where("shooterId", "==", selectedShooterId));
      if (selectedRound) qConstraints.push(where("durchgang", "==", parseInt(selectedRound, 10)));

      // Verwende saison-spezifische Collection falls vorhanden
      let scoresQuery;
      try {
        const leagueData = availableLeagues.find(l => l.id === selectedLeagueId);
        const seasonSpecificCollection = leagueData ? 
          getSeasonSpecificScoresCollection(seasonData.competitionYear, leagueData.type) :
          SCORES_COLLECTION;
        
        logDebug(`🔍 Admin: Versuche saison-spezifische Collection: ${seasonSpecificCollection}`);
        
        scoresQuery = query(collection(db, seasonSpecificCollection), ...qConstraints);
      } catch (error) {
        logDebug(`⚠️ Admin: Saison-spezifische Collection nicht gefunden, verwende rwk_scores`);
        scoresQuery = query(collection(db, SCORES_COLLECTION), ...qConstraints);
      }

      const snapshot = await getDocs(scoresQuery);
      const fetchedScores = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as EditableScoreEntry))
        .sort((a, b) => {
          const aTs = (a.entryTimestamp as Timestamp)?.toMillis() ?? 0;
          const bTs = (b.entryTimestamp as Timestamp)?.toMillis() ?? 0;
          return bTs - aTs;
        });
      setDisplayedScores(fetchedScores);
      if (fetchedScores.length === 0) {
        toast({ title: "Keine Ergebnisse", description: "Für die gewählten Filter wurden keine Ergebnisse gefunden." });
      }
    } catch (error) {
      logError("Raw error:", error);
      logError("Error searching scores for edit-results:", error);
      toast({ title: "Fehler bei der Ergebnissuche", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditScore = (score: ScoreEntry) => {
    setCurrentScoreToEdit(score);
    setEditFormScore(score.totalRinge.toString());
    setEditFormResultType(score.scoreInputType);
    setEditFormRound(score.durchgang.toString());
    setIsFormOpen(true);
  };

  const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentScoreToEdit || !user) {
      toast({ title: "Fehler", description: "Kein Ergebnis zum Bearbeiten ausgewählt oder Benutzer nicht angemeldet.", variant: "destructive" });
      return;
    }

    const newScoreValue = parseInt(editFormScore, 10);
    if (isNaN(newScoreValue) || newScoreValue < 0 ) { 
      toast({ title: "Ungültige Ringzahl", description: "Bitte eine gültige, nicht-negative Ringzahl eingeben.", variant: "destructive" });
      return;
    }
    
    const leagueForValidation = availableLeagues.find(l => l.id === currentScoreToEdit.leagueId);
    let maxPossibleScore = 300; // Default KK
    if (leagueForValidation) {
        const lgLpTypes: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
        if (lgLpTypes.includes(leagueForValidation.type)) {
            maxPossibleScore = 400;
        }
    }
    
    if (newScoreValue > maxPossibleScore) {
      toast({ title: "Ungültige Ringzahl", description: `Die Ringzahl darf für diese Disziplin maximal ${maxPossibleScore} betragen.`, variant: "destructive" });
      return;
    }

    setIsSubmittingEdit(true);
    const newRoundValue = parseInt(editFormRound, 10);
    if (isNaN(newRoundValue) || newRoundValue < 1 || newRoundValue > numRoundsForSelect) {
      toast({ title: "Ungültiger Durchgang", description: `Bitte einen gültigen Durchgang zwischen 1 und ${numRoundsForSelect} eingeben.`, variant: "destructive" });
      return;
    }
    
    try {
      // Bestimme die richtige Collection für das Update
      let collectionName = SCORES_COLLECTION;
      try {
        const leagueData = availableLeagues.find(l => l.id === currentScoreToEdit.leagueId);
        const seasonData = allSeasons.find(s => s.id === selectedSeasonId);
        
        if (leagueData && seasonData) {
          const seasonSpecificCollection = getSeasonSpecificScoresCollection(seasonData.competitionYear, leagueData.type);
          collectionName = seasonSpecificCollection;
          logDebug(`🔍 Admin Update: Verwende ${collectionName}`);
        }
      } catch (error) {
        logDebug(`⚠️ Admin Update: Verwende Standard-Collection`);
      }
      
      const scoreDocRef = doc(db, collectionName, currentScoreToEdit.id);
      await updateDoc(scoreDocRef, {
        totalRinge: newScoreValue,
        scoreInputType: editFormResultType,
        durchgang: newRoundValue,
        lastEditedByUserId: user.uid,
        lastEditedByUserName: user.displayName || user.email || "Unbekannt",
        lastEditTimestamp: serverTimestamp()
      });
      toast({ title: "Ergebnis aktualisiert", description: "Die Änderungen wurden erfolgreich gespeichert." });
      setIsFormOpen(false);
      setCurrentScoreToEdit(null);
      await handleSearchScores(); 
    } catch (error) {
      logError("Error submitting score edit:", error);
      toast({ title: "Fehler beim Aktualisieren", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteConfirmation = (score: ScoreEntry) => {
    setScoreToDelete(score);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteScore = async () => {
    if (!scoreToDelete || !scoreToDelete.id || !user) {
      toast({ title: "Fehler", description: "Kein Ergebnis zum Löschen ausgewählt oder Benutzer nicht angemeldet.", variant: "destructive" });
      setIsDeleteAlertOpen(false);
      setScoreToDelete(null);
      return;
    }
    setIsDeletingScore(true);
    try {
      // Bestimme die richtige Collection für das Löschen
      let collectionName = SCORES_COLLECTION;
      try {
        const leagueData = availableLeagues.find(l => l.id === scoreToDelete.leagueId);
        const seasonData = allSeasons.find(s => s.id === selectedSeasonId);
        
        if (leagueData && seasonData) {
          const seasonSpecificCollection = getSeasonSpecificScoresCollection(seasonData.competitionYear, leagueData.type);
          collectionName = seasonSpecificCollection;
          logDebug(`🔍 Admin Delete: Verwende ${collectionName}`);
        }
      } catch (error) {
        logDebug(`⚠️ Admin Delete: Verwende Standard-Collection`);
      }
      
      await deleteDoc(doc(db, collectionName, scoreToDelete.id));
      toast({ title: "Ergebnis gelöscht", description: `Das Ergebnis für ${scoreToDelete.shooterName} (DG ${scoreToDelete.durchgang}) wurde entfernt.` });
      await handleSearchScores(); // Refresh list
    } catch (error) {
      logError("Error deleting score:", error);
      toast({ title: "Fehler beim Löschen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsDeletingScore(false);
      setIsDeleteAlertOpen(false);
      setScoreToDelete(null);
    }
  };

  const numRoundsForSelect = useMemo(() => {
    // Alle Disziplinen haben 5 Durchgänge
    return 5;
  }, []);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Ergebnisse bearbeiten</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Filter für Ergebnisse</CardTitle>
          <CardDescription>Wählen Sie Kriterien, um die zu bearbeitenden Ergebnisse zu finden.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="filterSeason">Saison (Laufend/Abgeschlossen)</Label>
              <NativeSelect
                value={selectedSeasonId}
                onValueChange={setSelectedSeasonId}
                disabled={isLoadingFilters || allSeasons.length === 0}
                placeholder={isLoadingFilters ? "Lade Saisons..." : (allSeasons.length === 0 ? "Keine Saisons" : "Saison wählen")}
                options={allSeasons.map(s => ({ value: s.id, label: s.name }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filterLeague">Liga</Label>
              <NativeSelect
                value={selectedLeagueId}
                onValueChange={setSelectedLeagueId}
                disabled={!selectedSeasonId || isLoading || availableLeagues.length === 0}
                placeholder={!selectedSeasonId ? "Saison wählen" : (isLoading ? "Lade Ligen..." : (availableLeagues.length === 0 ? "Keine Ligen" : "Liga wählen"))}
                options={availableLeagues.map(l => ({ value: l.id, label: l.name }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filterTeam">Mannschaft</Label>
              <NativeSelect
                value={selectedTeamId}
                onValueChange={setSelectedTeamId}
                disabled={!selectedLeagueId || isLoading || availableTeams.length === 0}
                placeholder={!selectedLeagueId ? "Liga wählen" : (isLoading ? "Lade Teams..." : (availableTeams.length === 0 ? "Keine Teams" : "Mannschaft wählen"))}
                options={availableTeams.map(t => ({ value: t.id, label: t.name }))}
              />
            </div>
             <div className="space-y-1.5">
              <Label htmlFor="filterShooter">Schütze</Label>
              <NativeSelect
                value={selectedShooterId}
                onValueChange={setSelectedShooterId}
                disabled={!selectedTeamId || isLoading || availableShooters.length === 0}
                placeholder={!selectedTeamId ? "Team wählen" : (isLoading ? "Lade Schützen..." : (availableShooters.length === 0 ? "Keine Schützen" : "Schütze wählen"))}
                options={availableShooters.map(s => ({ value: s.id, label: s.name }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filterRound">Durchgang</Label>
              <NativeSelect
                value={selectedRound}
                onValueChange={setSelectedRound}
                disabled={!selectedSeasonId}
                placeholder="Durchgang wählen"
                options={[...Array(numRoundsForSelect)].map((_, i) => ({ value: (i + 1).toString(), label: `Durchgang ${i + 1}` }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSearchScores} disabled={isLoading || isLoadingFilters || !selectedSeasonId}>
              <Search className="mr-2 h-5 w-5" /> Ergebnisse suchen
              {isLoading && !isLoadingFilters && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && displayedScores.length === 0 && !isLoadingFilters && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3">Lade Ergebnisse...</p>
        </div>
      )}

      {!isLoading && displayedScores.length > 0 && (
        <Card className="shadow-md mt-6">
          <CardHeader>
            <CardTitle>Gefundene Ergebnisse ({displayedScores.length})</CardTitle>
            <CardDescription>Hier können Sie die Details der gefundenen Ergebnisse einsehen und bearbeiten.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schütze</TableHead>
                    <TableHead>Mannschaft</TableHead>
                    <TableHead>Liga</TableHead>
                    <TableHead className="text-center">DG</TableHead>
                    <TableHead className="text-center">Ringe</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Erfasst am</TableHead>
                    <TableHead>Erfasser</TableHead>
                    <TableHead>Zuletzt bearbeitet</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedScores.map((score) => (
                    <TableRow key={score.id}>
                      <TableCell>{score.shooterName}</TableCell>
                      <TableCell>{score.teamName}</TableCell>
                      <TableCell>{score.leagueName}</TableCell>
                      <TableCell className="text-center">{score.durchgang}</TableCell>
                      <TableCell className="text-center font-semibold">{score.totalRinge}</TableCell>
                      <TableCell>{score.scoreInputType}</TableCell>
                      <TableCell>{score.entryTimestamp ? format((score.entryTimestamp as Timestamp).toDate(), 'dd.MM.yy HH:mm') : '-'}</TableCell>
                      <TableCell className="text-xs">{score.enteredByUserName}</TableCell>
                      <TableCell className="text-xs">
                        {score.lastEditTimestamp ?
                          `${score.lastEditedByUserName || 'Unbek.'}, ${format((score.lastEditTimestamp as Timestamp).toDate(), 'dd.MM.yy HH:mm')}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditScore(score)} aria-label="Ergebnis bearbeiten">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteConfirmation(score)} className="text-destructive hover:text-destructive/80" aria-label="Ergebnis löschen">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

       {!isLoading && !isLoadingFilters && displayedScores.length === 0 && (
        <Card className="shadow-md mt-6">
            <CardContent className="p-6 text-center text-muted-foreground">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
                <p className="text-base">Keine Ergebnisse für die aktuellen Filterkriterien gefunden oder Suche noch nicht gestartet.</p>
                <p className="text-sm mt-1">Bitte wählen Sie Filter aus und klicken Sie auf "Ergebnisse suchen".</p>
            </CardContent>
        </Card>
       )}

      {currentScoreToEdit && (
        <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) setCurrentScoreToEdit(null); setIsFormOpen(open); }}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmitEdit}>
              <DialogHeader>
                <DialogTitle>Ergebnis bearbeiten</DialogTitle>
                <DialogDescription>
                  Bearbeiten Sie das Ergebnis für {currentScoreToEdit.shooterName} (DG {currentScoreToEdit.durchgang})
                  aus Mannschaft {currentScoreToEdit.teamName} in Liga {currentScoreToEdit.leagueName}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-6">
                <div className="space-y-1.5">
                  <Label htmlFor="editScoreValue">Ergebnis (Ringe)</Label>
                  <Input
                    id="editScoreValue"
                    type="number"
                    value={editFormScore}
                    onChange={(e) => setEditFormScore(e.target.value)}
                    required
                    className="text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editRoundValue">Durchgang</Label>
                  <NativeSelect
                    value={editFormRound}
                    onValueChange={setEditFormRound}
                    placeholder="Durchgang wählen"
                    options={[...Array(numRoundsForSelect)].map((_, i) => ({ value: (i + 1).toString(), label: `Durchgang ${i + 1}` }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ergebnistyp</Label>
                  <RadioGroup value={editFormResultType} onValueChange={(v) => setEditFormResultType(v as 'regular' | 'pre' | 'post')} className="flex space-x-4 pt-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="regular" id="edit-r-regular" />
                      <Label htmlFor="edit-r-regular">Regulär</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pre" id="edit-r-pre" />
                      <Label htmlFor="edit-r-pre">Vorschießen</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="post" id="edit-r-post" />
                      <Label htmlFor="edit-r-post">Nachschießen</Label>
                    </div>
                  </RadioGroup>
                </div>
                {currentScoreToEdit.lastEditTimestamp && (
                  <div className="text-xs text-muted-foreground pt-2">
                    Zuletzt bearbeitet von: {currentScoreToEdit.lastEditedByUserName || 'Unbekannt'} am {format((currentScoreToEdit.lastEditTimestamp as Timestamp).toDate(), 'dd.MM.yyyy HH:mm')}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setCurrentScoreToEdit(null); }}>Abbrechen</Button>
                <Button type="submit" disabled={isSubmittingEdit}>
                  {isSubmittingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Änderungen speichern
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {scoreToDelete && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ergebnis löschen bestätigen</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie das Ergebnis von {scoreToDelete.shooterName} ({scoreToDelete.totalRinge} Ringe, DG {scoreToDelete.durchgang}) wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsDeleteAlertOpen(false); setScoreToDelete(null); }}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteScore}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeletingScore} 
              >
                {isDeletingScore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Endgültig löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
