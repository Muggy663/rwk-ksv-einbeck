"use client";

import React, { useState, useEffect } from 'react';
import { logError, logDebug, getErrorMessage } from '@/lib/utils/secure-logger';
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
    serien?: number[][];
  };
}

export default function KMErgebnissePage() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading } = useKMAuth();
  const [meldungen, setMeldungen] = useState<Meldung[]>([]);
  const [selectedDisziplin, setSelectedDisziplin] = useState<string>('');
  const [disziplinen, setDisziplinen] = useState<string[]>([]);
  const [selectedJahr, setSelectedJahr] = useState<string>('');
  const [jahre, setJahre] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Disziplin-spezifische Schusszahlen
  const getDisciplineShots = (disziplinName: string) => {
    const disciplineMap = {
      'Luftgewehr': 40,
      'Luftgewehr Auflage': 30,
      'KK-Gewehr Auflage 50m': 30,
      'KK Gewehr Auflage 100m': 30,
      'KK - Gewehr 30 Schuss': 30,
      'KK - Liegendkampf': 60,
      '10m Luftpistole': 40,
      '10 m Luftpistole Auflage': 40,
      'Zimmerstutzen': 30,
      'Zimmerstutzen Auflage': 30
    };
    return disciplineMap[disziplinName] || 30;
  };

  const getSeriesCount = (shots: number) => {
    return Math.ceil(shots / 10);
  };

  const calculateTotalFromSeries = (series: number[][]) => {
    return series.flat().reduce((sum, shot) => sum + shot, 0);
  };

  const handleSave = async (meldungId: string) => {
    const meldung = meldungen.find(m => m.id === meldungId);
    if (!meldung?.kmErgebnis?.ringe) {
      toast({ title: 'Fehler', description: 'Kein Ergebnis zum Speichern vorhanden.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const ergebnisData = {
        meldung_id: meldungId,
        ergebnis_ringe: meldung.kmErgebnis.ringe,
        ergebnis_teiler: meldung.kmErgebnis.teiler || 0,
        serien: meldung.kmErgebnis.serien || [],
        platz_disziplin: meldung.kmErgebnis.platz_disziplin || 0,
        platz_altersklasse: meldung.kmErgebnis.platz_altersklasse || 0,
        eingegeben_am: new Date().toISOString(),
        eingegeben_von: 'km-admin'
      };

      logDebug('💾 Speichere KM-Ergebnis:', ergebnisData);

      const response = await fetch('/api/km/ergebnisse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ergebnisData)
      });
      
      if (response.ok) {
        const result = await response.json();
        logDebug('✅ Erfolgreich gespeichert:', result);
        toast({ 
          title: '✅ Gespeichert!', 
          description: `${meldung.schuetzenName}: ${meldung.kmErgebnis.ringe} Ringe ${result.created ? 'neu erstellt' : 'aktualisiert'}`,
          className: 'border-green-500 bg-green-50'
        });
      } else {
        const errorText = await response.text();
        logError('❌ API Fehler:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      logError('❌ Speichern fehlgeschlagen:', error);
      toast({ 
        title: '❌ Speichern fehlgeschlagen', 
        description: `${meldung.schuetzenName}: ${getErrorMessage(error) || 'Unbekannter Fehler'}`,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

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
              Kreismeisterschafts-Ergebnisse mit 10er-Serien erfassen
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KM-Ergebnisse - Vereinfachte Version</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Die KM-Ergebnisse-Seite wird überarbeitet. Bitte verwenden Sie vorerst die manuelle Eingabe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
