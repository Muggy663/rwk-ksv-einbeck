// src/app/verein/ergebnisse/page.tsx
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
import type { Season, League, Team, Shooter, PendingScoreEntry, ScoreEntry, FirestoreLeagueSpecificDiscipline, Club, LeagueUpdateEntry, UserPermission } from '@/types/rwk';
import { useVereinAuth } from '@/app/verein/layout';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, writeBatch, serverTimestamp, doc, documentId, getDoc, Timestamp } from 'firebase/firestore';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "rwk_shooters";
const SCORES_COLLECTION = "rwk_scores";
const CLUBS_COLLECTION = "clubs";
const LEAGUE_UPDATES_COLLECTION = "league_updates";

export default function VereinErgebnissePage() {
  const { userPermission, loadingPermissions: authLoading, permissionError } = useVereinAuth();
  const { toast } = useToast();

  const [activeClubIdForEntry, setActiveClubIdForEntry] = useState<string>('');
  const [assignedClubsForSelect, setAssignedClubsForSelect] = useState<Array<{ id: string; name: string }>>([]);
  const [activeClubName, setActiveClubName] = useState<string | null>(null);

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [availableRunningSeasons, setAvailableRunningSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  const [leaguesForActiveClubAndSeason, setLeaguesForActiveClubAndSeason] = useState<League[]>([]);
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

  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isLoadingAssignedClubDetails, setIsLoadingAssignedClubDetails] = useState(false);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingShooters, setIsLoadingShooters] = useState(false);
  const [isLoadingExistingScores, setIsLoadingExistingScores] = useState(false);
  const [isSubmittingScores, setIsSubmittingScores] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (userPermission && userPermission.clubIds && userPermission.clubIds.length > 0) {
      setIsLoadingAssignedClubDetails(true);
      const fetchClubDetails = async () => {
        try {
          const clubPromises = userPermission.clubIds!.map(id => getDoc(doc(db, CLUBS_COLLECTION, id)));
          const clubSnaps = await Promise.all(clubPromises);
          const clubsData = clubSnaps
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, name: (snap.data() as Club).name || "Unbek. Verein" }));
          setAssignedClubsForSelect(clubsData);
          if (clubsData.length === 1) {
            setActiveClubIdForEntry(clubsData[0].id);
            setActiveClubName(clubsData[0].name);
          } else if (clubsData.length === 0) {
             toast({ title: "Fehler Vereinszuweisung", description: "Ihrem Konto sind keine gültigen Vereine für die Ergebniserfassung zugewiesen.", variant: "destructive" });
          }
        } catch (error) {
          console.error("Error fetching assigned club details for VV results:", error);
          toast({ title: "Fehler", description: "Vereinsdetails konnten nicht geladen werden.", variant: "destructive" });
        } finally {
          setIsLoadingAssignedClubDetails(false);
        }
      };
      fetchClubDetails();
    } else if (!authLoading && (!userPermission || !userPermission.clubIds || userPermission.clubIds.length === 0)) {
      // Fehler wird bereits im Layout behandelt, aber hier zur Sicherheit
      toast({ title: "Keine Vereinszuweisung", description: "Ihrem Konto ist kein Verein für die Ergebniserfassung zugewiesen.", variant: "destructive" });
    }
  }, [userPermission, authLoading, toast]);

  const fetchInitialPageData = useCallback(async () => {
    if (!activeClubIdForEntry && assignedClubsForSelect.length > 1) {
      setIsLoadingPageData(false);
      return;
    }
    setIsLoadingPageData(true);
    try {
      const seasonsSnapshotPromise = getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
      const shootersSnapshotPromise = getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("name", "asc")));
      const [seasonsSnapshot, shootersSnapshot] = await Promise.all([seasonsSnapshotPromise, shootersSnapshotPromise]);
      
      const fetchedSeasons = seasonsSnapshot.docs.map(sDoc => ({ id: sDoc.id, ...sDoc.data() } as Season));
      setAllSeasons(fetchedSeasons);
      const running = fetchedSeasons.filter(s => s.status === 'Laufend');
      setAvailableRunningSeasons(running);
      if (running.length === 1 && !selectedSeasonId) setSelectedSeasonId(running[0].id);

      setAllShootersFromDB(shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Shooter)));
    } catch (error) {
      console.error("VereinErgebnissePage: Error fetching initial page data (seasons/shooters): ", error);
      toast({ title: "Fehler beim Laden der Basisdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingPageData(false);
    }
  }, [toast, selectedSeasonId, activeClubIdForEntry, assignedClubsForSelect.length]);

  useEffect(() => {
    if (activeClubIdForEntry || (userPermission?.clubIds && userPermission.clubIds.length === 1 && !authLoading)) {
        fetchInitialPageData();
    } else if (userPermission?.clubIds && userPermission.clubIds.length > 1 && !activeClubIdForEntry && !authLoading) {
        setAllSeasons([]);
        setAvailableRunningSeasons([]);
        setAllShootersFromDB([]);
        setIsLoadingPageData(false);
    }
  }, [activeClubIdForEntry, userPermission, authLoading, fetchInitialPageData]);

  useEffect(() => {
    const loadLeaguesForSeasonAndClub = async () => {
      if (!selectedSeasonId || !activeClubIdForEntry) {
        setLeaguesForActiveClubAndSeason([]);
        setSelectedLeagueId('');
        return;
      }
      setIsLoadingLeagues(true);
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (!currentSeason) {
        setLeaguesForActiveClubAndSeason([]);
        setSelectedLeagueId('');
        setIsLoadingLeagues(false);
        return;
      }

      try {
        const teamsOfClubQuery = query(
          collection(db, TEAMS_COLLECTION),
          where("clubId", "in", userPermission?.clubIds || [activeClubIdForEntry]), // Berücksichtige alle zugewiesenen Clubs
          where("competitionYear", "==", currentSeason.competitionYear)
        );
        const teamsOfClubSnapshot = await getDocs(teamsOfClubQuery);
        const leagueIdsOfClubTeams = teamsOfClubSnapshot.docs
          .map(teamDoc => (teamDoc.data() as Team).leagueId)
          .filter(leagueId => leagueId) as string[];

        if (leagueIdsOfClubTeams.length === 0) {
          setLeaguesForActiveClubAndSeason([]);
          setIsLoadingLeagues(false);
          return;
        }
        
        const uniqueLeagueIds = Array.from(new Set(leagueIdsOfClubTeams));
        const MAX_IN_QUERIES = 30;
        const leagueChunks: string[][] = [];
        for (let i = 0; i < uniqueLeagueIds.length; i += MAX_IN_QUERIES) {
            leagueChunks.push(uniqueLeagueIds.slice(i, i + MAX_IN_QUERIES));
        }

        const fetchedLeagues: League[] = [];
        for (const chunk of leagueChunks) {
            if (chunk.length > 0) {
                const leaguesQuery = query(
                    collection(db, LEAGUES_COLLECTION),
                    where(documentId(), "in", chunk),
                    where("seasonId", "==", selectedSeasonId),
                    orderBy("order", "asc")
                );
                const leaguesSnapshot = await getDocs(leaguesQuery);
                leaguesSnapshot.forEach(leagueDoc => fetchedLeagues.push({ id: leagueDoc.id, ...leagueDoc.data() } as League));
            }
        }
        setLeaguesForActiveClubAndSeason(fetchedLeagues);
      } catch (error) {
        console.error("VereinErgebnissePage: Error fetching leagues:", error);
        toast({ title: "Fehler beim Laden der Ligen", description: (error as Error).message, variant: "destructive" });
        setLeaguesForActiveClubAndSeason([]);
      } finally {
        setIsLoadingLeagues(false);
        setSelectedLeagueId('');
      }
    };

    if (selectedSeasonId && activeClubIdForEntry && userPermission?.clubIds) {
      loadLeaguesForSeasonAndClub();
    } else {
      setLeaguesForActiveClubAndSeason([]);
    }
  }, [selectedSeasonId, activeClubIdForEntry, userPermission, allSeasons, toast]);

  useEffect(() => {
    const loadTeamsInLeague = async () => {
      if (!selectedLeagueId || !selectedSeasonId) {
        setAllTeamsInSelectedLeague([]);
        setSelectedTeamId('');
        return;
      }
      setIsLoadingTeams(true);
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (!currentSeason) {
         setAllTeamsInSelectedLeague([]);
         setSelectedTeamId('');
         setIsLoadingTeams(false);
         return;
      }
      try {
        const q = query(
          collection(db, TEAMS_COLLECTION),
          where("leagueId", "==", selectedLeagueId),
          where("competitionYear", "==", currentSeason.competitionYear),
          orderBy("name", "asc")
        );
        const snapshot = await getDocs(q);
        setAllTeamsInSelectedLeague(snapshot.docs.map(teamDoc => ({ id: teamDoc.id, ...teamDoc.data() } as Team)));
      } catch (error) {
        console.error("VereinErgebnissePage: Error fetching teams in league:", error);
        toast({ title: "Fehler beim Laden der Mannschaften", description: (error as Error).message, variant: "destructive" });
        setAllTeamsInSelectedLeague([]);
      } finally {
        setIsLoadingTeams(false);
        setSelectedTeamId('');
      }
    };
    if (selectedLeagueId && selectedSeasonId && activeClubIdForEntry) {
      loadTeamsInLeague();
    } else {
        setAllTeamsInSelectedLeague([]);
    }
  }, [selectedLeagueId, selectedSeasonId, allSeasons, activeClubIdForEntry, toast]);
  
  useEffect(() => {
    const loadShootersForTeam = async () => {
        if (!selectedTeamId) {
            setShootersOfSelectedTeam([]);
            return;
        }
        setIsLoadingShooters(true);
        try {
            const teamData = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId);
            if (teamData && teamData.shooterIds && teamData.shooterIds.length > 0) {
                const shootersForTeam = allShootersFromDB
                    .filter(shooter => teamData.shooterIds!.includes(shooter.id))
                    .sort((a, b) => a.name.localeCompare(b.name));
                setShootersOfSelectedTeam(shootersForTeam);
            } else {
                setShootersOfSelectedTeam([]);
            }
        } catch (error) {
            console.error("VereinErgebnissePage: Error fetching shooters for team:", error);
            toast({ title: "Fehler beim Laden der Schützen", description: (error as Error).message, variant: "destructive" });
            setShootersOfSelectedTeam([]);
        } finally {
            setIsLoadingShooters(false);
        }
    };
    if (selectedTeamId && allShootersFromDB.length > 0 && activeClubIdForEntry) {
        loadShootersForTeam();
    } else {
        setShootersOfSelectedTeam([]);
    }
  }, [selectedTeamId, allTeamsInSelectedLeague, allShootersFromDB, activeClubIdForEntry, toast]);

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
        setExistingScoresForTeamAndRound(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry)));
      } catch (error) {
        console.error("VereinErgebnissePage: Error fetching existing scores: ", error);
        toast({ title: "Fehler beim Laden existierender Ergebnisse", description: (error as Error).message, variant: "destructive" });
        setExistingScoresForTeamAndRound([]);
      } finally {
        setIsLoadingExistingScores(false);
      }
    };
    if (selectedTeamId && selectedSeasonId && selectedRound && activeClubIdForEntry) {
        fetchExistingScores();
    } else {
        setExistingScoresForTeamAndRound([]);
         if(selectedTeamId && selectedSeasonId && !selectedRound) {
          setJustSavedScoreIdentifiers([]);
        }
    }
  }, [selectedTeamId, selectedSeasonId, selectedRound, allSeasons, activeClubIdForEntry, toast]);

   useEffect(() => {
    if (selectedTeamId && selectedRound && shootersOfSelectedTeam.length > 0) {
      const parsedRound = parseInt(selectedRound, 10);
      const shootersInPendingThisRound = pendingScores.filter(ps => ps.teamId === selectedTeamId && ps.durchgang === parsedRound).map(ps => ps.shooterId);
      const shootersInJustSavedThisRound = justSavedScoreIdentifiers.filter(js => js.durchgang === parsedRound && js.shooterId && shootersOfSelectedTeam.find(s => s.id === js.shooterId)).map(js => js.shooterId);
      const shootersInExistingScoresThisRound = existingScoresForTeamAndRound.filter(es => es.durchgang === parsedRound).map(es => es.shooterId);
      
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

  useEffect(() => { setSelectedLeagueId('');}, [selectedSeasonId, activeClubIdForEntry]);
  useEffect(() => { setSelectedTeamId('');}, [selectedLeagueId, activeClubIdForEntry]);
  useEffect(() => { setSelectedShooterId(''); setSelectedRound(''); /* setPendingScores([]); behalten wir bei Teamwechsel */ setJustSavedScoreIdentifiers([]); }, [selectedTeamId, activeClubIdForEntry]);
  useEffect(() => { setSelectedShooterId(''); setScore(''); }, [selectedRound, activeClubIdForEntry]);

  const handleAddToList = () => {
    if (!userPermission?.uid) { 
      toast({ title: "Fehler", description: "Benutzer nicht identifiziert.", variant: "destructive" });
      return;
    }
    if (!selectedShooterId || !selectedRound || !score || !selectedSeasonId || !selectedLeagueId || !selectedTeamId || !activeClubIdForEntry ) {
      toast({ title: "Fehlende Eingabe", description: "Bitte alle Felder ausfüllen und einen Verein für die Erfassung wählen.", variant: "destructive" });
      return;
    }
    const scoreVal = parseInt(score);
    
    const season = allSeasons.find(s => s.id === selectedSeasonId);
    const league = leaguesForActiveClubAndSeason.find(l => l.id === selectedLeagueId);
    const team = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId);
    const shooter = allShootersFromDB.find(sh => sh.id === selectedShooterId);

    if (!season || !league || !team || !shooter) {
      toast({ title: "Datenfehler", description: "Ausgewählte Daten (Saison, Liga, Team, Schütze) nicht vollständig geladen.", variant: "destructive" });
      return;
    }
    
    const leagueSpecificType = league.type as FirestoreLeagueSpecificDiscipline;
    let maxPossibleScore = 300; 
    const lgLpTypes: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
    if (lgLpTypes.includes(leagueSpecificType)) {
        maxPossibleScore = 400;
    }
    
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxPossibleScore) {
      toast({ title: "Ungültiges Ergebnis", description: `Bitte eine gültige Ringzahl (0-${maxPossibleScore}) eingeben.`, variant: "destructive" });
      return;
    }
    
    const parsedRound = parseInt(selectedRound, 10);
    if (pendingScores.some(ps => ps.shooterId === selectedShooterId && ps.durchgang === parsedRound && ps.teamId === selectedTeamId) || 
        justSavedScoreIdentifiers.some(js => js.shooterId === selectedShooterId && js.durchgang === parsedRound) ||
        existingScoresForTeamAndRound.some(es => es.shooterId === selectedShooterId && es.durchgang === parsedRound)) {
      toast({ title: "Ergebnis existiert bereits", description: `${shooter.name} hat bereits ein Ergebnis für DG ${selectedRound} bei dieser Mannschaft.`, variant: "warning"});
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
    toast({ title: "Ergebnis hinzugefügt", description: `${shooter.name} - DG ${selectedRound}: ${scoreVal} Ringe für ${team.name} zur Liste.` });
    setSelectedShooterId(''); setScore(''); 
  };

  const handleRemoveFromList = (tempId: string) => {
    setPendingScores(prev => prev.filter(p => p.tempId !== tempId));
    toast({ title: "Eintrag entfernt", variant: "destructive" });
  };

  const handleFinalSave = async () => {
    if (!userPermission?.uid) { 
      toast({ title: "Fehler", description: "Benutzer nicht identifiziert.", variant: "destructive" }); return;
    }
    if (pendingScores.length === 0) {
      toast({ title: "Keine Ergebnisse zum Speichern.", variant: "destructive" }); return;
    }
    setIsSubmittingScores(true);
    const batch = writeBatch(db);
    const newlySavedIdentifiers: { shooterId: string; durchgang: number }[] = [];
    
    const leagueUpdatesToProcess = new Map<string, { leagueId: string, leagueName: string, leagueType: FirestoreLeagueSpecificDiscipline, competitionYear: number }>();

    pendingScores.forEach(entry => {
      const key = `${entry.leagueId}_${entry.competitionYear}`;
      if (!leagueUpdatesToProcess.has(key) && entry.leagueType && entry.leagueName && entry.competitionYear) {
        leagueUpdatesToProcess.set(key, {
          leagueId: entry.leagueId,
          leagueName: entry.leagueName,
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
            leagueType: dataToSave.leagueType!, 
            teamId: dataToSave.teamId, 
            teamName: dataToSave.teamName || "N/A", 
            clubId: dataToSave.clubId!, 
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
            enteredByUserId: userPermission.uid,
            enteredByUserName: userPermission.displayName || userPermission.email || "Unbekannt",
            entryTimestamp: serverTimestamp()
        });
        newlySavedIdentifiers.push({ shooterId: entry.shooterId, durchgang: entry.durchgang });
      });

      for (const updateInfo of leagueUpdatesToProcess.values()) {
        const today = new Date();
        const startOfDay = Timestamp.fromDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
        const endOfDay = Timestamp.fromDate(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));

        const q = query(
            collection(db, LEAGUE_UPDATES_COLLECTION),
            where("leagueId", "==", updateInfo.leagueId),
            where("competitionYear", "==", updateInfo.competitionYear),
            where("timestamp", ">=", startOfDay),
            where("timestamp", "<=", endOfDay)
        );
        const existingUpdatesSnapshot = await getDocs(q);

        if (!existingUpdatesSnapshot.empty) {
            const existingUpdateDocRef = existingUpdatesSnapshot.docs[0].ref;
            batch.update(existingUpdateDocRef, { timestamp: serverTimestamp() });
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
        }
      }

      await batch.commit();
      toast({ title: "Ergebnisse gespeichert", description: `${pendingScores.length} Ergebnisse wurden erfolgreich gespeichert.` });
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

  const selectedLeagueObject = leaguesForActiveClubAndSeason.find(l => l.id === selectedLeagueId);
  let numRoundsForSelect = 5; 
  if (selectedLeagueObject) {
    const lgLpTypes: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
    if (lgLpTypes.includes(selectedLeagueObject.type)) {
      numRoundsForSelect = 4; 
    }
  }

  if (authLoading || (!activeClubIdForEntry && assignedClubsForSelect.length > 1 && !isLoadingAssignedClubDetails)) {
    return (
      <div className="space-y-6">
        {authLoading && <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary mr-3" /><p>Lade Benutzerdaten...</p></div>}
        {!authLoading && permissionError && <Card className="border-destructive"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Zugriffsproblem</CardTitle></CardHeader><CardContent><p>{permissionError}</p></CardContent></Card>}
        {!authLoading && !permissionError && userPermission?.clubIds && userPermission.clubIds.length > 1 && !activeClubIdForEntry && !isLoadingAssignedClubDetails && (
          <Card className="shadow-md">
            <CardHeader><CardTitle>Verein für Ergebniserfassung auswählen</CardTitle><CardDescription>Bitte wählen Sie den Verein aus, für dessen Ligen/Mannschaften Sie Ergebnisse erfassen möchten.</CardDescription></CardHeader>
            <CardContent>
              <Select onValueChange={(value) => {
                setActiveClubIdForEntry(value);
                const club = assignedClubsForSelect.find(c => c.id === value);
                setActiveClubName(club?.name || null);
              }}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Verein für Erfassung wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {assignedClubsForSelect.map(club => (
                    <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
  
  if (!authLoading && !permissionError && (!userPermission?.clubIds || userPermission.clubIds.length === 0)) {
     return (
      <div className="space-y-6 p-4 md:p-6">
        <Card className="border-amber-500">
          <CardHeader><CardTitle className="text-amber-700 flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Kein Verein zugewiesen</CardTitle></CardHeader>
          <CardContent><p>Ihrem Konto ist kein Verein für die Ergebniserfassung zugewiesen. Bitte kontaktieren Sie den Administrator.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoadingPageData && activeClubIdForEntry) {
     return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary mr-3" /><p>Lade Seitendaten...</p></div>;
  }

  if (availableRunningSeasons.length === 0 && !isLoadingPageData && activeClubIdForEntry) {
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center"><h1 className="text-2xl font-semibold text-primary">Ergebniserfassung {activeClubName ? `(${activeClubName})` : ''}</h1></div>
        <Card className="shadow-md border-amber-500"><CardHeader><CardTitle className="text-amber-600 flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Keine laufenden Saisons</CardTitle></CardHeader>
            <CardContent><p>Aktuell sind keine Saisons mit dem Status "Laufend" für die Ergebniserfassung verfügbar.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung {activeClubName ? `(${activeClubName})` : ''}</h1>
      </div>
      
      {userPermission?.clubIds && userPermission.clubIds.length > 1 && (
         <Card className="shadow-sm bg-muted/30">
            <CardContent className="p-4">
                 <Label htmlFor="vv-active-club-select-ergebnisse">Für welchen Verein Ergebnisse erfassen?</Label>
                 <Select 
                    value={activeClubIdForEntry} 
                    onValueChange={(value) => {
                        setActiveClubIdForEntry(value);
                        const club = assignedClubsForSelect.find(c => c.id === value);
                        setActiveClubName(club?.name || null);
                        // Reset dependent states
                        setSelectedSeasonId('');
                        setLeaguesForActiveClubAndSeason([]);
                        setAllTeamsInSelectedLeague([]);
                        setShootersOfSelectedTeam([]);
                        setAvailableShootersForDropdown([]);
                        setPendingScores([]);
                        setJustSavedScoreIdentifiers([]);
                        setExistingScoresForTeamAndRound([]);
                    }}
                >
                    <SelectTrigger id="vv-active-club-select-ergebnisse" className="w-full sm:w-[300px] mt-1">
                        <SelectValue placeholder="Verein für Erfassung wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                        {assignedClubsForSelect.map(club => (
                            <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
         </Card>
      )}

      <Card className="shadow-md">
        <CardHeader><CardTitle>Einzelergebnis zur Liste hinzufügen</CardTitle><CardDescription>Wählen Sie Parameter und fügen Sie Ergebnisse hinzu.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vv-er-season">Saison (laufend)</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId} disabled={isLoadingPageData || availableRunningSeasons.length === 0 || !activeClubIdForEntry}>
                <SelectTrigger id="vv-er-season"><SelectValue placeholder={isLoadingPageData ? "Lade Saisons..." : (availableRunningSeasons.length === 0 ? "Keine Saisons" : "Saison wählen")} /></SelectTrigger>
                <SelectContent>{availableRunningSeasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vv-er-league">Liga</Label>
              <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId} disabled={!selectedSeasonId || isLoadingLeagues || leaguesForActiveClubAndSeason.length === 0 || !activeClubIdForEntry}>
                <SelectTrigger id="vv-er-league"><SelectValue placeholder={isLoadingLeagues ? "Lade Ligen..." : (leaguesForActiveClubAndSeason.length === 0 && selectedSeasonId ? "Keine Ligen für Verein/Saison" : "Liga wählen")} /></SelectTrigger>
                <SelectContent>{leaguesForActiveClubAndSeason.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="vv-er-team">Mannschaft</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={!selectedLeagueId || isLoadingTeams || allTeamsInSelectedLeague.length === 0 || !activeClubIdForEntry}>
                <SelectTrigger id="vv-er-team"><SelectValue placeholder={isLoadingTeams ? "Lade Teams..." : (allTeamsInSelectedLeague.length === 0 && selectedLeagueId ? "Keine Teams für Liga" : "Mannschaft wählen")} /></SelectTrigger>
                <SelectContent>{allTeamsInSelectedLeague.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vv-er-round">Durchgang</Label>
              <Select value={selectedRound} onValueChange={(value) => { setSelectedRound(value);}} disabled={!selectedTeamId || !activeClubIdForEntry}>
                <SelectTrigger id="vv-er-round"><SelectValue placeholder="Durchgang wählen" /></SelectTrigger>
                <SelectContent>{[...Array(numRoundsForSelect)].map((_, i) => (<SelectItem key={i + 1} value={(i + 1).toString()}>Durchgang {i + 1}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vv-er-shooter">Schütze</Label>
              <Select value={selectedShooterId} onValueChange={setSelectedShooterId} disabled={!selectedRound || isLoadingShooters || isLoadingExistingScores || (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound) || !activeClubIdForEntry}>
                <SelectTrigger id="vv-er-shooter"><SelectValue placeholder={isLoadingShooters || isLoadingExistingScores ? "Lade Schützen..." : (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound ? "Alle erfasst/keine" : "Schütze wählen")} /></SelectTrigger>
                <SelectContent>{availableShootersForDropdown.map(sh => <SelectItem key={sh.id} value={sh.id}>{sh.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vv-er-score">Ergebnis (Ringe)</Label>
              <Input id="vv-er-score" type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="z.B. 285" disabled={!selectedShooterId || !activeClubIdForEntry} />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <Label>Ergebnistyp</Label>
            <RadioGroup value={resultType} onValueChange={(value) => setResultType(value as "regular" | "pre" | "post")} className="flex space-x-4" disabled={!activeClubIdForEntry}>
              <div className="flex items-center space-x-2">
                 <RadioGroupItem value="regular" id="vv-er-r-regular" />
                 <Label htmlFor="vv-er-r-regular">Regulär</Label>
              </div>
              <div className="flex items-center space-x-2">
                 <RadioGroupItem value="pre" id="vv-er-r-pre" />
                 <Label htmlFor="vv-er-r-pre">Vorschießen</Label>
              </div>
              <div className="flex items-center space-x-2">
                 <RadioGroupItem value="post" id="vv-er-r-post" />
                 <Label htmlFor="vv-er-r-post">Nachschießen</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleAddToList} disabled={!selectedShooterId || !selectedRound || !score || isSubmittingScores || isLoadingExistingScores || !activeClubIdForEntry}><PlusCircle className="mr-2 h-5 w-5" /> Zur Liste hinzufügen</Button>
          </div>
        </CardContent>
      </Card>

      {pendingScores.length > 0 && activeClubIdForEntry && (
        <Card className="shadow-md mt-6">
          <CardHeader>
            <CardTitle>Vorgemerkte Ergebnisse ({pendingScores.length})</CardTitle>
            <CardDescription>
                Saison: {allSeasons.find(s=>s.id === selectedSeasonId)?.name || '-'} | 
                Liga: {leaguesForActiveClubAndSeason.find(l=>l.id===selectedLeagueId)?.name || '-'} | 
                Mannschaft: {allTeamsInSelectedLeague.find(t=>t.id===selectedTeamId)?.name || '-'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Schütze</TableHead><TableHead className="text-center">DG</TableHead><TableHead className="text-center">Ringe</TableHead><TableHead>Typ</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
              <TableBody>{pendingScores.map((entry) => (<TableRow key={entry.tempId}><TableCell>{entry.shooterName}</TableCell><TableCell className="text-center">{entry.durchgang}</TableCell><TableCell className="text-center">{entry.totalRinge}</TableCell><TableCell>{entry.scoreInputType === 'pre' ? 'Vorschuss' : entry.scoreInputType === 'post' ? 'Nachschuss' : 'Regulär'}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleRemoveFromList(entry.tempId)} className="text-destructive hover:text-destructive/80" disabled={isSubmittingScores}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
            <div className="flex justify-end pt-6"><Button onClick={handleFinalSave} size="lg" disabled={isSubmittingScores || pendingScores.length === 0}>{isSubmittingScores && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Alle {pendingScores.length} Ergebnisse speichern</Button></div>
          </CardContent>
        </Card>
      )}
      {pendingScores.length === 0 && !isLoadingPageData && activeClubIdForEntry && (
         <div className="mt-8 p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
            <CheckSquare className="mx-auto h-10 w-10 mb-3 text-primary/70" />
            <p className="text-base">Noch keine Ergebnisse zur Speicherung vorgemerkt.</p>
         </div>
      )}
       {!activeClubIdForEntry && userPermission?.clubIds && userPermission.clubIds.length > 1 && !isLoadingAssignedClubDetails && !isLoadingPageData && (
         <div className="mt-8 p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
            <AlertTriangle className="mx-auto h-10 w-10 mb-3 text-primary/70" />
            <p className="text-base">Bitte wählen Sie oben einen Verein aus, um Ergebnisse zu erfassen.</p>
          </div>
       )}
    </div>
  );
}

    