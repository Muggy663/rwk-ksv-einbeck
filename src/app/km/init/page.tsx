"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/auth/authFetch';
import { useKMAuth } from '@/hooks/useKMAuth';
import Link from 'next/link';

export default function KMInit() {
  const { toast } = useToast();
  const { hasKMAccess, isKMAdmin, loading: authLoading } = useKMAuth();
  const [initStates, setInitStates] = useState({
    wettkampfklassen: false,
    disziplinen: false
  });
  const [loading, setLoading] = useState({
    wettkampfklassen: false,
    disziplinen: false
  });
  const [backfillLoading, setBackfillLoading] = useState(false);

  const handleBackfillAltersklassen = async (overwrite: boolean) => {
    const frage = overwrite
      ? 'ALLE Meldungen neu berechnen und die Altersklasse überschreiben?'
      : 'Fehlende Altersklassen in bestehenden Meldungen ergänzen?';
    if (!confirm(frage)) return;
    setBackfillLoading(true);
    try {
      const response = await authFetch('/api/km/meldungen/backfill-altersklasse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwrite })
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Fertig',
          description: `${result.aktualisiert} Meldungen aktualisiert (${result.geprueft} geprüft, ${result.uebersprungen} übersprungen).`
        });
      } else {
        toast({ title: 'Fehler', description: result.error || 'Migration fehlgeschlagen', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fehler', description: 'Netzwerkfehler', variant: 'destructive' });
    } finally {
      setBackfillLoading(false);
    }
  };

  const handleInitWettkampfklassen = async () => {
    setLoading(prev => ({ ...prev, wettkampfklassen: true }));
    try {
      const response = await authFetch('/api/km/init-wettkampfklassen', {
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
      const response = await authFetch('/api/km/disziplinen', {
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

  // Ladezustand der Berechtigungsprüfung
  if (authLoading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade…</p>
        </div>
      </div>
    );
  }

  // Zugangsschutz: Nur eingeloggte KM-Berechtigte (Admin/KM-Orga/Sportleiter)
  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <p className="text-muted-foreground mb-4">
            Dieser Bereich (System-Initialisierung) ist nur für Administratoren und die KM-Organisation.
          </p>
          <Link href="/" className="text-primary hover:text-primary/80">← Zur Startseite</Link>
        </div>
      </div>
    );
  }

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
                    const response = await authFetch('/api/km/wettkampfklassen/cleanup', { method: 'POST' });
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
                    const response = await authFetch('/api/km/disziplinen/cleanup', { method: 'POST' });
                    const result = await response.json();
                    toast({ title: result.success ? 'Erfolg' : 'Fehler', description: result.message });
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Doppelte löschen
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      const response = await authFetch('/api/km/add-blasrohr', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const result = await response.json();
                      toast({ 
                        title: result.success ? 'Erfolg' : 'Fehler', 
                        description: result.message || result.error,
                        variant: result.success ? 'default' : 'destructive'
                      });
                    } catch (error) {
                      toast({ title: 'Fehler', description: 'Netzwerkfehler', variant: 'destructive' });
                    }
                  }}
                  variant="default"
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  🎯 Blasrohr 12.10 hinzufügen
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

      {/* Wartung: Altersklassen in bestehende Meldungen nachtragen — nur Admin */}
      {isKMAdmin && (
      <Card className="mt-6 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-1">🎯 Altersklassen nachtragen (Migration)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Schreibt die berechnete Altersklasse in bereits vorhandene Meldungen. „Fehlende ergänzen"
            lässt vorhandene Klassen unangetastet; „Alle neu berechnen" überschreibt auch bestehende
            (z. B. nach Änderungen an den Altersklassen-Grenzen). Nur für Administratoren.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => handleBackfillAltersklassen(false)}
              disabled={backfillLoading}
              variant="default"
            >
              {backfillLoading ? 'Läuft…' : 'Fehlende ergänzen'}
            </Button>
            <Button
              onClick={() => handleBackfillAltersklassen(true)}
              disabled={backfillLoading}
              variant="outline"
            >
              {backfillLoading ? 'Läuft…' : 'Alle neu berechnen (überschreiben)'}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
