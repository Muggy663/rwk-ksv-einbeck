"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SchießnachweisService } from '@/lib/services/schiessnachweis-service';
import { UnifiedTrainingService } from '@/lib/services/unified-training-service';
import { SchießEintrag } from '@/types/schiessnachweis';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Calendar, Target, MapPin, Edit, Trash2, Eye, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function EintraegePage() {
  const { toast } = useToast();
  const [einträge, setEinträge] = useState<SchießEintrag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSync, setNeedsSync] = useState(false);

  useEffect(() => {
    loadEinträge();
    checkSyncStatus();
  }, []);

  const loadEinträge = () => {
    try {
      const data = SchießnachweisService.getEinträge();
      setEinträge(data);
    } catch (error) {
      console.error('Fehler beim Laden der Einträge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSyncStatus = () => {
    const lastSync = localStorage.getItem('last_cloud_sync');
    const today = new Date().toDateString();
    setNeedsSync(lastSync !== today);
  };

  const handleCloudSync = async () => {
    setIsLoading(true);
    try {
      await UnifiedTrainingService.syncAllData();
      toast({
        title: "Synchronisation erfolgreich",
        description: "Alle Trainingsdaten wurden synchronisiert"
      });
      setNeedsSync(false);
      loadEinträge();
    } catch (error) {
      toast({
        title: "Synchronisation fehlgeschlagen", 
        description: "Fehler beim Laden der Daten",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Eintrag wirklich löschen?')) {
      SchießnachweisService.deleteEintrag(id);
      loadEinträge();
      toast({
        title: "Eintrag gelöscht",
        description: "Der Eintrag wurde erfolgreich entfernt"
      });
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Schießnachweis
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Alle Einträge</h1>
            <p className="text-muted-foreground">
              {einträge.length} Einträge insgesamt
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/schiessnachweis/neuer-eintrag">
                <Plus className="h-4 w-4 mr-2" />
                Neuer Eintrag
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/social">
                <Users className="h-4 w-4 mr-2" />
                Social Training
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {needsSync && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🔄 Synchronisation verfügbar</h3>
          <p className="text-sm text-blue-700 mb-3">
            Synchronisiere deine Trainingsdaten zwischen Schießnachweis und Social Training.
          </p>
          <Button onClick={handleCloudSync} disabled={isLoading} size="sm">
            {isLoading ? 'Synchronisiere...' : '☁️ Jetzt synchronisieren'}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <p>Lade Einträge...</p>
        </div>
      ) : einträge.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Noch keine Einträge</h3>
            <p className="text-muted-foreground mb-4">
              Erstelle deinen ersten Schießnachweis-Eintrag
            </p>
            <Button asChild>
              <Link href="/schiessnachweis/neuer-eintrag">
                <Plus className="h-4 w-4 mr-2" />
                Ersten Eintrag erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {einträge.map((eintrag) => (
            <Card key={eintrag.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{eintrag.disziplin}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(eintrag.datum, 'dd.MM.yyyy', { locale: de })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {eintrag.standort}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant={eintrag.typ === 'wettkampf' ? 'default' : 'secondary'}>
                    {eintrag.typ === 'wettkampf' ? '🏆 Wettkampf' : '🎯 Training'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Schüsse</div>
                    <div className="font-semibold">{eintrag.schussAnzahl}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Ergebnis</div>
                    <div className="font-semibold">{eintrag.ergebnis} Ringe</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Durchschnitt</div>
                    <div className="font-semibold">
                      {(eintrag.ergebnis / eintrag.schussAnzahl).toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Schießstand</div>
                    <div className="font-semibold">{eintrag.schiessstand || '-'}</div>
                  </div>
                </div>
                
                {eintrag.notizen && (
                  <div className="mb-4">
                    <div className="text-sm text-muted-foreground mb-1">Notizen</div>
                    <div className="text-sm bg-muted p-2 rounded">{eintrag.notizen}</div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/schiessnachweis/eintraege/${eintrag.id}/details`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/schiessnachweis/eintraege/${eintrag.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Bearbeiten
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(eintrag.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Löschen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
