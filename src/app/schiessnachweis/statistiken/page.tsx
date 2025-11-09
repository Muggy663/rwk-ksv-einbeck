"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { ArrowLeft, TrendingUp, Calendar, Target, Trophy, Download } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießEintrag, DISZIPLIN_NAMES } from "@/types/schiessnachweis";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { de } from "date-fns/locale";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function StatistikenPage() {
  const [einträge, setEinträge] = useState<SchießEintrag[]>([]);
  const [filterDisziplin, setFilterDisziplin] = useState<string>("alle");
  const [filterZeitraum, setFilterZeitraum] = useState<string>("12monate");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setIsLoading(true);
    try {
      const data = SchießnachweisService.getEinträge();
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
        startDate = subMonths(now, 12);
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
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthData = filtered.filter(e => 
        e.datum >= monthStart && e.datum <= monthEnd
      );
      
      const avgErgebnis = monthData.length > 0 
        ? monthData.reduce((sum, e) => sum + e.ergebnis, 0) / monthData.length
        : 0;
      
      const trainings = monthData.filter(e => e.typ === 'training').length;
      const wettkämpfe = monthData.filter(e => e.typ === 'wettkampf').length;
      
      return {
        monat: format(month, 'MMM yyyy', { locale: de }),
        durchschnitt: Math.round(avgErgebnis * 10) / 10,
        trainings,
        wettkämpfe,
        gesamt: monthData.length
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
      .sort((a, b) => b.ergebnis - a.ergebnis)
      .slice(0, 5)
      .map((e, index) => ({
        rang: index + 1,
        datum: format(e.datum, 'dd.MM.yyyy', { locale: de }),
        disziplin: e.disziplin,
        ergebnis: e.ergebnis,
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
                onChange={setFilterDisziplin}
              >
                <option value="alle">Alle Disziplinen</option>
                {DISZIPLIN_NAMES.map(disziplin => (
                  <option key={disziplin} value={disziplin}>
                    {disziplin}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Zeitraum</label>
              <NativeSelect
                value={filterZeitraum}
                onChange={setFilterZeitraum}
              >
                <option value="1monat">Letzter Monat</option>
                <option value="3monate">Letzte 3 Monate</option>
                <option value="6monate">Letzte 6 Monate</option>
                <option value="12monate">Letztes Jahr</option>
                <option value="alle">Alle Zeit</option>
              </NativeSelect>
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
              <CardDescription>Durchschnittliche Ergebnisse über die Zeit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leistungsdaten}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monat" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="durchschnitt" 
                      stroke="#0088FE" 
                      name="Ø Ergebnis"
                      strokeWidth={2}
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
                <CardTitle>Training vs Wettkampf</CardTitle>
                <CardDescription>Verteilung und Durchschnittsergebnisse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aktivitätsdaten}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="anzahl" fill="#0088FE" name="Anzahl" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Disziplinen-Verteilung */}
            <Card>
              <CardHeader>
                <CardTitle>Disziplinen-Verteilung</CardTitle>
                <CardDescription>Häufigkeit der verschiedenen Disziplinen</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

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
                          <div className="font-medium">{result.ergebnis} Ringe</div>
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