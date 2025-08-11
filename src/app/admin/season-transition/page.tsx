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
import { CheckCircle, AlertCircle, ArrowUp, ArrowDown, Download } from 'lucide-react';
import Link from 'next/link';
import { calculateLeagueStandings, generatePromotionRelegationSuggestions, createNewSeason, applyPromotionRelegation } from '@/lib/services/season-transition-service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Season {
  id: string;
  competitionYear: number;
  name: string;
  status: string;
  type: string;
}

interface League {
  id: string;
  name: string;
  type: string;
  competitionYear: number;
  seasonId: string;
  order?: number;
}

interface PromotionRelegationSuggestion {
  teamId: string;
  teamName: string;
  clubName: string;
  currentLeague: string;
  currentPosition: number;
  action: 'promote' | 'relegate' | 'stay' | 'compare';
  targetLeague?: string;
  reason: string;
  confirmed: boolean;
  compareWith?: {
    teamId: string;
    teamName: string;
    league: string;
    position: number;
    score: number;
  };
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
  const [withdrawnTeams, setWithdrawnTeams] = useState<string[]>([]);
  const [availableTeams, setAvailableTeams] = useState<{id: string, name: string, clubName: string}[]>([]);
  const [allLeagueSuggestions, setAllLeagueSuggestions] = useState<Map<string, PromotionRelegationSuggestion[]>>(new Map());
  const [showAllLeagues, setShowAllLeagues] = useState(false);
  const [teamStandings, setTeamStandings] = useState<Map<string, any>>(new Map());
  const [notRegisteredTeams, setNotRegisteredTeams] = useState<string[]>([]);

  useEffect(() => {
    const fetchSeasons = async () => {
      setIsLoading(true);
      try {
        const seasonsQuery = query(collection(db, 'seasons'), orderBy('competitionYear', 'desc'));
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
          collection(db, 'rwk_leagues'),
          where('seasonId', '==', selectedSourceSeason),
          orderBy('order', 'asc')
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
    
    if (!selectedSourceSeason || selectedTargetSeason !== 'new') {
      toast({
        title: 'Fehlende Auswahl',
        description: 'Bitte wählen Sie eine Quell-Saison und "Neue Saison erstellen" aus.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      const sourceSeason = seasons.find(s => s.id === selectedSourceSeason);
      if (!sourceSeason) throw new Error('Quell-Saison nicht gefunden');
      
      const targetYear = sourceSeason.competitionYear + 1;
      const newSeasonId = await createNewSeason(selectedSourceSeason, targetYear, sourceSeason.type as 'KK' | 'LD');
      
      toast({
        title: 'Neue Saison erstellt',
        description: `Saison ${targetYear} wurde erfolgreich basierend auf ${sourceSeason.name} erstellt.`,
      });
      
      // Saisons neu laden
      const seasonsQuery = query(collection(db, 'seasons'), orderBy('competitionYear', 'desc'));
      const snapshot = await getDocs(seasonsQuery);
      const fetchedSeasons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Season[];
      setSeasons(fetchedSeasons);
      
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

      // Teams der Liga laden für Abmeldungs-Auswahl
      const teamsQuery = query(
        collection(db, 'rwk_teams'),
        where('leagueId', '==', selectedLeague),
        where('competitionYear', '==', selectedSeason.competitionYear)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      const clubsQuery = query(collection(db, 'clubs'));
      const clubsSnapshot = await getDocs(clubsQuery);
      const clubsMap = new Map();
      clubsSnapshot.docs.forEach(doc => {
        clubsMap.set(doc.id, doc.data().name);
      });
      
      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        clubName: clubsMap.get(doc.data().clubId) || 'Unbekannt'
      }));
      setAvailableTeams(teams);
      
      // Echte Auf-/Abstiegsvorschläge basierend auf RWK-Ordnung §16
      const generatedSuggestions = await generatePromotionRelegationSuggestions(
        selectedLeague,
        selectedSeason.competitionYear,
        leagues,
        withdrawnTeams
      );
      
      // Team-Ergebnisse laden
      const standings = await calculateLeagueStandings(selectedLeague, selectedSeason.competitionYear);
      const standingsMap = new Map();
      standings.forEach(standing => {
        standingsMap.set(standing.teamId, standing);
      });
      setTeamStandings(standingsMap);
      
      setSuggestions(generatedSuggestions);
      setShowSuggestions(true);
      
      toast({
        title: 'Vorschläge generiert',
        description: `${generatedSuggestions.length} Auf-/Abstiegs-Vorschläge basierend auf aktuellen Tabellen erstellt.`
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

  const hasConfirmedSuggestions = () => {
    return Array.from(allLeagueSuggestions.values())
      .some(suggestions => suggestions.some(s => s.confirmed));
  };
  
  const applyAllLeagueSuggestions = async () => {
    const allConfirmed = Array.from(allLeagueSuggestions.values())
      .flat()
      .filter(s => s.confirmed);
    
    if (allConfirmed.length === 0) {
      toast({
        title: 'Keine Bestätigungen',
        description: 'Bitte bestätigen Sie mindestens einen Vorschlag.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedTargetSeason) {
      toast({
        title: 'Keine Ziel-Saison',
        description: 'Bitte wählen Sie eine Ziel-Saison für die Änderungen aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      await applyPromotionRelegation(allConfirmed, selectedTargetSeason);
      
      toast({
        title: 'Auf-/Abstiege angewendet',
        description: `${allConfirmed.length} Änderungen wurden erfolgreich vorgenommen.`,
      });
      
      setShowAllLeagues(false);
      setAllLeagueSuggestions(new Map());
      
    } catch (error: any) {
      console.error('Error applying all league suggestions:', error);
      toast({
        title: 'Fehler',
        description: 'Änderungen konnten nicht angewendet werden.',
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

  const generateAllLeagueSuggestions = async () => {
    if (!selectedSourceSeason) {
      toast({
        title: 'Fehlende Auswahl',
        description: 'Bitte wählen Sie eine Saison aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const selectedSeason = seasons.find(s => s.id === selectedSourceSeason);
      if (!selectedSeason) return;

      const allSuggestions = new Map<string, PromotionRelegationSuggestion[]>();
      
      // Sortiere Ligen nach Hierarchie für bessere Darstellung
      const sortedLeagues = [...leagues].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const allStandings = new Map();
      
      for (const league of sortedLeagues) {
        try {
          const leagueSuggestions = await generatePromotionRelegationSuggestions(
            league.id,
            selectedSeason.competitionYear,
            leagues,
            withdrawnTeams
          );
          
          if (leagueSuggestions.length > 0) {
            allSuggestions.set(league.id, leagueSuggestions);
            
            // Team-Ergebnisse für diese Liga laden
            const standings = await calculateLeagueStandings(league.id, selectedSeason.competitionYear);
            standings.forEach(standing => {
              allStandings.set(standing.teamId, standing);
            });
          }
        } catch (error) {
          console.error(`Error generating suggestions for league ${league.name}:`, error);
        }
      }
      
      setTeamStandings(allStandings);
      
      setAllLeagueSuggestions(allSuggestions);
      setShowAllLeagues(true);
      setShowSuggestions(false); // Einzelansicht ausblenden
      
      const totalSuggestions = Array.from(allSuggestions.values()).reduce((sum, suggestions) => sum + suggestions.length, 0);
      
      toast({
        title: 'Alle Ligen analysiert',
        description: `${allSuggestions.size} Ligen mit insgesamt ${totalSuggestions} Auf-/Abstiegs-Vorschlägen erstellt.`
      });
      
    } catch (error: any) {
      console.error('Error generating all league suggestions:', error);
      toast({
        title: 'Fehler',
        description: 'Vorschläge für alle Ligen konnten nicht generiert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToPDF = () => {
    if (allLeagueSuggestions.size === 0) {
      toast({
        title: 'Keine Daten',
        description: 'Bitte analysieren Sie zuerst alle Ligen.',
        variant: 'destructive'
      });
      return;
    }

    const doc = new jsPDF('landscape');
    const selectedSeason = seasons.find(s => s.id === selectedSourceSeason);
    
    // Logo hinzufügen
    try {
      doc.addImage('/images/logo2.png', 'PNG', 240, 10, 30, 30);
    } catch (error) {
      console.log('Logo konnte nicht geladen werden:', error);
    }
    
    // Header
    doc.setFontSize(16);
    doc.text('Auf-/Abstiegsanalyse RWK Einbeck', 20, 20);
    doc.setFontSize(12);
    doc.text(`Saison: ${selectedSeason?.name || 'Unbekannt'}`, 20, 30);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, 40);
    
    let yPosition = 50;
    
    // Für jede Liga eine Tabelle
    Array.from(allLeagueSuggestions.entries())
      .sort(([aId], [bId]) => {
        const aLeague = leagues.find(l => l.id === aId);
        const bLeague = leagues.find(l => l.id === bId);
        return (aLeague?.order || 0) - (bLeague?.order || 0);
      })
      .forEach(([leagueId, leagueSuggestions]) => {
        const league = leagues.find(l => l.id === leagueId);
        if (!league) return;
        
        // Liga-Überschrift
        doc.setFontSize(14);
        doc.text(`${league.name} (${league.type})`, 20, yPosition);
        yPosition += 10;
        
        // Tabellendaten vorbereiten
        const tableData = leagueSuggestions.map(suggestion => {
          const teamStanding = teamStandings.get(suggestion.teamId);
          const actionText = suggestion.action === 'promote' ? 'Aufstieg' : 
                           suggestion.action === 'relegate' ? 'Abstieg' : 'Verbleibt';
          
          return [
            suggestion.currentPosition.toString(),
            suggestion.teamName,
            teamStanding ? `${teamStanding.totalScore}` : '-',
            actionText,
            suggestion.reason
          ];
        });
        
        // Tabelle erstellen
        (doc as any).autoTable({
          startY: yPosition,
          head: [['Platz', 'Mannschaft', 'Ringe', 'Aktion', 'Begründung']],
          body: tableData,

          headStyles: { fillColor: [41, 128, 185] },
          columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { cellWidth: 60 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 30 },
            4: { cellWidth: 140 }
          },
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
            cellWidth: 'wrap'
          },
          didParseCell: function(data: any) {
            if (data.column.index === 3 && data.cell.text[0] === 'Aufstieg') {
              data.cell.styles.textColor = [0, 128, 0];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.column.index === 3 && data.cell.text[0] === 'Abstieg') {
              data.cell.styles.textColor = [255, 0, 0];
              data.cell.styles.fontStyle = 'bold';
            }
          },
          margin: { left: 20, right: 20 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
        
        // Neue Seite wenn nötig
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      });
    
    // PDF speichern
    const fileName = `RWK_Auf_Abstieg_${selectedSeason?.competitionYear || 'Unbekannt'}.pdf`;
    doc.save(fileName);
    
    toast({
      title: 'PDF erstellt',
      description: `Auf-/Abstiegsanalyse wurde als ${fileName} gespeichert.`
    });
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

    if (!selectedTargetSeason) {
      toast({
        title: 'Keine Ziel-Saison',
        description: 'Bitte wählen Sie eine Ziel-Saison für die Änderungen aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      await applyPromotionRelegation(suggestions, selectedTargetSeason);
      
      toast({
        title: 'Auf-/Abstiege angewendet',
        description: `${confirmedSuggestions.length} Änderungen wurden erfolgreich vorgenommen.`,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Saisonwechsel & Auf-/Abstieg</h1>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            Zurück zum Dashboard
          </Button>
        </Link>
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
                          {season.name} ({season.competitionYear})
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
                          {season.name} ({season.competitionYear})
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
                          {season.name} ({season.competitionYear})
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

              {/* Abmeldungen verwalten */}
              {availableTeams.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Nach Meldeschluss abgemeldet</CardTitle>
                      <CardDescription>
                        Teams, die nach Meldeschluss abgemeldet werden, steigen automatisch ab.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {availableTeams.map(team => (
                          <div key={team.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`withdraw-${team.id}`}
                              checked={withdrawnTeams.includes(team.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setWithdrawnTeams(prev => [...prev, team.id]);
                                } else {
                                  setWithdrawnTeams(prev => prev.filter(id => id !== team.id));
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <label htmlFor={`withdraw-${team.id}`} className="text-sm">
                              {team.name} ({team.clubName})
                            </label>
                          </div>
                        ))}
                      </div>
                      {withdrawnTeams.length > 0 && (
                        <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                          <p className="text-sm text-red-800">
                            <strong>{withdrawnTeams.length} Team(s) abgemeldet:</strong> Steigen automatisch ab.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Nicht mehr gemeldet</CardTitle>
                      <CardDescription>
                        Teams, die sich für die neue Saison nicht mehr melden.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {availableTeams.map(team => (
                          <div key={`not-registered-${team.id}`} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`not-registered-${team.id}`}
                              className="w-4 h-4"
                            />
                            <label htmlFor={`not-registered-${team.id}`} className="text-sm">
                              {team.name} ({team.clubName})
                            </label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
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
                      Einzelne Liga
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={generateAllLeagueSuggestions}
                  disabled={!selectedSourceSeason || isProcessing || !user || leagues.length === 0}
                  className="flex-1"
                  variant="outline"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analysiere alle...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Alle Ligen analysieren
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
                          <TableHead className="text-center">Ergebnis</TableHead>
                          <TableHead>Aktion</TableHead>
                          <TableHead>Grund</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestions.map(suggestion => {
                          const teamStanding = teamStandings.get(suggestion.teamId);
                          
                          return (
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
                              <TableCell className="text-center font-mono">
                                {teamStanding ? `${teamStanding.totalScore} Ringe` : 'Lädt...'}
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
                          );
                        })}
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
              
              {/* Alle Ligen Übersicht */}
              {showAllLeagues && allLeagueSuggestions.size > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Auf-/Abstiegs-Übersicht aller Ligen</CardTitle>
                    <CardDescription>
                      Vergleichen Sie die Vorschläge aller Ligen und bestätigen Sie die gewünschten Änderungen.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Array.from(allLeagueSuggestions.entries())
                      .sort(([aId], [bId]) => {
                        const aLeague = leagues.find(l => l.id === aId);
                        const bLeague = leagues.find(l => l.id === bId);
                        return (aLeague?.order || 0) - (bLeague?.order || 0);
                      })
                      .map(([leagueId, leagueSuggestions]) => {
                        const league = leagues.find(l => l.id === leagueId);
                        if (!league) return null;
                        
                        return (
                          <div key={leagueId} className="border rounded-lg p-4">
                            <h4 className="font-semibold text-lg mb-3 text-primary">
                              {league.name} ({league.type})
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">✓</TableHead>
                                  <TableHead>Mannschaft</TableHead>
                                  <TableHead>Verein</TableHead>
                                  <TableHead className="text-center">Platz</TableHead>
                                  <TableHead className="text-center">Ergebnis</TableHead>
                                  <TableHead>Aktion</TableHead>
                                  <TableHead>Grund</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {leagueSuggestions.map(suggestion => {
                                  const teamStanding = teamStandings.get(suggestion.teamId);
                                  
                                  return (
                                    <TableRow key={`${leagueId}-${suggestion.teamId}`}>
                                      <TableCell>
                                        <input
                                          type="checkbox"
                                          checked={suggestion.confirmed}
                                          onChange={() => {
                                            const updatedSuggestions = new Map(allLeagueSuggestions);
                                            const updated = updatedSuggestions.get(leagueId)?.map(s => 
                                              s.teamId === suggestion.teamId ? { ...s, confirmed: !s.confirmed } : s
                                            );
                                            if (updated) {
                                              updatedSuggestions.set(leagueId, updated);
                                              setAllLeagueSuggestions(updatedSuggestions);
                                            }
                                          }}
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
                                      <TableCell className="text-center font-mono">
                                        {teamStanding ? `${teamStanding.totalScore} Ringe` : 'Lädt...'}
                                      </TableCell>
                                      <TableCell>
                                        <Badge 
                                          variant={suggestion.action === 'promote' ? 'default' : 
                                                  suggestion.action === 'relegate' ? 'destructive' : 
                                                  suggestion.action === 'compare' ? 'secondary' : 'outline'}
                                          className="flex items-center w-fit"
                                        >
                                          {suggestion.action === 'promote' && <ArrowUp className="w-3 h-3 mr-1" />}
                                          {suggestion.action === 'relegate' && <ArrowDown className="w-3 h-3 mr-1" />}
                                          {suggestion.action === 'promote' ? 'Aufstieg' : 
                                           suggestion.action === 'relegate' ? 'Abstieg' : 
                                           suggestion.action === 'compare' ? 'Vergleich' : 'Verbleibt'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {suggestion.reason}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        );
                      })}
                    
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => {
                          // Alle bestätigen
                          const updatedSuggestions = new Map();
                          allLeagueSuggestions.forEach((suggestions, leagueId) => {
                            updatedSuggestions.set(leagueId, suggestions.map(s => ({ ...s, confirmed: true })));
                          });
                          setAllLeagueSuggestions(updatedSuggestions);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Alle bestätigen
                      </Button>
                      
                      <Button
                        onClick={() => {
                          // Alle abwählen
                          const updatedSuggestions = new Map();
                          allLeagueSuggestions.forEach((suggestions, leagueId) => {
                            updatedSuggestions.set(leagueId, suggestions.map(s => ({ ...s, confirmed: false })));
                          });
                          setAllLeagueSuggestions(updatedSuggestions);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Alle abwählen
                      </Button>
                      
                      <Button
                        onClick={() => exportToPDF()}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF Export
                      </Button>
                      
                      <Button
                        onClick={applyAllLeagueSuggestions}
                        disabled={isProcessing || !hasConfirmedSuggestions()}
                        className="ml-auto"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Bestätigte anwenden
                      </Button>
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
