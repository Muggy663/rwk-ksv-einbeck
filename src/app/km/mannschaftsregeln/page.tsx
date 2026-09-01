"use client";

import { useState, useEffect } from 'react';
import { logError, getErrorMessage } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { useKMAuth } from '@/hooks/useKMAuth';

export default function KMMannschaftsregelnAdmin() {
  const { hasKMAccess, userRole, loading: authLoading } = useKMAuth();
  const { toast } = useToast();
  const [regeln, setRegeln] = useState<{
    version: string;
    mannschaftsgroesse: number;
    disziplinRegeln: Record<string, { erlaubteKombinationen: string[]; aktiv: boolean }>;
    altersklassenKombinationen: Record<string, string[]>;
  } | null>(null);
  const [disziplinen, setDisziplinen] = useState<Array<{ id: string; name: string; [key: string]: any }>>([]);
  const [altersklassen, setAltersklassen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasKMAccess && !authLoading) {
      loadData();
    }
  }, [hasKMAccess, authLoading]);

  const loadData = async () => {
    try {
      const diszRes = await fetch('/api/km/disziplinen');
      if (diszRes.ok) {
        const data = await diszRes.json();
        setDisziplinen(data.data || []);
      }

      // Lade echte Altersklassen aus km_wettkampfklassen
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const wettkampfklassenSnapshot = await getDocs(collection(db, 'km_wettkampfklassen'));
      const altersklassenListe: string[] = [];
      
      wettkampfklassenSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Alle Wettkampfklassen laden (jahresunabhängig)
        if (data.name) {
          altersklassenListe.push(data.name);
        }
      });
      
      setAltersklassen(altersklassenListe.sort());

      const regelnRes = await fetch('/api/km/mannschaftsregeln');
      if (regelnRes.ok) {
        const data = await regelnRes.json();
        setRegeln(data.regeln);
      } else {
        throw new Error(`API Fehler: ${regelnRes.status}`);
      }
    } catch (error) {
      logError('Fehler beim Laden:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const saveRegeln = async () => {
    try {
      const response = await fetch('/api/km/mannschaftsregeln', {
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

  const addDisziplinRegel = (disziplinId: string) => {
    setRegeln(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        disziplinRegeln: {
          ...prev.disziplinRegeln,
          [disziplinId]: {
            erlaubteKombinationen: [],
            aktiv: true
          }
        }
      };
    });
  };

  const updateDisziplinRegel = (disziplinId: string, field: string, value: unknown) => {
    setRegeln(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        disziplinRegeln: {
          ...prev.disziplinRegeln,
          [disziplinId]: {
            ...prev.disziplinRegeln[disziplinId],
            [field]: value
          }
        }
      };
    });
  };

  const addAltersklassenKombination = () => {
    const name = prompt('Name der neuen Kombination:');
    if (name) {
      setRegeln(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          altersklassenKombinationen: {
            ...prev.altersklassenKombinationen,
            [name]: []
          }
        };
      });
    }
  };

  const updateKombination = (name: string, klassen: string[]) => {
    setRegeln(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        altersklassenKombinationen: {
          ...prev.altersklassenKombinationen,
          [name]: klassen
        }
      };
    });
  };

  const deleteKombination = (name: string) => {
    if (confirm(`Kombination "${name}" löschen?`)) {
      setRegeln(prev => {
        if (!prev) return prev;
        const newKombinationen = { ...prev.altersklassenKombinationen };
        delete newKombinationen[name];
        return {
          ...prev,
          altersklassenKombinationen: newKombinationen
        };
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade Mannschaftsregeln...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Fehler beim Laden</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">Mögliche Ursachen:</p>
          <ul className="text-sm text-gray-500 mb-4 list-disc list-inside">
            <li>Firestore-Regeln nicht deployed</li>
            <li>Keine Berechtigung für system_config</li>
            <li>Firebase-Verbindungsfehler</li>
          </ul>
          <Button onClick={() => window.location.reload()}>Neu laden</Button>
        </div>
      </div>
    );
  }

  if (!hasKMAccess || (userRole !== 'admin' && userRole !== 'km_organisator')) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-4">Nur Admins und KM-Organisatoren können Mannschaftsregeln bearbeiten.</p>
          <Link href="/km" className="text-primary hover:text-primary/80">← Zurück zum KM-Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">⚙️ KM-Mannschaftsregeln</h1>
          <p className="text-muted-foreground">Konfiguration der automatischen Mannschaftsbildung für Kreismeisterschaften</p>
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
                  onChange={(e) => setRegeln(prev => prev ? ({ ...prev, mannschaftsgroesse: parseInt(e.target.value) }) : prev)}
                />
              </div>
              <div>
                <Label>Version</Label>
                <Input
                  value={regeln?.version || "1.0"}
                  onChange={(e) => setRegeln(prev => prev ? ({ ...prev, version: e.target.value }) : prev)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Übersicht vorhandener Altersklassen */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Vorhandene Altersklassen</CardTitle>
            <p className="text-sm text-muted-foreground">Ziehen Sie Altersklassen per Drag & Drop in die Kombinationen unten</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {altersklassen.map(klasse => (
                <span 
                  key={klasse} 
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', klasse);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm cursor-move hover:bg-gray-200 transition-colors select-none"
                >
                  {klasse}
                </span>
              ))}
              {altersklassen.length === 0 && (
                <p className="text-gray-500">Keine Altersklassen gefunden. Erst Meldungen erstellen.</p>
              )}
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 mr-4">
                      <Label className="text-sm font-medium">Name der Kombination:</Label>
                      <Input
                        value={name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          if (newName !== name) {
                            setRegeln(prev => {
                              if (!prev) return prev;
                              const newKombinationen = { ...prev.altersklassenKombinationen };
                              newKombinationen[newName] = newKombinationen[name];
                              delete newKombinationen[name];
                              return {
                                ...prev,
                                altersklassenKombinationen: newKombinationen
                              };
                            });
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => deleteKombination(name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mb-3">
                    <Label className="text-sm font-medium">Erlaubte Altersklassen:</Label>
                    <div 
                      className="flex flex-wrap gap-2 mt-2 mb-3 p-3 bg-gray-50 rounded border-2 border-dashed border-gray-300 min-h-[60px] transition-colors"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                        const draggedKlasse = e.dataTransfer.getData('text/plain');
                        if (draggedKlasse && !klassen.includes(draggedKlasse)) {
                          updateKombination(name, [...klassen, draggedKlasse]);
                        }
                      }}
                    >
                      {klassen.length === 0 && (
                        <div className="text-gray-400 text-sm italic flex items-center justify-center w-full">
                          Altersklassen hier hineinziehen...
                        </div>
                      )}
                      {klassen.map((klasse, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm flex items-center gap-1">
                          {klasse}
                          <button
                            onClick={() => {
                              const newKlassen = klassen.filter((_, i) => i !== index);
                              updateKombination(name, newKlassen);
                            }}
                            className="text-red-500 hover:text-red-700 ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Altersklasse hinzufügen:</Label>
                    <div className="flex gap-2 mt-1">
                      <Select onValueChange={(value) => {
                        if (!klassen.includes(value)) {
                          updateKombination(name, [...klassen, value]);
                        }
                      }}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Altersklasse auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {altersklassen.filter(ak => !klassen.includes(ak)).map(ak => (
                            <SelectItem key={ak} value={ak}>{ak}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Oder manuell eingeben"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const value = e.currentTarget.value.trim();
                            if (value && !klassen.includes(value)) {
                              updateKombination(name, [...klassen, value]);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
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
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-3 block">Erlaubte Altersklassen-Kombinationen:</Label>
                            <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                              {regeln && Object.entries(regeln.altersklassenKombinationen).map(([kombination, klassen]) => {
                                const isSelected = regel.erlaubteKombinationen?.includes(kombination) || false;
                                return (
                                  <div key={kombination} className="flex items-start space-x-2">
                                    <Checkbox
                                      id={`${disziplin.id}-${kombination}`}
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        const current = regel.erlaubteKombinationen || [];
                                        const updated = checked 
                                          ? [...current, kombination]
                                          : current.filter(k => k !== kombination);
                                        updateDisziplinRegel(disziplin.id, 'erlaubteKombinationen', updated);
                                      }}
                                    />
                                    <div className="flex-1">
                                      <Label htmlFor={`${disziplin.id}-${kombination}`} className="text-sm font-medium cursor-pointer">
                                        {kombination}
                                      </Label>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {klassen.join(', ')}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {(!regeln || Object.keys(regeln.altersklassenKombinationen).length === 0) && (
                                <p className="text-gray-500 text-sm">Keine Kombinationen definiert</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`aktiv-${disziplin.id}`}
                              checked={regel.aktiv !== false}
                              onCheckedChange={(checked) => updateDisziplinRegel(disziplin.id, 'aktiv', checked)}
                            />
                            <Label htmlFor={`aktiv-${disziplin.id}`} className="text-sm">
                              Regel aktiv
                              <div className="text-xs text-gray-500 mt-1">
                                {regel.aktiv !== false ? '✓ Mannschaftsbildung nach Regeln' : '⚠️ Keine Mannschaften für diese Disziplin'}
                              </div>
                            </Label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const newRegeln = { ...regeln };
                              delete newRegeln.disziplinRegeln[disziplin.id];
                              setRegeln(newRegeln);
                            }}
                          >
                            Regel löschen
                          </Button>
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
