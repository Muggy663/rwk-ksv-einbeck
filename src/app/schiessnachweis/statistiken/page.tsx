"use client";

import { useState, useEffect } from "react";
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft, TrendingUp, Calendar, Target, Trophy, Download } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießEintrag } from "@/types/schiessnachweis";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths } from "date-fns";
import { de } from "date-fns/locale";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function StatistikenPage() {
  const [einträge, setEinträge] = useState<SchießEintrag[]>([]);
  const [filterDisziplin, setFilterDisziplin] = useState<string>("alle");
  const [filterZeitraum, setFilterZeitraum] = useState<string>("12monate");
  const [ergebnisTyp, setErgebnisTyp] = useState<string>("auto");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await SchießnachweisService.getEinträge();
      setEinträge(data);
    } catch (error) {
      logError('Fehler beim Laden der Daten:', error);
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
      .map((eintrag, index) => {
        // Wähle Ergebnis basierend auf Filter und Verfügbarkeit
        let ergebnis = null;
        if (ergebnisTyp === "auto") {
          ergebnis = eintrag.ergebnis || eintrag.ergebnisGanzeRinge;
        } else if (ergebnisTyp === "zehntel") {
          // Nur Zehntel-Werte, null wenn nicht verfügbar (zeigt Lücken)
          ergebnis = eintrag.ergebnis || null;
        } else if (ergebnisTyp === "ganze") {
          ergebnis = eintrag.ergebnisGanzeRinge;
        }
        
        return {
          datum: format(eintrag.datum, 'dd.MM.yy', { locale: de }),
          ringe: ergebnis, // Kann null sein für Lücken
          typ: eintrag.typ,
          disziplin: eintrag.disziplin,
          index: index + 1
        };
      });
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
      .sort((a, b) => {
        let ergebnisA = 0;
        let ergebnisB = 0;
        
        if (ergebnisTyp === "auto") {
          ergebnisA = a.ergebnis || a.ergebnisGanzeRinge || 0;
          ergebnisB = b.ergebnis || b.ergebnisGanzeRinge || 0;
        } else if (ergebnisTyp === "zehntel") {
          ergebnisA = a.ergebnis || 0;
          ergebnisB = b.ergebnis || 0;
        } else if (ergebnisTyp === "ganze") {
          ergebnisA = a.ergebnisGanzeRinge || 0;
          ergebnisB = b.ergebnisGanzeRinge || 0;
        }
        
        return ergebnisB - ergebnisA;
      })
      .filter(e => {
        if (ergebnisTyp === "auto") {
          return (e.ergebnis || e.ergebnisGanzeRinge || 0) > 0;
        } else if (ergebnisTyp === "zehntel") {
          return (e.ergebnis || 0) > 0;
        } else {
          return (e.ergebnisGanzeRinge || 0) > 0;
        }
      })
      .slice(0, 5)
      .map((e, index) => {
        let displayErgebnis = 0;
        if (ergebnisTyp === "auto") {
          displayErgebnis = e.ergebnis || e.ergebnisGanzeRinge || 0;
        } else if (ergebnisTyp === "zehntel") {
          displayErgebnis = e.ergebnis || 0;
        } else {
          displayErgebnis = e.ergebnisGanzeRinge || 0;
        }
        
        return {
          rang: index + 1,
          datum: format(e.datum, 'dd.MM.yyyy', { locale: de }),
          disziplin: e.disziplin,
          ergebnis: displayErgebnis,
          typ: e.typ,
          standort: e.standort
        };
      });
  };

  const handleExportStatistik = () => {
    // Hier könnte PDF-Export implementiert werden
    logDebug('Export Statistik');
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
          <CardTitle>Statistik-Anzeige</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
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
                className="text-lg h-12"
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
                className="text-lg h-12"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Target className="h-4 w-4" />
                Ergebnis-Anzeige
              </label>
              <NativeSelect
                value={ergebnisTyp}
                onValueChange={setErgebnisTyp}
                options={[
                  { value: "auto", label: "🎯 Intelligent (beste verfügbare)" },
                  { value: "zehntel", label: "🎯 Nur Zehntel-Ringe" },
                  { value: "ganze", label: "🎯 Nur ganze Ringe" }
                ]}
                className="text-lg h-12"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {ergebnisTyp === "auto" ? "Zeigt Zehntel wenn vorhanden, sonst ganze Ringe" : 
                 ergebnisTyp === "zehntel" ? "Lücken in Grafik bei fehlenden Zehntel-Werten" : "Konsistente Anzeige nur ganzer Ringe"}
              </p>
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
              <CardDescription>
                {ergebnisTyp === "auto" ? "🧠 Intelligente Anzeige: Zehntel-Ringe wenn verfügbar, sonst ganze Ringe" : 
                 ergebnisTyp === "zehntel" ? "🎯 Präzisions-Modus: Nur Zehntel-Ringe (Lücken bei fehlenden Werten)" : "🔢 Standard-Modus: Nur ganze Ringe"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leistungsdaten}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="datum" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, _name, props) => {
                        if (value === null) return ['Kein Wert', 'Fehlend'];
                        return [
                          `${value} Ringe`,
                          props.payload.typ === 'training' ? '🎯 Training' : '🏆 Wettkampf'
                        ];
                      }}
                      labelFormatter={(label) => `📅 ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ringe" 
                      stroke="#0088FE" 
                      name="Ringzahl"
                      strokeWidth={2}
                      dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Aktivitäts-Verteilung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Training vs Wettkampf

                </CardTitle>
                <CardDescription>Verteilung und Durchschnittsergebnisse</CardDescription>
              </CardHeader>
              <CardContent>
                {true ? (
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
                      // Einfache Trend-Analyse ohne Premium-Service
                      const filtered = getFilteredData();
                      const trainings = filtered.filter(e => e.typ === 'training');
                      const wettkämpfe = filtered.filter(e => e.typ === 'wettkampf');
                      
                      const avgTraining = trainings.length > 0 
                        ? trainings.reduce((sum, e) => sum + (e.ergebnis || e.ergebnisGanzeRinge || 0), 0) / trainings.length
                        : 0;
                      const avgWettkampf = wettkämpfe.length > 0 
                        ? wettkämpfe.reduce((sum, e) => sum + (e.ergebnis || e.ergebnisGanzeRinge || 0), 0) / wettkämpfe.length
                        : 0;
                      
                      const trend = avgWettkampf > avgTraining ? 'steigend' : avgWettkampf < avgTraining ? 'fallend' : 'stabil';
                      const trendDescription = trend === 'steigend' ? 'Wettkampf besser' : 
                                             trend === 'fallend' ? 'Training besser' : 'Ausgeglichen';
                      
                      return (
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🎯 Analyse</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-blue-700 dark:text-blue-300">Trend:</span>
                              <span className={`ml-2 font-medium ${
                                trend === 'steigend' ? 'text-green-600' :
                                trend === 'fallend' ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {trend === 'steigend' ? '📈' : 
                                 trend === 'fallend' ? '📉' : '➡️'} 
                                {trendDescription}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-700 dark:text-blue-300">Aktivität:</span>
                              <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                                {filtered.length} Einträge
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                    }
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Disziplinen-Verteilung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Disziplinen-Verteilung

                </CardTitle>
                <CardDescription>Häufigkeit der verschiedenen Disziplinen</CardDescription>
              </CardHeader>
              <CardContent>
                {true ? (
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
                          {disziplinendaten.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Erweiterte Analysen */}
          {(() => {
            const filtered = getFilteredData();
            const disziplinStats = [...new Set(filtered.map(e => e.disziplin))].map(disziplin => {
              const entries = filtered.filter(e => e.disziplin === disziplin);
              const avg = entries.reduce((sum, e) => sum + (e.ergebnis || e.ergebnisGanzeRinge || 0), 0) / entries.length;
              return { disziplin, durchschnitt: avg.toFixed(1), anzahl: entries.length };
            }).sort((a, b) => parseFloat(b.durchschnitt) - parseFloat(a.durchschnitt));
            
            const weeklyData = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
              .map((day, index) => ({
                day,
                count: filtered.filter(e => new Date(e.datum).getDay() === (index + 1) % 7).length
              }));
            
            return (
              <div className="space-y-6">
                {/* Disziplin-Vergleich */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🏆 Disziplin-Leistungsvergleich
                    </CardTitle>
                    <CardDescription>Ihre Stärken und Schwächen im Überblick</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {disziplinStats.slice(0, 5).map((stat, index) => (
                        <div key={stat.disziplin} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{stat.disziplin}</div>
                              <div className="text-sm text-muted-foreground">{stat.anzahl} Einträge</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{stat.durchschnitt}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Wochenmuster */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Wochenmuster-Analyse
                    </CardTitle>
                    <CardDescription>An welchen Wochentagen schießen Sie am häufigsten?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
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
