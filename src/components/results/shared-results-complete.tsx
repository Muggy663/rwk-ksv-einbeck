"use client";
import { useState, useEffect, useCallback } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckSquare, PlusCircle, Trash2, Loader, AlertCircle, ToggleLeft, ToggleRight, CheckCircle, Camera, Zap, AlertTriangle } from 'lucide-react';
import { HandzettelOCR, type OCRMatchResult } from '@/components/ui/handzettel-ocr-simple';
import { BackButton } from '@/components/ui/back-button';
import { createProgressToast } from '@/components/ui/progress-toast';
import { Checkbox } from "@/components/ui/checkbox";
import type { Season, League, Team, Shooter, PendingScoreEntry, ScoreEntry } from '@/types/rwk';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { plausibilityService } from '@/lib/services/plausibility-service';
import Link from 'next/link';
import { collection, getDocs, getDoc, query, where, orderBy, writeBatch, serverTimestamp, doc, Timestamp } from 'firebase/firestore';
import { getSeasonSpecificScoresCollection } from '@/lib/utils/collection-names';

const SEASONS_COLLECTION = "seasons";
const LEAGUES_COLLECTION = "rwk_leagues";
const TEAMS_COLLECTION = "rwk_teams";
const SHOOTERS_COLLECTION = "shooters";
const SCORES_COLLECTION = "rwk_scores";
const LEAGUE_UPDATES_COLLECTION = "league_updates";

interface SharedResultsPageProps {
  userRole: 'admin' | 'sportleiter' | 'mannschaftsfuehrer';
  backHref: string;
  dashboardHref: string;
  clubId?: string;
}

export default function SharedResultsPage({ 
  userRole, 
  backHref, 
  dashboardHref, 
  clubId 
}: SharedResultsPageProps) {
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
  const [isSubmittingScores, setIsSubmittingScores] = useState(false);
  const [editMode, setEditMode] = useState(userRole === 'admin');
  const [showOCR, setShowOCR] = useState(false);
  const [handzettelFiles, setHandzettelFiles] = useState<File[]>([]);
  const [attachOnly, setAttachOnly] = useState(false);

  const fetchMasterData = useCallback(async () => {
    setIsLoadingMasterData(true);
    try {
      const seasonsSnapshot = await getDocs(query(collection(db, SEASONS_COLLECTION), orderBy("competitionYear", "desc")));
      const fetchedSeasons = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season)).filter(s => s.id);
      setAllSeasons(fetchedSeasons);
      const running = fetchedSeasons.filter(s => s.status === 'Laufend');
      setAvailableRunningSeasons(running);
      if (running.length === 1 && !selectedSeasonId) {
        setSelectedSeasonId(running[0].id);
      }

      const leaguesSnapshot = await getDocs(query(collection(db, LEAGUES_COLLECTION), orderBy("name", "asc")));
      setAllLeagues(leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League)).filter(l => l.id));
      
      const shootersSnapshot = await getDocs(query(collection(db, SHOOTERS_COLLECTION), orderBy("name", "asc")));
      setAllShootersFromDB(shootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shooter)).filter(s => s.id));

    } catch (error) {
      logError("Error fetching master data: ", error);
      toast({ title: "Fehler beim Laden der Stammdaten", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingMasterData(false);
    }
  }, [toast]); 

  useEffect(() => { fetchMasterData(); }, [fetchMasterData]);
  useEffect(() => {setSelectedLeagueId(''); setSelectedTeamId(''); setSelectedShooterId(''); setSelectedRound(''); setPendingScores([]); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]); }, [selectedSeasonId]);
  useEffect(() => {setSelectedTeamId(''); setSelectedShooterId(''); setSelectedRound(''); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]); }, [selectedLeagueId]);
  useEffect(() => {setSelectedShooterId(''); setJustSavedScoreIdentifiers([]); setExistingScoresForTeamAndRound([]); }, [selectedTeamId]);
  useEffect(() => {setSelectedShooterId(''); setScore(''); setExistingScoresForTeamAndRound([]);}, [selectedRound]);

  // Auto-select first shooter
  useEffect(() => {
    if (!selectedShooterId && availableShootersForDropdown.length > 0) {
      setSelectedShooterId(availableShootersForDropdown[0].id);
    }
  }, [availableShootersForDropdown, selectedShooterId]);

  useEffect(() => {
    if (selectedSeasonId && allLeagues.length > 0) {
      setIsLoadingLeagues(true);
      
      // Für Vereinsbenutzer: Nur Ligen laden, in denen der Verein Teams hat
      if (userRole !== 'admin' && clubId) {
        const fetchLeaguesForClub = async () => {
          try {
            const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
            if (!currentSeason) {
              setAvailableLeaguesForSeason([]);
              setIsLoadingLeagues(false);
              return;
            }
            
            // Teams des Vereins für diese Saison laden
            const teamsQuery = query(
              collection(db, TEAMS_COLLECTION),
              where("clubId", "==", clubId),
              where("competitionYear", "==", currentSeason.competitionYear)
            );
            const teamsSnapshot = await getDocs(teamsQuery);
            const clubTeams = teamsSnapshot.docs.map(doc => doc.data() as Team);
            
            // Eindeutige Liga-IDs des Vereins
            const clubLeagueIds = [...new Set(clubTeams.map(team => team.leagueId).filter(Boolean))];
            
            // Nur Ligen anzeigen, in denen der Verein Teams hat
            const filteredLeagues = allLeagues
              .filter(l => l.seasonId === selectedSeasonId && clubLeagueIds.includes(l.id))
              .sort((a,b) => (a.order || 0) - (b.order || 0));
            
            setAvailableLeaguesForSeason(filteredLeagues);
          } catch (error) {
            logError("Error fetching leagues for club:", error);
            setAvailableLeaguesForSeason([]);
          } finally {
            setIsLoadingLeagues(false);
          }
        };
        
        fetchLeaguesForClub();
      } else {
        // Admin: Alle Ligen anzeigen
        const leaguesForSeason = allLeagues.filter(l => l.seasonId === selectedSeasonId).sort((a,b) => (a.order || 0) - (b.order || 0));
        setAvailableLeaguesForSeason(leaguesForSeason);
        setIsLoadingLeagues(false);
      }
    } else {
      setAvailableLeaguesForSeason([]);
    }
  }, [selectedSeasonId, allLeagues, userRole, clubId, allSeasons]);

  // Schützen laden
  useEffect(() => {
    if (selectedTeamId && allShootersFromDB.length > 0 && !isLoadingTeams) {
      setIsLoadingShooters(true);
      const currentTeam = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId);
      const shooterIds = currentTeam?.shooterIds?.filter(id => id) || [];
      
      if (shooterIds.length > 0) {
        const shooters = allShootersFromDB.filter(sh => shooterIds.includes(sh.id));
        setShootersOfSelectedTeam(shooters);
        setAvailableShootersForDropdown(shooters);
      } else {
        setShootersOfSelectedTeam([]);
        setAvailableShootersForDropdown([]);
      }
      setIsLoadingShooters(false);
    } else {
      setShootersOfSelectedTeam([]);
      setAvailableShootersForDropdown([]);
    }
  }, [selectedTeamId, allShootersFromDB, allTeamsInSelectedLeague, isLoadingTeams]);
  
  // Verfügbare Schützen für Dropdown filtern (ohne bereits erfasste Ergebnisse)
  useEffect(() => {
    if (selectedTeamId && selectedRound && shootersOfSelectedTeam.length > 0) {
      // Im Bearbeitungsmodus alle Schützen anzeigen
      if (editMode) {
        setAvailableShootersForDropdown(shootersOfSelectedTeam);
        return;
      }
      
      const parsedRound = parseInt(selectedRound, 10);
      
      // Lade existierende Ergebnisse für dieses Team und diesen Durchgang
      const loadExistingScores = async () => {
        try {
          const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
          if (!currentSeason) return;
          
          // Verwende saison-spezifische Collection falls vorhanden
          let scoresQuery;
          try {
            const leagueData = availableLeaguesForSeason.find(l => l.id === selectedLeagueId);
            const seasonSpecificCollection = leagueData ? 
              getSeasonSpecificScoresCollection(currentSeason.competitionYear, leagueData.type) :
              SCORES_COLLECTION;
            
            scoresQuery = query(
              collection(db, seasonSpecificCollection),
              where("teamId", "==", selectedTeamId),
              where("durchgang", "==", parsedRound),
              where("competitionYear", "==", currentSeason.competitionYear)
            );
          } catch (error) {
            scoresQuery = query(
              collection(db, SCORES_COLLECTION),
              where("teamId", "==", selectedTeamId),
              where("durchgang", "==", parsedRound),
              where("competitionYear", "==", currentSeason.competitionYear)
            );
          }
          const scoresSnapshot = await getDocs(scoresQuery);
          const existingScores = scoresSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));
          setExistingScoresForTeamAndRound(existingScores);
          
          // Schützen-IDs mit bereits vorhandenen Ergebnissen
          const shooterIdsWithResults = new Set(existingScores.map(score => score.shooterId));
          
          // Schützen aus Zwischenliste hinzufügen
          pendingScores.forEach(ps => {
            if (ps.teamId === selectedTeamId && ps.durchgang === parsedRound) {
              shooterIdsWithResults.add(ps.shooterId);
            }
          });
          
          // Schützen mit gerade gespeicherten Ergebnissen hinzufügen
          justSavedScoreIdentifiers.forEach(js => {
            if (js.durchgang === parsedRound) {
              shooterIdsWithResults.add(js.shooterId);
            }
          });
          
          // Nur Schützen ohne Ergebnisse für Dropdown verfügbar machen
          const availableShooters = shootersOfSelectedTeam.filter(shooter => 
            !shooterIdsWithResults.has(shooter.id)
          );
          
          setAvailableShootersForDropdown(availableShooters);
          
          // Automatisch ersten verfügbaren Schützen auswählen (nur wenn keiner ausgewählt)
          if (!selectedShooterId && availableShooters.length > 0) {
            setSelectedShooterId(availableShooters[0].id);
          }
        } catch (error) {
          logError('Error loading existing scores:', error);
          setAvailableShootersForDropdown(shootersOfSelectedTeam);
        }
      };
      
      loadExistingScores();
    } else {
      setAvailableShootersForDropdown(shootersOfSelectedTeam);
    }
  }, [selectedTeamId, selectedRound, shootersOfSelectedTeam, pendingScores, justSavedScoreIdentifiers, selectedSeasonId, allSeasons, editMode]);

  // Teams laden mit Filterung für vollständige Ergebnisse
  useEffect(() => {
    const selectedSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (selectedLeagueId && selectedSeason && !isLoadingLeagues) {
      setIsLoadingTeams(true);
      const fetchTeams = async () => {
        try {
          const teamsQuery = query(
            collection(db, TEAMS_COLLECTION),
            where("leagueId", "==", selectedLeagueId),
            where("competitionYear", "==", selectedSeason.competitionYear),
            orderBy("name", "asc")
          );
          
          const teamsSnapshot = await getDocs(teamsQuery);
          let fetchedTeams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)).filter(t => t.id);
          
          // Im Bearbeitungsmodus (Admin) alle Teams anzeigen
          if (editMode) {
            setAllTeamsInSelectedLeague(fetchedTeams);
            setIsLoadingTeams(false);
            return;
          }
          
          // Wenn kein Durchgang ausgewählt, alle Teams anzeigen
          if (!selectedRound) {
            setAllTeamsInSelectedLeague(fetchedTeams);
            setIsLoadingTeams(false);
            return;
          }
          
          const parsedRound = parseInt(selectedRound, 10);
          
          // Für jedes Team prüfen, ob alle Schützen bereits Ergebnisse haben
          const teamsWithFilterInfo = await Promise.all(fetchedTeams.map(async team => {
            const teamShooterIds = team.shooterIds || [];
            if (teamShooterIds.length === 0) return { team, allShootersHaveResults: false };
            
            const validShooterIds = teamShooterIds.filter(id => id && typeof id === 'string' && id.trim() !== "");
            if (validShooterIds.length === 0) return { team, allShootersHaveResults: false };
            
            // Ergebnisse für dieses Team und diesen Durchgang laden
            // Verwende saison-spezifische Collection falls vorhanden
            let scoresQuery;
            try {
              const leagueData = availableLeaguesForSeason.find(l => l.id === selectedLeagueId);
              const seasonSpecificCollection = leagueData ? 
                getSeasonSpecificScoresCollection(selectedSeason.competitionYear, leagueData.type) :
                SCORES_COLLECTION;
              
              scoresQuery = query(
                collection(db, seasonSpecificCollection),
                where("teamId", "==", team.id),
                where("durchgang", "==", parsedRound),
                where("competitionYear", "==", selectedSeason.competitionYear)
              );
            } catch (error) {
              scoresQuery = query(
                collection(db, SCORES_COLLECTION),
                where("teamId", "==", team.id),
                where("durchgang", "==", parsedRound),
                where("competitionYear", "==", selectedSeason.competitionYear)
              );
            }
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
            
            // Prüfen ob mindestens ein Schütze noch kein Ergebnis hat
            const hasAtLeastOneShooterWithoutResult = validShooterIds.some(id => !shooterIdsWithResults.has(id));
            
            return { team, allShootersHaveResults: !hasAtLeastOneShooterWithoutResult };
          }));
          
          // Teams anzeigen, bei denen mindestens ein Schütze noch kein Ergebnis hat
          const filteredTeams = teamsWithFilterInfo
            .filter(({ allShootersHaveResults }) => !allShootersHaveResults)
            .map(({ team }) => team);
          

          
          setAllTeamsInSelectedLeague(filteredTeams);
        } catch (error) {
          logError("Error fetching teams:", error);
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
  }, [selectedLeagueId, selectedSeasonId, selectedRound, allSeasons, isLoadingLeagues, pendingScores, justSavedScoreIdentifiers, editMode, toast]);

  const handleOCRComplete = (ocrResults: OCRMatchResult[]) => {
    const currentSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (!currentSeason) return;

    const parsedRound = parseInt(selectedRound);
    
    // Erweiterte Duplikat-Erkennung: Bereits vorhandene Ergebnisse filtern
    const filteredResults = ocrResults.filter(result => {
      // Prüfe gegen bereits gespeicherte Ergebnisse (alle Teams)
      const existsInDB = existingScoresForTeamAndRound.some(existing => 
        existing.shooterId === result.shooterId && existing.durchgang === parsedRound
      );
      
      // Prüfe gegen Zwischenliste (alle Teams)
      const existsInPending = pendingScores.some(pending => 
        pending.shooterId === result.shooterId && pending.durchgang === parsedRound
      );
      
      // Prüfe gegen gerade gespeicherte (alle Teams)
      const existsInJustSaved = justSavedScoreIdentifiers.some(saved => 
        saved.shooterId === result.shooterId && saved.durchgang === parsedRound
      );
      
      // Zusätzlich: Prüfe gegen alle bereits erfassten Ergebnisse in der Datenbank für diesen Durchgang
      // (nicht nur für das aktuelle Team, sondern für alle Teams)
      
      return !existsInDB && !existsInPending && !existsInJustSaved;
    });
    
    const duplicateCount = ocrResults.length - filteredResults.length;
    
    const newPendingEntries = filteredResults.map(result => ({
      tempId: `ocr-${Date.now()}-${Math.random()}`,
      seasonId: selectedSeasonId,
      seasonName: currentSeason.name,
      leagueId: selectedLeagueId,
      leagueName: availableLeaguesForSeason.find(l => l.id === selectedLeagueId)?.name || '',
      leagueType: availableLeaguesForSeason.find(l => l.id === selectedLeagueId)?.type || 'KK',
      teamId: result.teamId,
      teamName: result.teamName,
      clubId: allTeamsInSelectedLeague.find(t => t.id === result.teamId)?.clubId || '',
      shooterId: result.shooterId,
      shooterName: result.shooterName,
      shooterGender: 'unknown',
      durchgang: parseInt(selectedRound),
      totalRinge: result.score,
      scoreInputType: (existingScoresForTeamAndRound.length > 0 ? 'post' : 'regular'),
      competitionYear: currentSeason.competitionYear,
      isOCRGenerated: true,
      ocrConfidence: result.confidence,
      ocrSource: result.ocrSource
    } as PendingScoreEntry));

    setPendingScores(prev => [...prev, ...newPendingEntries]);
    setShowOCR(false);
    
    // Intelligente Toast-Nachricht für bereits gescannte Handzettel
    if (newPendingEntries.length > 0 && duplicateCount > 0) {
      toast({
        title: `🎯 ${newPendingEntries.length} neue Ergebnisse erfasst!`,
        description: `${duplicateCount} bereits erfasste Ergebnisse übersprungen. 📝 Perfekt für Nachträge auf bereits gescannten Handzetteln!`,
        className: "border-green-500 bg-green-50"
      });
    } else if (newPendingEntries.length > 0) {
      toast({
        title: `🎯 ${newPendingEntries.length} Ergebnisse automatisch erfasst!`,
        description: "🤖 Google Gemini AI hat alle Werte erkannt. Namen sind zuverlässig - Ringzahlen bitte kurz prüfen!",
        className: "border-green-500 bg-green-50"
      });
    } else if (duplicateCount > 0) {
      toast({
        title: "ℹ️ Handzettel bereits vollständig erfasst",
        description: `Alle ${duplicateCount} Schützen haben bereits Ergebnisse für diesen Durchgang. 🚀 Einfach manuell fehlende Schützen nachtragen!`,
        className: "border-blue-500 bg-blue-50"
      });
    } else {
      // Wenn OCR erfolgreich war aber keine Ergebnisse gefunden wurden
      toast({
        title: "ℹ️ Keine neuen Ergebnisse erkannt",
        description: "OCR war erfolgreich, aber keine neuen Schützen gefunden. Eventuell bereits alle erfasst oder Handzettel nicht erkannt.",
        className: "border-amber-500 bg-amber-50"
      });
    }
  };

  const handleOCRError = (error: string) => {
    setShowOCR(false);
    toast({ title: "OCR-Fehler", description: error, variant: "destructive" });
  };

  const handleAddToList = () => {
    if (!user || !selectedShooterId || !selectedRound || !score || !selectedSeasonId || !selectedLeagueId || !selectedTeamId) {
      toast({ title: "Fehlende Eingabe", description: "Bitte alle Felder ausfüllen.", variant: "destructive" });
      return;
    }
    
    const scoreVal = parseInt(score);
    const season = allSeasons.find(s => s.id === selectedSeasonId);
    const league = availableLeaguesForSeason.find(l => l.id === selectedLeagueId);
    const team = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId);
    const shooter = allShootersFromDB.find(sh => sh.id === selectedShooterId);

    if (!season || !league || !team || !shooter) {
      toast({ title: "Fehler", description: "Daten unvollständig.", variant: "destructive" });
      return;
    }

    const maxScore = ['LG', 'LGA', 'LP', 'LPA'].includes(league.type) ? 400 : 300;
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxScore) {
      toast({ title: "Ungültiges Ergebnis", description: `Ringzahl (0-${maxScore}).`, variant: "destructive" });
      return;
    }
    
    const parsedRound = parseInt(selectedRound, 10);
    
    // Duplikat-Prüfung
    const isDuplicate = 
      pendingScores.some(ps => ps.shooterId === selectedShooterId && ps.durchgang === parsedRound && ps.teamId === selectedTeamId) ||
      justSavedScoreIdentifiers.some(js => js.shooterId === selectedShooterId && js.durchgang === parsedRound) ||
      existingScoresForTeamAndRound.some(es => es.shooterId === selectedShooterId && es.durchgang === parsedRound);
    
    if (isDuplicate) {
      toast({ title: "Ergebnis existiert bereits", description: `${shooter.name} hat bereits ein Ergebnis für Durchgang ${parsedRound}.`, variant: "destructive" });
      return;
    }
    
    const newEntry = {
      tempId: Date.now().toString(),
      seasonId: selectedSeasonId,
      seasonName: season.name,
      leagueId: selectedLeagueId,
      leagueName: league.name,
      leagueType: league.type,
      teamId: selectedTeamId,
      teamName: team.name,
      clubId: team.clubId || '',
      shooterId: selectedShooterId,
      shooterName: shooter.name,
      shooterGender: shooter.gender,
      durchgang: parsedRound,
      totalRinge: scoreVal,
      scoreInputType: resultType,
      competitionYear: season.competitionYear
    };
    
    setPendingScores(prev => [...prev, newEntry]);
    toast({ title: "Ergebnis hinzugefügt" });
    
    // UI-State komplett zurücksetzen
    setSelectedShooterId('');
    setScore('');
    
    // Force re-render der Schützen-Liste
    setTimeout(() => {
      setSelectedShooterId('');
    }, 100);
  };

  const handleRemoveFromList = (tempId: string) => {
    setPendingScores(prev => prev.filter(p => p.tempId !== tempId));
    toast({ title: "Eintrag entfernt", variant: "destructive" });
  };

  const handleSendHandzettelOnly = async () => {
    if (!user) { 
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
        (availableLeaguesForSeason.find(l => l.id === selectedLeagueId)?.name || 'Unbekannt') : 
        'Nicht ausgewählt';
      
      uploadFormData.append('subject', `📋 Handzettel ohne Ergebnisse: ${teamName} - DG ${selectedRound || 'unbekannt'}`);
      uploadFormData.append('message', `Handzettel ohne Ergebnisse eingegangen:\r\n\r\nMannschaft: ${teamName}\r\nLiga: ${leagueName}\r\nDurchgang: ${selectedRound || 'nicht ausgewählt'}\r\nAnzahl Seiten: ${handzettelFiles.length}\r\nZeitpunkt: ${new Date().toLocaleString('de-DE')}\r\n\r\nHinweis: Diese Handzettel wurden ohne digitale Ergebniserfassung versendet.\r\nDie Handzettel sind als Anhang beigefügt.`);
      
      const recipients = [{name: 'RWK-Leiter', email: 'rwk-leiter-ksve@gmx.de'}];
      logDebug('Recipients:', recipients);
      uploadFormData.append('recipients', JSON.stringify(recipients));
      
      progressToast.updateProgress(30, "Dateien werden angehängt...");
      
      handzettelFiles.forEach((file, index) => {
        uploadFormData.append(`attachment-${index}`, file);
      });
      
      progressToast.updateProgress(60, "E-Mail wird versendet...");
      
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      let authHeaders = {};
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        authHeaders = { 'Authorization': `Bearer ${token}` };
      }
      
      const uploadResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: authHeaders,
        body: uploadFormData
      });
      
      const responseData = await uploadResponse.json();
      logDebug('Email API Response:', responseData);
      logDebug('Email Status:', uploadResponse.status);
      
      if (uploadResponse.ok && responseData.success) {
        progressToast.updateProgress(100, "Handzettel erfolgreich versendet!");
        toast({ 
          title: "✅ Handzettel versendet!", 
          description: `${handzettelFiles.length} Handzettel-Seite(n) per E-Mail an RWK-Leiter gesendet.`,
          className: "border-green-500 bg-green-50"
        });
        
        setHandzettelFiles([]);
        setAttachOnly(false);
      } else {
        throw new Error(responseData.message || 'Versand fehlgeschlagen');
      }
    } catch (error) {
      logError('Handzettel-Versand Fehler:', error);
      toast({ 
        title: "❌ Versand fehlgeschlagen", 
        description: `Handzettel-E-Mail konnte nicht versendet werden: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setIsSubmittingScores(false);
    }
  };

  const handleFinalSave = async () => {
    if (!user || pendingScores.length === 0) {
      toast({ title: "Keine Ergebnisse", variant: "destructive" });
      return;
    }
    
    setIsSubmittingScores(true);
    
    try {
      const batch = writeBatch(db);
      
      for (const entry of pendingScores) {
        const { tempId, ...dataToSave } = entry;
        
        // Bestimme die richtige Collection basierend auf Jahr und Disziplin
        let collectionName = SCORES_COLLECTION;
        try {
          const seasonSpecificCollection = getSeasonSpecificScoresCollection(entry.competitionYear, entry.leagueType);
          collectionName = seasonSpecificCollection;
          logDebug(`🔍 Shared Results: Verwende ${collectionName}`);
        } catch (error) {
          logDebug(`⚠️ Shared Results: Verwende Standard-Collection`);
        }
        
        const scoreDocRef = doc(collection(db, collectionName));
        batch.set(scoreDocRef, {
          ...dataToSave,
          enteredByUserId: user.uid,
          enteredByUserName: user.displayName || user.email || "Unbekannt",
          entryTimestamp: serverTimestamp()
        });
        
        // Schützen-Eintrag NUR erstellen wenn nicht vorhanden - gender niemals überschreiben!
        const shooterDocRef = doc(db, SHOOTERS_COLLECTION, entry.shooterId);
        const shooterSnap = await getDoc(shooterDocRef);
        if (!shooterSnap.exists()) {
          const shooterData: any = {
            name: entry.shooterName,
            gender: entry.shooterGender || 'unknown',
            createdAt: serverTimestamp(),
            createdBy: 'auto-from-scores'
          };
          
          const nameParts = entry.shooterName.split(' ');
          if (nameParts.length >= 2) {
            shooterData.firstName = nameParts[0];
            shooterData.lastName = nameParts.slice(1).join(' ');
          }
          
          batch.set(shooterDocRef, shooterData);
        }
      }
      
      await batch.commit();
      
      // League Updates für "Letzte Ergebnis-Updates" auf der Startseite
      for (const entry of pendingScores) {
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
              const { updateDoc } = await import('firebase/firestore');
              await updateDoc(existingUpdatesSnapshot.docs[0].ref, { timestamp: serverTimestamp() });
            } else {
              const { addDoc } = await import('firebase/firestore');
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
            
            // E-Mail-Benachrichtigung - FIX für korrekte Mannschaftsnamen
            try {
              const { getAuth } = await import('firebase/auth');
              const auth = getAuth();
              let authHeaders = {};
              if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken();
                authHeaders = { 'Authorization': `Bearer ${token}` };
              }
              
              const userName = user?.displayName || user?.email || 'Unbekannter Benutzer';
              const teamName = entry.teamName; // Verwende teamName aus entry (ist korrekt)
              const leagueName = entry.leagueName; // Verwende leagueName aus entry (ist korrekt)
              
              // Erstelle detaillierte Ergebnis-Liste
              const resultDetails = pendingScores
                .filter(p => p.durchgang === entry.durchgang)
                .map(result => `• ${result.shooterName}: ${result.totalRinge} Ringe`)
                .join('\r\n');
              
              const emailFormData = new FormData();
              emailFormData.append('subject', 'Neue Ergebnisse eingegangen');
              emailFormData.append('message', `Neue Ergebnisse eingegangen:\r\n\r\nMannschaft: ${teamName}\r\nLiga: ${leagueName}\r\nDurchgang: ${entry.durchgang}\r\nAnzahl Ergebnisse: ${pendingScores.filter(p => p.durchgang === entry.durchgang).length}\r\nZeitpunkt: ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}\r\n\r\n📊 Ergebnis-Details:\r\n${resultDetails}\r\n\r\nEingegeben von: ${userName}\r\n\r\nDie Ergebnisse wurden digital erfasst und sind sofort in den RWK-Tabellen verfügbar.`);
              // Mail an Admin UND an den Eintragenden senden
              const recipients = [{name: 'RWK-Leiter', email: 'rwk-leiter-ksve@gmx.de'}];
              if (user?.email && user.email !== 'admin@rwk-einbeck.de') {
                recipients.push({name: userName, email: user.email});
              }
              emailFormData.append('recipients', JSON.stringify(recipients));
              
              const emailResponse = await fetch('/api/send-email', {
                method: 'POST',
                headers: authHeaders,
                body: emailFormData
              });
              
              if (!emailResponse.ok) {
                const errorText = await emailResponse.text();
                logWarn('E-Mail-Benachrichtigung fehlgeschlagen:', errorText);
              } else {
                logInfo(`E-Mail-Benachrichtigung gesendet: ${teamName} - DG ${entry.durchgang}`);
              }
            } catch (emailError) {
              logError('E-Mail-Benachrichtigung Fehler:', emailError);
            }
          } catch (updateError) {
            logWarn('League update failed:', updateError instanceof Error ? updateError.message : String(updateError));
            // Fehler ignorieren - Hauptfunktion funktioniert trotzdem
          }
          break; // Nur einmal pro Liga senden
        }
      }
      
      // Handzettel-Upload wenn vorhanden
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
          const leagueName = availableLeaguesForSeason.find(l => l.id === selectedLeagueId)?.name || 'Unbekannt';
          
          uploadFormData.append('subject', `📋 Handzettel-Beleg: ${teamName} - Durchgang ${selectedRound}`);
          uploadFormData.append('message', `Handzettel-Beleg eingegangen:\r\n\r\nMannschaft: ${teamName}\r\nLiga: ${leagueName}\r\nDurchgang: ${selectedRound}\r\nAnzahl Seiten: ${handzettelFiles.length}\r\nZeitpunkt: ${new Date().toLocaleString('de-DE')}\r\n\r\nDie Handzettel sind als Anhang beigefügt.`);
          uploadFormData.append('recipients', JSON.stringify([{name: 'RWK-Leiter', email: 'rwk-leiter-ksve@gmx.de'}]));
          
          progressToast.updateProgress(30, "Dateien werden angehängt...");
          
          handzettelFiles.forEach((file, index) => {
            uploadFormData.append(`attachment-${index}`, file);
          });
          
          progressToast.updateProgress(60, "E-Mail wird versendet...");
          
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          let authHeaders = {};
          if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            authHeaders = { 'Authorization': `Bearer ${token}` };
          }
          
          const uploadResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: authHeaders,
            body: uploadFormData
          });
          
          const responseData = await uploadResponse.json();
          logDebug('Handzettel E-Mail Response:', responseData);
          logDebug('Handzettel Status:', uploadResponse.status);
          logDebug('E-Mail API Response:', responseData);
          logDebug('E-Mail Status:', uploadResponse.status);
          logDebug('Auth Headers:', Object.keys(authHeaders));
          
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
          toast({ 
            title: "✅ Ergebnisse gespeichert", 
            description: `Handzettel-E-Mail fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}. Ergebnisse sind aber gesichert.`,
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
          const { auditLogService } = await import('@/lib/services/audit-service');
          await auditLogService.logAction(
            'create',
            'score',
            `${entry.shooterId}-${entry.durchgang}`,
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
              userId: user.uid,
              userName: user.displayName || user.email || "Unbekannt"
            }
          );
        } catch (auditError) {
          logWarn('Audit log failed:', auditError instanceof Error ? auditError.message : String(auditError));
          // Audit-Fehler nicht an Benutzer weiterleiten
        }
      }
      
      setPendingScores([]);
      setHandzettelFiles([]);
      
      // Teams neu laden um vollständig erfasste Teams zu entfernen
      if (selectedLeagueId && selectedSeasonId) {
        const selectedSeason = allSeasons.find(s => s.id === selectedSeasonId);
        if (selectedSeason) {
          try {
            const teamsQuery = query(
              collection(db, TEAMS_COLLECTION),
              where("leagueId", "==", selectedLeagueId),
              where("competitionYear", "==", selectedSeason.competitionYear),
              orderBy("name", "asc")
            );
            const teamsSnapshot = await getDocs(teamsQuery);
            const refreshedTeams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)).filter(t => t.id);
            setAllTeamsInSelectedLeague(refreshedTeams);
          } catch (error) {
            logWarn('Team refresh failed:', error instanceof Error ? error.message : String(error));
          }
        }
      }
    } catch (error) {
      logError("Error saving scores:", error);
      toast({ title: "Fehler beim Speichern", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingScores(false);
    }
  };

  if (isLoadingMasterData) {
    return <div className="flex justify-center items-center py-12"><Loader className="h-12 w-12 animate-spin text-primary mr-3" /><p>Lade Grunddaten...</p></div>;
  }

  if (availableRunningSeasons.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung</h1>
          <Link href={dashboardHref}>
            <Button variant="outline" size="sm">Zurück zum Dashboard</Button>
          </Link>
        </div>
        <Card className="shadow-md border-amber-500">
          <CardHeader><CardTitle className="text-amber-600 flex items-center"><AlertCircle className="mr-2 h-5 w-5" />Keine laufenden Saisons</CardTitle></CardHeader>
          <CardContent><p>Aktuell sind keine Saisons mit Status "Laufend" für die Ergebniserfassung verfügbar.</p></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="px-2 md:px-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center">
          <BackButton className="mr-2" fallbackHref={backHref} />
          <h1 className="text-xl md:text-2xl font-semibold text-primary">
            Ergebniserfassung
            {userRole !== 'admin' && (
              <span className="text-sm text-muted-foreground ml-2">
                ({userRole === 'sportleiter' ? 'Sportleiter' : 'Mannschaftsführer'})
              </span>
            )}
          </h1>
        </div>
        <Link href={dashboardHref}>
          <Button variant="outline" size="sm">Zurück zum Dashboard</Button>
        </Link>
      </div>
      
      <Card className="shadow-md border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-700 w-full max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Camera className="h-5 w-5" />
            📸 Handzettel fotografieren
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            🤖 Google Gemini AI - Handzettel werden jetzt noch genauer erkannt - einfach fotografieren, abschicken und fertig!
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="space-y-4 w-full max-w-full">
            {!selectedLeagueId || !selectedRound ? (
              <div className="p-4 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600">
                <div className="text-center space-y-2">
                  <Camera className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-100">📋 Zuerst Liga und Durchgang auswählen!</p>
                  <p className="text-xs text-amber-700 dark:text-amber-200">Dann erscheint hier die Kamera-Funktion - einfach fotografieren, abschicken und fertig!</p>
                </div>
              </div>
            ) : allTeamsInSelectedLeague.length === 0 && !editMode ? (
              <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600">
                <div className="text-center space-y-2">
                  <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto" />
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-100">✅ Durchgang bereits vollständig erfasst!</p>
                  <p className="text-xs text-blue-700 dark:text-blue-200">Alle Teams haben bereits Ergebnisse für Durchgang {selectedRound}. {userRole === 'admin' ? 'Wählen Sie einen anderen Durchgang oder aktivieren Sie den Bearbeitungsmodus.' : 'Wählen Sie einen anderen Durchgang.'}</p>
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
                    Liga: <strong>{availableLeaguesForSeason.find(l => l.id === selectedLeagueId)?.name}</strong> | 
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
                          🤖 Google Gemini AI Erkennung
                        </Label>
                      </div>
                      <p className="text-xs text-green-800 dark:text-green-200 mt-2 ml-8">
                        ✨ Gemini erkennt Handzettel sehr zuverlässig! Trotzdem kurz kontrollieren. Deaktivieren = nur Handzettel versenden.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Kamera-Button für Mobile */}
                      <div className="block md:hidden">
                        <div className="p-4 border-2 border-green-300 rounded-lg bg-green-50">
                          <h4 className="text-sm font-medium text-green-800 mb-3 text-center">📸 Kamera verwenden</h4>
                          <div className="relative">
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
                                    description: `${files.length} Foto(s) bereit. ${!attachOnly ? 'Klicke "🤖 Erkennung starten" um automatisch auszulesen.' : 'Wird ohne OCR versendet.'}`,
                                    className: "border-blue-500 bg-blue-50"
                                  });
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="min-h-[80px] flex flex-col items-center justify-center border-2 border-dashed border-green-400 rounded-lg bg-white hover:border-green-500 hover:bg-green-50 transition-all duration-200 px-4 py-6">
                              <span className="text-green-700 font-semibold text-base mb-1">📸 Kamera öffnen</span>
                              <span className="text-green-600 text-sm text-center">Tippen zum Fotografieren</span>
                            </div>
                          </div>
                          <p className="text-xs text-center text-green-700 mt-3">Direkt fotografieren</p>
                        </div>
                      </div>
                      
                      {/* Galerie/Datei-Auswahl für Mobile und Desktop */}
                      <div>
                        <div className="p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
                          <h4 className="text-sm font-medium text-blue-800 mb-3 text-center">📁 Galerie/Dateien verwenden</h4>
                          <div className="relative">
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
                                    description: `${files.length} Datei(en) aus Galerie/Dateien. ${!attachOnly ? 'Klicke "🤖 Erkennung starten" um automatisch auszulesen.' : 'Wird ohne OCR versendet.'}`,
                                    className: "border-blue-500 bg-blue-50"
                                  });
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="min-h-[80px] flex flex-col items-center justify-center border-2 border-dashed border-blue-400 rounded-lg bg-white hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 px-4 py-6">
                              <span className="text-blue-700 font-semibold text-base mb-1">📁 Dateien auswählen</span>
                              <span className="text-blue-600 text-sm text-center">Tippen zum Auswählen</span>
                            </div>
                          </div>
                          <p className="text-xs text-center text-blue-700 mt-3">Aus Galerie oder WhatsApp wählen</p>
                        </div>
                      </div>
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
                            🤖 Erkennung starten
                          </Button>
                        )}
                      </div>
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
                </div>
                
                {showOCR && handzettelFiles.length > 0 && !attachOnly && (
                  <div data-ocr-component className="w-full max-w-full overflow-hidden">
                    <HandzettelOCR
                      key={handzettelFiles[0]?.name}
                      imageFile={handzettelFiles[0]}
                      availableTeams={allTeamsInSelectedLeague}
                      selectedLeagueId={selectedLeagueId}
                      selectedRound={selectedRound}
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

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>📝 {editMode ? 'Ergebnis bearbeiten/hinzufügen' : 'Einzelergebnis manuell hinzufügen'}</CardTitle>
              <CardDescription>{editMode ? 'Bearbeitungsmodus: Alle Teams und Schützen werden angezeigt' : 'Für zweite Handzettel oder falls OCR nicht funktioniert - klassische Eingabe'}</CardDescription>
            </div>
            {userRole === 'admin' && (
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
                className="flex items-center gap-2"
              >
                {editMode ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {editMode ? 'Bearbeiten AN' : 'Bearbeiten AUS'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-2">
              <Label htmlFor="season">Saison (nur laufende)</Label>
              <NativeSelect
                value={selectedSeasonId}
                onValueChange={setSelectedSeasonId}
                disabled={availableRunningSeasons.length === 0}
                placeholder={availableRunningSeasons.length === 0 ? "Keine Saisons" : "Saison wählen"}
                options={availableRunningSeasons.filter(s => s.id).map(s => ({ value: s.id, label: s.name }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="league">Liga</Label>
              <NativeSelect
                value={selectedLeagueId}
                onValueChange={setSelectedLeagueId}
                disabled={!selectedSeasonId || isLoadingLeagues || availableLeaguesForSeason.length === 0}
                placeholder={isLoadingLeagues ? "Lade Ligen..." : (availableLeaguesForSeason.length === 0 && selectedSeasonId ? "Keine Ligen für Saison" : "Liga wählen")}
                options={availableLeaguesForSeason.filter(l => l.id).map(l => ({ value: l.id, label: l.name }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="round">Durchgang</Label>
              <NativeSelect
                value={selectedRound}
                onValueChange={setSelectedRound}
                disabled={!selectedLeagueId}
                placeholder="Durchgang wählen"
                options={[...Array(5)].map((_, i) => ({ value: (i + 1).toString(), label: `Durchgang ${i + 1}` }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Mannschaft</Label>
              <NativeSelect
                value={selectedTeamId}
                onValueChange={setSelectedTeamId}
                disabled={!selectedLeagueId || isLoadingTeams || allTeamsInSelectedLeague.length === 0}
                placeholder={isLoadingTeams ? "Lade Teams..." : (allTeamsInSelectedLeague.length === 0 ? "Keine Teams" : "Mannschaft wählen")}
                options={allTeamsInSelectedLeague.filter(t => t.id).map(t => ({ value: t.id, label: t.name }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shooter">Schütze</Label>
              <NativeSelect
                value={selectedShooterId}
                onValueChange={setSelectedShooterId}
                disabled={!selectedTeamId || isLoadingShooters || availableShootersForDropdown.length === 0}
                placeholder={isLoadingShooters ? "Lade Schützen..." : (availableShootersForDropdown.length === 0 ? "Keine Schützen" : "Schütze wählen")}
                options={availableShootersForDropdown.filter(sh => sh.id).map(sh => ({ value: sh.id, label: sh.name }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Ergebnis (Ringe)</Label>
              <Input 
                id="score" 
                type="number" 
                value={score} 
                className="w-40 text-center text-lg h-10"
                onChange={(e) => {
                  const value = e.target.value;
                  setScore(value);
                  
                  if (value && selectedLeagueId && selectedShooterId && selectedTeamId) {
                    const scoreVal = parseInt(value);
                    const league = availableLeaguesForSeason.find(l => l.id === selectedLeagueId);
                    if (league && !isNaN(scoreVal)) {
                      const maxScore = ['LG', 'LGA', 'LP', 'LPA'].includes(league.type) ? 400 : 300;
                      const check = {
                        isValid: scoreVal >= 0 && scoreVal <= maxScore,
                        warning: scoreVal < 0 ? 'Negative Werte nicht möglich' : 
                                scoreVal > maxScore ? `Maximum für ${league.type}: ${maxScore} Ringe` : 
                                scoreVal < maxScore * 0.5 ? `${scoreVal} Ringe sehr niedrig für ${league.type}` : null
                      };
                      if (!check.isValid || check.warning) {
                        toast({
                          title: check.isValid ? "⚠️ Warnung" : "❌ Ungültiger Wert",
                          description: check.warning,
                          variant: check.isValid ? "default" : "destructive",
                          duration: 3000
                        });
                      }
                      
                      // Erweiterte Plausibilitätsprüfung
                      if (check.isValid) {
                        const shooter = allShootersFromDB.find(s => s.id === selectedShooterId);
                        const team = allTeamsInSelectedLeague.find(t => t.id === selectedTeamId);
                        const season = allSeasons.find(s => s.id === selectedSeasonId);
                        
                        if (shooter && team && season) {
                          plausibilityService.checkScorePlausibility(
                            selectedShooterId,
                            shooter.name,
                            selectedTeamId,
                            team.name,
                            scoreVal,
                            league.type,
                            season.competitionYear
                          ).then(warnings => {
                            if (warnings.length > 0) {
                              toast({
                                title: "⚠️ Plausibilitätswarnung",
                                description: warnings[0].message,
                                variant: "default",
                                duration: 5000
                              });
                            }
                          }).catch(error => {
                            logWarn('Plausibility check failed:', error);
                          });
                        }
                      }
                    }
                  }
                }}
                disabled={!selectedShooterId}
              />
            </div>

          </div>
          

          

          
          <div className="space-y-3 pt-2">
            <Label>Ergebnistyp</Label>
            <RadioGroup value={resultType} onValueChange={(value) => setResultType(value as "regular" | "pre" | "post")} className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
              <div className="flex items-center space-x-2"><RadioGroupItem value="regular" id="r-regular" /><Label htmlFor="r-regular">Regulär</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="pre" id="r-pre" /><Label htmlFor="r-pre">Vorschießen</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="post" id="r-post" /><Label htmlFor="r-post">Nachschießen</Label></div>
            </RadioGroup>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={handleAddToList} disabled={!selectedShooterId || !selectedRound || !score} className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" /> Zur Liste hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>



      {pendingScores.length > 0 && (
        <Card className="shadow-md mt-6">
          <CardHeader><CardTitle>Vorgemerkte Ergebnisse ({pendingScores.length})</CardTitle></CardHeader>
          <CardContent>
            {/* Warnung für automatisch erkannte Einträge */}
            {pendingScores.some(p => p.isOCRGenerated) && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400 dark:border-amber-500">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2" />
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    <strong>⚠️ WICHTIG:</strong> {pendingScores.filter(p => p.isOCRGenerated).length} 
                    Einträge automatisch erkannt. Namen sind zuverlässig - 
                    <strong>Ringzahlen prüfen!</strong>
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {pendingScores.map((entry) => {
                const confidence = entry.ocrConfidence || 1;
                const bgColor = entry.isOCRGenerated ? 
                  (confidence >= 0.8 ? 'bg-green-50 border-green-200' : 
                   confidence >= 0.6 ? 'bg-yellow-50 border-yellow-200' : 
                   'bg-red-50 border-red-200') : 'bg-white border-gray-200';
                
                return (
                  <div key={entry.tempId} className={`p-3 border rounded ${bgColor}`}>
                    <div className="space-y-3">
                      {/* Schützenname und Löschen-Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {entry.isOCRGenerated && (
                            <Zap className={`h-3 w-3 ${
                              confidence >= 0.8 ? 'text-green-500' : 
                              confidence >= 0.6 ? 'text-yellow-500' : 
                              'text-red-500'
                            }`} />
                          )}
                          <p className="font-medium">{entry.shooterName}</p>
                          {entry.isOCRGenerated && (
                            <div className="flex gap-1">
                              <span className="text-xs font-mono px-1 py-0.5 rounded bg-green-100 text-green-700">
                                Name: 95%
                              </span>
                              <span className={`text-xs font-mono px-1 py-0.5 rounded ${
                                confidence >= 0.8 ? 'bg-green-100 text-green-700' : 
                                confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-red-100 text-red-700'
                              }`}>
                                Ringe: {Math.round((entry.ocrConfidence || 0.7) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFromList(entry.tempId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Vereinsname */}
                      <p className="text-sm text-muted-foreground">{entry.teamName} - DG {entry.durchgang}</p>
                      
                      {/* Ringe-Eingabe */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Ringe:</span>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            value={entry.totalRinge?.toString() || ''} 
                            onChange={(e) => {
                              const newScore = parseInt(e.target.value) || 0;
                              setPendingScores(prev => prev.map(p => 
                                p.tempId === entry.tempId ? {...p, totalRinge: newScore} : p
                              ));
                            }}
                            className="w-24 text-center text-lg h-10"
                          />
                        </div>
                      </div>
                      
                      {entry.isOCRGenerated && (
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          📝 Namen sind zuverlässig erkannt - ⚠️ Ringzahlen bitte prüfen!
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="flex justify-end pt-6">
              <Button onClick={handleFinalSave} size="lg" disabled={isSubmittingScores || pendingScores.length === 0} className="h-auto py-3">
                <div className="flex flex-col items-center">
                  <div className="flex items-center">
                    {isSubmittingScores && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                    <span>{pendingScores.length} Ergebnisse speichern</span>
                  </div>
                  {handzettelFiles.length > 0 && (
                    <span className="text-sm opacity-90">+ {handzettelFiles.length} Handzettel senden</span>
                  )}
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {pendingScores.length === 0 && (
        <div className="mt-8 p-6 text-center text-muted-foreground bg-secondary/30 rounded-md">
          <CheckSquare className="mx-auto h-10 w-10 mb-3 text-primary/70" />
          <p className="text-base">Noch keine Ergebnisse zur Speicherung vorgemerkt.</p>
        </div>
      )}
    </div>
  );
}
