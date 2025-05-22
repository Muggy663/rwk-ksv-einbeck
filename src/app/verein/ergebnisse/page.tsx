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
import { CheckSquare, Save, PlusCircle, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import type { Season, League, Team, Shooter, PendingScoreEntry, ScoreEntry, FirestoreLeagueSpecificDiscipline, Club, LeagueUpdateEntry } from '@/types/rwk';
import { useVereinAuth } from '@/app/verein/layout';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, writeBatch, serverTimestamp, doc, documentId, getDoc as getFirestoreDoc, Timestamp } from 'firebase/firestore';

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
  
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [availableRunningSeasons, setAvailableRunningSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  const [allLeagues, setAllLeagues] = useState<League[]>([]); // Alle Ligen für die Saison
  const [leaguesForActiveClubAndSeason, setLeaguesForActiveClubAndSeason] = useState<League[]>([]); // Ligen, in denen der activeClubIdForEntry Teams hat
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
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingShooters, setIsLoadingShooters] = useState(false);
  const [isLoadingExistingScores, setIsLoadingExistingScores] = useState(false);
  const [isSubmittingScores, setIsSubmittingScores] = useState(false);

  // Effect to set activeClubIdForEntry based on assignedClubId from context
  useEffect(() => {
    console.log("VER_ERGEBNISSE DEBUG: Effect for activeClubIdForEntry. loadingPermissions:", loadingPermissions, "assignedClubId from context:", assignedClubId);
    if (!loadingPermissions) {
      if (assignedClubId && typeof assignedClubId === 'string' && assignedClubId.trim() !== '') {
        setActiveClubIdForEntry(assignedClubId);
        console.log("VER_ERGEBNISSE DEBUG: activeClubIdForEntry SET to:", assignedClubId);
        // Fetch club name for display
        const fetchClubName = async () => {
          try {
            const clubDocRef = doc(db, CLUBS_COLLECTION, assignedClubId);
            const clubSnap = await getFirestoreDoc(clubDocRef); // Korrekter Funktionsname
            if (clubSnap.exists()) {
              setActiveClubNameForEntry(clubSnap.data().name);
            } else {
              setActiveClubNameForEntry("Unbek. Verein (ID nicht gefunden)");
              console.warn("VER_ERGEBNISSE DEBUG: Club with ID", assignedClubId, "not found in Firestore.");
            }
          } catch (e) {
            console.error("VER_ERGEBNISSE DEBUG: Error fetching club name:", e);
            setActiveClubNameForEntry("Fehler beim Laden des Vereinsnamens");
          }
        };
        fetchClubName();
      } else {
        console.warn("VER_ERGEBNISSE DEBUG: No valid assignedClubId from context. Setting activeClubForEntry to null.");
        setActiveClubIdForEntry(null);
        setActiveClubNameForEntry(null);
      }
    }
  }, [assignedClubId, loadingPermissions]);


  // Fetch initial global data (Seasons, all Shooters)
  const fetchInitialPageData = useCallback(async () => {
    if (loadingPermissions) { // Wait for permissions to be resolved
      console.log("VER_ERGEBNISSE DEBUG: fetchInitialPageData - Waiting for permissions.");
      setIsLoadingPageData(true); 
      return; 
    }
    if (!activeClubIdForEntry && !userPermission?.isSuperAdmin) { // isSuperAdmin ist hier nicht direkt verfügbar, aber als Beispiel
      console.log("VER_ERGEBNISSE DEBUG: fetchInitialPageData - No activeClubIdForEntry, aborting. User:", userPermission?.email);
      setIsLoadingPageData(false);
      setAllSeasons([]);
      setAvailableRunningSeasons([]);
      setAllLeagues([]);
      setAllShootersFromDB([]);
      return;
    }
    console.log("VER_ERGEBNISSE DEBUG: fetchInitialPageData triggered. ActiveClubForEntry:", activeClubIdForEntry);
    setIsLoadingPageData(true);
    try {
      const seasonsSnapshotPromise = getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
      // Lade ALLE Ligen einmalig, um später filtern zu können
      const allLeaguesSnapshotPromise = getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      const shootersSnapshotPromise = getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("name", "asc"))); // Lade alle Schützen für Dropdowns

      const [seasonsSnapshot, allLeaguesSnapshot, shootersSnapshot] = await Promise.all([
          seasonsSnapshotPromise, allLeaguesSnapshotPromise, shootersSnapshotPromise
      ]);
      
      const fetchedSeasons = seasonsSnapshot.docs.map(sDoc => ({ id: sDoc.id, ...sDoc.data() } as Season)).filter(s => s.id);
      setAllSeasons(fetchedSeasons);
      const runningSeasons = fetchedSeasons.filter(s => s.status === 'Laufend');
      setAvailableRunningSeasons(runningSeasons);
      console.log("VER_ERGEBNISSE DEBUG: Seasons fetched:", fetchedSeasons.length, "Running:", runningSeasons.length);
      if (runningSeasons.length === 1 && !selectedSeasonId) {
        setSelectedSeasonId(runningSeasons[0].id);
      }

      const fetchedAllLeagues = allLeaguesSnapshot.docs.map(lDoc => ({ id: lDoc.id, ...lDoc.data() } as League)).filter(l => l.id);
      setAllLeagues(fetchedAllLeagues);
      console.log("VER_ERGEBNISSE DEBUG: All leagues fetched:", fetchedAllLeagues.length);
      
      const fetchedAllShooters = shootersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Shooter)).filter(s => s.id);
      setAllShootersFromDB(fetchedAllShooters);
      console.log("VER_ERGEBNISSE DEBUG: All shooters fetched:", fetchedAllShooters.length);

    } catch (error) {
      console.error("VER_ERGEBNISSE DEBUG: Error fetching initial page data:", error);
      toast({ title: "Fehler Basisdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingPageData(false);
      console.log("VER_ERGEBNISSE DEBUG: fetchInitialPageData finished.");
    }
  }, [activeClubIdForEntry, loadingPermissions, toast, selectedSeasonId, userPermission?.email]); // userPermission.email als Teil der Abhängigkeit

  useEffect(() => { 
    if (!loadingPermissions && (activeClubIdForEntry || userPermission?.email === 'admin@rwk-einbeck.de' )) { // Admin kann immer laden
        fetchInitialPageData(); 
    }
  }, [fetchInitialPageData, loadingPermissions, activeClubIdForEntry, userPermission?.email]);


  // Effect to load leagues for the selected season in which the activeClubIdForEntry has teams
  useEffect(() => {
    const loadLeaguesForSeasonAndClub = async () => {
      console.log("VER_ERGEBNISSE DEBUG: loadLeaguesForSeasonAndClub - selectedSeasonId:", selectedSeasonId, "activeClubIdForEntry:", activeClubIdForEntry);
      if (!selectedSeasonId || !activeClubIdForEntry || allLeagues.length === 0) {
        setLeaguesForActiveClubAndSeason([]); 
        setSelectedLeagueId(''); 
        console.log("VER_ERGEBNISSE DEBUG: loadLeaguesForSeasonAndClub - Pre-conditions not met or allLeagues empty.");
        return;
      }
      setIsLoadingLeagues(true);
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (!currentSeason) {
        setLeaguesForActiveClubAndSeason([]); 
        setSelectedLeagueId(''); 
        setIsLoadingLeagues(false); 
        console.warn("VER_ERGEBNISSE DEBUG: loadLeaguesForSeasonAndClub - Current season not found.");
        return;
      }
      try {
        const teamsOfThisClubQuery = query(collection(db, TEAMS_COLLECTION), 
            where("clubId", "==", activeClubIdForEntry), 
            where("competitionYear", "==", currentSeason.competitionYear)
        );
        const teamsSnap = await getDocs(teamsOfThisClubQuery);
        const leagueIdsOfClubTeams = Array.from(new Set(teamsSnap.docs.map(d => (d.data() as Team).leagueId).filter(id => !!id))) as string[];
        console.log("VER_ERGEBNISSE DEBUG: loadLeaguesForSeasonAndClub - League IDs of club's teams:", leagueIdsOfClubTeams);

        if (leagueIdsOfClubTeams.length === 0) {
          setLeaguesForActiveClubAndSeason([]); 
          setIsLoadingLeagues(false); 
          console.log("VER_ERGEBNISSE DEBUG: loadLeaguesForSeasonAndClub - No leagues found for this club in this season.");
          return;
        }
        
        const filteredLeagues = allLeagues.filter(l => 
            leagueIdsOfClubTeams.includes(l.id) && l.seasonId === selectedSeasonId
        ).sort((a,b) => (a.order || 0) - (b.order || 0));
        
        setLeaguesForActiveClubAndSeason(filteredLeagues.filter(l => l.id));
        console.log("VER_ERGEBNISSE DEBUG: loadLeaguesForSeasonAndClub - Filtered leagues for VV:", filteredLeagues.length);
      } catch (error) {
        console.error("VER_ERGEBNISSE DEBUG: Error fetching leagues for VV:", error);
        toast({ title: "Fehler Ligenladen", description: (error as Error).message, variant: "destructive" });
        setLeaguesForActiveClubAndSeason([]);
      } finally {
        setIsLoadingLeagues(false); 
        setSelectedLeagueId('');
      }
    };
    if (selectedSeasonId && activeClubIdForEntry) loadLeaguesForSeasonAndClub(); else setLeaguesForActiveClubAndSeason([]);
  }, [selectedSeasonId, activeClubIdForEntry, allSeasons, allLeagues, toast]);


  // Effect to load all teams in the selected league (for VV, to select own or opponent team)
  useEffect(() => {
    const loadTeamsInLeague = async () => {
      console.log("VER_ERGEBNISSE DEBUG: loadTeamsInLeague - selectedLeagueId:", selectedLeagueId, "selectedSeasonId:", selectedSeasonId);
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
          console.warn("VER_ERGEBNISSE DEBUG: loadTeamsInLeague - Current season not found for team loading.");
          return; 
      }
      try {
        const q = query(collection(db, TEAMS_COLLECTION), 
            where("leagueId", "==", selectedLeagueId), 
            where("competitionYear", "==", currentSeason.competitionYear), 
            orderBy("name", "asc")
        );
        const snapshot = await getDocs(q);
        setAllTeamsInSelectedLeague(snapshot.docs.map(teamDoc => ({ id: teamDoc.id, ...teamDoc.data() } as Team)).filter(t => t.id));
        console.log("VER_ERGEBNISSE DEBUG: loadTeamsInLeague - Teams in league fetched:", snapshot.docs.length);
      } catch (error) {
        console.error("VER_ERGEBNISSE DEBUG: Error fetching teams in league:", error);
        toast({ title: "Fehler Teamladen", description: (error as Error).message, variant: "destructive" });
        setAllTeamsInSelectedLeague([]);
      } finally {
        setIsLoadingTeams(false); 
        setSelectedTeamId('');
      }
    };
    if (selectedLeagueId && selectedSeasonId && activeClubIdForEntry) loadTeamsInLeague(); else setAllTeamsInSelectedLeague([]);
  }, [selectedLeagueId, selectedSeasonId, allSeasons, activeClubIdForEntry, toast]);
  

  // Effect to load shooters for the selected team
  useEffect(() => {
    const loadShootersForTeam = async () => {
        console.log("VER_ERGEBNISSE DEBUG: loadShootersForTeam - selectedTeamId:", selectedTeamId);
        if (!selectedTeamId) { 
            setShootersOfSelectedTeam([]); 
            setSelectedShooterId('');
            return; 
        }
        setIsLoadingShooters(true);
        try {
            const teamData = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId);
            if (teamData && teamData.shooterIds && teamData.shooterIds.length > 0) {
                const validShooterIds = teamData.shooterIds.filter(id => id && typeof id === 'string' && id.trim() !== "");
                console.log("VER_ERGEBNISSE DEBUG: loadShootersForTeam - Valid shooter IDs from team data:", validShooterIds);
                if (validShooterIds.length > 0) {
                    // Filter from allShootersFromDB instead of making new DB call
                    const shootersForTeam = allShootersFromDB
                        .filter(shooter => validShooterIds.includes(shooter.id))
                        .sort((a, b) => a.name.localeCompare(b.name));
                    setShootersOfSelectedTeam(shootersForTeam);
                    console.log("VER_ERGEBNISSE DEBUG: loadShootersForTeam - Shooters for team set from allShootersFromDB:", shootersForTeam.length);
                } else {
                     setShootersOfSelectedTeam([]);
                     console.log("VER_ERGEBNISSE DEBUG: loadShootersForTeam - No valid shooter IDs in team data.");
                }
            } else {
                setShootersOfSelectedTeam([]);
                 console.log("VER_ERGEBNISSE DEBUG: loadShootersForTeam - No teamData or no shooterIds in teamData.");
            }
        } catch (error) {
            console.error("VER_ERGEBNISSE DEBUG: Error fetching shooters for team:", error);
            toast({ title: "Fehler Schützenladen", description: (error as Error).message, variant: "destructive" });
            setShootersOfSelectedTeam([]);
        } finally {
            setIsLoadingShooters(false);
            setSelectedShooterId('');
        }
    };
    if (selectedTeamId && allShootersFromDB.length > 0 && activeClubIdForEntry) loadShootersForTeam(); else setShootersOfSelectedTeam([]);
  }, [selectedTeamId, allTeamsInSelectedLeague, allShootersFromDB, activeClubIdForEntry, toast]);


  // Effect to load existing scores for the selected team and round
  useEffect(() => {
    const fetchExistingScores = async () => {
      console.log("VER_ERGEBNISSE DEBUG: fetchExistingScores - selectedTeamId:", selectedTeamId, "selectedSeasonId:", selectedSeasonId, "selectedRound:", selectedRound);
      const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
      if (!selectedTeamId || !currentSeason?.competitionYear || !selectedRound) {
        setExistingScoresForTeamAndRound([]); 
        return;
      }
      setIsLoadingExistingScores(true);
      try {
        const scoresQuery = query(collection(db, SCORES_COLLECTION), 
            where("teamId", "==", selectedTeamId), 
            where("competitionYear", "==", currentSeason.competitionYear), 
            where("durchgang", "==", parseInt(selectedRound, 10))
        );
        const snapshot = await getDocs(scoresQuery);
        const fetchedScores = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));
        setExistingScoresForTeamAndRound(fetchedScores);
        console.log("VER_ERGEBNISSE DEBUG: Fetched", fetchedScores.length, "existing scores for team", selectedTeamId, "round", selectedRound);
      } catch (error) {
        console.error("VER_ERGEBNISSE DEBUG: Error fetching existing scores: ", error);
        toast({ title: "Fehler Lade Ex. Ergebnisse", description: (error as Error).message, variant: "destructive" });
        setExistingScoresForTeamAndRound([]);
      } finally {
        setIsLoadingExistingScores(false);
      }
    };
    if (selectedTeamId && selectedSeasonId && selectedRound && activeClubIdForEntry) fetchExistingScores(); else {
      setExistingScoresForTeamAndRound([]);
      // Reset justSaved if round changes, to allow re-entry for new round
      if(selectedTeamId && selectedSeasonId && !selectedRound) setJustSavedScoreIdentifiers([]);
    }
  }, [selectedTeamId, selectedSeasonId, selectedRound, allSeasons, activeClubIdForEntry, toast]);


  // Effect to update available shooters for dropdown (excluding those already in pending or saved)
   useEffect(() => {
    console.log("VER_ERGEBNISSE DEBUG: Effect for availableShootersForDropdown. selectedTeamId:", selectedTeamId, "selectedRound:", selectedRound, "shootersOfSelectedTeam len:", shootersOfSelectedTeam.length);
    if (selectedTeamId && selectedRound && shootersOfSelectedTeam.length > 0) {
      const parsedRound = parseInt(selectedRound, 10);
      
      const shootersInPendingThisRound = pendingScores
        .filter(ps => ps.teamId === selectedTeamId && ps.durchgang === parsedRound)
        .map(ps => ps.shooterId);
        console.log("VER_ERGEBNISSE DEBUG: Shooters in pending for this round:", shootersInPendingThisRound);

      const shootersInJustSavedThisRound = justSavedScoreIdentifiers
        .filter(js => js.durchgang === parsedRound && shootersOfSelectedTeam.some(s => s.id === js.shooterId)) 
        .map(js => js.shooterId);
        console.log("VER_ERGEBNISSE DEBUG: Shooters in justSaved for this round:", shootersInJustSavedThisRound);
      
      const shootersInExistingScoresThisRound = existingScoresForTeamAndRound 
        .filter(es => es.durchgang === parsedRound)
        .map(es => es.shooterId);
        console.log("VER_ERGEBNISSE DEBUG: Shooters in existing scores for this round:", shootersInExistingScoresThisRound);
      
      const filtered = shootersOfSelectedTeam.filter(sh => 
        sh.id && 
        !shootersInPendingThisRound.includes(sh.id) &&
        !shootersInJustSavedThisRound.includes(sh.id) &&
        !shootersInExistingScoresThisRound.includes(sh.id)
      );
      setAvailableShootersForDropdown(filtered);
      console.log("VER_ERGEBNISSE DEBUG: Available shooters for dropdown:", filtered.map(s => s.name));
    } else {
      setAvailableShootersForDropdown([]);
      console.log("VER_ERGEBNISSE DEBUG: Clearing available shooters for dropdown.");
    }
  }, [selectedTeamId, selectedRound, shootersOfSelectedTeam, pendingScores, justSavedScoreIdentifiers, existingScoresForTeamAndRound]);

  // Reset dependent states when higher-level selections change
  useEffect(() => { setSelectedLeagueId(''); setSelectedTeamId(''); setSelectedShooterId(''); setSelectedRound(''); setPendingScores([]); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]);}, [selectedSeasonId, activeClubIdForEntry]);
  useEffect(() => { setSelectedTeamId(''); setSelectedShooterId(''); setSelectedRound(''); /* Keep pendingScores */ setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]);}, [selectedLeagueId]);
  useEffect(() => { setSelectedShooterId(''); setSelectedRound(''); /* Keep pendingScores */ setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]);}, [selectedTeamId]);
  useEffect(() => { setSelectedShooterId(''); setScore(''); /* Keep pendingScores, Keep justSaved */ setExistingScoresForTeamAndRound([]);}, [selectedRound]); // Keep justSaved for current team if only round changes

  const handleAddToList = () => {
    console.log("VER_ERGEBNISSE DEBUG: handleAddToList called.");
    if (!userPermission?.uid) { 
      toast({ title: "Fehler", description: "Benutzer nicht identifiziert.", variant: "destructive" }); return;
    }
    if (!selectedShooterId || !selectedRound || !score || !selectedSeasonId || !selectedLeagueId || !selectedTeamId || !activeClubIdForEntry ) {
      toast({ title: "Fehlende Eingabe", description: "Bitte alle Felder (Saison, Liga, Mannschaft, Durchgang, Schütze, Ergebnis) ausfüllen.", variant: "destructive" }); return;
    }
    const scoreVal = parseInt(score);
    
    const season = allSeasons.find(s => s.id === selectedSeasonId);
    const league = allLeagues.find(l => l.id === selectedLeagueId); // Ligen des VV
    const team = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId); // Alle Teams der Liga
    const shooter = allShootersFromDB.find(sh => sh.id === selectedShooterId);

    if (!season || !league || !team || !shooter) {
      toast({ title: "Datenfehler", description: "Ausgewählte Daten konnten nicht vollständig geladen werden. Bitte Auswahl überprüfen.", variant: "destructive" }); 
      console.error("VER_ERGEBNISSE DEBUG: AddToList - Missing data:", {season, league, team, shooter});
      return;
    }
    
    const leagueSpecificType = league.type as FirestoreLeagueSpecificDiscipline;
    let maxPossibleScore = 300; 
    const fourHundredPointDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
    if (fourHundredPointDisciplines.includes(leagueSpecificType)) {
        maxPossibleScore = 400;
    }
    
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxPossibleScore) {
      toast({ title: "Ungültiges Ergebnis", description: `Bitte eine gültige Ringzahl (0-${maxPossibleScore}) eingeben.`, variant: "destructive" }); return;
    }
    
    const parsedRound = parseInt(selectedRound, 10);
    if (pendingScores.some(ps => ps.shooterId === selectedShooterId && ps.durchgang === parsedRound && ps.teamId === selectedTeamId) || 
        justSavedScoreIdentifiers.some(js => js.shooterId === selectedShooterId && js.durchgang === parsedRound) ||
        existingScoresForTeamAndRound.some(es => es.shooterId === selectedShooterId && es.durchgang === parsedRound)) {
      toast({ title: "Ergebnis existiert bereits", description: `${shooter.name} hat bereits ein Ergebnis für DG ${selectedRound} in dieser Mannschaft.`, variant: "warning"}); return;
    }

    const newPendingEntry: PendingScoreEntry = {
      tempId: new Date().toISOString() + Math.random().toString(36).substring(2, 15),
      seasonId: selectedSeasonId, 
      seasonName: season.name,
      leagueId: selectedLeagueId, 
      leagueName: league.name, 
      leagueType: league.type, // spezifischer Typ
      teamId: selectedTeamId, 
      teamName: team.name, 
      clubId: team.clubId!, // ClubId des Teams, für das das Ergebnis ist
      shooterId: selectedShooterId, 
      shooterName: shooter.name, 
      shooterGender: shooter.gender,
      durchgang: parsedRound, 
      totalRinge: scoreVal,
      scoreInputType: resultType, 
      competitionYear: season.competitionYear,
    };
    setPendingScores(prev => [...prev, newPendingEntry]);
    toast({ title: "Ergebnis hinzugefügt", description: `${shooter.name} - DG ${selectedRound}: ${scoreVal} Ringe zur Liste hinzugefügt.` });
    setSelectedShooterId(''); 
    setScore(''); 
    console.log("VER_ERGEBNISSE DEBUG: Added to pending scores:", newPendingEntry);
  };

  const handleRemoveFromList = (tempId: string) => {
    setPendingScores(prev => prev.filter(p => p.tempId !== tempId));
    toast({ title: "Eintrag entfernt", description: "Ergebnis aus der Liste entfernt.", variant: "destructive" });
  };

  const handleFinalSave = async () => {
    console.log("VER_ERGEBNISSE DEBUG: handleFinalSave called.");
    if (!userPermission?.uid) { 
      toast({ title: "Fehler", description: "Benutzer nicht identifiziert.", variant: "destructive" }); return;
    }
    if (pendingScores.length === 0) {
      toast({ title: "Keine Ergebnisse", description: "Es gibt keine Ergebnisse zum Speichern.", variant: "destructive" }); return;
    }
    setIsSubmittingScores(true);
    const batch = writeBatch(db);
    const newlySavedIdentifiers: { shooterId: string; durchgang: number }[] = [];
    
    // Group pending scores by league to create/update league_updates entries
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
        const { tempId, ...dataToSave } = entry; // remove tempId
        const scoreDocRef = doc(collection(db, SCORES_COLLECTION)); 
        
        const scoreDataForDb: Omit<ScoreEntry, 'id' | 'entryTimestamp' | 'enteredByUserId' | 'enteredByUserName'> = {
            seasonId: dataToSave.seasonId,
            seasonName: dataToSave.seasonName,
            leagueId: dataToSave.leagueId,
            leagueName: dataToSave.leagueName,
            leagueType: dataToSave.leagueType, // spezifischer Typ
            teamId: dataToSave.teamId,
            teamName: dataToSave.teamName,
            clubId: dataToSave.clubId, // Wichtig: clubId des Teams
            shooterId: dataToSave.shooterId,
            shooterName: dataToSave.shooterName,
            shooterGender: dataToSave.shooterGender,
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

      // Process league updates
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
            // Update existing entry for today
            const existingUpdateDocRef = existingUpdatesSnapshot.docs[0].ref;
            batch.update(existingUpdateDocRef, { timestamp: serverTimestamp() });
             console.log("VER_ERGEBNISSE DEBUG: Updated existing league update entry for leagueId", updateInfo.leagueId);
        } else {
            // Create new entry
            const leagueUpdateData: Omit<LeagueUpdateEntry, 'id'> = {
                leagueId: updateInfo.leagueId,
                leagueName: updateInfo.leagueName,
                leagueType: updateInfo.leagueType, 
                competitionYear: updateInfo.competitionYear,
                timestamp: serverTimestamp(),
                action: 'results_added', // Or a more generic 'updated'
            };
            const leagueUpdateDocRef = doc(collection(db, LEAGUE_UPDATES_COLLECTION));
            batch.set(leagueUpdateDocRef, leagueUpdateData);
            console.log("VER_ERGEBNISSE DEBUG: Added new league update entry for leagueId", updateInfo.leagueId);
        }
      }

      await batch.commit();
      toast({ title: "Ergebnisse gespeichert", description: `${pendingScores.length} Ergebnisse wurden erfolgreich in der Datenbank gespeichert.` });
      setPendingScores([]);
      setJustSavedScoreIdentifiers(prev => [...prev, ...newlySavedIdentifiers]); // Add to existing justSaved for this session
      
      // Refetch existing scores for the current team/round to update the UI immediately
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

    } catch (error: any) { // Typ für error expliziter machen
        console.error("VER_ERGEBNISSE DEBUG: Error saving scores to Firestore: ", error);
        toast({ title: "Fehler beim Speichern", description: error.message || "Unbekannter Fehler", variant: "destructive" });
    } finally {
        setIsSubmittingScores(false);
    }
  };

  const selectedLeagueObject = leaguesForActiveClubAndSeason.find(l => l.id === selectedLeagueId);
  let numRoundsForSelect = 5; // Default KK
  if (selectedLeagueObject) {
    const fourHundredPointDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
    if (fourHundredPointDisciplines.includes(selectedLeagueObject.type)) {
      numRoundsForSelect = 4; // 4 Durchgänge für Luftdruck
    }
  }


  if (loadingPermissions || isLoadingPageData) {
    return <div className="flex justify-center items-center py-12"><Loader2 className="h-12 w-12 animate-spin text-primary mr-3" /><p>Lade Benutzer- und Seitendaten...</p></div>;
  }
  if (permissionError) {
    return <div className="p-6"><Card className="border-destructive bg-destructive/5"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> {permissionError}</CardTitle></CardHeader><CardContent><p>Bitte kontaktieren Sie den Administrator.</p></CardContent></Card></div>;
  }
  if (!userPermission || !activeClubIdForEntry) { // Prüft, ob der aktive Club für die Erfassung gesetzt ist
     return (
        <div className="p-6">
            <Card className="border-amber-500 bg-amber-50/50">
                <CardHeader><CardTitle className="text-amber-700 flex items-center gap-2"><AlertTriangle />Vereinskontext fehlt</CardTitle></CardHeader>
                <CardContent>
                    <p>Ihrem Konto ist kein Verein für die Ergebniserfassung zugewiesen oder der Verein konnte nicht geladen werden.</p>
                    <p className="text-xs mt-1">Zugewiesene Club ID vom Context: {assignedClubId || "Nicht vorhanden"}</p>
                    <p className="text-xs mt-1">Aktiver Club ID für Erfassung: {activeClubIdForEntry || "Nicht gesetzt"}</p>
                </CardContent>
            </Card>
        </div>
     );
  }
  
  if (availableRunningSeasons.length === 0 && !isLoadingPageData) {
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung {activeClubNameForEntry ? `(${activeClubNameForEntry})` : ''}</h1>
        </div>
        <Card className="shadow-md border-amber-500">
            <CardHeader>
                <CardTitle className="text-amber-600 flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Keine laufenden Saisons</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Aktuell sind keine Saisons mit dem Status "Laufend" für die Ergebniserfassung verfügbar.</p>
                <p>Bitte überprüfen Sie die Saisonverwaltung oder bitten Sie den Administrator, eine laufende Saison anzulegen.</p>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung {activeClubNameForEntry ? `(für ${activeClubNameForEntry})` : ''}</h1>
      </div>
      
      <Card className="shadow-md">
        <CardHeader><CardTitle>Einzelergebnis zur Liste hinzufügen</CardTitle><CardDescription>Wählen Sie Parameter und fügen Sie Ergebnisse hinzu.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Saison Auswahl */}
            <div className="space-y-2">
              <Label htmlFor="vver-season">Saison (laufend)</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId} disabled={isLoadingPageData || availableRunningSeasons.length === 0}>
                <SelectTrigger id="vver-season"><SelectValue placeholder={isLoadingPageData ? "Lade Saisons..." : (availableRunningSeasons.length === 0 ? "Keine Saisons" : "Saison wählen")} /></SelectTrigger>
                <SelectContent>{availableRunningSeasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Liga Auswahl */}
            <div className="space-y-2">
              <Label htmlFor="vver-league">Liga (Ihres Vereins)</Label>
              <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId} disabled={!selectedSeasonId || isLoadingLeagues || leaguesForActiveClubAndSeason.length === 0}>
                <SelectTrigger id="vver-league"><SelectValue placeholder={isLoadingLeagues ? "Lade Ligen..." : (leaguesForActiveClubAndSeason.length === 0 && selectedSeasonId ? "Keine Ligen für Verein/Saison" : "Liga wählen")} /></SelectTrigger>
                <SelectContent>{leaguesForActiveClubAndSeason.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Mannschaft Auswahl */}
            <div className="space-y-2">
              <Label htmlFor="vver-team">Mannschaft (Eigene oder Gegner)</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={!selectedLeagueId || isLoadingTeams || allTeamsInSelectedLeague.length === 0}>
                <SelectTrigger id="vver-team"><SelectValue placeholder={isLoadingTeams ? "Lade Teams..." : (allTeamsInSelectedLeague.length === 0 && selectedLeagueId ? "Keine Teams für Liga" : "Mannschaft wählen")} /></SelectTrigger>
                <SelectContent>{allTeamsInSelectedLeague.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Durchgang Auswahl */}
            <div className="space-y-2">
              <Label htmlFor="vver-round">Durchgang</Label>
              <Select value={selectedRound} onValueChange={(value) => { setSelectedRound(value);}} disabled={!selectedTeamId}>
                <SelectTrigger id="vver-round"><SelectValue placeholder="Durchgang wählen" /></SelectTrigger>
                <SelectContent>{[...Array(numRoundsForSelect)].map((_, i) => (<SelectItem key={i + 1} value={(i + 1).toString()}>Durchgang {i + 1}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {/* Schütze Auswahl */}
            <div className="space-y-2">
              <Label htmlFor="vver-shooter">Schütze</Label>
              <Select value={selectedShooterId} onValueChange={setSelectedShooterId} disabled={!selectedRound || isLoadingShooters || isLoadingExistingScores || (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound)}>
                <SelectTrigger id="vver-shooter"><SelectValue placeholder={isLoadingShooters || isLoadingExistingScores ? "Lade Schützen..." : (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound ? "Alle erfasst/keine" : "Schütze wählen")} /></SelectTrigger>
                <SelectContent>{availableShootersForDropdown.map(sh => <SelectItem key={sh.id} value={sh.id}>{sh.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Ergebnis Eingabe */}
            <div className="space-y-2">
              <Label htmlFor="vver-score">Ergebnis (Ringe)</Label>
              <Input id="vver-score" type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="z.B. 285" disabled={!selectedShooterId} />
            </div>
          </div>
          {/* Ergebnistyp Auswahl */}
          <div className="space-y-3 pt-2">
            <Label>Ergebnistyp</Label>
            <RadioGroup value={resultType} onValueChange={(value) => setResultType(value as "regular" | "pre" | "post")} className="flex space-x-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="regular" id="vver-r-regular" /><Label htmlFor="vver-r-regular">Regulär</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="pre" id="vver-r-pre" /><Label htmlFor="vver-r-pre">Vorschießen</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="post" id="vver-r-post" /><Label htmlFor="vver-r-post">Nachschießen</Label></div>
            </RadioGroup>
          </div>
          {/* Button zum Hinzufügen */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleAddToList} disabled={!selectedShooterId || !selectedRound || !score || isSubmittingScores || isLoadingExistingScores}><PlusCircle className="mr-2 h-5 w-5" /> Zur Liste hinzufügen</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabelle für vorgemerkte Ergebnisse */}
      {pendingScores.length > 0 && (
        <Card className="shadow-md mt-6">
          <CardHeader><CardTitle>Vorgemerkte Ergebnisse ({pendingScores.length})</CardTitle>
            <CardDescription>
              Saison: {allSeasons.find(s=>s.id === selectedSeasonId)?.name || '-'} | 
              Liga: {allLeagues.find(l=>l.id===selectedLeagueId)?.name || '-'} | 
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
      {/* Meldung, wenn keine Ergebnisse vorgemerkt */}
      {pendingScores.length === 0 && !isLoadingPageData && activeClubIdForEntry && availableRunningSeasons.length > 0 && (
         <div className="mt-8 p-6 text-center text-muted-foreground bg-secondary/30 rounded-md"><CheckSquare className="mx-auto h-10 w-10 mb-3 text-primary/70" /><p className="text-base">Noch keine Ergebnisse zur Speicherung vorgemerkt.</p></div>
      )}
    </div>
  );
}
