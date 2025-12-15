"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Trophy, Medal, Upload, FileText, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKMAuth } from '@/hooks/useKMAuth';
import Link from 'next/link';

interface Meldung {
  id: string;
  schuetzenName: string;
  vereinsname: string;
  disziplin: string;
  kmErgebnis?: {
    ringe: number;
    teiler?: number;
    platz_disziplin?: number;
    platz_altersklasse?: number;
    serien?: number[][];
  };
}

export default function KMErgebnissePage() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading } = useKMAuth();
  const [meldungen, setMeldungen] = useState<Meldung[]>([]);
  const [selectedDisziplin, setSelectedDisziplin] = useState<string>('');
  const [disziplinen, setDisziplinen] = useState<string[]>([]);
  const [selectedJahr, setSelectedJahr] = useState<string>('');
  const [jahre, setJahre] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});
  const [seriesInputs, setSeriesInputs] = useState<{[key: string]: string}>({});

  // Lade Saisons
  useEffect(() => {
    const loadSaisons = async () => {
      try {
        const response = await fetch('/api/km/saisons');
        if (response.ok) {
          const data = await response.json();
          const saisonData = (data.data || []).map(saison => ({
            id: saison.id,
            name: saison.name
          }));
          setJahre(saisonData);
          if (saisonData.length > 0 && !selectedJahr) {
            setSelectedJahr(saisonData[0].id);
          }
        }
      } catch (error) {
        logError('Fehler beim Laden der Saisons:', error);
      }
    };
    loadSaisons();
  }, []);

  useEffect(() => {
    if (!hasKMAccess || authLoading || !selectedJahr) return;
    
    const loadData = async () => {
      try {
        const [meldungenRes, schuetzenRes, disziplinenRes, clubsRes] = await Promise.all([
          fetch(`/api/km/meldungen?saison=${selectedJahr}`),
          fetch('/api/km/shooters'),
          fetch('/api/km/disziplinen'),
          fetch('/api/clubs')
        ]);
        
        const kmErgebnisseRes = await fetch('/api/km/ergebnisse');
        const kmErgebnisseData = kmErgebnisseRes.ok ? (await kmErgebnisseRes.json()).data || [] : [];
        
        const meldungenData = meldungenRes.ok ? (await meldungenRes.json()).data || [] : [];
        const schuetzenData = schuetzenRes.ok ? (await schuetzenRes.json()).data || [] : [];
        const disziplinenData = disziplinenRes.ok ? (await disziplinenRes.json()).data || [] : [];
        const clubsData = clubsRes.ok ? (await clubsRes.json()).data || [] : [];
        
        const meldungenDataProcessed: Meldung[] = [];
        const disziplinenSet = new Set<string>();

        const kmErgebnisseMap = new Map();
        kmErgebnisseData.forEach(data => {
          kmErgebnisseMap.set(data.meldung_id, {
            ringe: data.ergebnis_ringe,
            teiler: data.ergebnis_teiler,
            platz_disziplin: data.platz_disziplin,
            platz_altersklasse: data.platz_altersklasse,
            serien: data.serien || []
          });
        });

        const schuetzenMap = new Map();
        const disziplinenMap = new Map();
        const clubsMap = new Map();
        
        schuetzenData.forEach(schuetze => {
          const fullName = schuetze.firstName && schuetze.lastName 
            ? `${schuetze.firstName} ${schuetze.lastName}`
            : schuetze.name || 'Unbekannt';
          schuetzenMap.set(schuetze.id, {
            name: fullName,
            clubId: schuetze.kmClubId || schuetze.rwkClubId || schuetze.clubId
          });
        });
        
        disziplinenData.forEach(disziplin => {
          disziplinenMap.set(disziplin.id, disziplin.name);
        });
        
        clubsData.forEach(club => {
          clubsMap.set(club.id, club.name);
        });

        meldungenData.forEach(meldung => {
          const schuetze = schuetzenMap.get(meldung.schuetzeId);
          const disziplinName = disziplinenMap.get(meldung.disziplinId) || 'Unbekannte Disziplin';
          
          let vereinsname = meldung.vereinsname || 'Unbekannter Verein';
          if (!meldung.vereinsname && schuetze && schuetze.clubId) {
            vereinsname = clubsMap.get(schuetze.clubId) || 'Unbekannter Verein';
          }
          
          meldungenDataProcessed.push({
            id: meldung.id,
            schuetzenName: schuetze ? schuetze.name : 'Unbekannter Schütze',
            vereinsname: vereinsname,
            disziplin: disziplinName,
            kmErgebnis: kmErgebnisseMap.get(meldung.id)
          });
          disziplinenSet.add(disziplinName);
        });

        setMeldungen(meldungenDataProcessed);
        setDisziplinen(Array.from(disziplinenSet).sort());

      } catch (error) {
        logError('Fehler beim Laden:', error);
        toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [hasKMAccess, authLoading, selectedJahr, toast]);

  // Disziplin-spezifische Schusszahlen
  const getDisciplineShots = (disziplinName: string) => {
    const disciplineMap = {
      'Luftgewehr': 40,
      'Luftgewehr Auflage': 30,
      'KK-Gewehr Auflage 50m': 30,
      'KK Gewehr Auflage 100m': 30,
      'KK - Gewehr 30 Schuss': 30,
      'KK - Liegendkampf': 60,
      '10m Luftpistole': 40,
      '10 m Luftpistole Auflage': 40,
      'Zimmerstutzen': 30,
      'Zimmerstutzen Auflage': 30
    };
    return disciplineMap[disziplinName] || 30;
  };

  // Serien-Definition für Meisterschaften (immer 10 Schuss pro Serie)
  const getSeriesInfo = (disziplinName: string) => {
    const seriesMap = {
      'Luftgewehr': { count: 4, shotsPerSeries: 10 }, // 4 Serien à 10 Schuss
      'Luftgewehr Auflage': { count: 3, shotsPerSeries: 10 }, // 3 Serien à 10 Schuss
      'KK-Gewehr Auflage 50m': { count: 3, shotsPerSeries: 10 }, // 3 Serien à 10 Schuss
      'KK Gewehr Auflage 100m': { count: 3, shotsPerSeries: 10 }, // 3 Serien à 10 Schuss
      'KK - Gewehr 30 Schuss': { count: 3, shotsPerSeries: 10 }, // 3 Serien à 10 Schuss
      'KK - Liegendkampf': { count: 6, shotsPerSeries: 10 }, // 6 Serien à 10 Schuss
      '10m Luftpistole': { count: 4, shotsPerSeries: 10 }, // 4 Serien à 10 Schuss
      '10 m Luftpistole Auflage': { count: 4, shotsPerSeries: 10 }, // 4 Serien à 10 Schuss
      'Zimmerstutzen': { count: 3, shotsPerSeries: 10 }, // 3 Serien à 10 Schuss
      'Zimmerstutzen Auflage': { count: 3, shotsPerSeries: 10 } // 3 Serien à 10 Schuss
    };
    return seriesMap[disziplinName] || { count: 3, shotsPerSeries: 10 };
  };

  const calculateTotalFromSeries = (series: number[][]) => {
    return series.flat().reduce((sum, shot) => sum + shot, 0);
  };

  const parseInput = (value: string) => {
    if (!value) return { ringe: 0, teiler: 0 };
    const parts = value.replace(',', '.').split('.');
    const ringe = parseInt(parts[0]) || 0;
    const teiler = parts[1] ? parseInt(parts[1]) || 0 : 0;
    return { ringe, teiler };
  };

  const handleErgebnisChange = (meldungId: string, field: 'ringe' | 'teiler', value: string) => {
    setMeldungen(prev => prev.map(m => {
      if (m.id === meldungId) {
        const kmErgebnis = m.kmErgebnis || { ringe: 0 };
        return {
          ...m,
          kmErgebnis: {
            ...kmErgebnis,
            [field]: field === 'ringe' ? parseInt(value) || 0 : parseInt(value) || 0
          }
        };
      }
      return m;
    }));
  };

  const handleSave = async (meldungId: string) => {
    const meldung = meldungen.find(m => m.id === meldungId);
    if (!meldung?.kmErgebnis?.ringe) {
      toast({ title: 'Fehler', description: 'Kein Ergebnis zum Speichern vorhanden.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const ergebnisData = {
        meldung_id: meldungId,
        ergebnis_ringe: meldung.kmErgebnis.ringe,
        ergebnis_teiler: meldung.kmErgebnis.teiler || 0,
        serien: meldung.kmErgebnis.serien || [],
        platz_disziplin: meldung.kmErgebnis.platz_disziplin || 0,
        platz_altersklasse: meldung.kmErgebnis.platz_altersklasse || 0,
        eingegeben_am: new Date().toISOString(),
        eingegeben_von: 'km-admin'
      };

      logDebug('💾 Speichere KM-Ergebnis:', ergebnisData);

      const response = await fetch('/api/km/ergebnisse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ergebnisData)
      });
      
      if (response.ok) {
        const result = await response.json();
        logDebug('✅ Erfolgreich gespeichert:', result);
        toast({ 
          title: '✅ Gespeichert!', 
          description: `${meldung.schuetzenName}: ${meldung.kmErgebnis.ringe} Ringe ${result.created ? 'neu erstellt' : 'aktualisiert'}`,
          className: 'border-green-500 bg-green-50'
        });
      } else {
        const errorText = await response.text();
        logError('❌ API Fehler:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      logError('❌ Speichern fehlgeschlagen:', error);
      toast({ 
        title: '❌ Speichern fehlgeschlagen', 
        description: `${meldung.schuetzenName}: ${error.message || 'Unbekannter Fehler'}`,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredMeldungen = selectedDisziplin && selectedDisziplin !== 'ALL_DISCIPLINES'
    ? meldungen.filter(m => m.disziplin === selectedDisziplin)
    : meldungen;

  if (loading || authLoading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade KM-Ergebnisse...</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <Link href="/km-orga" className="text-primary hover:text-primary/80">← Zurück</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 md:px-4 py-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/km-orga">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-primary">🏆 KM-Ergebnisse erfassen</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Kreismeisterschafts-Ergebnisse nach dem Wettkampf erfassen für automatische Ergebnislisten
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter & Aktionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Jahr/Saison</Label>
              <Select value={selectedJahr} onValueChange={setSelectedJahr}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jahre.map(jahr => (
                    <SelectItem key={jahr.id} value={jahr.id}>{jahr.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Disziplin</Label>
              <Select value={selectedDisziplin} onValueChange={setSelectedDisziplin}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Disziplinen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_DISCIPLINES">Alle Disziplinen</SelectItem>
                  {disziplinen.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KM-Ergebnisse ({filteredMeldungen.length} Meldungen)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMeldungen.map(meldung => (
              <Card key={meldung.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{meldung.schuetzenName}</div>
                      <div className="text-sm text-muted-foreground">{meldung.vereinsname}</div>
                    </div>
                    <Badge variant="outline">{meldung.disziplin}</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {(() => {
                      const shots = getDisciplineShots(meldung.disziplin);
                      const seriesInfo = getSeriesInfo(meldung.disziplin);
                      const currentSeries = meldung.kmErgebnis?.serien || Array(seriesInfo.count).fill(null).map(() => []);
                      
                      return (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">
                            {meldung.disziplin}: {shots} Schuss in {seriesInfo.count} Serien à {seriesInfo.shotsPerSeries}
                          </Label>
                          {Array.from({ length: seriesInfo.count }, (_, serieIndex) => (
                            <div key={serieIndex}>
                              <Label className="text-xs">Serie {serieIndex + 1} ({seriesInfo.shotsPerSeries} Schuss)</Label>
                              <Input
                                type="text"
                                value={seriesInputs[`${meldung.id}-${serieIndex}`] || ''}
                                onChange={(e) => {
                                  const inputKey = `${meldung.id}-${serieIndex}`;
                                  setSeriesInputs(prev => ({ ...prev, [inputKey]: e.target.value }));
                                }}
                                onBlur={(e) => {
                                  const values = e.target.value.split(/[\s]+/).map(v => {
                                    const num = parseFloat(v.trim().replace(',', '.'));
                                    return (!isNaN(num) && num >= 0 && num <= 109) ? num : null;
                                  }).filter(v => v !== null).slice(0, seriesInfo.shotsPerSeries);
                                  
                                  const newSeries = [...currentSeries];
                                  newSeries[serieIndex] = values;
                                  const total = calculateTotalFromSeries(newSeries);
                                  
                                  setMeldungen(prev => prev.map(m => {
                                    if (m.id === meldung.id) {
                                      return {
                                        ...m,
                                        kmErgebnis: {
                                          ...m.kmErgebnis,
                                          serien: newSeries,
                                          ringe: total
                                        }
                                      };
                                    }
                                    return m;
                                  }));
                                }}
                                placeholder=""
                                className="text-xs h-8"
                              />
                              {currentSeries[serieIndex] && currentSeries[serieIndex].length > 0 && (
                                <div className="text-xs text-blue-600">
                                  {currentSeries[serieIndex].length}/{seriesInfo.shotsPerSeries} Schuss = {currentSeries[serieIndex].reduce((sum, val) => sum + val, 0)} Ringe
                                </div>
                              )}
                            </div>
                          ))}
                          {meldung.kmErgebnis?.serien && (
                            <div className="text-sm font-semibold text-green-600 p-2 bg-green-50 rounded">
                              Gesamtergebnis: {calculateTotalFromSeries(meldung.kmErgebnis.serien)} Ringe
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    
                    <div>
                      <Label className="text-xs">Ergebnis (Ringe.Zehntel)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={inputValues[meldung.id] ?? (meldung.kmErgebnis ? `${meldung.kmErgebnis.ringe}${meldung.kmErgebnis.teiler ? ',' + meldung.kmErgebnis.teiler : ''}` : '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            setInputValues(prev => ({ ...prev, [meldung.id]: value }));
                            
                            if (value && !value.endsWith(',') && !value.endsWith('.')) {
                              const { ringe, teiler } = parseInput(value);
                              handleErgebnisChange(meldung.id, 'ringe', ringe.toString());
                              handleErgebnisChange(meldung.id, 'teiler', teiler.toString());
                            }
                          }}
                          className="flex-1"
                          placeholder=""
                        />
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            onClick={() => handleSave(meldung.id)}
                            disabled={saving || !meldung.kmErgebnis?.ringe}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {saving ? '💾' : '✅'}
                          </Button>
                          {meldung.kmErgebnis?.ringe && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setMeldungen(prev => prev.map(m => {
                                  if (m.id === meldung.id) {
                                    return {
                                      ...m,
                                      kmErgebnis: {
                                        ringe: 0,
                                        teiler: 0,
                                        serien: []
                                      }
                                    };
                                  }
                                  return m;
                                }));
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              🗑️
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
