"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit, Save, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/auth/authFetch';

interface Disziplin {
  id: string;
  name: string;
  spoNummer: string;
  saison: string;
  auflage: boolean;
  schusszahlen: Array<{
    schusszahl: number;
    altersklassen: string[];
    schiesszeit_andere: number;
    schiesszeit_zuganlagen: number;
    kennziffer?: string;
  }>;
}

const sanitizeText = (text: string | undefined | null): string => {
  return String(text || '').replace(/[<>"'&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;'
    };
    return entities[char] || char;
  });
};

export default function DisziplinenVerwaltung() {
  const { toast } = useToast();
  const [disziplinen, setDisziplinen] = useState<Disziplin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    loadDisziplinen();
  }, []);

  const loadDisziplinen = async () => {
    try {
      const response = await fetch('/api/km/disziplinen');
      if (response.ok) {
        const data = await response.json();
        setDisziplinen(data.data || []);
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Disziplinen konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (disziplin: Disziplin) => {
    setEditingId(disziplin.id);
    setEditData({
      ...disziplin,
      schusszahlen: disziplin.schusszahlen || []
    });
  };

  const saveEdit = async () => {
    try {
      const response = await authFetch(`/api/km/disziplinen/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        loadDisziplinen();
        setEditingId(null);
        setEditData({});
        toast({ title: '✅ Gespeichert', description: 'Kennziffer aktualisiert' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen', variant: 'destructive' });
    }
  };

  const addNewDisziplin = async () => {
    try {
      const response = await authFetch('/api/km/disziplinen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Neue Disziplin',
          spoNummer: '1.10',
          saison: '2026',
          auflage: false,
          schusszahlen: [
            {
              schusszahl: 40,
              altersklassen: ['Erwachsene'],
              schiesszeit_andere: 50,
              schiesszeit_zuganlagen: 60,
              kennziffer: ''
            }
          ]
        })
      });
      if (response.ok) {
        loadDisziplinen();
        toast({ title: '✅ Erstellt', description: 'Neue Disziplin erstellt - jetzt bearbeiten' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Erstellen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const deleteDisziplin = async (id: string, name: string) => {
    if (!confirm(`Disziplin "${name}" wirklich löschen?`)) return;
    
    try {
      const response = await authFetch(`/api/km/disziplinen/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        loadDisziplinen();
        toast({ title: '✅ Gelöscht', description: 'Disziplin gelöscht' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade Disziplinen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-primary">🎯 Disziplinen & Kennziffern</h1>
          <p className="text-muted-foreground">
            Verwaltung der Disziplin-Codes für David21/Meyton Export
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addNewDisziplin}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Disziplin
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disziplinen-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {disziplinen.map((disziplin) => (
              <div key={disziplin.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    {editingId === disziplin.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editData.name || ''}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="font-bold text-lg border rounded px-2 py-1 w-full"
                          placeholder="Disziplin-Name"
                        />
                        <input
                          type="text"
                          value={editData.spoNummer || ''}
                          onChange={(e) => setEditData({...editData, spoNummer: e.target.value})}
                          className="text-sm border rounded px-2 py-1 w-24"
                          placeholder="SPO-Nr"
                        />
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-bold text-lg">{sanitizeText(disziplin.name)}</h3>
                        <p className="text-sm text-muted-foreground">SPO-Nr: {sanitizeText(disziplin.spoNummer)}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                      Saison: {sanitizeText(disziplin.saison)}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => startEdit(disziplin)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteDisziplin(disziplin.id, disziplin.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {(editingId === disziplin.id ? editData.schusszahlen : disziplin.schusszahlen)?.map((schuss: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <strong>Schüsse:</strong> 
                          {editingId === disziplin.id ? (
                            <input
                              type="number"
                              value={editData.schusszahlen?.[index]?.schusszahl || ''}
                              onChange={(e) => {
                                const newSchusszahlen = [...(editData.schusszahlen || [])];
                                newSchusszahlen[index] = {
                                  ...newSchusszahlen[index],
                                  schusszahl: parseInt(e.target.value) || 0
                                };
                                setEditData({...editData, schusszahlen: newSchusszahlen});
                              }}
                              className="ml-1 border rounded px-2 py-1 w-16"
                            />
                          ) : (
                            schuss.schusszahl
                          )}
                        </div>
                        <div>
                          <strong>Kennziffer:</strong> 
                          {editingId === disziplin.id ? (
                            <input
                              type="text"
                              value={editData.schusszahlen?.[index]?.kennziffer || ''}
                              onChange={(e) => {
                                const newSchusszahlen = [...(editData.schusszahlen || [])];
                                newSchusszahlen[index] = {
                                  ...newSchusszahlen[index],
                                  kennziffer: e.target.value
                                };
                                setEditData({...editData, schusszahlen: newSchusszahlen});
                              }}
                              className="font-mono text-blue-600 ml-1 border rounded px-2 py-1 w-24"
                            />
                          ) : (
                            <span className="font-mono text-blue-600 ml-1">
                              {schuss.kennziffer || 'Nicht gesetzt'}
                            </span>
                          )}
                        </div>
                        <div>
                          <strong>Schießzeit:</strong> 
                          {editingId === disziplin.id ? (
                            <input
                              type="number"
                              value={editData.schusszahlen?.[index]?.schiesszeit_andere || ''}
                              onChange={(e) => {
                                const newSchusszahlen = [...(editData.schusszahlen || [])];
                                newSchusszahlen[index] = {
                                  ...newSchusszahlen[index],
                                  schiesszeit_andere: parseInt(e.target.value) || 0
                                };
                                setEditData({...editData, schusszahlen: newSchusszahlen});
                              }}
                              className="ml-1 border rounded px-2 py-1 w-16"
                            />
                          ) : (
                            schuss.schiesszeit_andere
                          )}min
                        </div>
                        <div>
                          <strong>Altersklassen:</strong> 
                          {editingId === disziplin.id ? (
                            <input
                              type="text"
                              value={editData.schusszahlen?.[index]?.altersklassen?.join(', ') || ''}
                              onChange={(e) => {
                                const newSchusszahlen = [...(editData.schusszahlen || [])];
                                newSchusszahlen[index] = {
                                  ...newSchusszahlen[index],
                                  altersklassen: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                };
                                setEditData({...editData, schusszahlen: newSchusszahlen});
                              }}
                              className="ml-1 border rounded px-2 py-1 w-full"
                              placeholder="Schüler, Jugend, Erwachsene"
                            />
                          ) : (
                            schuss.altersklassen?.join(', ')
                          )}
                        </div>
                      </div>
                      {editingId === disziplin.id && (
                        <div className="mt-2">
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              const newSchusszahlen = [...(editData.schusszahlen || [])];
                              newSchusszahlen.splice(index, 1);
                              setEditData({...editData, schusszahlen: newSchusszahlen});
                            }}
                          >
                            🗑️ Entfernen
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {editingId === disziplin.id && (
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        type="button"
                        onClick={() => {
                          const currentSchusszahlen = editData.schusszahlen || [];
                          const newSchusszahlen = [...currentSchusszahlen, {
                            schusszahl: 40,
                            altersklassen: ['Erwachsene'],
                            schiesszeit_andere: 50,
                            schiesszeit_zuganlagen: 60,
                            kennziffer: ''
                          }];
                          setEditData((prev: any) => ({...prev, schusszahlen: newSchusszahlen}));
                        }}
                      >
                        + Schusszahl hinzufügen
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        <Save className="h-3 w-3 mr-1" />
                        Speichern
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3 mr-1" />
                        Abbrechen
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Kennziffer-Format</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Format:</strong> XYYYYZZZ (8 Ziffern)</p>
          <p><strong>X:</strong> Entfernung (1=10m, 2=15m, 3=25m, 4=50m)</p>
          <p><strong>YYYY:</strong> DSB-Regelnummer (0110=LG, 0210=LP, 0120=3-Stellung)</p>
          <p><strong>ZZZ:</strong> Schussanzahl (020=20 Schuss, 040=40 Schuss, 060=60 Schuss)</p>
          <p><strong>Beispiele:</strong></p>
          <ul className="ml-4 space-y-1">
            <li>• 10110020 = LG Schüler (20 Schuss)</li>
            <li>• 10110040 = LG Erwachsene (40 Schuss)</li>
            <li>• 10210020 = LP Schüler (20 Schuss)</li>
            <li>• 10210040 = LP Erwachsene (40 Schuss)</li>
            <li>• 10120060 = 3-Stellung (60 Schuss)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}