"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Edit, Save, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useKMAuth } from '@/hooks/useKMAuth';

interface Altersklasse {
  id: string;
  klassenId: number;
  name: string;
  minAlter: number;
  maxAlter: number;
  geschlecht: number; // 0=w, 1=m, 2=gemischt
}

export default function AltersklassenVerwaltung() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading } = useKMAuth();
  const [klassen, setKlassen] = useState<Altersklasse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Altersklasse>>({});

  const initialKlassen: Altersklasse[] = [
    { id: '1', klassenId: 10, name: 'Herren I', minAlter: 21, maxAlter: 40, geschlecht: 1 },
    { id: '2', klassenId: 11, name: 'Damen I', minAlter: 21, maxAlter: 40, geschlecht: 0 },
    { id: '3', klassenId: 12, name: 'Herren II', minAlter: 41, maxAlter: 50, geschlecht: 1 },
    { id: '4', klassenId: 13, name: 'Damen II', minAlter: 41, maxAlter: 50, geschlecht: 0 },
    { id: '5', klassenId: 14, name: 'Herren III', minAlter: 51, maxAlter: 60, geschlecht: 1 },
    { id: '6', klassenId: 15, name: 'Damen III', minAlter: 51, maxAlter: 60, geschlecht: 0 },
    { id: '7', klassenId: 16, name: 'Herren IV', minAlter: 61, maxAlter: 70, geschlecht: 1 },
    { id: '8', klassenId: 17, name: 'Damen IV', minAlter: 61, maxAlter: 70, geschlecht: 0 },
    { id: '9', klassenId: 20, name: 'Schüler männl.', minAlter: 0, maxAlter: 14, geschlecht: 1 },
    { id: '10', klassenId: 21, name: 'Schüler weibl.', minAlter: 0, maxAlter: 14, geschlecht: 0 },
    { id: '11', klassenId: 30, name: 'Jugend männl.', minAlter: 15, maxAlter: 16, geschlecht: 1 },
    { id: '12', klassenId: 31, name: 'Jugend weibl.', minAlter: 15, maxAlter: 16, geschlecht: 0 },
    { id: '13', klassenId: 40, name: 'Junioren I männl.', minAlter: 19, maxAlter: 20, geschlecht: 1 },
    { id: '14', klassenId: 41, name: 'Junioren I weibl.', minAlter: 19, maxAlter: 20, geschlecht: 0 },
    { id: '15', klassenId: 42, name: 'Junioren II männl.', minAlter: 17, maxAlter: 18, geschlecht: 1 },
    { id: '16', klassenId: 43, name: 'Junioren II weibl.', minAlter: 17, maxAlter: 18, geschlecht: 0 },
    { id: '17', klassenId: 70, name: 'Senioren I männl.', minAlter: 51, maxAlter: 60, geschlecht: 1 },
    { id: '18', klassenId: 71, name: 'Senioren I weibl.', minAlter: 51, maxAlter: 60, geschlecht: 0 },
    { id: '19', klassenId: 72, name: 'Senioren II männl.', minAlter: 61, maxAlter: 65, geschlecht: 1 },
    { id: '20', klassenId: 73, name: 'Senioren II weibl.', minAlter: 61, maxAlter: 65, geschlecht: 0 },
    { id: '21', klassenId: 74, name: 'Senioren III männl.', minAlter: 66, maxAlter: 70, geschlecht: 1 },
    { id: '22', klassenId: 75, name: 'Senioren III weibl.', minAlter: 66, maxAlter: 70, geschlecht: 0 },
    { id: '23', klassenId: 76, name: 'Senioren IV männl.', minAlter: 71, maxAlter: 75, geschlecht: 1 },
    { id: '24', klassenId: 77, name: 'Senioren IV weibl.', minAlter: 71, maxAlter: 75, geschlecht: 0 },
    { id: '25', klassenId: 78, name: 'Senioren V männl.', minAlter: 76, maxAlter: 255, geschlecht: 1 },
    { id: '26', klassenId: 79, name: 'Senioren V weibl.', minAlter: 76, maxAlter: 255, geschlecht: 0 },
    { id: '27', klassenId: 50, name: 'Senioren 0', minAlter: 41, maxAlter: 50, geschlecht: 1 },
    { id: '28', klassenId: 51, name: 'Seniorinnen 0', minAlter: 41, maxAlter: 50, geschlecht: 0 },
    { id: '29', klassenId: 18, name: 'Herren V', minAlter: 71, maxAlter: 255, geschlecht: 1 },
    { id: '30', klassenId: 19, name: 'Damen V', minAlter: 71, maxAlter: 255, geschlecht: 0 },
    { id: '31', klassenId: 80, name: 'Senioren VI männl.', minAlter: 81, maxAlter: 255, geschlecht: 1 },
    { id: '32', klassenId: 81, name: 'Seniorinnen VI', minAlter: 81, maxAlter: 255, geschlecht: 0 },
    { id: '33', klassenId: 99, name: 'offene Klasse', minAlter: 0, maxAlter: 255, geschlecht: 2 }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/km/altersklassen');
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          setKlassen(result.data);
        } else {
          setKlassen(initialKlassen);
          for (const klasse of initialKlassen) {
            await fetch('/api/km/altersklassen', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(klasse)
            });
          }
        }
      }
    } catch (error) {
      setKlassen(initialKlassen);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (klasse: Altersklasse) => {
    setEditingId(klasse.id);
    setEditData(klasse);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      await fetch('/api/km/altersklassen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editData })
      });
      setKlassen(prev => prev.map(k => 
        k.id === editingId ? { ...k, ...editData } : k
      ));
      toast({ title: '✅ Gespeichert', description: 'Altersklasse wurde aktualisiert' });
      cancelEdit();
    } catch (error) {
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen', variant: 'destructive' });
    }
  };

  const addNew = async () => {
    try {
      const newKlasse = {
        klassenId: 90,
        name: 'Neue Klasse',
        minAlter: 0,
        maxAlter: 255,
        geschlecht: 2
      };
      const response = await fetch('/api/km/altersklassen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKlasse)
      });
      const result = await response.json();
      const newKlasseWithId = { id: result.id, ...newKlasse };
      setKlassen(prev => [...prev, newKlasseWithId]);
      setEditingId(result.id);
      setEditData(newKlasseWithId);
      toast({ title: '✅ Hinzugefügt', description: 'Neue Altersklasse erstellt' });
    } catch (error) {
      toast({ title: 'Fehler', description: 'Erstellen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const deleteKlasse = async (id: string) => {
    if (confirm('Altersklasse wirklich löschen?')) {
      try {
        await fetch(`/api/km/altersklassen?id=${id}`, { method: 'DELETE' });
        setKlassen(prev => prev.filter(k => k.id !== id));
        toast({ title: '✅ Gelöscht', description: 'Altersklasse wurde entfernt' });
      } catch (error) {
        toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
      }
    }
  };

  const getGeschlechtText = (geschlecht: number) => {
    switch(geschlecht) {
      case 0: return 'weiblich';
      case 1: return 'männlich';
      case 2: return 'gemischt';
      default: return 'unbekannt';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade Altersklassen...</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-muted-foreground mb-4">Sie haben keine Berechtigung für die Altersklassen-Verwaltung.</p>
          <Link href="/" className="text-primary hover:text-primary/80">← Zur Startseite</Link>
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
          <h1 className="text-3xl font-bold text-primary">🏆 Altersklassen & Klassen-IDs</h1>
          <p className="text-muted-foreground">
            Verwaltung der Klassen-IDs für David21/Meyton Export
          </p>
        </div>
        <Button onClick={addNew}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Klasse
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Altersklassen-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3">Klassen-ID</th>
                  <th className="text-left p-3">Klassenname</th>
                  <th className="text-left p-3">Min Alter</th>
                  <th className="text-left p-3">Max Alter</th>
                  <th className="text-left p-3">Geschlecht</th>
                  <th className="text-left p-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {klassen.sort((a, b) => a.klassenId - b.klassenId).map((klasse) => (
                  <tr key={klasse.id} className="border-b">
                    {editingId === klasse.id ? (
                      <>
                        <td className="p-3">
                          <Input
                            type="number"
                            value={editData.klassenId || ''}
                            onChange={(e) => setEditData({...editData, klassenId: parseInt(e.target.value)})}
                            className="h-8 w-16 font-mono text-blue-600"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            value={editData.name || ''}
                            onChange={(e) => setEditData({...editData, name: e.target.value})}
                            className="h-8"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            value={editData.minAlter || ''}
                            onChange={(e) => setEditData({...editData, minAlter: parseInt(e.target.value)})}
                            className="h-8 w-16"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            value={editData.maxAlter || ''}
                            onChange={(e) => setEditData({...editData, maxAlter: parseInt(e.target.value)})}
                            className="h-8 w-16"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={editData.geschlecht || 0}
                            onChange={(e) => setEditData({...editData, geschlecht: parseInt(e.target.value)})}
                            className="h-8 border rounded px-2"
                          >
                            <option value={0}>weiblich</option>
                            <option value={1}>männlich</option>
                            <option value={2}>gemischt</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 font-mono text-blue-600 font-bold">{klasse.klassenId}</td>
                        <td className="p-3 font-medium">{klasse.name}</td>
                        <td className="p-3">{klasse.minAlter}</td>
                        <td className="p-3">{klasse.maxAlter === 255 ? '∞' : klasse.maxAlter}</td>
                        <td className="p-3">{getGeschlechtText(klasse.geschlecht)}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => startEdit(klasse)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteKlasse(klasse.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Wichtige Hinweise</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Klassen-ID:</strong> Eindeutige Nummer für David21/Meyton Export</p>
          <p><strong>Geschlecht:</strong> 0=weiblich, 1=männlich, 2=gemischt</p>
          <p><strong>Max Alter 255:</strong> Bedeutet "kein Höchstalter" (∞)</p>
          <p><strong>Beispiele:</strong> KNr 21 = Schüler weiblich, KNr 10 = Herren I</p>
        </div>
      </div>
    </div>
  );
}