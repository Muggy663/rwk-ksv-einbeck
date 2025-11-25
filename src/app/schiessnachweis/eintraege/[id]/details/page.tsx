"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Target, MapPin, Trophy, Eye } from "lucide-react";
import Link from "next/link";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießEintrag } from "@/types/schiessnachweis";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function EintragDetailsPage() {
  const params = useParams();
  const [eintrag, setEintrag] = useState<SchießEintrag | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadEintrag(params.id as string);
    }
  }, [params.id]);

  const loadEintrag = async (id: string) => {
    try {
      const einträge = await SchießnachweisService.getEinträge();
      const gefundenerEintrag = einträge.find(e => e.id === id);
      setEintrag(gefundenerEintrag || null);
    } catch (error) {
      console.error('Fehler beim Laden des Eintrags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="text-center py-8">
          <p>Lade Details...</p>
        </div>
      </div>
    );
  }

  if (!eintrag) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Eintrag nicht gefunden</p>
          <Button asChild className="mt-4">
            <Link href="/schiessnachweis/eintraege">Zurück zu den Einträgen</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis/eintraege">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu den Einträgen
          </Link>
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Eye className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Eintrag-Details</h1>
        </div>
        <p className="text-muted-foreground">
          Detailansicht vom {format(eintrag.datum, 'dd.MM.yyyy', { locale: de })}
        </p>
      </div>

      {/* Hauptergebnis-Übersicht */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl mb-2">{eintrag.disziplin}</CardTitle>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(eintrag.datum, 'EEEE, dd.MM.yyyy', { locale: de })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {eintrag.standort}
                </span>
                {eintrag.schiessstand && (
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {eintrag.schiessstand}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={eintrag.typ === 'wettkampf' ? 'default' : 'secondary'} className="text-sm">
                {eintrag.typ === 'wettkampf' ? '🏆 Wettkampf' : '🎯 Training'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-1">{eintrag.schussAnzahl}</div>
              <div className="text-sm text-muted-foreground">Schüsse</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-1">{eintrag.ergebnisGanzeRinge || '-'}</div>
              <div className="text-sm text-muted-foreground">Ganze Ringe</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-1">{eintrag.ergebnis || '-'}</div>
              <div className="text-sm text-muted-foreground">Mit Zehntel</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-1">
                {((eintrag.ergebnis || eintrag.ergebnisGanzeRinge || 0) / eintrag.schussAnzahl).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">⌀ pro Schuss</div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-1">
                {(10 - ((eintrag.ergebnis || eintrag.ergebnisGanzeRinge || 0) / eintrag.schussAnzahl)).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Verlust/Schuss</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Serien-Details */}
        {eintrag.serien && eintrag.serien.length > 0 ? (
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Serien-Aufschlüsselung ({eintrag.serien.length} Serien)
              </CardTitle>
              <CardDescription>
                Detaillierte Analyse aller Serien mit Einzelschüssen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {eintrag.serien.map((serie, index) => (
                  <div key={serie.id || index} className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold">Serie {serie.serienNummer || index + 1}</h4>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{serie.summe} Ringe</div>
                        <div className="text-sm text-muted-foreground">
                          ⌀ {serie.schuesse?.length > 0 ? (serie.summe / serie.schuesse.length).toFixed(2) : '0.00'} pro Schuss
                        </div>
                      </div>
                    </div>
                    
                    {serie.schuesse && serie.schuesse.length > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Einzelschüsse:</div>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                          {serie.schuesse.map((schuss, schussIndex) => (
                            <div 
                              key={schussIndex}
                              className={`text-center p-2 rounded font-medium text-sm ${
                                schuss.wert >= 10 ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                                schuss.wert >= 9 ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
                                schuss.wert >= 8 ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                                'bg-red-100 text-red-800 border-2 border-red-300'
                              }`}
                            >
                              {schuss.wert}
                            </div>
                          ))}
                        </div>
                        
                        {/* Serie-Statistiken */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="bg-white p-2 rounded">
                            <div className="text-muted-foreground">Bester Schuss</div>
                            <div className="font-bold text-green-600">
                              {Math.max(...serie.schuesse.map(s => s.wert))}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <div className="text-muted-foreground">Schlechtester</div>
                            <div className="font-bold text-red-600">
                              {Math.min(...serie.schuesse.map(s => s.wert))}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <div className="text-muted-foreground">Streuung</div>
                            <div className="font-bold">
                              {(Math.max(...serie.schuesse.map(s => s.wert)) - Math.min(...serie.schuesse.map(s => s.wert))).toFixed(1)}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <div className="text-muted-foreground">10er/9er</div>
                            <div className="font-bold text-green-600">
                              {serie.schuesse.filter(s => s.wert >= 9).length}/{serie.schuesse.length}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Serien-Gesamtstatistik */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-3 text-blue-900">Serien-Gesamtstatistik</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-blue-700">Beste Serie</div>
                      <div className="font-bold text-green-600 text-lg">
                        {Math.max(...eintrag.serien.map(s => s.summe))} Ringe
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700">Schlechteste Serie</div>
                      <div className="font-bold text-red-600 text-lg">
                        {Math.min(...eintrag.serien.map(s => s.summe))} Ringe
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700">Durchschnitt/Serie</div>
                      <div className="font-bold text-lg">
                        {(eintrag.serien.reduce((sum, s) => sum + s.summe, 0) / eintrag.serien.length).toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700">Konstanz</div>
                      <div className="font-bold text-lg">
                        {(Math.max(...eintrag.serien.map(s => s.summe)) - Math.min(...eintrag.serien.map(s => s.summe))).toFixed(1)} Diff
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Ergebnis-Details</CardTitle>
              <CardDescription>Keine detaillierten Serien verfügbar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Für diesen Eintrag wurden keine detaillierten Serien erfasst.</p>
                <p className="text-sm mt-2">Nur das Gesamtergebnis ist verfügbar.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Zusatzinformationen & Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Zusatzinformationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {eintrag.wetter && (
              <div>
                <div className="text-sm text-muted-foreground">Wetter</div>
                <div className="font-medium">{eintrag.wetter}</div>
              </div>
            )}
            {eintrag.munition && (
              <div>
                <div className="text-sm text-muted-foreground">Munition</div>
                <div className="font-medium">{eintrag.munition}</div>
              </div>
            )}
            {eintrag.waffe && (
              <div>
                <div className="text-sm text-muted-foreground">Waffe</div>
                <div className="font-medium">{eintrag.waffe}</div>
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-2">Metadata</div>
              <div className="space-y-2 text-sm">

                <div className="flex justify-between">
                  <span>Erstellt:</span>
                  <span>{format(eintrag.createdAt, 'dd.MM.yyyy HH:mm:ss', { locale: de })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wettkampfdatum:</span>
                  <span>{format(eintrag.datum, 'dd.MM.yyyy', { locale: de })}</span>
                </div>
              </div>
            </div>
            
            {/* Leistungsanalyse */}
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-2">Leistungsanalyse</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm">Trefferquote (≥8 Ringe)</span>
                  <span className="font-bold text-green-700">
                    {eintrag.serien && eintrag.serien.length > 0 ? (
                      (() => {
                        const alleSchuesse = eintrag.serien.flatMap(s => s.schuesse || []);
                        if (alleSchuesse.length === 0) return '-';
                        const guteSchuesse = alleSchuesse.filter(s => s.wert >= 8).length;
                        return `${((guteSchuesse / alleSchuesse.length) * 100).toFixed(1)}%`;
                      })()
                    ) : (
                      '-'
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm">Maximales Potenzial</span>
                  <span className="font-bold text-blue-700">{eintrag.schussAnzahl * 10} Ringe</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="text-sm">Verlorene Ringe</span>
                  <span className="font-bold text-orange-700">{((eintrag.schussAnzahl * 10) - (eintrag.ergebnisGanzeRinge || eintrag.ergebnis || 0)).toFixed(1)} Ringe</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Notizen */}
      {eintrag.notizen && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notizen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              {eintrag.notizen}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aktionen */}
      <div className="flex gap-3 mt-6">
        <Button asChild>
          <Link href={`/schiessnachweis/eintraege/${eintrag.id}`}>
            Bearbeiten
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/schiessnachweis/eintraege">
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>
    </div>
  );
}