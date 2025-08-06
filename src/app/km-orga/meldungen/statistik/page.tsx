"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useKMAuth } from '@/hooks/useKMAuth';

export default function KMMeldungenStatistik() {
  const { toast } = useToast();
  const { hasFullAccess, loading: authLoading } = useKMAuth();
  const [meldungen, setMeldungen] = useState<any[]>([]);
  const [schuetzen, setSchuetzen] = useState<any[]>([]);
  const [disziplinen, setDisziplinen] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);

  useEffect(() => {
    if (hasFullAccess && !authLoading) {
      loadData();
    }
  }, [hasFullAccess, authLoading, selectedYear]);

  const loadData = async () => {
    try {
      const [meldungenRes, schuetzenRes, disziplinenRes, clubsRes] = await Promise.all([
        fetch(`/api/km/meldungen?jahr=${selectedYear}`),
        fetch('/api/shooters'),
        fetch('/api/km/disziplinen'),
        fetch('/api/clubs')
      ]);
      
      if (meldungenRes.ok) {
        const data = await meldungenRes.json();
        setMeldungen(data.data || []);
      }

      if (schuetzenRes.ok) {
        const data = await schuetzenRes.json();
        setSchuetzen(data.data || []);
      }

      if (disziplinenRes.ok) {
        const data = await disziplinenRes.json();
        setDisziplinen(data.data || []);
      }

      if (clubsRes.ok) {
        const data = await clubsRes.json();
        setClubs(data.data || []);
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Statistiken berechnen
  const getStatistics = () => {
    const stats = {
      totalMeldungen: meldungen.length,
      vereineCount: new Set(meldungen.map(m => {
        const schuetze = schuetzen.find(s => s.id === m.schuetzeId);
        return schuetze?.kmClubId || schuetze?.rwkClubId || schuetze?.clubId;
      }).filter(Boolean)).size,
      lmTeilnehmer: meldungen.filter(m => m.lmTeilnahme).length,
      vmErgebnisse: meldungen.filter(m => m.vmErgebnis?.ringe).length,
      byDisziplin: {} as Record<string, number>,
      byVerein: {} as Record<string, number>,
      byAltersklasse: {} as Record<string, number>
    };

    // Nach Disziplin
    meldungen.forEach(meldung => {
      const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
      if (disziplin) {
        const key = `${disziplin.spoNummer} - ${disziplin.name}`;
        stats.byDisziplin[key] = (stats.byDisziplin[key] || 0) + 1;
      }
    });

    // Nach Verein
    meldungen.forEach(meldung => {
      const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
      const vereinId = schuetze?.kmClubId || schuetze?.rwkClubId || schuetze?.clubId;
      const verein = clubs.find(c => c.id === vereinId);
      if (verein) {
        stats.byVerein[verein.name] = (stats.byVerein[verein.name] || 0) + 1;
      }
    });

    // Nach Altersklasse
    meldungen.forEach(meldung => {
      const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
      const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
      
      if (schuetze?.birthYear && schuetze?.gender && disziplin) {
        try {
          const { calculateKMWettkampfklasse } = require('@/types/km');
          const altersklasse = calculateKMWettkampfklasse(
            schuetze.birthYear, 
            schuetze.gender, 
            selectedYear, 
            disziplin.auflage || false
          );
          stats.byAltersklasse[altersklasse] = (stats.byAltersklasse[altersklasse] || 0) + 1;
        } catch (error) {
          console.warn('Altersklasse calculation failed:', error);
        }
      }
    });

    return stats;
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade Meldungs-Statistiken...</p>
        </div>
      </div>
    );
  }

  if (!hasFullAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <Link href="/km-orga" className="text-primary hover:text-primary/80">← Zurück</Link>
        </div>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">📊 Meldungs-Statistiken {selectedYear}</h1>
          <p className="text-muted-foreground">Übersicht über alle KM-Meldungen {selectedYear}</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium"
        >
          <option value={2026}>KM 2026</option>
          <option value={2027}>KM 2027</option>
          <option value={2028}>KM 2028</option>
        </select>
      </div>

      <div className="mb-4">
        <Link href="/km-orga/meldungen">
          <Button variant="outline">← Zurück zu allen Meldungen</Button>
        </Link>
      </div>

      {/* Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gesamt Meldungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalMeldungen}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Teilnehmende Vereine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.vereineCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">LM-Teilnehmer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.lmTeilnehmer}</div>
            <div className="text-xs text-gray-500">
              {stats.totalMeldungen > 0 ? Math.round((stats.lmTeilnehmer / stats.totalMeldungen) * 100) : 0}% der Meldungen
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">VM-Ergebnisse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.vmErgebnisse}</div>
            <div className="text-xs text-gray-500">
              {stats.totalMeldungen > 0 ? Math.round((stats.vmErgebnisse / stats.totalMeldungen) * 100) : 0}% mit VM-Ergebnis
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meldungen nach Disziplin */}
        <Card>
          <CardHeader>
            <CardTitle>Meldungen nach Disziplin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(stats.byDisziplin)
                .sort(([,a], [,b]) => b - a)
                .map(([disziplin, count]) => (
                  <div key={disziplin} className="flex justify-between items-center py-1">
                    <span className="text-sm">{disziplin}</span>
                    <span className="font-medium text-blue-600">{count}</span>
                  </div>
                ))}
              {Object.keys(stats.byDisziplin).length === 0 && (
                <div className="text-center py-4 text-gray-500">Keine Daten verfügbar</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Meldungen nach Verein */}
        <Card>
          <CardHeader>
            <CardTitle>Meldungen nach Verein</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(stats.byVerein)
                .sort(([,a], [,b]) => b - a)
                .map(([verein, count]) => (
                  <div key={verein} className="flex justify-between items-center py-1">
                    <span className="text-sm">{verein}</span>
                    <span className="font-medium text-green-600">{count}</span>
                  </div>
                ))}
              {Object.keys(stats.byVerein).length === 0 && (
                <div className="text-center py-4 text-gray-500">Keine Daten verfügbar</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Meldungen nach Altersklasse */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Meldungen nach Altersklasse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(stats.byAltersklasse)
                .sort(([,a], [,b]) => b - a)
                .map(([altersklasse, count]) => (
                  <div key={altersklasse} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">{altersklasse}</div>
                    <div className="text-lg font-bold text-purple-600">{count}</div>
                  </div>
                ))}
              {Object.keys(stats.byAltersklasse).length === 0 && (
                <div className="col-span-full text-center py-4 text-gray-500">Keine Daten verfügbar</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}