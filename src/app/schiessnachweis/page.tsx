"use client";

import { useState, useEffect } from "react";
import { Target, Plus, Calendar, TrendingUp, FileText, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießStatistik } from "@/types/schiessnachweis";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function SchießnachweisPage() {
  const [statistik, setStatistik] = useState<SchießStatistik | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatistik();
  }, []);

  const loadStatistik = () => {
    setIsLoading(true);
    try {
      const stats = SchießnachweisService.getStatistik();
      setStatistik(stats);
    } catch (error) {
      console.error('Fehler beim Laden der Statistik:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const data = SchießnachweisService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schiessnachweis_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export fehlgeschlagen:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex justify-center items-center gap-2 sm:gap-3 mb-4">
          <Target className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Schießnachweis</h1>
            <Badge variant="secondary" className="mt-1 text-xs sm:text-sm">Kostenlos verfügbar</Badge>
          </div>
        </div>
        
        <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-2">
          Das digitale Schießtagebuch für Sportschützen
        </p>
      </div>

      {/* Schnellaktionen */}
      <div className="grid grid-cols-1 sm:flex sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 sm:justify-center">
        <Button asChild size="lg" className="flex items-center justify-center gap-2 h-12 sm:h-auto">
          <Link href="/schiessnachweis/neuer-eintrag">
            <Plus className="h-5 w-5" />
            Neuer Eintrag
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-2 h-12 sm:h-auto">
          <Link href="/schiessnachweis/eintraege">
            <Calendar className="h-5 w-5" />
            Alle Einträge
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-2 h-12 sm:h-auto">
          <Link href="/schiessnachweis/statistiken">
            <TrendingUp className="h-5 w-5" />
            Statistiken
          </Link>
        </Button>
      </div>

      {/* Statistik-Übersicht */}
      {!isLoading && statistik && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{statistik.totalSchüsse}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Schüsse gesamt</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{statistik.totalTrainings}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Trainings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{statistik.totalWettkämpfe}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Wettkämpfe</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{statistik.durchschnittErgebnis}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">⌀ Ergebnis</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Erste Schritte für neue Nutzer */}
      {!isLoading && statistik && statistik.totalSchüsse === 0 && (
        <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-blue-800 dark:text-blue-200 text-lg sm:text-xl">🎯 Willkommen beim Schießnachweis!</CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300 text-sm sm:text-base">
              Beginnen Sie mit Ihrem ersten Eintrag und verfolgen Sie Ihren Fortschritt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                <strong>So geht's:</strong> Tragen Sie Ihre Trainings und Wettkämpfe ein → Sehen Sie Ihre Statistiken → Exportieren Sie Nachweise für Behörden
              </p>
              <Button asChild className="w-full sm:w-auto h-12 sm:h-auto">
                <Link href="/schiessnachweis/neuer-eintrag">
                  <Plus className="h-4 w-4 mr-2" />
                  Ersten Eintrag erstellen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Letzte Aktivität */}
      {!isLoading && statistik && statistik.letzteAktivität && (
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">📅 Letzte Aktivität</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-muted-foreground">
              {format(statistik.letzteAktivität, 'EEEE, d. MMMM yyyy', { locale: de })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Backup & Export */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            Datensicherung
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Sichern Sie Ihre Daten regelmäßig
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:flex sm:flex-row gap-3">
            <Button onClick={handleExport} variant="outline" className="flex items-center justify-center gap-2 h-12 sm:h-auto">
              <Download className="h-4 w-4" />
              Daten exportieren
            </Button>
            <Button asChild variant="outline" className="flex items-center justify-center gap-2 h-12 sm:h-auto">
              <Link href="/schiessnachweis/pdf-export">
                <FileText className="h-4 w-4" />
                PDF für Behörden
              </Link>
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-3">
            Tipp: Speichern Sie Backups in Google Drive oder iCloud für zusätzliche Sicherheit
          </p>
        </CardContent>
      </Card>

      {/* Premium-Teaser für v2.0 */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2 text-base sm:text-lg">
            💎 Premium-Features (Coming in v2.0)
          </CardTitle>
          <CardDescription className="text-purple-700 dark:text-purple-300 text-sm sm:text-base">
            Erweiterte Funktionen für noch mehr Komfort
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 text-sm sm:text-base">🆓 Aktuell kostenlos:</h4>
              <ul className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>✅ Offline-Speicherung</li>
                <li>✅ Backup-Export</li>
                <li>✅ PDF für Behörden</li>
                <li>✅ Basis-Statistiken</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm sm:text-base">💎 Premium (~2€/Monat):</h4>
              <ul className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>🔄 Cloud-Synchronisation</li>
                <li>📱 Multi-Gerät-Zugang</li>
                <li>📊 Erweiterte Statistiken</li>
                <li>🎯 RWK-Integration</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Badge variant="secondary" className="text-xs sm:text-sm">Coming in Version 2.0</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}