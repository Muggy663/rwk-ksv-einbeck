"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useKMAuth } from '@/hooks/useKMAuth';
import { MannschaftsbildungService } from '@/lib/services/mannschaftsbildung-service';

export default function KMAdminMannschaften() {
  const { toast } = useToast();
  const { hasFullAccess, loading: authLoading } = useKMAuth();
  const [mannschaften, setMannschaften] = useState<any[]>([]);
  const [schuetzen, setSchuetzen] = useState<any[]>([]);
  const [disziplinen, setDisziplinen] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [meldungen, setMeldungen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [filter, setFilter] = useState({ verein: '', disziplin: '' });

  useEffect(() => {
    if (hasFullAccess && !authLoading) {
      loadData();
    }
  }, [hasFullAccess, authLoading]);

  const loadData = async () => {
    try {
      const [mannschaftenRes, schuetzenRes, disziplinenRes, clubsRes, meldungenRes] = await Promise.all([
        fetch('/api/km/mannschaften'),
        fetch('/api/km/shooters'),
        fetch('/api/km/disziplinen'),
        fetch('/api/clubs'),
        fetch('/api/km/meldungen?jahr=2026')
      ]);
      
      if (mannschaftenRes.ok) {
        const data = await mannschaftenRes.json();
        setMannschaften(data.data || []);
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

      if (meldungenRes.ok) {
        const data = await meldungenRes.json();
        setMeldungen(data.data || []);
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateMannschaften = async () => {
    setIsGenerating(true);
    toast({ title: '🚀 Generierung gestartet', description: 'Mannschaften werden automatisch erstellt...' });
    
    try {
      const response = await fetch('/api/km/mannschaften/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saison: '2026' })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({ 
          title: '✅ Erfolg', 
          description: result.message || `${result.generated || 0} Mannschaften generiert`
        });
        await loadData();
      } else {
        toast({ 
          title: '❌ Fehler', 
          description: result.error || result.message || 'Generierung fehlgeschlagen', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: '❌ Fehler', 
        description: `Generierung fehlgeschlagen: ${error.message}`, 
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteMannschaft = async (mannschaftId: string) => {
    if (!confirm('Mannschaft wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/km/mannschaften/${mannschaftId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Mannschaft gelöscht' });
        loadData();
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const updateMannschaft = async (mannschaftId: string, newSchuetzenIds: string[]) => {
    try {
      // Validiere Mannschaft mit den neuen Regeln
      const mannschaft = mannschaften.find(m => m.id === mannschaftId);
      if (mannschaft && newSchuetzenIds.length > 0) {
        const teamSchuetzen = newSchuetzenIds.map(id => schuetzen.find(s => s.id === id)).filter(Boolean);
        const validation = await MannschaftsbildungService.validateMannschaft(teamSchuetzen, mannschaft.disziplinId);
        
        if (!validation.valid) {
          toast({ 
            title: '⚠️ Regelverstoß', 
            description: validation.errors.join(', '), 
            variant: 'destructive' 
          });
          return;
        }
      }

      // Sofort State aktualisieren (optimistic update)
      setMannschaften(prev => prev.map(m => 
        m.id === mannschaftId ? { ...m, schuetzenIds: newSchuetzenIds } : m
      ));

      const response = await fetch(`/api/km/mannschaften/${mannschaftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schuetzenIds: newSchuetzenIds })
      });

      if (response.ok) {
        toast({ title: '✅ Erfolg', description: 'Mannschaft aktualisiert und validiert' });
      } else {
        // Rollback bei Fehler
        loadData();
        toast({ title: 'Fehler', description: 'Aktualisierung fehlgeschlagen', variant: 'destructive' });
      }
    } catch (error) {
      // Rollback bei Fehler
      loadData();
      toast({ title: 'Fehler', description: 'Aktualisierung fehlgeschlagen', variant: 'destructive' });
    }
  };

  const filteredMannschaften = mannschaften.filter(mannschaft => {
    if (filter.verein && mannschaft.vereinId !== filter.verein) return false;
    if (filter.disziplin && mannschaft.disziplinId !== filter.disziplin) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade alle KM-Mannschaften...</p>
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

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">🏆 Alle KM-Mannschaften</h1>
          <p className="text-muted-foreground">Verwaltung aller Teams für die Kreismeisterschaft 2026</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mannschaften</CardTitle>
              <CardDescription>
                Automatisch generierte 3er-Teams basierend auf Meldungen aller Vereine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button 
                  onClick={generateMannschaften}
                  disabled={isGenerating || loading}
                  className="relative"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generiere Mannschaften...
                    </>
                  ) : (
                    '🚀 Alle Mannschaften automatisch generieren'
                  )}
                </Button>
                {mannschaften.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {mannschaften.length} Mannschaften vorhanden
                  </p>
                )}
                {isGenerating && (
                  <p className="text-sm text-blue-600 mt-2 animate-pulse">
                    🔄 Erstelle Teams aller Vereine und lade Daten neu...
                  </p>
                )}
              </div>

              {/* Filter */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={filter.verein}
                  onChange={(e) => setFilter(prev => ({ ...prev, verein: e.target.value }))}
                  className="p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">Alle Vereine</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
                <select
                  value={filter.disziplin}
                  onChange={(e) => setFilter(prev => ({ ...prev, disziplin: e.target.value }))}
                  className="p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">Alle Disziplinen</option>
                  {disziplinen.map(disziplin => (
                    <option key={disziplin.id} value={disziplin.id}>
                      {disziplin.spoNummer} - {disziplin.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {filteredMannschaften.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {mannschaften.length === 0 
                      ? 'Noch keine Mannschaften generiert. Klicken Sie "Automatisch generieren".'
                      : 'Keine Mannschaften für die gewählten Filter gefunden.'
                    }
                  </div>
                ) : (
                  filteredMannschaften.map(mannschaft => {
                    const verein = clubs.find(c => c.id === mannschaft.vereinId);
                    const disziplin = disziplinen.find(d => d.id === mannschaft.disziplinId);
                    const teamSchuetzen = mannschaft.schuetzenIds.map(id => 
                      schuetzen.find(s => s.id === id)
                    ).filter(Boolean);

                    return (
                      <div key={mannschaft.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {verein?.name} - {disziplin?.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {mannschaft.wettkampfklassen.join(', ')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingTeam(editingTeam === mannschaft.id ? null : mannschaft.id)}
                            >
                              {editingTeam === mannschaft.id ? 'Abbrechen' : 'Bearbeiten'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deleteMannschaft(mannschaft.id)}
                            >
                              Löschen
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {teamSchuetzen.map((schuetze) => (
                            <div key={schuetze?.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <span>
                                  {schuetze?.firstName && schuetze?.lastName 
                                    ? `${schuetze.firstName} ${schuetze.lastName}`
                                    : schuetze?.name || 'Unbekannt'
                                  } ({schuetze?.birthYear}, {schuetze?.gender === 'male' ? 'm' : schuetze?.gender === 'female' ? 'w' : '?'})
                                </span>
                                <div className="text-xs text-green-600 font-medium">
                                  VM: {(() => {
                                    const meldung = meldungen.find(m => m.schuetzeId === schuetze?.id && m.disziplinId === mannschaft.disziplinId);
                                    return meldung?.vmErgebnis?.ringe || '?';
                                  })()} Ringe
                                </div>
                                <div className="text-xs text-blue-600">
                                  AK: {(() => {
                                    if (!schuetze?.birthYear || !schuetze?.gender) return 'Unbekannt';
                                    
                                    const disziplin = disziplinen.find(d => d.id === mannschaft.disziplinId);
                                    if (!disziplin) return 'Unbekannt';
                                    
                                    const age = 2026 - schuetze.birthYear;
                                    const gender = schuetze.gender;
                                    const istAuflage = disziplin.auflage;
                                    
                                    if (istAuflage) {
                                      if (age <= 14) return gender === 'male' ? 'Schüler m' : 'Schüler w';
                                      else if (disziplin.spoNummer === '1.41' && age >= 15 && age <= 40) {
                                        if (age <= 16) return gender === 'male' ? 'Jugend m' : 'Jugend w';
                                        else if (age <= 18) return gender === 'male' ? 'Junioren II m' : 'Junioren II w';
                                        else if (age <= 20) return gender === 'male' ? 'Junioren I m' : 'Junioren I w';
                                        else return gender === 'male' ? 'Herren I' : 'Damen I';
                                      }
                                      else if (age < 41) return 'Nicht berechtigt';
                                      else if (age <= 50) return 'Senioren 0';
                                      else if (age <= 60) return gender === 'male' ? 'Senioren I m' : 'Seniorinnen I';
                                      else if (age <= 65) return gender === 'male' ? 'Senioren II m' : 'Seniorinnen II';
                                      else if (age <= 70) return gender === 'male' ? 'Senioren III m' : 'Seniorinnen III';
                                      else if (age <= 75) return gender === 'male' ? 'Senioren IV m' : 'Seniorinnen IV';
                                      else if (age <= 80) return gender === 'male' ? 'Senioren V m' : 'Seniorinnen V';
                                      else return gender === 'male' ? 'Senioren VI m' : 'Seniorinnen VI';
                                    } else {
                                      if (age <= 14) return gender === 'male' ? 'Schüler m' : 'Schüler w';
                                      else if (age <= 16) return gender === 'male' ? 'Jugend m' : 'Jugend w';
                                      else if (age <= 18) return gender === 'male' ? 'Junioren II m' : 'Junioren II w';
                                      else if (age <= 20) return gender === 'male' ? 'Junioren I m' : 'Junioren I w';
                                      else if (age <= 40) return gender === 'male' ? 'Herren I' : 'Damen I';
                                      else if (age <= 50) return gender === 'male' ? 'Herren II' : 'Damen II';
                                      else if (age <= 60) return gender === 'male' ? 'Herren III' : 'Damen III';
                                      else if (age <= 70) return gender === 'male' ? 'Herren IV' : 'Damen IV';
                                      else return gender === 'male' ? 'Herren V' : 'Damen V';
                                    }
                                  })()} 
                                </div>
                              </div>
                              {editingTeam === mannschaft.id && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={async () => {
                                    const newIds = mannschaft.schuetzenIds.filter(id => id !== schuetze?.id);
                                    await updateMannschaft(mannschaft.id, newIds);
                                  }}
                                >
                                  Entfernen
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        {editingTeam === mannschaft.id && (
                          <div className="mt-4 p-3 bg-blue-50 rounded">
                            <h4 className="font-medium mb-2">Schütze hinzufügen für {mannschaft.wettkampfklassen.join(', ')}: (Verfügbar: {schuetzen
                              .filter(s => {
                                if (mannschaft.schuetzenIds.includes(s.id)) return false;
                                const isInOtherTeam = mannschaften.some(m => 
                                  m.id !== mannschaft.id && 
                                  m.disziplinId === mannschaft.disziplinId && 
                                  m.schuetzenIds.includes(s.id)
                                );
                                return !isInOtherTeam;
                              })
                              .filter(s => {
                                const schuetzeClubId = s.kmClubId || s.rwkClubId || s.clubId;
                                if (schuetzeClubId !== mannschaft.vereinId) return false;
                                // Nur gemeldete Schützen zählen
                                const hasMeldung = meldungen.some(m => 
                                  m.schuetzeId === s.id && 
                                  m.disziplinId === mannschaft.disziplinId
                                );
                                return hasMeldung;
                              }).length})</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {schuetzen
                                .filter(s => {
                                  // Nicht bereits in dieser Mannschaft
                                  if (mannschaft.schuetzenIds.includes(s.id)) return false;
                                  // Nicht in irgendeiner anderen Mannschaft für diese Disziplin
                                  const isInOtherTeam = mannschaften.some(m => 
                                    m.id !== mannschaft.id && 
                                    m.disziplinId === mannschaft.disziplinId && 
                                    m.schuetzenIds.includes(s.id)
                                  );
                                  return !isInOtherTeam;
                                })
                                .filter(s => {
                                  const schuetzeClubId = s.kmClubId || s.rwkClubId || s.clubId;
                                  if (schuetzeClubId !== mannschaft.vereinId) return false;
                                  // Nur Schützen die für diese Disziplin gemeldet sind
                                  const hasMeldung = meldungen.some(m => 
                                    m.schuetzeId === s.id && 
                                    m.disziplinId === mannschaft.disziplinId
                                  );
                                  if (!hasMeldung) return false;
                                  
                                  // Korrekte Altersklassen-Kompatibilität
                                  const schuetzeAge = 2026 - s.birthYear;
                                  const disziplin = disziplinen.find(d => d.id === mannschaft.disziplinId);
                                  const isAuflage = disziplin?.name?.toLowerCase().includes('auflage');
                                  
                                  // Berechne Altersklasse des Schützen
                                  let schuetzeKlasse = '';
                                  if (schuetzeAge <= 14) {
                                    schuetzeKlasse = 'Schüler';
                                  } else if (schuetzeAge <= 16) {
                                    schuetzeKlasse = 'Jugend';
                                  } else if (schuetzeAge <= 18) {
                                    schuetzeKlasse = s.gender === 'male' ? 'Junioren II m' : 'Juniorinnen II';
                                  } else if (schuetzeAge <= 20) {
                                    schuetzeKlasse = s.gender === 'male' ? 'Junioren I m' : 'Juniorinnen I';
                                  } else if (isAuflage) {
                                    if (schuetzeAge <= 40) {
                                      schuetzeKlasse = s.gender === 'male' ? 'Herren I' : 'Damen I';
                                    } else if (schuetzeAge <= 50) {
                                      schuetzeKlasse = 'Senioren 0';
                                    } else if (schuetzeAge <= 60) {
                                      schuetzeKlasse = s.gender === 'male' ? 'Senioren I m' : 'Seniorinnen I';
                                    } else if (schuetzeAge <= 65) {
                                      schuetzeKlasse = s.gender === 'male' ? 'Senioren II m' : 'Seniorinnen II';
                                    } else if (schuetzeAge <= 70) {
                                      schuetzeKlasse = s.gender === 'male' ? 'Senioren III m' : 'Seniorinnen III';
                                    } else {
                                      schuetzeKlasse = s.gender === 'male' ? 'Senioren IV m' : 'Seniorinnen IV';
                                    }
                                  } else {
                                    if (schuetzeAge <= 40) {
                                      schuetzeKlasse = s.gender === 'male' ? 'Herren I' : 'Damen I';
                                    } else if (schuetzeAge <= 50) {
                                      schuetzeKlasse = s.gender === 'male' ? 'Herren II' : 'Damen II';
                                    } else if (schuetzeAge <= 60) {
                                      schuetzeKlasse = s.gender === 'male' ? 'Herren III' : 'Damen III';
                                    } else {
                                      schuetzeKlasse = s.gender === 'male' ? 'Herren IV' : 'Damen IV';
                                    }
                                  }
                                  
                                  // Altersklassen-Regeln nur für Auflage-Disziplinen
                                  if (!isAuflage) {
                                    // Freihand: Alle Altersklassen dürfen zusammen
                                    return true;
                                  }
                                  
                                  // Auflage: Spezielle Regeln
                                  const teamKlassen = mannschaft.wettkampfklassen;
                                  
                                  // Senioren 0 nur mit Senioren 0
                                  if (teamKlassen.includes('Senioren 0')) {
                                    return schuetzeKlasse === 'Senioren 0';
                                  }
                                  
                                  // Senioren I+II dürfen zusammen
                                  if (teamKlassen.some(k => k.includes('Senioren I') || k.includes('Senioren II'))) {
                                    return schuetzeKlasse.includes('Senioren I') || schuetzeKlasse.includes('Senioren II');
                                  }
                                  
                                  // Senioren III+ dürfen alle zusammen (III, IV, V, VI)
                                  if (teamKlassen.some(k => k.includes('Senioren III') || k.includes('Senioren IV') || k.includes('Senioren V'))) {
                                    return schuetzeKlasse.includes('Senioren III') || 
                                           schuetzeKlasse.includes('Senioren IV') || 
                                           schuetzeKlasse.includes('Senioren V') || 
                                           schuetzeKlasse.includes('Senioren VI');
                                  }
                                  
                                  // Herren/Damen I dürfen mit gleicher Stufe
                                  return teamKlassen.some(teamKlasse => {
                                    const teamBase = teamKlasse.replace('innen', 'en').replace(/ [mw]$/, '');
                                    const schuetzeBase = schuetzeKlasse.replace('innen', 'en').replace(/ [mw]$/, '');
                                    return teamBase === schuetzeBase;
                                  });
                                })
                                .slice(0, 15)
                                .map(schuetze => (
                                  <button
                                    key={schuetze.id}
                                    className="block w-full text-left p-2 hover:bg-blue-100 rounded text-sm"
                                    onClick={() => {
                                      if (mannschaft.schuetzenIds.length < 3) {
                                        const newIds = [...mannschaft.schuetzenIds, schuetze.id];
                                        updateMannschaft(mannschaft.id, newIds);
                                      }
                                    }}
                                  >
                                    {schuetze.firstName && schuetze.lastName 
                                      ? `${schuetze.firstName} ${schuetze.lastName}`
                                      : schuetze.name || 'Unbekannt'
                                    } ({schuetze.birthYear}, {schuetze.gender === 'male' ? 'm' : 'w'})
                                    <div className="text-xs text-gray-500">
                                      {(() => {
                                        const clubId = schuetze.kmClubId || schuetze.rwkClubId || schuetze.clubId;
                                        const club = clubs.find(c => c.id === clubId);
                                        return club?.name || 'Unbekannter Verein';
                                      })()}
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>📊 Statistiken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{mannschaften.length}</div>
                  <div className="text-sm text-blue-600">Mannschaften gesamt</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {clubs.filter(c => mannschaften.some(m => m.vereinId === c.id)).length}
                  </div>
                  <div className="text-sm text-green-600">Vereine mit Teams</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {disziplinen.filter(d => mannschaften.some(m => m.disziplinId === d.id)).length}
                  </div>
                  <div className="text-sm text-purple-600">Disziplinen aktiv</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Mannschaftsregeln
                <Link href="/km/mannschaftsregeln">
                  <Button size="sm" variant="outline">⚙️ Regeln bearbeiten</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="p-3 bg-blue-50 rounded">
                <p className="font-medium text-blue-800 mb-2">ℹ️ Aktuelle Regeln werden automatisch angewendet</p>
                <p className="text-blue-700 text-xs">
                  Die Mannschaftsbildung erfolgt nach den konfigurierten Altersklassen-Kombinationen.
                  Bei Regeländerungen werden Teams automatisch validiert.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>📋 Anleitung</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <strong>🚀 Mannschaften generieren:</strong>
                <ul className="list-disc pl-5 mt-1">
                  <li>Erstellt automatisch 3er-Teams aus allen Meldungen</li>
                  <li>Sortiert nach VM-Ergebnissen (beste zuerst)</li>
                  <li>Beachtet Altersklassen-Regeln</li>
                </ul>
              </div>
              <div>
                <strong>✏️ Teams bearbeiten:</strong>
                <ul className="list-disc pl-5 mt-1">
                  <li>Schützen hinzufügen/entfernen</li>
                  <li>Änderungen werden sofort gespeichert</li>
                  <li>Nur Schützen gleicher Altersklasse</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
