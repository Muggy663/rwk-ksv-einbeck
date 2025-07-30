"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function KMInit() {
  const { toast } = useToast();
  const [initStates, setInitStates] = useState({
    wettkampfklassen: false,
    disziplinen: false
  });
  const [loading, setLoading] = useState({
    wettkampfklassen: false,
    disziplinen: false
  });

  const handleInitWettkampfklassen = async () => {
    setLoading(prev => ({ ...prev, wettkampfklassen: true }));
    try {
      const response = await fetch('/api/km/init-wettkampfklassen', {
        method: 'POST'
      });
      
      const result = await response.json();
      if (result.success) {
        setInitStates(prev => ({ ...prev, wettkampfklassen: true }));
        toast({ title: 'Erfolg', description: 'Wettkampfklassen für 2026 initialisiert' });
      } else {
        toast({ title: 'Fehler', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Initialisierung fehlgeschlagen', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, wettkampfklassen: false }));
    }
  };

  const handleInitDisziplinen = async () => {
    setLoading(prev => ({ ...prev, disziplinen: true }));
    try {
      const response = await fetch('/api/km/disziplinen', {
        method: 'POST'
      });
      
      const result = await response.json();
      if (result.success) {
        setInitStates(prev => ({ ...prev, disziplinen: true }));
        toast({ title: 'Erfolg', description: 'Disziplinen für 2026 initialisiert' });
      } else {
        toast({ title: 'Fehler', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Initialisierung fehlgeschlagen', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, disziplinen: false }));
    }
  };

  const allInitialized = initStates.wettkampfklassen && initStates.disziplinen;

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km" className="text-primary hover:text-primary/80">← Zurück</Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">⚙️ KM-System Initialisierung</h1>
          <p className="text-muted-foreground">
            Einmalige Einrichtung der Wettkampfklassen und Disziplinen für 2026
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Wettkampfklassen 2026
              {initStates.wettkampfklassen && <Badge variant="default">✓ Initialisiert</Badge>}
            </CardTitle>
            <CardDescription>
              30 Wettkampfklassen für alle Altersgruppen (Schüler bis Senioren VI)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <div>• Schüler I, Jugend (m/w gemischt)</div>
                <div>• Junioren I/II, Juniorinnen I/II</div>
                <div>• Herren/Damen I-V</div>
                <div>• Senioren 0-VI (teilweise gemischt)</div>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={handleInitWettkampfklassen}
                  disabled={loading.wettkampfklassen || initStates.wettkampfklassen}
                  className="w-full"
                >
                  {loading.wettkampfklassen ? 'Initialisiere...' : 
                   initStates.wettkampfklassen ? 'Bereits initialisiert' : 
                   'Wettkampfklassen initialisieren'}
                </Button>
                <Button 
                  onClick={async () => {
                    const response = await fetch('/api/km/wettkampfklassen/cleanup', { method: 'POST' });
                    const result = await response.json();
                    toast({ title: result.success ? 'Erfolg' : 'Fehler', description: result.message });
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Doppelte löschen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Disziplinen 2026
              {initStates.disziplinen && <Badge variant="default">✓ Initialisiert</Badge>}
            </CardTitle>
            <CardDescription>
              39 Disziplinen mit korrekten SpO-Nummern
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <div>• Luftgewehr/Luftpistole (LG/LP)</div>
                <div>• Kleinkaliber Gewehr/Pistole (KKG/KKP)</div>
                <div>• Armbrust, Lichtgewehr, Blasrohr</div>
                <div>• Alle Auflage-Disziplinen</div>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={handleInitDisziplinen}
                  disabled={loading.disziplinen || initStates.disziplinen}
                  className="w-full"
                >
                  {loading.disziplinen ? 'Initialisiere...' : 
                   initStates.disziplinen ? 'Bereits initialisiert' : 
                   'Disziplinen initialisieren'}
                </Button>
                <Button 
                  onClick={async () => {
                    const response = await fetch('/api/km/disziplinen/cleanup', { method: 'POST' });
                    const result = await response.json();
                    toast({ title: result.success ? 'Erfolg' : 'Fehler', description: result.message });
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Doppelte löschen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {allInitialized && (
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-green-600 text-lg font-medium mb-2">
                ✅ System erfolgreich initialisiert!
              </div>
              <p className="text-green-700 text-sm mb-4">
                Das KM-System ist jetzt einsatzbereit. Sie können mit den Meldungen beginnen.
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/km/meldungen">
                  <Button>Erste Meldung erstellen</Button>
                </Link>
                <Link href="/km/admin">
                  <Button variant="outline">Admin-Bereich</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}