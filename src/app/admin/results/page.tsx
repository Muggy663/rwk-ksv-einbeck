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
import { CheckSquare, Save, PlusCircle, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import type { Season, League, Team, Shooter, PendingScoreEntry, ScoreEntry, FirestoreLeagueSpecificDiscipline, Club, LeagueUpdateEntry } from '@/types/rwk';
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

  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [availableTeamsForLeague, setAvailableTeamsForLeague] = useState<Team[]>([]);
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
      const fetchedSeasons = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
      setAllSeasons(fetchedSeasons);
      const running = fetchedSeasons.filter(s => s.status === 'Laufend');
      setAvailableRunningSeasons(running);
      console.log(`AdminResultsPage: Fetched ${fetchedSeasons.length} seasons, ${running.length} are running.`);
      if (running.length === 1 && !selectedSeasonId) {
        setSelectedSeasonId(running[0].id);
      } else if (running.length === 0 && !selectedSeasonId) {
        setSelectedSeasonId('');
      }

      const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      setAllLeagues(leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League)));
      console.log(`AdminResultsPage: Fetched ${leaguesSnapshot.docs.length} leagues.`);

      const teamsSnapshot = await getDocs(query(collection(db, TEAMS_COLLECTION), orderBy("name", "asc")));
      setAllTeams(teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
      console.log(`AdminResultsPage: Fetched ${teamsSnapshot.docs.length} teams.`);
      
      const shootersSnapshot = await getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("name", "asc")));
      setAllShootersFromDB(shootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shooter)));
      console.log(`AdminResultsPage: Fetched ${shootersSnapshot.docs.length} shooters.`);

    } catch (error) {
      console.error("AdminResultsPage: Error fetching master data: ", error);
      toast({ title: "Fehler beim Laden der Stammdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingMasterData(false);
    }
  }, [toast, selectedSeasonId]); 

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    setSelectedLeagueId('');
    // setPendingScores([]); // Keep pending scores if they are for a different context, but usually it's better to clear
    setJustSavedScoreIdentifiers([]);
    setExistingScoresForTeamAndRound([]);
  }, [selectedSeasonId]);

  useEffect(() => {
    setSelectedTeamId('');
    // setPendingScores([]); // Keep pending scores when league changes
    setJustSavedScoreIdentifiers([]);
    setExistingScoresForTeamAndRound([]);
  }, [selectedLeagueId]);
  
  useEffect(() => {
    setSelectedShooterId('');
    // Do NOT clear pendingScores when team changes, they might be for this team
    setJustSavedScoreIdentifiers([]);
    setExistingScoresForTeamAndRound([]);
  }, [selectedTeamId]);

  useEffect(() => {
    setSelectedShooterId(''); 
    setScore('');
    setExistingScoresForTeamAndRound([]); // Clear existing scores when round changes
    // Keep justSavedIdentifiers if only round changes, might be adding more scores for same team
  }, [selectedRound]);


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

  useEffect(() => {
    const selectedSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (selectedLeagueId && selectedSeason && allTeams.length > 0) {
      setIsLoadingTeams(true);
      const teamsForLeague = allTeams.filter(t => t.leagueId === selectedLeagueId && t.competitionYear === selectedSeason.competitionYear);
      setAvailableTeamsForLeague(teamsForLeague);
      setIsLoadingTeams(false);
    } else {
      setAvailableTeamsForLeague([]);
    }
  }, [selectedLeagueId, selectedSeasonId, allSeasons, allTeams]);
  
  useEffect(() => {
    if (selectedTeamId && allShootersFromDB.length > 0) {
      setIsLoadingShooters(true);
      const currentTeamData = availableTeamsForLeague.find(t => t.id === selectedTeamId);
      const shooterIdsInTeam = currentTeamData?.shooterIds || [];
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
  }, [selectedTeamId, allShootersFromDB, availableTeamsForLeague]);

  useEffect(() => {
    const fetchExistingScores = async () => {
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (!selectedTeamId || !currentSeason?.competitionYear || !selectedRound) {
        setExistingScoresForTeamAndRound([]);
        return;
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
        console.log(`AdminResultsPage: Fetched ${fetchedScores.length} existing scores for team ${selectedTeamId}, round ${selectedRound}.`);
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


   useEffect(() => {
    if (selectedTeamId && selectedRound && shootersOfSelectedTeam.length > 0) {
      const parsedRound = parseInt(selectedRound, 10);
      
      const shootersInPendingThisRound = pendingScores
        .filter(ps => ps.teamId === selectedTeamId && ps.durchgang === parsedRound)
        .map(ps => ps.shooterId);

      const shootersInJustSavedThisRound = justSavedScoreIdentifiers
        .filter(js => js.durchgang === parsedRound) 
        .map(js => js.shooterId);
      
      const shootersInExistingScoresThisRound = existingScoresForTeamAndRound 
        .filter(es => es.durchgang === parsedRound)
        .map(es => es.shooterId);
      
      const filtered = shootersOfSelectedTeam.filter(sh => 
        !shootersInPendingThisRound.includes(sh.id) &&
        !shootersInJustSavedThisRound.includes(sh.id) &&
        !shootersInExistingScoresThisRound.includes(sh.id)
      );
      setAvailableShootersForDropdown(filtered);
    } else {
      setAvailableShootersForDropdown([]);
    }
  }, [selectedTeamId, selectedRound, shootersOfSelectedTeam, pendingScores, justSavedScoreIdentifiers, existingScoresForTeamAndRound]);


  const handleAddToList = () => {
    if (!user) {
      toast({ title: "Nicht angemeldet", description: "Bitte melden Sie sich an, um Ergebnisse zu erfassen.", variant: "destructive" });
      return;
    }
    if (!selectedShooterId || !selectedRound || !score || !selectedSeasonId || !selectedLeagueId || !selectedTeamId ) {
      toast({ title: "Fehlende Eingabe", description: "Bitte alle Felder ausfüllen.", variant: "destructive" });
      return;
    }
    const scoreVal = parseInt(score);
    
    const season = allSeasons.find(s => s.id === selectedSeasonId);
    const league = availableLeaguesForSeason.find(l => l.id === selectedLeagueId);
    const team = availableTeamsForLeague.find(t => t.id === selectedTeamId);
    const shooter = allShootersFromDB.find(sh => sh.id === selectedShooterId);

    if (!season || !league || !team || !shooter) {
      toast({ title: "Fehler", description: "Ausgewählte Daten konnten nicht vollständig geladen werden. Bitte Auswahl überprüfen.", variant: "destructive" });
      return;
    }

    const leagueSpecificType = league.type as FirestoreLeagueSpecificDiscipline;
    let maxPossibleScore = 300; // Default for KK
    if (['LG', 'LGA', 'LP', 'LPA'].includes(leagueSpecificType)) {
        maxPossibleScore = 400;
    }

    if (isNaN(scoreVal) || scoreVal < 0 ) {
      toast({ title: "Ungültiges Ergebnis", description: `Bitte eine gültige, nicht-negative Ringzahl eingeben.`, variant: "destructive" });
      return;
    }
    if (scoreVal > maxPossibleScore) {
      toast({ title: "Ungültiges Ergebnis", description: `Die Ringzahl darf für diese Disziplin maximal ${maxPossibleScore} betragen.`, variant: "destructive" });
      return;
    }
    
    const parsedRound = parseInt(selectedRound, 10);
    const alreadyPending = pendingScores.find(ps => ps.teamId === selectedTeamId && ps.shooterId === selectedShooterId && ps.durchgang === parsedRound);
    if (alreadyPending) {
        toast({ title: "Bereits vorgemerkt", description: `${shooter.name} hat bereits ein Ergebnis für DG ${selectedRound} in der Liste.`, variant: "warning"});
        return;
    }
    
    const alreadySavedThisSession = justSavedScoreIdentifiers.find(js => js.shooterId === selectedShooterId && js.durchgang === parsedRound);
    if (alreadySavedThisSession) {
      toast({ title: "Bereits gespeichert (Sitzung)", description: `${shooter.name} hat bereits ein Ergebnis für DG ${selectedRound} in dieser Sitzung gespeichert.`, variant: "warning"});
      return;
    }

    const alreadyInDB = existingScoresForTeamAndRound.find(es => es.shooterId === selectedShooterId && es.durchgang === parsedRound);
     if (alreadyInDB) {
      toast({ title: "Bereits in DB vorhanden", description: `${shooter.name} hat bereits ein Ergebnis für DG ${selectedRound} in der Datenbank.`, variant: "warning"});
      return;
    }

    const newPendingEntry: PendingScoreEntry = {
      tempId: new Date().toISOString() + Math.random().toString(36).substring(2, 15),
      seasonId: selectedSeasonId,
      seasonName: season.name,
      leagueId: selectedLeagueId,
      leagueName: league.name,
      leagueType: league.type,
      teamId: selectedTeamId,
      teamName: team.name,
      clubId: team.clubId,
      shooterId: selectedShooterId,
      shooterName: shooter.name,
      shooterGender: shooter.gender,
      durchgang: parsedRound,
      totalRinge: scoreVal,
      scoreInputType: resultType,
      competitionYear: season.competitionYear,
    };

    setPendingScores(prev => [...prev, newPendingEntry]);
    toast({ title: "Ergebnis hinzugefügt", description: `${shooter.name} - Runde ${selectedRound}: ${scoreVal} Ringe zur Liste hinzugefügt.` });
    
    setSelectedShooterId(''); 
    setScore(''); 
  };

  const handleRemoveFromList = (tempId: string) => {
    setPendingScores(prev => prev.filter(p => p.tempId !== tempId));
    toast({ title: "Eintrag entfernt", description: "Ergebnis aus der Liste entfernt.", variant: "destructive" });
  };

  const handleFinalSave = async () => {
    if (!user) {
      toast({ title: "Nicht angemeldet", description: "Bitte melden Sie sich an.", variant: "destructive" });
      return;
    }
    if (pendingScores.length === 0) {
      toast({ title: "Keine Ergebnisse", description: "Es gibt keine Ergebnisse zum Speichern.", variant: "destructive" });
      return;
    }
    setIsSubmittingScores(true);
    const batch = writeBatch(db);
    const newlySavedIdentifiers: { shooterId: string; durchgang: number }[] = [];
    
    const leagueUpdatesToProcess = new Map<string, { leagueId: string, leagueName: string, leagueType: FirestoreLeagueSpecificDiscipline, competitionYear: number }>();

    pendingScores.forEach(entry => {
      const key = `${entry.leagueId}_${entry.competitionYear}`;
      if (!leagueUpdatesToProcess.has(key) && entry.leagueType) {
        leagueUpdatesToProcess.set(key, {
          leagueId: entry.leagueId,
          leagueName: entry.leagueName || "Unbek. Liga",
          leagueType: entry.leagueType,
          competitionYear: entry.competitionYear
        });
      }
    });


    try {
        pendingScores.forEach((entry) => {
            const { tempId, ...dataToSave } = entry;
            const scoreDocRef = doc(collection(db, SCORES_COLLECTION)); 
            
            const scoreDataForDb: Omit<ScoreEntry, 'id' | 'entryTimestamp' | 'enteredByUserId' | 'enteredByUserName'> = {
                seasonId: dataToSave.seasonId,
                seasonName: dataToSave.seasonName || "N/A",
                leagueId: dataToSave.leagueId,
                leagueName: dataToSave.leagueName || "N/A",
                leagueType: dataToSave.leagueType as FirestoreLeagueSpecificDiscipline, 
                teamId: dataToSave.teamId,
                teamName: dataToSave.teamName || "N/A",
                clubId: dataToSave.clubId || "N/A",
                shooterId: dataToSave.shooterId,
                shooterName: dataToSave.shooterName || "N/A",
                shooterGender: dataToSave.shooterGender || "unknown",
                durchgang: dataToSave.durchgang,
                totalRinge: dataToSave.totalRinge,
                scoreInputType: dataToSave.scoreInputType,
                competitionYear: dataToSave.competitionYear,
            };
            
            batch.set(scoreDocRef, {
                ...scoreDataForDb,
                enteredByUserId: user.uid,
                enteredByUserName: user.displayName || user.email || "Unbekannt",
                entryTimestamp: serverTimestamp()
            });
            newlySavedIdentifiers.push({ shooterId: entry.shooterId, durchgang: entry.durchgang });
        });

        for (const updateInfo of leagueUpdatesToProcess.values()) {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

            const q = query(
                collection(db, LEAGUE_UPDATES_COLLECTION),
                where("leagueId", "==", updateInfo.leagueId),
                where("competitionYear", "==", updateInfo.competitionYear),
                where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
                where("timestamp", "<=", Timestamp.fromDate(endOfDay))
            );
            const existingUpdatesSnapshot = await getDocs(q);

            if (!existingUpdatesSnapshot.empty) {
                const existingUpdateDocRef = existingUpdatesSnapshot.docs[0].ref;
                batch.update(existingUpdateDocRef, { timestamp: serverTimestamp() });
                console.log("AdminResultsPage: Updated existing league update entry for leagueId", updateInfo.leagueId);
            } else {
                const leagueUpdateData: Omit<LeagueUpdateEntry, 'id'> = {
                    leagueId: updateInfo.leagueId,
                    leagueName: updateInfo.leagueName,
                    leagueType: updateInfo.leagueType, 
                    competitionYear: updateInfo.competitionYear,
                    timestamp: serverTimestamp(),
                    action: 'results_added',
                };
                const leagueUpdateDocRef = doc(collection(db, LEAGUE_UPDATES_COLLECTION));
                batch.set(leagueUpdateDocRef, leagueUpdateData);
                console.log("AdminResultsPage: Added new league update entry for leagueId", updateInfo.leagueId);
            }
        }

        await batch.commit();
        toast({ title: "Ergebnisse gespeichert", description: `${pendingScores.length} Ergebnisse wurden erfolgreich in der Datenbank gespeichert.` });
        setPendingScores([]);
        setJustSavedScoreIdentifiers(prev => [...prev, ...newlySavedIdentifiers]);
        
        const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
        if (selectedTeamId && currentSeason?.competitionYear && selectedRound) {
            setIsLoadingExistingScores(true);
            const scoresQuery = query(
              collection(db, SCORES_COLLECTION),
              where("teamId", "==", selectedTeamId),
              where("competitionYear", "==", currentSeason.competitionYear),
              where("durchgang", "==", parseInt(selectedRound, 10))
            );
            const snapshot = await getDocs(scoresQuery);
            const fetchedScores = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));
            setExistingScoresForTeamAndRound(fetchedScores); 
            setIsLoadingExistingScores(false);
        }

    } catch (error) {
        console.error("Error saving scores to Firestore: ", error);
        toast({ title: "Fehler beim Speichern", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsSubmittingScores(false);
    }
  };

  const selectedSeasonObject = allSeasons.find(s => s.id === selectedSeasonId);
  const selectedLeagueObject = availableLeaguesForSeason.find(l => l.id === selectedLeagueId); 
  const selectedTeamObject = availableTeamsForLeague.find(t => t.id === selectedTeamId);

  let numRoundsForSelect = 5; // Default KK
  if (selectedLeagueObject) {
    const lgLpTypes: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
    if (lgLpTypes.includes(selectedLeagueObject.type)) {
      numRoundsForSelect = 4; // 4 Durchgänge für Luftdruck
    }
  }


  if (isLoadingMasterData) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mr-3" />
        <p>Lade Grunddaten für Ergebniserfassung...</p>
      </div>
    );
  }

  if (availableRunningSeasons.length === 0 && !isLoadingMasterData) {
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung</h1>
        </div>
        <Card className="shadow-md border-amber-500">
            <CardHeader>
                <CardTitle className="text-amber-600 flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Keine laufenden Saisons</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Aktuell sind keine Saisons mit dem Status "Laufend" für die Ergebniserfassung verfügbar.</p>
                <p>Bitte überprüfen Sie die <a href="/admin/seasons" className="underline hover:text-primary">Saisonverwaltung</a> oder legen Sie eine neue laufende Saison an.</p>
            </CardContent>
        </Card>
      </div>
    );
  }
  

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung</h1>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Einzelergebnis zur Liste hinzufügen</CardTitle>
          <CardDescription>
            Wählen Sie die notwendigen Parameter und fügen Sie Ergebnisse hinzu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="season">Saison (nur laufende)</Label>
              <Select 
                value={selectedSeasonId} 
                onValueChange={(value) => setSelectedSeasonId(value)} 
                disabled={availableRunningSeasons.length === 0}
              >
                <SelectTrigger id="season"><SelectValue placeholder="Saison wählen" /></SelectTrigger>
                <SelectContent>
                  {availableRunningSeasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="league">Liga</Label>
              <Select 
                value={selectedLeagueId} 
                onValueChange={(value) => setSelectedLeagueId(value)} 
                disabled={!selectedSeasonId || isLoadingLeagues}
              >
                <SelectTrigger id="league">
                    <SelectValue placeholder={isLoadingLeagues ? "Lade Ligen..." : (availableLeaguesForSeason.length === 0 && selectedSeasonId ? "Keine Ligen für Saison" : "Liga wählen")} />
                </SelectTrigger>
                <SelectContent>
                  {availableLeaguesForSeason.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="team">Mannschaft</Label>
              <Select 
                value={selectedTeamId} 
                onValueChange={(value) => setSelectedTeamId(value)} 
                disabled={!selectedLeagueId || isLoadingTeams}
              >
                <SelectTrigger id="team">
                    <SelectValue placeholder={isLoadingTeams ? "Lade Mannschaften..." : (availableTeamsForLeague.length === 0 && selectedLeagueId ? "Keine Teams für Liga" : "Mannschaft wählen")} />
                </SelectTrigger>
                <SelectContent>
                  {availableTeamsForLeague.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="round">Durchgang</Label>
              <Select 
                value={selectedRound} 
                onValueChange={(value) => { setSelectedRound(value);}} 
                disabled={!selectedTeamId}
              >
                <SelectTrigger id="round"><SelectValue placeholder="Durchgang wählen" /></SelectTrigger>
                <SelectContent>
                  {[...Array(numRoundsForSelect)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>Durchgang {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shooter">Schütze</Label>
              <Select 
                value={selectedShooterId} 
                onValueChange={setSelectedShooterId} 
                disabled={!selectedRound || isLoadingShooters || isLoadingExistingScores || (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound)}
              >
                <SelectTrigger id="shooter">
                  <SelectValue 
                    placeholder={
                        isLoadingShooters || isLoadingExistingScores ? "Lade Schützen/Ergebnisse..." : 
                        (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound ? "Alle Schützen erfasst/keine" : "Schütze wählen")} 
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableShootersForDropdown.map(sh => <SelectItem key={sh.id} value={sh.id}>{sh.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Ergebnis (Ringe)</Label>
              <Input 
                id="score" 
                type="number" 
                value={score} 
                onChange={(e) => setScore(e.target.value)} 
                placeholder="z.B. 285" 
                disabled={!selectedShooterId}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Label>Ergebnistyp</Label>
            <RadioGroup value={resultType} onValueChange={(value) => setResultType(value as "regular" | "pre" | "post")} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="regular" id="r-regular" />
                <Label htmlFor="r-regular">Regulär</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pre" id="r-pre" />
                <Label htmlFor="r-pre">Vorschießen</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="post" id="r-post" />
                <Label htmlFor="r-post">Nachschießen</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={handleAddToList} disabled={!selectedShooterId || !selectedRound || !score || isSubmittingScores || isLoadingExistingScores}>
                <PlusCircle className="mr-2 h-5 w-5" /> Zur Liste hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {pendingScores.length > 0 && (
        <Card className="shadow-md mt-6">
          <CardHeader>
            <CardTitle>Vorgemerkte Ergebnisse ({pendingScores.length})</CardTitle>
            <CardDescription>
              Saison: {selectedSeasonObject?.name || '-'} | Liga: {selectedLeagueObject?.name || '-'} | Mannschaft: {selectedTeamObject?.name || '-'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schütze</TableHead>
                  <TableHead className="text-center">DG</TableHead>
                  <TableHead className="text-center">Ringe</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingScores.map((entry) => (
                  <TableRow key={entry.tempId}>
                    <TableCell>{entry.shooterName}</TableCell>
                    <TableCell className="text-center">{entry.durchgang}</TableCell>
                    <TableCell className="text-center">{entry.totalRinge}</TableCell>
                    <TableCell>{entry.scoreInputType === 'pre' ? 'Vorschuss' : entry.scoreInputType === 'post' ? 'Nachschuss' : 'Regulär'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveFromList(entry.tempId)} className="text-destructive hover:text-destructive/80" disabled={isSubmittingScores}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end pt-6">
              <Button onClick={handleFinalSave} size="lg" disabled={isSubmittingScores || pendingScores.length === 0}>
                  {isSubmittingScores && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Alle {pendingScores.length} Ergebnisse speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
       {pendingScores.length === 0 && (
         <div className="mt-8 p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
            <CheckSquare className="mx-auto h-10 w-10 mb-3 text-primary/70" />
            <p className="text-base">Noch keine Ergebnisse zur Speicherung vorgemerkt.</p>
            <p className="text-sm mt-1">Füllen Sie das Formular oben aus und klicken Sie auf "Zur Liste hinzufügen".</p>
          </div>
       )}
    </div>
  );
}
