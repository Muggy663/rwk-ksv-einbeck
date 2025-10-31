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
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy, writeBatch, serverTimestamp, doc, Timestamp } from 'firebase/firestore';

interface SharedResultsPageProps {
  userRole: 'admin' | 'sportleiter' | 'mannschaftsfuehrer';
  allowedClubIds?: string[];
  backHref: string;
  dashboardHref: string;
}

export default function SharedResultsPage({ 
  userRole, 
  allowedClubIds = [], 
  backHref, 
  dashboardHref 
}: SharedResultsPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [availableRunningSeasons, setAvailableRunningSeasons] = useState<Season[]>([]);
  const [availableLeaguesForSeason, setAvailableLeaguesForSeason] = useState<League[]>([]);
  const [justSavedScoreIdentifiers, setJustSavedScoreIdentifiers] = useState<{ shooterId: string; durchgang: number }[]>([]);
  const [existingScoresForTeamAndRound, setExistingScoresForTeamAndRound] = useState<ScoreEntry[]>([]);
  const [pendingScores, setPendingScores] = useState<PendingScoreEntry[]>([]);
  const [score, setScore] = useState<string>('');
  const [resultType, setResultType] = useState<'regular' | 'pre' | 'post'>("regular");
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
  const [editMode, setEditMode] = useState(userRole === 'admin');
  const [showOCR, setShowOCR] = useState(false);
  const [handzettelFiles, setHandzettelFiles] = useState<File[]>([]);
  const [attachOnly, setAttachOnly] = useState(false);

  const canAccessTeam = (team: Team): boolean => {
    if (userRole === 'admin') return true;
    return allowedClubIds.includes(team.clubId || '');
  };

  const fetchMasterData = useCallback(async () => {
    setIsLoadingMasterData(true);
    try {
      const seasonsSnapshot = await getDocs(query(collection(db, "seasons"), orderBy("competitionYear", "desc")));
      const fetchedSeasons = seasonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season)).filter(s => s.id);
      setAllSeasons(fetchedSeasons);
      const running = fetchedSeasons.filter(s => s.status === 'Laufend');
      setAvailableRunningSeasons(running);
      if (running.length === 1 && !selectedSeasonId) {
        setSelectedSeasonId(running[0].id);
      }

      const leaguesSnapshot = await getDocs(query(collection(db, "rwk_leagues"), orderBy("name", "asc")));
      setAllLeagues(leaguesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as League)).filter(l => l.id));
      
      const shootersSnapshot = await getDocs(query(collection(db, "shooters"), orderBy("name", "asc")));
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
    if (selectedLeagueId && selectedSeason && !isLoadingLeagues) {
      setIsLoadingTeams(true);
      const fetchTeams = async () => {
        try {
          const teamsQuery = query(collection(db, "rwk_teams"), 
            where("leagueId", "==", selectedLeagueId), 
            where("competitionYear", "==", selectedSeason.competitionYear),
            orderBy("name", "asc")
          );
          const teamsSnapshot = await getDocs(teamsQuery);
          let fetchedTeams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)).filter(t => t.id);
          
          fetchedTeams = fetchedTeams.filter(canAccessTeam);
          
          if (!selectedRound || editMode) {
            setAllTeamsInSelectedLeague(fetchedTeams);
            setIsLoadingTeams(false);
            return;
          }
          
          const parsedRound = parseInt(selectedRound, 10);
          const teamsWithFilterInfo = await Promise.all(fetchedTeams.map(async team => {
            const teamShooterIds = team.shooterIds || [];
            if (teamShooterIds.length === 0) return { team, allShootersHaveResults: false };
            
            const scoresQuery = query(
              collection(db, "rwk_scores"),
              where("teamId", "==", team.id),
              where("durchgang", "==", parsedRound),
              where("competitionYear", "==", selectedSeason.competitionYear)
            );
            const scoresSnapshot = await getDocs(scoresQuery);
            const existingScores = scoresSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScoreEntry));
            
            const shooterIdsWithResults = new Set(existingScores.map(score => score.shooterId));
            
            pendingScores.forEach(ps => {
              if (ps.teamId === team.id && ps.durchgang === parsedRound) {
                shooterIdsWithResults.add(ps.shooterId);
              }
            });
            
            justSavedScoreIdentifiers.forEach(js => {
              if (js.durchgang === parsedRound && teamShooterIds.includes(js.shooterId)) {
                shooterIdsWithResults.add(js.shooterId);
              }
            });
            
            const allShootersHaveResults = teamShooterIds.every(id => shooterIdsWithResults.has(id));
            return { team, allShootersHaveResults };
          }));
          
          const filteredTeams = teamsWithFilterInfo
            .filter(({ allShootersHaveResults }) => !allShootersHaveResults)
            .map(({ team }) => team);
          
          setAllTeamsInSelectedLeague(filteredTeams);
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
  }, [selectedLeagueId, selectedSeasonId, selectedRound, allSeasons, isLoadingLeagues, pendingScores, justSavedScoreIdentifiers, editMode, userRole, allowedClubIds, toast]);

  const pageTitle = userRole === 'admin' ? 'Ergebniserfassung (Admin)' : 
                   userRole === 'sportleiter' ? 'Ergebniserfassung (Sportleiter)' : 
                   'Ergebniserfassung (Mannschaftsführer)';

  if (isLoadingMasterData) {
    return <div className="flex justify-center items-center py-12"><Loader className="h-12 w-12 animate-spin text-primary mr-3" /><p>Lade Grunddaten...</p></div>;
  }

  if (availableRunningSeasons.length === 0 && !isLoadingMasterData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-primary">Ergebniserfassung</h1>
          <Link href={dashboardHref}>
            <Button variant="outline" size="sm">
              Zurück zum Dashboard
            </Button>
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
          <h1 className="text-xl md:text-2xl font-semibold text-primary">{pageTitle}</h1>
          <HelpTooltip 
            text="Hier können Sie Ergebnisse für Mannschaften erfassen und speichern." 
            side="right" 
            className="ml-2"
          />
        </div>
        <Link href={dashboardHref}>
          <Button variant="outline" size="sm">
            Zurück zum Dashboard
          </Button>
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
              <div className="text-center text-muted-foreground">
                <p>🚧 OCR-Funktion wird übertragen...</p>
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
              <CardDescription>{editMode ? 'Bearbeitungsmodus: Alle Teams und Schützen werden angezeigt' : 'Für zweite Handzettel oder falls automatisches Auslesen nicht funktioniert'}</CardDescription>
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
          </div>
          
          <div className="text-center text-muted-foreground">
            <p>🚧 Weitere Funktionen werden übertragen...</p>
            <p className="text-sm mt-2">Berechtigung: {userRole} | Zugriff auf {allowedClubIds.length} Verein(e)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}