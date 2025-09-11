"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKMAuth } from '@/hooks/useKMAuth';
import { useClubContext } from '@/contexts/ClubContext';
import Link from 'next/link';

export default function KMUebersicht() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading, userPermission, userClubIds } = useKMAuth();
  const { activeClubId } = useClubContext();
  const [selectedClubId, setSelectedClubId] = useState('');
  const [editingMeldung, setEditingMeldung] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
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
  }, [hasKMAccess, authLoading, selectedClubId]);

  const loadData = async () => {
    try {
      const isAdmin = userPermission?.role === 'admin';
      // Für Nicht-Admin: Immer nach eigenen Vereinen filtern
      let clubFilter = '';
      if (!isAdmin) {
        if (selectedClubId) {
          // Spezifischer Verein ausgewählt
          clubFilter = `?clubId=${selectedClubId}`;
        } else if (userClubIds.length > 0) {
          // "Alle Vereine" = alle eigenen Vereine
          clubFilter = `?clubIds=${userClubIds.join(',')}`;
        }
      }
      
      // Hole aktuelles Jahr
      const jahresRes = await fetch('/api/km/aktuelles-jahr');
      let aktivesJahr = 2026;
      if (jahresRes.ok) {
        const jahresData = await jahresRes.json();
        aktivesJahr = jahresData.data.jahr;
      }
      
      // Lade alle Daten parallel
      const [meldungenRes, schuetzenRes] = await Promise.all([
        fetch(`/api/km/meldungen?jahr=${aktivesJahr}`),
        fetch('/api/km/shooters')
      ]);
      
      let allMeldungen = [];
      let allSchuetzen = [];
      
      if (meldungenRes.ok) {
        const meldungenData = await meldungenRes.json();
        allMeldungen = meldungenData.data || [];
      }
      
      if (schuetzenRes.ok) {
        const schuetzenData = await schuetzenRes.json();
        allSchuetzen = schuetzenData.data || [];
      }
      
      // Client-seitige Filterung
      let filteredMeldungen = allMeldungen;
      let filteredSchuetzen = allSchuetzen;
      
      if (!isAdmin && userClubIds.length > 0) {
        // Filtere Schützen nach eigenen Vereinen
        filteredSchuetzen = allSchuetzen.filter((s: any) => {
          const schuetzeClubIds = [s.clubId, s.kmClubId, s.rwkClubId].filter(Boolean);
          return schuetzeClubIds.some((clubId: string) => userClubIds.includes(clubId));
        });
        
        // Filtere Meldungen basierend auf gefilterten Schützen
        const allowedSchuetzenIds = filteredSchuetzen.map(s => s.id);
        filteredMeldungen = allMeldungen.filter((m: any) => allowedSchuetzenIds.includes(m.schuetzeId));
        
        // Zusätzliche Filterung nach ausgewähltem Verein
        if (selectedClubId) {
          filteredSchuetzen = filteredSchuetzen.filter((s: any) => {
            const schuetzeClubIds = [s.clubId, s.kmClubId, s.rwkClubId].filter(Boolean);
            return schuetzeClubIds.includes(selectedClubId);
          });
          
          const selectedSchuetzenIds = filteredSchuetzen.map(s => s.id);
          filteredMeldungen = filteredMeldungen.filter((m: any) => selectedSchuetzenIds.includes(m.schuetzeId));
        }
      }
      
      setData(prev => ({ ...prev, meldungen: filteredMeldungen, schuetzen: filteredSchuetzen }));
      
      // 3. Lade Disziplinen
      try {
        const disziplinenRes = await fetch('/api/km/disziplinen');
        if (disziplinenRes.ok) {
          const disziplinenData = await disziplinenRes.json();
          setData(prev => ({ ...prev, disziplinen: disziplinenData.data || [] }));
        }
      } catch (error) {
        console.error('Fehler beim Laden der Disziplinen:', error);
      }
      
      // 4. Lade Vereine
      try {
        const clubsRes = await fetch('/api/clubs');
        if (clubsRes.ok) {
          const clubsData = await clubsRes.json();
          setData(prev => ({ ...prev, clubs: clubsData.data || [] }));
        }
      } catch (error) {
        console.error('Fehler beim Laden der Vereine:', error);
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
        <div className="flex items-center gap-4 mb-4">
          <Link href="/km">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu KM
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">📊 KM-Übersicht</h1>
            <p className="text-muted-foreground">
              {userPermission?.role === 'admin' 
                ? 'Statistiken und Übersicht der Kreismeisterschaft 2026'
                : `Ihre Meldungen für die Kreismeisterschaft 2026`
              }
            </p>
          </div>
          
          {userClubIds.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Verein:</label>
              <select 
                value={selectedClubId} 
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="border rounded px-3 py-1"
              >
                <option value="">Alle Vereine</option>
                {userClubIds.map(clubId => {
                  const club = data.clubs.find(c => c.id === clubId);
                  return club ? (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ) : null;
                })}
              </select>
            </div>
          )}
        </div>
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

      <div className={`grid grid-cols-1 ${userPermission?.role === 'admin' ? 'md:grid-cols-2' : ''} gap-6`}>
        {userPermission?.role === 'admin' && (
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
        )}

        <Card>
          <CardHeader>
            <CardTitle>{userPermission?.role === 'admin' ? 'Disziplinen-Statistik' : 'Ihre Meldungen nach Disziplinen'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.disziplinen
                .map((disziplin: any) => ({
                  ...disziplin,
                  count: data.meldungen.filter((m: any) => m.disziplinId === disziplin.id).length
                }))
                .filter((disziplin: any) => disziplin.count > 0)
                .slice(0, 10)
                .map((disziplin: any) => (
                  <div key={disziplin.id} className="flex justify-between">
                    <span className="text-sm">{disziplin.spoNummer} - {disziplin.name}</span>
                    <span className="font-medium">{disziplin.count}</span>
                  </div>
                ))}
              {data.disziplinen.filter((d: any) => 
                data.meldungen.filter((m: any) => m.disziplinId === d.id).length > 0
              ).length === 0 && (
                <p className="text-sm text-gray-500">Noch keine Meldungen vorhanden</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meldungen-Tabelle */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Ihre Meldungen ({data.meldungen.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.meldungen.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Schütze</th>
                    <th className="text-left p-2">Disziplin</th>
                    <th className="text-left p-2">Altersklasse</th>
                    <th className="text-center p-2">LM</th>
                    <th className="text-center p-2">VM-Ergebnis</th>
                    <th className="text-left p-2">Anmerkung</th>
                    <th className="text-right p-2">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.meldungen.map((meldung: any) => {
                    const schuetze = data.schuetzen.find((s: any) => s.id === meldung.schuetzeId);
                    const disziplin = data.disziplinen.find((d: any) => d.id === meldung.disziplinId);
                    
                    // Berechne Altersklasse
                    let altersklasse = 'Unbekannt';
                    if (schuetze?.birthYear && schuetze?.gender && disziplin) {
                      const age = 2026 - schuetze.birthYear;
                      const gender = schuetze.gender;
                      const istAuflage = disziplin.auflage;
                      
                      if (istAuflage) {
                        // Auflage-Wettkampfklassen
                        if (age <= 14) altersklasse = gender === 'male' ? 'Schüler m' : 'Schüler w';
                        else if (disziplin.spoNummer === '1.41' && age >= 15 && age <= 40) {
                          if (age <= 16) altersklasse = gender === 'male' ? 'Jugend m' : 'Jugend w';
                          else if (age <= 18) altersklasse = gender === 'male' ? 'Junioren II m' : 'Junioren II w';
                          else if (age <= 20) altersklasse = gender === 'male' ? 'Junioren I m' : 'Junioren I w';
                          else altersklasse = gender === 'male' ? 'Herren I' : 'Damen I';
                        }
                        else if (age < 41) altersklasse = 'Nicht berechtigt';
                        else if (age <= 50) altersklasse = 'Senioren 0';
                        else if (age <= 60) altersklasse = gender === 'male' ? 'Senioren I m' : 'Seniorinnen I';
                        else if (age <= 65) altersklasse = gender === 'male' ? 'Senioren II m' : 'Seniorinnen II';
                        else if (age <= 70) altersklasse = gender === 'male' ? 'Senioren III m' : 'Seniorinnen III';
                        else if (age <= 75) altersklasse = gender === 'male' ? 'Senioren IV m' : 'Seniorinnen IV';
                        else if (age <= 80) altersklasse = gender === 'male' ? 'Senioren V m' : 'Seniorinnen V';
                        else altersklasse = gender === 'male' ? 'Senioren VI m' : 'Seniorinnen VI';
                      } else {
                        // Freihand-Wettkampfklassen
                        if (age <= 14) altersklasse = gender === 'male' ? 'Schüler m' : 'Schüler w';
                        else if (age <= 16) altersklasse = gender === 'male' ? 'Jugend m' : 'Jugend w';
                        else if (age <= 18) altersklasse = gender === 'male' ? 'Junioren II m' : 'Junioren II w';
                        else if (age <= 20) altersklasse = gender === 'male' ? 'Junioren I m' : 'Junioren I w';
                        else if (age <= 40) altersklasse = gender === 'male' ? 'Herren I' : 'Damen I';
                        else if (age <= 50) altersklasse = gender === 'male' ? 'Herren II' : 'Damen II';
                        else if (age <= 60) altersklasse = gender === 'male' ? 'Herren III' : 'Damen III';
                        else if (age <= 70) altersklasse = gender === 'male' ? 'Herren IV' : 'Damen IV';
                        else altersklasse = gender === 'male' ? 'Herren V' : 'Damen V';
                      }
                    }
                    
                    return (
                      <tr key={meldung.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{schuetze?.name || 'Unbekannt'}</td>
                        <td className="p-2">{disziplin?.spoNummer} - {disziplin?.name}</td>
                        <td className="p-2 text-sm font-medium">{altersklasse}</td>

                        <td className="text-center p-2">
                          {editingMeldung === meldung.id ? (
                            <input
                              type="checkbox"
                              checked={editData.lmTeilnahme || false}
                              onChange={(e) => setEditData(prev => ({...prev, lmTeilnahme: e.target.checked}))}
                            />
                          ) : (
                            meldung.lmTeilnahme ? '✓' : '-'
                          )}
                        </td>
                        <td className="text-center p-2">
                          {editingMeldung === meldung.id ? (
                            <input
                              type="number"
                              step="0.1"
                              value={editData.vmRinge || ''}
                              onChange={(e) => setEditData(prev => ({...prev, vmRinge: e.target.value}))}
                              className="w-20 p-1 border rounded text-sm"
                            />
                          ) : (
                            meldung.vmErgebnis?.ringe || '-'
                          )}
                        </td>
                        <td className="p-2 text-sm">
                          {editingMeldung === meldung.id ? (
                            <input
                              type="text"
                              value={editData.anmerkung || ''}
                              onChange={(e) => setEditData(prev => ({...prev, anmerkung: e.target.value}))}
                              className="w-full p-1 border rounded text-sm"
                            />
                          ) : (
                            meldung.anmerkung || '-'
                          )}
                        </td>
                        <td className="text-right p-2">
                          <div className="flex gap-1 justify-end">
                            {editingMeldung === meldung.id ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={async () => {
                                    try {
                                      // Lösche alte Meldung
                                      await fetch(`/api/km/meldungen/${meldung.id}`, { method: 'DELETE' });
                                      
                                      // Erstelle neue Meldung mit aktualisierten Daten
                                      const newMeldung = {
                                        schuetzeId: meldung.schuetzeId,
                                        disziplinId: meldung.disziplinId,
                                        lmTeilnahme: editData.lmTeilnahme,
                                        anmerkung: editData.anmerkung,
                                        vmErgebnis: editData.vmRinge ? {
                                          ringe: parseFloat(editData.vmRinge),
                                          datum: meldung.vmErgebnis?.datum || new Date(),
                                          bemerkung: meldung.vmErgebnis?.bemerkung || ''
                                        } : meldung.vmErgebnis
                                      };
                                      
                                      const res = await fetch('/api/km/meldungen', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(newMeldung)
                                      });
                                      
                                      if (res.ok) {
                                        toast({ title: 'Meldung aktualisiert' });
                                        setEditingMeldung(null);
                                        setEditData({});
                                        loadData();
                                      }
                                    } catch (error) {
                                      toast({ title: 'Fehler beim Speichern', variant: 'destructive' });
                                    }
                                  }}
                                >
                                  Speichern
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditingMeldung(null);
                                    setEditData({});
                                  }}
                                >
                                  Abbrechen
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditingMeldung(meldung.id);
                                    setEditData({
                                      lmTeilnahme: meldung.lmTeilnahme,
                                      vmRinge: meldung.vmErgebnis?.ringe || '',
                                      anmerkung: meldung.anmerkung || ''
                                    });
                                  }}
                                >
                                  Bearbeiten
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={async () => {
                                    if (confirm('Meldung wirklich löschen?')) {
                                      try {
                                        const res = await fetch(`/api/km/meldungen/${meldung.id}`, { method: 'DELETE' });
                                        if (res.ok) {
                                          toast({ title: 'Meldung gelöscht' });
                                          loadData();
                                        }
                                      } catch (error) {
                                        toast({ title: 'Fehler beim Löschen', variant: 'destructive' });
                                      }
                                    }
                                  }}
                                >
                                  Löschen
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">Noch keine Meldungen vorhanden</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}