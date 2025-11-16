"use client";

import { useState, useEffect } from "react";
import { Target, Plus, Calendar, TrendingUp, FileText, Download, Upload, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { PremiumService } from "@/lib/services/premium-service";
import { SchießStatistik } from "@/types/schiessnachweis";
import { CloudSyncStatus } from "@/components/schiessnachweis/CloudSyncStatus";
import { PremiumProvider } from "@/components/schiessnachweis/PremiumProvider";
import { PremiumStatus } from "@/components/schiessnachweis/PremiumStatus";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function SchießnachweisPage() {
  const { toast } = useToast();
  const [statistik, setStatistik] = useState<SchießStatistik | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Mobile Detection
    const checkMobile = () => {
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Automatische Datenwiederherstellung für Premium-Nutzer
    const autoRestore = async () => {
      try {
        const localData = SchießnachweisService.getEinträge();
        if (localData.length === 0 && await PremiumService.isPremium()) {
          console.log('🔄 Keine lokalen Daten - versuche Cloud-Wiederherstellung...');
          const cloudData = await SchießnachweisService.loadFromCloudNow();
          if (cloudData.length > 0) {
            toast({
              title: "☁️ Daten wiederhergestellt",
              description: `${cloudData.length} Einträge aus der Cloud geladen.`,
              className: "border-green-500 bg-green-50"
            });
            loadStatistik();
          }
        }
      } catch (error) {
        console.log('Auto-Restore fehlgeschlagen:', error);
      }
    };
    
    loadStatistik();
    autoRestore();
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const checkAndSyncFromCloud = async () => {
    try {
      // Prüfe ob Premium und eingeloggt
      if (await PremiumService.isPremium()) {
        const cloudEinträge = await SchießnachweisService.loadFromCloudNow();
        if (cloudEinträge.length > 0) {
          console.log('🔄 Automatisches Cloud-Sync:', cloudEinträge.length, 'Einträge');
          // Erzwinge Reload der Seite um neue Daten anzuzeigen
          window.location.reload();
        }
      }
    } catch (error) {
      console.log('Cloud-Sync übersprungen:', error.message);
    }
  };

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
      console.log('Exportiere Einträge:', einträge.length, einträge);
      
      if (einträge.length === 0) {
        toast({
          title: "Keine Daten",
          description: "Es sind keine Einträge zum Exportieren vorhanden.",
          variant: "destructive"
        });
        return;
      }
      
      const csvData = convertToCSV(einträge);
      console.log('CSV-Daten:', csvData);
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schiessnachweis_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export erfolgreich",
        description: `${einträge.length} Einträge exportiert.`,
      });
    } catch (error) {
      console.error('Excel-Export fehlgeschlagen:', error);
      toast({
        title: "Export fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
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
    const headers = ['Datum', 'Typ', 'Disziplin', 'Schussanzahl', 'Ergebnis', 'Standort', 'Schiessstand', 'Wetter', 'Munition', 'Waffe', 'Notizen', 'Serien'];
    const csvRows = [headers.join(';')];
    
    einträge.forEach(eintrag => {
      console.log('Verarbeite Eintrag:', eintrag);
      
      // Datum korrekt konvertieren
      let datumStr = '';
      try {
        if (eintrag.datum) {
          const datum = eintrag.datum instanceof Date ? eintrag.datum : new Date(eintrag.datum);
          datumStr = format(datum, 'dd.MM.yyyy');
        }
      } catch (e) {
        console.warn('Datum-Konvertierung fehlgeschlagen:', eintrag.datum);
        datumStr = 'Ungültiges Datum';
      }
      
      const serienData = eintrag.serien ? JSON.stringify(eintrag.serien) : '';
      const row = [
        datumStr,
        eintrag.typ === 'training' ? 'Training' : 'Wettkampf',
        eintrag.disziplin || '',
        eintrag.schussAnzahl || 0,
        eintrag.ergebnis || 0,
        eintrag.standort || '',
        eintrag.schiessstand || '',
        eintrag.wetter || '',
        eintrag.munition || '',
        eintrag.waffe || '',
        eintrag.notizen || '',
        serienData
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
      
      // Automatisch in Cloud synchronisieren
      try {
        const einträge = SchießnachweisService.getEinträge();
        await SchießnachweisService.syncToCloud();
        toast({
          title: "☁️ Cloud-Sync erfolgreich",
          description: "Daten wurden automatisch in die Cloud gesichert.",
        });
      } catch (error) {
        toast({
          title: "⚠️ Cloud-Sync Info",
          description: "Import erfolgreich. Cloud-Sync später verfügbar.",
        });
      }
      
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

  const handleCloudSync = async () => {
    try {
      const { auth } = await import('@/lib/firebase/config');
      if (!auth.currentUser) {
        toast({
          title: "❌ Nicht eingeloggt",
          description: "Cloud-Sync funktioniert nur mit Benutzer-Account. Bitte über 'Verein' einloggen.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('🔍 Debug - User ID:', auth.currentUser.uid);
      console.log('🔍 Debug - User Email:', auth.currentUser.email);
      
      addDebugInfo(`Lade Cloud-Daten für ${auth.currentUser.email}`);
      const cloudEinträge = await SchießnachweisService.loadFromCloudNow();
      
      if (cloudEinträge.length > 0) {
        addDebugInfo(`✅ ${cloudEinträge.length} Einträge aus Cloud geladen`);
        localStorage.setItem('rwk_schiessnachweis', JSON.stringify(cloudEinträge));
        localStorage.setItem('rwk_schiessnachweis_backup', JSON.stringify(cloudEinträge));
        
        toast({
          title: "✅ Cloud-Daten geladen",
          description: `${cloudEinträge.length} Einträge aus der Cloud übernommen.`,
        });
        
        window.location.reload();
      } else {
        addDebugInfo(`❌ Keine Cloud-Daten für ${auth.currentUser.email}`);
        toast({
          title: "💭 Keine Cloud-Daten",
          description: `Keine Daten für User ${auth.currentUser.email} gefunden. Erste Nutzung?`,
        });
      }
    } catch (error) {
      console.error('Cloud-Sync Fehler:', error);
      toast({
        title: "Cloud-Sync fehlgeschlagen",
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
    const requiredHeaders = ['Datum', 'Typ', 'Disziplin', 'Schussanzahl', 'Ergebnis'];
    
    if (!requiredHeaders.every(h => header.includes(h))) {
      throw new Error('CSV-Format ungültig. Mindestens erforderlich: Datum;Typ;Disziplin;Schussanzahl;Ergebnis');
    }
    
    const existingEinträge = SchießnachweisService.getEinträge();
    let importCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      if (values.length < 5) continue;
      
      try {
        const datumStr = values[header.indexOf('Datum')];
        const typStr = values[header.indexOf('Typ')];
        const disziplin = values[header.indexOf('Disziplin')];
        const schussAnzahlStr = values[header.indexOf('Schussanzahl')];
        const ergebnisStr = values[header.indexOf('Ergebnis')];
        const standort = values[header.indexOf('Standort')] || 'Unbekannt';
        const schiessstand = values[header.indexOf('Schiessstand')] || '';
        const wetter = values[header.indexOf('Wetter')] || '';
        const munition = values[header.indexOf('Munition')] || '';
        const waffe = values[header.indexOf('Waffe')] || '';
        const notizen = values[header.indexOf('Notizen')] || values[header.indexOf('Bemerkung')] || '';
        const serienStr = values[header.indexOf('Serien')] || '';
        
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
        
        // Serien parsen
        let serien = undefined;
        if (serienStr) {
          try {
            serien = JSON.parse(serienStr);
          } catch (e) {
            console.warn(`Ungültige Serien-Daten in Zeile ${i + 1}`);
          }
        }
        
        // Duplikat-Check
        const exists = existingEinträge.some(existing => 
          Math.abs(existing.datum.getTime() - datum.getTime()) < 24 * 60 * 60 * 1000 && // Gleicher Tag
          existing.disziplin === disziplin &&
          existing.ergebnis === ergebnis
        );
        
        if (!exists) {
          const neuerEintrag = {
            datum,
            typ: typ as 'training' | 'wettkampf',
            disziplin,
            schussAnzahl,
            ergebnis,
            standort,
            schiessstand,
            wetter,
            munition,
            waffe,
            notizen: notizen.trim(),
            serien
          };
          SchießnachweisService.saveEintrag(neuerEintrag);
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
            <h1 className="text-2xl sm:text-3xl font-bold">Schießnachweis <span className="text-red-600 dark:text-red-400 text-xl sm:text-2xl">Beta</span></h1>
            <Badge variant="secondary" className="mt-1 text-xs sm:text-sm">Kostenlos nutzbar - Premium-Features in Testphase</Badge>
          </div>
        </div>
        
        <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-2">
          Das digitale Schießtagebuch für Sportschützen
        </p>
      </div>

      {/* Schnellaktionen */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 sm:justify-center">
        <Button asChild size="lg" className="flex items-center justify-center gap-2 h-12">
          <Link href="/schiessnachweis/neuer-eintrag">
            <Plus className="h-5 w-5" />
            Neuer Eintrag
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-2 h-12">
          <Link href="/schiessnachweis/eintraege">
            <Calendar className="h-5 w-5" />
            Alle Einträge
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-2 h-12">
          <Link href="/schiessnachweis/statistiken">
            <TrendingUp className="h-5 w-5" />
            Statistiken
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-2 h-12 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 dark:from-yellow-950/20 dark:to-orange-950/20">
          <Link href="/schiessnachweis/premium">
            <Crown className="h-5 w-5 text-yellow-600" />
            Premium (Testphase)
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

      {/* Safari Cloud-Sync Warnung - SEHR SICHTBAR */}
      <Card className="mb-4 sm:mb-6 border-red-300 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-950/30 dark:to-orange-950/30 shadow-lg">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-xl font-bold text-red-800 dark:text-red-200 mb-2 flex items-center justify-center gap-2">
              🍎 Safari Nutzer - WICHTIG!
            </div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
              Safari blockiert automatische Cloud-Synchronisation!
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mb-3">
              <strong>1. Einloggen:</strong> Über "Verein" anmelden • <strong>2. Beim Start:</strong> "☁️ Aus Cloud laden" • <strong>3. Nach Einträgen:</strong> "☁️ In Cloud sichern"
            </p>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-700">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                ❗ <strong>Wichtig:</strong> Cloud-Sync funktioniert nur mit Benutzer-Account!<br/>
                💡 <strong>Besser:</strong> Chrome oder Firefox verwenden - dort funktioniert Auto-Sync zuverlässig
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testphase Banner */}
      <Card className="mb-4 sm:mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-lg font-bold text-orange-800 dark:text-orange-200 mb-1">🚧 Testphase</div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Premium-Features sind aktuell kostenlos verfügbar. Feedback willkommen!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel für App-Nutzer */}
      {debugInfo.length > 0 && (
        <Card className="mb-4 sm:mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-800 dark:text-yellow-200">🔧 Debug-Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {debugInfo.map((info, i) => (
                <div key={i} className="text-xs font-mono text-yellow-700 dark:text-yellow-300">
                  {info}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Premium & Cloud-Sync Status */}
      <PremiumStatus className="mb-4 sm:mb-6" />
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
                <Button 
                  onClick={handleExportExcel} 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-2"
                  disabled={isMobile}
                >
                  <Download className="h-4 w-4" />
                  Excel (.csv) {isMobile && '(Desktop)'}
                </Button>
                <Button 
                  onClick={handleExportODS} 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-2"
                  disabled={isMobile}
                >
                  <FileText className="h-4 w-4" />
                  LibreOffice (.ods) {isMobile && '(Desktop)'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">📥 Import</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={() => document.getElementById('csv-import')?.click()} 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-2"
                  disabled={isMobile}
                >
                  <Upload className="h-4 w-4" />
                  CSV/Excel importieren {isMobile && '(Desktop)'}
                </Button>
                <Button onClick={handleCloudSync} variant="outline" size="sm" className="flex items-center justify-center gap-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100">
                  <Download className="h-4 w-4" />
                  ☁️ Aus Cloud laden
                </Button>
                <Button onClick={async () => {
                  try {
                    const { auth } = await import('@/lib/firebase/config');
                    if (!auth.currentUser) {
                      toast({
                        title: "❌ Nicht eingeloggt",
                        description: "Cloud-Sync funktioniert nur mit Benutzer-Account. Bitte über 'Verein' einloggen.",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    const einträge = SchießnachweisService.getEinträge();
                    console.log('🔍 Debug - Speichere Einträge:', einträge.length);
                    console.log('🔍 Debug - User ID:', auth.currentUser.uid);
                    
                    await SchießnachweisService.syncToCloud();
                    toast({ 
                      title: "✅ Gesichert", 
                      description: `${einträge.length} Einträge für ${auth.currentUser.email} in Cloud gespeichert` 
                    });
                  } catch (error) {
                    console.error('🔴 Sync-Fehler:', error);
                    toast({
                      title: "Fehler",
                      description: error instanceof Error ? error.message : "Unbekannter Fehler",
                      variant: "destructive"
                    });
                  }
                }} variant="outline" size="sm" className="flex items-center justify-center gap-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100">
                  <Upload className="h-4 w-4" />
                  ☁️ In Cloud sichern
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
            <Button 
              asChild={!isMobile} 
              variant="outline" 
              className="flex items-center justify-center gap-2 h-10"
              disabled={isMobile}
              onClick={isMobile ? undefined : undefined}
            >
              {isMobile ? (
                <span>
                  <FileText className="h-4 w-4" />
                  PDF für Behörden (Desktop)
                </span>
              ) : (
                <Link href="/schiessnachweis/pdf-export">
                  <FileText className="h-4 w-4" />
                  PDF für Behörden
                </Link>
              )}
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-3">
            📊 <strong>CSV/Excel:</strong> Zum Bearbeiten, Sichern und Wiederherstellen<br/>
            📄 <strong>LibreOffice:</strong> Schöne Übersicht und Auswertungen<br/>
            📝 <strong>PDF:</strong> Offizieller Nachweis für Behörden<br/>
            💡 <strong>Import:</strong> Unterstützt das gleiche Format wie der Export<br/>
            ☁️ <strong>Cloud-Sync:</strong> Automatisch bei Premium-Nutzern
          </p>
        </CardContent>
      </Card>


      </div>
    </PremiumProvider>
  );
}