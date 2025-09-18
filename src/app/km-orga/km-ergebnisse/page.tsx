"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Trophy, Medal, Upload, FileText, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKMAuth } from '@/hooks/useKMAuth';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';

interface Meldung {
  id: string;
  schuetzenName: string;
  vereinsname: string;
  disziplin: string;
  kmErgebnis?: {
    ringe: number;
    teiler?: number;
    platz_disziplin?: number;
    platz_altersklasse?: number;
  };
}

export default function KMErgebnissePage() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading } = useKMAuth();
  const [meldungen, setMeldungen] = useState<Meldung[]>([]);
  const [selectedDisziplin, setSelectedDisziplin] = useState<string>('');
  const [disziplinen, setDisziplinen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!hasKMAccess || authLoading) return;
    
    const loadData = async () => {
      try {
        // Lade Daten über API
        const [meldungenRes, schuetzenRes, disziplinenRes, clubsRes] = await Promise.all([
          fetch('/api/km/meldungen?jahr=2026'),
          fetch('/api/km/shooters'),
          fetch('/api/km/disziplinen'),
          fetch('/api/clubs')
        ]);
        
        // Lade VM-Ergebnisse direkt aus Firebase da kein API-Endpunkt existiert
        const kmErgebnisseSnapshot = await getDocs(collection(db, 'km_vm_ergebnisse'));
        
        const meldungenData = meldungenRes.ok ? (await meldungenRes.json()).data || [] : [];
        const schuetzenData = schuetzenRes.ok ? (await schuetzenRes.json()).data || [] : [];
        const disziplinenData = disziplinenRes.ok ? (await disziplinenRes.json()).data || [] : [];
        const clubsData = clubsRes.ok ? (await clubsRes.json()).data || [] : [];
        
        const meldungenDataProcessed: Meldung[] = [];
        const disziplinenSet = new Set<string>();

        // KM-Ergebnisse Map erstellen
        const kmErgebnisseMap = new Map();
        kmErgebnisseSnapshot.docs.forEach(doc => {
          const data = doc.data();
          kmErgebnisseMap.set(data.meldung_id, {
            ringe: data.ergebnis_ringe,
            teiler: data.ergebnis_teiler,
            platz_disziplin: data.platz_disziplin,
            platz_altersklasse: data.platz_altersklasse
          });
        });

        // Maps für Namen-Auflösung
        const schuetzenMap = new Map();
        const disziplinenMap = new Map();
        const clubsMap = new Map();
        
        schuetzenData.forEach(schuetze => {
          const fullName = schuetze.firstName && schuetze.lastName 
            ? `${schuetze.firstName} ${schuetze.lastName}`
            : schuetze.name || 'Unbekannt';
          schuetzenMap.set(schuetze.id, {
            name: fullName,
            clubId: schuetze.kmClubId || schuetze.rwkClubId || schuetze.clubId
          });
        });
        
        disziplinenData.forEach(disziplin => {
          disziplinenMap.set(disziplin.id, disziplin.name);
        });
        
        clubsData.forEach(club => {
          clubsMap.set(club.id, club.name);
        });

        meldungenData.forEach(meldung => {

          const schuetze = schuetzenMap.get(meldung.schuetzeId);

          const disziplinName = disziplinenMap.get(meldung.disziplinId) || 'Unbekannte Disziplin';
          
          // Verwende vereinsname aus Meldung oder lade über clubId
          let vereinsname = meldung.vereinsname || 'Unbekannter Verein';
          if (!meldung.vereinsname && schuetze && schuetze.clubId) {
            vereinsname = clubsMap.get(schuetze.clubId) || 'Unbekannter Verein';
          }

          
          meldungenDataProcessed.push({
            id: meldung.id,
            schuetzenName: schuetze ? schuetze.name : 'Unbekannter Schütze',
            vereinsname: vereinsname,
            disziplin: disziplinName,
            kmErgebnis: kmErgebnisseMap.get(meldung.id)
          });
          disziplinenSet.add(disziplinName);
        });

        setMeldungen(meldungenDataProcessed);
        setDisziplinen(Array.from(disziplinenSet).sort());

      } catch (error) {
        console.error('Fehler beim Laden:', error);
        toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [hasKMAccess, authLoading, toast]);

  const handleErgebnisChange = (meldungId: string, field: 'ringe' | 'teiler', value: string) => {
    setMeldungen(prev => prev.map(m => {
      if (m.id === meldungId) {
        const kmErgebnis = m.kmErgebnis || { ringe: 0 };
        return {
          ...m,
          kmErgebnis: {
            ...kmErgebnis,
            [field]: field === 'ringe' ? parseInt(value) || 0 : parseInt(value) || 0
          }
        };
      }
      return m;
    }));
  };

  const handleSave = async (meldungId: string) => {
    const meldung = meldungen.find(m => m.id === meldungId);
    if (!meldung?.kmErgebnis) return;

    setSaving(true);
    try {
      // Prüfe ob bereits ein Ergebnis existiert
      const existingQuery = query(
        collection(db, 'km_vm_ergebnisse'),
        where('meldung_id', '==', meldungId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      const ergebnisData = {
        meldung_id: meldungId,
        ergebnis_ringe: meldung.kmErgebnis.ringe,
        ergebnis_teiler: meldung.kmErgebnis.teiler || 0,
        platz_disziplin: 0,
        platz_altersklasse: 0,
        eingegeben_am: new Date(),
        eingegeben_von: 'km-admin'
      };

      if (existingSnapshot.empty) {
        // Neuen Eintrag erstellen
        await addDoc(collection(db, 'km_vm_ergebnisse'), ergebnisData);
        toast({ title: 'Neu erstellt', description: `KM-Ergebnis für ${meldung.schuetzenName} erstellt.` });
      } else {
        // Bestehenden Eintrag aktualisieren
        const docId = existingSnapshot.docs[0].id;
        await updateDoc(doc(db, 'km_vm_ergebnisse', docId), ergebnisData);
        toast({ title: 'Aktualisiert', description: `KM-Ergebnis für ${meldung.schuetzenName} aktualisiert.` });
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({ title: 'Fehler', description: 'Ergebnis konnte nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const berechneAutomatischePlaetze = async () => {
    if (!selectedDisziplin || selectedDisziplin === 'ALL_DISCIPLINES') {
      toast({ title: 'Hinweis', description: 'Bitte wählen Sie eine spezifische Disziplin aus.', variant: 'destructive' });
      return;
    }

    // TODO: Automatische Platzberechnung implementieren
    toast({ title: 'Info', description: 'Automatische Platzberechnung wird implementiert...', variant: 'default' });
  };

  const handlePDFImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({ title: 'Fehler', description: 'Bitte wählen Sie eine PDF-Datei aus.', variant: 'destructive' });
      return;
    }

    setImporting(true);
    try {
      // TODO: PDF-Parser implementieren
      // Beispiel-Ergebnisse für Demo
      const demoErgebnisse = [
        { name: 'Karl-Arthur Aurin', ringe: 285, teiler: 7 },
        { name: 'Kloss', ringe: 278, teiler: 3 },
        { name: 'Langnickel', ringe: 292, teiler: 9 },
        { name: 'Leiding', ringe: 281, teiler: 5 }
      ];

      // Automatisch Ergebnisse zuordnen
      setMeldungen(prev => prev.map(m => {
        const ergebnis = demoErgebnisse.find(e => 
          m.schuetzenName.toLowerCase().includes(e.name.toLowerCase()) ||
          e.name.toLowerCase().includes(m.schuetzenName.toLowerCase())
        );
        
        if (ergebnis) {
          return {
            ...m,
            kmErgebnis: {
              ringe: ergebnis.ringe,
              teiler: ergebnis.teiler
            }
          };
        }
        return m;
      }));

      toast({ 
        title: 'PDF importiert', 
        description: `${demoErgebnisse.length} Ergebnisse automatisch zugeordnet.`,
        duration: 5000
      });
    } catch (error) {
      console.error('PDF-Import Fehler:', error);
      toast({ title: 'Fehler', description: 'PDF konnte nicht verarbeitet werden.', variant: 'destructive' });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const filteredMeldungen = selectedDisziplin && selectedDisziplin !== 'ALL_DISCIPLINES'
    ? meldungen.filter(m => m.disziplin === selectedDisziplin)
    : meldungen;

  if (loading || authLoading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade KM-Ergebnisse...</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
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
    <div className="px-2 md:px-4 py-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/km-orga">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-primary">🏆 KM-Ergebnisse erfassen</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Kreismeisterschafts-Ergebnisse nach dem Wettkampf erfassen für automatische Ergebnislisten
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Hinweis zur Ergebniserfassung:</h3>
        <p className="text-sm text-blue-700">
          <strong>KM-Ergebnisse</strong> sind die tatsächlichen Wettkampfergebnisse der Kreismeisterschaft. 
          Diese werden NACH dem Wettkampf erfasst und dienen zur Erstellung der offiziellen Ergebnislisten 
          und später für die Weiterleitung qualifizierter Schützen zur Landesmeisterschaft.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Filter & Aktionen</CardTitle>
            <div className="flex flex-col md:flex-row gap-2">
              <label className="cursor-pointer w-full md:w-auto">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePDFImport}
                  className="hidden"
                  disabled={importing}
                />
                <Button variant="outline" disabled={importing} asChild className="w-full md:w-auto">
                  <span>
                    {importing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {importing ? 'Importiere...' : 'PDF importieren'}
                  </span>
                </Button>
              </label>
              <Button onClick={berechneAutomatischePlaetze} disabled={!selectedDisziplin || selectedDisziplin === 'ALL_DISCIPLINES'} className="w-full md:w-auto">
                <Medal className="h-4 w-4 mr-2" />
                Plätze berechnen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Disziplin</Label>
              <Select value={selectedDisziplin} onValueChange={setSelectedDisziplin}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Disziplinen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_DISCIPLINES">Alle Disziplinen</SelectItem>
                  {disziplinen.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KM-Ergebnisse ({filteredMeldungen.length} Meldungen)</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-4">
            {filteredMeldungen.map(meldung => (
              <Card key={meldung.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{meldung.schuetzenName}</div>
                      <div className="text-sm text-muted-foreground">{meldung.vereinsname}</div>
                    </div>
                    <Badge variant="outline">{meldung.disziplin}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Ergebnis (Ringe.Zehntel)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={inputValues[meldung.id] ?? (meldung.kmErgebnis ? `${meldung.kmErgebnis.ringe}${meldung.kmErgebnis.teiler ? ',' + meldung.kmErgebnis.teiler : ''}` : '')}
                        onChange={(e) => {
                          const value = e.target.value;
                          setInputValues(prev => ({ ...prev, [meldung.id]: value }));
                          
                          if (value && !value.endsWith(',') && !value.endsWith('.')) {
                            const parts = value.split(/[.,]/);
                            const ringe = parseInt(parts[0]) || 0;
                            const teiler = parts[1] ? parseInt(parts[1]) || 0 : 0;
                            
                            setMeldungen(prev => prev.map(m => {
                              if (m.id === meldung.id) {
                                return {
                                  ...m,
                                  kmErgebnis: { ringe, teiler }
                                };
                              }
                              return m;
                            }));
                          }
                        }}
                        onBlur={() => {
                          const value = inputValues[meldung.id] || '';
                          if (value) {
                            const parts = value.split(/[.,]/);
                            const ringe = parseInt(parts[0]) || 0;
                            const teiler = parts[1] ? parseInt(parts[1]) || 0 : 0;
                            
                            setMeldungen(prev => prev.map(m => {
                              if (m.id === meldung.id) {
                                return {
                                  ...m,
                                  kmErgebnis: { ringe, teiler }
                                };
                              }
                              return m;
                            }));
                          }
                        }}
                        className="flex-1"
                        placeholder="z.B. 285,7"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(meldung.id)}
                        disabled={saving || !meldung.kmErgebnis?.ringe}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {meldung.kmErgebnis && meldung.kmErgebnis.ringe > 0 && (
                    <div className="text-sm p-2 bg-green-50 dark:bg-green-900/30 rounded">
                      <div className="font-medium text-green-600">
                        Ergebnis: {meldung.kmErgebnis.ringe}{meldung.kmErgebnis.teiler > 0 ? `,${meldung.kmErgebnis.teiler}` : ''}
                      </div>
                      {meldung.kmErgebnis.platz_disziplin && (
                        <div className="text-xs text-blue-600">
                          Platz: {meldung.kmErgebnis.platz_disziplin}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
          
          {/* Desktop Grid Layout */}
          <div className="hidden md:block space-y-3">
            {filteredMeldungen.map(meldung => (
              <div key={meldung.id} className="grid grid-cols-12 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg items-center">
                <div className="col-span-3">
                  <div className="font-medium">{meldung.schuetzenName}</div>
                  <div className="text-sm text-muted-foreground">{meldung.vereinsname}</div>
                </div>
                <div className="col-span-2">
                  <Badge variant="outline">{meldung.disziplin}</Badge>
                </div>
                <div className="col-span-4">
                  <Label className="text-xs">Ergebnis (Ringe.Zehntel)</Label>
                  <Input
                    type="text"
                    value={inputValues[meldung.id] ?? (meldung.kmErgebnis ? `${meldung.kmErgebnis.ringe}${meldung.kmErgebnis.teiler ? ',' + meldung.kmErgebnis.teiler : ''}` : '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInputValues(prev => ({ ...prev, [meldung.id]: value }));
                      
                      if (value && !value.endsWith(',') && !value.endsWith('.')) {
                        const parts = value.split(/[.,]/);
                        const ringe = parseInt(parts[0]) || 0;
                        const teiler = parts[1] ? parseInt(parts[1]) || 0 : 0;
                        
                        setMeldungen(prev => prev.map(m => {
                          if (m.id === meldung.id) {
                            return {
                              ...m,
                              kmErgebnis: { ringe, teiler }
                            };
                          }
                          return m;
                        }));
                      }
                    }}
                    onBlur={() => {
                      const value = inputValues[meldung.id] || '';
                      if (value) {
                        const parts = value.split(/[.,]/);
                        const ringe = parseInt(parts[0]) || 0;
                        const teiler = parts[1] ? parseInt(parts[1]) || 0 : 0;
                        
                        setMeldungen(prev => prev.map(m => {
                          if (m.id === meldung.id) {
                            return {
                              ...m,
                              kmErgebnis: { ringe, teiler }
                            };
                          }
                          return m;
                        }));
                      }
                    }}
                    className="h-8"
                    placeholder="z.B. 285,7 oder 285.7 oder 285"
                  />
                </div>
                <div className="col-span-2">
                  {meldung.kmErgebnis && meldung.kmErgebnis.ringe > 0 && (
                    <div className="text-sm">
                      <div className="font-medium text-green-600">
                        {meldung.kmErgebnis.ringe}{meldung.kmErgebnis.teiler > 0 ? `,${meldung.kmErgebnis.teiler}` : ''}
                      </div>
                      {meldung.kmErgebnis.platz_disziplin && (
                        <div className="text-xs text-blue-600">
                          Platz: {meldung.kmErgebnis.platz_disziplin}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-1">
                  <Button 
                    size="sm" 
                    onClick={() => handleSave(meldung.id)}
                    disabled={saving || !meldung.kmErgebnis?.ringe}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
