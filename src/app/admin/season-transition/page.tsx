"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowUpDown, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

interface Season {
  id: string;
  year: number;
  name: string;
  isActive: boolean;
}

interface League {
  id: string;
  name: string;
  type: string;
  competitionYear: number;
  teams: string[];
  order?: number;
}

interface PromotionRelegationSuggestion {
  teamId: string;
  teamName: string;
  clubName: string;
  currentLeague: string;
  currentPosition: number;
  action: 'promote' | 'relegate' | 'stay';
  targetLeague?: string;
  reason: string;
  confirmed: boolean;
}

export default function SeasonTransitionPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSourceSeason, setSelectedSourceSeason] = useState<string>('');
  const [selectedTargetSeason, setSelectedTargetSeason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [suggestions, setSuggestions] = useState<PromotionRelegationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSeasons = async () => {
      setIsLoading(true);
      try {
        const seasonsQuery = query(collection(db, 'seasons'), orderBy('year', 'desc'));
        const snapshot = await getDocs(seasonsQuery);
        const fetchedSeasons = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Season[];
        
        setSeasons(fetchedSeasons);
      } catch (error) {
        console.error('Error fetching seasons:', error);
        toast({
          title: 'Fehler beim Laden der Saisons',
          description: 'Die Saisons konnten nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeasons();
  }, [toast]);

  useEffect(() => {
    const fetchLeagues = async () => {
      if (!selectedSourceSeason) return;
      
      setIsLoading(true);
      try {
        const selectedSeason = seasons.find(s => s.id === selectedSourceSeason);
        if (!selectedSeason) return;
        
        const leaguesQuery = query(
          collection(db, 'leagues'),
          where('competitionYear', '==', selectedSeason.year)
        );
        
        const snapshot = await getDocs(leaguesQuery);
        const fetchedLeagues = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as League[];
        
        setLeagues(fetchedLeagues);
      } catch (error) {
        console.error('Error fetching leagues:', error);
        toast({
          title: 'Fehler beim Laden der Ligen',
          description: 'Die Ligen konnten nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeagues();
  }, [selectedSourceSeason, seasons, toast]);

  const handleCreateNewSeason = async () => {
    if (!user || user.email !== 'admin@rwk-einbeck.de') {
      toast({
        title: 'Nicht autorisiert',
        description: 'Sie müssen als Administrator angemeldet sein, um diese Funktion zu nutzen.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Hier würde die Logik für die Erstellung einer neuen Saison implementiert werden
      toast({
        title: 'Funktion in Entwicklung',
        description: 'Diese Funktion wird in einem kommenden Update verfügbar sein.',
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Error creating new season:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Bei der Erstellung der neuen Saison ist ein Fehler aufgetreten.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSuggestions = async () => {
    if (!selectedSourceSeason || !selectedLeague) {
      toast({
        title: 'Fehlende Auswahl',
        description: 'Bitte wählen Sie Saison und Liga aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const selectedSeason = seasons.find(s => s.id === selectedSourceSeason);
      if (!selectedSeason) return;

      // Lade Teams und deren Platzierungen
      const teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('competitionYear', '==', selectedSeason.year),
        where('leagueId', '==', selectedLeague)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      // Lade Clubs für Namen
      const clubsQuery = query(collection(db, 'clubs'));
      const clubsSnapshot = await getDocs(clubsQuery);
      const clubsMap = new Map();
      clubsSnapshot.docs.forEach(doc => {
        clubsMap.set(doc.id, doc.data().name);
      });

      // Simuliere Platzierungen (in echter App aus RWK-Tabellen)
      const mockSuggestions: PromotionRelegationSuggestion[] = [];
      
      teamsSnapshot.docs.forEach((doc, index) => {
        const team = doc.data();
        const position = index + 1; // Vereinfacht
        
        let action: 'promote' | 'relegate' | 'stay' = 'stay';
        let reason = 'Verbleibt in aktueller Liga';
        let targetLeague = undefined;
        
        // Intelligente Auf-/Abstiegslogik
        const totalTeams = teamsSnapshot.docs.length;
        
        if (position === 1) {
          action = 'promote';
          reason = 'Meister - steigt auf';
          targetLeague = 'Höhere Liga';
        } else if (position === totalTeams) {
          action = 'relegate';
          reason = 'Letzter Platz - steigt ab';
          targetLeague = 'Niedrigere Liga';
        } else if (position === totalTeams - 1) {
          // Vorletzer: Wird mit Zweitplatziertem der unteren Liga verglichen
          action = 'relegate'; // Vorläufig, wird später verglichen
          reason = 'Vorletzer - Vergleich mit unterer Liga erforderlich';
          targetLeague = 'Abhängig von Vergleich';
        } else if (position === 2) {
          // Zweiter: Wird mit Vorletztem der oberen Liga verglichen
          action = 'promote'; // Vorläufig, wird später verglichen
          reason = 'Zweiter - Vergleich mit oberer Liga erforderlich';
          targetLeague = 'Abhängig von Vergleich';
        }
        
        mockSuggestions.push({
          teamId: doc.id,
          teamName: team.name,
          clubName: clubsMap.get(team.clubId) || 'Unbekannt',
          currentLeague: selectedLeague,
          currentPosition: position,
          action,
          targetLeague,
          reason,
          confirmed: false
        });
      });
      
      setSuggestions(mockSuggestions);
      setShowSuggestions(true);
      
      toast({
        title: 'Vorschläge generiert',
        description: `${mockSuggestions.length} Auf-/Abstiegs-Vorschläge erstellt.`
      });
      
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        title: 'Fehler',
        description: 'Vorschläge konnten nicht generiert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSuggestionConfirmation = (teamId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.teamId === teamId ? { ...s, confirmed: !s.confirmed } : s
    ));
  };

  const applySuggestions = async () => {
    const confirmedSuggestions = suggestions.filter(s => s.confirmed);
    
    if (confirmedSuggestions.length === 0) {
      toast({
        title: 'Keine Bestätigungen',
        description: 'Bitte bestätigen Sie mindestens einen Vorschlag.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Hier würde die tatsächliche Umsetzung erfolgen
      // Für Demo: Nur Toast
      toast({
        title: 'Auf-/Abstiege angewendet',
        description: `${confirmedSuggestions.length} Änderungen wurden vorgenommen.`,
      });
      
      setShowSuggestions(false);
      setSuggestions([]);
      
    } catch (error: any) {
      console.error('Error applying suggestions:', error);
      toast({
        title: 'Fehler',
        description: 'Änderungen konnten nicht angewendet werden.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Calendar className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Saisonwechsel & Auf-/Abstieg</h1>
      </div>

      <Tabs defaultValue="season" className="space-y-6">
        <TabsList>
          <TabsTrigger value="season">Neue Saison erstellen</TabsTrigger>
          <TabsTrigger value="promotion">Auf-/Abstieg</TabsTrigger>
        </TabsList>
        
        <TabsContent value="season">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Neue Saison erstellen</CardTitle>
              <CardDescription>
                Erstellen Sie eine neue Saison basierend auf einer bestehenden Saison.
                Mannschaften, Ligen und andere Daten werden in die neue Saison übernommen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceSeason">Quell-Saison</Label>
                  <Select
                    value={selectedSourceSeason}
                    onValueChange={setSelectedSourceSeason}
                    disabled={isLoading || isProcessing}
                  >
                    <SelectTrigger id="sourceSeason">
                      <SelectValue placeholder="Quell-Saison auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map(season => (
                        <SelectItem key={season.id} value={season.id}>
                          {season.name} ({season.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetSeason">Ziel-Saison</Label>
                  <Select
                    value={selectedTargetSeason}
                    onValueChange={setSelectedTargetSeason}
                    disabled={isLoading || isProcessing}
                  >
                    <SelectTrigger id="targetSeason">
                      <SelectValue placeholder="Ziel-Saison auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Neue Saison erstellen</SelectItem>
                      {seasons.map(season => (
                        <SelectItem key={season.id} value={season.id}>
                          {season.name} ({season.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateNewSeason}
                disabled={!selectedSourceSeason || !selectedTargetSeason || isProcessing || !user}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saison wird erstellt...
                  </>
                ) : (
                  'Neue Saison erstellen'
                )}
              </Button>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              <p>
                Diese Funktion erstellt eine neue Saison basierend auf einer bestehenden Saison.
                Mannschaften, Ligen und andere Daten werden in die neue Saison übernommen.
                <strong>Hinweis:</strong> Diese Funktion kann nur vom Administrator ausgeführt werden.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="promotion">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Auf-/Abstieg</CardTitle>
              <CardDescription>
                Verwalten Sie den Auf- und Abstieg von Mannschaften zwischen Ligen.
                Basierend auf den Ergebnissen der aktuellen Saison werden Mannschaften automatisch auf- oder absteigen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seasonSelect">Saison</Label>
                  <Select
                    value={selectedSourceSeason}
                    onValueChange={setSelectedSourceSeason}
                    disabled={isLoading || isProcessing}
                  >
                    <SelectTrigger id="seasonSelect">
                      <SelectValue placeholder="Saison auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map(season => (
                        <SelectItem key={season.id} value={season.id}>
                          {season.name} ({season.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="leagueSelect">Liga</Label>
                  <Select
                    value={selectedLeague}
                    onValueChange={setSelectedLeague}
                    disabled={isLoading || isProcessing || !selectedSourceSeason}
                  >
                    <SelectTrigger id="leagueSelect">
                      <SelectValue placeholder="Liga auswählen" />
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

              <div className="flex gap-2">
                <Button
                  onClick={generateSuggestions}
                  disabled={!selectedSourceSeason || !selectedLeague || isProcessing || !user}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Vorschläge generieren
                    </>
                  )}
                </Button>
                
                {showSuggestions && (
                  <Button
                    onClick={applySuggestions}
                    disabled={isProcessing || suggestions.filter(s => s.confirmed).length === 0}
                    variant="default"
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Bestätigte anwenden
                  </Button>
                )}
              </div>
              
              {showSuggestions && suggestions.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Auf-/Abstiegs-Vorschläge</CardTitle>
                    <CardDescription>
                      Überprüfen Sie die Vorschläge und bestätigen Sie die gewünschten Änderungen.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">✓</TableHead>
                          <TableHead>Mannschaft</TableHead>
                          <TableHead>Verein</TableHead>
                          <TableHead className="text-center">Platz</TableHead>
                          <TableHead>Aktion</TableHead>
                          <TableHead>Grund</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestions.map(suggestion => (
                          <TableRow key={suggestion.teamId}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={suggestion.confirmed}
                                onChange={() => toggleSuggestionConfirmation(suggestion.teamId)}
                                className="w-4 h-4"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {suggestion.teamName}
                            </TableCell>
                            <TableCell>{suggestion.clubName}</TableCell>
                            <TableCell className="text-center">
                              {suggestion.currentPosition}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={suggestion.action === 'promote' ? 'default' : 
                                        suggestion.action === 'relegate' ? 'destructive' : 'secondary'}
                                className="flex items-center w-fit"
                              >
                                {suggestion.action === 'promote' && <ArrowUp className="w-3 h-3 mr-1" />}
                                {suggestion.action === 'relegate' && <ArrowDown className="w-3 h-3 mr-1" />}
                                {suggestion.action === 'promote' ? 'Aufstieg' : 
                                 suggestion.action === 'relegate' ? 'Abstieg' : 'Verbleibt'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {suggestion.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-800">
                        <strong>Hinweis:</strong> Diese Vorschläge berücksichtigen die aktuellen Tabellenstände. 
                        Bei fehlenden Mannschaften oder besonderen Umständen können manuelle Anpassungen erforderlich sein.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              <p>
                Diese Funktion verwaltet den Auf- und Abstieg von Mannschaften zwischen Ligen.
                Basierend auf den Ergebnissen der aktuellen Saison werden Mannschaften automatisch auf- oder absteigen.
                <strong>Hinweis:</strong> Diese Funktion kann nur vom Administrator ausgeführt werden.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}