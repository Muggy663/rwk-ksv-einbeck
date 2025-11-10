"use client";

import { useState, useEffect } from "react";
import { Target, Plus, Calendar, TrendingUp, FileText, Download, Upload, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießStatistik } from "@/types/schiessnachweis";
import { CloudSyncStatus } from "@/components/schiessnachweis/CloudSyncStatus";
import { PremiumProvider } from "@/components/schiessnachweis/PremiumProvider";
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

  const handleExportExcel = () => {
    try {
      const einträge = SchießnachweisService.getEinträge();
      const csvData = convertToCSV(einträge);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schiessnachweis_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel-Export fehlgeschlagen:', error);
    }
  };

  const handleExportODS = () => {
    try {
      const einträge = SchießnachweisService.getEinträge();
      const odsData = convertToODS(einträge);
      const blob = new Blob([odsData], { type: 'application/vnd.oasis.opendocument.spreadsheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schiessnachweis_${format(new Date(), 'yyyy-MM-dd')}.ods`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('ODS-Export fehlgeschlagen:', error);
    }
  };

  const convertToCSV = (einträge: any[]) => {
    const headers = ['Datum', 'Typ', 'Disziplin', 'Schussanzahl', 'Ergebnis', 'Bemerkung'];
    const csvRows = [headers.join(';')];
    
    einträge.forEach(eintrag => {
      const row = [
        format(eintrag.datum, 'dd.MM.yyyy'),
        eintrag.typ === 'training' ? 'Training' : 'Wettkampf',
        eintrag.disziplin,
        eintrag.schussAnzahl,
        eintrag.ergebnis,
        eintrag.bemerkung || ''
      ];
      csvRows.push(row.join(';'));
    });
    
    return '\uFEFF' + csvRows.join('\n'); // BOM für UTF-8
  };

  const convertToODS = (einträge: any[]) => {
    // Vereinfachte ODS-Struktur (CSV mit .ods Extension)
    const csvData = convertToCSV(einträge);
    return csvData;
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedCount = await importFromCSV(text);
      
      toast({
        title: "✅ Import erfolgreich",
        description: `${importedCount} neue Einträge importiert.`,
      });
      
      // Statistik neu laden
      loadStatistik();
      
      // Input zurücksetzen
      event.target.value = '';
    } catch (error) {
      toast({
        title: "Import fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    }
  };

  const importFromCSV = async (csvText: string): Promise<number> => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV-Datei ist leer oder ungültig');
    
    // Header prüfen
    const header = lines[0].split(';');
    const expectedHeaders = ['Datum', 'Typ', 'Disziplin', 'Schussanzahl', 'Ergebnis', 'Bemerkung'];
    
    if (!expectedHeaders.every(h => header.includes(h))) {
      throw new Error('CSV-Format ungültig. Erwartet: Datum;Typ;Disziplin;Schussanzahl;Ergebnis;Bemerkung');
    }
    
    const existingEinträge = SchießnachweisService.getEinträge();
    let importCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      if (values.length < 5) continue;
      
      try {
        const [datumStr, typStr, disziplin, schussAnzahlStr, ergebnisStr, bemerkung = ''] = values;
        
        // Datum parsen (DD.MM.YYYY)
        const [day, month, year] = datumStr.split('.');
        const datum = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (isNaN(datum.getTime())) {
          console.warn(`Ungültiges Datum in Zeile ${i + 1}: ${datumStr}`);
          continue;
        }
        
        const typ = typStr.toLowerCase().includes('training') ? 'training' : 'wettkampf';
        const schussAnzahl = parseInt(schussAnzahlStr);
        const ergebnis = parseFloat(ergebnisStr.replace(',', '.'));
        
        if (isNaN(schussAnzahl) || isNaN(ergebnis)) {
          console.warn(`Ungültige Zahlen in Zeile ${i + 1}`);
          continue;
        }
        
        // Duplikat-Check
        const exists = existingEinträge.some(existing => 
          Math.abs(existing.datum.getTime() - datum.getTime()) < 24 * 60 * 60 * 1000 && // Gleicher Tag
          existing.disziplin === disziplin &&
          existing.ergebnis === ergebnis
        );
        
        if (!exists) {
          SchießnachweisService.saveEintrag({
            datum,
            typ: typ as 'training' | 'wettkampf',
            disziplin,
            schussAnzahl,
            ergebnis,
            bemerkung: bemerkung.trim()
          });
          importCount++;
        }
      } catch (error) {
        console.warn(`Fehler in Zeile ${i + 1}:`, error);
      }
    }
    
    return importCount;
  };

  return (
    <PremiumProvider>
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
        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-2 h-12 sm:h-auto border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 dark:from-yellow-950/20 dark:to-orange-950/20">
          <Link href="/schiessnachweis/premium">
            <Crown className="h-5 w-5 text-yellow-600" />
            Premium
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

      {/* Cloud-Sync Status */}
      <CloudSyncStatus className="mb-6 sm:mb-8" />
      
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">📤 Export</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={handleExportExcel} variant="outline" size="sm" className="flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" />
                  Excel (.csv)
                </Button>
                <Button onClick={handleExportODS} variant="outline" size="sm" className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  LibreOffice (.ods)
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">📥 Import</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={() => document.getElementById('csv-import')?.click()} variant="outline" size="sm" className="flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  CSV/Excel importieren
                </Button>
                <input
                  id="csv-import"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button asChild variant="outline" className="flex items-center justify-center gap-2 h-10">
              <Link href="/schiessnachweis/pdf-export">
                <FileText className="h-4 w-4" />
                PDF für Behörden
              </Link>
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-3">
            📊 <strong>CSV/Excel:</strong> Zum Bearbeiten, Sichern und Wiederherstellen<br/>
            📄 <strong>LibreOffice:</strong> Schöne Übersicht und Auswertungen<br/>
            📝 <strong>PDF:</strong> Offizieller Nachweis für Behörden<br/>
            💡 <strong>Import:</strong> Unterstützt das gleiche Format wie der Export
          </p>
        </CardContent>
      </Card>


      </div>
    </PremiumProvider>
  );
}