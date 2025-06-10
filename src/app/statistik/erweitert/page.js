"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SeasonComparisonChart } from '@/components/statistics/advanced/SeasonComparisonChart';
import { TrendAnalysisCard } from '@/components/statistics/advanced/TrendAnalysisCard';
import { 
  fetchSeasons, 
  fetchLeagues, 
  fetchClubs 
} from '@/lib/services/statistics-service';
import { 
  fetchTopShootersWithTrend 
} from '@/lib/services/enhanced-statistics-service';

export default function ErweitertePage() {
  // Filter-States
  const [seasons, setSeasons] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [clubs, setClubs] = useState([]);
  
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedClub, setSelectedClub] = useState('all');
  
  // Daten-States
  const [shooters, setShooters] = useState([]);
  const [topShooters, setTopShooters] = useState([]);
  
  // Loading-States
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingShooters, setIsLoadingShooters] = useState(false);
  const [error, setError] = useState(null);
  
  // Lade Saisons beim ersten Rendern
  useEffect(() => {
    const loadFilters = async () => {
      setIsLoadingFilters(true);
      try {
        // Lade Saisons
        const seasonsData = await fetchSeasons();
        setSeasons(seasonsData);
        
        if (seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0].id);
        }
        
        // Lade Vereine
        const clubsData = await fetchClubs();
        setClubs(clubsData);
      } catch (err) {
        console.error('Fehler beim Laden der Filter:', err);
        setError('Fehler beim Laden der Filter');
      } finally {
        setIsLoadingFilters(false);
      }
    };
    
    loadFilters();
  }, []);
  
  // Lade Ligen, wenn sich die Saison ändert
  useEffect(() => {
    const loadLeagues = async () => {
      if (!selectedSeason) return;
      
      try {
        const leaguesData = await fetchLeagues(selectedSeason);
        setLeagues(leaguesData);
        setSelectedLeague('all');
      } catch (err) {
        console.error('Fehler beim Laden der Ligen:', err);
      }
    };
    
    loadLeagues();
  }, [selectedSeason]);
  
  // Lade Schützen, wenn sich die Filter ändern
  useEffect(() => {
    const loadShooters = async () => {
      if (!selectedSeason) return;
      
      setIsLoadingShooters(true);
      setError(null);
      
      try {
        // Lade Top-Schützen mit Trendanalyse
        const topShootersData = await fetchTopShootersWithTrend(
          selectedSeason,
          selectedLeague !== 'all' ? selectedLeague : undefined,
          selectedClub !== 'all' ? selectedClub : undefined,
          20 // Maximal 20 Schützen
        );
        
        setTopShooters(topShootersData);
        
        // Bereite Schützen für den Saisonvergleich vor
        const shootersForComparison = topShootersData.map(shooter => ({
          id: shooter.shooterId,
          name: shooter.shooterName,
          teamName: shooter.teamName
        }));
        
        setShooters(shootersForComparison);
      } catch (err) {
        console.error('Fehler beim Laden der Schützen:', err);
        setError('Fehler beim Laden der Schützen');
      } finally {
        setIsLoadingShooters(false);
      }
    };
    
    loadShooters();
  }, [selectedSeason, selectedLeague, selectedClub]);
  
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Erweiterte Statistiken</h1>
        <Button variant="outline" onClick={() => window.location.href = '/statistik'}>
          Zurück zur Übersicht
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="season-select">Saison</Label>
          <Select
            value={selectedSeason}
            onValueChange={setSelectedSeason}
            disabled={isLoadingFilters || seasons.length === 0}
          >
            <SelectTrigger id="season-select">
              <SelectValue placeholder="Saison auswählen" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map(season => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="league-select">Liga</Label>
          <Select
            value={selectedLeague}
            onValueChange={setSelectedLeague}
            disabled={isLoadingFilters || leagues.length === 0}
          >
            <SelectTrigger id="league-select">
              <SelectValue placeholder="Alle Ligen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Ligen</SelectItem>
              {leagues.map(league => (
                <SelectItem key={league.id} value={league.id}>
                  {league.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="club-select">Verein</Label>
          <Select
            value={selectedClub}
            onValueChange={setSelectedClub}
            disabled={isLoadingFilters || clubs.length === 0}
          >
            <SelectTrigger id="club-select">
              <SelectValue placeholder="Alle Vereine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Vereine</SelectItem>
              {clubs.map(club => (
                <SelectItem key={club.id} value={club.id}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="season-comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="season-comparison">Saisonvergleich</TabsTrigger>
          <TabsTrigger value="trend-analysis">Trendanalyse</TabsTrigger>
        </TabsList>
        
        <TabsContent value="season-comparison">
          {isLoadingShooters ? (
            <Skeleton className="h-[500px] w-full" />
          ) : (
            <SeasonComparisonChart shooters={shooters} numberOfSeasons={3} />
          )}
        </TabsContent>
        
        <TabsContent value="trend-analysis">
          {isLoadingShooters ? (
            <Skeleton className="h-[500px] w-full" />
          ) : (
            <TrendAnalysisCard shooters={topShooters} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}