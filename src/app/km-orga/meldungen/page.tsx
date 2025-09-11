"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useKMAuth } from '@/hooks/useKMAuth';

export default function KMAdminMeldungen() {
  const { toast } = useToast();
  const { hasFullAccess, loading: authLoading } = useKMAuth();
  const [meldungen, setMeldungen] = useState<any[]>([]);
  const [schuetzen, setSchuetzen] = useState<any[]>([]);
  const [disziplinen, setDisziplinen] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [filter, setFilter] = useState({ verein: '', disziplin: '', search: '' });
  const [showMeldungsDialog, setShowMeldungsDialog] = useState(false);
  const [meldungsForm, setMeldungsForm] = useState({
    vereinId: '',
    schuetzeIds: [] as string[],
    disziplinIds: [] as string[],
    vmErgebnis: '',
    lmTeilnahme: false,
    anmerkung: ''
  });
  const [schuetzenSearch, setSchuetzenSearch] = useState('');
  const [vereinSchuetzen, setVereinSchuetzen] = useState<any[]>([]);
  const [editingMeldung, setEditingMeldung] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    if (hasFullAccess && !authLoading) {
      loadData();
    }
  }, [hasFullAccess, authLoading, selectedYear]);

  const loadData = async () => {
    try {
      const [meldungenRes, schuetzenRes, disziplinenRes, clubsRes] = await Promise.all([
        fetch(`/api/km/meldungen?jahr=${selectedYear}`),
        fetch('/api/km/shooters'),
        fetch('/api/km/disziplinen'),
        fetch('/api/clubs')
      ]);
      
      if (meldungenRes.ok) {
        const data = await meldungenRes.json();
        setMeldungen(data.data || []);
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
    } catch (error) {
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadVereinSchuetzen = async (vereinId: string) => {
    if (!vereinId) {
      setVereinSchuetzen([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/km/shooters?clubId=${vereinId}`);
      if (response.ok) {
        const data = await response.json();
        setVereinSchuetzen(data.data || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Vereinsschützen:', error);
    }
  };

  const submitMeldung = async () => {
    if (!meldungsForm.vereinId || meldungsForm.schuetzeIds.length === 0 || meldungsForm.disziplinIds.length === 0) {
      toast({ title: 'Fehler', description: 'Bitte alle Pflichtfelder ausfüllen', variant: 'destructive' });
      return;
    }

    try {
      let meldungenCount = 0;
      for (const schuetzeId of meldungsForm.schuetzeIds) {
        for (const disziplinId of meldungsForm.disziplinIds) {
          const meldungData = {
            schuetzeId,
            disziplinId,
            saison: selectedYear.toString(),
            jahr: selectedYear,
            lmTeilnahme: meldungsForm.lmTeilnahme,
            anmerkung: meldungsForm.anmerkung,
            vmErgebnis: meldungsForm.vmErgebnis ? { ringe: parseInt(meldungsForm.vmErgebnis) } : null,
            status: 'gemeldet',
            meldedatum: new Date(),
            gemeldeteVon: 'km-orga'
          };

          const response = await fetch('/api/km/meldungen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(meldungData)
          });

          if (!response.ok) {
            throw new Error('Meldung fehlgeschlagen');
          }
          meldungenCount++;
        }
      }

      toast({ 
        title: 'Erfolg', 
        description: `${meldungenCount} Meldung(en) für ${meldungsForm.schuetzeIds.length} Schütze(n) erfolgreich erstellt` 
      });
      
      setShowMeldungsDialog(false);
      setMeldungsForm({
        vereinId: '',
        schuetzeIds: [],
        disziplinIds: [],
        vmErgebnis: '',
        lmTeilnahme: false,
        anmerkung: ''
      });
      setVereinSchuetzen([]);
      setSchuetzenSearch('');
      loadData();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Meldung konnte nicht erstellt werden', variant: 'destructive' });
    }
  };

  const updateMeldung = async (meldungId: string) => {
    try {
      const response = await fetch(`/api/km/meldungen/${meldungId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lmTeilnahme: editData.lmTeilnahme,
          vmErgebnis: editData.vmRinge ? { ringe: parseFloat(editData.vmRinge) } : null,
          anmerkung: editData.anmerkung || ''
        })
      });
      
      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Meldung aktualisiert' });
        setEditingMeldung(null);
        setEditData({});
        loadData();
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Update fehlgeschlagen', variant: 'destructive' });
    }
  };

  const deleteMeldung = async (meldungId: string) => {
    if (!confirm('Meldung wirklich löschen?')) return;
    
    try {
      const response = await fetch(`/api/km/meldungen/${meldungId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Meldung gelöscht' });
        loadData();
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const filteredMeldungen = meldungen.filter(meldung => {
    const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
    const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
    const vereinId = schuetze?.kmClubId || schuetze?.rwkClubId || schuetze?.clubId;
    
    if (filter.verein && vereinId !== filter.verein) return false;
    if (filter.disziplin && meldung.disziplinId !== filter.disziplin) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const schuetzeName = schuetze?.firstName && schuetze?.lastName 
        ? `${schuetze.firstName} ${schuetze.lastName}` 
        : schuetze?.name || '';
      const verein = clubs.find(c => c.id === vereinId);
      
      if (!schuetzeName.toLowerCase().includes(searchLower) &&
          !disziplin?.name?.toLowerCase().includes(searchLower) &&
          !verein?.name?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-600">Lade alle KM-Meldungen...</p>
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
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga">
          <Button variant="outline">← Zurück</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">📋 Alle KM-Meldungen {selectedYear}</h1>
          <p className="text-muted-foreground">Verwaltung aller Meldungen zur Kreismeisterschaft {selectedYear}</p>
        </div>
        <Button onClick={() => {
          console.log('Button clicked, setting dialog to true');
          setShowMeldungsDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Meldung für Verein erstellen
        </Button>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium"
        >
          <option value={2026}>KM 2026</option>
          <option value={2027}>KM 2027</option>
          <option value={2028}>KM 2028</option>
        </select>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Verein</label>
              <select
                value={filter.verein}
                onChange={(e) => setFilter(prev => ({ ...prev, verein: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Alle Vereine</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Disziplin</label>
              <select
                value={filter.disziplin}
                onChange={(e) => setFilter(prev => ({ ...prev, disziplin: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Alle Disziplinen</option>
                {disziplinen.map(disziplin => (
                  <option key={disziplin.id} value={disziplin.id}>
                    {disziplin.spoNummer} - {disziplin.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Suche</label>
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Name, Disziplin, Verein..."
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setFilter({ verein: '', disziplin: '', search: '' })}
            >
              Filter zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meldungen ({filteredMeldungen.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2 text-left">Schütze</th>
                  <th className="p-2 text-left">Verein</th>
                  <th className="p-2 text-left">Disziplin</th>
                  <th className="p-2 text-left">Klasse</th>
                  <th className="p-2 text-left">LM</th>
                  <th className="p-2 text-left">VM</th>
                  <th className="p-2 text-left">Datum</th>
                  <th className="p-2 text-left">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeldungen.map(meldung => {
                  const schuetze = schuetzen.find(s => s.id === meldung.schuetzeId);
                  const disziplin = disziplinen.find(d => d.id === meldung.disziplinId);
                  const vereinId = schuetze?.kmClubId || schuetze?.rwkClubId || schuetze?.clubId;
                  const verein = clubs.find(c => c.id === vereinId);

                  return (
                    <tr key={meldung.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">
                        {schuetze?.firstName && schuetze?.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}`
                          : schuetze?.name || 'Unbekannt'
                        }
                      </td>
                      <td className="p-2">{verein?.name || 'Unbekannt'}</td>
                      <td className="p-2">
                        <div>
                          <span className="font-medium">{disziplin?.spoNummer}</span>
                          <div className="text-xs text-gray-500">{disziplin?.name}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {(() => {
                            if (!schuetze?.birthYear) return 'Unbekannt';
                            
                            const age = selectedYear - schuetze.birthYear;
                            const isAuflage = disziplin?.name?.toLowerCase().includes('auflage');
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
                          })()
                          }
                        </span>
                      </td>
                      <td className="p-2">
                        {editingMeldung === meldung.id ? (
                          <input
                            type="checkbox"
                            checked={editData.lmTeilnahme || false}
                            onChange={(e) => setEditData(prev => ({...prev, lmTeilnahme: e.target.checked}))}
                            className="w-4 h-4"
                          />
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs ${
                            meldung.lmTeilnahme 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {meldung.lmTeilnahme ? 'Ja' : 'Nein'}
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        {editingMeldung === meldung.id ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editData.vmRinge || ''}
                            onChange={(e) => setEditData(prev => ({...prev, vmRinge: e.target.value}))}
                            className="w-20 p-1 border rounded text-sm"
                            placeholder="Ringe"
                          />
                        ) : (
                          meldung.vmErgebnis?.ringe ? (
                            <span className="text-green-600 font-medium">
                              {meldung.vmErgebnis.ringe}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )
                        )}
                      </td>
                      <td className="p-2 text-xs text-gray-500">
                        {new Date(meldung.meldedatum?.seconds * 1000 || meldung.meldedatum).toLocaleDateString('de-DE')}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {editingMeldung === meldung.id ? (
                            <>
                              <button 
                                onClick={() => updateMeldung(meldung.id)}
                                className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-300 rounded"
                              >
                                ✓
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingMeldung(null);
                                  setEditData({});
                                }}
                                className="text-gray-600 hover:text-gray-800 text-xs px-2 py-1 border border-gray-300 rounded"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingMeldung(meldung.id);
                                  setEditData({
                                    lmTeilnahme: meldung.lmTeilnahme,
                                    vmRinge: meldung.vmErgebnis?.ringe || '',
                                    anmerkung: meldung.anmerkung || ''
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => deleteMeldung(meldung.id)}
                                className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredMeldungen.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Keine Meldungen gefunden
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meldungs-Dialog */}
      <Dialog open={showMeldungsDialog} onOpenChange={(open) => {
        console.log('Dialog onOpenChange:', open);
        setShowMeldungsDialog(open);
      }}>
        <DialogContent className="max-w-2xl mx-auto">
          <DialogHeader>
            <DialogTitle>📋 Neue Meldung für Verein erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine neue KM-Meldung für einen Schützen aus einem Verein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Verein auswählen *</Label>
              <Select 
                value={meldungsForm.vereinId} 
                onValueChange={(value) => {
                  setMeldungsForm(prev => ({ ...prev, vereinId: value, schuetzeIds: [] }));
                  loadVereinSchuetzen(value);
                  setSchuetzenSearch('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Verein wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {meldungsForm.vereinId && (
              <div>
                <Label>Schützen auswählen * ({meldungsForm.schuetzeIds.length} ausgewählt)</Label>
                <Input 
                  placeholder="Schützen suchen..."
                  value={schuetzenSearch}
                  onChange={(e) => setSchuetzenSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                  {vereinSchuetzen
                    .filter(schuetze => {
                      const name = schuetze.firstName && schuetze.lastName 
                        ? `${schuetze.firstName} ${schuetze.lastName}` 
                        : schuetze.name || '';
                      return name.toLowerCase().includes(schuetzenSearch.toLowerCase());
                    })
                    .map(schuetze => (
                    <div key={schuetze.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`schuetze-${schuetze.id}`}
                        checked={meldungsForm.schuetzeIds.includes(schuetze.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setMeldungsForm(prev => ({
                              ...prev,
                              schuetzeIds: [...prev.schuetzeIds, schuetze.id]
                            }));
                          } else {
                            setMeldungsForm(prev => ({
                              ...prev,
                              schuetzeIds: prev.schuetzeIds.filter(id => id !== schuetze.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={`schuetze-${schuetze.id}`} className="text-sm">
                        {schuetze.firstName && schuetze.lastName 
                          ? `${schuetze.firstName} ${schuetze.lastName}` 
                          : schuetze.name
                        }
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Disziplinen auswählen *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
                {disziplinen.map(disziplin => (
                  <div key={disziplin.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={disziplin.id}
                      checked={meldungsForm.disziplinIds.includes(disziplin.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setMeldungsForm(prev => ({
                            ...prev,
                            disziplinIds: [...prev.disziplinIds, disziplin.id]
                          }));
                        } else {
                          setMeldungsForm(prev => ({
                            ...prev,
                            disziplinIds: prev.disziplinIds.filter(id => id !== disziplin.id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={disziplin.id} className="text-sm">
                      {disziplin.spoNummer} - {disziplin.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>VM-Ergebnis (Ringe)</Label>
                <Input 
                  type="number"
                  placeholder="z.B. 385"
                  value={meldungsForm.vmErgebnis}
                  onChange={(e) => setMeldungsForm(prev => ({ ...prev, vmErgebnis: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox 
                  id="lmTeilnahme"
                  checked={meldungsForm.lmTeilnahme}
                  onCheckedChange={(checked) => setMeldungsForm(prev => ({ ...prev, lmTeilnahme: !!checked }))}
                />
                <Label htmlFor="lmTeilnahme">LM-Teilnahme</Label>
              </div>
            </div>

            <div>
              <Label>Anmerkungen</Label>
              <Input 
                placeholder="Besondere Wünsche oder Hinweise..."
                value={meldungsForm.anmerkung}
                onChange={(e) => setMeldungsForm(prev => ({ ...prev, anmerkung: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowMeldungsDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={submitMeldung}>
                Meldung erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}