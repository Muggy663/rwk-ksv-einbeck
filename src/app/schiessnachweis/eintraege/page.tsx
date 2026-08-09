"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SchießnachweisService } from '@/lib/services/schiessnachweis-service';
import { UnifiedTrainingService } from '@/lib/services/unified-training-service';
import { SchießEintrag } from '@/types/schiessnachweis';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Calendar, Target, MapPin, Edit, Trash2, Eye, Users, Filter } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

function EintraegeContent() {
  const { toast } = useToast();
  const [einträge, setEinträge] = useState<SchießEintrag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSync, setNeedsSync] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('alle');
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Direkt laden ohne Cache-Invalidierung
      loadEinträge();
      checkSyncStatus();
    }
  }, [mounted]);
  
  // Reload when returning from edit with refresh parameter
  useEffect(() => {
    const refreshParam = searchParams?.get('refresh');
    if (refreshParam && refreshParam !== 'true') {
      // Use timestamp-based refresh to force reload
      loadEinträge();
    }
  }, [searchParams]);

  const loadEinträge = async () => {
    try {
      const data = await SchießnachweisService.getEinträge();
      setEinträge(data);
      logInfo('Loaded entries:', { data: data.length }); // Debug log
    } catch (error) {
      logError('Fehler beim Laden der Einträge:', error);
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

  const handleDelete = async (id: string) => {
    if (confirm('Eintrag wirklich löschen?')) {
      try {
        await SchießnachweisService.deleteEintrag(id);
        loadEinträge();
        toast({
          title: "Eintrag gelöscht",
          description: "Der Eintrag wurde erfolgreich entfernt"
        });
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Eintrag konnte nicht gelöscht werden",
          variant: "destructive"
        });
      }
    }
  };

  const availableYears = useMemo(() => {
    const years = [...new Set(einträge.map(e => new Date(e.datum).getFullYear()))]
      .sort((a, b) => b - a);
    return years;
  }, [einträge]);

  const filteredEinträge = useMemo(() => {
    if (selectedYear === 'alle') return einträge;
    return einträge.filter(e => new Date(e.datum).getFullYear() === parseInt(selectedYear));
  }, [einträge, selectedYear]);

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
              {filteredEinträge.length} von {einträge.length} Einträgen
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/schiessnachweis/neuer-eintrag">
                <Plus className="h-4 w-4 mr-2" />
                Neuer Eintrag
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {availableYears.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Jahr auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Jahre</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Sync banner removed - data is automatically stored in database */}

      {isLoading ? (
        <div className="text-center py-8">
          <p>Lade Einträge...</p>
        </div>
      ) : filteredEinträge.length === 0 ? (
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
          {filteredEinträge.map((eintrag) => (
            <Card key={eintrag.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={eintrag.typ === 'wettkampf' ? 'default' : 'secondary'}>
                      {eintrag.typ === 'wettkampf' ? '🏆 Wettkampf' : '🎯 Training'}
                    </Badge>
                    {eintrag.serien && eintrag.serien.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        📊 {eintrag.serien.length} Serien
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Schüsse</div>
                    <div className="font-semibold">{eintrag.schussAnzahl}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Ergebnis</div>
                    <div className="font-semibold space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-blue-600">
                          {eintrag.ergebnisGanzeRinge || <span className="text-orange-500">-</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">ganze</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-green-600">
                          {eintrag.ergebnis || <span className="text-orange-500">-</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">zehntel</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Durchschnitt</div>
                    <div className="font-semibold">
                      {eintrag.ergebnis && eintrag.schussAnzahl ? (eintrag.ergebnis / eintrag.schussAnzahl).toFixed(1) : 
                       eintrag.ergebnisGanzeRinge && eintrag.schussAnzahl ? (eintrag.ergebnisGanzeRinge / eintrag.schussAnzahl).toFixed(1) : '-'}
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
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href={`/schiessnachweis/eintraege/${eintrag.id}/details`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href={`/schiessnachweis/eintraege/${eintrag.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Bearbeiten
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(eintrag.id)}
                    className="text-red-600 hover:text-red-700 w-full sm:w-auto"
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

export default function EintraegePage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 sm:p-6 max-w-4xl"><div className="text-center py-8"><p>Lade Einträge...</p></div></div>}>
      <EintraegeContent />
    </Suspense>
  );
}
