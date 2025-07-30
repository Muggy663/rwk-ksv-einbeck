"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useKMAuth } from '@/hooks/useKMAuth';

export default function KMUebersicht() {
  const { toast } = useToast();
  const { hasKMAccess, userClubIds, loading: authLoading } = useKMAuth();
  const [meldungen, setMeldungen] = useState<any[]>([]);
  const [schuetzen, setSchuetzen] = useState<any[]>([]);
  const [disziplinen, setDisziplinen] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [filter, setFilter] = useState({ verein: '', disziplin: '', search: '' });

  useEffect(() => {
    console.log('useEffect triggered, hasKMAccess:', hasKMAccess, 'authLoading:', authLoading);
    if (hasKMAccess && !authLoading) {
      loadData();
    }
  }, [hasKMAccess, authLoading, selectedYear]);

  const loadData = async () => {
    try {
      console.log('Loading uebersicht data...');
      const [meldungenRes, schuetzenRes, disziplinenRes, clubsRes] = await Promise.all([
        fetch(`/api/km/meldungen?jahr=${selectedYear}`),
        fetch('/api/shooters'),
        fetch('/api/km/disziplinen'),
        fetch('/api/clubs')
      ]);
      
      console.log('API responses:', {
        meldungen: meldungenRes.status,
        schuetzen: schuetzenRes.status,
        disziplinen: disziplinenRes.status,
        clubs: clubsRes.status
      });

      if (meldungenRes.ok) {
        const data = await meldungenRes.json();
        console.log('📊 KM-Übersicht Meldungen geladen:', data.data?.length || 0);
        console.log('🔍 Erste Meldung:', data.data?.[0]);
        setMeldungen(data.data || []);
      }

      if (schuetzenRes.ok) {
        const data = await schuetzenRes.json();
        console.log('👥 Schützen geladen:', data.data?.length || 0);
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

  const deleteMeldung = async (meldungId: string) => {
    if (!confirm('Meldung wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/km/meldungen/${meldungId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Meldung gelöscht' });
        loadData();
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  console.log('🔍 Filter-Debug:', { 
    totalMeldungen: meldungen.length, 
    totalSchuetzen: schuetzen.length,
    totalClubs: clubs.length 
  });
  
  const filteredMeldungen = meldungen.filter(meldung => {
    const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
    const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
    const vereinId = schuetze?.rwkClubId || schuetze?.clubId || schuetze?.kmClubId;
    const verein = clubs.find(c => c.id === vereinId);

    // Vereinsfilter für Vereinsvertreter
    if (!userClubIds.includes(vereinId)) return false;

    // Filter anwenden
    if (filter.verein && vereinId !== filter.verein) return false;
    if (filter.disziplin && meldung.disziplinId !== filter.disziplin) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      if (!schuetze?.name?.toLowerCase().includes(searchLower) &&
          !disziplin?.name?.toLowerCase().includes(searchLower) &&
          !verein?.name?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade Meldungsübersicht...</p>
          <p className="text-sm text-gray-400 mt-2">Daten werden geladen</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <Link href="/km" className="text-primary hover:text-primary/80">← Zurück</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km" className="text-primary hover:text-primary/80">← Zurück</Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">📋 Alle KM-Meldungen {selectedYear}</h1>
          <p className="text-muted-foreground">Übersicht aller Meldungen zur Kreismeisterschaft {selectedYear}</p>
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

      {/* Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Verein</label>
              <select
                value={filter.verein}
                onChange={(e) => setFilter(prev => ({ ...prev, verein: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Alle Vereine</option>
                {clubs.filter(c => userClubIds.includes(c.id)).map(club => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Disziplin</label>
              <select
                value={filter.disziplin}
                onChange={(e) => setFilter(prev => ({ ...prev, disziplin: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Alle Disziplinen</option>
                {disziplinen.map(disziplin => (
                  <option key={disziplin.id} value={disziplin.id}>
                    {disziplin.spoNummer} - {disziplin.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Suche</label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Name, Disziplin, Verein..."
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setFilter({ verein: '', disziplin: '', search: '' })}
            >
              Filter zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meldungen Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Meldungen ({filteredMeldungen.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Schütze</th>
                  <th className="text-left p-2">Verein</th>
                  <th className="text-left p-2">Disziplin</th>
                  <th className="text-left p-2">LM</th>
                  <th className="text-left p-2">VM-Ringe</th>
                  <th className="text-left p-2">Meldedatum</th>
                  <th className="text-left p-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeldungen.map(meldung => {
                  const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
                  const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
                  const vereinId = schuetze?.rwkClubId || schuetze?.clubId || schuetze?.kmClubId;
                  const verein = clubs.find(c => c.id === vereinId);

                  return (
                    <tr key={meldung.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{schuetze?.name || 'Unbekannt'}</td>
                      <td className="p-2">{verein?.name || 'Unbekannt'}</td>
                      <td className="p-2">
                        <div>
                          <span className="font-medium">{disziplin?.spoNummer}</span>
                          <div className="text-xs text-gray-500">{disziplin?.name}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          meldung.lmTeilnahme 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {meldung.lmTeilnahme ? 'Ja' : 'Nein'}
                        </span>
                      </td>
                      <td className="p-2">
                        {meldung.vmErgebnis?.ringe ? (
                          <span className="text-green-600 font-medium">
                            {meldung.vmErgebnis.ringe}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-2 text-xs text-gray-500">
                        {new Date(meldung.meldedatum?.seconds * 1000 || meldung.meldedatum).toLocaleDateString('de-DE')}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Link href={`/km/meldungen?edit=${meldung.id}`}>
                            <button className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded">
                              ✏️
                            </button>
                          </Link>
                          <button 
                            onClick={() => deleteMeldung(meldung.id)}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredMeldungen.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Keine Meldungen gefunden
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}