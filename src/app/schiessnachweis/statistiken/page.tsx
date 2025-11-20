"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft, TrendingUp, Calendar, Target, Trophy, Download, Crown, Lock } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießEintrag, DISZIPLIN_NAMES } from "@/types/schiessnachweis";
import { PremiumService } from "@/lib/services/premium-service";
import { PremiumStatisticsService } from "@/lib/services/premium-statistics-service";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { de } from "date-fns/locale";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function StatistikenPage() {
  const [einträge, setEinträge] = useState<SchießEintrag[]>([]);
  const [filterDisziplin, setFilterDisziplin] = useState<string>("alle");
  const [filterZeitraum, setFilterZeitraum] = useState<string>("12monate");
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  
  useEffect(() => {
    setIsPremium(PremiumService.isPremium());
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await SchießnachweisService.getEinträge();
      setEinträge(data);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gefilterte Daten basierend auf Auswahl
  const getFilteredData = () => {
    let filtered = [...einträge];
    
    // Disziplin-Filter
    if (filterDisziplin !== "alle") {
      filtered = filtered.filter(e => e.disziplin === filterDisziplin);
    }
    
    // Zeitraum-Filter
    const now = new Date();
    let startDate: Date;
    
    switch (filterZeitraum) {
      case "1monat":
        startDate = subMonths(now, 1);
        break;
      case "3monate":
        startDate = subMonths(now, 3);
        break;
      case "6monate":
        startDate = subMonths(now, 6);
        break;
      case "12monate":
        // Für "Letztes Jahr" - zeige alle Daten der letzten 365 Tage
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "2024":
        // Spezifisch für 2024
        startDate = new Date(2024, 0, 1); // 1. Januar 2024
        break;
      default:
        startDate = new Date(0); // Alle Zeit
    }
    
    if (filterZeitraum !== "alle") {
      filtered = filtered.filter(e => e.datum >= startDate);
    }
    
    return filtered;
  };

  // Leistungsentwicklung über Zeit
  const getLeistungsentwicklung = () => {
    const filtered = getFilteredData();
    
    if (filtered.length === 0) {
      return [];
    }
    
    // Sortiere nach Datum und zeige individuelle Einträge
    return filtered
      .sort((a, b) => a.datum.getTime() - b.datum.getTime())
      .map((eintrag, index) => ({
        datum: format(eintrag.datum, 'dd.MM.yy', { locale: de }),
        ringe: eintrag.ergebnis,
        typ: eintrag.typ,
        disziplin: eintrag.disziplin,
        index: index + 1
      }));
  };

  // Disziplinen-Verteilung
  const getDisziplinenVerteilung = () => {
    const filtered = getFilteredData();
    const disziplinCount: { [key: string]: number } = {};
    
    filtered.forEach(e => {
      disziplinCount[e.disziplin] = (disziplinCount[e.disziplin] || 0) + 1;
    });
    
    return Object.entries(disziplinCount).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / filtered.length) * 100)
    }));
  };

  // Training vs Wettkampf Statistik
  const getAktivitätsVerteilung = () => {
    const filtered = getFilteredData();
    const trainings = filtered.filter(e => e.typ === 'training');
    const wettkämpfe = filtered.filter(e => e.typ === 'wettkampf');
    
    return [
      {
        name: 'Training',
        anzahl: trainings.length,
        durchschnitt: trainings.length > 0 
          ? Math.round((trainings.reduce((sum, e) => sum + e.ergebnis, 0) / trainings.length) * 10) / 10
          : 0
      },
      {
        name: 'Wettkampf',
        anzahl: wettkämpfe.length,
        durchschnitt: wettkämpfe.length > 0 
          ? Math.round((wettkämpfe.reduce((sum, e) => sum + e.ergebnis, 0) / wettkämpfe.length) * 10) / 10
          : 0
      }
    ];
  };

  // Beste Ergebnisse
  const getBestResults = () => {
    const filtered = getFilteredData();
    return filtered
      .sort((a, b) => b.ergebnis - a.ergebnis)
      .slice(0, 5)
      .map((e, index) => ({
        rang: index + 1,
        datum: format(e.datum, 'dd.MM.yyyy', { locale: de }),
        disziplin: e.disziplin,
        ergebnis: e.ergebnis,
        ergebnisZehntel: e.ergebnisZehntel,
        typ: e.typ,
        standort: e.standort
      }));
  };

  const handleExportStatistik = () => {
    // Hier könnte PDF-Export implementiert werden
    console.log('Export Statistik');
  };

  const leistungsdaten = getLeistungsentwicklung();
  const disziplinendaten = getDisziplinenVerteilung();
  const aktivitätsdaten = getAktivitätsVerteilung();
  const besteErgebnisse = getBestResults();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Schießnachweis
          </Link>
        </Button>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Statistiken & Analysen
            </h1>
            <p className="text-muted-foreground">
              Detaillierte Auswertung Ihrer Schießaktivitäten
            </p>
          </div>
          <Button onClick={handleExportStatistik} variant="outline" className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Statistik exportieren
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Disziplin</label>
              <NativeSelect
                value={filterDisziplin}
                onValueChange={setFilterDisziplin}
                options={[
                  { value: "alle", label: "Alle Disziplinen" },
                  ...[...new Set(einträge.map(e => e.disziplin))].sort().map(disziplin => ({
                    value: disziplin,
                    label: disziplin
                  }))
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Zeitraum</label>
              <NativeSelect
                value={filterZeitraum}
                onValueChange={setFilterZeitraum}
                options={[
                  { value: "1monat", label: "Letzter Monat" },
                  { value: "3monate", label: "Letzte 3 Monate" },
                  { value: "6monate", label: "Letzte 6 Monate" },
                  { value: "12monate", label: "Letzte 365 Tage" },
                  { value: "2024", label: "Jahr 2024" },
                  { value: "alle", label: "Alle Zeit" }
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Lade Statistiken...</p>
        </div>
      ) : einträge.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Daten verfügbar</h3>
            <p className="text-muted-foreground mb-4">
              Tragen Sie erst einige Schießaktivitäten ein, um Statistiken zu sehen.
            </p>
            <Button asChild>
              <Link href="/schiessnachweis/neuer-eintrag">
                Ersten Eintrag erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Leistungsentwicklung */}
          <Card>
            <CardHeader>
              <CardTitle>Leistungsentwicklung</CardTitle>
              <CardDescription>Ringzahlen aller Einträge chronologisch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leistungsdaten}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="datum" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} Ringe`,
                        props.payload.typ === 'training' ? '🎯 Training' : '🏆 Wettkampf'
                      ]}
                      labelFormatter={(label) => `Datum: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ringe" 
                      stroke="#0088FE" 
                      name="Ringzahl"
                      strokeWidth={2}
                      dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Aktivitäts-Verteilung */}
            <Card className={!isPremium ? "relative" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Training vs Wettkampf
                  {!isPremium && <Badge variant="outline" className="ml-2"><Crown className="h-3 w-3 mr-1" />Premium</Badge>}
                </CardTitle>
                <CardDescription>Verteilung und Durchschnittsergebnisse</CardDescription>
              </CardHeader>
              <CardContent>
                {isPremium ? (
                  <div className="space-y-4">
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={aktivitätsdaten}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="anzahl" fill="#0088FE" name="Anzahl" />
                          <Bar dataKey="durchschnitt" fill="#00C49F" name="Ø Ergebnis" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {(() => {
                      const trendAnalysis = PremiumStatisticsService.getTrendAnalysis(getFilteredData());
                      const metrics = PremiumStatisticsService.getPerformanceMetrics(getFilteredData());
                      return (
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🎯 Premium-Analyse</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-blue-700 dark:text-blue-300">Trend:</span>
                              <span className={`ml-2 font-medium ${
                                trendAnalysis.trend === 'steigend' ? 'text-green-600' :
                                trendAnalysis.trend === 'fallend' ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {trendAnalysis.trend === 'steigend' ? '📈' : 
                                 trendAnalysis.trend === 'fallend' ? '📉' : '➡️'} 
                                {trendAnalysis.description}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-700 dark:text-blue-300">Konsistenz:</span>
                              <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                                {metrics.consistency}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                    }
                  </div>
                ) : (
                  <div className="h-[250px] w-full bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex flex-col items-center justify-center">
                    <Lock className="h-12 w-12 text-yellow-600 mb-3" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3 text-center">Erweiterte Statistiken<br />nur mit Premium</p>
                    <Link href="/schiessnachweis/premium">
                      <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgraden
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Disziplinen-Verteilung */}
            <Card className={!isPremium ? "relative" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Disziplinen-Verteilung
                  {!isPremium && <Badge variant="outline" className="ml-2"><Crown className="h-3 w-3 mr-1" />Premium</Badge>}
                </CardTitle>
                <CardDescription>Häufigkeit der verschiedenen Disziplinen</CardDescription>
              </CardHeader>
              <CardContent>
                {isPremium ? (
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={disziplinendaten}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                        >
                          {disziplinendaten.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] w-full bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex flex-col items-center justify-center">
                    <Lock className="h-12 w-12 text-yellow-600 mb-3" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3 text-center">Erweiterte Statistiken<br />nur mit Premium</p>
                    <Link href="/schiessnachweis/premium">
                      <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgraden
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Premium Analytics Section */}
          {isPremium && (() => {
            const comparison = PremiumStatisticsService.getDisziplinComparison(getFilteredData());
            const weeklyPattern = PremiumStatisticsService.getWeeklyPattern(getFilteredData());
            const monthlyProgress = PremiumStatisticsService.getMonthlyProgress(getFilteredData(), 6);
            
            return (
              <div className="space-y-6">
                {/* Disziplin-Vergleich */}
                <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      Disziplin-Leistungsvergleich
                      <Badge variant="default" className="ml-2">Premium</Badge>
                    </CardTitle>
                    <CardDescription>Detaillierte Analyse Ihrer Stärken und Schwächen</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {comparison.slice(0, 5).map((comp, index) => (
                        <div key={comp.disziplin} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 bg-yellow-600 text-white rounded-full text-xs font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{comp.disziplin}</div>
                              <div className="text-sm text-muted-foreground">{comp.anzahl} Einträge</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{comp.durchschnitt}</div>
                            <div className={`text-sm ${
                              comp.verbesserung > 0 ? 'text-green-600' : 
                              comp.verbesserung < 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {comp.verbesserung > 0 ? '+' : ''}{comp.verbesserung}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Wochenmuster */}
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      Wochenmuster-Analyse
                      <Badge variant="default" className="ml-2">Premium</Badge>
                    </CardTitle>
                    <CardDescription>An welchen Wochentagen schießen Sie am besten?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyPattern}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8B5CF6" name="Anzahl" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Monatlicher Fortschritt */}
                <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Fortschritt seit Anmeldung
                      <Badge variant="default" className="ml-2">Premium</Badge>
                    </CardTitle>
                    <CardDescription>Detaillierte Entwicklung seit Ihrem ersten Eintrag</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyProgress}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="monat" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="avgTraining" stroke="#10B981" name="Ø Training" strokeWidth={2} />
                          <Line type="monotone" dataKey="avgWettkampf" stroke="#F59E0B" name="Ø Wettkampf" strokeWidth={2} />
                          <Line type="monotone" dataKey="gesamtDurchschnitt" stroke="#3B82F6" name="Ø Gesamt" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}
          
          {/* Beste Ergebnisse */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top 5 Ergebnisse
              </CardTitle>
              <CardDescription>Ihre besten Leistungen im gewählten Zeitraum</CardDescription>
            </CardHeader>
            <CardContent>
              {besteErgebnisse.length > 0 ? (
                <div className="space-y-3">
                  {besteErgebnisse.map((result) => (
                    <div key={`${result.datum}-${result.ergebnis}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                          {result.rang}
                        </div>
                        <div>
                          <div className="font-medium">
                            {result.ergebnis} Ringe
                            {result.ergebnisZehntel && (
                              <span className="text-sm text-green-600 ml-2">
                                ({result.ergebnisZehntel} mit Zehntel)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.disziplin} • {result.datum}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium capitalize">
                          {result.typ === 'training' ? '🎯 Training' : '🏆 Wettkampf'}
                        </div>
                        <div className="text-xs text-muted-foreground">{result.standort}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Keine Ergebnisse im gewählten Zeitraum gefunden.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
