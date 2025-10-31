"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckSquare, PlusCircle, Trash2, Loader, AlertCircle, ToggleLeft, ToggleRight, CheckCircle, Camera, Zap, AlertTriangle } from 'lucide-react';
import { HandzettelOCR, type OCRMatchResult } from '@/components/ui/handzettel-ocr-simple';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { BackButton } from '@/components/ui/back-button';
import { createProgressToast } from '@/components/ui/progress-toast';
import { Checkbox } from "@/components/ui/checkbox";
import type { Season, League, Team, Shooter, PendingScoreEntry, ScoreEntry, FirestoreLeagueSpecificDiscipline, LeagueUpdateEntry } from '@/types/rwk';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { plausibilityService } from '@/lib/services/plausibility-service';
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy, writeBatch, serverTimestamp, doc, Timestamp } from 'firebase/firestore';

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
  const [isLoadingExistingScores, setIsLoadingExistingScores] = useState(false);
  const [isSubmittingScores, setIsSubmittingScores] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [showOCR, setShowOCR] = useState(false);
  const [handzettelFiles, setHandzettelFiles] = useState<File[]>([]);
  const [attachOnly, setAttachOnly] = useState(false);

  const canAccessTeam = (teamClubId: string) => {
    if (userRole === 'admin') return true;
    if (clubId && teamClubId === clubId) return true;
    return false;
  };

  const canEdit = userRole === 'admin';

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
      console.error("Error fetching master data: ", error);
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
            console.error("Error fetching leagues for club:", error);
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

  // Teams laden - Sportleiter sehen alle Teams der Liga
  useEffect(() => {
    const selectedSeason = allSeasons.find(s => s.id === selectedSeasonId);
    if (selectedLeagueId && selectedSeason && !isLoadingLeagues) {
      setIsLoadingTeams(true);
      const fetchTeams = async () => {
        try {
          // Alle Teams der Liga laden (Sportleiter können alle Teams der Liga erfassen)
          const teamsQuery = query(
            collection(db, TEAMS_COLLECTION),
            where("leagueId", "==", selectedLeagueId),
            where("competitionYear", "==", selectedSeason.competitionYear),
            orderBy("name", "asc")
          );
          
          const teamsSnapshot = await getDocs(teamsQuery);
          const fetchedTeams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)).filter(t => t.id);
          
          setAllTeamsInSelectedLeague(fetchedTeams);
        } catch (error) {
          console.error("Error fetching teams:", error);
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
  }, [selectedLeagueId, selectedSeasonId, allSeasons, isLoadingLeagues, toast]);

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
        description: `${duplicateCount} bereits vorhandene Ergebnisse übersprungen. Nachschießen-Spalten werden automatisch ignoriert.`,
        className: "border-green-500 bg-green-50"
      });
    } else if (newPendingEntries.length > 0) {
      toast({
        title: `🎯 ${newPendingEntries.length} Ergebnisse automatisch erfasst!`,
        description: "Nur reguläre Ergebnisse erfasst - Nachschießen werden ignoriert. Bitte prüfen Sie alle Werte.",
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
    setSelectedShooterId('');
    setScore('');
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
      uploadFormData.append('message', `Handzettel ohne Ergebnisse eingegangen:\n\nMannschaft: ${teamName}\nLiga: ${leagueName}\nDurchgang: ${selectedRound || 'nicht ausgewählt'}\nAnzahl Seiten: ${handzettelFiles.length}\nZeitpunkt: ${new Date().toLocaleString('de-DE')}\n\nHinweis: Diese Handzettel wurden ohne digitale Ergebniserfassung versendet.\nDie Handzettel sind als Anhang beigefügt.`);
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
      console.error('Handzettel-Versand Fehler:', error);
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
      
      pendingScores.forEach((entry) => {
        const { tempId, ...dataToSave } = entry;
        const scoreDocRef = doc(collection(db, SCORES_COLLECTION));
        batch.set(scoreDocRef, {
          ...dataToSave,
          enteredByUserId: user.uid,
          enteredByUserName: user.displayName || user.email || "Unbekannt",
          entryTimestamp: serverTimestamp()
        });
      });
      
      await batch.commit();
      
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
          uploadFormData.append('message', `Handzettel-Beleg eingegangen:\n\nMannschaft: ${teamName}\nLiga: ${leagueName}\nDurchgang: ${selectedRound}\nAnzahl Seiten: ${handzettelFiles.length}\nZeitpunkt: ${new Date().toLocaleString('de-DE')}\n\nDie Handzettel sind als Anhang beigefügt.`);
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
          console.error('Handzettel-Upload Fehler:', error);
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
      
      setPendingScores([]);
      setHandzettelFiles([]);
    } catch (error) {
      console.error("Error saving scores:", error);
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
          <HelpTooltip 
            text="Hier können Sie Ergebnisse für Mannschaften erfassen und speichern." 
            side="right" 
            className="ml-2"
          />
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
            🤖 Foto machen → Computer liest automatisch alle Ergebnisse aus - spart 90% Zeit!
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="space-y-4 w-full max-w-full">
            {!selectedLeagueId || !selectedRound ? (
              <div className="p-4 border-2 border-dashed border-amber-300 rounded-lg bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600">
                <div className="text-center space-y-2">
                  <Camera className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-100">📋 Zuerst Liga und Durchgang auswählen!</p>
                  <p className="text-xs text-amber-700 dark:text-amber-200">Dann erscheint hier die Kamera-Funktion - Computer liest Handzettel automatisch aus.</p>
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
                          🤖 Automatisches Auslesen verwenden (Computer erkennt Zahlen)
                        </Label>
                      </div>
                      <p className="text-xs text-green-800 dark:text-green-200 mt-2 ml-8">
                        ⚠️ WICHTIG: Automatisch erkannte Ergebnisse müssen immer kontrolliert werden! Prüfen Sie alle Werte vor dem Speichern.
                      </p>
                    </div>
                    
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
                            title: "📎 Handzettel vorgemerkt",
                            description: `${files.length} Datei(en) ausgewählt.`,
                            className: "border-blue-500 bg-blue-50"
                          });
                        }
                      }}
                      className="bg-white border-2 border-dashed border-blue-300 p-4 text-center cursor-pointer hover:border-blue-400"
                    />
                    
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
              <CardTitle>📝 Einzelergebnis manuell hinzufügen</CardTitle>
              <CardDescription>Für zweite Handzettel oder falls OCR nicht funktioniert - klassische Eingabe</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
            <div className="space-y-2">
              <Label htmlFor="round">Durchgang</Label>
              <Select value={selectedRound} onValueChange={setSelectedRound} disabled={!selectedLeagueId}>
                <SelectTrigger id="round"><SelectValue placeholder="Durchgang wählen" /></SelectTrigger>
                <SelectContent>{[...Array(5)].map((_, i) => (<SelectItem key={i + 1} value={(i + 1).toString()}>Durchgang {i + 1}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Mannschaft</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={!selectedLeagueId || isLoadingTeams || allTeamsInSelectedLeague.length === 0}>
                <SelectTrigger id="team"><SelectValue placeholder={isLoadingTeams ? "Lade Teams..." : (allTeamsInSelectedLeague.length === 0 ? "Keine Teams" : "Mannschaft wählen")} /></SelectTrigger>
                <SelectContent>{allTeamsInSelectedLeague.filter(t => t.id).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shooter">Schütze</Label>
              <Select value={selectedShooterId} onValueChange={setSelectedShooterId} disabled={!selectedTeamId || isLoadingShooters || availableShootersForDropdown.length === 0}>
                <SelectTrigger id="shooter"><SelectValue placeholder={isLoadingShooters ? "Lade Schützen..." : (availableShootersForDropdown.length === 0 ? "Keine Schützen" : "Schütze wählen")} /></SelectTrigger>
                <SelectContent>{availableShootersForDropdown.filter(sh => sh.id).map(sh => <SelectItem key={sh.id} value={sh.id}>{sh.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Ergebnis (Ringe)</Label>
              <Input 
                id="score" 
                type="number" 
                value={score} 
                onChange={(e) => {
                  const value = e.target.value;
                  setScore(value);
                  
                  // Lokale Plausibilitätsprüfung
                  if (value && selectedLeagueId) {
                    const scoreVal = parseInt(value);
                    const league = availableLeaguesForSeason.find(l => l.id === selectedLeagueId);
                    if (league && !isNaN(scoreVal)) {
                      // Einfache lokale Validierung
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
                    }
                  }
                }}
                placeholder="z.B. 285" 
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
                  <div key={entry.tempId} className={`flex items-center justify-between p-3 border rounded ${bgColor}`}>
                    <div className="flex-1">
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
                      <p className="text-sm text-muted-foreground">{entry.teamName} - DG {entry.durchgang}</p>
                      {entry.isOCRGenerated && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          📝 Namen sind zuverlässig erkannt - ⚠️ Ringzahlen bitte prüfen!
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={entry.totalRinge} 
                        onChange={(e) => {
                          const newScore = parseInt(e.target.value) || 0;
                          setPendingScores(prev => prev.map(p => 
                            p.tempId === entry.tempId ? {...p, totalRinge: newScore} : p
                          ));
                        }}
                        className="w-20 text-center"
                      />
                      <span className="text-sm">Ringe</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveFromList(entry.tempId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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