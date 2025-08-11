"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Trophy, Users, Target, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKMAuth } from '@/hooks/useKMAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

interface WettkampfStatus {
  disziplin: string;
  gesamtStarter: number;
  erfassteErgebnisse: number;
  fortschritt: number;
  fehlendStarter: string[];
}

export default function WettkampfDashboardPage() {
  const { toast } = useToast();
  const { hasKMAccess, loading: authLoading } = useKMAuth();
  const [wettkampfStatus, setWettkampfStatus] = useState<WettkampfStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [aktuelleZeit, setAktuelleZeit] = useState(new Date());

  useEffect(() => {
    if (!hasKMAccess || authLoading) return;
    
    const loadWettkampfStatus = async () => {
      try {
        // Lade Daten über API und Firebase
        const [meldungenRes] = await Promise.all([
          fetch('/api/km/meldungen?jahr=2026')
        ]);
        
        const meldungenData = meldungenRes.ok ? (await meldungenRes.json()).data || [] : [];
        
        // Lade VM-Ergebnisse direkt aus Firebase
        const kmErgebnisseSnapshot = await getDocs(collection(db, 'km_vm_ergebnisse'));
        
        // Ergebnisse-Map erstellen
        const ergebnisseMap = new Map();
        kmErgebnisseSnapshot.docs.forEach(doc => {
          const data = doc.data();
          ergebnisseMap.set(data.meldung_id, true);
        });
        
        // Lade Disziplinen und Schützen über API
        const [disziplinenRes, schuetzenRes] = await Promise.all([
          fetch('/api/km/disziplinen'),
          fetch('/api/km/shooters')
        ]);
        
        const disziplinenData = disziplinenRes.ok ? (await disziplinenRes.json()).data || [] : [];
        const schuetzenData = schuetzenRes.ok ? (await schuetzenRes.json()).data || [] : [];
        
        const disziplinenMap = new Map();
        disziplinenData.forEach(disziplin => {
          disziplinenMap.set(disziplin.id, disziplin.name);
        });
        
        const schuetzenMap = new Map();
        schuetzenData.forEach(schuetze => {
          const name = schuetze.firstName && schuetze.lastName 
            ? `${schuetze.firstName} ${schuetze.lastName}` 
            : schuetze.name || 'Unbekannt';
          schuetzenMap.set(schuetze.id, name);
        });
        
        // Status pro Disziplin berechnen
        const statusMap = new Map<string, {
          gesamtStarter: number;
          erfassteErgebnisse: number;
          fehlendStarter: string[];
        }>();
        
        meldungenData.forEach(meldung => {
          const disziplinName = disziplinenMap.get(meldung.disziplinId) || 'Unbekannt';
          const schuetzeName = schuetzenMap.get(meldung.schuetzeId) || 'Unbekannt';
          
          if (!statusMap.has(disziplinName)) {
            statusMap.set(disziplinName, {
              gesamtStarter: 0,
              erfassteErgebnisse: 0,
              fehlendStarter: []
            });
          }
          
          const status = statusMap.get(disziplinName)!;
          status.gesamtStarter++;
          
          if (ergebnisseMap.has(meldung.id)) {
            status.erfassteErgebnisse++;
          } else {
            status.fehlendStarter.push(schuetzeName);
          }
        });
        
        // Status-Array erstellen
        const statusArray: WettkampfStatus[] = Array.from(statusMap.entries()).map(([disziplin, status]) => ({
          disziplin,
          gesamtStarter: status.gesamtStarter,
          erfassteErgebnisse: status.erfassteErgebnisse,
          fortschritt: status.gesamtStarter > 0 ? (status.erfassteErgebnisse / status.gesamtStarter) * 100 : 0,
          fehlendStarter: status.fehlendStarter
        }));
        
        setWettkampfStatus(statusArray.sort((a, b) => a.disziplin.localeCompare(b.disziplin)));
      } catch (error) {
        console.error('Fehler beim Laden:', error);
        toast({ title: 'Fehler', description: 'Wettkampf-Status konnte nicht geladen werden.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    
    loadWettkampfStatus();
    
    // Aktualisiere Zeit jede Minute
    const zeitInterval = setInterval(() => {
      setAktuelleZeit(new Date());
    }, 60000);
    
    return () => clearInterval(zeitInterval);
  }, [hasKMAccess, authLoading, toast]);

  const gesamtStarter = wettkampfStatus.reduce((sum, status) => sum + status.gesamtStarter, 0);
  const gesamtErfasst = wettkampfStatus.reduce((sum, status) => sum + status.erfassteErgebnisse, 0);
  const gesamtFortschritt = gesamtStarter > 0 ? (gesamtErfasst / gesamtStarter) * 100 : 0;

  if (loading || authLoading) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p>Lade Wettkampf-Status...</p>
        </div>
      </div>
    );
  }

  if (!hasKMAccess) {
    return (
      <div className="container py-8 max-w-7xl mx-auto">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Zugriff verweigert</h1>
          <Link href="/km-orga" className="text-primary hover:text-primary/80">← Zurück</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/km-orga">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">🏆 Wettkampf-Dashboard</h1>
          <p className="text-muted-foreground">
            Live-Status des Kreismeisterschafts-Wettkampfs
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {aktuelleZeit.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {gesamtStarter} Starter gesamt
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              {gesamtErfasst} Ergebnisse erfasst
            </div>
          </div>
        </div>
      </div>

      {/* Gesamt-Fortschritt */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gesamt-Fortschritt</span>
            <Badge variant={gesamtFortschritt === 100 ? "default" : "secondary"}>
              {Math.round(gesamtFortschritt)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={gesamtFortschritt} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{gesamtErfasst} von {gesamtStarter} Ergebnissen erfasst</span>
            <span>{gesamtStarter - gesamtErfasst} noch ausstehend</span>
          </div>
        </CardContent>
      </Card>

      {/* Status pro Disziplin */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wettkampfStatus.map(status => (
          <Card key={status.disziplin} className={`${
            status.fortschritt === 100 ? 'border-green-200 bg-green-50' : 
            status.fortschritt > 50 ? 'border-yellow-200 bg-yellow-50' : 
            'border-red-200 bg-red-50'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {status.disziplin}
                </span>
                {status.fortschritt === 100 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fortschritt</span>
                    <span className="font-medium">{Math.round(status.fortschritt)}%</span>
                  </div>
                  <Progress value={status.fortschritt} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Gesamt</div>
                    <div className="font-medium">{status.gesamtStarter}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Erfasst</div>
                    <div className="font-medium text-green-600">{status.erfassteErgebnisse}</div>
                  </div>
                </div>
                
                {status.fehlendStarter.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-red-600 mb-1">
                      Fehlende Ergebnisse ({status.fehlendStarter.length}):
                    </div>
                    <div className="max-h-24 overflow-y-auto">
                      {status.fehlendStarter.slice(0, 3).map((starter, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          • {starter}
                        </div>
                      ))}
                      {status.fehlendStarter.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          ... und {status.fehlendStarter.length - 3} weitere
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
