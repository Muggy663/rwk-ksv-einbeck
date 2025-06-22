"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Download, ChevronLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  fetchSeasons, 
  fetchLeagues, 
  fetchClubs, 
  fetchShooterPerformanceData, 
  fetchTeamComparisonData, 
  fetchGenderDistributionData
} from '@/lib/services/statistics-service';
import { CrossSeasonStats } from '@/components/statistics/cross-season-stats';
import { LeagueTrendAnalysis } from '@/components/statistics/LeagueTrendAnalysis';
import { TrendAnalysis } from '@/components/statistics/TrendAnalysis';
import { useSwipe } from '@/hooks/use-swipe';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function StatistikDashboardPage() {
  // Filter-States
  const [seasons, setSeasons] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('performance');
  
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [selectedClub, setSelectedClub] = useState<string>('all');
  
  // Daten-States
  const [shooterData, setShooterData] = useState<any[]>([]);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  
  // Loading-States
  const [isLoadingShooterData, setIsLoadingShooterData] = useState<boolean>(false);
  const [isLoadingTeamData, setIsLoadingTeamData] = useState<boolean>(false);
  const [isLoadingGenderData, setIsLoadingGenderData] = useState<boolean>(false);
  
  // Lade Saisons beim ersten Rendern
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const seasonsData = await fetchSeasons();
        setSeasons(seasonsData);
        
        if (seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0].id);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Saisons:", error);
      }
    };
    
    loadSeasons();
  }, []);
  
  // Lade Ligen, wenn sich die Saison ändert
  useEffect(() => {
    const loadLeagues = async () => {
      if (!selectedSeason) return;
      
      try {
        const leaguesData = await fetchLeagues(selectedSeason);
        setLeagues(leaguesData);
        setSelectedLeague('all');
      } catch (error) {
        console.error("Fehler beim Laden der Ligen:", error);
      }
    };
    
    loadLeagues();
  }, [selectedSeason]);
  
  // Lade Vereine beim ersten Rendern
  useEffect(() => {
    const loadClubs = async () => {
      try {
        const clubsData = await fetchClubs();
        setClubs(clubsData);
      } catch (error) {
        console.error("Fehler beim Laden der Vereine:", error);
      }
    };
    
    loadClubs();
  }, []);
  
  // Lade Daten, wenn sich die Filter ändern
  useEffect(() => {
    if (!selectedSeason) return;
    
    const loadData = async () => {
      try {
        // Schützenleistungsdaten laden
        setIsLoadingShooterData(true);
        const shooterPerformanceData = await fetchShooterPerformanceData(
          selectedSeason,
          selectedLeague !== 'all' ? selectedLeague : undefined,
          selectedClub !== 'all' ? selectedClub : undefined
        );
        
        // Nur die Top 6 Schützen für das Diagramm verwenden
        const topShooters = [...shooterPerformanceData]
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 6);
        
        // Daten für das Liniendiagramm aufbereiten
        const formattedShooterData = [];
        const maxDurchgang = 5; // Maximal 5 Durchgänge
        
        for (let dg = 1; dg <= maxDurchgang; dg++) {
          const dataPoint: any = { name: `DG ${dg}` };
          
          topShooters.forEach(shooter => {
            const key = `dg${dg}`;
            dataPoint[shooter.shooterId] = shooter.results[key] || null;
            dataPoint[`${shooter.shooterId}_name`] = shooter.shooterName;
          });
          
          formattedShooterData.push(dataPoint);
        }
        
        setShooterData(formattedShooterData);
        setIsLoadingShooterData(false);
      } catch (error) {
        console.error("Fehler beim Laden der Schützenleistungsdaten:", error);
        setIsLoadingShooterData(false);
      }
      
      try {
        // Mannschaftsvergleichsdaten laden
        setIsLoadingTeamData(true);
        const teamComparisonData = await fetchTeamComparisonData(
          selectedSeason,
          selectedLeague !== 'all' ? selectedLeague : undefined
        );
        
        // Daten für das Balkendiagramm aufbereiten
        const formattedTeamData = teamComparisonData
          .filter(team => team.roundsShot > 0) // Nur Teams mit Ergebnissen anzeigen
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 8) // Maximal 8 Teams anzeigen
          .map(team => ({
            name: team.teamName,
            durchschnitt: parseFloat(team.averageScore.toFixed(1))
          }));
        
        setTeamData(formattedTeamData);
        setIsLoadingTeamData(false);
      } catch (error) {
        console.error("Fehler beim Laden der Mannschaftsvergleichsdaten:", error);
        setIsLoadingTeamData(false);
      }
      
      try {
        // Geschlechterverteilungsdaten laden
        setIsLoadingGenderData(true);
        const genderDistributionData = await fetchGenderDistributionData(
          selectedSeason,
          selectedLeague !== 'all' ? selectedLeague : undefined,
          selectedClub !== 'all' ? selectedClub : undefined
        );
        
        // Daten für das Kreisdiagramm aufbereiten
        const formattedGenderData = [
          { name: 'Männlich', value: genderDistributionData.male },
          { name: 'Weiblich', value: genderDistributionData.female }
        ];
        
        setGenderData(formattedGenderData);
        setIsLoadingGenderData(false);
      } catch (error) {
        console.error("Fehler beim Laden der Geschlechterverteilungsdaten:", error);
        setIsLoadingGenderData(false);
      }
    };
    
    loadData();
  }, [selectedSeason, selectedLeague, selectedClub]);
  
  // Funktion zum Exportieren eines Diagramms als PNG
  const tabs = ['performance', 'comparison', 'distribution', 'trends', 'trend-analysis'];
  
  const swipeRef = useSwipe({
    onSwipeLeft: () => {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    },
    onSwipeRight: () => {
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
  });

  const exportChart = (chartId: string, filename: string) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;
    
    try {
      // SVG in Canvas umwandeln und als PNG herunterladen
      const svgElement = chartElement.querySelector('svg');
      if (!svgElement) return;
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = filename;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error('Fehler beim Exportieren des Diagramms:', error);
      alert('Das Diagramm konnte nicht exportiert werden.');
    }
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Statistik-Dashboard</h1>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/statistik" className="flex items-center justify-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="season-select" className="text-base font-medium">Saison</Label>
          <Select
            value={selectedSeason}
            onValueChange={setSelectedSeason}
            disabled={seasons.length === 0}
          >
            <SelectTrigger id="season-select" className="h-12 text-base">
              <SelectValue placeholder="Saison auswählen" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map(season => (
                <SelectItem key={season.id} value={season.id} className="h-12 text-base">
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="league-select" className="text-base font-medium">Liga</Label>
          <Select
            value={selectedLeague}
            onValueChange={setSelectedLeague}
            disabled={leagues.length === 0}
          >
            <SelectTrigger id="league-select" className="h-12 text-base">
              <SelectValue placeholder="Alle Ligen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="h-12 text-base">Alle Ligen</SelectItem>
              {leagues.map(league => (
                <SelectItem key={league.id} value={league.id} className="h-12 text-base">
                  {league.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="club-select" className="text-base font-medium">Verein</Label>
          <Select
            value={selectedClub}
            onValueChange={setSelectedClub}
            disabled={clubs.length === 0}
          >
            <SelectTrigger id="club-select" className="h-12 text-base">
              <SelectValue placeholder="Alle Vereine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="h-12 text-base">Alle Vereine</SelectItem>
              {clubs.map(club => (
                <SelectItem key={club.id} value={club.id} className="h-12 text-base">
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-8 h-auto sticky top-0 z-10 bg-background">
          <TabsTrigger value="performance" className="text-xs sm:text-sm p-2">Leistung</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs sm:text-sm p-2">Teams</TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs sm:text-sm p-2">Geschlecht</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm p-2">Saisons</TabsTrigger>
          <TabsTrigger value="trend-analysis" className="text-xs sm:text-sm p-2">Trends</TabsTrigger>
        </TabsList>
        
        <div ref={swipeRef} className="touch-pan-y">
        
        <TabsContent value="performance">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Leistungsentwicklung über die Saison</CardTitle>
                <CardDescription>Entwicklung der Ringzahlen der Top 6 Schützen über alle Durchgänge</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportChart('shooter-performance-chart', 'Leistungsentwicklung.png')}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingShooterData ? (
                <div className="h-[400px] w-full flex items-center justify-center">
                  <Skeleton className="h-[350px] w-full" />
                </div>
              ) : shooterData.length > 0 ? (
                <div id="shooter-performance-chart" className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={shooterData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[260, 300]} />
                      <Tooltip 
                        formatter={(value, name) => {
                          const shooterId = name as string;
                          const shooterName = shooterData[0][`${shooterId}_name`];
                          return [value, shooterName];
                        }}
                      />
                      <Legend 
                        formatter={(value) => {
                          const shooterId = value;
                          return shooterData[0][`${shooterId}_name`] || value;
                        }}
                      />
                      {shooterData.length > 0 && Object.keys(shooterData[0])
                        .filter(key => !key.includes('name') && key !== 'name')
                        .map((shooterId, index) => (
                          <Line 
                            key={shooterId}
                            type="monotone" 
                            dataKey={shooterId} 
                            stroke={COLORS[index % COLORS.length]} 
                            name={shooterId}
                            connectNulls
                          />
                        ))
                      }
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] w-full flex items-center justify-center">
                  <p className="text-muted-foreground">Keine Daten verfügbar. Bitte wählen Sie eine Saison aus.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Mannschaftsvergleich</CardTitle>
                <CardDescription>Durchschnittliche Leistung der Mannschaften in der ausgewählten Liga</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportChart('team-comparison-chart', 'Mannschaftsvergleich.png')}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingTeamData ? (
                <div className="h-[400px] w-full flex items-center justify-center">
                  <Skeleton className="h-[350px] w-full" />
                </div>
              ) : teamData.length > 0 ? (
                <div id="team-comparison-chart" className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={teamData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={['dataMin - 5', 'dataMax + 5']} /> {/* Dynamische Y-Achse */}
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="durchschnitt" name="Durchschnitt">
                        {teamData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] w-full flex items-center justify-center">
                  <p className="text-muted-foreground">Keine Daten verfügbar. Bitte wählen Sie eine Saison aus.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Geschlechterverteilung</CardTitle>
                <CardDescription>Verteilung der Schützen nach Geschlecht</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportChart('gender-distribution-chart', 'Geschlechterverteilung.png')}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingGenderData ? (
                <div className="h-[400px] w-full flex items-center justify-center">
                  <Skeleton className="h-[350px] w-full" />
                </div>
              ) : genderData.length > 0 && (genderData[0].value > 0 || genderData[1].value > 0) ? (
                <div id="gender-distribution-chart" className="h-[400px] w-full flex justify-center">
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Schützen`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] w-full flex items-center justify-center">
                  <p className="text-muted-foreground">Keine Daten verfügbar. Bitte wählen Sie eine Saison aus.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <CrossSeasonStats />
        </TabsContent>
        
        <TabsContent value="trend-analysis">
          <TrendAnalysis 
            seasonId={selectedSeason} 
            leagueId={selectedLeague} 
            clubId={selectedClub} 
          />
        </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}