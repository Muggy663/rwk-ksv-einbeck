"use client";

import React, { useState, useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useKMAuth } from '@/hooks/useKMAuth';
import { MannschaftsbildungService } from '@/lib/services/mannschaftsbildung-service';
import { BackButton } from '@/components/ui/back-button';
import { KMProvider, useKMContext } from '@/contexts/KMContext';
import { KMClubSwitcher } from '@/components/ui/km-club-switcher';

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

function KMMannschaftenContent() {
  const { toast } = useToast();
  const { hasKMAccess, userRole, loading: authLoading } = useKMAuth();
  const { currentClubId, userClubIds } = useKMContext();
  const [mannschaften, setMannschaften] = useState<Mannschaft[]>([]);
  const [schuetzen, setSchuetzen] = useState<Shooter[]>([]);
  const [disziplinen, setDisziplinen] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [meldungen, setMeldungen] = useState<any[]>([]);

  const [saisons, setSaisons] = useState<any[]>([]);
  const [selectedSaison, setSelectedSaison] = useState<string>('');

  useEffect(() => {
    if (hasKMAccess && !authLoading && !dataLoaded) {
      loadSaisons();
    }
  }, [hasKMAccess, authLoading, dataLoaded]);
  
  useEffect(() => {
    if (selectedSaison) {
      setDataLoaded(false);
    }
  }, [selectedSaison]);
  
  useEffect(() => {
    if (selectedSaison && !dataLoaded) {
      loadData();
    }
  }, [selectedSaison, dataLoaded]);

  const loadSaisons = async () => {
    try {
      const saisonRes = await fetch('/api/km/saisons?status=aktiv');
      if (saisonRes.ok) {
        const saisonData = await saisonRes.json();
        const aktiveSaisons = (saisonData.data || []).sort((a, b) => {
          const today = new Date();
          const getDeadline = (s) => {
            if (!s.meldeschluss) return new Date(0);
            if (s.meldeschluss.includes('.') && s.meldeschluss.length > 6) {
              const [day, month, year] = s.meldeschluss.split('.');
              return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              const [day, month] = s.meldeschluss.split('.');
              return new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
            }
          };
          
          const aExpired = today > getDeadline(a);
          const bExpired = today > getDeadline(b);
          
          if (aExpired !== bExpired) {
            return aExpired ? 1 : -1;
          }
          return b.jahr - a.jahr;
        });
        setSaisons(aktiveSaisons);
      }
    } catch (e) {
      logError('Saisons API failed:', e);
      setSaisons([]);
    }
    setLoading(false);
    setDataLoaded(true);
  };

  const loadData = async () => {
    if (!selectedSaison) {
      setMannschaften([]);
      setMeldungen([]);
      return;
    }
    
    try {
      // Lade Mannschaften
      try {
        const mannschaftenRes = await fetch(`/api/km/mannschaften?saison=${selectedSaison}`);
        if (mannschaftenRes.ok) {
          const data = await mannschaftenRes.json();
          logDebug('🔍 Loaded mannschaften:', data.data?.length || 0);
          logDebug('🔍 All mannschaften:', data.data);
          logDebug('🔍 User club IDs:', userClubIds);
          
          // Debug jede Mannschaft einzeln
          (data.data || []).forEach((m, i) => {
            logDebug(`Mannschaft ${i+1}:`, {
              vereinId: m.vereinId,
              clubId: m.clubId,
              matchesFilter: userClubIds.includes(m.vereinId || m.clubId)
            });
          });
          
          const filtered = (data.data || []).filter(m => 
            userClubIds.includes(m.vereinId || m.clubId)
          );
          logDebug('🔍 Filtered mannschaften:', filtered.length, filtered);
          
          setMannschaften(data.data || []);
        } else {
          logWarn('⚠️ Mannschaften API returned:', mannschaftenRes.status);
          setMannschaften([]);
        }
      } catch (e) {
        logError('❌ Mannschaften API failed:', e);
        setMannschaften([]);
      }
      
      try {

        const schuetzenRes = await fetch('/api/shooters');

        if (schuetzenRes.ok) {
          const data = await schuetzenRes.json();
          setSchuetzen(data.data || []);
        }
      } catch (e) {
        logError('Schuetzen API failed:', e);
        setSchuetzen([]);
      }
      
      try {

        const meldungenRes = await fetch(`/api/km/meldungen?saison=${selectedSaison}`);
        if (meldungenRes.ok) {
          const data = await meldungenRes.json();
          setMeldungen(data.data || []);
        }
      } catch (e) {
        setMeldungen([]);
      }

      try {
        const disziplinenRes = await fetch(`/api/km/disziplinen?saisonId=${selectedSaison || ''}`);
        if (disziplinenRes.ok) {
          const data = await disziplinenRes.json();
          setDisziplinen(data.data || []);
        }
      } catch (e) {
        logError('Disziplinen API failed:', e);
        setDisziplinen([]);
      }
      
      try {

        const clubsRes = await fetch('/api/clubs');

        if (clubsRes.ok) {
          const data = await clubsRes.json();
          setClubs(data.data || []);
        }
      } catch (e) {
        logError('Clubs API failed:', e);
        setClubs([]);
      }
    } catch (error) {
      logError('LoadData error:', error);
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setDataLoaded(true);
    }
  };

  const generateMannschaften = async () => {
    setIsGenerating(true);
    toast({ title: '🚀 Generierung gestartet', description: 'Mannschaften werden automatisch erstellt...' });
    
    try {

      const response = await fetch('/api/km/mannschaften/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saison: selectedSaison || saisons[0]?.id || '2026' })
      });

      const result = await response.json();


      if (response.ok && result.success) {
        toast({ 
          title: '✅ Erfolg', 
          description: result.message || `${result.generated || 0} Mannschaften generiert`
        });
        
        // Debug-Info anzeigen
        if (result.debugInfo && result.debugInfo.length > 0) {
          logDebug('🔍 Debug Info:', result.debugInfo);
          result.debugInfo.forEach((info, i) => {
            if (info.type === 'grouping') {
              logDebug(`🔍 Gruppierung: ${info.name} → ${info.klasse} → ${info.gruppenKey}`);
            } else {
              logDebug(`Team ${i+1}:`, {
                shooters: info.shooterNames,
                classes: info.uniqueKlassen,
                rejected: info.rejected,
                teamSize: info.teamSize,
                auflage: info.istAuflage,
                spoNummer: info.spoNummer
              });
            }
          });
        }
        
        // Warte kurz und lade dann Daten neu
        setTimeout(async () => {
          setDataLoaded(false);
          await loadData();
        }, 1000);
      } else {
        toast({ 
          title: '❌ Fehler', 
          description: result.error || result.message || 'Generierung fehlgeschlagen', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      logError('❌ Generate error:', error);
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
      // Sofort State aktualisieren (optimistic update)
      setMannschaften(prev => prev.map(m => 
        m.id === mannschaftId ? { ...m, schuetzenIds: newSchuetzenIds } : m
      ));

      const response = await fetch(`/api/km/mannschaften/${mannschaftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schuetzenIds: newSchuetzenIds })
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: '✅ Erfolg', description: 'Mannschaft aktualisiert' });
      } else {
        // Rollback bei Fehler
        loadData();
        toast({ title: 'Fehler', description: result.error || 'Aktualisierung fehlgeschlagen', variant: 'destructive' });
      }
    } catch (error) {
      // Rollback bei Fehler
      loadData();
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
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <BackButton className="mr-2" fallbackHref="/km" />
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
                  {saisons.map(saison => {
                    const today = new Date();
                    let isExpired = false;
                    
                    if (saison.meldeschluss) {
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
                    
                    return (
                      <option 
                        key={saison.id} 
                        value={saison.id}
                        style={isExpired ? { color: '#999', backgroundColor: '#f5f5f5' } : {}}
                      >
                        {saison.name}{isExpired ? ' - Meldeschluss vorbei' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">👥 Mannschaften KM</h1>
            <p className="text-muted-foreground">Automatische Generierung und manuelle Anpassung</p>
          </div>
          
          <div className="max-w-md">
            <KMClubSwitcher />
          </div>
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
              {!selectedSaison && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-6">
                    <div className="text-center py-4">
                      <p className="text-orange-800 font-medium mb-2">⚠️ Bitte wählen Sie zuerst eine Saison aus</p>
                      <p className="text-sm text-orange-600">Die Mannschaftsverwaltung wird erst nach der Saisonauswahl angezeigt.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {selectedSaison && (
              <div className="mb-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={generateMannschaften}
                    disabled={isGenerating || loading}
                    className="relative w-full sm:w-auto"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generiere...
                      </>
                    ) : (
                      '🚀 Automatisch generieren'
                    )}
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <select 
                      id="disziplinSelect"
                      className="border rounded px-3 py-2 min-w-[200px]"
                      defaultValue=""
                    >
                      <option value="">Disziplin wählen...</option>
                      {disziplinen.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const selectElement = document.getElementById('disziplinSelect') as HTMLSelectElement;
                        const selectedDisziplinId = selectElement?.value;
                        
                        if (!selectedDisziplinId) {
                          toast({ title: 'Fehler', description: 'Bitte wählen Sie eine Disziplin aus', variant: 'destructive' });
                          return;
                        }
                        
                        const newTeam = {
                          vereinId: userClubIds[0] || 'unknown',
                          disziplinId: selectedDisziplinId,
                          wettkampfklassen: ['Unbekannt'],
                          schuetzenIds: [],
                          name: `Neue Mannschaft`,
                          saison: selectedSaison || saisons[0]?.id || '2026'
                        };
                        
                        fetch('/api/km/mannschaften', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newTeam)
                        }).then(res => {
                          if (res.ok) {
                            toast({ title: 'Erfolg', description: 'Leere Mannschaft erstellt' });
                            loadData();
                            selectElement.value = '';
                          } else {
                            toast({ title: 'Fehler', description: 'Mannschaft konnte nicht erstellt werden', variant: 'destructive' });
                          }
                        }).catch(error => {
                          toast({ title: 'Fehler', description: 'Netzwerkfehler', variant: 'destructive' });
                        });
                      }}
                      className="w-full sm:w-auto"
                    >
                      ➕ Manuell erstellen
                    </Button>
                  </div>
                </div>
                {(() => {
                  const filteredMannschaften = mannschaften.filter(m => {
                    const saisonMatch = !selectedSaison || m.saison === selectedSaison;
                    if (userClubIds.length === 0) return saisonMatch;
                    const clubMatch = userClubIds.includes(m.vereinId || m.clubId);
                    const currentClubMatch = !currentClubId || (m.vereinId || m.clubId) === currentClubId;
                    return saisonMatch && clubMatch && currentClubMatch;
                  });
                  return filteredMannschaften.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {filteredMannschaften.length} {userClubIds.length === 0 ? 'Mannschaften' : currentClubId ? 'Mannschaften für aktuellen Verein' : 'eigene Mannschaften'} vorhanden
                    </p>
                  );
                })()}
                {isGenerating && (
                  <p className="text-sm text-blue-600 mt-2 animate-pulse">
                    🔄 Erstelle Teams und lade Daten neu...
                  </p>
                )}
              </div>
              )
              }

              {selectedSaison && (
              <div className="space-y-4">
                {mannschaften.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Noch keine Mannschaften generiert. Klicken Sie "Automatisch generieren".
                  </div>
                ) : (
                  mannschaften
                    .filter(mannschaft => {
                      const saisonMatch = !selectedSaison || mannschaft.saison === selectedSaison;
                      
                      if (userClubIds.length === 0) return saisonMatch;
                      
                      const clubMatch = userClubIds.includes(mannschaft.vereinId || mannschaft.clubId);
                      const currentClubMatch = !currentClubId || (mannschaft.vereinId || mannschaft.clubId) === currentClubId;
                      return saisonMatch && clubMatch && currentClubMatch;
                    })
                    .map(mannschaft => {
                    const verein = clubs.find(c => c.id === mannschaft.vereinId || c.id === mannschaft.clubId);
                    const disziplin = disziplinen.find(d => d.id === mannschaft.disziplinId);
                    const teamSchuetzen = mannschaft.schuetzenIds.map(id => 
                      schuetzen.find(s => s.id === id)
                    ).filter(Boolean);

                    return (
                      <div key={mannschaft.id} className="p-4 border rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {verein?.name || `Verein-ID: ${mannschaft.vereinId || mannschaft.clubId}`} - {disziplin?.name || 'Luftgewehr'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {(() => {
                                const berechnet = teamSchuetzen.map(schuetze => {
                                  if (!schuetze?.birthYear || !schuetze?.gender) return 'Unbekannt';
                                  
                                  const age = 2026 - schuetze.birthYear;
                                  const isAuflage = disziplin?.auflage;
                                  const isMale = schuetze.gender === 'male';
                                  
                                  if (age <= 14) return 'Schüler';
                                  if (age <= 16) return 'Jugend';
                                  if (age <= 18) return `Junioren II ${isMale ? 'm' : 'w'}`;
                                  if (age <= 20) return `Junioren I ${isMale ? 'm' : 'w'}`;
                                  
                                  if (isAuflage) {
                                    if (age <= 40) return `${isMale ? 'Herren' : 'Damen'} I`;
                                    if (age <= 50) return 'Senioren 0';
                                    if (age <= 60) return 'Senioren I';
                                    if (age <= 65) return 'Senioren II';
                                    if (age <= 70) return 'Senioren III';
                                    if (age <= 75) return 'Senioren IV';
                                    if (age <= 80) return 'Senioren V';
                                    return 'Senioren VI';
                                  } else {
                                    if (age <= 40) return `${isMale ? 'Herren' : 'Damen'} I`;
                                    if (age <= 50) return `${isMale ? 'Herren' : 'Damen'} II`;
                                    if (age <= 60) return `${isMale ? 'Herren' : 'Damen'} III`;
                                    if (age <= 70) return `${isMale ? 'Herren' : 'Damen'} IV`;
                                    return `${isMale ? 'Herren' : 'Damen'} V`;
                                  }
                                });
                                const unique = [...new Set(berechnet.filter(k => k !== 'Unbekannt'))];
                                return unique.length > 0 ? unique.join(', ') : 'Gemischte Klassen';
                              })()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingTeam(editingTeam === mannschaft.id ? null : mannschaft.id)}
                              className="w-full sm:w-auto"
                            >
                              {editingTeam === mannschaft.id ? 'Fertig' : 'Bearbeiten'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={async () => {
                                if (confirm('Mannschaft wirklich löschen?')) {
                                  try {
                                    const response = await fetch(`/api/km/mannschaften/${mannschaft.id}`, {
                                      method: 'DELETE'
                                    });
                                    if (response.ok) {
                                      toast({ title: 'Erfolg', description: 'Mannschaft gelöscht' });
                                      loadData();
                                    } else {
                                      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
                                    }
                                  } catch (error) {
                                    toast({ title: 'Fehler', description: 'Netzwerkfehler', variant: 'destructive' });
                                  }
                                }
                              }}
                              className="w-full sm:w-auto"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {teamSchuetzen.map((schuetze, index) => {
                            // Finde die entsprechende Meldung für VM-Ergebnis und Altersklasse
                            const meldung = meldungen.find(m => 
                              m.schuetzeId === schuetze?.id && 
                              m.disziplinId === mannschaft.disziplinId
                            );
                            
                            return (
                            <div key={schuetze?.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <span>
                                  {schuetze?.firstName && schuetze?.lastName 
                                    ? `${schuetze.firstName} ${schuetze.lastName}`
                                    : schuetze?.name || 'Unbekannt'
                                  } ({schuetze?.birthYear}, {schuetze?.gender === 'male' ? 'm' : schuetze?.gender === 'female' ? 'w' : '?'})
                                </span>
                                <div className="text-xs text-green-600 font-medium">
                                  VM: {meldung?.vmErgebnis?.ringe ? `${meldung.vmErgebnis.ringe} Ringe` : 'Noch kein VM-Ergebnis'}
                                </div>
                                <div className="text-xs text-blue-600">
                                  AK: {(() => {
                                    // Berechne wie in km/uebersicht
                                    if (!schuetze?.birthYear || !schuetze?.gender) return 'Unbekannt';
                                    
                                    const disziplin = disziplinen.find(d => d.id === mannschaft.disziplinId);
                                    if (!disziplin) return 'Unbekannt';
                                    
                                    const age = 2026 - schuetze.birthYear;
                                    const gender = schuetze.gender;
                                    const istAuflage = disziplin.auflage;
                                    
                                    if (istAuflage) {
                                      // Lichtgewehr (11.11) - spezielle Altersklasse für 6-11 Jahre
                                      if (disziplin.spoNummer === '11.11' && age >= 6 && age <= 11) {
                                        return gender === 'male' ? 'Lichtgewehr m' : 'Lichtgewehr w';
                                      }
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
                              {editingTeam === mannschaft.id && schuetze?.id && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const newIds = mannschaft.schuetzenIds.filter(id => id !== schuetze.id);
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
                                .filter(s => s.clubId === mannschaft.vereinId || s.kmClubId === mannschaft.vereinId)
                                .filter(s => {
                                  // Nur Schützen die für diese Disziplin gemeldet sind
                                  return meldungen.some(m => 
                                    m.schuetzeId === s.id && 
                                    m.disziplinId === mannschaft.disziplinId
                                  );
                                })
                                .filter(s => {
                                  // Prüfe ob Schütze bereits in einer anderen Mannschaft DERSELBEN DISZIPLIN ist
                                  const istBereitsInDieserDisziplin = mannschaften.some(otherTeam => 
                                    otherTeam.id !== mannschaft.id && 
                                    otherTeam.disziplinId === mannschaft.disziplinId &&
                                    otherTeam.schuetzenIds.includes(s.id)
                                  );
                                  return !istBereitsInDieserDisziplin;
                                })
                                .filter(s => {
                                  // Prüfe Kompatibilität mit Service
                                  if (teamSchuetzen.length === 0) return true;
                                  
                                  // Erstelle Test-Team mit diesem Schützen
                                  const testTeam = [...teamSchuetzen, s];
                                  
                                  // Synchrone Prüfung - vereinfacht für UI
                                  return teamSchuetzen.every(teamSchuetze => {
                                    const schuetzeMeldung = meldungen.find(m => m.schuetzeId === s.id && m.disziplinId === mannschaft.disziplinId);
                                    const teamMeldung = meldungen.find(m => m.schuetzeId === teamSchuetze.id && m.disziplinId === mannschaft.disziplinId);
                                    
                                    if (!schuetzeMeldung?.altersklasse || !teamMeldung?.altersklasse) return true;
                                    
                                    // Nutze die konfigurierten Regeln aus system_config
                                    const ak1 = schuetzeMeldung.altersklasse;
                                    const ak2 = teamMeldung.altersklasse;
                                    
                                    // TODO: Hier sollten die echten Regeln aus system_config verwendet werden
                                    // Vorerst vereinfachte Prüfung bis Service async-kompatibel ist
                                    
                                    // Senioren 0 nur untereinander
                                    if (ak1.includes('Senioren 0') || ak2.includes('Senioren 0')) {
                                      return ak1.includes('Senioren 0') && ak2.includes('Senioren 0');
                                    }
                                    
                                    // Senioren I+II zusammen
                                    if ((ak1.includes('Senioren I') || ak1.includes('Senioren II')) && 
                                        (ak2.includes('Senioren I') || ak2.includes('Senioren II'))) {
                                      return true;
                                    }
                                    
                                    return ak1 === ak2;
                                  });
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
                                    <div>
                                      <span>
                                        {schuetze.firstName && schuetze.lastName 
                                          ? `${schuetze.firstName} ${schuetze.lastName}`
                                          : schuetze.name || 'Unbekannt'
                                        } ({schuetze.birthYear}, {schuetze.gender === 'male' ? 'm' : 'w'})
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        AK: {(() => {
                                          const disziplin = disziplinen.find(d => d.id === mannschaft.disziplinId);
                                          if (!schuetze.birthYear || !schuetze.gender || !disziplin) return 'Unbekannt';
                                          
                                          const age = 2026 - schuetze.birthYear;
                                          const gender = schuetze.gender;
                                          const istAuflage = disziplin.auflage;
                                          
                                          if (istAuflage) {
                                            // Lichtgewehr (11.11) - spezielle Altersklasse für 6-11 Jahre
                                            if (disziplin.spoNummer === '11.11' && age >= 6 && age <= 11) {
                                              return gender === 'male' ? 'Lichtgewehr m' : 'Lichtgewehr w';
                                            }
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
                                  </button>
                                ))}
                              {schuetzen.filter(s => 
                                !mannschaft.schuetzenIds.includes(s.id) && 
                                (s.clubId === mannschaft.vereinId || s.kmClubId === mannschaft.vereinId) &&
                                meldungen.some(m => m.schuetzeId === s.id && m.disziplinId === mannschaft.disziplinId) &&
                                !mannschaften.some(otherTeam => 
                                  otherTeam.id !== mannschaft.id && 
                                  otherTeam.disziplinId === mannschaft.disziplinId &&
                                  otherTeam.schuetzenIds.includes(s.id)
                                )
                              ).length === 0 && (
                                <div className="text-xs text-gray-500 p-2">
                                  Keine kompatiblen Schützen verfügbar (bereits in anderer Mannschaft dieser Disziplin oder Altersklassen-Regeln).
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
              )}
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
                  <li>Oder: Disziplin wählen und "Manuell erstellen"</li>
                  <li>Die Teams werden automatisch gespeichert</li>
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
              
              <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-200 rounded text-xs text-gray-800 dark:text-gray-900">
                <strong>💡 Tipp:</strong> Generieren Sie zuerst automatisch, dann passen Sie einzelne Teams manuell an.
              </div>
            </CardContent>
          </Card>
          
          {(userRole === 'admin' || userRole === 'km_organisator') && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Mannschaftsregeln</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <Link href="/km/mannschaftsregeln" className="block">
                <Button size="sm" variant="outline" className="w-full mb-3">⚙️ Regeln bearbeiten</Button>
              </Link>
              <div className="p-3 bg-blue-50 rounded">
                <p className="font-medium text-blue-800 mb-2">ℹ️ Aktuelle Regeln werden automatisch angewendet</p>
                <p className="text-blue-700 text-xs">
                  Die Mannschaftsbildung erfolgt nach den konfigurierten Altersklassen-Kombinationen.
                  Bei Regeländerungen werden Teams automatisch validiert.
                </p>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KMMannschaften() {
  return (
    <KMProvider>
      <KMMannschaftenContent />
    </KMProvider>
  );
}
