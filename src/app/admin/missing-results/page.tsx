"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { findMissingResults, isLeagueRoundComplete } from '@/lib/services/result-validation';

export default function MissingResultsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [missingResults, setMissingResults] = useState<any[]>([]);
  const [numRounds, setNumRounds] = useState<number>(5);

  // Lade Saisons
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const seasonsQuery = query(
          collection(db, 'seasons'),
          where('status', '==', 'Laufend'),
          orderBy('competitionYear', 'desc')
        );
        const snapshot = await getDocs(seasonsQuery);
        const seasonsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSeasons(seasonsData);
      } catch (error) {
        console.error('Fehler beim Laden der Saisons:', error);
        toast({
          title: 'Fehler',
          description: 'Saisons konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };

    loadSeasons();
  }, [toast]);

  // Lade Ligen für ausgewählte Saison
  useEffect(() => {
    if (!selectedSeason) {
      setLeagues([]);
      return;
    }

    const loadLeagues = async () => {
      try {
        const leaguesQuery = query(
          collection(db, 'rwk_leagues'),
          where('seasonId', '==', selectedSeason),
          orderBy('order', 'asc')
        );
        const snapshot = await getDocs(leaguesQuery);
        const leaguesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLeagues(leaguesData);
      } catch (error) {
        console.error('Fehler beim Laden der Ligen:', error);
        toast({
          title: 'Fehler',
          description: 'Ligen konnten nicht geladen werden.',
          variant: 'destructive'
        });
      }
    };

    loadLeagues();
  }, [selectedSeason, toast]);

  // Lade Teams und Scores für ausgewählte Liga
  const loadTeamsAndScores = async () => {
    if (!selectedLeague) {
      setTeams([]);
      setScores([]);
      setMissingResults([]);
      return;
    }

    setLoading(true);
    try {
      // Lade Teams
      const teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('leagueId', '==', selectedLeague)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teamsData = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeams(teamsData);

      // Lade Scores
      const scoresQuery = query(
        collection(db, 'rwk_scores'),
        where('leagueId', '==', selectedLeague)
      );
      const scoresSnapshot = await getDocs(scoresQuery);
      const scoresData = scoresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setScores(scoresData);

      // Bestimme Anzahl der Durchgänge basierend auf der Liga-Disziplin
      const selectedLeagueData = leagues.find(league => league.id === selectedLeague);
      if (selectedLeagueData) {
        const leagueType = selectedLeagueData.type;
        const fourRoundDisciplines = ['LG', 'LGA', 'LP', 'LPA'];
        setNumRounds(fourRoundDisciplines.includes(leagueType) ? 4 : 5);
      }

      // Analysiere fehlende Ergebnisse
      analyzeResults(teamsData, scoresData);
    } catch (error) {
      console.error('Fehler beim Laden der Teams und Scores:', error);
      toast({
        title: 'Fehler',
        description: 'Teams und Ergebnisse konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Analysiere Ergebnisse und finde fehlende
  const analyzeResults = (teamsData: any[], scoresData: any[]) => {
    const missing: any[] = [];
    
    // Für jeden Durchgang prüfen
    for (let round = 1; round <= numRounds; round++) {
      // Prüfe, ob der Durchgang als vollständig markiert ist
      const isComplete = isLeagueRoundComplete(teamsData, round, scoresData);
      
      // Finde fehlende Ergebnisse für diesen Durchgang
      const missingForRound = findMissingResults(teamsData, round, scoresData);
      
      if (missingForRound.length > 0) {
        missing.push({
          round,
          isMarkedComplete: isComplete,
          missingResults: missingForRound
        });
      }
    }
    
    setMissingResults(missing);
  };

  // Effekt zum Laden der Teams und Scores, wenn sich die ausgewählte Liga ändert
  useEffect(() => {
    if (selectedLeague) {
      loadTeamsAndScores();
    }
  }, [selectedLeague]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Fehlende Ergebnisse prüfen</h1>
          <p className="text-muted-foreground">Identifiziert fehlende Ergebnisse in abgeschlossenen Durchgängen</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Zurück zum Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auswahl</CardTitle>
          <CardDescription>Wählen Sie eine Saison und Liga aus, um fehlende Ergebnisse zu prüfen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Saison</label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger>
                  <SelectValue placeholder="Saison auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map(season => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.competitionYear} - {season.name} ({season.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Liga</label>
              <Select 
                value={selectedLeague} 
                onValueChange={setSelectedLeague}
                disabled={!selectedSeason || leagues.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!selectedSeason ? "Erst Saison auswählen" : "Liga auswählen"} />
                </SelectTrigger>
                <SelectContent>
                  {leagues.map(league => (
                    <SelectItem key={league.id} value={league.id}>
                      {league.name} ({league.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4">
            <Button 
              onClick={loadTeamsAndScores} 
              disabled={!selectedLeague || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ergebnisse prüfen
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Lade und analysiere Ergebnisse...</p>
        </div>
      ) : (
        <>
          {selectedLeague && missingResults.length === 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Alle Ergebnisse vollständig
                </CardTitle>
              </CardHeader>
              <CardContent className="text-green-700">
                <p>Es wurden keine fehlenden Ergebnisse in den Durchgängen gefunden.</p>
              </CardContent>
            </Card>
          )}

          {missingResults.map((item, index) => (
            <Card key={index} className={item.isMarkedComplete ? "border-red-300 bg-red-50" : ""}>
              <CardHeader>
                <CardTitle className={`flex items-center ${item.isMarkedComplete ? "text-red-800" : ""}`}>
                  {item.isMarkedComplete && <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />}
                  Durchgang {item.round}
                  {item.isMarkedComplete && " (Als abgeschlossen markiert trotz fehlender Ergebnisse!)"}
                </CardTitle>
                <CardDescription className={item.isMarkedComplete ? "text-red-700" : ""}>
                  {item.missingResults.length} fehlende Ergebnisse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Schütze</TableHead>
                      <TableHead className="text-right">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.missingResults.map((missing: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{missing.teamName}</TableCell>
                        <TableCell>{missing.shooterName}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <Link href={`/admin/results?teamId=${missing.teamId}&round=${item.round}`}>
                              Ergebnis eintragen
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}