"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useKMAuth } from '@/hooks/useKMAuth';

export default function KMUebersicht() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading } = useKMAuth();
  const [data, setData] = useState({
    meldungen: [],
    schuetzen: [],
    disziplinen: [],
    clubs: []
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    meldungen: 'loading',
    schuetzen: 'loading',
    disziplinen: 'loading',
    clubs: 'loading'
  });

  useEffect(() => {
    if (hasKMAccess && !authLoading) {
      loadData();
    }
  }, [hasKMAccess, authLoading]);

  const loadData = async () => {
    try {
      const [meldungenRes, schuetzenRes, disziplinenRes, clubsRes] = await Promise.all([
        fetch('/api/km/meldungen'),
        fetch('/api/km/shooters'),
        fetch('/api/km/disziplinen'),
        fetch('/api/clubs')
      ]);

      setStatus({
        meldungen: meldungenRes.status.toString(),
        schuetzen: schuetzenRes.status.toString(),
        disziplinen: disziplinenRes.status.toString(),
        clubs: clubsRes.status.toString()
      });

      if (meldungenRes.ok) {
        const meldungenData = await meldungenRes.json();
        setData(prev => ({ ...prev, meldungen: meldungenData.data || [] }));
      }

      if (schuetzenRes.ok) {
        const schuetzenData = await schuetzenRes.json();
        setData(prev => ({ ...prev, schuetzen: schuetzenData.data || [] }));
      }

      if (disziplinenRes.ok) {
        const disziplinenData = await disziplinenRes.json();
        setData(prev => ({ ...prev, disziplinen: disziplinenData.data || [] }));
      }

      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        setData(prev => ({ ...prev, clubs: clubsData.data || [] }));
      }
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: 'Daten konnten nicht geladen werden', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Lade KM-Übersicht...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-4">
            Sie haben keine Berechtigung für den KM-Bereich.
          </p>
        </div>
      </div>
    );
  }

  const stats = {
    totalMeldungen: data.meldungen.length,
    totalSchuetzen: data.schuetzen.length,
    totalDisziplinen: data.disziplinen.length,
    totalClubs: data.clubs.length,
    lmMeldungen: data.meldungen.filter((m: any) => m.lmTeilnahme).length,
    vmErgebnisse: data.meldungen.filter((m: any) => m.vmErgebnis).length
  };

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">📊 KM-Übersicht</h1>
        <p className="text-muted-foreground">
          Statistiken und Übersicht der Kreismeisterschaft 2026
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalMeldungen}</div>
            <div className="text-sm text-gray-600">Gesamtmeldungen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.lmMeldungen}</div>
            <div className="text-sm text-gray-600">LM-Meldungen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.vmErgebnisse}</div>
            <div className="text-sm text-gray-600">VM-Ergebnisse</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Meldungen API:</span>
                <span className={status.meldungen === '200' ? 'text-green-600' : 'text-red-600'}>
                  {status.meldungen === '200' ? '✅ OK' : '❌ Fehler'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Schützen API:</span>
                <span className={status.schuetzen === '200' ? 'text-green-600' : 'text-red-600'}>
                  {status.schuetzen === '200' ? '✅ OK' : '❌ Fehler'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Disziplinen API:</span>
                <span className={status.disziplinen === '200' ? 'text-green-600' : 'text-red-600'}>
                  {status.disziplinen === '200' ? '✅ OK' : '❌ Fehler'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Vereine API:</span>
                <span className={status.clubs === '200' ? 'text-green-600' : 'text-red-600'}>
                  {status.clubs === '200' ? '✅ OK' : '❌ Fehler'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disziplinen-Statistik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.disziplinen.slice(0, 5).map((disziplin: any) => {
                const count = data.meldungen.filter((m: any) => m.disziplinId === disziplin.id).length;
                return (
                  <div key={disziplin.id} className="flex justify-between">
                    <span className="text-sm">{disziplin.spoNummer} - {disziplin.name}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}