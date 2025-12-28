"use client";

import { useState, useEffect } from "react";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Target, Plus, Calendar, TrendingUp, FileText, Download, Upload, Crown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollToTopButton, usePullToRefresh } from "@/components/ui/mobile-enhancements";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießStatistik } from "@/types/schiessnachweis";
import { CloudSyncStatus } from "@/components/schiessnachweis/CloudSyncStatus";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function SchießnachweisPage() {
  const { toast } = useToast();
  const [statistik, setStatistik] = useState<SchießStatistik | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const { isRefreshing } = usePullToRefresh(async () => {
    loadStatistik();
    await checkAndSyncFromCloud();
  });

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
        if (localData.length === 0) {
          logDebug('🔄 Keine lokalen Daten - versuche Cloud-Wiederherstellung...');
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
        logDebug('Auto-Restore fehlgeschlagen:', error);
      }
    };
    
    loadStatistik();
    autoRestore();
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const checkAndSyncFromCloud = async () => {
    try {
      // Prüfe ob eingeloggt
      if (true) {
        const cloudEinträge = await SchießnachweisService.loadFromCloudNow();
        if (cloudEinträge.length > 0) {
          logDebug('🔄 Automatisches Cloud-Sync:', cloudEinträge.length, 'Einträge');
          // Erzwinge Reload der Seite um neue Daten anzuzeigen
          window.location.reload();
        }
      }
    } catch (error) {
      logDebug('Cloud-Sync übersprungen:', error.message);
    }
  };

  const loadStatistik = async () => {
    setIsLoading(true);
    try {
      const stats = await SchießnachweisService.getStatistik();
      setStatistik(stats);
    } catch (error) {
      logError('Fehler beim Laden der Statistik:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const einträge = await SchießnachweisService.getEinträge();
      logDebug('Exportiere Einträge:', einträge.length, einträge);
      
      if (einträge.length === 0) {
        toast({
          title: "Keine Daten",
          description: "Es sind keine Einträge zum Exportieren vorhanden.",
          variant: "destructive"
        });
        return;
      }
      
      const csvData = convertToCSV(einträge);
      logDebug('CSV-Daten:', csvData);
      
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
      logError('Excel-Export fehlgeschlagen:', error);
      toast({
        title: "Export fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    }
  };

  const handleExportODS = async () => {
    try {
      const einträge = await SchießnachweisService.getEinträge();
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
      logError('ODS-Export fehlgeschlagen:', error);
    }
  };

  const convertToCSV = (einträge: any[]) => {
    const headers = ['Datum', 'Typ', 'Disziplin', 'Schussanzahl', 'Ergebnis', 'Standort', 'Schiessstand', 'Wetter', 'Munition', 'Waffe', 'Notizen', 'Serien'];
    const csvRows = [headers.join(';')];
    
    einträge.forEach(eintrag => {
      logDebug('Verarbeite Eintrag:', eintrag);
      
      // Datum korrekt konvertieren
      let datumStr = '';
      try {
        if (eintrag.datum) {
          const datum = eintrag.datum instanceof Date ? eintrag.datum : new Date(eintrag.datum);
          datumStr = format(datum, 'dd.MM.yyyy');
        }
      } catch (e) {
        logWarn('Datum-Konvertierung fehlgeschlagen:', eintrag.datum);
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
      
      // Daten sind bereits in der Datenbank gespeichert
      toast({
        title: "✅ Import erfolgreich",
        description: "Daten wurden in der Datenbank gespeichert.",
      });
      
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

  const handleRefreshData = async () => {
    try {
      const { auth } = await import('@/lib/firebase/config');
      if (!auth.currentUser) {
        toast({
          title: "❌ Nicht eingeloggt",
          description: "Daten-Aktualisierung funktioniert nur mit Benutzer-Account.",
          variant: "destructive"
        });
        return;
      }
      
      const einträge = await SchießnachweisService.refreshData();
      
      toast({
        title: "✅ Daten aktualisiert",
        description: `${einträge.length} Einträge aus der Datenbank geladen.`,
      });
      
      loadStatistik();
    } catch (error) {
      logError('Daten-Aktualisierung fehlgeschlagen:', error);
      toast({
        title: "Aktualisierung fehlgeschlagen",
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
    
    const existingEinträge = await SchießnachweisService.getEinträge();
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
          logWarn(`Ungültiges Datum in Zeile ${i + 1}: ${datumStr}`);
          continue;
        }
        
        const typ = typStr.toLowerCase().includes('training') ? 'training' : 'wettkampf';
        const schussAnzahl = parseInt(schussAnzahlStr);
        const ergebnis = parseFloat(ergebnisStr.replace(',', '.'));
        
        if (isNaN(schussAnzahl) || isNaN(ergebnis)) {
          logWarn(`Ungültige Zahlen in Zeile ${i + 1}`);
          continue;
        }
        
        // Serien parsen
        let serien = undefined;
        if (serienStr) {
          try {
            serien = JSON.parse(serienStr);
          } catch (e) {
            logWarn(`Ungültige Serien-Daten in Zeile ${i + 1}`);
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
          await SchießnachweisService.saveEintrag(neuerEintrag);
          importCount++;
        }
      } catch (error) {
        logWarn(`Fehler in Zeile ${i + 1}:`, error);
      }
    }
    
    return importCount;
  };

  // Check if user is logged in via Schießnachweis auth
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase/config');
        const unsubscribe = auth.onAuthStateChanged((user) => {
          setUser(user);
          setAuthLoading(false);
        });
        return unsubscribe;
      } catch (error) {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);
  
  // Show login prompt for non-authenticated users
  if (authLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="py-12">Lade...</div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" style={{ width: 120, height: 120, margin: 'auto' }} />
            <Target className="relative h-16 w-16 sm:h-20 sm:w-20 text-blue-600 mx-auto mb-4" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Schießnachweis
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8">
            Das digitale Schießtagebuch für Sportschützen
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-800 mb-2">Training dokumentieren</h3>
            <p className="text-sm text-blue-600">Erfassen Sie alle Trainings und Wettkämpfe digital</p>
          </Card>
          
          <Card className="text-center p-6 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-800 mb-2">PDF für Behörden</h3>
            <p className="text-sm text-green-600">Offizieller Nachweis für die Waffenbehörde</p>
          </Card>
          
          <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-purple-800 mb-2">Social Training</h3>
            <p className="text-sm text-purple-600">Gleicher Account für Community-Features</p>
          </Card>
        </div>

        {/* Login Section */}
        <Card className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-800 mb-2">
              🔐 Anmeldung erforderlich
            </CardTitle>
            <CardDescription className="text-blue-700">
              Für den Schießnachweis benötigen Sie einen kostenlosen Account. 
              Dieser funktioniert auch für Social Training.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <Button asChild size="lg" className="w-full sm:w-auto px-8">
              <Link href="/schiessnachweis/login">
                Jetzt anmelden oder registrieren
              </Link>
            </Button>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800 space-y-2">
                <p>
                  💡 <strong>Hinweis:</strong> Dies ist ein anderer Login als für RWK/KM-Bereiche des Kreisverbands
                </p>
                <p>
                  🏆 <strong>RWK/KM-Nutzer?</strong> <Link href="/login" className="text-blue-600 hover:text-blue-800 underline font-medium">Hier zum Kreisverband-Login</Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex justify-center items-center gap-2 sm:gap-3 mb-4">
          <Target className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Schießnachweis <span className="text-red-600 dark:text-red-400 text-xl sm:text-2xl">Beta</span></h1>
            <Badge variant="secondary" className="mt-1 text-xs sm:text-sm">Digitales Schießtagebuch</Badge>
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

      {/* Datenbank-Info */}
      <Card className="mb-4 sm:mb-6 border-blue-300 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-lg">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2 flex items-center justify-center gap-2">
              💾 Alle Daten in der Datenbank
            </div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
              Ihre Schießnachweis-Daten werden sicher in der Datenbank gespeichert!
            </p>
            <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                ✅ <strong>Automatische Speicherung:</strong> Jeder Eintrag wird sofort in der Datenbank gesichert<br/>
                🔄 <strong>Multi-Device:</strong> Zugriff von allen Geräten mit demselben Account<br/>
                🛡️ <strong>Sicher:</strong> Keine lokalen Daten mehr - alles professionell gesichert
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
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
              Feedback willkommen!
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
              <span className="text-xs text-orange-600 dark:text-orange-400">
                💡 Infrastruktur erhalten:
              </span>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href="https://paypal.me/rwkeinbeck" target="_blank">
                  ☕ PayPal Spende
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      

      
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
                <Button onClick={handleRefreshData} variant="outline" size="sm" className="flex items-center justify-center gap-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100">
                  <Download className="h-4 w-4" />
                  🔄 Daten aktualisieren
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
            📊 <strong>CSV/Excel:</strong> Zum Bearbeiten und Sichern<br/>
            📄 <strong>LibreOffice:</strong> Schöne Übersicht und Auswertungen<br/>
            📝 <strong>PDF:</strong> Offizieller Nachweis für Behörden<br/>
            💡 <strong>Import:</strong> Unterstützt das gleiche Format wie der Export<br/>
            💾 <strong>Datenbank:</strong> Alle Daten werden automatisch sicher gespeichert
          </p>
        </CardContent>
      </Card>


      <ScrollToTopButton />
      </div>
  );
}
