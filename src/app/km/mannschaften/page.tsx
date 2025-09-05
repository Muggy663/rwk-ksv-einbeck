"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useKMAuth } from '@/hooks/useKMAuth';
import { MannschaftsbildungService } from '@/lib/services/mannschaftsbildung-service';

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
  const [selectedClubId, setSelectedClubId] = useState('');

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
          console.log('🔍 Loaded mannschaften:', data.data?.length || 0);
          console.log('🔍 All mannschaften:', data.data);
          console.log('🔍 User club IDs:', userClubIds);
          
          // Debug jede Mannschaft einzeln
          (data.data || []).forEach((m, i) => {
            console.log(`Mannschaft ${i+1}:`, {
              vereinId: m.vereinId,
              clubId: m.clubId,
              matchesFilter: userClubIds.includes(m.vereinId || m.clubId)
            });
          });
          
          const filtered = (data.data || []).filter(m => 
            userClubIds.includes(m.vereinId || m.clubId)
          );
          console.log('🔍 Filtered mannschaften:', filtered.length, filtered);
          
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
        
        // Debug-Info anzeigen
        if (result.debugInfo && result.debugInfo.length > 0) {
          console.log('🔍 Debug Info:', result.debugInfo);
          result.debugInfo.forEach((info, i) => {
            if (info.type === 'grouping') {
              console.log(`🔍 Gruppierung: ${info.name} → ${info.klasse} → ${info.gruppenKey}`);
            } else {
              console.log(`Team ${i+1}:`, {
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
          <Link href="/km" className="text-primary hover:text-primary/80">← Zurück</Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">👥 Mannschaften KM 2026</h1>
            <p className="text-muted-foreground">Automatische Generierung und manuelle Anpassung</p>
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
                  const club = clubs.find(c => c.id === clubId);
                  return club ? (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ) : null;
                })}
              </select>
            </div>
          )}
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
              <div className="mb-4 space-y-3">
                <div className="flex gap-3">
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
                      '🚀 Automatisch generieren'
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Erstelle eine leere Mannschaft
                      const newTeam = {
                        vereinId: userClubIds[0] || 'unknown',
                        disziplinId: 'zBXMDsVZkxZdELRID66m', // Standard: 1.41
                        wettkampfklassen: ['Unbekannt'],
                        schuetzenIds: [],
                        name: 'Neue Mannschaft',
                        saison: '2026'
                      };
                      
                      fetch('/api/km/mannschaften', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newTeam)
                      }).then(res => {
                        if (res.ok) {
                          toast({ title: 'Erfolg', description: 'Leere Mannschaft erstellt' });
                          loadData();
                        }
                      });
                    }}
                  >
                    ➕ Mannschaft manuell erstellen
                  </Button>
                </div>
                {(() => {
                  const filteredMannschaften = mannschaften.filter(m => {
                    if (userClubIds.length === 0) return true;
                    const clubMatch = userClubIds.includes(m.vereinId || m.clubId);
                    const selectedClubMatch = !selectedClubId || (m.vereinId || m.clubId) === selectedClubId;
                    return clubMatch && selectedClubMatch;
                  });
                  return filteredMannschaften.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {filteredMannschaften.length} {userClubIds.length === 0 ? 'Mannschaften' : 'eigene Mannschaften'} vorhanden
                    </p>
                  );
                })()}
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
                  mannschaften
                    .filter(mannschaft => {
                      // Wenn userClubIds leer ist (Admin/KM-Organisator), zeige alle
                      if (userClubIds.length === 0) return true;
                      // Zeige nur Mannschaften der eigenen Vereine
                      const clubMatch = userClubIds.includes(mannschaft.vereinId || mannschaft.clubId);
                      // Zusätzlicher Filter nach ausgewähltem Verein
                      const selectedClubMatch = !selectedClubId || (mannschaft.vereinId || mannschaft.clubId) === selectedClubId;
                      return clubMatch && selectedClubMatch;
                    })
                    .map(mannschaft => {
                    const verein = clubs.find(c => c.id === mannschaft.vereinId || c.id === mannschaft.clubId);
                    const disziplin = disziplinen.find(d => d.id === mannschaft.disziplinId);
                    const teamSchuetzen = mannschaft.schuetzenIds.map(id => 
                      schuetzen.find(s => s.id === id)
                    ).filter(Boolean);

                    return (
                      <div key={mannschaft.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {verein?.name || `Verein-ID: ${mannschaft.vereinId || mannschaft.clubId}`} - {disziplin?.name || 'Luftgewehr'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {mannschaft.wettkampfklassen?.length > 0 ? mannschaft.wettkampfklassen.join(', ') : 'Herren/Damen'}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingTeam(editingTeam === mannschaft.id ? null : mannschaft.id)}
                          >
                            {editingTeam === mannschaft.id ? 'Fertig' : 'Bearbeiten'}
                          </Button>
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
                                meldungen.some(m => m.schuetzeId === s.id && m.disziplinId === mannschaft.disziplinId)
                              ).length === 0 && (
                                <div className="text-xs text-gray-500 p-2">
                                  Keine kompatiblen Schützen verfügbar (Altersklassen-Regeln).
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
        </div>
      </div>
    </div>
  );
}
