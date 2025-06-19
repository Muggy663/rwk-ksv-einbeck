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

  const handlePromotionRelegation = async () => {
    if (!user || user.email !== 'admin@rwk-einbeck.de') {
      toast({
        title: 'Nicht autorisiert',
        description: 'Sie müssen als Administrator angemeldet sein, um diese Funktion zu nutzen.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!selectedLeague) {
      toast({
        title: 'Keine Liga ausgewählt',
        description: 'Bitte wählen Sie eine Liga aus.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Hier würde die Logik für den Auf-/Abstieg implementiert werden
      toast({
        title: 'Funktion in Entwicklung',
        description: 'Diese Funktion wird in einem kommenden Update verfügbar sein.',
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Error processing promotion/relegation:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Bei der Verarbeitung des Auf-/Abstiegs ist ein Fehler aufgetreten.',
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

              <Button
                onClick={handlePromotionRelegation}
                disabled={!selectedSourceSeason || !selectedLeague || isProcessing || !user}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Auf-/Abstieg wird verarbeitet...
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Auf-/Abstieg verarbeiten
                  </>
                )}
              </Button>
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