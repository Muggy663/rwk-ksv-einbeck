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

  const loadEintrag = (id: string) => {
    try {
      const einträge = SchießnachweisService.getEinträge();
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hauptinformationen */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{eintrag.disziplin}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
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
              <Badge variant={eintrag.typ === 'wettkampf' ? 'default' : 'secondary'} className="text-sm">
                {eintrag.typ === 'wettkampf' ? '🏆 Wettkampf' : '🎯 Training'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{eintrag.schussAnzahl}</div>
                <div className="text-sm text-muted-foreground">Schüsse</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{eintrag.ergebnis}</div>
                <div className="text-sm text-muted-foreground">Ringe</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {(eintrag.ergebnis / eintrag.schussAnzahl).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Durchschnitt</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {((eintrag.ergebnis / eintrag.schussAnzahl) / 10 * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Prozent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zusatzinfos */}
        <Card>
          <CardHeader>
            <CardTitle>Zusatzinformationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {eintrag.schiessstand && (
              <div>
                <div className="text-sm text-muted-foreground">Schießstand</div>
                <div className="font-medium">{eintrag.schiessstand}</div>
              </div>
            )}
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
            <div>
              <div className="text-sm text-muted-foreground">Erstellt</div>
              <div className="font-medium">{format(eintrag.createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Serien-Details */}
      {eintrag.serien && eintrag.serien.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Serien-Details
            </CardTitle>
            <CardDescription>
              Detaillierte Aufschlüsselung aller {eintrag.serien.length} Serien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eintrag.serien.map((serie, index) => (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Serie {index + 1}</CardTitle>
                    <div className="text-2xl font-bold text-blue-600">{Math.round(serie.summe * 10) / 10} Ringe</div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-1 mb-3">
                      {serie.schuesse.map((schuss, schussIndex) => (
                        <div 
                          key={schussIndex}
                          className="text-center p-2 bg-muted rounded text-sm font-medium"
                        >
                          {schuss.wert}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ø {Math.round((serie.summe / serie.schuesse.length) * 10) / 10} pro Schuss
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Serien-Statistiken */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3">Serien-Statistiken</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Beste Serie</div>
                  <div className="font-bold text-green-600">
                    {Math.max(...eintrag.serien.map(s => s.summe))} Ringe
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Schlechteste Serie</div>
                  <div className="font-bold text-red-600">
                    {Math.min(...eintrag.serien.map(s => s.summe))} Ringe
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Durchschnitt/Serie</div>
                  <div className="font-bold">
                    {(eintrag.serien.reduce((sum, s) => sum + s.summe, 0) / eintrag.serien.length).toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Konstanz</div>
                  <div className="font-bold">
                    {(Math.max(...eintrag.serien.map(s => s.summe)) - Math.min(...eintrag.serien.map(s => s.summe)))} Diff
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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