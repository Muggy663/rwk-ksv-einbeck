"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { KMMeldung, KMDisziplin, Shooter, Club } from '@/types';
import { useKMAuth } from '@/hooks/useKMAuth';

export default function KMAdmin() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading } = useKMAuth();
  const [meldungen, setMeldungen] = useState<KMMeldung[]>([]);
  const [disziplinen, setDisziplinen] = useState<KMDisziplin[]>([]);
  const [schuetzen, setSchuetzen] = useState<Shooter[]>([]);
  const [vereine, setVereine] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ verein: '', disziplin: '', klasse: '' });

  const handlePDFExport = async (type: 'meldeliste' | 'startliste' | 'lm-meldungen') => {
    try {
      const response = await fetch('/api/km/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `KM2026_${type}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: 'Erfolg', description: 'PDF wurde heruntergeladen' });
      } else {
        toast({ title: 'Fehler', description: 'PDF konnte nicht erstellt werden', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'PDF-Export fehlgeschlagen', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (hasKMAccess && !authLoading) {
      loadData();
    }
  }, [hasKMAccess, authLoading]);

  const loadData = async () => {
    try {
      const [meldungenRes, disziplinenRes, schuetzenRes, vereineRes] = await Promise.all([
        fetch('/api/km/meldungen'),
        fetch('/api/km/disziplinen'),
        fetch('/api/shooters'),
        fetch('/api/clubs')
      ]);
      
      if (meldungenRes.ok) {
        const data = await meldungenRes.json();
        setMeldungen(data.data || []);
      }
      
      if (disziplinenRes.ok) {
        const data = await disziplinenRes.json();
        setDisziplinen(data.data || []);
      }
      
      if (schuetzenRes.ok) {
        const data = await schuetzenRes.json();
        setSchuetzen(data.data || []);
      }
      
      if (vereineRes.ok) {
        const data = await vereineRes.json();
        setVereine(data.data || []);
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getSchuetzeName = (schuetzeId: string) => {
    const schuetze = schuetzen.find(s => s.id === schuetzeId);
    return schuetze?.name || 'Unbekannt';
  };

  const getVereinName = (schuetzeId: string) => {
    const schuetze = schuetzen.find(s => s.id === schuetzeId);
    if (!schuetze) return 'Unbekannt';
    
    const clubId = schuetze.clubId || schuetze.kmClubId;
    const verein = vereine.find(v => v.id === clubId);
    return verein?.name || 'Unbekannt';
  };

  const getDisziplinName = (disziplinId: string) => {
    const disziplin = disziplinen.find(d => d.id === disziplinId);
    return disziplin ? `${disziplin.spoNummer} ${disziplin.name}` : 'Unbekannt';
  };

  const filteredMeldungen = meldungen.filter(meldung => {
    const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
    const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
    const clubId = schuetze?.clubId || schuetze?.kmClubId;
    const verein = vereine.find(v => v.id === clubId);
    
    return (
      (!filter.verein || verein?.name.toLowerCase().includes(filter.verein.toLowerCase())) &&
      (!filter.disziplin || disziplin?.name.toLowerCase().includes(filter.disziplin.toLowerCase()))
    );
  });

  const stats = {
    vereine: new Set(meldungen.map(m => getVereinName(m.schuetzeId))).size,
    gesamtmeldungen: meldungen.length,
    lmMeldungen: meldungen.filter(m => m.lmTeilnahme).length,
    vmErgebnisse: meldungen.filter(m => m.vmErgebnis).length
  };

  if (authLoading || loading) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Lade Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-4">
            Sie haben keine Berechtigung für den KM-Admin-Bereich.
          </p>
          <Link href="/km" className="text-primary hover:text-primary/80">
            ← Zurück zum KM-Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km" className="text-primary hover:text-primary/80">← Zurück</Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">⚙️ KM 2026 - Admin-Bereich</h1>
          <p className="text-muted-foreground">
            Verwaltung der Kreismeisterschaftsmeldungen für den Kreisverband
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.vereine}</div>
            <div className="text-sm text-gray-600">Vereine gemeldet</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.gesamtmeldungen}</div>
            <div className="text-sm text-gray-600">Gesamtmeldungen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.lmMeldungen}</div>
            <div className="text-sm text-gray-600">LM-Meldungen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.vmErgebnisse}</div>
            <div className="text-sm text-gray-600">VM-Ergebnisse</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Meldungen</CardTitle>
          <CardDescription>Übersicht aller eingegangenen Meldungen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Verein filtern..."
              value={filter.verein}
              onChange={(e) => setFilter(prev => ({ ...prev, verein: e.target.value }))}
              className="p-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              placeholder="Disziplin filtern..."
              value={filter.disziplin}
              onChange={(e) => setFilter(prev => ({ ...prev, disziplin: e.target.value }))}
              className="p-2 border border-gray-300 rounded text-sm"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilter({ verein: '', disziplin: '', klasse: '' })}
            >
              Filter zurücksetzen
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Verein</th>
                  <th className="text-left p-2">Disziplin</th>
                  <th className="text-left p-2">Klasse</th>
                  <th className="text-left p-2">LM</th>
                  <th className="text-left p-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeldungen.map(meldung => (
                  <tr key={meldung.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{getSchuetzeName(meldung.schuetzeId)}</td>
                    <td className="p-2">{getVereinName(meldung.schuetzeId)}</td>
                    <td className="p-2">{getDisziplinName(meldung.disziplinId)}</td>
                    <td className="p-2">Auto</td>
                    <td className="p-2">
                      <Badge variant={meldung.lmTeilnahme ? 'default' : 'outline'}>
                        {meldung.lmTeilnahme ? 'Ja' : 'Nein'}
                      </Badge>
                      {meldung.vmErgebnis && (
                        <Badge variant="secondary" className="ml-1">
                          VM: {meldung.vmErgebnis.ringe}
                        </Badge>
                      )}
                    </td>
                    <td className="p-2">
                      <button className="text-blue-600 hover:text-blue-800 text-xs">Bearbeiten</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => handlePDFExport('meldeliste')}>
              Meldeliste PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePDFExport('startliste')}>
              Startliste PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePDFExport('lm-meldungen')}>
              LM-Meldungen PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}