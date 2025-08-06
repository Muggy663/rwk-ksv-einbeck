"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Play, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';

interface StartlistConfig {
  id?: string;
  austragungsort: string;
  verfuegbareStaende: string[];
  startDatum: string;
  startUhrzeit: string;
  durchgangsDauer: number;
  wechselzeit: number;
  disziplinen: string[];
}

export default function BearbeitenPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [config, setConfig] = useState<StartlistConfig>({
    austragungsort: '',
    verfuegbareStaende: [],
    startDatum: '',
    startUhrzeit: '09:00',
    durchgangsDauer: 90,
    wechselzeit: 15,
    disziplinen: []
  });
  const [vereine, setVereine] = useState<Array<{id: string, name: string}>>([]);
  const [disziplinen, setDisziplinen] = useState<Array<{spoNummer: number, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const ALLE_STAENDE = [...Array.from({length: 15}, (_, i) => (i + 1).toString()), '101', '102'];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Konfiguration laden
        const configDoc = await getDoc(doc(db, 'km_startlisten_configs', params.id as string));
        if (configDoc.exists()) {
          setConfig({ id: configDoc.id, ...configDoc.data() } as StartlistConfig);
        }

        // Vereine und Disziplinen laden
        const [clubsSnapshot, disziplinenSnapshot] = await Promise.all([
          getDocs(collection(db, 'clubs')),
          getDocs(collection(db, 'km_disziplinen'))
        ]);

        setVereine(clubsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        setDisziplinen(
          disziplinenSnapshot.docs
            .map(doc => ({ spoNummer: doc.data().spoNummer, name: doc.data().name }))
            .sort((a, b) => (a.spoNummer || 0) - (b.spoNummer || 0))
        );
      } catch (error) {
        console.error('Fehler beim Laden:', error);
        toast({ title: 'Fehler', description: 'Konfiguration konnte nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params.id, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'km_startlisten_configs', params.id as string), {
        ...config,
        updatedAt: new Date()
      });
      toast({ title: 'Gespeichert', description: 'Konfiguration wurde aktualisiert.' });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({ title: 'Fehler', description: 'Konfiguration konnte nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateStartlists = async () => {
    await handleSave();
    router.push(`/km-orga/startlisten/generieren/${params.id}`);
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade Konfiguration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">✏️ Konfiguration bearbeiten</h1>
          <p className="text-muted-foreground">Anpassungen für wiederverwendbare Wettkampf-Einstellungen</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grunddaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Austragungsort</Label>
                <Select value={config.austragungsort} onValueChange={(value) => setConfig(prev => ({...prev, austragungsort: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vereine.map(verein => (
                      <SelectItem key={verein.id} value={verein.id}>{verein.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={config.startDatum}
                  onChange={(e) => setConfig(prev => ({...prev, startDatum: e.target.value}))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stände auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {ALLE_STAENDE.map(stand => (
                <div key={stand} className="flex items-center space-x-2">
                  <Checkbox
                    checked={config.verfuegbareStaende.includes(stand)}
                    onCheckedChange={(checked) => {
                      setConfig(prev => ({
                        ...prev,
                        verfuegbareStaende: checked 
                          ? [...prev.verfuegbareStaende, stand].sort((a, b) => parseInt(a) - parseInt(b))
                          : prev.verfuegbareStaende.filter(s => s !== stand)
                      }));
                    }}
                  />
                  <Label className="text-sm">{stand}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disziplinen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {disziplinen.map(disziplin => (
                <div key={disziplin.name} className="flex items-center space-x-2">
                  <Checkbox
                    checked={config.disziplinen.includes(disziplin.name)}
                    onCheckedChange={(checked) => {
                      setConfig(prev => ({
                        ...prev,
                        disziplinen: checked 
                          ? [...prev.disziplinen, disziplin.name]
                          : prev.disziplinen.filter(d => d !== disziplin.name)
                      }));
                    }}
                  />
                  <Label className="text-sm">
                    {disziplin.spoNummer ? `${disziplin.spoNummer} - ` : ''}{disziplin.name}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
          <Button onClick={handleGenerateStartlists} disabled={saving}>
            <Play className="h-4 w-4 mr-2" />
            Speichern & Startlisten generieren
          </Button>
        </div>
      </div>
    </div>
  );
}