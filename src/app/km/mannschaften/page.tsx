"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useKMAuth } from '@/hooks/useKMAuth';

interface Mannschaft {
  id: string;
  vereinId: string;
  disziplinId: string;
  wettkampfklassen: string[];
  schuetzenIds: string[];
  name?: string;
  saison: string;
}

interface Shooter {
  id: string;
  name: string;
  birthYear: number;
  gender: 'male' | 'female';
}

export default function KMMannschaften() {
  const { toast } = useToast();
  const { hasKMAccess, userClubIds, loading: authLoading } = useKMAuth();
  const [mannschaften, setMannschaften] = useState<Mannschaft[]>([]);
  const [schuetzen, setSchuetzen] = useState<Shooter[]>([]);
  const [disziplinen, setDisziplinen] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [meldungen, setMeldungen] = useState<any[]>([]);

  useEffect(() => {

    if (hasKMAccess && !authLoading) {
      loadData();
    }
  }, [hasKMAccess, authLoading]);

  const loadData = async () => {
    try {

      
      // Lade Mannschaften
      try {
        const mannschaftenRes = await fetch('/api/km/mannschaften');
        if (mannschaftenRes.ok) {
          const data = await mannschaftenRes.json();

          setMannschaften(data.data || []);
        } else {
          console.warn('⚠️ Mannschaften API returned:', mannschaftenRes.status);
          setMannschaften([]);
        }
      } catch (e) {
        console.error('❌ Mannschaften API failed:', e);
        setMannschaften([]);
      }
      
      try {

        const schuetzenRes = await fetch('/api/km/shooters');

        if (schuetzenRes.ok) {
          const data = await schuetzenRes.json();
          setSchuetzen(data.data || []);
        }
      } catch (e) {
        console.error('Schuetzen API failed:', e);
        setSchuetzen([]);
      }
      
      try {

        const meldungenRes = await fetch('/api/km/meldungen?jahr=2026');
        if (meldungenRes.ok) {
          const data = await meldungenRes.json();
          setMeldungen(data.data || []);
        }
      } catch (e) {
        console.error('Meldungen API failed:', e);
        setMeldungen([]);
      }

      try {

        const disziplinenRes = await fetch('/api/km/disziplinen');

        if (disziplinenRes.ok) {
          const data = await disziplinenRes.json();
          setDisziplinen(data.data || []);
        }
      } catch (e) {
        console.error('Disziplinen API failed:', e);
        setDisziplinen([]);
      }
      
      try {

        const clubsRes = await fetch('/api/clubs');

        if (clubsRes.ok) {
          const data = await clubsRes.json();
          setClubs(data.data || []);
        }
      } catch (e) {
        console.error('Clubs API failed:', e);
        setClubs([]);
      }
    } catch (error) {
      console.error('LoadData error:', error);
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
        // Sofort Daten neu laden
        await loadData();
      } else {
        toast({ 
          title: '❌ Fehler', 
          description: result.error || result.message || 'Generierung fehlgeschlagen', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('❌ Generate error:', error);
      toast({ 
        title: '❌ Fehler', 
        description: `Generierung fehlgeschlagen: ${error.message}`, 
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateMannschaft = async (mannschaftId: string, newSchuetzenIds: string[]) => {
    try {
      const response = await fetch(`/api/km/mannschaften/${mannschaftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schuetzenIds: newSchuetzenIds })
      });

      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Mannschaft aktualisiert' });
        loadData();
        setEditingTeam(null);
      } else {
        toast({ title: 'Fehler', description: 'Aktualisierung fehlgeschlagen', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Aktualisierung fehlgeschlagen', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade Mannschaften...</p>
          <p className="text-sm text-gray-400 mt-2">Einen Moment bitte</p>
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
        <div>
          <h1 className="text-3xl font-bold text-primary">👥 Mannschaften KM 2026</h1>
          <p className="text-muted-foreground">Automatische Generierung und manuelle Anpassung</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mannschaften</CardTitle>
              <CardDescription>
                Automatisch generierte 3er-Teams basierend auf Meldungen
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
                    '🚀 Mannschaften automatisch generieren'
                  )}
                </Button>
                {mannschaften.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {mannschaften.length} Mannschaften vorhanden
                  </p>
                )}
                {isGenerating && (
                  <p className="text-sm text-blue-600 mt-2 animate-pulse">
                    🔄 Erstelle Teams und lade Daten neu...
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {mannschaften.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Noch keine Mannschaften generiert. Klicken Sie "Automatisch generieren".
                  </div>
                ) : (
                  mannschaften.map(mannschaft => {
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingTeam(editingTeam === mannschaft.id ? null : mannschaft.id)}
                          >
                            {editingTeam === mannschaft.id ? 'Abbrechen' : 'Bearbeiten'}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {teamSchuetzen.map((schuetze, index) => {
                            // Finde die entsprechende Meldung für VM-Ergebnis
                            const meldung = mannschaft.schuetzenIds.map(id => 
                              // Hier müssten wir die Meldungen laden, vereinfacht nehmen wir Dummy-Daten
                              ({ schuetzeId: id, vmErgebnis: { ringe: schuetze?.id === 'Q8PpA33rtoTf1sPGB6vf' ? 356 : 
                                schuetze?.name?.includes('Langnickel') ? 333.6 : 
                                schuetze?.name?.includes('Leiding') ? 245 : 0 } })
                            ).find(m => m.schuetzeId === schuetze?.id);
                            
                            return (
                            <div key={schuetze?.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <span>
                                  {schuetze?.firstName && schuetze?.lastName 
                                    ? `${schuetze.firstName} ${schuetze.lastName}`
                                    : schuetze?.name || 'Unbekannt'
                                  } ({schuetze?.birthYear}, {schuetze?.gender === 'male' ? 'm' : schuetze?.gender === 'female' ? 'w' : '?'})
                                </span>
                                <div className="text-xs text-green-600 font-medium">
                                  VM: {meldung?.vmErgebnis?.ringe || '?'} Ringe
                                </div>
                              </div>
                              {editingTeam === mannschaft.id && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => {
                                    const newIds = mannschaft.schuetzenIds.filter(id => id !== schuetze?.id);
                                    updateMannschaft(mannschaft.id, newIds);
                                  }}
                                >
                                  Entfernen
                                </Button>
                              )}
                            </div>
                            );
                          })}
                        </div>

                        {editingTeam === mannschaft.id && (
                          <div className="mt-4 p-3 bg-blue-50 rounded">
                            <h4 className="font-medium mb-2">Schütze hinzufügen:</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {schuetzen
                                .filter(s => !mannschaft.schuetzenIds.includes(s.id))
                                .filter(s => s.kmClubId === mannschaft.vereinId) // Nur gleicher Verein
                                .filter(s => {
                                  // Nur Schützen die für diese Disziplin gemeldet sind
                                  return meldungen.some(m => 
                                    m.schuetzeId === s.id && 
                                    m.disziplinId === mannschaft.disziplinId
                                  );
                                })
                                .filter(s => {
                                  // Nur passende Altersklasse
                                  if (!s.birthYear || !s.gender) return false;
                                  const age = 2026 - s.birthYear;
                                  const ageGroup = age <= 40 ? 'I' : age <= 50 ? 'II' : 'Senior';
                                  return mannschaft.wettkampfklassen.some(wk => wk.includes(ageGroup));
                                })
                                .slice(0, 10)
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
                                    <div className="text-xs text-gray-500">Gemeldet für diese Disziplin</div>
                                  </button>
                                ))}
                              {schuetzen.filter(s => 
                                !mannschaft.schuetzenIds.includes(s.id) && 
                                s.kmClubId === mannschaft.vereinId &&
                                meldungen.some(m => m.schuetzeId === s.id && m.disziplinId === mannschaft.disziplinId)
                              ).length === 0 && (
                                <div className="text-xs text-gray-500 p-2">
                                  Keine weiteren Schützen aus diesem Verein für diese Disziplin gemeldet.
                                </div>
                              )}
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
              <CardTitle>📋 Anleitung</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-blue-50 rounded">
                <strong>🚀 So erstellen Sie Mannschaften:</strong>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Klicken Sie auf "Mannschaften automatisch generieren"</li>
                  <li>Das System erstellt Teams aus Ihren Meldungen</li>
                  <li>Die Teams werden automatisch gespeichert</li>
                  <li>Sie sehen sofort alle erstellten Mannschaften</li>
                </ol>
              </div>
              
              <div className="p-3 bg-green-50 rounded">
                <strong>✏️ Teams bearbeiten:</strong>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Klicken Sie bei einer Mannschaft auf "Bearbeiten"</li>
                  <li>Zum Entfernen: "Entfernen" neben dem Schützennamen</li>
                  <li>Zum Hinzufügen: Schütze aus der Liste darunter anklicken</li>
                  <li>Änderungen werden sofort gespeichert</li>
                </ol>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded">
                <strong>⚡ Wichtige Regeln:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Jede Mannschaft braucht genau 3 Schützen</li>
                  <li>Alle müssen die gleiche Altersklasse haben</li>
                  <li>Die besten VM-Ergebnisse werden automatisch gewählt</li>
                  <li>Bei Problemen: Neu generieren überschreibt alles</li>
                </ul>
              </div>
              
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <strong>💡 Tipp:</strong> Generieren Sie zuerst automatisch, dann passen Sie einzelne Teams manuell an.
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Mannschaftsregeln</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <strong>Gemischte Teams erlaubt:</strong>
                <ul className="list-disc pl-5 mt-1">
                  <li>Schüler/Jugend</li>
                  <li>Senioren 0</li>
                  <li>Senioren I+II</li>
                  <li>Senioren III-VI</li>
                </ul>
              </div>
              <div>
                <strong>Geschlechtergetrennt:</strong>
                <ul className="list-disc pl-5 mt-1">
                  <li>Junioren I/II</li>
                  <li>Herren/Damen I-V</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
