"use client";

import { useState, useEffect } from 'react';
import { logError, logInfo } from '@/lib/utils/secure-logger';
import { getShooterClubId } from '@/lib/utils/altersklassen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKMAuth } from '@/hooks/useKMAuth';
import { useClubContext } from '@/contexts/ClubContext';
import Link from 'next/link';
import { authFetch } from '@/lib/auth/authFetch';

export default function KMUebersicht() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading, userPermission, userClubIds } = useKMAuth();
  useClubContext();
  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedSaison, setSelectedSaison] = useState('');
  const [aktivesJahr, setAktivesJahr] = useState(2027);
  const [editingMeldung, setEditingMeldung] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [saisons, setSaisons] = useState<Array<{ id: string; jahr?: number; meldeschluss?: string; [key: string]: any }>>([]);
  const [data, setData] = useState<{
    meldungen: any[];
    schuetzen: Array<{ id: string; name?: string; birthYear?: number; gender?: string; [key: string]: any }>;
    disziplinen: Array<{ id: string; name?: string; [key: string]: any }>;
    clubs: Array<{ id: string; name?: string; [key: string]: any }>;
  }>({
    meldungen: [],
    schuetzen: [],
    disziplinen: [],
    clubs: []
  });
  const [loading, setLoading] = useState(true);
  const [status] = useState({
    meldungen: 'loading',
    schuetzen: 'loading',
    disziplinen: 'loading',
    clubs: 'loading'
  });

  useEffect(() => {
    if (hasKMAccess && !authLoading) {
      loadSaisons();
      loadData();
    }
  }, [hasKMAccess, authLoading, selectedClubId, selectedSaison]);

  const loadSaisons = async () => {
    try {
      const response = await fetch('/api/km/saisons');
      if (response.ok) {
        const data = await response.json();
        setSaisons((data.data || []).sort((a: { jahr?: number }, b: { jahr?: number }) => (b.jahr || 0) - (a.jahr || 0)));
        // Keine automatische Auswahl - Benutzer muss bewusst wählen
      }
    } catch (error) {
      logError('Fehler beim Laden der Saisons:', error);
    }
  };

  const loadData = async () => {
    try {
      const isAdmin = userPermission?.role === 'admin';
      
      // Hole aktuelles Jahr
      const jahresRes = await fetch('/api/km/aktuelles-jahr');
      let aktivesJahrLocal = 2027;
      if (jahresRes.ok) {
        const jahresData = await jahresRes.json();
        aktivesJahrLocal = jahresData.data.jahr;
      }
      setAktivesJahr(aktivesJahrLocal);
      
      // Lade alle Daten parallel
      let meldungenUrl = `/api/km/meldungen?jahr=${aktivesJahrLocal}`;
      if (selectedSaison) {
        meldungenUrl += `&saison=${selectedSaison}`;
      }
      
      const [meldungenRes] = await Promise.all([
        authFetch(meldungenUrl)
      ]);
      
      // Lade Schützen direkt aus Firebase
      const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const shootersSnapshot = await getDocs(query(collection(db, 'shooters'), orderBy('lastName', 'asc')));
      const allSchuetzen = shootersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Array<{ id: string; name?: string; birthYear?: number; gender?: string; [key: string]: any }>;
      
      let allMeldungen: any[] = [];
      
      if (meldungenRes.ok) {
        const meldungenData = await meldungenRes.json();
        allMeldungen = meldungenData.data || [];
        logInfo('Erste 3 Meldungen:', { data: allMeldungen.slice(0, 3).map((m: { id: string; disziplinId: string }) => ({ id: m.id, disziplinId: m.disziplinId })) });
      }
      
      // Client-seitige Filterung
      let filteredMeldungen = allMeldungen;
      let filteredSchuetzen = allSchuetzen;
      
      if (!isAdmin && userClubIds.length > 0) {
        // Filtere Schützen nach eigenen Vereinen
        filteredSchuetzen = allSchuetzen.filter((s: any) => {
          const clubId = getShooterClubId(s);
          return clubId && userClubIds.includes(clubId);
        });
        
        // Filtere Meldungen basierend auf gefilterten Schützen
        const allowedSchuetzenIds = filteredSchuetzen.map(s => s.id);
        filteredMeldungen = allMeldungen.filter((m: any) => allowedSchuetzenIds.includes(m.schuetzeId));
        
        // Zusätzliche Filterung nach ausgewähltem Verein
        if (selectedClubId) {
          filteredSchuetzen = filteredSchuetzen.filter((s: any) => {
            return getShooterClubId(s) === selectedClubId;
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
          logInfo('Geladene Disziplinen:', { data: disziplinenData.data?.length || 0 });
          setData(prev => ({ ...prev, disziplinen: disziplinenData.data || [] }));
        }
      } catch (error) {
        logError('Fehler beim Laden der Disziplinen:', error);
      }
      
      // 4. Lade Vereine
      try {
        const clubsRes = await fetch('/api/clubs');
        if (clubsRes.ok) {
          const clubsData = await clubsRes.json();
          setData(prev => ({ ...prev, clubs: clubsData.data || [] }));
        }
      } catch (error) {
        logError('Fehler beim Laden der Vereine:', error);
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
        <div>
          <h1 className="text-3xl font-bold text-primary">📊 KM-Übersicht</h1>
          <p className="text-muted-foreground">
            {userPermission?.role === 'admin' 
              ? 'Statistiken und Übersicht der Kreismeisterschaften'
              : `Ihre Meldungen für die Kreismeisterschaften`
            }
          </p>
        </div>
      </div>
      
      <Card className="border-2 border-primary bg-primary/5 mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-base font-semibold text-gray-800 dark:text-gray-200">🎯 Saison auswählen (Pflichtfeld)</label>
              <select
                value={selectedSaison}
                onChange={(e) => setSelectedSaison(e.target.value)}
                className="w-full mt-2 px-4 py-3 text-lg border-2 border-primary rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary"
                required
              >
                <option value="">🔽 Bitte Saison wählen...</option>
                {saisons.map(saison => (
                  <option key={saison.id} value={saison.id}>
                    {saison.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!selectedSaison && (
        <Card className="border-orange-200 bg-orange-50 mb-6">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-orange-800 font-medium mb-2">⚠️ Bitte wählen Sie zuerst eine Saison aus</p>
              <p className="text-sm text-orange-600">Die Übersicht wird erst nach der Saisonauswahl angezeigt.</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedSaison && userClubIds.length > 1 && (
        <div className="flex items-center gap-2 mb-6">
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

      {selectedSaison && (
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
      )}

      {selectedSaison && (
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
      )}

      {/* Meldungen-Tabelle */}
      {selectedSaison && (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Ihre Meldungen ({data.meldungen.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.meldungen.length > 0 ? (
            <div className="space-y-3">
              {data.meldungen.map((meldung: any) => {
                const schuetze = data.schuetzen.find((s: any) => s.id === meldung.schuetzeId);
                const disziplin = data.disziplinen.find((d: any) => d.id === meldung.disziplinId);
                
                // Fallback: Suche nach spoNummer wenn ID nicht gefunden
                const disziplinFallback = !disziplin && meldung.spoNummer 
                  ? data.disziplinen.find((d: any) => d.spoNummer === meldung.spoNummer)
                  : null;
                
                // Berechne Altersklasse
                let altersklasse = 'Unbekannt';
                const aktiveDisziplin: any = disziplin || disziplinFallback;
                if (schuetze?.birthYear && schuetze?.gender && aktiveDisziplin) {
                  const age = (aktivesJahr || 2027) - schuetze.birthYear;
                  const gender = schuetze.gender;
                  const istAuflage = aktiveDisziplin.auflage;
                  
                  if (istAuflage) {
                    // Auflage-Wettkampfklassen
                    if (age <= 14) altersklasse = gender === 'male' ? 'Schüler m' : 'Schüler w';
                    else if (aktiveDisziplin.spoNummer === '1.41' && age >= 15 && age <= 40) {
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
                  <div key={meldung.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-lg">{schuetze?.name || 'Unbekannt'}</div>
                        <div className="text-sm text-gray-600">
                          {(disziplin || disziplinFallback) ? 
                            `${(disziplin || disziplinFallback)!.spoNummer} - ${(disziplin || disziplinFallback)!.name}` : 
                            `Disziplin-ID: ${meldung.disziplinId} (nicht gefunden)`
                          }
                        </div>
                        <div className="text-sm font-medium text-blue-600">{altersklasse}</div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">LM:</span>
                            {editingMeldung === meldung.id ? (
                              <input
                                type="checkbox"
                                checked={editData.lmTeilnahme || false}
                                onChange={(e) => setEditData((prev: any) => ({...prev, lmTeilnahme: e.target.checked}))}
                                className="ml-1"
                              />
                            ) : (
                              <span className="ml-1 font-medium">{meldung.lmTeilnahme ? '✓' : '-'}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-500">VM:</span>
                            {editingMeldung === meldung.id ? (
                              <input
                                type="number"
                                step="0.1"
                                value={editData.vmRinge || ''}
                                onChange={(e) => setEditData((prev: any) => ({...prev, vmRinge: e.target.value}))}
                                className="ml-1 w-16 p-1 border rounded text-xs"
                              />
                            ) : (
                              <span className="ml-1 font-medium">{meldung.vmErgebnis?.ringe || '-'}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          {editingMeldung === meldung.id ? (
                            <>
                              <Button 
                                size="sm" 
                                onClick={async () => {
                                  try {
                                    const updateData = {
                                      lmTeilnahme: editData.lmTeilnahme,
                                      anmerkung: editData.anmerkung,
                                      vmErgebnis: editData.vmRinge ? {
                                        ringe: parseFloat(editData.vmRinge),
                                        datum: meldung.vmErgebnis?.datum || new Date(),
                                        bemerkung: meldung.vmErgebnis?.bemerkung || ''
                                      } : meldung.vmErgebnis
                                    };
                                    const res = await authFetch(`/api/km/meldungen/${meldung.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(updateData)
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
                                className="w-full sm:w-auto"
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
                                className="w-full sm:w-auto"
                              >
                                Abbrechen
                              </Button>
                            </>
                          ) : (() => {
                            // Prüfe Meldeschluss
                            const today = new Date();
                            let isExpired = false;
                            
                            const saison = saisons.find(s => s.id === selectedSaison);
                            if (saison?.meldeschluss) {
                              const meldeschluss = saison.meldeschluss;
                              let deadline;
                              
                              if (meldeschluss.includes('.') && meldeschluss.length > 6) {
                                const [day, month, year] = meldeschluss.split('.');
                                deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                              } else {
                                const [day, month] = meldeschluss.split('.');
                                deadline = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
                              }
                              
                              isExpired = today > deadline;
                            }
                            
                            const canEdit = !isExpired || userPermission?.role === 'admin' || userPermission?.role === 'km_organisator';
                            
                            return (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  disabled={!canEdit}
                                  onClick={() => {
                                    setEditingMeldung(meldung.id);
                                    setEditData({
                                      lmTeilnahme: meldung.lmTeilnahme,
                                      vmRinge: meldung.vmErgebnis?.ringe || '',
                                      anmerkung: meldung.anmerkung || ''
                                    });
                                  }}
                                  className="w-full sm:w-auto"
                                  title={!canEdit ? 'Meldeschluss abgelaufen - nur Admin/KM-Orga kann bearbeiten' : ''}
                                >
                                  Bearbeiten
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  disabled={!canEdit}
                                  onClick={async () => {
                                    if (confirm('Meldung wirklich löschen?')) {
                                      try {
                                        const res = await authFetch(`/api/km/meldungen/${meldung.id}`, { method: 'DELETE' });
                                        if (res.ok) {
                                          toast({ title: 'Meldung gelöscht' });
                                          // Sofort aus State entfernen für schnelles UI-Feedback
                                          setData(prev => ({ ...prev, meldungen: prev.meldungen.filter((m: any) => m.id !== meldung.id) }));
                                        } else {
                                          toast({ title: 'Fehler beim Löschen', variant: 'destructive' });
                                        }
                                      } catch (error) {
                                        toast({ title: 'Fehler beim Löschen', variant: 'destructive' });
                                      }
                                    }
                                  }}
                                  className="w-full sm:w-auto"
                                  title={!canEdit ? 'Meldeschluss abgelaufen - nur Admin/KM-Orga kann löschen' : ''}
                                >
                                  Löschen
                                </Button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {(meldung.anmerkung || editingMeldung === meldung.id) && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm">
                          <span className="text-gray-500">Anmerkung:</span>
                          {editingMeldung === meldung.id ? (
                            <input
                              type="text"
                              value={editData.anmerkung || ''}
                              onChange={(e) => setEditData((prev: any) => ({...prev, anmerkung: e.target.value}))}
                              className="ml-2 flex-1 p-1 border rounded text-sm w-full mt-1"
                              placeholder="Anmerkung eingeben..."
                            />
                          ) : (
                            <span className="ml-2">{meldung.anmerkung}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">Noch keine Meldungen vorhanden</p>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
