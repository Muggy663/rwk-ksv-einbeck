"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { Shooter, KMDisziplin, KMMeldung } from '@/types';
import { getStartVereinForDisziplin } from '@/lib/services/km-startrechte-service';
import { useKMAuth } from '@/hooks/useKMAuth';
import { useAuthContext } from '@/components/auth/AuthContext';

export default function KMMeldungen() {
  const { toast } = useToast();
  const { userClubIds, isMultiClub } = useKMAuth();
  const { user } = useAuthContext();
  const [meldeModus, setMeldeModus] = useState<'schuetze-disziplinen' | 'disziplin-schuetzen'>('schuetze-disziplinen');
  const [selectedSchuetze, setSelectedSchuetze] = useState('');
  const [selectedSchuetzen, setSelectedSchuetzen] = useState<string[]>([]);
  const [selectedDisziplinen, setSelectedDisziplinen] = useState<string[]>([]);
  const [selectedDisziplin, setSelectedDisziplin] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [schuetzenSuche, setSchuetzenSuche] = useState('');
  const [lmTeilnahme, setLmTeilnahme] = useState<{[key: string]: boolean}>({});
  const [anmerkung, setAnmerkung] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // VM-Ergebnis Felder pro Disziplin
  const [vmErgebnisse, setVmErgebnisse] = useState<{[key: string]: {ringe: string, datum: string, bemerkung: string}}>({});
  
  const [schuetzen, setSchuetzen] = useState<Shooter[]>([]);
  const [disziplinen, setDisziplinen] = useState<KMDisziplin[]>([]);
  const [meldungen, setMeldungen] = useState<KMMeldung[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMeldung, setEditingMeldung] = useState<KMMeldung | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Zwischenspeicher für Meldungen
  const [pendingMeldungen, setPendingMeldungen] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [shootersRes, disziplinenRes, meldungenRes, clubsRes] = await Promise.all([
        fetch('/api/km/shooters'), // Zentrale shooters collection
        fetch('/api/km/disziplinen'),
        fetch('/api/km/meldungen'),
        fetch('/api/clubs')
      ]);
      
      if (shootersRes.ok) {
        const shootersData = await shootersRes.json();
        setSchuetzen(shootersData.data || []);
      }
      
      if (disziplinenRes.ok) {
        const disziplinenData = await disziplinenRes.json();
        setDisziplinen(disziplinenData.data || []);
      }
      
      if (meldungenRes.ok) {
        const meldungenData = await meldungenRes.json();
        setMeldungen(meldungenData.data || []);
      }
      
      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        setClubs(clubsData.data || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeldung = (meldung: KMMeldung) => {
    setEditingMeldung(meldung);
    setSelectedSchuetze(meldung.schuetzeId);
    setSelectedDisziplinen([meldung.disziplinId]);
    setLmTeilnahme({[meldung.disziplinId]: meldung.lmTeilnahme});
    setAnmerkung(meldung.anmerkung || '');
    if (meldung.vmErgebnis) {
      // Sichere Date-Konvertierung
      let datum = '';
      try {
        const vmDatum = meldung.vmErgebnis.datum;
        if (vmDatum) {
          const date = typeof vmDatum === 'string' ? new Date(vmDatum) : vmDatum.toDate ? vmDatum.toDate() : new Date(vmDatum);
          if (!isNaN(date.getTime())) {
            datum = date.toISOString().split('T')[0];
          }
        }
      } catch (e) {
        console.warn('Date parsing error:', e);
      }
      
      setVmErgebnisse({
        [meldung.disziplinId]: {
          ringe: meldung.vmErgebnis.ringe?.toString() || '',
          datum,
          bemerkung: meldung.vmErgebnis.bemerkung || ''
        }
      });
    }
  };
  
  const handleDeleteMeldung = async (meldungId: string) => {
    if (!confirm('Meldung wirklich löschen?')) return;
    
    setDeletingId(meldungId);
    try {
      const response = await fetch(`/api/km/meldungen/${meldungId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Meldung gelöscht' });
        loadData();
      } else {
        toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddToPending = () => {
    if (!selectedSchuetze || selectedDisziplinen.length === 0) return;
    
    const newPending = selectedDisziplinen.map(disziplinId => {
      const vmData = vmErgebnisse[disziplinId];
      return {
        schuetzeId: selectedSchuetze,
        disziplinId,
        lmTeilnahme: lmTeilnahme[disziplinId] || false,
        anmerkung,
        vmErgebnis: vmData?.ringe ? {
          ringe: parseFloat(vmData.ringe),
          datum: new Date(vmData.datum || Date.now()),
          bemerkung: vmData.bemerkung || ''
        } : undefined
      };
    });
    
    setPendingMeldungen(prev => [...prev, ...newPending]);
    
    // Form zurücksetzen
    setSelectedSchuetze('');
    setSelectedDisziplinen([]);
    setLmTeilnahme({});
    setAnmerkung('');
    setVmErgebnisse({});
    
    toast({ title: 'Hinzugefügt', description: `${newPending.length} Meldung(en) zum Zwischenspeicher hinzugefügt` });
  };
  
  const handleBulkSubmit = async () => {
    console.log('handleBulkSubmit called, pending:', pendingMeldungen.length);
    if (pendingMeldungen.length === 0) {
      console.log('No pending meldungen, returning');
      return;
    }
    
    console.log('Starting bulk submit...');
    setIsSubmitting(true);
    try {
      console.log('Creating promises for', pendingMeldungen.length, 'meldungen');
      const promises = pendingMeldungen.map((meldung, index) => {
        console.log(`Creating promise ${index + 1}:`, meldung);
        return fetch('/api/km/meldungen', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.stringify({ email: user?.email, displayName: user?.displayName })}`
          },
          body: JSON.stringify(meldung)
        });
      });
      
      console.log('Waiting for all promises...');
      const results = await Promise.all(promises);
      console.log('All promises resolved:', results.length);
      const successful = results.filter(r => r.ok).length;
      
      if (successful === pendingMeldungen.length) {
        toast({ 
          title: 'Erfolg', 
          description: `${successful} Meldungen gespeichert - Liste wird aktualisiert` 
        });
        setPendingMeldungen([]);
        loadData();
      } else {
        toast({ title: 'Teilweise Fehler', description: `${successful}/${pendingMeldungen.length} Meldungen gespeichert`, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Bulk submit error:', error);
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen', variant: 'destructive' });
    } finally {
      console.log('Bulk submit finished, setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSchuetze || selectedDisziplinen.length === 0) {
      toast({ title: 'Fehler', description: 'Bitte Schütze und mindestens eine Disziplin auswählen', variant: 'destructive' });
      return;
    }

    // Prüfe VM-Ergebnis für Durchmeldungs-Disziplinen
    const durchmeldungsDisziplinen = selectedDisziplinen.filter(id => 
      disziplinen.find(d => d.id === id)?.nurVereinsmeisterschaft
    );
    
    for (const disziplinId of durchmeldungsDisziplinen) {
      const vmData = vmErgebnisse[disziplinId];
      if (!vmData?.ringe || !vmData?.datum) {
        toast({ title: 'Fehler', description: 'Für Durchmeldungs-Disziplinen ist das VM-Ergebnis erforderlich', variant: 'destructive' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingMeldung) {
        // Update bestehende Meldung
        const vmData = vmErgebnisse[selectedDisziplinen[0]];
        const response = await fetch(`/api/km/meldungen/${editingMeldung.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.stringify({ email: user?.email, displayName: user?.displayName })}`
          },
          body: JSON.stringify({
            lmTeilnahme: lmTeilnahme[selectedDisziplinen[0]] || false,
            anmerkung,
            vmErgebnis: vmData?.ringe ? {
              ringe: parseFloat(vmData.ringe),
              datum: new Date(vmData.datum || Date.now()),
              bemerkung: vmData.bemerkung || ''
            } : undefined
          })
        });
        
        if (response.ok) {
          toast({ 
            title: 'Erfolg', 
            description: 'Meldung aktualisiert - Anzeige wird in wenigen Sekunden aktualisiert' 
          });
          setEditingMeldung(null);
        } else {
          toast({ title: 'Fehler', description: 'Aktualisierung fehlgeschlagen', variant: 'destructive' });
        }
      } else {
        // Erstelle neue Meldungen
        const meldungsPromises = selectedDisziplinen.map(disziplinId => {
          const vmData = vmErgebnisse[disziplinId];
          return fetch('/api/km/meldungen', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${JSON.stringify({ email: user?.email, displayName: user?.displayName })}`
            },
            body: JSON.stringify({
              schuetzeId: selectedSchuetze,
              disziplinId,
              lmTeilnahme: lmTeilnahme[disziplinId] || false,
              anmerkung,
              vmErgebnis: vmData?.ringe ? {
                ringe: parseFloat(vmData.ringe),
                datum: new Date(vmData.datum || Date.now()),
                bemerkung: vmData.bemerkung || ''
              } : undefined
            })
          });
        });
        
        const results = await Promise.all(meldungsPromises);
        const allSuccessful = results.every(async (response) => {
          const result = await response.json();
          return result.success;
        });
        
        if (allSuccessful) {
          toast({ title: 'Erfolg', description: `${selectedDisziplinen.length} Meldung(en) erfolgreich erstellt` });
        } else {
          toast({ title: 'Fehler', description: 'Einige Meldungen konnten nicht erstellt werden', variant: 'destructive' });
        }
      }

      
      // Reset form
      setSelectedSchuetze('');
      setSelectedDisziplinen([]);
      setLmTeilnahme({});
      setAnmerkung('');
      setVmErgebnisse({});
      loadData();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Meldungen konnten nicht erstellt werden', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWettkampfklasse = (schuetze: Shooter, auflage: boolean = false, spoNummer?: string) => {
    if (!schuetze.birthYear || !schuetze.gender) {
      return 'Daten unvollständig - bitte nachtragen';
    }
    
    const sportjahr = 2026; // Sportjahr KM 2026
    const age = sportjahr - schuetze.birthYear;
    const gender = schuetze.gender;
    
    if (auflage) {
      // Auflage: Schüler und Senioren-Klassen
      if (age >= 12 && age <= 14) return gender === 'male' ? 'Schüler I m' : 'Schüler I w';
      
      // Ausnahme für Disziplin 1.41 - kreisintern dürfen alle Altersklassen teilnehmen
      if (spoNummer === '1.41' && age >= 15 && age <= 40) {
        if (age <= 16) return gender === 'male' ? 'Jugend m' : 'Jugend w';
        if (age <= 18) return gender === 'male' ? 'Junioren II m' : 'Junioren II w';
        if (age <= 20) return gender === 'male' ? 'Junioren I m' : 'Junioren I w';
        return gender === 'male' ? 'Herren I' : 'Damen I';
      }
      
      if (age < 41) return 'Nicht teilnahmeberechtigt';
      if (age <= 50) return 'Senioren 0'; // 41-50 gemischt
      if (age <= 60) return gender === 'male' ? 'Senioren I m' : 'Seniorinnen I';
      if (age <= 65) return gender === 'male' ? 'Senioren II m' : 'Seniorinnen II';
      if (age <= 70) return gender === 'male' ? 'Senioren III m' : 'Seniorinnen III';
      if (age <= 75) return gender === 'male' ? 'Senioren IV m' : 'Seniorinnen IV';
      if (age <= 80) return gender === 'male' ? 'Senioren V m' : 'Seniorinnen V';
      return gender === 'male' ? 'Senioren VI m' : 'Seniorinnen VI';
    } else {
      // Freihand
      if (age <= 14) return gender === 'male' ? 'Schüler I m' : 'Schüler I w';
      if (age <= 16) return gender === 'male' ? 'Jugend m' : 'Jugend w';
      if (age <= 18) return gender === 'male' ? 'Junioren II m' : 'Junioren II w';
      if (age <= 20) return gender === 'male' ? 'Junioren I m' : 'Junioren I w';
      if (age <= 40) return gender === 'male' ? 'Herren I' : 'Damen I';
      if (age <= 50) return gender === 'male' ? 'Herren II' : 'Damen II';
      if (age <= 60) return gender === 'male' ? 'Herren III' : 'Damen III';
      if (age <= 70) return gender === 'male' ? 'Herren IV' : 'Damen IV';
      return gender === 'male' ? 'Herren V' : 'Damen V';
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade Meldungsformular...</p>
          <p className="text-sm text-gray-400 mt-2">Disziplinen und Schützendaten werden geladen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km" className="text-primary hover:text-primary/80">← Zurück</Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">📝 Schützen zur KM 2026 melden</h1>
          <p className="text-muted-foreground">
            Melden Sie Ihre Schützen für die Kreismeisterschaft an
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Meldungsformular</CardTitle>
              <CardDescription>
                {meldeModus === 'schuetze-disziplinen' 
                  ? 'Wählen Sie einen Schützen und die gewünschten Disziplinen'
                  : 'Wählen Sie eine Disziplin und die gewünschten Schützen'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Melde-Modus Tabs */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => {
                    setMeldeModus('schuetze-disziplinen');
                    setSelectedSchuetzen([]);
                    setSelectedDisziplin('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    meldeModus === 'schuetze-disziplinen'
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  👤 Schütze → Disziplinen
                </button>
                <button
                  onClick={() => {
                    setMeldeModus('disziplin-schuetzen');
                    setSelectedSchuetze('');
                    setSelectedDisziplinen([]);
                  }}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    meldeModus === 'disziplin-schuetzen'
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  🎯 Disziplin → Schützen
                </button>
              </div>
              {/* Vereinsfilter */}
              <div>
                <label className="block text-sm font-medium mb-2">Verein filtern (optional)</label>
                <select 
                  value={selectedClub} 
                  onChange={(e) => {
                    setSelectedClub(e.target.value);
                    setSelectedSchuetze('');
                    setSelectedSchuetzen([]);
                  }}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Alle Vereine</option>
                  {(userClubIds.length > 0 ? clubs.filter(club => userClubIds.includes(club.id)) : clubs)
                    .map(club => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                </select>
              </div>

              {meldeModus === 'schuetze-disziplinen' ? (
                <>{/* Bestehender Schütze → Disziplinen Modus */}

                {/* Schützen-Auswahl */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Schütze auswählen
                  {selectedClub && (
                    <span className="text-sm text-gray-500 ml-2">
                      (gefiltert nach {clubs.find(c => c.id === selectedClub)?.name})
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Schütze suchen..."
                  value={schuetzenSuche}
                  onChange={(e) => setSchuetzenSuche(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-2"
                />
                <select 
                  value={selectedSchuetze} 
                  onChange={(e) => setSelectedSchuetze(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">-- Schütze wählen --</option>
                  {schuetzen
                    .filter(schuetze => {
                      // Zeige nur Schützen mit Namen an
                      if (!schuetze.name) return false;
                      
                      // Prüfe ob Schütze zu berechtigten Vereinen gehört
                      const schuetzeClubIds = [
                        schuetze.rwkClubId,
                        schuetze.clubId, 
                        schuetze.kmClubId,
                        ...(schuetze.kmStartrechte ? Object.values(schuetze.kmStartrechte) : [])
                      ].filter(Boolean);
                      
                      const hasAccess = schuetzeClubIds.some(clubId => userClubIds.includes(clubId));
                      if (!hasAccess) return false;
                      
                      if (selectedClub && !schuetzeClubIds.includes(selectedClub)) return false;
                      
                      // Suchfilter
                      if (schuetzenSuche) {
                        const searchTerm = schuetzenSuche.toLowerCase();
                        const fullName = schuetze.firstName && schuetze.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}` 
                          : schuetze.name;
                        return fullName.toLowerCase().includes(searchTerm);
                      }
                      
                      return true;
                    })
                    .sort((a, b) => {
                      // Nach Nachname sortieren
                      const getLastName = (schuetze) => {
                        if (schuetze.lastName) return schuetze.lastName;
                        if (schuetze.name) {
                          const parts = schuetze.name.trim().split(' ');
                          return parts.length >= 2 ? parts.pop() : schuetze.name;
                        }
                        return '';
                      };
                      
                      return getLastName(a).localeCompare(getLastName(b));
                    })
                    .map(schuetze => {
                      const club = clubs.find(c => c.id === (schuetze.rwkClubId || schuetze.clubId || schuetze.kmClubId));
                      const birthYearDisplay = schuetze.birthYear || 'Jahrgang fehlt';
                      const genderDisplay = schuetze.gender === 'male' ? 'm' : schuetze.gender === 'female' ? 'w' : 'Geschlecht fehlt';
                      
                      // Intelligente Namen-Anzeige
                      let displayName;
                      if (schuetze.firstName && schuetze.lastName) {
                        displayName = `${schuetze.lastName}, ${schuetze.firstName}`;
                      } else if (schuetze.name) {
                        // Wenn name "Vorname Nachname" Format hat, umdrehen
                        const nameParts = schuetze.name.trim().split(' ');
                        if (nameParts.length >= 2) {
                          const lastName = nameParts.pop();
                          const firstName = nameParts.join(' ');
                          displayName = `${lastName}, ${firstName}`;
                        } else {
                          displayName = schuetze.name;
                        }
                      } else {
                        displayName = 'Unbekannt';
                      }
                      
                      return (
                        <option key={schuetze.id} value={schuetze.id}>
                          {displayName} ({birthYearDisplay}, {genderDisplay}) - {club?.name || 'Verein unbekannt'}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Startverein-Anzeige */}
              {selectedSchuetze && selectedDisziplinen.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Startvereine für gewählte Disziplinen</label>
                  <div className="space-y-2">
                    {selectedDisziplinen.map(disziplinId => {
                      const schuetze = schuetzen.find(s => s.id === selectedSchuetze);
                      const disziplin = disziplinen.find(d => d.id === disziplinId);
                      if (!schuetze || !disziplin) return null;
                      
                      const startVereinId = getStartVereinForDisziplin(schuetze, disziplin);
                      const startVerein = clubs.find(c => c.id === startVereinId);
                      
                      return (
                        <div key={disziplinId} className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="font-medium text-green-900">
                            {disziplin.spoNummer} - {startVerein?.name || 'Kein Startrecht'}
                          </div>
                          <div className="text-sm text-green-600">
                            {disziplin.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Wettkampfklassen für gewählte Disziplinen */}
              {selectedSchuetze && selectedDisziplinen.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Wettkampfklassen</label>
                    <a 
                      href="https://dsb.de/fileadmin/dsb/sportordnung/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      DSB-Sportordnung
                    </a>
                  </div>
                  <div className="space-y-2">
                    {selectedDisziplinen.map(disziplinId => {
                      const schuetze = schuetzen.find(s => s.id === selectedSchuetze);
                      const disziplin = disziplinen.find(d => d.id === disziplinId);
                      if (!schuetze || !disziplin) return null;
                      
                      const wettkampfklasse = getWettkampfklasse(schuetze, disziplin.auflage, disziplin.spoNummer);
                      
                      return (
                        <div key={disziplinId} className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-blue-900">
                                {disziplin.spoNummer}: {wettkampfklasse}
                              </div>
                              <div className="text-sm text-blue-600">
                                {disziplin.name} {disziplin.auflage ? '(Auflage)' : '(Freihand)'}
                              </div>
                              {disziplin.auflage && (
                                <div className="text-xs text-blue-500 mt-1">
                                  {disziplin.spoNummer === '1.41' 
                                    ? 'Kreisintern: Alle Altersklassen erlaubt (Sonderregelung)'
                                    : 'Senioren-Klassen ab 41 Jahren'
                                  }
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                              Automatisch
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    <div className="text-sm text-blue-600 mt-2">
                      {(() => {
                        const schuetze = schuetzen.find(s => s.id === selectedSchuetze);
                        if (!schuetze) return '';
                        const sportjahr = 2026; // Sportjahr KM 2026
                        const age = sportjahr - schuetze.birthYear;
                        return `Alter Sportjahr ${sportjahr}: ${age} Jahre, ${schuetze.gender === 'male' ? 'Männlich' : 'Weiblich'}`;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Disziplinen - Mehrfachauswahl */}
              <div>
                <label className="block text-sm font-medium mb-2">Disziplinen auswählen (Mehrfachauswahl möglich)</label>
                {disziplinen.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-700">
                      Keine Disziplinen verfügbar. Bitte gehen Sie zu <Link href="/km/init" className="underline">System initialisieren</Link>.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800">
                    {disziplinen.map(disziplin => (
                      <label key={disziplin.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDisziplinen.includes(disziplin.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDisziplinen(prev => [...prev, disziplin.id]);
                            } else {
                              setSelectedDisziplinen(prev => prev.filter(id => id !== disziplin.id));
                            }
                          }}
                        />
                        <span className="text-sm">
                          {disziplin.spoNummer} - {disziplin.name}
                          {disziplin.nurVereinsmeisterschaft && <Badge variant="outline" className="ml-2 text-xs">VM</Badge>}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* VM-Ergebnis für gewählte Disziplinen */}
              {selectedDisziplinen.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">VM-Ergebnisse</h4>
                  {selectedDisziplinen.map(disziplinId => {
                    const disziplin = disziplinen.find(d => d.id === disziplinId);
                    if (!disziplin) return null;
                    
                    const vmData = vmErgebnisse[disziplinId] || { ringe: '', datum: '', bemerkung: '' };
                    
                    return (
                      <div key={disziplinId} className="p-4 bg-blue-50 border border-blue-200 rounded">
                        <h5 className="font-medium text-blue-900 mb-2">
                          {disziplin.spoNummer} - {disziplin.name} {disziplin.nurVereinsmeisterschaft ? '(Erforderlich)' : '(Optional)'}
                        </h5>
                        <p className="text-sm text-blue-700 mb-3">
                          {disziplin.nurVereinsmeisterschaft 
                            ? 'Da diese Disziplin nur durchgemeldet wird, ist das VM-Ergebnis erforderlich.'
                            : 'VM-Ergebnis als Qualifikation für die Kreismeisterschaft (empfohlen).'}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">
                              Ringe {disziplin.nurVereinsmeisterschaft && '*'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="600"
                              step="0.1"
                              value={vmData.ringe}
                              onChange={(e) => setVmErgebnisse(prev => ({
                                ...prev,
                                [disziplinId]: { ...vmData, ringe: e.target.value }
                              }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              placeholder="z.B. 385.7 (mit Nachkommastelle)"
                              required={disziplin.nurVereinsmeisterschaft}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">
                              Datum {disziplin.nurVereinsmeisterschaft && '*'}
                            </label>
                            <input
                              type="date"
                              value={vmData.datum}
                              onChange={(e) => setVmErgebnisse(prev => ({
                                ...prev,
                                [disziplinId]: { ...vmData, datum: e.target.value }
                              }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              required={disziplin.nurVereinsmeisterschaft}
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">Bemerkung (Optional)</label>
                          <input
                            type="text"
                            value={vmData.bemerkung}
                            onChange={(e) => setVmErgebnisse(prev => ({
                              ...prev,
                              [disziplinId]: { ...vmData, bemerkung: e.target.value }
                            }))}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="z.B. Vereinsmeisterschaft 2025"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LM-Teilnahme pro Disziplin */}
              {selectedDisziplinen.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Landesmeisterschaft-Teilnahme</label>
                  <div className="space-y-3">
                    {selectedDisziplinen.map(disziplinId => {
                      const disziplin = disziplinen.find(d => d.id === disziplinId);
                      if (!disziplin) return null;
                      
                      return (
                        <div key={disziplinId} className="p-3 bg-purple-50 border border-purple-200 rounded">
                          <h5 className="font-medium text-purple-900 mb-2">
                            {disziplin.spoNummer} - {disziplin.name}
                          </h5>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`lm_${disziplinId}`}
                                checked={lmTeilnahme[disziplinId] === true}
                                onChange={() => setLmTeilnahme(prev => ({...prev, [disziplinId]: true}))}
                              />
                              <span className="text-purple-900 dark:text-purple-100">Ja</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`lm_${disziplinId}`}
                                checked={lmTeilnahme[disziplinId] !== true}
                                onChange={() => setLmTeilnahme(prev => ({...prev, [disziplinId]: false}))}
                              />
                              <span className="text-purple-900 dark:text-purple-100">Nein</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

                {/* Gewehr-Sharing */}
                <div>
                  <label className="block text-sm font-medium mb-2">🔫 Gewehr-Sharing (Optional)</label>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded mb-3">
                    <p className="text-sm text-orange-700 mb-2">
                      Falls mehrere Schützen sich ein Gewehr teilen müssen, geben Sie hier die Details an.
                    </p>
                    <div className="text-xs text-orange-600">
                      Beispiel: "2 Schützen, 1 Gewehr" oder "Max Mustermann und ich teilen uns ein Gewehr"
                    </div>
                  </div>
                  <textarea
                    value={anmerkung}
                    onChange={(e) => setAnmerkung(e.target.value)}
                    placeholder="z.B. 2 Schützen, 1 Gewehr - bitte zeitlich versetzen"
                    className="w-full p-2 border border-gray-300 rounded h-20"
                  />
                </div>
                </>
              ) : (
                <>{/* Neuer Disziplin → Schützen Modus */}
                {/* Disziplinen-Auswahl */}
                <div>
                  <label className="block text-sm font-medium mb-2">Disziplin auswählen</label>
                  <select 
                    value={selectedDisziplin} 
                    onChange={(e) => {
                      setSelectedDisziplin(e.target.value);
                      setSelectedSchuetzen([]);
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- Disziplin wählen --</option>
                    {disziplinen.map(disziplin => (
                      <option key={disziplin.id} value={disziplin.id}>
                        {disziplin.spoNummer} - {disziplin.name}
                        {disziplin.nurVereinsmeisterschaft ? ' (VM)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mehrfach-Schützen-Auswahl */}
                {selectedDisziplin && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Schützen auswählen (Mehrfachauswahl)
                      {selectedClub && (
                        <span className="text-sm text-gray-500 ml-2">
                          (gefiltert nach {clubs.find(c => c.id === selectedClub)?.name})
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="Schütze suchen..."
                      value={schuetzenSuche}
                      onChange={(e) => setSchuetzenSuche(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800">
                      {schuetzen
                        .filter(schuetze => {
                          if (!schuetze.name) return false;
                          const schuetzeClubIds = [
                            schuetze.rwkClubId,
                            schuetze.clubId, 
                            schuetze.kmClubId,
                            ...(schuetze.kmStartrechte ? Object.values(schuetze.kmStartrechte) : [])
                          ].filter(Boolean);
                          const hasAccess = schuetzeClubIds.some(clubId => userClubIds.includes(clubId));
                          if (!hasAccess) return false;
                          if (selectedClub && !schuetzeClubIds.includes(selectedClub)) return false;
                          if (schuetzenSuche) {
                            const searchTerm = schuetzenSuche.toLowerCase();
                            const fullName = schuetze.firstName && schuetze.lastName 
                              ? `${schuetze.firstName} ${schuetze.lastName}` 
                              : schuetze.name;
                            return fullName.toLowerCase().includes(searchTerm);
                          }
                          return true;
                        })
                        .sort((a, b) => {
                          const getLastName = (schuetze) => {
                            if (schuetze.lastName) return schuetze.lastName;
                            if (schuetze.name) {
                              const parts = schuetze.name.trim().split(' ');
                              return parts.length >= 2 ? parts.pop() : schuetze.name;
                            }
                            return '';
                          };
                          return getLastName(a).localeCompare(getLastName(b));
                        })
                        .map(schuetze => {
                          const club = clubs.find(c => c.id === (schuetze.rwkClubId || schuetze.clubId || schuetze.kmClubId));
                          const birthYearDisplay = schuetze.birthYear || 'Jahrgang fehlt';
                          const genderDisplay = schuetze.gender === 'male' ? 'm' : schuetze.gender === 'female' ? 'w' : 'Geschlecht fehlt';
                          
                          let displayName;
                          if (schuetze.firstName && schuetze.lastName) {
                            displayName = `${schuetze.lastName}, ${schuetze.firstName}`;
                          } else if (schuetze.name) {
                            const nameParts = schuetze.name.trim().split(' ');
                            if (nameParts.length >= 2) {
                              const lastName = nameParts.pop();
                              const firstName = nameParts.join(' ');
                              displayName = `${lastName}, ${firstName}`;
                            } else {
                              displayName = schuetze.name;
                            }
                          } else {
                            displayName = 'Unbekannt';
                          }
                          
                          return (
                            <label key={schuetze.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedSchuetzen.includes(schuetze.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSchuetzen(prev => [...prev, schuetze.id]);
                                  } else {
                                    setSelectedSchuetzen(prev => prev.filter(id => id !== schuetze.id));
                                  }
                                }}
                              />
                              <span className="text-sm">
                                {displayName} ({birthYearDisplay}, {genderDisplay}) - {club?.name || 'Verein unbekannt'}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                    {selectedSchuetzen.length > 0 && (
                      <div className="mt-2 text-sm text-green-600">
                        {selectedSchuetzen.length} Schützen ausgewählt
                      </div>
                    )}
                  </div>
                )}

                {/* Wettkampfklassen für ausgewählte Schützen */}
                {selectedDisziplin && selectedSchuetzen.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Wettkampfklassen der ausgewählten Schützen</label>
                    <div className="space-y-2">
                      {selectedSchuetzen.map(schuetzeId => {
                        const schuetze = schuetzen.find(s => s.id === schuetzeId);
                        const disziplin = disziplinen.find(d => d.id === selectedDisziplin);
                        if (!schuetze || !disziplin) return null;
                        
                        const wettkampfklasse = getWettkampfklasse(schuetze, disziplin.auflage, disziplin.spoNummer);
                        const displayName = schuetze.firstName && schuetze.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}`
                          : schuetze.name;
                        
                        return (
                          <div key={schuetzeId} className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="font-medium text-blue-900">
                              {displayName}: {wettkampfklasse}
                            </div>
                            <div className="text-sm text-blue-600">
                              {disziplin.name} {disziplin.auflage ? '(Auflage)' : '(Freihand)'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* VM-Ergebnis pro Schütze */}
                {selectedDisziplin && selectedSchuetzen.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">VM-Ergebnisse (einzeln pro Schütze)</h4>
                    <div className="space-y-4">
                      {selectedSchuetzen.map(schuetzeId => {
                        const schuetze = schuetzen.find(s => s.id === schuetzeId);
                        const disziplin = disziplinen.find(d => d.id === selectedDisziplin);
                        if (!schuetze || !disziplin) return null;
                        
                        const displayName = schuetze.firstName && schuetze.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}`
                          : schuetze.name;
                        
                        const vmKey = `${schuetzeId}_${selectedDisziplin}`;
                        const vmData = vmErgebnisse[vmKey] || { ringe: '', datum: '', bemerkung: '' };
                        
                        return (
                          <div key={schuetzeId} className="p-4 bg-blue-50 border border-blue-200 rounded">
                            <h5 className="font-medium text-blue-900 mb-2">
                              {displayName} - {disziplin.name} {disziplin.nurVereinsmeisterschaft ? '(Erforderlich)' : '(Optional)'}
                            </h5>
                            <p className="text-sm text-blue-700 mb-3">
                              {disziplin.nurVereinsmeisterschaft 
                                ? 'Da diese Disziplin nur durchgemeldet wird, ist das VM-Ergebnis erforderlich.'
                                : 'VM-Ergebnis als Qualifikation für die Kreismeisterschaft (empfohlen).'}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">
                                  Ringe {disziplin.nurVereinsmeisterschaft && '*'}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="600"
                                  step="0.1"
                                  value={vmData.ringe}
                                  onChange={(e) => setVmErgebnisse(prev => ({
                                    ...prev,
                                    [vmKey]: { ...vmData, ringe: e.target.value }
                                  }))}
                                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  placeholder="z.B. 385.7 (mit Nachkommastelle)"
                                  required={disziplin.nurVereinsmeisterschaft}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">
                                  Datum {disziplin.nurVereinsmeisterschaft && '*'}
                                </label>
                                <input
                                  type="date"
                                  value={vmData.datum}
                                  onChange={(e) => setVmErgebnisse(prev => ({
                                    ...prev,
                                    [vmKey]: { ...vmData, datum: e.target.value }
                                  }))}
                                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  required={disziplin.nurVereinsmeisterschaft}
                                />
                              </div>
                            </div>
                            <div className="mt-3">
                              <label className="block text-sm font-medium mb-1 text-blue-900 dark:text-blue-100">Bemerkung (Optional)</label>
                              <input
                                type="text"
                                value={vmData.bemerkung}
                                onChange={(e) => setVmErgebnisse(prev => ({
                                  ...prev,
                                  [vmKey]: { ...vmData, bemerkung: e.target.value }
                                }))}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                placeholder="z.B. Vereinsmeisterschaft 2025"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* LM-Teilnahme pro Schütze */}
                {selectedDisziplin && selectedSchuetzen.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Landesmeisterschaft-Teilnahme (einzeln pro Schütze)</label>
                    <div className="space-y-3">
                      {selectedSchuetzen.map(schuetzeId => {
                        const schuetze = schuetzen.find(s => s.id === schuetzeId);
                        if (!schuetze) return null;
                        
                        const displayName = schuetze.firstName && schuetze.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}`
                          : schuetze.name;
                        
                        const lmKey = `${schuetzeId}_${selectedDisziplin}`;
                        
                        return (
                          <div key={schuetzeId} className="p-3 bg-purple-50 border border-purple-200 rounded">
                            <h5 className="font-medium text-purple-900 mb-2">
                              {displayName}
                            </h5>
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`lm_${lmKey}`}
                                  checked={lmTeilnahme[lmKey] === true}
                                  onChange={() => setLmTeilnahme(prev => ({...prev, [lmKey]: true}))}
                                />
                                <span className="text-purple-900 dark:text-purple-100">Ja</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`lm_${lmKey}`}
                                  checked={lmTeilnahme[lmKey] === false || lmTeilnahme[lmKey] === undefined}
                                  onChange={() => setLmTeilnahme(prev => ({...prev, [lmKey]: false}))}
                                />
                                <span className="text-purple-900 dark:text-purple-100">Nein</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Anmerkung */}
                <div>
                  <label className="block text-sm font-medium mb-2">Anmerkung (Optional)</label>
                  <textarea
                    value={anmerkung}
                    onChange={(e) => setAnmerkung(e.target.value)}
                    placeholder="z.B. Gewehr-Sharing oder sonstige Hinweise"
                    className="w-full p-2 border border-gray-300 rounded h-20"
                  />
                </div>
                </>
              )}



              {/* Buttons */}
              <div className="flex gap-2">
                {editingMeldung ? (
                  <>
                    <Button 
                      onClick={handleSubmit}
                      disabled={!selectedSchuetze || selectedDisziplinen.length === 0 || isSubmitting}
                    >
                      {isSubmitting ? 'Speichere...' : 'Meldung aktualisieren'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setEditingMeldung(null);
                        setSelectedSchuetze('');
                        setSelectedDisziplinen([]);
                        setLmTeilnahme({});
                        setAnmerkung('');
                        setVmErgebnisse({});
                      }}
                    >
                      Abbrechen
                    </Button>
                  </>
                ) : (
                  <>
                    {meldeModus === 'schuetze-disziplinen' ? (
                      <>
                        <Button 
                          onClick={handleAddToPending}
                          disabled={!selectedSchuetze || selectedDisziplinen.length === 0}
                        >
                          📋 Zu Zwischenspeicher ({selectedDisziplinen.length || 0})
                        </Button>
                        <Button 
                          onClick={handleSubmit}
                          disabled={!selectedSchuetze || selectedDisziplinen.length === 0 || isSubmitting}
                          variant="outline"
                        >
                          {isSubmitting ? 'Speichere...' : 'Direkt speichern'}
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => {
                          if (!selectedDisziplin || selectedSchuetzen.length === 0) {
                            toast({ title: 'Fehler', description: 'Bitte Disziplin und mindestens einen Schützen auswählen', variant: 'destructive' });
                            return;
                          }
                          
                          // Erstelle Meldungen für alle ausgewählten Schützen
                          const newPending = selectedSchuetzen.map(schuetzeId => {
                            const lmKey = `${schuetzeId}_${selectedDisziplin}`;
                            const vmKey = `${schuetzeId}_${selectedDisziplin}`;
                            const vmData = vmErgebnisse[vmKey];
                            console.log('LM Key:', lmKey, 'Value:', lmTeilnahme[lmKey]);
                            return {
                              schuetzeId,
                              disziplinId: selectedDisziplin,
                              lmTeilnahme: lmTeilnahme[lmKey] === true, // Explizit true oder false
                              anmerkung,
                              vmErgebnis: vmData?.ringe ? {
                                ringe: parseFloat(vmData.ringe),
                                datum: new Date(vmData.datum || Date.now()),
                                bemerkung: vmData.bemerkung || ''
                              } : undefined
                            };
                          });
                          
                          console.log('New pending:', newPending);
                          setPendingMeldungen(prev => [...prev, ...newPending]);
                          
                          // Reset
                          setSelectedSchuetzen([]);
                          setSelectedDisziplin('');
                          setLmTeilnahme({});
                          setAnmerkung('');
                          
                          toast({ title: 'Hinzugefügt', description: `${newPending.length} Meldungen zum Zwischenspeicher hinzugefügt` });
                        }}
                        disabled={!selectedDisziplin || selectedSchuetzen.length === 0}
                      >
                        📋 {selectedSchuetzen.length} Schützen zu Zwischenspeicher
                      </Button>
                    )}
                    <Link href="/km">
                      <Button variant="outline">Zurück</Button>
                    </Link>
                  </>
                )}
              </div>
              
              {/* Zwischenspeicher - unter den Buttons */}
              {pendingMeldungen.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">📋 Zwischenspeicher ({pendingMeldungen.length})</h4>
                  <div className="space-y-2 mb-3">
                    {pendingMeldungen.map((pending, index) => {
                      const schuetze = schuetzen.find(s => s.id === pending.schuetzeId);
                      const disziplin = disziplinen.find(d => d.id === pending.disziplinId);
                      return (
                        <div key={index} className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-2 rounded border">
                          <span className="text-gray-900 dark:text-gray-100">
                            {schuetze?.firstName && schuetze?.lastName 
                              ? `${schuetze.firstName} ${schuetze.lastName}`
                              : schuetze?.name || 'Unbekannt'
                            } - {disziplin?.spoNummer} {disziplin?.name}
                          </span>
                          <button 
                            onClick={() => setPendingMeldungen(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBulkSubmit}
                      disabled={isSubmitting || pendingMeldungen.length === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? 'Speichere...' : `${pendingMeldungen.length} Meldungen speichern`}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setPendingMeldungen([])}
                    >
                      Alle löschen
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aktuelle Meldungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {meldungen
                  .filter(meldung => {
                    // Wenn userClubIds leer ist (Admin/KM-Organisator), zeige alle
                    if (userClubIds.length === 0) return true;
                    
                    // Zeige nur Meldungen der eigenen Vereine
                    const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
                    if (!schuetze) return false;
                    
                    const schuetzeClubIds = [
                      schuetze.rwkClubId,
                      schuetze.clubId, 
                      schuetze.kmClubId,
                      ...(schuetze.kmStartrechte ? Object.values(schuetze.kmStartrechte) : [])
                    ].filter(Boolean);
                    
                    return schuetzeClubIds.some(clubId => userClubIds.includes(clubId));
                  })
                  .slice(0, 5)
                  .map((meldung, index) => {
                  const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
                  const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
                  const colors = ['blue', 'green', 'orange', 'purple', 'red'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={meldung.id} className={`text-sm border-l-2 border-${color}-500 pl-3 flex justify-between items-center`}>
                      <div>
                        <div className="font-medium">
                          {schuetze?.firstName && schuetze?.lastName 
                            ? `${schuetze.firstName} ${schuetze.lastName}`
                            : schuetze?.name || 'Unbekannt'
                          }
                        </div>
                        <div className="text-gray-500">
                          {disziplin?.spoNummer} {disziplin?.name} • {schuetze ? getWettkampfklasse(schuetze, disziplin?.auflage, disziplin?.spoNummer) : 'N/A'}
                          {meldung.vmErgebnis?.ringe && (
                            <span className="ml-2 text-green-600 font-medium">
                              • VM: {meldung.vmErgebnis.ringe} Ringe
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEditMeldung(meldung)}
                          className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteMeldung(meldung.id)}
                          disabled={deletingId === meldung.id}
                          className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded disabled:opacity-50"
                        >
                          {deletingId === meldung.id ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {meldungen.filter(meldung => {
                  if (userClubIds.length === 0) return true; // Admin/KM-Organisator sieht alle
                  const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
                  if (!schuetze) return false;
                  const schuetzeClubIds = [
                    schuetze.rwkClubId, schuetze.clubId, schuetze.kmClubId,
                    ...(schuetze.kmStartrechte ? Object.values(schuetze.kmStartrechte) : [])
                  ].filter(Boolean);
                  return schuetzeClubIds.some(clubId => userClubIds.includes(clubId));
                }).length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    Noch keine Meldungen vorhanden
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {meldungen.filter(meldung => {
                    const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
                    if (!schuetze) return false;
                    const schuetzeClubIds = [
                      schuetze.rwkClubId, schuetze.clubId, schuetze.kmClubId,
                      ...(schuetze.kmStartrechte ? Object.values(schuetze.kmStartrechte) : [])
                    ].filter(Boolean);
                    return schuetzeClubIds.some(clubId => userClubIds.includes(clubId));
                  }).length} eigene Meldung{meldungen.filter(meldung => {
                    const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
                    if (!schuetze) return false;
                    const schuetzeClubIds = [
                      schuetze.rwkClubId, schuetze.clubId, schuetze.kmClubId,
                      ...(schuetze.kmStartrechte ? Object.values(schuetze.kmStartrechte) : [])
                    ].filter(Boolean);
                    return schuetzeClubIds.some(clubId => userClubIds.includes(clubId));
                  }).length !== 1 ? 'en' : ''}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded">
            <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-1">🎯 KM-System</h4>
            <p className="text-xs text-green-700 dark:text-green-300">
              Vollständig funktional - Meldungen werden gespeichert und sind persistent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
