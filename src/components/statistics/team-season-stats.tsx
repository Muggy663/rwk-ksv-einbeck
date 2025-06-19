"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Users, Medal, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  ReferenceLine,
  LineChart,
  Line
} from 'recharts';

interface TeamScore {
  teamId: string;
  teamName: string;
  clubId: string;
  clubName: string;
  competitionYear: number;
  leagueId: string;
  leagueName: string;
  leagueType: string;
  durchgang: number;
  totalRinge: number;
  shooters: {
    shooterId: string;
    shooterName: string;
    ringe: number;
  }[];
}

interface TeamStats {
  teamId: string;
  teamName: string;
  clubId: string;
  clubName: string;
  years: number[];
  averageByYear: { [year: number]: number };
  totalByYear: { [year: number]: number };
  roundsByYear: { [year: number]: number };
  bestScore: number;
  worstScore: number;
  overallAverage: number;
  scoresByYear: { [year: number]: number[] };
  shooterStats: {
    [shooterId: string]: {
      shooterName: string;
      averageByYear: { [year: number]: number };
      totalByYear: { [year: number]: number };
      roundsByYear: { [year: number]: number };
    };
  };
}

export function TeamSeasonStats() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedLeagueType, setSelectedLeagueType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; clubName: string }[]>([]);

  const handleSearch = async () => {
    if (searchTerm.trim().length < 3) {
      toast({
        title: "Zu kurzer Suchbegriff",
        description: "Bitte geben Sie mindestens 3 Zeichen ein.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Suche nach Teams in der Firestore-Datenbank
      const teamsRef = collection(db, 'rwk_teams');
      const q = query(
        teamsRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const teams = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Hole die Vereinsnamen für die Teams
      const clubIds = [...new Set(teams.map(team => team.clubId))];
      const clubsData: { [id: string]: string } = {};
      
      if (clubIds.length > 0) {
        const clubsRef = collection(db, 'clubs');
        const clubsSnapshot = await getDocs(clubsRef);
        clubsSnapshot.docs.forEach(doc => {
          if (clubIds.includes(doc.id)) {
            clubsData[doc.id] = doc.data().name;
          }
        });
      }
      
      const results = teams.map(team => ({
        id: team.id,
        name: team.name,
        clubName: clubsData[team.clubId] || 'Unbekannter Verein'
      }));
      
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "Keine Ergebnisse",
          description: "Es wurden keine Teams mit diesem Namen gefunden.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Fehler bei der Teamsuche:", error);
      toast({
        title: "Fehler",
        description: "Bei der Suche ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamStats = async (teamId: string, leagueType: string) => {
    setIsLoading(true);
    try {
      const scoresRef = collection(db, 'rwk_scores');
      let q;
      
      if (leagueType === 'all') {
        q = query(
          scoresRef,
          where('teamId', '==', teamId),
          orderBy('competitionYear'),
          orderBy('durchgang')
        );
      } else {
        q = query(
          scoresRef,
          where('teamId', '==', teamId),
          where('leagueType', '==', leagueType),
          orderBy('competitionYear'),
          orderBy('durchgang')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const scores: TeamScore[] = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as TeamScore[];
      
      if (scores.length === 0) {
        toast({
          title: "Keine Ergebnisse",
          description: "Für dieses Team wurden keine Ergebnisse gefunden.",
          variant: "destructive"
        });
        setTeamStats(null);
        return;
      }
      
      // Statistiken berechnen
      const years = Array.from(new Set(scores.map(score => score.competitionYear))).sort();
      const averageByYear: { [year: number]: number } = {};
      const totalByYear: { [year: number]: number } = {};
      const roundsByYear: { [year: number]: number } = {};
      const scoresByYear: { [year: number]: number[] } = {};
      
      // Schützenstatistiken
      const shooterStats: {
        [shooterId: string]: {
          shooterName: string;
          averageByYear: { [year: number]: number };
          totalByYear: { [year: number]: number };
          roundsByYear: { [year: number]: number };
        };
      } = {};
      
      let allScores: number[] = [];
      
      years.forEach(year => {
        const yearScores = scores
          .filter(score => score.competitionYear === year)
          .map(score => score.totalRinge);
        
        scoresByYear[year] = yearScores;
        totalByYear[year] = yearScores.reduce((sum, score) => sum + score, 0);
        roundsByYear[year] = yearScores.length;
        averageByYear[year] = totalByYear[year] / roundsByYear[year];
        
        allScores = [...allScores, ...yearScores];
        
        // Schützenstatistiken für dieses Jahr
        scores
          .filter(score => score.competitionYear === year)
          .forEach(score => {
            if (score.shooters && score.shooters.length > 0) {
              score.shooters.forEach(shooter => {
                if (!shooterStats[shooter.shooterId]) {
                  shooterStats[shooter.shooterId] = {
                    shooterName: shooter.shooterName,
                    averageByYear: {},
                    totalByYear: {},
                    roundsByYear: {}
                  };
                }
                
                if (!shooterStats[shooter.shooterId].totalByYear[year]) {
                  shooterStats[shooter.shooterId].totalByYear[year] = 0;
                  shooterStats[shooter.shooterId].roundsByYear[year] = 0;
                }
                
                shooterStats[shooter.shooterId].totalByYear[year] += shooter.ringe;
                shooterStats[shooter.shooterId].roundsByYear[year]++;
              });
            }
          });
      });
      
      // Durchschnitte für Schützen berechnen
      Object.keys(shooterStats).forEach(shooterId => {
        const shooter = shooterStats[shooterId];
        Object.keys(shooter.totalByYear).forEach(year => {
          const yearNum = parseInt(year);
          shooter.averageByYear[yearNum] = shooter.totalByYear[yearNum] / shooter.roundsByYear[yearNum];
        });
      });
      
      const bestScore = Math.max(...allScores);
      const worstScore = Math.min(...allScores);
      const overallAverage = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
      
      setTeamStats({
        teamId,
        teamName: scores[0].teamName,
        clubId: scores[0].clubId,
        clubName: scores[0].clubName,
        years,
        averageByYear,
        totalByYear,
        roundsByYear,
        bestScore,
        worstScore,
        overallAverage,
        scoresByYear,
        shooterStats
      });
      
    } catch (error) {
      console.error("Fehler beim Laden der Teamstatistik:", error);
      toast({
        title: "Fehler",
        description: "Beim Laden der Statistik ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamStats(selectedTeam, selectedLeagueType);
    }
  }, [selectedTeam, selectedLeagueType]);

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
    // Leere die Suchergebnisse, um die Auswahl zu verstecken
    setSearchResults([]);
  };

  const handleLeagueTypeChange = (value: string) => {
    setSelectedLeagueType(value);
  };

  const renderAverageChart = () => {
    if (!teamStats) return null;
    
    const data = teamStats.years.map(year => ({
      year,
      average: teamStats.averageByYear[year]
    }));
    
    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }} 
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="average" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Durchschnitt" 
              dot={{ r: 5, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 8 }}
            />
            <ReferenceLine 
              y={teamStats.overallAverage} 
              label={{ 
                value: `Ø ${teamStats.overallAverage.toFixed(2)}`, 
                position: 'right', 
                fill: 'hsl(var(--muted-foreground))'
              }} 
              stroke="hsl(var(--accent))" 
              strokeDasharray="3 3" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderShooterComparisonChart = () => {
    if (!teamStats || !teamStats.shooterStats || Object.keys(teamStats.shooterStats).length === 0) return null;
    
    // Erstelle Daten für das Diagramm
    const data = teamStats.years.map(year => {
      const yearData: any = { year };
      
      Object.keys(teamStats.shooterStats).forEach(shooterId => {
        const shooter = teamStats.shooterStats[shooterId];
        if (shooter.averageByYear[year]) {
          yearData[shooter.shooterName] = shooter.averageByYear[year];
        }
      });
      
      return yearData;
    });
    
    // Generiere zufällige Farben für die Schützen
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--destructive))',
      'hsl(var(--secondary))',
      '#8884d8',
      '#82ca9d',
      '#ffc658'
    ];
    
    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }} 
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            {Object.keys(teamStats.shooterStats).map((shooterId, index) => {
              const shooter = teamStats.shooterStats[shooterId];
              return (
                <Line 
                  key={shooterId}
                  type="monotone" 
                  dataKey={shooter.shooterName} 
                  stroke={colors[index % colors.length]} 
                  strokeWidth={2}
                  dot={{ r: 4, fill: colors[index % colors.length] }}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderYearlyComparisonChart = () => {
    if (!teamStats) return null;
    
    const data = teamStats.years.map(year => ({
      year: year.toString(),
      average: teamStats.averageByYear[year],
      rounds: teamStats.roundsByYear[year]
    }));
    
    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }} 
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="average" 
              fill="hsl(var(--primary))" 
              name="Durchschnitt" 
            />
            <Bar 
              yAxisId="right"
              dataKey="rounds" 
              fill="hsl(var(--secondary))" 
              name="Anzahl Durchgänge" 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Mannschaftsstatistiken über mehrere Saisons
        </CardTitle>
        <CardDescription>
          Analysieren Sie die Leistungsentwicklung einer Mannschaft über mehrere Saisons hinweg.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow space-y-2">
              <Label htmlFor="teamSearch">Mannschaft suchen</Label>
              <div className="flex gap-2">
                <Input
                  id="teamSearch"
                  placeholder="Name der Mannschaft eingeben"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={handleSearch} disabled={isLoading || searchTerm.trim().length < 3}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Suchen
                </Button>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 space-y-2">
              <Label htmlFor="leagueTypeSelect">Disziplin</Label>
              <Select
                value={selectedLeagueType}
                onValueChange={handleLeagueTypeChange}
                disabled={!selectedTeam}
              >
                <SelectTrigger id="leagueTypeSelect">
                  <SelectValue placeholder="Disziplin auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Disziplinen</SelectItem>
                  <SelectItem value="KK">Kleinkaliber</SelectItem>
                  <SelectItem value="KKG">Kleinkaliber Gewehr</SelectItem>
                  <SelectItem value="LG">Luftgewehr</SelectItem>
                  <SelectItem value="LGA">Luftgewehr Auflage</SelectItem>
                  <SelectItem value="LP">Luftpistole</SelectItem>
                  <SelectItem value="LPA">Luftpistole Auflage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {searchResults.length > 0 && (
            <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-2">Suchergebnisse:</p>
              <ul className="space-y-1">
                {searchResults.map(result => (
                  <li key={result.id}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left"
                      onClick={() => handleTeamSelect(result.id)}
                    >
                      <span className="flex-grow">{result.name}</span>
                      <span className="text-xs text-muted-foreground">{result.clubName}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <p>Daten werden geladen...</p>
          </div>
        )}
        
        {!isLoading && teamStats && (
          <div className="space-y-6">
            <div className="bg-muted/20 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">{teamStats.teamName}</h3>
              <p className="text-sm text-muted-foreground mb-2">{teamStats.clubName}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Erfasste Saisons</p>
                  <p className="font-medium">{teamStats.years.join(', ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gesamtdurchschnitt</p>
                  <p className="font-medium">{teamStats.overallAverage.toFixed(2)} Ringe</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Bestes/Schlechtestes Ergebnis</p>
                  <p className="font-medium">{teamStats.bestScore} / {teamStats.worstScore} Ringe</p>
                </div>
              </div>
            </div>
            
            <Tabs defaultValue="average" className="w-full">
              <TabsList>
                <TabsTrigger value="average" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Durchschnittsentwicklung
                </TabsTrigger>
                <TabsTrigger value="shooters" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Schützenvergleich
                </TabsTrigger>
                <TabsTrigger value="yearly" className="flex items-center">
                  <Medal className="h-4 w-4 mr-2" />
                  Saisonvergleich
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="average" className="pt-4">
                <h3 className="text-lg font-semibold mb-4">Durchschnittsentwicklung über die Saisons</h3>
                {renderAverageChart()}
              </TabsContent>
              
              <TabsContent value="shooters" className="pt-4">
                <h3 className="text-lg font-semibold mb-4">Vergleich der Schützen über die Saisons</h3>
                {renderShooterComparisonChart()}
              </TabsContent>
              
              <TabsContent value="yearly" className="pt-4">
                <h3 className="text-lg font-semibold mb-4">Vergleich der Saisons</h3>
                {renderYearlyComparisonChart()}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}