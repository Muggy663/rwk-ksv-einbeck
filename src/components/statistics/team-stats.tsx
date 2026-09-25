"use client";

// Mannschafts-Statistik: zeigt alle Schützen einer Mannschaft einer Saison/Liga
// auf einer Seite – mit Kennzahlen (Summe, Schnitt, Spanne, bestes/schlechtestes
// Ergebnis, Anzahl Durchgänge) und je Schütze einem kleinen Verlaufsdiagramm über
// die Durchgänge. Nutzt die vorhandene fetchShooterPerformanceData-Logik.

import { useState, useEffect, useMemo } from 'react';
import { logError } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, Sun, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  fetchSeasons,
  fetchLeagues,
  fetchShooterPerformanceData,
  type ShooterPerformanceData,
} from '@/lib/services/statistics-service';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ReferenceLine,
} from 'recharts';

interface SeasonOpt { id: string; name: string; }
interface LeagueOpt { id: string; name: string; }

// Aus results {dg1: 380, dg2: null, ...} die vorhandenen Durchgänge sortiert ziehen.
function durchgaenge(results: { [key: string]: number | null }): { dg: number; ringe: number }[] {
  return Object.entries(results)
    .map(([key, val]) => ({ dg: parseInt(key.replace('dg', ''), 10), ringe: typeof val === 'number' ? val : NaN }))
    .filter(x => !isNaN(x.dg) && !isNaN(x.ringe))
    .sort((a, b) => a.dg - b.dg);
}

export function TeamStats() {
  const { toast } = useToast();
  const [seasons, setSeasons] = useState<SeasonOpt[]>([]);
  const [leagues, setLeagues] = useState<LeagueOpt[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [shooters, setShooters] = useState<ShooterPerformanceData[]>([]);
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Saisons laden
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchSeasons();
        setSeasons(data.map((s: any) => ({ id: s.id, name: s.name })));
      } catch (e) {
        logError('Saisons laden fehlgeschlagen:', e);
      }
    })();
  }, []);

  // Ligen laden, wenn Saison gewählt
  useEffect(() => {
    if (!selectedSeason) { setLeagues([]); return; }
    setIsLoadingLeagues(true);
    setSelectedLeague('');
    setSelectedTeam('');
    setShooters([]);
    (async () => {
      try {
        const data = await fetchLeagues(selectedSeason);
        setLeagues(data.map((l: any) => ({ id: l.id, name: l.name })));
      } catch (e) {
        logError('Ligen laden fehlgeschlagen:', e);
      } finally {
        setIsLoadingLeagues(false);
      }
    })();
  }, [selectedSeason]);

  // Schützendaten der Liga laden, wenn Liga gewählt
  useEffect(() => {
    if (!selectedSeason || !selectedLeague) { setShooters([]); setSelectedTeam(''); return; }
    setIsLoading(true);
    setSelectedTeam('');
    (async () => {
      try {
        const data = await fetchShooterPerformanceData(selectedSeason, selectedLeague);
        setShooters(data);
      } catch (e) {
        logError('Schützendaten laden fehlgeschlagen:', e);
        toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedSeason, selectedLeague, toast]);

  // Mannschaften (Teamnamen) aus den geladenen Schützen ableiten.
  const teamNames = useMemo(() => {
    const set = new Set<string>();
    shooters.forEach(s => { if (s.teamName) set.add(s.teamName); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [shooters]);

  // Schützen der gewählten Mannschaft.
  const teamShooters = useMemo(
    () => shooters.filter(s => s.teamName === selectedTeam),
    [shooters, selectedTeam]
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Mannschafts-Statistik
        </CardTitle>
        <CardDescription>
          Alle Schützen einer Mannschaft auf einen Blick – mit Kennzahlen und Verlauf über die Durchgänge.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auswahl */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Saison</Label>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger><SelectValue placeholder="Saison wählen" /></SelectTrigger>
              <SelectContent>
                {seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Liga</Label>
            <Select value={selectedLeague} onValueChange={setSelectedLeague} disabled={!selectedSeason || isLoadingLeagues}>
              <SelectTrigger><SelectValue placeholder={isLoadingLeagues ? 'Lade Ligen…' : 'Liga wählen'} /></SelectTrigger>
              <SelectContent>
                {leagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mannschaft</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam} disabled={!selectedLeague || isLoading || teamNames.length === 0}>
              <SelectTrigger><SelectValue placeholder={isLoading ? 'Lade…' : (teamNames.length === 0 ? 'Keine Mannschaften' : 'Mannschaft wählen')} /></SelectTrigger>
              <SelectContent>
                {teamNames.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <p>Daten werden geladen…</p>
          </div>
        )}

        {!isLoading && selectedTeam && teamShooters.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Für diese Mannschaft wurden keine Einzelergebnisse gefunden.
          </p>
        )}

        {/* Schützen der Mannschaft */}
        {!isLoading && selectedTeam && teamShooters.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{selectedTeam}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teamShooters
                .slice()
                .sort((a, b) => b.averageScore - a.averageScore)
                .map(shooter => {
                  const dgs = durchgaenge(shooter.results);
                  const ringe = dgs.map(d => d.ringe);
                  const best = ringe.length ? Math.max(...ringe) : 0;
                  const worst = ringe.length ? Math.min(...ringe) : 0;
                  const spanne = ringe.length ? best - worst : 0;
                  const chartData = dgs.map(d => ({ label: `DG${d.dg}`, ringe: d.ringe }));

                  return (
                    <div key={shooter.shooterId} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-baseline justify-between gap-2">
                        <h4 className="font-semibold">{shooter.shooterName}</h4>
                        <span className="text-sm text-muted-foreground">{shooter.roundsShot}x</span>
                      </div>

                      {/* Kennzahlen */}
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">∑ Summe</div>
                          <div className="font-semibold">{shooter.totalScore}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">∅ Schnitt</div>
                          <div className="font-semibold">{shooter.averageScore.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">∆ Spanne</div>
                          <div className="font-semibold">{spanne}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sun className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-semibold">{best}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Cloud className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold">{worst}</span>
                        </div>
                      </div>

                      {/* Verlaufsdiagramm */}
                      {chartData.length > 0 && (
                        <div className="h-[160px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="label" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
                              <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} domain={['auto', 'auto']} />
                              <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(v) => [`${v} Ringe`, '']}
                              />
                              <Line type="monotone" dataKey="ringe" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Ringe" />
                              <ReferenceLine y={shooter.averageScore} stroke="hsl(var(--accent))" strokeDasharray="3 3" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Durchgangswerte zum Nachvollziehen */}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {dgs.map(d => `DG${d.dg}: ${d.ringe}`).join('  •  ')}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
