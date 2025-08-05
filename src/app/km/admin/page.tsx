"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { KMMeldung, KMDisziplin, Shooter, Club, KMWettkampfklasse } from '@/types';
import { useKMAuth } from '@/hooks/useKMAuth';

export default function KMAdmin() {
  const { toast } = useToast();
  const { hasKMOrganizerAccess, loading: authLoading } = useKMAuth();
  const [meldungen, setMeldungen] = useState<KMMeldung[]>([]);
  const [disziplinen, setDisziplinen] = useState<KMDisziplin[]>([]);
  const [schuetzen, setSchuetzen] = useState<Shooter[]>([]);
  const [vereine, setVereine] = useState<Club[]>([]);
  const [wettkampfklassen, setWettkampfklassen] = useState<KMWettkampfklasse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ verein: '', disziplin: '', klasse: '' });
  const [exporting, setExporting] = useState(false);

  const handlePDFExport = async (type: 'meldeliste' | 'startliste' | 'lm-meldungen') => {
    setExporting(true);
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
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `KM2026_${type}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({ title: 'Erfolg', description: 'PDF wurde heruntergeladen' });
      } else {
        toast({ title: 'Fehler', description: 'PDF konnte nicht erstellt werden', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'PDF-Export fehlgeschlagen', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      console.error('Fehler beim Laden der Daten:', error);
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
    
    // Prüfe sowohl clubId als auch kmClubId für KM-Schützen
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
    const clubId = schuetze?.clubId || schuetze?.kmClubId;
    const verein = vereine.find(v => v.id === clubId);
    const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
    
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

  if (!hasKMOrganizerAccess) {
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
          <h1 className="text-3xl font-bold text-primary">⚙️ KM 2025 - Admin-Bereich</h1>
          <p className="text-muted-foreground">
            Verwaltung der Kreismeisterschaftsmeldungen für den Kreisverband
          </p>
          <div className="mt-4">
            <Link href="/km/benutzer" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
              👥 KM-Benutzer verwalten
            </Link>
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium text-blue-800 mb-2">💡 RWK-Vereinsvertreter automatisch berechtigen</h4>
                <p className="text-sm text-blue-700 mb-2">
                  RWK-Vereinsvertreter haben automatisch KM-Zugang. Bei Problemen: Firebase Console → km_user_permissions prüfen.
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={async () => {
                    try {
                      console.log('Lade RWK-Benutzerberechtigungen...');
                      
                      // Lade Benutzer-Daten über bestehende API
                      const response = await fetch('/api/shooters');
                      if (!response.ok) {
                        throw new Error('Kann Benutzer nicht laden');
                      }
                      
                      const result = await response.json();
                      const schuetzen = result.data || [];
                      
                      // Lade auch Vereine für Namen-Mapping
                      const clubsRes = await fetch('/api/clubs');
                      const clubsResult = await clubsRes.json();
                      const clubs = clubsResult.data || [];
                      
                      console.log('Erste 5 Schützen:', schuetzen.slice(0, 5));
                      console.log('Erste 5 Vereine:', clubs.slice(0, 5));
                      
                      // Finde Vereins-IDs für Einbeck, Post, Linnenkamp
                      const einbeckClub = clubs.find(c => c.name && c.name.toLowerCase().includes('einbeck'));
                      const postClub = clubs.find(c => c.name && c.name.toLowerCase().includes('post'));
                      const linnenkampClub = clubs.find(c => c.name && c.name.toLowerCase().includes('linnenkamp'));
                      
                      console.log('Gefundene Vereine:', {
                        einbeck: einbeckClub,
                        post: postClub,
                        linnenkamp: linnenkampClub
                      });
                      
                      const echteClubIds = [
                        einbeckClub?.id,
                        postClub?.id, 
                        linnenkampClub?.id
                      ].filter(Boolean);
                      
                      console.log('Echte Club-IDs:', echteClubIds);
                      
                      const probeUser = {
                        id: 'm7ffEKT1qXebEDKYaa2ohLQUO4p2',
                        clubIds: echteClubIds
                      };
                      
                      console.log('Erstelle KM-Berechtigung für:', probeUser.id);
                      
                      // Erstelle KM-Berechtigung mit echten Vereins-IDs
                      const kmUserData = {
                        role: 'verein_vertreter',
                        isActive: true,
                        syncedFromRWK: true,
                        createdAt: new Date().toISOString()
                      };
                      
                      // Multi-Verein oder Einzel-Verein
                      if (probeUser.clubIds && Array.isArray(probeUser.clubIds)) {
                        kmUserData.clubIds = probeUser.clubIds;
                      } else if (probeUser.clubId) {
                        kmUserData.clubId = probeUser.clubId;
                      }
                      
                      console.log('Erstelle KM-Berechtigung direkt...');
                      
                      // Erstelle KM-Berechtigung direkt über Firebase
                      const { db } = await import('@/lib/firebase/config');
                      const { doc, setDoc } = await import('firebase/firestore');
                      
                      const kmUserRef = doc(db, 'km_user_permissions', 'm7ffEKT1qXebEDKYaa2ohLQUO4p2');
                      await setDoc(kmUserRef, kmUserData);
                      
                      console.log('✓ KM-Berechtigung erfolgreich erstellt!');
                      console.log('Daten:', JSON.stringify(kmUserData, null, 2));
                      
                      toast({ 
                        title: 'Erfolg!', 
                        description: 'KM-Berechtigung für Probe-Benutzer erstellt. Er kann jetzt KM-Meldungen machen!' 
                      });
                      
                    } catch (error) {
                      console.error('Fehler:', error);
                      toast({ 
                        title: 'Fehler', 
                        description: `Fehler: ${error.message}`,
                        variant: 'destructive'
                      });
                    }
                  }}
                >
                  Echte Vereins-IDs laden
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Startplan erstellen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Disziplin</label>
                  <select className="w-full p-2 border border-gray-300 rounded text-sm">
                    <option>LG Freihand</option>
                    <option>LG Auflage</option>
                    <option>KK 100m Freihand</option>
                    <option>LP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Datum</label>
                  <input type="date" className="w-full p-2 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Startzeit</label>
                  <input type="time" className="w-full p-2 border border-gray-300 rounded text-sm" />
                </div>
                <button className="w-full bg-primary text-white px-4 py-2 rounded text-sm hover:bg-primary/90">
                  Startplan generieren
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Meldungen nach Disziplin:</div>
                  <div className="mt-1 space-y-1">
                    {disziplinen.slice(0, 4).map(disziplin => {
                      const count = meldungen.filter(m => m.disziplinId === disziplin.id).length;
                      return (
                        <div key={disziplin.id} className="flex justify-between">
                          <span>{disziplin.spoNummer}:</span>
                          <span>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="pt-3 border-t text-sm">
                  <div className="font-medium">Status:</div>
                  <div className="mt-1">
                    <div className="text-green-600">{stats.gesamtmeldungen} Meldungen</div>
                    <div className="text-blue-600">{stats.vmErgebnisse} VM-Ergebnisse</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">💡 Demo-Modus</h3>
        <p className="text-sm text-yellow-700">
          Dies ist eine Demonstration des Admin-Bereichs. Alle Daten sind Beispieldaten.
        </p>
      </div>
    </div>
  );
}