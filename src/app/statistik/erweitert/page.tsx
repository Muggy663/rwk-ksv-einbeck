"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, TrendingUp, Medal, LineChart as LineChartIcon, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ReferenceLine,
} from 'recharts';

interface ShooterScore {
  shooterId: string;
  shooterName: string;
  competitionYear: number;
  leagueType: string;
  leagueName: string;
  durchgang: number;
  totalRinge: number;
}

interface ShooterStats {
  shooterId: string;
  shooterName: string;
  years: number[];
  averageByYear: { [year: number]: number };
  totalByYear: { [year: number]: number };
  roundsByYear: { [year: number]: number };
  bestScore: number;
  worstScore: number;
  overallAverage: number;
  scoresByYear: { [year: number]: number[] };
}

export default function ExtendedStatisticsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShooter, setSelectedShooter] = useState<string | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [shooterStats, setShooterStats] = useState<ShooterStats | null>(null);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);

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
      // Suche nach Schützen in der Firestore-Datenbank
      const shootersRef = collection(db, 'shooters');
      const q = query(
        shootersRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\\uf8ff'),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "Keine Ergebnisse",
          description: "Es wurden keine Schützen mit diesem Namen gefunden.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Fehler bei der Schützensuche:", error);
      toast({
        title: "Fehler",
        description: "Bei der Suche ist ein Fehler aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShooterStats = async (shooterId: string, discipline: string) => {
    setIsLoading(true);
    try {
      const scoresRef = collection(db, 'rwk_scores');
      let q;
      
      if (discipline === 'all') {
        q = query(
          scoresRef,
          where('shooterId', '==', shooterId),
          orderBy('competitionYear'),
          orderBy('durchgang')
        );
      } else {
        q = query(
          scoresRef,
          where('shooterId', '==', shooterId),
          where('leagueType', '==', discipline),
          orderBy('competitionYear'),
          orderBy('durchgang')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const scores: ShooterScore[] = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as ShooterScore[];
      
      if (scores.length === 0) {
        toast({
          title: "Keine Ergebnisse",
          description: "Für diesen Schützen wurden keine Ergebnisse gefunden.",
          variant: "destructive"
        });
        setShooterStats(null);
        return;
      }
      
      // Statistiken berechnen
      const years = Array.from(new Set(scores.map(score => score.competitionYear))).sort();
      const averageByYear: { [year: number]: number } = {};
      const totalByYear: { [year: number]: number } = {};
      const roundsByYear: { [year: number]: number } = {};
      const scoresByYear: { [year: number]: number[] } = {};
      
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
      });
      
      const bestScore = Math.max(...allScores);
      const worstScore = Math.min(...allScores);
      const overallAverage = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
      
      setShooterStats({
        shooterId,
        shooterName: scores[0].shooterName,
        years,
        averageByYear,
        totalByYear,
        roundsByYear,
        bestScore,
        worstScore,
        overallAverage,
        scoresByYear
      });
      
    } catch (error) {
      console.error("Fehler beim Laden der Schützenstatistik:", error);
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
    if (selectedShooter) {
      fetchShooterStats(selectedShooter, selectedDiscipline);
    }
  }, [selectedShooter, selectedDiscipline]);

  const handleShooterSelect = (shooterId: string) => {
    setSelectedShooter(shooterId);
    // Leere die Suchergebnisse, um die Auswahl zu verstecken
    setSearchResults([]);
  };

  const handleDisciplineChange = (value: string) => {
    setSelectedDiscipline(value);
  };

  const renderAverageChart = () => {
    if (!shooterStats) return null;
    
    const data = shooterStats.years.map(year => ({
      year,
      average: shooterStats.averageByYear[year]
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
              y={shooterStats.overallAverage} 
              label={{ 
                value: `Ø ${shooterStats.overallAverage.toFixed(2)}`, 
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

  const renderProgressionChart = () => {
    if (!shooterStats) return null;
    
    // Erstelle einen flachen Array mit allen Ergebnissen und ihren Metadaten
    const allScores: { year: number; round: number; score: number }[] = [];
    
    shooterStats.years.forEach(year => {
      const yearScores = shooterStats.scoresByYear[year];
      yearScores.forEach((score, index) => {
        allScores.push({
          year,
          round: index + 1,
          score
        });
      });
    });
    
    // Sortiere nach Jahr und Durchgang
    allScores.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.round - b.round;
    });
    
    // Füge einen fortlaufenden Index hinzu
    const data = allScores.map((item, index) => ({
      ...item,
      index: index + 1,
      label: `${item.year} DG${item.round}`
    }));
    
    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="index" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              label={{ value: 'Durchgänge chronologisch', position: 'insideBottom', offset: -5 }}
            />
            <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)'
              }} 
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value, name, props) => {
                const item = data[props.payload.index];
                return [`${value} Ringe`, `${item.year} DG${item.round}`];
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Ergebnis" 
              dot={{ r: 4, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6 }}
            />
            <ReferenceLine 
              y={shooterStats.overallAverage} 
              label={{ 
                value: `Ø ${shooterStats.overallAverage.toFixed(2)}`, 
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

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
          <span className="sm:hidden">Saison-<br />übergreifende<br />Statistiken</span>
          <span className="hidden sm:inline">Saisonübergreifende Statistiken</span>
        </h1>
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href="/statistik" className="flex items-center justify-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Saisonübergreifende Statistiken
          </CardTitle>
          <CardDescription>
            Analysieren Sie die Leistungsentwicklung eines Schützen über mehrere Saisons hinweg.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow space-y-2">
                <Label htmlFor="shooterSearch">Schütze suchen</Label>
                <div className="flex gap-2">
                  <Input
                    id="shooterSearch"
                    placeholder="Name des Schützen eingeben"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow"
                  />
                  <Button onClick={handleSearch} disabled={isLoading || searchTerm.trim().length < 3} className="whitespace-nowrap">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Suchen
                  </Button>
                </div>
              </div>
              
              <div className="w-full md:w-1/3 space-y-2">
                <Label htmlFor="disciplineSelect">Disziplin</Label>
                <Select
                  value={selectedDiscipline}
                  onValueChange={handleDisciplineChange}
                  disabled={!selectedShooter}
                >
                  <SelectTrigger id="disciplineSelect">
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
                        onClick={() => handleShooterSelect(result.id)}
                      >
                        {result.name}
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
          
          {!isLoading && shooterStats && (
            <div className="space-y-6">
              <div className="bg-muted/20 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">{shooterStats.shooterName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Erfasste Saisons</p>
                    <p className="font-medium">{shooterStats.years.join(', ')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Gesamtdurchschnitt</p>
                    <p className="font-medium">{shooterStats.overallAverage.toFixed(2)} Ringe</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Bestes/Schlechtestes Ergebnis</p>
                    <p className="font-medium">{shooterStats.bestScore} / {shooterStats.worstScore} Ringe</p>
                  </div>
                </div>
              </div>
              
              <Tabs defaultValue="average" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
                  <TabsTrigger value="average" className="flex items-center text-xs sm:text-sm p-2">
                    <LineChartIcon className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="sm:hidden">Durchschnitt</span>
                    <span className="hidden sm:inline">Durchschnittsentwicklung</span>
                  </TabsTrigger>
                  <TabsTrigger value="progression" className="flex items-center text-xs sm:text-sm p-2">
                    <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="sm:hidden">Verlauf</span>
                    <span className="hidden sm:inline">Leistungsverlauf</span>
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex items-center text-xs sm:text-sm p-2">
                    <Medal className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="sm:hidden">Details</span>
                    <span className="hidden sm:inline">Saisondetails</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="average" className="pt-4">
                  <h3 className="text-lg font-semibold mb-4">Durchschnittsentwicklung über die Saisons</h3>
                  {renderAverageChart()}
                </TabsContent>
                
                <TabsContent value="progression" className="pt-4">
                  <h3 className="text-lg font-semibold mb-4">Chronologischer Leistungsverlauf</h3>
                  {renderProgressionChart()}
                </TabsContent>
                
                <TabsContent value="details" className="pt-4">
                  <h3 className="text-lg font-semibold mb-4">Detaillierte Saisonübersicht</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Saison</th>
                          <th className="text-center py-2 px-4">Durchgänge</th>
                          <th className="text-center py-2 px-4">Gesamtergebnis</th>
                          <th className="text-center py-2 px-4">Durchschnitt</th>
                          <th className="text-center py-2 px-4">Entwicklung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shooterStats.years.map((year, index) => {
                          const prevYear = index > 0 ? shooterStats.years[index - 1] : null;
                          const prevAvg = prevYear ? shooterStats.averageByYear[prevYear] : null;
                          const currentAvg = shooterStats.averageByYear[year];
                          const diff = prevAvg ? currentAvg - prevAvg : null;
                          
                          return (
                            <tr key={year} className="border-b hover:bg-muted/20">
                              <td className="py-2 px-4 font-medium">{year}</td>
                              <td className="py-2 px-4 text-center">{shooterStats.roundsByYear[year]}</td>
                              <td className="py-2 px-4 text-center">{shooterStats.totalByYear[year]}</td>
                              <td className="py-2 px-4 text-center font-medium">{currentAvg.toFixed(2)}</td>
                              <td className="py-2 px-4 text-center">
                                {diff !== null ? (
                                  <span className={diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                                      {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {!isLoading && !shooterStats && !searchResults.length && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Bitte suchen Sie nach einem Schützen, um dessen Leistungsentwicklung über mehrere Saisons zu analysieren.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
