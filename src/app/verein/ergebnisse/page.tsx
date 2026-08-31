
// /app/verein/ergebnisse/page.tsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logError, logWarn, logDebug, getErrorMessage } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MobileTable as Table,
  MobileTableBody as TableBody,
  MobileTableCell as TableCell,
  MobileTableHead as TableHead,
  MobileTableHeader as TableHeader,
  MobileTableRow as TableRow,
} from "@/components/ui/mobile-table";
import { CheckSquare, Save, Plus, Trash2, Loader, AlertCircle, Building, CheckCircle, Camera, Zap, AlertTriangle } from 'lucide-react';

import { HelpTooltip } from '@/components/ui/help-tooltip';
import { BackButton } from '@/components/ui/back-button';
import { createProgressToast } from '@/components/ui/progress-toast';
import { HandzettelOCR, type OCRMatchResult } from '@/components/ui/handzettel-ocr-simple';
import type { Season, League, Team, Shooter, PendingScoreEntry, ScoreEntry, FirestoreLeagueSpecificDiscipline, Club, LeagueUpdateEntry, UserPermission } from '@/types/rwk';
import { leagueDisciplineOptions } from '@/types/rwk';
import { useVereinAuth } from '@/app/verein/layout'; 
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, writeBatch, serverTimestamp, doc, documentId, getDoc as getFirestoreDoc, Timestamp, setDoc, updateDoc, addDoc, limit } from 'firebase/firestore';
import { auditLogService } from '@/lib/services/audit-service';
import { plausibilityService, type PlausibilityWarning } from '@/lib/services/plausibility-service';
import { PlausibilityAlert } from '@/components/ui/plausibility-alert';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "shooters";
const SCORES_COLLECTION = "rwk_scores";
const CLUBS_COLLECTION = "clubs";
const LEAGUE_UPDATES_COLLECTION = "league_updates";


import SharedResultsPage from '@/components/results/shared-results-complete';

export default function VereinErgebnissePage() {
  const { userPermission, loadingPermissions, permissionError, assignedClubId, currentClubId } = useVereinAuth();
  
  if (loadingPermissions) {
    return <div className="flex justify-center items-center py-12"><Loader className="h-12 w-12 animate-spin text-primary mr-3" /><p>Lade Berechtigungen...</p></div>;
  }
  
  if (permissionError) {
    return <div className="p-6"><Card className="border-destructive bg-destructive/5"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertCircle className="mr-2 h-5 w-5" /> {permissionError}</CardTitle></CardHeader></Card></div>;
  }
  
  const effectiveClubId = currentClubId || assignedClubId;
  const userRole = userPermission?.role === 'superadmin' ? 'admin' : 
                  userPermission?.clubRoles && Object.values(userPermission.clubRoles).includes('SPORTLEITER') ? 'sportleiter' : 
                  'mannschaftsfuehrer';
  
  return (
    <SharedResultsPage 
      userRole={userRole}
      backHref="/verein/dashboard"
      dashboardHref="/verein/dashboard"
      clubId={effectiveClubId}
    />
  );
}

// Legacy code - wird durch SharedResultsPage ersetzt
function LegacyVereinErgebnissePage() {
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
  const [attachOnly, setAttachOnly] = useState(false);
  const [plausibilityWarnings, setPlausibilityWarnings] = useState<PlausibilityWarning[]>([]);
  const [isCheckingPlausibility, setIsCheckingPlausibility] = useState(false);

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
            logWarn("VER_ERGEBNISSE DEBUG: Club with ID", effectiveClubId, "not found.");
          }
        } catch (e) {
          logError("VER_ERGEBNISSE DEBUG: Error fetching assigned club name:", e);
          setActiveClubNameForEntry("Fehler Vereinsname");
        } finally {
          setIsLoadingAssignedClubDetails(false);
        }
      };
      fetchClubName();
    } else if (!loadingPermissions && !effectiveClubId) {
      logWarn("VER_ERGEBNISSE DEBUG: No effectiveClubId available after loading permissions.");
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
      logError("VER_ERGEBNISSE DEBUG: Error fetching initial page data:", error);
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
        logError("VER_ERGEBNISSE DEBUG: Error fetching leagues for VV:", error);
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
        logError("VER_ERGEBNISSE DEBUG: Error fetching teams in league:", error);
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
                                    logWarn(`VER_ERGEBNISSE DEBUG: Schütze ${shooterId} nicht in Datenbank gefunden`);
                                }
                            } catch (error) {
                                logError(`VER_ERGEBNISSE DEBUG: Fehler beim Laden von Schütze ${shooterId}:`, error);
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
            logError("VER_ERGEBNISSE DEBUG: Error fetching shooters for team:", error);
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
        logError("VER_ERGEBNISSE DEBUG: Error fetching existing scores: ", error);
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
                logWarn(`❌ Dropdown: Schütze ${shooterId} nicht in shooters - suche in Scores...`);
                
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

                    
                    // Erstelle shooters Eintrag NUR wenn nicht vorhanden - gender niemals überschreiben!
                    try {
                      const shooterDocRef = doc(db, SHOOTERS_COLLECTION, shooterId);
                      const existingSnap = await getDoc(shooterDocRef);
                      if (!existingSnap.exists()) {
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
                      }

                    } catch (createError) {
                      logError(`Fehler beim Erstellen von Schütze ${shooterId}:`, createError);
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
                  logError(`Dropdown: Fehler beim Suchen in Scores für ${shooterId}:`, scoreError);
                }
              }
            } catch (error) {
              logError(`Dropdown: Fehler beim Laden von Schütze ${shooterId}:`, error);
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
  useEffect(() => { setSelectedShooterId(''); setScore(''); setExistingScoresForTeamAndRound([]); setPlausibilityWarnings([]);}, [selectedRound]);
  useEffect(() => { setPlausibilityWarnings([]);}, [selectedShooterId]);

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
          logError(`Schütze mit ID ${selectedShooterId} nicht in der Datenbank gefunden`);
          toast({ title: "Datenfehler", description: "Schütze nicht gefunden.", variant: "destructive" });
          return;
        }
      } catch (error) {
        logError("Fehler beim Laden des Schützen:", error);
        toast({ title: "Datenfehler", description: "Fehler beim Laden des Schützen.", variant: "destructive" });
        return;
      }
    }

    if (!season || !league || !team || !shooter || !team.clubId) {
      logError("Basisdaten unvollständig:", { season, league, team, shooter, teamClubId: team?.clubId });
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
      durchgang: parseInt(selectedRound),
      totalRinge: result.score,
      scoreInputType: (existingScoresForTeamAndRound.length > 0 ? 'post' : 'regular') as const,
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

  const handleSendHandzettelOnly = async () => {
    if (!userPermission?.uid) { 
      toast({ title: "Fehler", description: "Benutzer nicht identifiziert.", variant: "destructive" }); 
      return; 
    }
    
    if (handzettelFiles.length === 0) { 
      toast({ title: "Keine Handzettel", description: "Bitte wählen Sie mindestens eine Datei aus.", variant: "destructive" }); 
      return; 
    }
    
    setIsSubmittingScores(true);
    
    try {
      const progressToast = createProgressToast({
        title: "📤 Handzettel werden versendet...",
        description: `${handzettelFiles.length} Datei(en) ohne Ergebnisse`,
      });
      
      progressToast.start();
      progressToast.updateProgress(10, "Dateien werden vorbereitet...");
      
      const uploadFormData = new FormData();
      
      const teamName = selectedTeamId ? 
        (allTeamsInSelectedLeague.find(t => t.id === selectedTeamId)?.name || 'Unbekannt') : 
        'Nicht ausgewählt';
      const leagueName = selectedLeagueId ? 
        (allLeagues.find(l => l.id === selectedLeagueId)?.name || 'Unbekannt') : 
        'Nicht ausgewählt';
      
      uploadFormData.append('subject', `📋 Handzettel ohne Ergebnisse: ${teamName} - DG ${selectedRound || 'unbekannt'}`);
      uploadFormData.append('message', `Handzettel ohne Ergebnisse eingegangen:

Mannschaft: ${teamName}
Liga: ${leagueName}
Durchgang: ${selectedRound || 'nicht ausgewählt'}
Anzahl Seiten: ${handzettelFiles.length}
Zeitpunkt: ${new Date().toLocaleString('de-DE')}

Hinweis: Diese Handzettel wurden ohne digitale Ergebniserfassung versendet.
Die Handzettel sind als Anhang beigefügt.`);
      uploadFormData.append('recipients', JSON.stringify([{name: 'RWK-Leiter', email: 'rwk-leiter-ksve@gmx.de'}]));
      
      progressToast.updateProgress(30, "Dateien werden angehängt...");
      
      // Alle Handzettel-Dateien als Attachments hinzufügen
      handzettelFiles.forEach((file, index) => {
        uploadFormData.append(`attachment-${index}`, file);
      });
      
      progressToast.updateProgress(60, "E-Mail wird versendet...");
      
      // Firebase-Token für Authentifizierung holen
      let authHeaders = {};
      let hasAuthToken = false;
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          authHeaders = {
            'Authorization': `Bearer ${token}`
          };
          hasAuthToken = true;
        }
      } catch (authError) {
        logWarn('Konnte Firebase-Token nicht laden:', authError);
      }
      
      const uploadResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: authHeaders,
        body: uploadFormData
      });
      
      const responseData = await uploadResponse.json();
      logDebug('E-Mail API Response:', responseData);
      
      if (uploadResponse.ok && responseData.success) {
        progressToast.updateProgress(100, "Handzettel erfolgreich versendet!");
        toast({ 
          title: "✅ Handzettel versendet!", 
          description: `${handzettelFiles.length} Handzettel-Seite(n) per E-Mail an RWK-Leiter gesendet.`,
          className: "border-green-500 bg-green-50"
        });
        
        // Reset nach erfolgreichem Versand
        setHandzettelFiles([]);
        setAttachOnly(false);
      } else {
        throw new Error(responseData.message || 'Versand fehlgeschlagen');
      }
    } catch (error) {
      logError('Handzettel-Versand Fehler:', error);
      const errorDetails = error instanceof Error ? getErrorMessage(error) : String(error);
      
      toast({ 
        title: "❌ Versand fehlgeschlagen", 
        description: `Handzettel-E-Mail konnte nicht versendet werden: ${errorDetails}`,
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setIsSubmittingScores(false);
    }
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
            logWarn(`Could not check/create shooter ${entry.shooterId}:`, shooterError);
          }
          
          // Audit-Log für Ergebnis-Erstellung (nach dem Batch-Commit)
          // Wird später ausgeführt, um die Score-ID zu haben
          
          newlySavedIdentifiers.push({ shooterId: entry.shooterId, durchgang: entry.durchgang });
          
          // Sammle Liga-Updates (nur einmal pro Liga pro Tag)
          if (entry.leagueId && entry.leagueName && entry.leagueType && entry.competitionYear !== undefined) {
            newlySavedIdentifiers.push({ shooterId: entry.shooterId, durchgang: entry.durchgang });
          }
        } catch (scoreError) {
          logError("VER_ERGEBNISSE DEBUG: Error saving individual score:", scoreError);
          // Fehler für einzelnes Ergebnis protokollieren und mit dem nächsten fortfahren
        }
      }
      
      // Alle Scores in einem Batch speichern
      await batch.commit();
      
      // Liga-Update EINMAL pro Liga erstellen (für "Letzte Ergebnis-Updates" auf der Startseite)
      const processedLeagues = new Set<string>();
      for (const entry of pendingScores) {
        if (entry.leagueId && entry.leagueName && entry.leagueType && entry.competitionYear !== undefined) {
          const leagueKey = `${entry.leagueId}-${entry.competitionYear}`;
          if (!processedLeagues.has(leagueKey)) {
            processedLeagues.add(leagueKey);
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
        }
      }
      
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
          
          // Firebase-Token für Authentifizierung holen
          let authHeaders = {};
          let hasAuthToken = false;
          try {
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            if (auth.currentUser) {
              const token = await auth.currentUser.getIdToken();
              authHeaders = {
                'Authorization': `Bearer ${token}`
              };
              hasAuthToken = true;
            }
          } catch (authError) {
            logWarn('Konnte Firebase-Token nicht laden:', authError);
          }
          
          const uploadResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: authHeaders,
            body: uploadFormData
          });
          
          const responseData = await uploadResponse.json();
          logDebug('E-Mail API Response:', responseData);
          
          if (uploadResponse.ok && responseData.success) {
            progressToast.updateProgress(100, "Upload erfolgreich abgeschlossen!");
            toast({ 
              title: "✅ Ergebnisse und Handzettel gesendet!", 
              description: `${pendingScores.length} Ergebnisse gespeichert + ${handzettelFiles.length} Handzettel-Seite(n) per E-Mail an RWK-Leiter gesendet.`,
              className: "border-green-500 bg-green-50"
            });
          } else {
            throw new Error(responseData.message || 'Upload fehlgeschlagen');
          }
        } catch (error) {
          logError('Handzettel-Upload Fehler:', error);
          progressToast.error(`E-Mail-Versand fehlgeschlagen: ${getErrorMessage(error) || error}`);
          
          // Detaillierte Fehlermeldung für Debugging
          const errorDetails = error instanceof Error ? getErrorMessage(error) : String(error);
          logDebug('Detaillierte E-Mail-Fehlerinfo:', {
            error: errorDetails,
            userRole: userPermission?.role,
            clubRoles: userPermission?.clubRoles,
            hasToken: hasAuthToken
          });
          
          toast({ 
            title: "✅ Ergebnisse gespeichert", 
            description: `Handzettel-E-Mail fehlgeschlagen: ${errorDetails}. Ergebnisse sind aber gesichert. Bitte kontaktieren Sie den Administrator falls das Problem weiterhin besteht.`,
            className: "border-green-500 bg-green-50",
            duration: 10000
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
          logError('Fehler beim Erstellen des Audit-Logs:', auditError);
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
        logError("VER_ERGEBNISSE DEBUG: Error saving scores to Firestore: ", error);
        toast({ title: "Fehler beim Speichern", description: getErrorMessage(error) || "Unbekannter Fehler", variant: "destructive" });
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
    <div className="space-y-6 w-full max-w-full overflow-hidden">
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
      <Card className="shadow-md border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-700 w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Camera className="h-5 w-5" />
📸 Handzettel fotografieren
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            🤖 Foto → OCR automatisch - spart 90% Zeit!
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="space-y-4 w-full max-w-full">
            {!selectedLeagueId || !selectedRound ? (
              <div className="p-4 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600">
                <div className="text-center space-y-2">
                  <Camera className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-100">📋 Zuerst Liga und Durchgang auswählen!</p>
                  <p className="text-xs text-amber-700 dark:text-amber-200">Dann erscheint hier die Kamera-Funktion für automatische Ergebniserfassung.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">📸 Handzettel fotografieren!</span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mb-3 truncate">
                    Liga: <strong>{allLeagues.find(l => l.id === selectedLeagueId)?.name}</strong> | 
                    DG: <strong>{selectedRound}</strong> | OCR auto
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-4 border-2 border-green-400 rounded-lg bg-green-50">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="use-ocr" 
                          checked={!attachOnly} 
                          onCheckedChange={(checked) => setAttachOnly(!checked)}
                          className="h-5 w-5 border-2 border-green-600"
                        />
                        <Label htmlFor="use-ocr" className="text-sm font-medium text-green-900 dark:text-green-100 cursor-pointer">
                          🤖 OCR-Erkennung verwenden (automatisches Auslesen)
                        </Label>
                      </div>
                      <p className="text-xs text-green-800 dark:text-green-200 mt-2 ml-8">
                        ⚠️ WICHTIG: OCR-Ergebnisse müssen immer kontrolliert werden! Prüfen Sie alle Werte vor dem Speichern.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Kamera-Button für Mobile */}
                      <div className="block md:hidden">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          multiple
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const files = Array.from(e.target.files);
                              setHandzettelFiles(files);
                              
                              toast({
                                title: "📸 Foto aufgenommen",
                                description: `${files.length} Foto(s) bereit. ${!attachOnly ? 'Klicke "🤖 OCR starten" um automatisch auszulesen.' : 'Wird ohne OCR versendet.'}`,
                                className: "border-blue-500 bg-blue-50"
                              });
                            }
                          }}
                          className="bg-white border-2 border-dashed border-green-300 p-4 text-center cursor-pointer hover:border-green-400"
                        />
                        <p className="text-xs text-center text-green-700 mt-1">📸 Kamera öffnen</p>
                      </div>
                      
                      {/* Galerie/Datei-Auswahl für Mobile und Desktop */}
                      <div>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          multiple
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const files = Array.from(e.target.files);
                              setHandzettelFiles(files);
                              
                              toast({
                                title: "📎 Handzettel ausgewählt",
                                description: `${files.length} Datei(en) aus Galerie/Dateien. ${!attachOnly ? 'Klicke "🤖 OCR starten" um automatisch auszulesen.' : 'Wird ohne OCR versendet.'}`,
                                className: "border-blue-500 bg-blue-50"
                              });
                            }
                          }}
                          className="bg-white border-2 border-dashed border-blue-300 p-4 text-center cursor-pointer hover:border-blue-400"
                        />
                        <p className="text-xs text-center text-blue-700 mt-1">📁 Aus Galerie/Dateien wählen</p>
                      </div>
                    </div>
                    
                    {handzettelFiles.length > 0 && !attachOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHandzettelFiles([]);
                          setShowOCR(false);
                        }}
                        className="text-xs text-red-600 w-full"
                      >
                        ❌ Datei entfernen
                      </Button>
                    )}
                    
                    {handzettelFiles.length > 0 && attachOnly && (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={handleSendHandzettelOnly}
                          disabled={isSubmittingScores}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isSubmittingScores ? (
                            <><Loader className="mr-1 h-3 w-3 animate-spin" />Sende...</>
                          ) : (
                            <>📤 Handzettel abschicken</>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setHandzettelFiles([]);
                            setAttachOnly(false);
                          }}
                          className="text-xs text-red-600"
                          disabled={isSubmittingScores}
                        >
                          ❌ Entfernen
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <p>📸 <strong>Kamera:</strong> Direktes Fotografieren (nur Mobile)</p>
                    <p>📁 <strong>Galerie:</strong> Vorhandene Bilder aus WhatsApp, Galerie etc.</p>
                    <p>💻 <strong>PC:</strong> Mehrere Dateien gleichzeitig möglich</p>
                    <p>✅ <strong>Formate:</strong> JPG, PNG (PDF folgt)</p>
                    <p>📎 <strong>Nur anhängen:</strong> Checkbox deaktivieren für Upload ohne OCR</p>
                  </div>
                  
                  {handzettelFiles.length > 0 && !attachOnly && (
                    <div className="mt-3">
                      {!showOCR && (
                        <Button
                          onClick={() => setShowOCR(true)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          size="lg"
                        >
                          <Zap className="mr-2 h-5 w-5" />
                          🤖 OCR jetzt starten
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {handzettelFiles.length > 0 && attachOnly && (
                    <div className="mt-3 p-3 bg-green-100 rounded border border-green-200 w-full max-w-full overflow-hidden">
                      <div className="flex items-center justify-between gap-2 text-sm text-green-800 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <Camera className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate text-green-800 dark:text-green-200">📎 {handzettelFiles.length} Datei(en) bereit zum Versand</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSendHandzettelOnly}
                          disabled={isSubmittingScores}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-auto flex-shrink-0"
                        >
                          {isSubmittingScores ? (
                            <><Loader className="mr-1 h-3 w-3 animate-spin" />Sende...</>
                          ) : (
                            <>📤 Abschicken</>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                        💡 Handzettel werden ohne Ergebnisse per E-Mail an RWK-Leiter gesendet
                      </p>
                    </div>
                  )}
                  

                </div>
                
                {/* OCR-Komponente - nur einmal rendern */}
                {showOCR && handzettelFiles.length > 0 && !attachOnly && (
                  <div data-ocr-component className="w-full max-w-full overflow-hidden">
                    <HandzettelOCR
                      key={`ocr-${handzettelFiles[0]?.name}-${Date.now()}`}
                      imageFile={handzettelFiles[0]}
                      availableTeams={allTeamsInSelectedLeague}
                      selectedLeagueId={selectedLeagueId}
                      selectedRound={selectedRound}
                      availableLeagues={allLeagues.map(l => ({ id: l.id, name: l.name, type: l.type }))}
                      onOCRComplete={handleOCRComplete}
                      onError={handleOCRError}
                      autoStart={true}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Mobile: Zwischenspeicher zwischen OCR und manueller Eingabe */}
      {pendingScores.length > 0 && (
        <Card className="shadow-md w-full max-w-full overflow-hidden md:hidden">
          <CardHeader><CardTitle className="text-sm sm:text-base">📋 Zwischenspeicher ({pendingScores.length})</CardTitle>
            <CardDescription className="text-xs truncate">
              {allSeasons.find(s=>s.id === selectedSeasonId)?.name || '-'} | {allLeagues.find(l=>l.id===selectedLeagueId)?.name || '-'}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 max-w-full overflow-hidden p-3">
            <div className="w-full max-w-full overflow-hidden">
              <div className="space-y-2 md:hidden mobile-cache-container">
                {pendingScores.map((entry) => {
                  const confidence = entry.ocrConfidence || 1;
                  const rowColor = entry.isOCRGenerated ? 
                    (confidence >= 0.8 ? 'bg-green-50' : 
                     confidence >= 0.6 ? 'bg-yellow-50' : 
                     'bg-red-50') : 'bg-white';
                  const textColor = entry.isOCRGenerated && confidence < 0.6 ? 'text-red-700 font-medium' : '';
                  
                  // Vollständige Schützennamen anzeigen
                  const displayName = entry.shooterName;
                  
                  return (
                    <div 
                      key={entry.tempId} 
                      className={`p-3 rounded border ${rowColor} mobile-cache-card`}
                    >
                      <div className="space-y-2">
                        {/* Schützenname und Löschen-Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {entry.isOCRGenerated && (
                              <Zap className={`h-3 w-3 flex-shrink-0 ${
                                confidence >= 0.8 ? 'text-green-500' : 
                                confidence >= 0.6 ? 'text-yellow-500' : 
                                'text-red-500'
                              }`} />
                            )}
                            <span className={`${textColor} text-sm font-medium truncate`}>
                              {displayName}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveFromList(entry.tempId)} 
                            className="text-destructive hover:text-destructive/80 h-6 w-6 p-0 flex-shrink-0" 
                            disabled={isSubmittingScores}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Durchgang und Ringe in separater Zeile */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Durchgang {entry.durchgang}</span>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              value={entry.totalRinge ?? ''}
                              onChange={(e) => {
                                const newScore = e.target.value === '' ? 0 : parseInt(e.target.value);
                                setPendingScores(prev => 
                                  prev.map(p => 
                                    p.tempId === entry.tempId 
                                      ? { ...p, totalRinge: newScore }
                                      : p
                                  )
                                );
                              }}
                              className="w-16 text-center text-sm h-8"
                              min="0"
                              max="400"
                            />
                            <span className="text-sm text-muted-foreground">Ringe</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Table className="hidden md:table"><TableHeader><TableRow><TableHead>Schütze</TableHead><TableHead>Mannschaft</TableHead><TableHead className="text-center">DG</TableHead><TableHead className="text-center">Ringe</TableHead><TableHead>Typ</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
              <TableBody>{pendingScores.map((entry) => {
                const confidence = entry.ocrConfidence || 1;
                const rowColor = entry.isOCRGenerated ? 
                  (confidence >= 0.8 ? 'bg-green-50' : 
                   confidence >= 0.6 ? 'bg-yellow-50' : 
                   'bg-red-50') : '';
                const textColor = entry.isOCRGenerated && confidence < 0.6 ? 'text-red-700 font-medium' : '';
                
                return (
                  <TableRow key={entry.tempId} className={rowColor}>
                    <TableCell label="Schütze">
                      <div className="flex items-center gap-2 min-w-0">
                        {entry.isOCRGenerated && (
                          <Zap className={`h-3 w-3 flex-shrink-0 ${
                            confidence >= 0.8 ? 'text-green-500' : 
                            confidence >= 0.6 ? 'text-yellow-500' : 
                            'text-red-500'
                          }`} />
                        )}
                        <span className={`${textColor} truncate`}>
                          {entry.shooterName}
                          {entry.isOCRGenerated && confidence < 0.6 && ' ⚠️'}
                        </span>
                        {entry.isOCRGenerated && entry.ocrConfidence && (
                          <span className={`text-xs font-mono flex-shrink-0 ${
                            confidence >= 0.8 ? 'text-green-600' : 
                            confidence >= 0.6 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {Math.round(entry.ocrConfidence * 100)}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell label="Team" hideOnMobile>{entry.teamName}</TableCell>
                    <TableCell label="DG" className="text-center">{entry.durchgang}</TableCell>
                    <TableCell className="text-center" label="Ringe">
                      <Input 
                        type="number" 
                        value={entry.totalRinge ?? ''}
                        onChange={(e) => {
                          const newScore = e.target.value === '' ? 0 : parseInt(e.target.value);
                          setPendingScores(prev => 
                            prev.map(p => 
                              p.tempId === entry.tempId 
                                ? { ...p, totalRinge: newScore }
                                : p
                            )
                          );
                        }}
                        className="w-16 text-center min-w-0 max-w-16"
                        min="0"
                        max="400"
                      />
                    </TableCell>
                    <TableCell label="Typ" hideOnMobile>{entry.scoreInputType === 'pre' ? 'Vorschuss' : entry.scoreInputType === 'post' ? 'Nachschuss' : 'Regulär'}</TableCell>
                    <TableCell label="Aktion" className="text-right">
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
            </div>
            
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
                {pendingScores.length} Ergebnisse
                {handzettelFiles.length > 0 && ` + ${handzettelFiles.length} PDF`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="shadow-md">
        <CardHeader><CardTitle>📝 Einzelergebnis manuell hinzufügen</CardTitle><CardDescription>Für zweite Handzettel oder falls OCR nicht funktioniert - klassische Eingabe</CardDescription></CardHeader>
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
              <NativeSelect
                value={selectedSeasonId}
                onValueChange={setSelectedSeasonId}
                disabled={availableRunningSeasons.length === 0}
                placeholder={availableRunningSeasons.length === 0 ? "Keine Saisons" : "Saison wählen"}
                options={availableRunningSeasons.filter(s => s.id).map(s => ({ value: s.id, label: s.name }))}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="vver-league">Liga (Ihres Vereins)</Label>
                <HelpTooltip 
                  text="Wählen Sie die Liga aus, für die Sie Ergebnisse erfassen möchten." 
                  className="ml-2"
                />
              </div>
              <NativeSelect
                value={selectedLeagueId}
                onValueChange={setSelectedLeagueId}
                disabled={!selectedSeasonId || isLoadingLeagues || leaguesForActiveClubAndSeason.length === 0}
                placeholder={isLoadingLeagues ? "Lade Ligen..." : (leaguesForActiveClubAndSeason.length === 0 && selectedSeasonId ? "Keine Ligen für Verein/Saison" : "Liga wählen")}
                options={leaguesForActiveClubAndSeason.filter(l=>l.id).map(l => ({ value: l.id, label: l.name }))}
              />
            </div>
            <div className="space-y-2"> {/* Durchgang vor Mannschaft */}
              <div className="flex items-center">
                <Label htmlFor="vver-round">Durchgang</Label>
                <HelpTooltip 
                  text="Wählen Sie den Durchgang aus, für den Sie Ergebnisse erfassen möchten." 
                  className="ml-2"
                />
              </div>
              <NativeSelect
                value={selectedRound}
                onValueChange={setSelectedRound}
                disabled={!selectedLeagueId}
                placeholder="Durchgang wählen"
                options={[...Array(numRoundsForSelect)].map((_, i) => ({ value: (i + 1).toString(), label: `Durchgang ${i + 1}` }))}
              />
            </div>
             <div className="space-y-2"> {/* Mannschaft nach Durchgang */}
              <div className="flex items-center">
                <Label htmlFor="vver-team">Mannschaft (Eigene oder Gegner)</Label>
                <HelpTooltip 
                  text="Wählen Sie die Mannschaft aus, für die Sie Ergebnisse erfassen möchten. Es werden nur Mannschaften angezeigt, die noch nicht vollständig erfasst sind." 
                  className="ml-2"
                />
              </div>
              <NativeSelect
                value={selectedTeamId}
                onValueChange={setSelectedTeamId}
                disabled={!selectedLeagueId || isLoadingTeams || !selectedRound || allTeamsInSelectedLeague.length === 0}
                placeholder={
                  isLoadingTeams 
                    ? "Lade Teams..." 
                    : (!selectedRound 
                        ? "Durchgang wählen" 
                        : (allTeamsInSelectedLeague.length === 0 && selectedLeagueId && selectedRound 
                            ? "✓ Alle Teams vollständig erfasst" 
                            : "Mannschaft wählen"))
                }
                options={
                  allTeamsInSelectedLeague.length === 0 && selectedLeagueId && selectedRound ? [
                    { value: "no-teams-available", label: "Alle Ergebnisse für diesen Durchgang erfasst", disabled: true }
                  ] : (
                    allTeamsInSelectedLeague.filter(t=>t.id).map(t => ({ value: t.id, label: t.name }))
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="vver-shooter">Schütze</Label>
                <HelpTooltip 
                  text="Wählen Sie den Schützen aus, für den Sie ein Ergebnis erfassen möchten. Schützen mit ⚠️ haben noch kein Ergebnis für diesen Durchgang." 
                  className="ml-2"
                />
              </div>
              <NativeSelect
                value={selectedShooterId}
                onValueChange={setSelectedShooterId}
                disabled={!selectedTeamId || isLoadingShooters || isLoadingExistingScores}
                placeholder={
                  isLoadingShooters || isLoadingExistingScores 
                    ? "Lade Schützen..." 
                    : (availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound 
                        ? "Alle Ergebnisse erfasst" 
                        : "Schütze wählen")
                }
                options={
                  availableShootersForDropdown.length === 0 && !!selectedTeamId && !!selectedRound ? [
                    { value: "no-shooters-available", label: "Alle Ergebnisse für diesen Durchgang erfasst", disabled: true }
                  ] : (
                    availableShootersForDropdown
                      .filter(sh => sh.id)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(sh => ({ value: sh.id, label: `${sh.name} ⚠️` }))
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="vver-score">Ergebnis (Ringe)</Label>
                <HelpTooltip 
                  text="Geben Sie das Ergebnis in Ringen ein oder nutzen Sie die Spracheingabe. Je nach Disziplin sind Werte zwischen 0-300 oder 0-400 möglich." 
                  className="ml-2"
                />
              </div>
              <Input 
                id="vver-score" 
                type="number" 
                value={score} 
                style={{ MozAppearance: 'textfield' }}
                className="w-full text-lg h-12 text-center font-medium [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onChange={async (e) => {
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
                    
                    // Live-Plausibilitätsprüfung
                    if (!isNaN(scoreVal) && scoreVal >= 0 && scoreVal <= maxPossibleScore && 
                        selectedShooterId && selectedTeamId && selectedLeagueObject) {
                      setIsCheckingPlausibility(true);
                      try {
                        const shooter = availableShootersForDropdown.find(s => s.id === selectedShooterId) ||
                                       shootersOfSelectedTeam.find(s => s.id === selectedShooterId) ||
                                       allShootersFromDB.find(s => s.id === selectedShooterId);
                        const team = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId);
                        const season = allSeasons.find(s => s.id === selectedSeasonId);
                        
                        if (shooter && team && season) {
                          const warnings = await plausibilityService.checkScorePlausibility(
                            selectedShooterId,
                            shooter.name,
                            selectedTeamId,
                            team.name,
                            scoreVal,
                            selectedLeagueObject.type,
                            season.competitionYear
                          );
                          setPlausibilityWarnings(warnings);
                        }
                      } catch (error) {
                        logError('Fehler bei Plausibilitätsprüfung:', error);
                        setPlausibilityWarnings([]);
                      } finally {
                        setIsCheckingPlausibility(false);
                      }
                    } else {
                      setPlausibilityWarnings([]);
                    }
                  } else {
                    setPlausibilityWarnings([]);
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
              
              {/* Live-Plausibilitätsprüfung */}
              {isCheckingPlausibility && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Loader className="h-3 w-3 animate-spin" />
                  <span>Prüfe Plausibilität...</span>
                </div>
              )}
              
              {plausibilityWarnings.length > 0 && (
                <div className="mt-2">
                  <PlausibilityAlert warnings={plausibilityWarnings} />
                </div>
              )}
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



      {/* Desktop: Zwischenspeicher am Ende */}
      {pendingScores.length > 0 && (
        <Card className="shadow-md mt-6 hidden md:block">
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
                    <TableCell label="Schütze">
                      <div className="flex items-center gap-2 min-w-0">
                        {entry.isOCRGenerated && (
                          <Zap className={`h-3 w-3 flex-shrink-0 ${
                            confidence >= 0.8 ? 'text-green-500' : 
                            confidence >= 0.6 ? 'text-yellow-500' : 
                            'text-red-500'
                          }`} />
                        )}
                        <span className={`${textColor} truncate`}>
                          {entry.shooterName}
                          {entry.isOCRGenerated && confidence < 0.6 && ' ⚠️'}
                        </span>
                        {entry.isOCRGenerated && entry.ocrConfidence && (
                          <span className={`text-xs font-mono flex-shrink-0 ${
                            confidence >= 0.8 ? 'text-green-600' : 
                            confidence >= 0.6 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {Math.round(entry.ocrConfidence * 100)}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell label="Team" hideOnMobile>{entry.teamName}</TableCell>
                    <TableCell label="DG" className="text-center">{entry.durchgang}</TableCell>
                    <TableCell className="text-center" label="Ringe">
                      <Input 
                        type="number" 
                        value={entry.totalRinge ?? ''}
                        onChange={(e) => {
                          const newScore = e.target.value === '' ? 0 : parseInt(e.target.value);
                          setPendingScores(prev => 
                            prev.map(p => 
                              p.tempId === entry.tempId 
                                ? { ...p, totalRinge: newScore }
                                : p
                            )
                          );
                        }}
                        className="w-16 text-center min-w-0 max-w-16"
                        min="0"
                        max="400"
                      />
                    </TableCell>
                    <TableCell label="Typ" hideOnMobile>{entry.scoreInputType === 'pre' ? 'Vorschuss' : entry.scoreInputType === 'post' ? 'Nachschuss' : 'Regulär'}</TableCell>
                    <TableCell label="Aktion" className="text-right">
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
                {pendingScores.length} Ergebnisse
                {handzettelFiles.length > 0 && ` + ${handzettelFiles.length} PDF`}
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

