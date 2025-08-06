"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';

interface Meldung {
  id: string;
  schuetzenName: string;
  vereinsname: string;
  disziplin: string;
  vmErgebnis?: {
    ringe: number;
    teiler?: number;
  };
}

export default function VMErgebnissePage() {
  const { toast } = useToast();
  const [meldungen, setMeldungen] = useState<Meldung[]>([]);
  const [selectedDisziplin, setSelectedDisziplin] = useState<string>('');
  const [disziplinen, setDisziplinen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Meldungen laden
        const meldungenSnapshot = await getDocs(collection(db, 'km_meldungen'));
        const meldungenData: Meldung[] = [];
        const disziplinenSet = new Set<string>();

        // VM-Ergebnisse laden
        const vmErgebnisseSnapshot = await getDocs(collection(db, 'km_vm_ergebnisse'));
        const vmErgebnisseMap = new Map();
        vmErgebnisseSnapshot.docs.forEach(doc => {
          const data = doc.data();
          vmErgebnisseMap.set(data.meldung_id, {
            ringe: data.ergebnis_ringe,
            teiler: data.ergebnis_teiler
          });
        });

        meldungenSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.schuetzen && Array.isArray(data.schuetzen)) {
            data.schuetzen.forEach((schuetze: any) => {
              const meldungId = `${doc.id}-${schuetze.id}`;
              meldungenData.push({
                id: meldungId,
                schuetzenName: schuetze.name,
                vereinsname: data.vereinsname,
                disziplin: data.disziplin,
                vmErgebnis: vmErgebnisseMap.get(meldungId)
              });
              disziplinenSet.add(data.disziplin);
            });
          }
        });

        setMeldungen(meldungenData);
        setDisziplinen(Array.from(disziplinenSet).sort());
      } catch (error) {
        console.error('Fehler beim Laden:', error);
        toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  const handleErgebnisChange = (meldungId: string, field: 'ringe' | 'teiler', value: string) => {
    setMeldungen(prev => prev.map(m => {
      if (m.id === meldungId) {
        const vmErgebnis = m.vmErgebnis || { ringe: 0 };
        return {
          ...m,
          vmErgebnis: {
            ...vmErgebnis,
            [field]: field === 'ringe' ? parseInt(value) || 0 : parseInt(value) || 0
          }
        };
      }
      return m;
    }));
  };

  const handleSave = async (meldungId: string) => {
    const meldung = meldungen.find(m => m.id === meldungId);
    if (!meldung?.vmErgebnis) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'km_vm_ergebnisse'), {
        meldung_id: meldungId,
        ergebnis_ringe: meldung.vmErgebnis.ringe,
        ergebnis_teiler: meldung.vmErgebnis.teiler || 0,
        eingegeben_am: new Date(),
        eingegeben_von: 'km-admin'
      });

      toast({ title: 'Gespeichert', description: `VM-Ergebnis für ${meldung.schuetzenName} gespeichert.` });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({ title: 'Fehler', description: 'Ergebnis konnte nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filteredMeldungen = selectedDisziplin 
    ? meldungen.filter(m => m.disziplin === selectedDisziplin)
    : meldungen;

  if (loading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade VM-Ergebnisse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">🏆 VM-Ergebnisse erfassen</h1>
        <p className="text-muted-foreground">
          Vereinsmeisterschafts-Ergebnisse für leistungsbasierte Startlisten-Sortierung
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
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
                  <SelectItem value="">Alle Disziplinen</SelectItem>
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
          <CardTitle>VM-Ergebnisse ({filteredMeldungen.length} Meldungen)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMeldungen.map(meldung => (
              <div key={meldung.id} className="grid grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg items-center">
                <div className="col-span-3">
                  <div className="font-medium">{meldung.schuetzenName}</div>
                  <div className="text-sm text-muted-foreground">{meldung.vereinsname}</div>
                </div>
                <div className="col-span-2">
                  <Badge variant="outline">{meldung.disziplin}</Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Ringe</Label>
                  <Input
                    type="number"
                    min="0"
                    max="400"
                    value={meldung.vmErgebnis?.ringe || ''}
                    onChange={(e) => handleErgebnisChange(meldung.id, 'ringe', e.target.value)}
                    className="h-8"
                    placeholder="z.B. 285"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Teiler (Auflage)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="999"
                    value={meldung.vmErgebnis?.teiler || ''}
                    onChange={(e) => handleErgebnisChange(meldung.id, 'teiler', e.target.value)}
                    className="h-8"
                    placeholder="z.B. 123"
                  />
                </div>
                <div className="col-span-2">
                  {meldung.vmErgebnis && (
                    <div className="text-sm font-medium text-green-600">
                      {meldung.vmErgebnis.ringe}{meldung.vmErgebnis.teiler ? `.${meldung.vmErgebnis.teiler}` : ''}
                    </div>
                  )}
                </div>
                <div className="col-span-1">
                  <Button 
                    size="sm" 
                    onClick={() => handleSave(meldung.id)}
                    disabled={saving || !meldung.vmErgebnis?.ringe}
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
