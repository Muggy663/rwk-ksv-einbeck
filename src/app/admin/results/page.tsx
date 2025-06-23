
// src/app/admin/results/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, Save, PlusCircle, Trash2, Loader, AlertCircle } from 'lucide-react';
import type { Season, League, Team, Shooter, PendingScoreEntry, ScoreEntry, FirestoreLeagueSpecificDiscipline, Club, LeagueUpdateEntry } from '@/types/rwk';
import { leagueDisciplineOptions } from '@/types/rwk';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, writeBatch, serverTimestamp, doc, documentId, addDoc, updateDoc, Timestamp } from 'firebase/firestore';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "rwk_shooters";
const SCORES_COLLECTION = "rwk_scores";
const LEAGUE_UPDATES_COLLECTION = "league_updates";

export default function AdminResultsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [availableRunningSeasons, setAvailableRunningSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [availableLeaguesForSeason, setAvailableLeaguesForSeason] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');

  const [allTeamsInSelectedLeague, setAllTeamsInSelectedLeague] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  
  const [allShootersFromDB, setAllShootersFromDB] = useState<Shooter[]>([]);
  const [shootersOfSelectedTeam, setShootersOfSelectedTeam] = useState<Shooter[]>([]);
  const [availableShootersForDropdown, setAvailableShootersForDropdown] = useState<Shooter[]>([]);
  const [selectedShooterId, setSelectedShooterId] = useState<string>('');
  
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [resultType, setResultType] = useState<'regular' | 'pre' | 'post'>("regular");
  const [score, setScore] = useState<string>('');

  const [pendingScores, setPendingScores] = useState<PendingScoreEntry[]>([]);
  const [justSavedScoreIdentifiers, setJustSavedScoreIdentifiers] = useState<{ shooterId: string; durchgang: number }[]>([]);
  const [existingScoresForTeamAndRound, setExistingScoresForTeamAndRound] = useState<ScoreEntry[]>([]);

  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingShooters, setIsLoadingShooters] = useState(false);
  const [isLoadingExistingScores, setIsLoadingExistingScores] = useState(false);
  const [isSubmittingScores, setIsSubmittingScores] = useState(false);

  const fetchMasterData = useCallback(async () => {
    console.log("AdminResultsPage: Fetching master data...");
    setIsLoadingMasterData(true);
    try {
      const seasonsSnapshot = await getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
      const fetchedSeasons = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season)).filter(s => s.id);
      setAllSeasons(fetchedSeasons);
      const running = fetchedSeasons.filter(s => s.status === 'Laufend');
      setAvailableRunningSeasons(running);
      if (running.length === 1 && !selectedSeasonId) {
        setSelectedSeasonId(running[0].id);
      } else if (running.length === 0 && !selectedSeasonId) {
        setSelectedSeasonId('');
      }

      const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      setAllLeagues(leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League)).filter(l => l.id));
      
      const shootersSnapshot = await getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("name", "asc")));
      setAllShootersFromDB(shootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shooter)).filter(s => s.id));

    } catch (error) {
      console.error("AdminResultsPage: Error fetching master data: ", error);
      toast({ title: "Fehler beim Laden der Stammdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingMasterData(false);
    }
  }, [toast, selectedSeasonId]); 

  useEffect(() => { fetchMasterData(); }, [fetchMasterData]);
  useEffect(() => {setSelectedLeagueId(''); setSelectedTeamId(''); setSelectedShooterId(''); setSelectedRound(''); setPendingScores([]); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]); }, [selectedSeasonId]);
  useEffect(() => {setSelectedTeamId(''); setSelectedShooterId(''); setSelectedRound(''); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]); }, [selectedLeagueId]);
  useEffect(() => {setSelectedShooterId(''); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]); }, [selectedTeamId]);
  useEffect(() => {setSelectedShooterId(''); setScore(''); setExistingScoresForTeamAndRound([]);}, [selectedRound]);

  useEffect(() => {
    if (selectedSeasonId && allLeagues.length > 0) {
      setIsLoadingLeagues(true);
      const leaguesForSeason = allLeagues.filter(l => l.seasonId === selectedSeasonId).sort((a,b) => (a.order || 0) - (b.order || 0));
      setAvailableLeaguesForSeason(leaguesForSeason);
      setIsLoadingLeagues(false);
    } else {
      setAvailableLeaguesForSeason([]);
    }
  }, [selectedSeasonId, allLeagues]);

  // Effekt zum Laden der Teams für die ausgewählte Liga und Saison
  // Wenn ein Durchgang ausgewählt ist, werden Teams gefiltert, bei denen alle Schützen bereits Ergebnisse haben
  useEffect(() => {
    const selectedSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (selectedLeagueId && selectedSeason && !isLoadingLeagues) {
      setIsLoadingTeams(true);
      const fetchTeams = async () => {
        try {
            // Teams für die ausgewählte Liga und Saison laden
            const teamsQuery = query(collection(db, TEAMS_COLLECTION), 
                where("leagueId", "==", selectedLeagueId), 
                where("competitionYear", "==", selectedSeason.competitionYear),
                orderBy("name", "asc")
            );
            const teamsSnapshot = await getDocs(teamsQuery);
            const fetchedTeams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)).filter(t => t.id);
            
            // Wenn kein Durchgang ausgewählt ist, alle Teams anzeigen
            if (!selectedRound) {
                setAllTeamsInSelectedLeague(fetchedTeams);
                setIsLoadingTeams(false);
                return;
            }
            
            // Wenn ein Durchgang ausgewählt ist, Teams filtern, bei denen alle Schützen bereits Ergebnisse haben
            const parsedRound = parseInt(selectedRound, 10);
            
            // Für jedes Team prüfen, ob alle Schützen bereits Ergebnisse haben
            const teamsWithFilterInfo = await Promise.all(fetchedTeams.map(async team => {
                const teamShooterIds = team.shooterIds || [];
                if (teamShooterIds.length === 0) return { team, allShootersHaveResults: false };
                
                // Ergebnisse für dieses Team und diesen Durchgang aus der Datenbank laden
                const scoresQuery = query(
                    collection(db, SCORES_COLLECTION),
                    where("teamId", "==", team.id),
                    where("durchgang", "==", parsedRound),
                    where("competitionYear", "==", selectedSeason.competitionYear)
                );
                const scoresSnapshot = await getDocs(scoresQuery);
                const existingScores = scoresSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));
                
                // Schützen-IDs mit existierenden Ergebnissen sammeln
                const shooterIdsWithResults = new Set(existingScores.map(score => score.shooterId));
                
                // Schützen mit Ergebnissen in der Zwischenliste hinzufügen
                pendingScores.forEach(ps => {
                    if (ps.teamId === team.id && ps.durchgang === parsedRound) {
                        shooterIdsWithResults.add(ps.shooterId);
                    }
                });
                
                // Schützen mit gerade gespeicherten Ergebnissen hinzufügen
                justSavedScoreIdentifiers.forEach(js => {
                    if (js.durchgang === parsedRound && teamShooterIds.includes(js.shooterId)) {
                        shooterIdsWithResults.add(js.shooterId);
                    }
                });
                
                // Prüfen, ob alle Schützen des Teams bereits Ergebnisse haben
                const allShootersHaveResults = teamShooterIds.every(id => shooterIdsWithResults.has(id));
                
                return { team, allShootersHaveResults };
            }));
            
            // Teams filtern, bei denen nicht alle Schützen bereits Ergebnisse haben
            const filteredTeams = teamsWithFilterInfo
                .filter(({ allShootersHaveResults }) => !allShootersHaveResults)
                .map(({ team }) => team);
            
            setAllTeamsInSelectedLeague(filteredTeams);
        } catch (error) {
            console.error("Error fetching teams for league:", error);
            toast({ title: "Fehler Teams laden", description: (error as Error).message, variant: "destructive" });
            setAllTeamsInSelectedLeague([]);
        } finally {
            setIsLoadingTeams(false);
        }
      };
      fetchTeams();
    } else {
      setAllTeamsInSelectedLeague([]);
    }
  }, [selectedLeagueId, selectedSeasonId, selectedRound, allSeasons, isLoadingLeagues, pendingScores, justSavedScoreIdentifiers, toast]);
  
  useEffect(() => {
    if (selectedTeamId && allShootersFromDB.length > 0 && !isLoadingTeams) {
      setIsLoadingShooters(true);
      const currentTeamData = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId);
      const shooterIdsInTeam = currentTeamData?.shooterIds?.filter(id => id) || [];
      if (shooterIdsInTeam.length > 0) {
        const shooters = allShootersFromDB.filter(sh => shooterIdsInTeam.includes(sh.id));
        setShootersOfSelectedTeam(shooters);
      } else {
        setShootersOfSelectedTeam([]);
      }
      setIsLoadingShooters(false);
    } else {
      setShootersOfSelectedTeam([]);
    }
  }, [selectedTeamId, allShootersFromDB, allTeamsInSelectedLeague, isLoadingTeams]);

  useEffect(() => {
    const fetchExistingScores = async () => {
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (!selectedTeamId || !currentSeason?.competitionYear || !selectedRound) {
        setExistingScoresForTeamAndRound([]); return;
      }
      setIsLoadingExistingScores(true);
      try {
        const scoresQuery = query(
          collection(db, SCORES_COLLECTION),
          where("teamId", "==", selectedTeamId),
          where("competitionYear", "==", currentSeason.competitionYear),
          where("durchgang", "==", parseInt(selectedRound, 10))
        );
        const snapshot = await getDocs(scoresQuery);
        const fetchedScores = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));
        setExistingScoresForTeamAndRound(fetchedScores);
      } catch (error) {
        console.error("AdminResultsPage: Error fetching existing scores: ", error);
        toast({ title: "Fehler beim Laden existierender Ergebnisse", description: (error as Error).message, variant: "destructive" });
        setExistingScoresForTeamAndRound([]);
      } finally {
        setIsLoadingExistingScores(false);
      }
    };
    if (selectedTeamId && selectedSeasonId && selectedRound) {
        fetchExistingScores();
    } else {
        setExistingScoresForTeamAndRound([]);
    }
  }, [selectedTeamId, selectedSeasonId, selectedRound, allSeasons, toast]);

   // Effekt für die Filterung der verfügbaren Schützen
  useEffect(() => {
    if (selectedTeamId && selectedRound && shootersOfSelectedTeam.length > 0 && !isLoadingExistingScores) {
      const parsedRound = parseInt(selectedRound, 10);
      const shootersInPendingThisRound = pendingScores.filter(ps => ps.teamId === selectedTeamId && ps.durchgang === parsedRound).map(ps => ps.shooterId);
      const shootersInJustSavedThisRound = justSavedScoreIdentifiers.filter(js => js.durchgang === parsedRound && shootersOfSelectedTeam.some(s => s.id === js.shooterId)).map(js => js.shooterId);
      const shootersInExistingScoresThisRound = existingScoresForTeamAndRound.filter(es => es.durchgang === parsedRound).map(es => es.shooterId);
      
      const filtered = shootersOfSelectedTeam.filter(sh => 
        sh.id && !shootersInPendingThisRound.includes(sh.id) &&
        !shootersInJustSavedThisRound.includes(sh.id) &&
        !shootersInExistingScoresThisRound.includes(sh.id)
      );
      setAvailableShootersForDropdown(filtered);
    } else {
      setAvailableShootersForDropdown([]);
    }
  }, [selectedTeamId, selectedRound, shootersOfSelectedTeam, pendingScores, justSavedScoreIdentifiers, existingScoresForTeamAndRound, isLoadingExistingScores]);

  const handleAddToList = () => {
    if (!user) { toast({ title: "Nicht angemeldet", variant: "destructive" }); return; }
    if (!selectedShooterId || !selectedRound || !score || !selectedSeasonId || !selectedLeagueId || !selectedTeamId ) {
      toast({ title: "Fehlende Eingabe", description: "Bitte alle Felder ausfüllen.", variant: "destructive" }); return;
    }
    
    const scoreVal = parseInt(score);
    const season = allSeasons.find(s => s.id === selectedSeasonId);
    const league = availableLeaguesForSeason.find(l => l.id === selectedLeagueId);
    const team = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId);
    const shooter = allShootersFromDB.find(sh => sh.id === selectedShooterId);

    if (!season || !league || !team || !shooter || !team.clubId) {
      toast({ title: "Fehler", description: "Ausgewählte Daten unvollständig (Saison, Liga, Team, Schütze, Team ClubID).", variant: "destructive" }); return;
    }

    let maxPossibleScore = 300;
    const fourHundredPointDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
    if (fourHundredPointDisciplines.includes(league.type)) maxPossibleScore = 400;

    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxPossibleScore) {
      toast({ title: "Ungültiges Ergebnis", description: `Ringzahl (0-${maxPossibleScore}).`, variant: "destructive" }); return;
    }
    
    const parsedRound = parseInt(selectedRound, 10);
    if (pendingScores.some(ps => ps.shooterId === selectedShooterId && ps.durchgang === parsedRound && ps.teamId === selectedTeamId) || 
        justSavedScoreIdentifiers.some(js => js.shooterId === selectedShooterId && js.durchgang === parsedRound) ||
        existingScoresForTeamAndRound.some(es => es.shooterId === selectedShooterId && es.durchgang === parsedRound)) {
      toast({ title: "Ergebnis existiert bereits", variant: "warning"}); return;
    }

    const newPendingEntry: PendingScoreEntry = {
      tempId: new Date().toISOString() + Math.random().toString(36).substring(2, 15),
      seasonId: selectedSeasonId, seasonName: season.name, leagueId: selectedLeagueId, leagueName: league.name, leagueType: league.type,
      teamId: selectedTeamId, teamName: team.name, clubId: team.clubId, shooterId: selectedShooterId, shooterName: shooter.name, 
      shooterGender: shooter.gender, durchgang: parsedRound, totalRinge: scoreVal, scoreInputType: resultType, competitionYear: season.competitionYear,
    };
    setPendingScores(prev => [...prev, newPendingEntry]);
    toast({ title: "Ergebnis hinzugefügt" });
    setSelectedShooterId(''); setScore(''); 
  };

  const handleRemoveFromList = (tempId: string) => {
    setPendingScores(prev => prev.filter(p => p.tempId !== tempId));
    toast({ title: "Eintrag entfernt", variant: "destructive" });
  };

  const handleFinalSave = async () => {
    if (!user) { toast({ title: "Nicht angemeldet", variant: "destructive" }); return; }
    if (pendingScores.length === 0) { toast({ title: "Keine Ergebnisse", variant: "destructive" }); return; }
    setIsSubmittingScores(true);
    const batch = writeBatch(db);
    const newlySavedIdentifiers: { shooterId: string; durchgang: number }[] = [];
    const leagueUpdatesToProcess = new Map<string, { leagueId: string, leagueName: string, leagueType: FirestoreLeagueSpecificDiscipline, competitionYear: number }>();

    pendingScores.forEach(entry => {
      const key = `${entry.leagueId}_${entry.competitionYear}`;
      if (!leagueUpdatesToProcess.has(key) && entry.leagueType && entry.leagueName && entry.competitionYear !== undefined) {
        leagueUpdatesToProcess.set(key, { leagueId: entry.leagueId, leagueName: entry.leagueName, leagueType: entry.leagueType, competitionYear: entry.competitionYear });
      }
    });

    try {
        pendingScores.forEach((entry) => {
            const { tempId, ...dataToSave } = entry;
            const scoreDocRef = doc(collection(db, SCORES_COLLECTION)); 
            const scoreDataForDb: Omit<ScoreEntry, 'id' | 'entryTimestamp' | 'enteredByUserId' | 'enteredByUserName'> = {...dataToSave};
            batch.set(scoreDocRef, {
                ...scoreDataForDb, enteredByUserId: user.uid, enteredByUserName: user.displayName || user.email || "Unbekannt", entryTimestamp: serverTimestamp()
            });
            newlySavedIdentifiers.push({ shooterId: entry.shooterId, durchgang: entry.durchgang });
        });

        for (const updateInfo of leagueUpdatesToProcess.values()) {
            const today = new Date();
            const startOfDay = Timestamp.fromDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
            const endOfDay = Timestamp.fromDate(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));
            const q = query(collection(db, LEAGUE_UPDATES_COLLECTION),
                where("leagueId", "==", updateInfo.leagueId), where("competitionYear", "==", updateInfo.competitionYear),
                where("timestamp", ">=", startOfDay), where("timestamp", "<=", endOfDay)
            );
            const existingUpdatesSnapshot = await getDocs(q);
            if (!existingUpdatesSnapshot.empty) {
                batch.update(existingUpdatesSnapshot.docs[0].ref, { timestamp: serverTimestamp() });
            } else {
                const leagueUpdateData: Omit<LeagueUpdateEntry, 'id'> = {...updateInfo, timestamp: serverTimestamp(), action: 'results_added'};
                batch.set(doc(collection(db, LEAGUE_UPDATES_COLLECTION)), leagueUpdateData);
            }
        }

        await batch.commit();
        toast({ title: "Ergebnisse gespeichert" });
        setPendingScores([]);
        setJustSavedScoreIdentifiers(prev => [...prev, ...newlySavedIdentifiers]);
        
        const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
        if (selectedTeamId && currentSeason?.competitionYear && selectedRound) {
            setIsLoadingExistingScores(true);
            const scoresQuery = query( collection(db, SCORES_COLLECTION),
              where("teamId", "==", selectedTeamId), where("competitionYear", "==", currentSeason.competitionYear),
              where("durchgang", "==", parseInt(selectedRound, 10))
            );
            const snapshot = await getDocs(scoresQuery);
            setExistingScoresForTeamAndRound(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry))); 
            setIsLoadingExistingScores(false);
        }
    } catch (error) {
        console.error("Error saving scores to Firestore: ", error);
        toast({ title: "Fehler beim Speichern", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsSubmittingScores(false);
    }
  };

  const selectedLeagueObject = availableLeaguesForSeason.find(l => l.id === selectedLeagueId); 
  let numRoundsForSelect = 5;
  if (selectedLeagueObject) {
    const fourHundredPointDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
    if (fourHundredPointDisciplines.includes(selectedLeagueObject.type)) numRoundsForSelect = 4;
  }
  
  if (isLoadingMasterData) {
    return <div className="flex justify-center items-center py-12"><Loader className="h-12 w-12 animate-spin text-primary mr-3" /><p>Lade Grunddaten...</p></div>;
  }
  if (availableRunningSeasons.length === 0 && !isLoadingMasterData) {
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center"><h1 className="text-2xl font-semibold text-primary">Ergebniserfassung</h1></div>
        <Card className="shadow-md border-amber-500">
            <CardHeader><CardTitle className="text-amber-600 flex items-center"><AlertCircle className="mr-2 h-5 w-5" />Keine laufenden Saisons</CardTitle></CardHeader>
            <CardContent><p>Aktuell sind keine Saisons mit Status "Laufend" für die Ergebniserfassung verfügbar.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-semibold text-primary">Ergebniserfassung</h1></div>
      <Card className="shadow-md">
        <CardHeader><CardTitle>Einzelergebnis zur Liste hinzufügen</CardTitle><CardDescription>Wählen Sie Parameter und fügen Sie Ergebnisse hinzu.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="season">Saison (nur laufende)</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId} disabled={availableRunningSeasons.length === 0}>
                <SelectTrigger id="season"><SelectValue placeholder={availableRunningSeasons.length === 0 ? "Keine Saisons" : "Saison wählen"} /></SelectTrigger>
                <SelectContent>{availableRunningSeasons.filter(s => s.id).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="league">Liga</Label>
              <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId} disabled={!selectedSeasonId || isLoadingLeagues || availableLeaguesForSeason.length === 0}>
                <SelectTrigger id="league"><SelectValue placeholder={isLoadingLeagues ? "Lade Ligen..." : (availableLeaguesForSeason.length === 0 && selectedSeasonId ? "Keine Ligen für Saison" : "Liga wählen")} /></SelectTrigger>
                <SelectContent>{availableLeaguesForSeason.filter(l => l.id).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"> {/* Durchgang vor Mannschaft */}
              <Label htmlFor="round">Durchgang</Label>
              <Select value={selectedRound} onValueChange={(value) => { setSelectedRound(value);}} disabled={!selectedLeagueId}>
                <SelectTrigger id="round"><SelectValue placeholder="Durchgang wählen" /></SelectTrigger>
                <SelectContent>{[...Array(numRoundsForSelect)].map((_, i) => (<SelectItem key={i + 1} value={(i + 1).toString()}>Durchgang {i + 1}</SelectItem>))}</SelectContent>
              </Select>
            </div>
             <div className="space-y-2"> {/* Mannschaft nach Durchgang */}
              <Label htmlFor="team">Mannschaft</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={!selectedLeagueId || isLoadingTeams || !selectedRound || allTeamsInSelectedLeague.length === 0}>
                <SelectTrigger id="team"><SelectValue placeholder={isLoadingTeams ? "Lade Teams..." : (!selectedRound ? "Durchgang wählen" : (allTeamsInSelectedLeague.length === 0 && selectedLeagueId && selectedRound ? "Alle Teams vollständig erfasst" : "Mannschaft wählen"))} /></SelectTrigger>
                <SelectContent>{allTeamsInSelectedLeague.filter(t => t.id).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shooter">Schütze</Label>
              <Select value={selectedShooterId} onValueChange={setSelectedShooterId} disabled={!selectedTeamId || isLoadingShooters || isLoadingExistingScores || (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound)}>
                <SelectTrigger id="shooter"><SelectValue placeholder={isLoadingShooters || isLoadingExistingScores ? "Lade Schützen..." : (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound ? "Alle erfasst/keine" : "Schütze wählen")} /></SelectTrigger>
                <SelectContent>{availableShootersForDropdown.filter(sh => sh.id).map(sh => <SelectItem key={sh.id} value={sh.id}>{sh.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Ergebnis (Ringe)</Label>
              <Input id="score" type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="z.B. 285" disabled={!selectedShooterId}/>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <Label>Ergebnistyp</Label>
            <RadioGroup value={resultType} onValueChange={(value) => setResultType(value as "regular" | "pre" | "post")} className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2"><RadioGroupItem value="regular" id="r-regular" /><Label htmlFor="r-regular">Regulär</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="pre" id="r-pre" /><Label htmlFor="r-pre">Vorschießen</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="post" id="r-post" /><Label htmlFor="r-post">Nachschießen</Label></div>
            </RadioGroup>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleAddToList} disabled={!selectedShooterId || !selectedRound || !score || isSubmittingScores || isLoadingExistingScores}><PlusCircle className="mr-2 h-5 w-5" /> Zur Liste hinzufügen</Button>
          </div>
        </CardContent>
      </Card>

      {pendingScores.length > 0 && (
        <Card className="shadow-md mt-6">
          <CardHeader><CardTitle>Vorgemerkte Ergebnisse ({pendingScores.length})</CardTitle><CardDescription>Saison: {allSeasons.find(s=>s.id === selectedSeasonId)?.name || '-'} | Liga: {allLeagues.find(l=>l.id===selectedLeagueId)?.name || '-'}</CardDescription></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Schütze</TableHead><TableHead>Mannschaft</TableHead><TableHead className="text-center">DG</TableHead><TableHead className="text-center">Ringe</TableHead><TableHead>Typ</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
              <TableBody>{pendingScores.map((entry) => (<TableRow key={entry.tempId}><TableCell>{entry.shooterName}</TableCell><TableCell>{entry.teamName}</TableCell><TableCell className="text-center">{entry.durchgang}</TableCell><TableCell className="text-center">{entry.totalRinge}</TableCell><TableCell>{entry.scoreInputType === 'pre' ? 'Vorschuss' : entry.scoreInputType === 'post' ? 'Nachschuss' : 'Regulär'}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleRemoveFromList(entry.tempId)} className="text-destructive hover:text-destructive/80" disabled={isSubmittingScores}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
            <div className="flex justify-end pt-6"><Button onClick={handleFinalSave} size="lg" disabled={isSubmittingScores || pendingScores.length === 0}>{isSubmittingScores && <Loader className="mr-2 h-4 w-4 animate-spin" />} Alle {pendingScores.length} Ergebnisse speichern</Button></div>
          </CardContent>
        </Card>
      )}
       {pendingScores.length === 0 && !isLoadingMasterData && (
         <div className="mt-8 p-6 text-center text-muted-foreground bg-secondary/30 rounded-md"><CheckSquare className="mx-auto h-10 w-10 mb-3 text-primary/70" /><p className="text-base">Noch keine Ergebnisse zur Speicherung vorgemerkt.</p></div>
       )}
    </div>
  );
}
