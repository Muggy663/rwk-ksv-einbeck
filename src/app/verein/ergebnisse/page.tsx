
// /app/verein/ergebnisse/page.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MobileSelect as Select,
  MobileSelectContent as SelectContent,
  MobileSelectItem as SelectItem,
  MobileSelectTrigger as SelectTrigger,
  MobileSelectValue as SelectValue,
} from "@/components/ui/mobile-select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  MobileTable as Table,
  MobileTableBody as TableBody,
  MobileTableCell as TableCell,
  MobileTableHead as TableHead,
  MobileTableHeader as TableHeader,
  MobileTableRow as TableRow,
} from "@/components/ui/mobile-table";
import { CheckSquare, Save, Plus, Trash2, Loader, AlertCircle, Building, CheckCircle, Camera, Zap, AlertTriangle } from 'lucide-react';
import { VoiceInputButton } from '@/components/ui/voice-input-button';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { BackButton } from '@/components/ui/back-button';
import { createProgressToast } from '@/components/ui/progress-toast';
import { HandzettelOCR, type OCRMatchResult } from '@/components/ui/handzettel-ocr';
import type { Season, League, Team, Shooter, PendingScoreEntry, ScoreEntry, FirestoreLeagueSpecificDiscipline, Club, LeagueUpdateEntry, UserPermission } from '@/types/rwk';
import { leagueDisciplineOptions } from '@/types/rwk';
import { useVereinAuth } from '@/app/verein/layout'; 
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, writeBatch, serverTimestamp, doc, documentId, getDoc as getFirestoreDoc, Timestamp, setDoc, updateDoc, addDoc, limit } from 'firebase/firestore';
import { auditLogService } from '@/lib/services/audit-service';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "shooters";
const SCORES_COLLECTION = "rwk_scores";
const CLUBS_COLLECTION = "clubs";
const LEAGUE_UPDATES_COLLECTION = "league_updates";


export default function VereinErgebnissePage() {
  const { userPermission, loadingPermissions, permissionError, assignedClubId, currentClubId } = useVereinAuth();
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
  const [handzettelFiles, setHandzettelFiles] = useState<File[]>([]);
  const [showOCR, setShowOCR] = useState(false);

 useEffect(() => {

    if (!loadingPermissions) {
      const effectiveClubId = currentClubId || assignedClubId;
      if (effectiveClubId && typeof effectiveClubId === 'string' && effectiveClubId.trim() !== '') {
      setActiveClubIdForEntry(effectiveClubId);
      const fetchClubName = async () => {
        setIsLoadingAssignedClubDetails(true);
        try {
          const clubDocRef = doc(db, CLUBS_COLLECTION, effectiveClubId);
          const clubSnap = await getFirestoreDoc(clubDocRef);
          if (clubSnap.exists()) {
            setActiveClubNameForEntry(clubSnap.data()?.name || "Unbek. Verein");
          } else {
            setActiveClubNameForEntry("Zugew. Verein nicht gefunden");
            console.warn("VER_ERGEBNISSE DEBUG: Club with ID", effectiveClubId, "not found.");
          }
        } catch (e) {
          console.error("VER_ERGEBNISSE DEBUG: Error fetching assigned club name:", e);
          setActiveClubNameForEntry("Fehler Vereinsname");
        } finally {
          setIsLoadingAssignedClubDetails(false);
        }
      };
      fetchClubName();
    } else if (!loadingPermissions && !effectiveClubId) {
      console.warn("VER_ERGEBNISSE DEBUG: No effectiveClubId available after loading permissions.");
      setActiveClubIdForEntry(null);
      setActiveClubNameForEntry(null);
      setIsLoadingAssignedClubDetails(false);
    }
    }
  }, [assignedClubId, currentClubId, loadingPermissions]);


  const fetchInitialPageData = useCallback(async () => {

    if (!activeClubIdForEntry) {

      setIsLoadingPageData(false); 
      setAllSeasons([]); setAvailableRunningSeasons([]); setAllLeagues([]); setAllShootersFromDB([]);
      return;
    }
    
    // Cache für Ergebniserfassung deaktiviert
    // Daten werden immer frisch geladen, um Probleme zu vermeiden
    
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

      // Cache-Speicherung deaktiviert
      // Keine Daten werden im localStorage gespeichert, um Probleme zu vermeiden

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
            
            // Nur gültige Schützen-IDs berücksichtigen
            const validShooterIds = teamShooterIds.filter(id => id && typeof id === 'string' && id.trim() !== "");
            if (validShooterIds.length === 0) return { team, allShootersHaveResults: false };
            
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
                if (js.durchgang === parsedRound && validShooterIds.includes(js.shooterId)) {
                    shooterIdsWithResults.add(js.shooterId);
                }
            });
            
            // BUG-FIX: Prüfen ob MINDESTENS EIN Schütze noch kein Ergebnis hat (statt alle)
            const hasAtLeastOneShooterWithoutResult = validShooterIds.some(id => !shooterIdsWithResults.has(id));
            
            return { team, allShootersHaveResults: !hasAtLeastOneShooterWithoutResult };
        }));
        
        // Teams anzeigen, bei denen mindestens ein Schütze noch kein Ergebnis hat
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
                    // Prüfen, ob alle Schützen-IDs im allShootersFromDB vorhanden sind
                    const foundShooters = allShootersFromDB.filter(shooter => validShooterIds.includes(shooter.id));
                    const foundShooterIds = foundShooters.map(s => s.id);
                    const missingShooterIds = validShooterIds.filter(id => !foundShooterIds.includes(id));
                    
                    if (missingShooterIds.length > 0) {

                        
                        // Fehlende Schützen einzeln aus der Datenbank laden
                        const additionalShooters: Shooter[] = [];
                        
                        for (const shooterId of missingShooterIds) {
                            try {
                                const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
                                const shooterSnap = await getFirestoreDoc(shooterDocRef);
                                
                                if (shooterSnap.exists()) {
                                    const shooterData = { id: shooterSnap.id, ...shooterSnap.data() } as Shooter;
                                    additionalShooters.push(shooterData);

                                } else {
                                    console.warn(`VER_ERGEBNISSE DEBUG: Schütze ${shooterId} nicht in Datenbank gefunden`);
                                }
                            } catch (error) {
                                console.error(`VER_ERGEBNISSE DEBUG: Fehler beim Laden von Schütze ${shooterId}:`, error);
                            }
                        }
                        

                        
                        // Kombiniere gefundene und zusätzlich geladene Schützen
                        const allTeamShooters = [...foundShooters, ...additionalShooters].sort((a, b) => a.name.localeCompare(b.name));
                        setShootersOfSelectedTeam(allTeamShooters);
                    } else {
                        // Alle Schützen wurden im Cache gefunden
                        setShootersOfSelectedTeam(foundShooters.sort((a, b) => a.name.localeCompare(b.name)));
                    }
                } else { 

                    setShootersOfSelectedTeam([]); 
                }
            } else { 

                setShootersOfSelectedTeam([]); 
            }
        } catch (error) {
            console.error("VER_ERGEBNISSE DEBUG: Error fetching shooters for team:", error);
            toast({ title: "Fehler Schützenladen", description: (error as Error).message, variant: "destructive" });
            setShootersOfSelectedTeam([]);
        } finally {
            setIsLoadingShooters(false); setSelectedShooterId('');
        }
    };
    if (selectedTeamId && activeClubIdForEntry) loadShootersForTeam(); else setShootersOfSelectedTeam([]);
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
        const scores = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));
        


        
        setExistingScoresForTeamAndRound(scores);
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
    const loadAvailableShooters = async () => {
      if (selectedTeamId && selectedRound && !isLoadingExistingScores) {
        const parsedRound = parseInt(selectedRound, 10);
        
        // Hole die aktuelle Team-Daten
        const selectedTeam = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId);
        if (!selectedTeam || !selectedTeam.shooterIds || selectedTeam.shooterIds.length === 0) {
          setAvailableShootersForDropdown([]);
          return;
        }
        
        // Alle gültigen Schützen-IDs des Teams
        const validTeamShooterIds = selectedTeam.shooterIds.filter(id => id && typeof id === 'string' && id.trim() !== "");
        
        // Schützen-IDs, die bereits Ergebnisse haben
        const shootersInPendingThisRound = pendingScores.filter(ps => ps.teamId === selectedTeamId && ps.durchgang === parsedRound).map(ps => ps.shooterId);
        const shootersInJustSavedThisRound = justSavedScoreIdentifiers.filter(js => js.durchgang === parsedRound).map(js => js.shooterId);
        const shootersInExistingScoresThisRound = existingScoresForTeamAndRound.filter(es => es.durchgang === parsedRound).map(es => es.shooterId);
        
        // Alle Schützen-IDs mit Ergebnissen kombinieren
        const allShooterIdsWithResults = new Set([
          ...shootersInPendingThisRound,
          ...shootersInJustSavedThisRound,
          ...shootersInExistingScoresThisRound
        ]);
        
        // Finde Schützen ohne Ergebnisse
        const shooterIdsWithoutResults = validTeamShooterIds.filter(id => !allShooterIdsWithResults.has(id));
        



        
        if (shooterIdsWithoutResults.length === 0) {
          setAvailableShootersForDropdown([]);
          return;
        }
        
        // Prüfe, welche Schützen im Cache fehlen
        const availableShootersFromCache = allShootersFromDB.filter(sh => 
          sh.id && shooterIdsWithoutResults.includes(sh.id)
        );
        
        const foundShooterIds = availableShootersFromCache.map(s => s.id);
        const missingShooterIds = shooterIdsWithoutResults.filter(id => !foundShooterIds.includes(id));
        
        let finalAvailableShooters = availableShootersFromCache;
        
        // Wenn Schützen fehlen, lade sie direkt aus der Datenbank
        if (missingShooterIds.length > 0) {

          
          const additionalShooters: Shooter[] = [];
          
          for (const shooterId of missingShooterIds) {
            try {
              const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
              const shooterSnap = await getFirestoreDoc(shooterDocRef);
              
              if (shooterSnap.exists()) {
                const shooterData = { id: shooterSnap.id, ...shooterSnap.data() } as Shooter;
                additionalShooters.push(shooterData);

              } else {
                console.warn(`❌ Dropdown: Schütze ${shooterId} nicht in shooters - suche in Scores...`);
                
                // TEST-MODUS: Suche Namen in bestehenden Scores
                try {
                  const scoresQuery = query(
                    collection(db, "rwk_scores"),
                    where("shooterId", "==", shooterId),
                    limit(1)
                  );
                  const scoresSnapshot = await getDocs(scoresQuery);
                  
                  if (!scoresSnapshot.empty) {
                    const scoreData = scoresSnapshot.docs[0].data();
                    const nameFromScore = scoreData.shooterName;

                    
                    // Erstelle shooters Eintrag
                    try {
                      const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
                      const nameParts = nameFromScore.split(' ');
                      const shooterData = {
                        name: nameFromScore,
                        firstName: nameParts[0] || '',
                        lastName: nameParts.slice(1).join(' ') || '',
                        gender: scoreData.shooterGender || 'unknown',
                        createdAt: new Date(),
                        createdBy: 'auto-from-scores'
                      };
                      await setDoc(shooterDocRef, shooterData);

                    } catch (createError) {
                      console.error(`Fehler beim Erstellen von Schütze ${shooterId}:`, createError);
                    }
                    
                    additionalShooters.push({
                      id: shooterId,
                      name: nameFromScore,
                      gender: scoreData.shooterGender || 'unknown'
                    } as Shooter);
                  } else {

                    additionalShooters.push({
                      id: shooterId,
                      name: `Schütze ${shooterId.substring(0,8)}`,
                      gender: 'unknown'
                    } as Shooter);
                  }
                } catch (scoreError) {
                  console.error(`Dropdown: Fehler beim Suchen in Scores für ${shooterId}:`, scoreError);
                }
              }
            } catch (error) {
              console.error(`Dropdown: Fehler beim Laden von Schütze ${shooterId}:`, error);
            }
          }
          


          
          // Kombiniere gefundene und zusätzlich geladene Schützen
          finalAvailableShooters = [...availableShootersFromCache, ...additionalShooters];
        }
        

        setAvailableShootersForDropdown(finalAvailableShooters);
      } else {
        setAvailableShootersForDropdown([]);
      }
    };
    
    loadAvailableShooters();
  }, [selectedTeamId, selectedRound, allTeamsInSelectedLeague, pendingScores, justSavedScoreIdentifiers, existingScoresForTeamAndRound, isLoadingExistingScores, allShootersFromDB]);

  useEffect(() => { setSelectedLeagueId(''); setSelectedTeamId(''); setSelectedShooterId(''); setSelectedRound(''); setPendingScores([]); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]);}, [selectedSeasonId, activeClubIdForEntry]);
  useEffect(() => { setSelectedTeamId(''); setSelectedShooterId(''); setSelectedRound(''); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]);}, [selectedLeagueId]);
  useEffect(() => { setSelectedShooterId(''); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]);}, [selectedTeamId]);
  useEffect(() => { setSelectedShooterId(''); setScore(''); setExistingScoresForTeamAndRound([]);}, [selectedRound]);

  const handleAddToList = async () => {

    
    if (!userPermission?.uid) { 
      toast({ title: "Fehler", description: "Benutzer nicht identifiziert.", variant: "destructive" }); 
      return; 
    }
    
    // Berechtigung prüfen
    const isMannschaftsfuehrer = userPermission?.clubRoles && 
      Object.values(userPermission.clubRoles).includes('MANNSCHAFTSFUEHRER');
    const isSportleiter = userPermission?.clubRoles && 
      Object.values(userPermission.clubRoles).includes('SPORTLEITER');
    const isLegacyMannschaftsfuehrer = userPermission?.role === 'mannschaftsfuehrer';
    
    if (!isMannschaftsfuehrer && !isSportleiter && !isLegacyMannschaftsfuehrer && userPermission?.role !== 'superadmin') {
      toast({ title: "Keine Berechtigung", description: "Sie haben keine Berechtigung zur Ergebniserfassung.", variant: "destructive" }); 
      return; 
    }
    
    if (!selectedShooterId || !selectedRound || !score || !selectedSeasonId || !selectedLeagueId || !selectedTeamId || !activeClubIdForEntry ) {

      toast({ title: "Fehlende Eingabe", description: "Bitte alle Felder ausfüllen.", variant: "destructive" }); 
      return;
    }
    
    const scoreVal = parseInt(score);
    const season = allSeasons.find(s => s.id === selectedSeasonId);
    const league = allLeagues.find(l => l.id === selectedLeagueId); 
    const team = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId); 
    
    // Suche den Schützen in allen verfügbaren Quellen
    let shooter = availableShootersForDropdown.find(sh => sh.id === selectedShooterId) || 
                  shootersOfSelectedTeam.find(sh => sh.id === selectedShooterId) ||
                  allShootersFromDB.find(sh => sh.id === selectedShooterId);
    
    // Wenn der Schütze nicht gefunden wurde, versuche ihn direkt aus der Datenbank zu laden
    if (!shooter) {

      try {
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, selectedShooterId);
        const shooterSnap = await getFirestoreDoc(shooterDocRef);
        
        if (shooterSnap.exists()) {
          shooter = { id: shooterSnap.id, ...shooterSnap.data() } as Shooter;

        } else {
          console.error(`Schütze mit ID ${selectedShooterId} nicht in der Datenbank gefunden`);
          toast({ title: "Datenfehler", description: "Schütze nicht gefunden.", variant: "destructive" });
          return;
        }
      } catch (error) {
        console.error("Fehler beim Laden des Schützen:", error);
        toast({ title: "Datenfehler", description: "Fehler beim Laden des Schützen.", variant: "destructive" });
        return;
      }
    }

    if (!season || !league || !team || !shooter || !team.clubId) {
      console.error("Basisdaten unvollständig:", { season, league, team, shooter, teamClubId: team?.clubId });
      toast({ title: "Datenfehler", description: "Basisdaten unvollständig (Saison, Liga, Team, Schütze, Team ClubID).", variant: "destructive" }); 
      return;
    }
    
    let maxPossibleScore = 300;
    const fourHundredPointDisciplines: FirestoreLeagueSpecificDiscipline[] = ['LG', 'LGA', 'LP', 'LPA'];
    if (fourHundredPointDisciplines.includes(league.type)) maxPossibleScore = 400;
    
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxPossibleScore) {
      toast({ title: "Ungültiges Ergebnis", description: `Ringzahl (0-${maxPossibleScore}).`, variant: "destructive" }); 
      return;
    }
    
    const parsedRound = parseInt(selectedRound, 10);
    if (pendingScores.some(ps => ps.shooterId === selectedShooterId && ps.durchgang === parsedRound && ps.teamId === selectedTeamId) || 
        justSavedScoreIdentifiers.some(js => js.shooterId === selectedShooterId && js.durchgang === parsedRound) ||
        existingScoresForTeamAndRound.some(es => es.shooterId === selectedShooterId && es.durchgang === parsedRound)) {
      toast({ title: "Ergebnis existiert bereits", variant: "warning"}); 
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
    toast({ title: "Ergebnis hinzugefügt" });
    setSelectedShooterId(''); 
    setScore(''); 
  };

  const handleRemoveFromList = (tempId: string) => {
    setPendingScores(prev => prev.filter(p => p.tempId !== tempId));
    toast({ title: "Eintrag entfernt", variant: "destructive" });
  };

  const handleOCRComplete = (ocrResults: OCRMatchResult[]) => {
    const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeason) return;

    const parsedRound = parseInt(selectedRound);
    
    // Duplikat-Erkennung: Bereits vorhandene Ergebnisse filtern
    const filteredResults = ocrResults.filter(result => {
      // Prüfe gegen bereits gespeicherte Ergebnisse
      const existsInDB = existingScoresForTeamAndRound.some(existing => 
        existing.shooterId === result.shooterId && existing.durchgang === parsedRound
      );
      
      // Prüfe gegen Zwischenliste
      const existsInPending = pendingScores.some(pending => 
        pending.shooterId === result.shooterId && pending.durchgang === parsedRound
      );
      
      // Prüfe gegen gerade gespeicherte
      const existsInJustSaved = justSavedScoreIdentifiers.some(saved => 
        saved.shooterId === result.shooterId && saved.durchgang === parsedRound
      );
      
      return !existsInDB && !existsInPending && !existsInJustSaved;
    });
    
    const duplicateCount = ocrResults.length - filteredResults.length;
    
    const newPendingEntries = filteredResults.map(result => ({
      tempId: `ocr-${Date.now()}-${Math.random()}`,
      seasonId: selectedSeasonId,
      seasonName: currentSeason.name,
      leagueId: selectedLeagueId,
      leagueName: allLeagues.find(l => l.id === selectedLeagueId)?.name || '',
      leagueType: allLeagues.find(l => l.id === selectedLeagueId)?.type || 'KK',
      teamId: result.teamId,
      teamName: result.teamName,
      clubId: allTeamsInSelectedLeague.find(t => t.id === result.teamId)?.clubId || '',
      shooterId: result.shooterId,
      shooterName: result.shooterName,
      shooterGender: 'unknown',
      durchgang: parsedRound,
      totalRinge: result.score,
      scoreInputType: (existingScoresForTeamAndRound.length > 0 ? 'post' : 'regular') as const, // Automatisch Nachschießen wenn bereits Ergebnisse vorhanden
      competitionYear: currentSeason.competitionYear,
      isOCRGenerated: true,
      ocrConfidence: result.confidence,
      ocrSource: result.ocrSource
    }));

    setPendingScores(prev => [...prev, ...newPendingEntries]);
    setShowOCR(false);
    
    // Intelligente Toast-Nachricht
    if (newPendingEntries.length > 0 && duplicateCount > 0) {
      toast({
        title: `🎯 ${newPendingEntries.length} neue Ergebnisse erfasst!`,
        description: `${duplicateCount} bereits vorhandene Ergebnisse übersprungen. Perfekt für Nachschießen!`,
        className: "border-green-500 bg-green-50"
      });
    } else if (newPendingEntries.length > 0) {
      toast({
        title: `🎯 ${newPendingEntries.length} Ergebnisse automatisch erfasst!`,
        description: "Alle Werte wurden in die Zwischenliste eingetragen. Bitte prüfen Sie diese vor dem Speichern.",
        className: "border-green-500 bg-green-50"
      });
    } else {
      toast({
        title: "ℹ️ Keine neuen Ergebnisse",
        description: `Alle ${duplicateCount} erkannten Ergebnisse sind bereits vorhanden.`,
        className: "border-blue-500 bg-blue-50"
      });
    }
  };

  const handleOCRError = (error: string) => {
    setShowOCR(false);
    toast({
      title: "OCR-Fehler",
      description: error,
      variant: "destructive"
    });
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
          
          const scoreData = {
            ...dataToSave,
            enteredByUserId: userPermission.uid,
            enteredByUserName: userPermission.displayName || userPermission.email || "Unbekannt",
            entryTimestamp: serverTimestamp()
          };
          
          // Zu Batch hinzufügen statt einzeln speichern
          batch.set(scoreDocRef, scoreData);
          
          // Prüfe und erstelle fehlenden Schützen-Eintrag in shooters
          try {
            const shooterDocRef = doc(db, SHOOTERS_COLLECTION, entry.shooterId);
            const shooterSnap = await getFirestoreDoc(shooterDocRef);
            
            if (!shooterSnap.exists()) {
              // Erstelle Schützen-Eintrag mit verfügbaren Daten
              const shooterData = {
                name: entry.shooterName,
                gender: entry.shooterGender || 'unknown',
                createdAt: serverTimestamp(),
                createdBy: 'auto-from-scores'
              };
              
              // Versuche Namen zu parsen
              const nameParts = entry.shooterName.split(' ');
              if (nameParts.length >= 2) {
                shooterData.firstName = nameParts[0];
                shooterData.lastName = nameParts.slice(1).join(' ');
              }
              
              batch.set(shooterDocRef, shooterData);

            }
          } catch (shooterError) {
            console.warn(`Could not check/create shooter ${entry.shooterId}:`, shooterError);
          }
          
          // Audit-Log für Ergebnis-Erstellung (nach dem Batch-Commit)
          // Wird später ausgeführt, um die Score-ID zu haben
          
          newlySavedIdentifiers.push({ shooterId: entry.shooterId, durchgang: entry.durchgang });
          
          // Liga-Update für jedes Ergebnis einzeln verarbeiten (für "Letzte Ergebnis-Updates" auf der Startseite)
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
              // Berechtigungsfehler ignorieren - die Hauptfunktion (Ergebnisse speichern) funktioniert trotzdem

            }
          }
        } catch (scoreError) {
          console.error("VER_ERGEBNISSE DEBUG: Error saving individual score:", scoreError);
          // Fehler für einzelnes Ergebnis protokollieren und mit dem nächsten fortfahren
        }
      }
      
      // Alle Scores in einem Batch speichern
      await batch.commit();
      
      // Handzettel-Upload verarbeiten (mehrere Dateien) mit Fortschrittsbalken
      if (handzettelFiles.length > 0) {
        const progressToast = createProgressToast({
          title: "📤 Handzettel werden hochgeladen...",
          description: `${handzettelFiles.length} Datei(en) werden verarbeitet`,
        });
        
        try {
          progressToast.start();
          progressToast.updateProgress(10, "Dateien werden vorbereitet...");
          
          const uploadFormData = new FormData();
          
          const teamName = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId)?.name || 'Unbekannt';
          const leagueName = selectedLeagueObject?.name || 'Unbekannt';
          
          uploadFormData.append('subject', `📋 Handzettel-Beleg: ${teamName} - Durchgang ${selectedRound}`);
          uploadFormData.append('message', `Handzettel-Beleg eingegangen:

Mannschaft: ${teamName}
Liga: ${leagueName}
Durchgang: ${selectedRound}
Anzahl Seiten: ${handzettelFiles.length}
Zeitpunkt: ${new Date().toLocaleString('de-DE')}

Die Handzettel sind als Anhang beigefügt.`);
          uploadFormData.append('recipients', JSON.stringify([{name: 'RWK-Leiter', email: 'rwk-leiter-ksve@gmx.de'}]));
          
          progressToast.updateProgress(30, "Dateien werden angehängt...");
          
          // Alle Handzettel-Dateien als Attachments hinzufügen
          handzettelFiles.forEach((file, index) => {
            uploadFormData.append(`attachment-${index}`, file);
          });
          
          progressToast.updateProgress(60, "E-Mail wird versendet...");
          
          const uploadResponse = await fetch('/api/send-email', {
            method: 'POST',
            body: uploadFormData
          });
          
          if (uploadResponse.ok) {
            progressToast.updateProgress(100, "Upload erfolgreich abgeschlossen!");
            toast({ 
              title: "✅ Ergebnisse und Handzettel gesendet!", 
              description: `${pendingScores.length} Ergebnisse gespeichert + ${handzettelFiles.length} Handzettel-Seite(n) per E-Mail an RWK-Leiter gesendet.`,
              className: "border-green-500 bg-green-50"
            });
          } else {
            throw new Error('Upload fehlgeschlagen');
          }
        } catch (error) {
          console.error('Handzettel-Upload Fehler:', error);
          progressToast.error('E-Mail-Versand fehlgeschlagen');
          toast({ 
            title: "✅ Ergebnisse gespeichert", 
            description: "Handzettel-E-Mail fehlgeschlagen, aber Ergebnisse sind gesichert.",
            className: "border-green-500 bg-green-50"
          });
        }
      } else {
        toast({ 
          title: "✅ Ergebnisse gespeichert!", 
          description: `${pendingScores.length} Ergebnisse erfolgreich übertragen.`,
          className: "border-green-500 bg-green-50"
        });
      }
      
      // Audit-Logs für alle gespeicherten Ergebnisse erstellen
      for (const entry of pendingScores) {
        try {
          await auditLogService.logAction(
            'create',
            'score',
            `${entry.shooterId}-${entry.durchgang}`, // Eindeutige ID
            {
              description: `Ergebnis erfasst: ${entry.shooterName} - ${entry.totalRinge} Ringe (DG ${entry.durchgang})`,
              after: {
                shooterName: entry.shooterName,
                teamName: entry.teamName,
                durchgang: entry.durchgang,
                totalRinge: entry.totalRinge,
                scoreInputType: entry.scoreInputType
              }
            },
            {
              leagueId: entry.leagueId,
              leagueName: entry.leagueName,
              teamId: entry.teamId,
              teamName: entry.teamName,
              shooterId: entry.shooterId,
              shooterName: entry.shooterName
            },
            {
              userId: userPermission.uid,
              userName: userPermission.displayName || userPermission.email || "Unbekannt"
            }
          );
        } catch (auditError) {
          console.error('Fehler beim Erstellen des Audit-Logs:', auditError);
          // Audit-Fehler nicht an Benutzer weiterleiten
        }
      }

      setPendingScores([]);
      setHandzettelFiles([]); // Reset file input
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
  let numRoundsForSelect = 5; // Alle Disziplinen haben 5 Durchgänge

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
      <div className="space-y-2">
        <div className="flex items-center">
          <BackButton className="mr-2" fallbackHref="/verein/dashboard" />
          <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung</h1>
          <HelpTooltip 
            text="Hier können Sie Ergebnisse für Mannschaften erfassen und speichern." 
            side="right" 
            className="ml-2"
          />
        </div>
        {activeClubNameForEntry && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Building className="h-4 w-4 mr-1" />
            <span>Verein: <strong className="text-foreground">{activeClubNameForEntry}</strong></span>
          </div>
        )}
      </div>
      
      {/* OCR-Bereich GANZ OBEN - sofort sichtbar */}
      <Card className="shadow-md border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Camera className="h-5 w-5" />
🤖 NEU: Handzettel fotografieren
          </CardTitle>
          <CardDescription className="text-blue-700">
            📸 Automatische Ergebniserfassung - spart 90% der Zeit!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!selectedLeagueId || !selectedRound ? (
              <div className="p-4 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50">
                <div className="text-center space-y-2">
                  <Camera className="h-8 w-8 text-amber-600 mx-auto" />
                  <p className="text-sm font-medium text-amber-800">📋 Zuerst Liga und Durchgang auswählen!</p>
                  <p className="text-xs text-amber-700">Dann erscheint hier die Kamera-Funktion für automatische Ergebniserfassung.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">✅ Bereit für OCR-Erkennung!</span>
                  </div>
                  <p className="text-xs text-green-700 mb-3">
                    Liga: <strong>{allLeagues.find(l => l.id === selectedLeagueId)?.name}</strong> | 
                    Durchgang: <strong>{selectedRound}</strong>
                  </p>
                  
                  <Input 
                    type="file" 
                    accept="image/*,.pdf" 
                    capture="environment"
                    multiple
                    onChange={async (e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setHandzettelFiles(files);
                        
                        if (files.length > 0) {
                          setShowOCR(true);
                        }
                      }
                    }}
                    className="bg-white border-2 border-dashed border-blue-300 p-4 text-center cursor-pointer hover:border-blue-400"
                  />
                  
                  <div className="mt-2 text-xs text-blue-700 space-y-1">
                    <p>📱 <strong>Handy:</strong> Kamera öffnet sich direkt (Rückkamera)</p>
                    <p>💻 <strong>PC:</strong> Datei auswählen oder per Drag & Drop</p>
                    <p>✅ <strong>Formate:</strong> Alle Bildformate (JPG, PNG, WEBP, etc.) + PDF</p>
                  </div>
                  
                  {handzettelFiles.length > 0 && (
                    <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-200">
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <Zap className="h-4 w-4" />
                        <span>{handzettelFiles.length} Datei(en) ausgewählt - OCR läuft...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* OCR-Komponente */}
                {showOCR && handzettelFiles.length > 0 && (
                  <HandzettelOCR
                    imageFile={handzettelFiles[0]}
                    availableTeams={allTeamsInSelectedLeague}
                    selectedLeagueId={selectedLeagueId}
                    selectedRound={selectedRound}
                    availableLeagues={allLeagues.map(l => ({ id: l.id, name: l.name, type: l.type }))}
                    onOCRComplete={handleOCRComplete}
                    onError={handleOCRError}
                  />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader><CardTitle>📝 Oder: Einzelergebnis manuell hinzufügen</CardTitle><CardDescription>Falls OCR nicht funktioniert - klassische Eingabe Schütze für Schütze</CardDescription></CardHeader>
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
                <SelectTrigger id="vver-team">
                  <SelectValue placeholder={
                    isLoadingTeams 
                      ? "Lade Teams..." 
                      : (!selectedRound 
                          ? "Durchgang wählen" 
                          : (allTeamsInSelectedLeague.length === 0 && selectedLeagueId && selectedRound 
                              ? "✓ Alle Teams vollständig erfasst" 
                              : "Mannschaft wählen"))
                  } />
                </SelectTrigger>
                <SelectContent>
                  {allTeamsInSelectedLeague.length === 0 && selectedLeagueId && selectedRound ? (
                    <SelectItem value="no-teams-available" disabled>
                      Alle Ergebnisse für diesen Durchgang erfasst
                    </SelectItem>
                  ) : (
                    allTeamsInSelectedLeague.filter(t=>t.id).map(t => 
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    )
                  )}
                </SelectContent>
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
              <Select value={selectedShooterId} onValueChange={setSelectedShooterId} disabled={!selectedTeamId || isLoadingShooters || isLoadingExistingScores}>
                <SelectTrigger id="vver-shooter">
                  <SelectValue placeholder={
                    isLoadingShooters || isLoadingExistingScores 
                      ? "Lade Schützen..." 
                      : (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound 
                          ? "Alle Ergebnisse erfasst" 
                          : "Schütze wählen")
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound ? (
                    <SelectItem value="no-shooters-available" disabled>
                      Alle Ergebnisse für diesen Durchgang erfasst
                    </SelectItem>
                  ) : (
                    availableShootersForDropdown
                      .filter(sh => sh.id)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(sh => (
                        <SelectItem 
                          key={sh.id} 
                          value={sh.id} 
                          className="font-bold text-primary"
                        >
                          {sh.name} ⚠️
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="vver-score">Ergebnis (Ringe)</Label>
                <HelpTooltip 
                  text="Geben Sie das Ergebnis in Ringen ein oder nutzen Sie die Spracheingabe. Je nach Disziplin sind Werte zwischen 0-300 oder 0-400 möglich." 
                  className="ml-2"
                />
              </div>
              <div className="flex gap-2">
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
                <VoiceInputButton
                  onResult={(text) => {
                    // Extrahiere Zahlen aus der Spracheingabe
                    const numbers = text.match(/\d+/g);
                    if (numbers && numbers.length > 0) {
                      const extractedScore = numbers[0];
                      setScore(extractedScore);
                    }
                  }}
                  disabled={!selectedShooterId}
                  size="default"
                  className="shrink-0"
                />
              </div>
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
            <RadioGroup value={resultType} onValueChange={(value) => setResultType(value as "regular" | "pre" | "post")} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="regular" id="vver-r-regular" /><Label htmlFor="vver-r-regular">Regulär</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="pre" id="vver-r-pre" /><Label htmlFor="vver-r-pre">Vorschießen</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="post" id="vver-r-post" /><Label htmlFor="vver-r-post">Nachschießen</Label></div>
            </RadioGroup>
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => handleAddToList()} 
              disabled={!selectedShooterId || !selectedRound || !score || isSubmittingScores || isLoadingExistingScores}
            >
              <Plus className="mr-2 h-5 w-5" /> Zur Liste hinzufügen
            </Button>
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
              <TableBody>{pendingScores.map((entry) => {
                const confidence = entry.ocrConfidence || 1;
                const rowColor = entry.isOCRGenerated ? 
                  (confidence >= 0.8 ? 'bg-green-50' : 
                   confidence >= 0.6 ? 'bg-yellow-50' : 
                   'bg-red-50') : '';
                const textColor = entry.isOCRGenerated && confidence < 0.6 ? 'text-red-700 font-medium' : '';
                
                return (
                  <TableRow key={entry.tempId} className={rowColor}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.isOCRGenerated && (
                          <Zap className={`h-3 w-3 ${
                            confidence >= 0.8 ? 'text-green-500' : 
                            confidence >= 0.6 ? 'text-yellow-500' : 
                            'text-red-500'
                          }`} />
                        )}
                        <span className={textColor}>
                          {entry.shooterName}
                          {entry.isOCRGenerated && confidence < 0.6 && ' ⚠️'}
                        </span>
                        {entry.isOCRGenerated && entry.ocrConfidence && (
                          <span className={`text-xs font-mono ${
                            confidence >= 0.8 ? 'text-green-600' : 
                            confidence >= 0.6 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {Math.round(entry.ocrConfidence * 100)}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{entry.teamName}</TableCell>
                    <TableCell className="text-center">{entry.durchgang}</TableCell>
                    <TableCell className="text-center">
                      <Input 
                        type="number" 
                        value={entry.totalRinge} 
                        onChange={(e) => {
                          const newScore = parseInt(e.target.value) || 0;
                          setPendingScores(prev => 
                            prev.map(p => 
                              p.tempId === entry.tempId 
                                ? { ...p, totalRinge: newScore }
                                : p
                            )
                          );
                        }}
                        className="w-16 text-center"
                        min="0"
                        max="400"
                      />
                    </TableCell>
                    <TableCell>{entry.scoreInputType === 'pre' ? 'Vorschuss' : entry.scoreInputType === 'post' ? 'Nachschuss' : 'Regulär'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveFromList(entry.tempId)} 
                        className="text-destructive hover:text-destructive/80" 
                        disabled={isSubmittingScores}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}</TableBody>
            </Table>
            
            {/* OCR-Warnung für experimentelle Einträge */}
            {pendingScores.some(p => p.isOCRGenerated) && (
              <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                  <p className="text-sm text-amber-700">
                    <strong>🧪 EXPERIMENTAL:</strong> {pendingScores.filter(p => p.isOCRGenerated).length} 
                    Einträge wurden automatisch erkannt. Bitte prüfen Sie alle Werte vor dem Speichern!
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-6">
              <Button onClick={handleFinalSave} size="lg" disabled={isSubmittingScores || pendingScores.length === 0}>
                {isSubmittingScores && <Loader className="mr-2 h-4 w-4 animate-spin" />} 
                Alle {pendingScores.length} Ergebnisse speichern
                {handzettelFiles.length > 0 && ` + ${handzettelFiles.length} Handzettel-Seite(n)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      
      {pendingScores.length === 0 && !isLoadingPageData && activeClubIdForEntry && (
         <div className="mt-8 p-6 text-center text-muted-foreground bg-secondary/30 rounded-md"><CheckSquare className="mx-auto h-10 w-10 mb-3 text-primary/70" /><p className="text-base">Noch keine Ergebnisse zur Speicherung vorgemerkt.</p></div>
      )}
    </div>
  );
}

