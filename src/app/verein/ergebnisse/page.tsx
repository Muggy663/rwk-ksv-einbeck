
// /app/verein/ergebnisse/page.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, Save, Plus, Trash2, Loader, AlertCircle, Building } from 'lucide-react';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import type { Season, League, Team, Shooter, PendingScoreEntry, ScoreEntry, FirestoreLeagueSpecificDiscipline, Club, LeagueUpdateEntry, UserPermission } from '@/types/rwk';
import { leagueDisciplineOptions } from '@/types/rwk';
import { useVereinAuth } from '@/app/verein/layout'; 
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, writeBatch, serverTimestamp, doc, documentId, getDoc as getFirestoreDoc, Timestamp, setDoc, updateDoc, addDoc, limit } from 'firebase/firestore';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "rwk_shooters";
const SCORES_COLLECTION = "rwk_scores";
const CLUBS_COLLECTION = "clubs";
const LEAGUE_UPDATES_COLLECTION = "league_updates";


export default function VereinErgebnissePage() {
  const { userPermission, loadingPermissions, permissionError, assignedClubId } = useVereinAuth();
  const { toast } = useToast();
  
  const [activeClubIdForEntry, setActiveClubIdForEntry] = useState<string | null>(null);
  const [activeClubNameForEntry, setActiveClubNameForEntry] = useState<string | null>(null);
  const [isLoadingAssignedClubDetails, setIsLoadingAssignedClubDetails] = useState(true);
  
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [availableRunningSeasons, setAvailableRunningSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  const [allLeagues, setAllLeagues] = useState<League[]>([]); 
  const [leaguesForActiveClubAndSeason, setLeaguesForActiveClubAndSeason] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');

  const [allTeamsInSelectedLeague, setAllTeamsInSelectedLeague] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  
  const [allShootersFromDB, setAllShootersFromDB] = useState<Shooter[]>([]); 
  const [shootersOfSelectedTeam, setShootersOfSelectedTeam] = useState<Shooter[]>([]);
  const [shootersLimit, setShootersLimit] = useState(30);
  const [hasMoreShooters, setHasMoreShooters] = useState(false);
  const [availableShootersForDropdown, setAvailableShootersForDropdown] = useState<Shooter[]>([]);
  const [selectedShooterId, setSelectedShooterId] = useState<string>('');
  
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [resultType, setResultType] = useState<'regular' | 'pre' | 'post'>("regular");
  const [score, setScore] = useState<string>('');

  const [pendingScores, setPendingScores] = useState<PendingScoreEntry[]>([]);
  const [justSavedScoreIdentifiers, setJustSavedScoreIdentifiers] = useState<{ shooterId: string; durchgang: number }[]>([]);
  const [existingScoresForTeamAndRound, setExistingScoresForTeamAndRound] = useState<ScoreEntry[]>([]);

  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingShooters, setIsLoadingShooters] = useState(false);
  const [isLoadingExistingScores, setIsLoadingExistingScores] = useState(false);
  const [isSubmittingScores, setIsSubmittingScores] = useState(false);

 useEffect(() => {
    console.log("VER_ERGEBNISSE DEBUG: Effect for activeClubIdForEntry. loadingPermissions:", loadingPermissions, "assignedClubId from context:", assignedClubId);
    if (!loadingPermissions && assignedClubId && typeof assignedClubId === 'string' && assignedClubId.trim() !== '') {
      setActiveClubIdForEntry(assignedClubId);
      const fetchClubName = async () => {
        setIsLoadingAssignedClubDetails(true);
        try {
          const clubDocRef = doc(db, CLUBS_COLLECTION, assignedClubId);
          const clubSnap = await getFirestoreDoc(clubDocRef);
          if (clubSnap.exists()) {
            setActiveClubNameForEntry(clubSnap.data()?.name || "Unbek. Verein");
          } else {
            setActiveClubNameForEntry("Zugew. Verein nicht gefunden");
            console.warn("VER_ERGEBNISSE DEBUG: Club with ID", assignedClubId, "not found.");
          }
        } catch (e) {
          console.error("VER_ERGEBNISSE DEBUG: Error fetching assigned club name:", e);
          setActiveClubNameForEntry("Fehler Vereinsname");
        } finally {
          setIsLoadingAssignedClubDetails(false);
        }
      };
      fetchClubName();
    } else if (!loadingPermissions && !assignedClubId) {
      console.warn("VER_ERGEBNISSE DEBUG: No assignedClubId available after loading permissions.");
      setActiveClubIdForEntry(null);
      setActiveClubNameForEntry(null);
      setIsLoadingAssignedClubDetails(false);
    }
  }, [assignedClubId, loadingPermissions]);


  const fetchInitialPageData = useCallback(async () => {
    console.log("VER_ERGEBNISSE DEBUG: fetchInitialPageData called. ActiveClubForEntry:", activeClubIdForEntry);
    if (!activeClubIdForEntry) {
      console.log("VER_ERGEBNISSE DEBUG: fetchInitialPageData - No activeClubIdForEntry, aborting data load.");
      setIsLoadingPageData(false); 
      setAllSeasons([]); setAvailableRunningSeasons([]); setAllLeagues([]); setAllShootersFromDB([]);
      return;
    }
    
    // Cache für Ergebniserfassung (10 Min)
    const cacheKey = `results-data-${activeClubIdForEntry}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheKey + '-time');
    
    if (cachedData && cacheTime && Date.now() - parseInt(cacheTime) < 600000) {
      const parsed = JSON.parse(cachedData);
      setAllSeasons(parsed.seasons);
      setAvailableRunningSeasons(parsed.runningSeasons);
      setAllLeagues(parsed.leagues);
      setAllShootersFromDB(parsed.shooters);
      setIsLoadingPageData(false);
      return;
    }
    
    setIsLoadingPageData(true);
    try {
      const seasonsSnapshotPromise = getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
      const allLeaguesSnapshotPromise = getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      const shootersSnapshotPromise = getDocs(query(
        collection(db, SHOOTERS_COLLECTION), 
        orderBy("name", "asc"),
        limit(shootersLimit + 1) // +1 um zu prüfen ob mehr vorhanden
      ));

      const [seasonsSnapshot, allLeaguesSnapshot, shootersSnapshot] = await Promise.all([
          seasonsSnapshotPromise, allLeaguesSnapshotPromise, shootersSnapshotPromise
      ]);
      
      const fetchedSeasons = seasonsSnapshot.docs.map(sDoc => ({ id: sDoc.id, ...sDoc.data() } as Season)).filter(s => s.id);
      setAllSeasons(fetchedSeasons);
      const runningSeasons = fetchedSeasons.filter(s => s.status === 'Laufend');
      setAvailableRunningSeasons(runningSeasons);
      if (runningSeasons.length === 1 && !selectedSeasonId) {
        setSelectedSeasonId(runningSeasons[0].id);
      } else if (runningSeasons.length === 0 && !selectedSeasonId) {
          setSelectedSeasonId('');
      }

      const fetchedAllLeagues = allLeaguesSnapshot.docs.map(lDoc => ({ id: lDoc.id, ...lDoc.data() } as League)).filter(l => l.id);
      setAllLeagues(fetchedAllLeagues);
      
      const allShooterDocs = shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Shooter)).filter(s => s.id);
      
      // Prüfe ob mehr Schützen vorhanden sind
      if (allShooterDocs.length > shootersLimit) {
        setHasMoreShooters(true);
        setAllShootersFromDB(allShooterDocs.slice(0, shootersLimit)); // Nur ersten 30
      } else {
        setHasMoreShooters(false);
        setAllShootersFromDB(allShooterDocs);
      }

      // Cache speichern
      localStorage.setItem(cacheKey, JSON.stringify({
        seasons: fetchedSeasons,
        runningSeasons: runningSeasons,
        leagues: fetchedAllLeagues,
        shooters: allShooterDocs.slice(0, shootersLimit)
      }));
      localStorage.setItem(cacheKey + '-time', Date.now().toString());

    } catch (error) {
      console.error("VER_ERGEBNISSE DEBUG: Error fetching initial page data:", error);
      toast({ title: "Fehler Basisdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingPageData(false);
    }
  }, [activeClubIdForEntry, toast, selectedSeasonId]);

  useEffect(() => { 
    if (activeClubIdForEntry) { 
        fetchInitialPageData(); 
    } else {
        setIsLoadingPageData(false); 
    }
  }, [fetchInitialPageData, activeClubIdForEntry]);

  useEffect(() => {
    const loadLeaguesForSeasonAndClub = async () => {
      if (!selectedSeasonId || !activeClubIdForEntry || allLeagues.length === 0) {
        setLeaguesForActiveClubAndSeason([]); setSelectedLeagueId(''); return;
      }
      setIsLoadingLeagues(true);
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (!currentSeason) { setLeaguesForActiveClubAndSeason([]); setSelectedLeagueId(''); setIsLoadingLeagues(false); return; }
      try {
        const teamsOfThisClubQuery = query(collection(db, TEAMS_COLLECTION), 
            where("clubId", "==", activeClubIdForEntry), where("competitionYear", "==", currentSeason.competitionYear)
        );
        const teamsSnap = await getDocs(teamsOfThisClubQuery);
        const leagueIdsOfClubTeams = Array.from(new Set(teamsSnap.docs.map(d => (d.data() as Team).leagueId).filter(id => !!id && id.trim() !== ""))) as string[];

        if (leagueIdsOfClubTeams.length === 0) {
          setLeaguesForActiveClubAndSeason([]); setIsLoadingLeagues(false); return;
        }
        const filteredLeagues = allLeagues.filter(l => leagueIdsOfClubTeams.includes(l.id) && l.seasonId === selectedSeasonId)
                                        .sort((a,b) => (a.order || 0) - (b.order || 0));
        setLeaguesForActiveClubAndSeason(filteredLeagues.filter(l => l.id));
      } catch (error) {
        console.error("VER_ERGEBNISSE DEBUG: Error fetching leagues for VV:", error);
        toast({ title: "Fehler Ligenladen", description: (error as Error).message, variant: "destructive" });
        setLeaguesForActiveClubAndSeason([]);
      } finally {
        setIsLoadingLeagues(false); setSelectedLeagueId('');
      }
    };
    if (selectedSeasonId && activeClubIdForEntry) loadLeaguesForSeasonAndClub(); else setLeaguesForActiveClubAndSeason([]);
  }, [selectedSeasonId, activeClubIdForEntry, allSeasons, allLeagues, toast]);

  // Effekt zum Laden der Teams für die ausgewählte Liga und Saison
  // Wenn ein Durchgang ausgewählt ist, werden Teams gefiltert, bei denen alle Schützen bereits Ergebnisse haben
  useEffect(() => {
    const loadTeamsInLeague = async () => {
      if (!selectedLeagueId || !selectedSeasonId) { setAllTeamsInSelectedLeague([]); setSelectedTeamId(''); return; }
      setIsLoadingTeams(true);
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (!currentSeason) { setAllTeamsInSelectedLeague([]); setSelectedTeamId(''); setIsLoadingTeams(false); return; }
      try {
        // Teams für die ausgewählte Liga und Saison laden
        const q = query(collection(db, TEAMS_COLLECTION), 
            where("leagueId", "==", selectedLeagueId), 
            where("competitionYear", "==", currentSeason.competitionYear), 
            orderBy("name", "asc")
        );
        const snapshot = await getDocs(q);
        const fetchedTeams = snapshot.docs.map(teamDoc => ({ id: teamDoc.id, ...teamDoc.data() } as Team)).filter(t => t.id);
        
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
                where("competitionYear", "==", currentSeason.competitionYear)
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
        console.error("VER_ERGEBNISSE DEBUG: Error fetching teams in league:", error);
        toast({ title: "Fehler Teamladen", description: (error as Error).message, variant: "destructive" });
        setAllTeamsInSelectedLeague([]);
      } finally {
        setIsLoadingTeams(false);
      }
    };
    if (selectedLeagueId && selectedSeasonId && activeClubIdForEntry) loadTeamsInLeague(); else setAllTeamsInSelectedLeague([]);
  }, [selectedLeagueId, selectedSeasonId, selectedRound, allSeasons, activeClubIdForEntry, pendingScores, justSavedScoreIdentifiers, toast]);
  
  useEffect(() => {
    const loadShootersForTeam = async () => {
        if (!selectedTeamId) { setShootersOfSelectedTeam([]); setSelectedShooterId(''); return; }
        setIsLoadingShooters(true);
        try {
            const teamData = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId);
            if (teamData && teamData.shooterIds && teamData.shooterIds.length > 0) {
                const validShooterIds = teamData.shooterIds.filter(id => id && typeof id === 'string' && id.trim() !== "");
                if (validShooterIds.length > 0) {
                    const shootersForTeam = allShootersFromDB.filter(shooter => validShooterIds.includes(shooter.id)).sort((a, b) => a.name.localeCompare(b.name));
                    setShootersOfSelectedTeam(shootersForTeam);
                } else { setShootersOfSelectedTeam([]); }
            } else { setShootersOfSelectedTeam([]); }
        } catch (error) {
            console.error("VER_ERGEBNISSE DEBUG: Error fetching shooters for team:", error);
            toast({ title: "Fehler Schützenladen", description: (error as Error).message, variant: "destructive" });
            setShootersOfSelectedTeam([]);
        } finally {
            setIsLoadingShooters(false); setSelectedShooterId('');
        }
    };
    if (selectedTeamId && allShootersFromDB.length > 0 && activeClubIdForEntry) loadShootersForTeam(); else setShootersOfSelectedTeam([]);
  }, [selectedTeamId, allTeamsInSelectedLeague, allShootersFromDB, activeClubIdForEntry, toast]);

  useEffect(() => {
    const fetchExistingScores = async () => {
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (!selectedTeamId || !currentSeason?.competitionYear || !selectedRound) { setExistingScoresForTeamAndRound([]); return; }
      setIsLoadingExistingScores(true);
      try {
        const scoresQuery = query(collection(db, SCORES_COLLECTION), 
            where("teamId", "==", selectedTeamId), where("competitionYear", "==", currentSeason.competitionYear), where("durchgang", "==", parseInt(selectedRound, 10))
        );
        const snapshot = await getDocs(scoresQuery);
        setExistingScoresForTeamAndRound(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry)));
      } catch (error) {
        console.error("VER_ERGEBNISSE DEBUG: Error fetching existing scores: ", error);
        toast({ title: "Fehler Ex. Ergebnisse", description: (error as Error).message, variant: "destructive" });
        setExistingScoresForTeamAndRound([]);
      } finally {
        setIsLoadingExistingScores(false);
      }
    };
    if (selectedTeamId && selectedSeasonId && selectedRound && activeClubIdForEntry) fetchExistingScores(); else setExistingScoresForTeamAndRound([]);
  }, [selectedTeamId, selectedSeasonId, selectedRound, allSeasons, activeClubIdForEntry, toast]);

   useEffect(() => {
    if (selectedTeamId && selectedRound && shootersOfSelectedTeam.length > 0 && !isLoadingExistingScores) {
      const parsedRound = parseInt(selectedRound, 10);
      const shootersInPendingThisRound = pendingScores.filter(ps => ps.teamId === selectedTeamId && ps.durchgang === parsedRound).map(ps => ps.shooterId);
      const shootersInJustSavedThisRound = justSavedScoreIdentifiers.filter(js => js.durchgang === parsedRound && shootersOfSelectedTeam.some(s => s.id === js.shooterId)).map(js => js.shooterId);
      const shootersInExistingScoresThisRound = existingScoresForTeamAndRound.filter(es => es.durchgang === parsedRound).map(es => es.shooterId);
      
      const filtered = shootersOfSelectedTeam.filter(sh => 
        sh.id && !shootersInPendingThisRound.includes(sh.id) && !shootersInJustSavedThisRound.includes(sh.id) && !shootersInExistingScoresThisRound.includes(sh.id)
      );
      setAvailableShootersForDropdown(filtered);
    } else {
      setAvailableShootersForDropdown([]);
    }
  }, [selectedTeamId, selectedRound, shootersOfSelectedTeam, pendingScores, justSavedScoreIdentifiers, existingScoresForTeamAndRound, isLoadingExistingScores]);

  useEffect(() => { setSelectedLeagueId(''); setSelectedTeamId(''); setSelectedShooterId(''); setSelectedRound(''); setPendingScores([]); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]);}, [selectedSeasonId, activeClubIdForEntry]);
  useEffect(() => { setSelectedTeamId(''); setSelectedShooterId(''); setSelectedRound(''); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]);}, [selectedLeagueId]);
  useEffect(() => { setSelectedShooterId(''); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]);}, [selectedTeamId]);
  useEffect(() => { setSelectedShooterId(''); setScore(''); setExistingScoresForTeamAndRound([]);}, [selectedRound]);

  const handleAddToList = () => {
    if (!userPermission?.uid) { toast({ title: "Fehler", description: "Benutzer nicht identifiziert.", variant: "destructive" }); return; }
    if (!selectedShooterId || !selectedRound || !score || !selectedSeasonId || !selectedLeagueId || !selectedTeamId || !activeClubIdForEntry ) {
      toast({ title: "Fehlende Eingabe", description: "Bitte alle Felder ausfüllen.", variant: "destructive" }); return;
    }
    const scoreVal = parseInt(score);
    const season = allSeasons.find(s => s.id === selectedSeasonId);
    const league = allLeagues.find(l => l.id === selectedLeagueId); 
    const team = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId); 
    const shooter = allShootersFromDB.find(sh => sh.id === selectedShooterId);

    if (!season || !league || !team || !shooter || !team.clubId) {
      toast({ title: "Datenfehler", description: "Basisdaten unvollständig (Saison, Liga, Team, Schütze, Team ClubID).", variant: "destructive" }); return;
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
    if (!userPermission?.uid) { toast({ title: "Fehler", description: "Benutzer nicht identifiziert.", variant: "destructive" }); return; }
    if (pendingScores.length === 0) { toast({ title: "Keine Ergebnisse", variant: "destructive" }); return; }
    setIsSubmittingScores(true);
    const newlySavedIdentifiers: { shooterId: string; durchgang: number }[] = [];
    
    try {
      // Batch Write für alle Ergebnisse
      const batch = writeBatch(db);
      
      for (const entry of pendingScores) {
        try {
          const { tempId, ...dataToSave } = entry;
          const scoreDocRef = doc(collection(db, SCORES_COLLECTION));
          
          // Zu Batch hinzufügen statt einzeln speichern
          batch.set(scoreDocRef, {
            ...dataToSave,
            enteredByUserId: userPermission.uid,
            enteredByUserName: userPermission.displayName || userPermission.email || "Unbekannt",
            entryTimestamp: serverTimestamp()
          });
          
          newlySavedIdentifiers.push({ shooterId: entry.shooterId, durchgang: entry.durchgang });
          
          // Liga-Update für jedes Ergebnis einzeln verarbeiten
          if (entry.leagueId && entry.leagueName && entry.leagueType && entry.competitionYear !== undefined) {
            try {
              const today = new Date();
              const startOfDay = Timestamp.fromDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
              const endOfDay = Timestamp.fromDate(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));
              
              const q = query(collection(db, LEAGUE_UPDATES_COLLECTION),
                where("leagueId", "==", entry.leagueId),
                where("competitionYear", "==", entry.competitionYear),
                where("timestamp", ">=", startOfDay),
                where("timestamp", "<=", endOfDay)
              );
              
              const existingUpdatesSnapshot = await getDocs(q);
              if (!existingUpdatesSnapshot.empty) {
                await updateDoc(existingUpdatesSnapshot.docs[0].ref, { timestamp: serverTimestamp() });
              } else {
                const leagueUpdateData = {
                  leagueId: entry.leagueId,
                  leagueName: entry.leagueName,
                  leagueType: entry.leagueType,
                  competitionYear: entry.competitionYear,
                  timestamp: serverTimestamp(),
                  action: 'results_added'
                };
                await addDoc(collection(db, LEAGUE_UPDATES_COLLECTION), leagueUpdateData);
              }
            } catch (updateError) {
              console.error("VER_ERGEBNISSE DEBUG: Error updating league update:", updateError);
              // Fehler bei Liga-Updates ignorieren
            }
          }
        } catch (scoreError) {
          console.error("VER_ERGEBNISSE DEBUG: Error saving individual score:", scoreError);
          // Fehler für einzelnes Ergebnis protokollieren und mit dem nächsten fortfahren
        }
      }
      
      // Alle Scores in einem Batch speichern
      await batch.commit();

      toast({ title: "Ergebnisse gespeichert" });
      setPendingScores([]);
      setJustSavedScoreIdentifiers(prev => [...prev, ...newlySavedIdentifiers]);
      
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (selectedTeamId && currentSeason?.competitionYear && selectedRound) {
          setIsLoadingExistingScores(true);
          const scoresQuery = query(collection(db, SCORES_COLLECTION),
            where("teamId", "==", selectedTeamId), 
            where("competitionYear", "==", currentSeason.competitionYear),
            where("durchgang", "==", parseInt(selectedRound, 10))
          );
          const snapshot = await getDocs(scoresQuery);
          setExistingScoresForTeamAndRound(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry))); 
          setIsLoadingExistingScores(false);
      }
    } catch (error: any) {
        console.error("VER_ERGEBNISSE DEBUG: Error saving scores to Firestore: ", error);
        toast({ title: "Fehler beim Speichern", description: error.message || "Unbekannter Fehler", variant: "destructive" });
    } finally {
        setIsSubmittingScores(false);
    }
  };

  const selectedLeagueObject = leaguesForActiveClubAndSeason.find(l => l.id === selectedLeagueId);
  let numRoundsForSelect = 5;
  if (selectedLeagueObject) {
    const fourHundredPointDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
    if (fourHundredPointDisciplines.includes(selectedLeagueObject.type)) numRoundsForSelect = 4;
  }

  if (loadingPermissions || isLoadingAssignedClubDetails) {
    return <div className="flex justify-center items-center py-12"><Loader className="h-12 w-12 animate-spin text-primary mr-3" /><p>Lade Benutzer- und Vereinsdaten...</p></div>;
  }
  if (permissionError) {
    return <div className="p-6"><Card className="border-destructive bg-destructive/5"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertCircle className="mr-2 h-5 w-5" /> {permissionError}</CardTitle></CardHeader><CardContent><p>Bitte kontaktieren Sie den Administrator.</p></CardContent></Card></div>;
  }
   if (!activeClubIdForEntry && !loadingPermissions && !permissionError) {
    return (
        <div className="p-6">
            <Card className="border-amber-500 bg-amber-50/50">
                <CardHeader><CardTitle className="text-amber-700 flex items-center gap-2"><AlertCircle />Vereinskontext fehlt</CardTitle></CardHeader>
                <CardContent><p>Ihrem Konto ist kein Verein für die Ergebniserfassung zugewiesen oder der Verein konnte nicht geladen werden.</p></CardContent>
            </Card>
        </div>
     );
  }
  
  if (isLoadingPageData) { 
    return <div className="flex justify-center items-center py-12"><Loader className="h-12 w-12 animate-spin text-primary mr-3" /><p>Lade Daten für {activeClubNameForEntry || 'Verein'}...</p></div>;
  }

  if (availableRunningSeasons.length === 0 && !isLoadingPageData) {
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
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung</h1>
          <HelpTooltip 
            text="Hier können Sie Ergebnisse für Mannschaften erfassen und speichern." 
            side="right" 
            className="ml-2"
          />
        </div>
      </div>
      
      <Card className="shadow-md">
        <CardHeader><CardTitle>Einzelergebnis zur Liste hinzufügen</CardTitle><CardDescription>Wählen Sie Parameter und fügen Sie Ergebnisse hinzu.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="vver-season">Saison (laufend)</Label>
                <HelpTooltip 
                  text="Wählen Sie die Saison aus, für die Sie Ergebnisse erfassen möchten." 
                  className="ml-2"
                />
              </div>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId} disabled={availableRunningSeasons.length === 0}>
                <SelectTrigger id="vver-season"><SelectValue placeholder={availableRunningSeasons.length === 0 ? "Keine Saisons" : "Saison wählen"} /></SelectTrigger>
                <SelectContent>{availableRunningSeasons.filter(s => s.id).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="vver-league">Liga (Ihres Vereins)</Label>
                <HelpTooltip 
                  text="Wählen Sie die Liga aus, für die Sie Ergebnisse erfassen möchten." 
                  className="ml-2"
                />
              </div>
              <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId} disabled={!selectedSeasonId || isLoadingLeagues || leaguesForActiveClubAndSeason.length === 0}>
                <SelectTrigger id="vver-league"><SelectValue placeholder={isLoadingLeagues ? "Lade Ligen..." : (leaguesForActiveClubAndSeason.length === 0 && selectedSeasonId ? "Keine Ligen für Verein/Saison" : "Liga wählen")} /></SelectTrigger>
                <SelectContent>{leaguesForActiveClubAndSeason.filter(l=>l.id).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"> {/* Durchgang vor Mannschaft */}
              <div className="flex items-center">
                <Label htmlFor="vver-round">Durchgang</Label>
                <HelpTooltip 
                  text="Wählen Sie den Durchgang aus, für den Sie Ergebnisse erfassen möchten." 
                  className="ml-2"
                />
              </div>
              <Select value={selectedRound} onValueChange={(value) => { setSelectedRound(value);}} disabled={!selectedLeagueId}>
                <SelectTrigger id="vver-round"><SelectValue placeholder="Durchgang wählen" /></SelectTrigger>
                <SelectContent>{[...Array(numRoundsForSelect)].map((_, i) => (<SelectItem key={i + 1} value={(i + 1).toString()}>Durchgang {i + 1}</SelectItem>))}</SelectContent>
              </Select>
            </div>
             <div className="space-y-2"> {/* Mannschaft nach Durchgang */}
              <div className="flex items-center">
                <Label htmlFor="vver-team">Mannschaft (Eigene oder Gegner)</Label>
                <HelpTooltip 
                  text="Wählen Sie die Mannschaft aus, für die Sie Ergebnisse erfassen möchten. Es werden nur Mannschaften angezeigt, die noch nicht vollständig erfasst sind." 
                  className="ml-2"
                />
              </div>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={!selectedLeagueId || isLoadingTeams || !selectedRound || allTeamsInSelectedLeague.length === 0}>
                <SelectTrigger id="vver-team"><SelectValue placeholder={isLoadingTeams ? "Lade Teams..." : (!selectedRound ? "Durchgang wählen" : (allTeamsInSelectedLeague.length === 0 && selectedLeagueId && selectedRound ? "Alle Teams vollständig erfasst" : "Mannschaft wählen"))} /></SelectTrigger>
                <SelectContent>{allTeamsInSelectedLeague.filter(t=>t.id).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="vver-shooter">Schütze</Label>
                <HelpTooltip 
                  text="Wählen Sie den Schützen aus, für den Sie ein Ergebnis erfassen möchten. Schützen mit ⚠️ haben noch kein Ergebnis für diesen Durchgang." 
                  className="ml-2"
                />
              </div>
              <Select value={selectedShooterId} onValueChange={setSelectedShooterId} disabled={!selectedTeamId || isLoadingShooters || isLoadingExistingScores || (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound)}>
                <SelectTrigger id="vver-shooter"><SelectValue placeholder={isLoadingShooters || isLoadingExistingScores ? "Lade Schützen..." : (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound ? "Alle erfasst/keine" : "Schütze wählen")} /></SelectTrigger>
                <SelectContent>
                  {availableShootersForDropdown.filter(sh=>sh.id).map(sh => {
                    // Prüfen, ob der Schütze bereits Ergebnisse hat
                    const hasExistingScore = existingScoresForTeamAndRound.some(score => score.shooterId === sh.id);
                    const hasPendingScore = pendingScores.some(ps => ps.shooterId === sh.id && ps.teamId === selectedTeamId && ps.durchgang === parseInt(selectedRound, 10));
                    const hasJustSavedScore = justSavedScoreIdentifiers.some(js => js.shooterId === sh.id && js.durchgang === parseInt(selectedRound, 10));
                    
                    // Wenn der Schütze noch kein Ergebnis hat, heben wir ihn hervor
                    const needsScore = !hasExistingScore && !hasPendingScore && !hasJustSavedScore;
                    
                    return (
                      <SelectItem 
                        key={sh.id} 
                        value={sh.id} 
                        className={needsScore ? "font-bold text-primary" : ""}
                      >
                        {needsScore ? `${sh.name} ⚠️` : sh.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="vver-score">Ergebnis (Ringe)</Label>
                <HelpTooltip 
                  text="Geben Sie das Ergebnis in Ringen ein. Je nach Disziplin sind Werte zwischen 0-300 oder 0-400 möglich." 
                  className="ml-2"
                />
              </div>
              <Input 
                id="vver-score" 
                type="number" 
                value={score} 
                style={{ MozAppearance: 'textfield' }}
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onChange={(e) => {
                  const value = e.target.value;
                  setScore(value);
                  
                  // Live-Validierung der Ringzahlen
                  if (value && selectedLeagueId) {
                    const scoreVal = parseInt(value);
                    let maxPossibleScore = 300;
                    const fourHundredPointDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
                    const selectedLeagueObject = allLeagues.find(l => l.id === selectedLeagueId);
                    
                    if (selectedLeagueObject && fourHundredPointDisciplines.includes(selectedLeagueObject.type)) {
                      maxPossibleScore = 400;
                    }
                    
                    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxPossibleScore) {
                      e.target.setCustomValidity(`Bitte geben Sie eine gültige Ringzahl zwischen 0 und ${maxPossibleScore} ein.`);
                    } else {
                      e.target.setCustomValidity('');
                    }
                  }
                }}
                placeholder="z.B. 285" 
                disabled={!selectedShooterId}
                className={score && selectedLeagueId ? (
                  (() => {
                    const scoreVal = parseInt(score);
                    let maxPossibleScore = 300;
                    const fourHundredPointDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
                    const selectedLeagueObject = allLeagues.find(l => l.id === selectedLeagueId);
                    
                    if (selectedLeagueObject && fourHundredPointDisciplines.includes(selectedLeagueObject.type)) {
                      maxPossibleScore = 400;
                    }
                    
                    return (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxPossibleScore) 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-green-500 focus:ring-green-500";
                  })()
                ) : ""}
              />
              {score && selectedLeagueId && (() => {
                const scoreVal = parseInt(score);
                let maxPossibleScore = 300;
                const fourHundredPointDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
                const selectedLeagueObject = allLeagues.find(l => l.id === selectedLeagueId);
                
                if (selectedLeagueObject && fourHundredPointDisciplines.includes(selectedLeagueObject.type)) {
                  maxPossibleScore = 400;
                }
                
                if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxPossibleScore) {
                  return <p className="text-xs text-red-500 mt-1">Bitte geben Sie eine gültige Ringzahl zwischen 0 und {maxPossibleScore} ein.</p>;
                }
                return null;
              })()}
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex items-center">
              <Label>Ergebnistyp</Label>
              <HelpTooltip 
                text="Wählen Sie den Typ des Ergebnisses: Regulär für normale Wettkämpfe, Vorschießen für vorzeitig geschossene Ergebnisse, Nachschießen für nachträglich geschossene Ergebnisse." 
                className="ml-2"
              />
            </div>
            <RadioGroup value={resultType} onValueChange={(value) => setResultType(value as "regular" | "pre" | "post")} className="flex space-x-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="regular" id="vver-r-regular" /><Label htmlFor="vver-r-regular">Regulär</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="pre" id="vver-r-pre" /><Label htmlFor="vver-r-pre">Vorschießen</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="post" id="vver-r-post" /><Label htmlFor="vver-r-post">Nachschießen</Label></div>
            </RadioGroup>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleAddToList} disabled={!selectedShooterId || !selectedRound || !score || isSubmittingScores || isLoadingExistingScores}><Plus className="mr-2 h-5 w-5" /> Zur Liste hinzufügen</Button>
          </div>
        </CardContent>
      </Card>

      {pendingScores.length > 0 && (
        <Card className="shadow-md mt-6">
          <CardHeader><CardTitle>Vorgemerkte Ergebnisse ({pendingScores.length})</CardTitle>
            <CardDescription>
              Saison: {allSeasons.find(s=>s.id === selectedSeasonId)?.name || '-'} | 
              Liga: {allLeagues.find(l=>l.id===selectedLeagueId)?.name || '-'} 
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Schütze</TableHead><TableHead>Mannschaft</TableHead><TableHead className="text-center">DG</TableHead><TableHead className="text-center">Ringe</TableHead><TableHead>Typ</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
              <TableBody>{pendingScores.map((entry) => (<TableRow key={entry.tempId}><TableCell>{entry.shooterName}</TableCell><TableCell>{entry.teamName}</TableCell><TableCell className="text-center">{entry.durchgang}</TableCell><TableCell className="text-center">{entry.totalRinge}</TableCell><TableCell>{entry.scoreInputType === 'pre' ? 'Vorschuss' : entry.scoreInputType === 'post' ? 'Nachschuss' : 'Regulär'}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleRemoveFromList(entry.tempId)} className="text-destructive hover:text-destructive/80" disabled={isSubmittingScores}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
            <div className="flex justify-end pt-6"><Button onClick={handleFinalSave} size="lg" disabled={isSubmittingScores || pendingScores.length === 0}>{isSubmittingScores && <Loader className="mr-2 h-4 w-4 animate-spin" />} Alle {pendingScores.length} Ergebnisse speichern</Button></div>
          </CardContent>
        </Card>
      )}
      {hasMoreShooters && (
        <Card className="shadow-md">
          <CardContent className="pt-6 text-center">
            <Button 
              onClick={() => {
                setShootersLimit(prev => prev + 30);
                // Cache invalidieren um mehr Schützen zu laden
                const cacheKey = `results-data-${activeClubIdForEntry}`;
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(cacheKey + '-time');
                fetchInitialPageData();
              }}
              variant="outline"
            >
              Weitere 30 Schützen laden
            </Button>
          </CardContent>
        </Card>
      )}
      
      {pendingScores.length === 0 && !isLoadingPageData && activeClubIdForEntry && (
         <div className="mt-8 p-6 text-center text-muted-foreground bg-secondary/30 rounded-md"><CheckSquare className="mx-auto h-10 w-10 mb-3 text-primary/70" /><p className="text-base">Noch keine Ergebnisse zur Speicherung vorgemerkt.</p></div>
      )}
    </div>
  );
}

