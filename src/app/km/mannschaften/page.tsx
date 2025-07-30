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

  useEffect(() => {
    console.log('useEffect triggered, hasKMAccess:', hasKMAccess, 'authLoading:', authLoading);
    if (hasKMAccess && !authLoading) {
      loadData();
    }
  }, [hasKMAccess, authLoading]);

  const loadData = async () => {
    try {
      console.log('Loading mannschaften data...');
      
      // Teste APIs einzeln
      try {
        console.log('Fetching mannschaften...');
        const mannschaftenRes = await fetch('/api/km/mannschaften');
        console.log('Mannschaften response:', mannschaftenRes.status);
        if (mannschaftenRes.ok) {
          const data = await mannschaftenRes.json();
          console.log('Mannschaften data:', data);
          setMannschaften(data.data || []);
        }
      } catch (e) {
        console.error('Mannschaften API failed:', e);
        setMannschaften([]);
      }
      
      try {
        console.log('Fetching schuetzen...');
        const schuetzenRes = await fetch('/api/shooters');
        console.log('Schuetzen response:', schuetzenRes.status);
        if (schuetzenRes.ok) {
          const data = await schuetzenRes.json();
          setSchuetzen(data.data || []);
        }
      } catch (e) {
        console.error('Schuetzen API failed:', e);
        setSchuetzen([]);
      }

      try {
        console.log('Fetching disziplinen...');
        const disziplinenRes = await fetch('/api/km/disziplinen');
        console.log('Disziplinen response:', disziplinenRes.status);
        if (disziplinenRes.ok) {
          const data = await disziplinenRes.json();
          setDisziplinen(data.data || []);
        }
      } catch (e) {
        console.error('Disziplinen API failed:', e);
        setDisziplinen([]);
      }
      
      try {
        console.log('Fetching clubs...');
        const clubsRes = await fetch('/api/clubs');
        console.log('Clubs response:', clubsRes.status);
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
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const generateMannschaften = async () => {
    setIsGenerating(true);
    toast({ title: 'Generierung gestartet', description: 'Mannschaften werden automatisch erstellt...' });
    
    try {
      const response = await fetch('/api/km/mannschaften/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saison: '2026' })
      });

      if (response.ok) {
        const result = await response.json();
        toast({ 
          title: 'Erfolg', 
          description: `${result.generated || 0} Mannschaften automatisch generiert` 
        });
        loadData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({ 
          title: 'Fehler', 
          description: errorData.error || 'Generierung fehlgeschlagen', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast({ 
        title: 'Fehler', 
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
                  disabled={isGenerating}
                  className="relative"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generiere Mannschaften...
                    </>
                  ) : (
                    <>
                      🔄 Mannschaften automatisch generieren
                    </>
                  )}
                </Button>
                {mannschaften.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {mannschaften.length} Mannschaften vorhanden
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
                          {teamSchuetzen.map((schuetze, index) => (
                            <div key={schuetze?.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span>{schuetze?.name} ({schuetze?.birthYear}, {schuetze?.gender === 'male' ? 'm' : 'w'})</span>
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
                          ))}
                        </div>

                        {editingTeam === mannschaft.id && (
                          <div className="mt-4 p-3 bg-blue-50 rounded">
                            <h4 className="font-medium mb-2">Schütze hinzufügen:</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {schuetzen
                                .filter(s => !mannschaft.schuetzenIds.includes(s.id))
                                .filter(s => userClubIds.some(clubId => 
                                  s.rwkClubId === clubId || s.clubId === clubId || s.kmClubId === clubId
                                ))
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
                                    {schuetze.name} ({schuetze.birthYear}, {schuetze.gender === 'male' ? 'm' : 'w'})
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
              <div className="mt-4 p-2 bg-yellow-50 rounded text-xs">
                <strong>💡 Tipp:</strong> Teams werden automatisch nach Wettkampfklassen und Vereinen gruppiert. Sie können die Vorschläge manuell anpassen.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}