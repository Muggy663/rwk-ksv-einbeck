// src/app/km-orga/ergebnisse-korrektur/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Search, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface KMErgebnis {
  id: string;
  schuetzeName: string;
  verein: string;
  disziplin: string;
  altersklasse: string;
  ringe: number;
  zehntel: number;
  innerZehner: number;
}

export default function ErgebnisseKorrekturPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [ergebnisse, setErgebnisse] = useState<KMErgebnis[]>([]);
  const [filteredErgebnisse, setFilteredErgebnisse] = useState<KMErgebnis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDisziplin, setSelectedDisziplin] = useState<string>('alle');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<KMErgebnis>>({});

  useEffect(() => {
    loadErgebnisse();
  }, []);

  useEffect(() => {
    filterErgebnisse();
  }, [ergebnisse, searchTerm, selectedDisziplin]);

  const loadErgebnisse = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'km_ergebnisse'));
      const ergebnisseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KMErgebnis[];
      
      setErgebnisse(ergebnisseData.sort((a, b) => a.schuetzeName.localeCompare(b.schuetzeName)));
    } catch (error) {
      console.error('Fehler beim Laden der Ergebnisse:', error);
      toast({ title: 'Fehler', description: 'Ergebnisse konnten nicht geladen werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filterErgebnisse = () => {
    let filtered = ergebnisse;

    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.schuetzeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.verein.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDisziplin !== 'alle') {
      filtered = filtered.filter(e => e.disziplin === selectedDisziplin);
    }

    setFilteredErgebnisse(filtered);
  };

  const startEdit = (ergebnis: KMErgebnis) => {
    setEditingId(ergebnis.id);
    setEditValues({
      ringe: ergebnis.ringe,
      zehntel: ergebnis.zehntel,
      innerZehner: ergebnis.innerZehner
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'km_ergebnisse', id), editValues);
      
      setErgebnisse(prev => prev.map(e => 
        e.id === id ? { ...e, ...editValues } : e
      ));
      
      setEditingId(null);
      setEditValues({});
      
      toast({ title: 'Gespeichert', description: 'Ergebnis wurde erfolgreich korrigiert.' });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({ title: 'Fehler', description: 'Ergebnis konnte nicht gespeichert werden.', variant: 'destructive' });
    }
  };

  const deleteErgebnis = async (id: string, schuetzeName: string) => {
    if (!confirm(`Ergebnis von ${schuetzeName} wirklich löschen?`)) return;
    
    try {
      await deleteDoc(doc(db, 'km_ergebnisse', id));
      setErgebnisse(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Gelöscht', description: 'Ergebnis wurde erfolgreich gelöscht.' });
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      toast({ title: 'Fehler', description: 'Ergebnis konnte nicht gelöscht werden.', variant: 'destructive' });
    }
  };

  const disziplinen = [...new Set(ergebnisse.map(e => e.disziplin))];

  if (loading) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade Ergebnisse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/km-orga')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">🔧 Ergebnisse korrigieren</h1>
          <p className="text-muted-foreground">Importierte oder eingegebene Ergebnisse bearbeiten und korrigieren</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter & Suche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Schütze oder Verein suchen</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name oder Verein eingeben..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Disziplin</label>
              <Select value={selectedDisziplin} onValueChange={setSelectedDisziplin}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Disziplinen</SelectItem>
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
          <CardTitle>Ergebnisse ({filteredErgebnisse.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredErgebnisse.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Keine Ergebnisse gefunden. Importieren Sie zuerst Ergebnisse über den Meyton Import.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredErgebnisse.map(ergebnis => (
                <div key={ergebnis.id} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded items-center text-sm">
                  <div className="col-span-3">
                    <div className="font-medium">{ergebnis.schuetzeName}</div>
                    <div className="text-xs text-muted-foreground">{ergebnis.verein}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs">{ergebnis.disziplin}</div>
                    <div className="text-xs text-muted-foreground">{ergebnis.altersklasse}</div>
                  </div>
                  
                  {editingId === ergebnis.id ? (
                    <>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={editValues.ringe || ''}
                          onChange={(e) => setEditValues(prev => ({ ...prev, ringe: parseInt(e.target.value) || 0 }))}
                          className="h-8"
                          placeholder="Ringe"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={editValues.zehntel || ''}
                          onChange={(e) => setEditValues(prev => ({ ...prev, zehntel: parseInt(e.target.value) || 0 }))}
                          className="h-8"
                          placeholder="Zehntel"
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="number"
                          value={editValues.innerZehner || ''}
                          onChange={(e) => setEditValues(prev => ({ ...prev, innerZehner: parseInt(e.target.value) || 0 }))}
                          className="h-8"
                          placeholder="X"
                        />
                      </div>
                      <div className="col-span-2 flex gap-1">
                        <Button size="sm" onClick={() => saveEdit(ergebnis.id)}>
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Abbrechen
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2 font-mono">
                        {ergebnis.ringe} Ringe
                      </div>
                      <div className="col-span-2 font-mono">
                        {ergebnis.zehntel} Zehntel
                      </div>
                      <div className="col-span-1 font-mono">
                        {ergebnis.innerZehner}x
                      </div>
                      <div className="col-span-2 flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => startEdit(ergebnis)}>
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => deleteErgebnis(ergebnis.id, ergebnis.schuetzeName)}
                        >
                          Löschen
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}