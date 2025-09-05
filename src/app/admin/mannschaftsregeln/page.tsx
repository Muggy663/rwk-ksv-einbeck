"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

export default function MannschaftsregelnAdmin() {
  const { toast } = useToast();
  const [regeln, setRegeln] = useState(null);
  const [disziplinen, setDisziplinen] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const diszRes = await fetch('/api/km/disziplinen');
      if (diszRes.ok) {
        const data = await diszRes.json();
        setDisziplinen(data.data || []);
      }

      const regelnRes = await fetch('/api/admin/mannschaftsregeln');
      if (regelnRes.ok) {
        const data = await regelnRes.json();
        setRegeln(data.regeln);
      } else {
        setRegeln(createDefaultRegeln());
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      setRegeln(createDefaultRegeln());
    } finally {
      setLoading(false);
    }
  };

  const createDefaultRegeln = () => ({
    version: "1.0",
    mannschaftsgroesse: 3,
    disziplinRegeln: {},
    altersklassenKombinationen: {
      "Senioren 0": ["Senioren 0"],
      "Senioren I+II": ["Senioren I m", "Seniorinnen I", "Senioren II m", "Seniorinnen II"],
      "Senioren III+": ["Senioren III m", "Seniorinnen III", "Senioren IV m", "Seniorinnen IV"],
      "Herren/Damen I": ["Herren I", "Damen I"],
      "Jugend": ["Schüler", "Jugend", "Junioren II m", "Juniorinnen II"]
    }
  });

  const saveRegeln = async () => {
    try {
      const response = await fetch('/api/admin/mannschaftsregeln', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regeln })
      });

      if (response.ok) {
        toast({ title: 'Erfolg', description: 'Mannschaftsregeln gespeichert' });
      } else {
        throw new Error('Speichern fehlgeschlagen');
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Regeln konnten nicht gespeichert werden', variant: 'destructive' });
    }
  };

  const addDisziplinRegel = (disziplinId) => {
    setRegeln(prev => ({
      ...prev,
      disziplinRegeln: {
        ...prev.disziplinRegeln,
        [disziplinId]: {
          altersklassenRegeln: "auflage",
          aktiv: true
        }
      }
    }));
  };

  const updateDisziplinRegel = (disziplinId, field, value) => {
    setRegeln(prev => ({
      ...prev,
      disziplinRegeln: {
        ...prev.disziplinRegeln,
        [disziplinId]: {
          ...prev.disziplinRegeln[disziplinId],
          [field]: value
        }
      }
    }));
  };

  const addAltersklassenKombination = () => {
    const name = prompt('Name der neuen Kombination:');
    if (name) {
      setRegeln(prev => ({
        ...prev,
        altersklassenKombinationen: {
          ...prev.altersklassenKombinationen,
          [name]: []
        }
      }));
    }
  };

  const updateKombination = (name, klassen) => {
    setRegeln(prev => ({
      ...prev,
      altersklassenKombinationen: {
        ...prev.altersklassenKombinationen,
        [name]: klassen
      }
    }));
  };

  const deleteKombination = (name) => {
    if (confirm(`Kombination "${name}" löschen?`)) {
      setRegeln(prev => {
        const newKombinationen = { ...prev.altersklassenKombinationen };
        delete newKombinationen[name];
        return {
          ...prev,
          altersklassenKombinationen: newKombinationen
        };
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade Mannschaftsregeln...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">⚙️ Mannschaftsregeln</h1>
          <p className="text-muted-foreground">Konfiguration der automatischen Mannschaftsbildung</p>
        </div>
        <Button onClick={saveRegeln} className="ml-auto">
          <Save className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🎯 Grundeinstellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mannschaftsgröße</Label>
                <Input
                  type="number"
                  value={regeln?.mannschaftsgroesse || 3}
                  onChange={(e) => setRegeln(prev => ({ ...prev, mannschaftsgroesse: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Version</Label>
                <Input
                  value={regeln?.version || "1.0"}
                  onChange={(e) => setRegeln(prev => ({ ...prev, version: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              👥 Altersklassen-Kombinationen
              <Button size="sm" onClick={addAltersklassenKombination}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Kombination
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regeln && Object.entries(regeln.altersklassenKombinationen).map(([name, klassen]) => (
                <div key={name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{name}</h4>
                    <Button size="sm" variant="destructive" onClick={() => deleteKombination(name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {klassen.map((klasse, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {klasse}
                      </span>
                    ))}
                  </div>
                  <Input
                    placeholder="Altersklassen (kommagetrennt)"
                    value={klassen.join(', ')}
                    onChange={(e) => updateKombination(name, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Disziplin-spezifische Regeln</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {disziplinen.map(disziplin => {
                const regel = regeln?.disziplinRegeln?.[disziplin.id];
                return (
                  <div key={disziplin.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{disziplin.name}</h4>
                      {!regel && (
                        <Button size="sm" onClick={() => addDisziplinRegel(disziplin.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Regel hinzufügen
                        </Button>
                      )}
                    </div>
                    
                    {regel && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Altersklassen-Regel</Label>
                          <Select
                            value={regel.altersklassenRegeln}
                            onValueChange={(value) => updateDisziplinRegel(disziplin.id, 'altersklassenRegeln', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auflage">Auflage-Regeln (strikt)</SelectItem>
                              <SelectItem value="freihand">Freihand-Regeln (alle zusammen)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2 mt-6">
                          <Checkbox
                            id={`aktiv-${disziplin.id}`}
                            checked={regel.aktiv !== false}
                            onCheckedChange={(checked) => updateDisziplinRegel(disziplin.id, 'aktiv', checked)}
                          />
                          <Label htmlFor={`aktiv-${disziplin.id}`}>Regel aktiv</Label>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}