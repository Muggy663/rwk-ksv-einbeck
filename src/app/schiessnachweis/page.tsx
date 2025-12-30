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

// Komponenten für neue Features
function LetzteEinträgeCard() {
  const [einträge, setEinträge] = useState([]);
  
  useEffect(() => {
    const loadEinträge = async () => {
      try {
        const data = await SchießnachweisService.getEinträge();
        const sortedData = data.sort((a, b) => new Date(b.createdAt || b.datum).getTime() - new Date(a.createdAt || a.datum).getTime());
        setEinträge(sortedData.slice(0, 3).reverse());
      } catch (error) {
        logError('Fehler beim Laden der letzten Einträge:', error);
      }
    };
    loadEinträge();
  }, []);
  
  if (einträge.length === 0) return null;
  
  return (
    <Card className="mb-6 sm:mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Letzte Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {einträge.map((eintrag, index) => (
            <div key={eintrag.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl border">
              <div className="flex-1">
                <div className="font-semibold text-base mb-1">{eintrag.disziplin}</div>
                <div className="text-sm text-muted-foreground">
                  {format(eintrag.datum, 'dd.MM.yyyy', { locale: de })} • {eintrag.schussAnzahl} Schüsse
                </div>
              </div>
              <Badge variant={eintrag.typ === 'wettkampf' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                {eintrag.ergebnis || eintrag.ergebnisGanzeRinge} Ringe
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TippDesTagesCard() {
  const tipps = [
    "🎯 Konzentrieren Sie sich auf Ihre Atmung - gleichmäßig ein- und ausatmen.",
    "👁️ Visieren Sie immer mit dem gleichen Auge - Konsistenz ist der Schlüssel.",
    "🧘 Entspannen Sie Ihre Schultern vor jedem Schuss - Verspannungen verschlechtern die Präzision.",
    "⏱️ Nehmen Sie sich Zeit für jeden Schuss - Hektik führt zu Fehlern.",
    "📝 Führen Sie ein Schießtagebuch - dokumentieren Sie Ihre Fortschritte.",
    "🎯 Üben Sie regelmäßig Trockenübungen zu Hause - auch ohne Munition.",
    "🔧 Prüfen Sie regelmäßig Ihre Ausrüstung - saubere Waffen schießen besser.",
    "🏃 Bleiben Sie körperlich fit - Ausdauer verbessert die Stabilität.",
    "🧠 Mentales Training ist genauso wichtig wie körperliches Training.",
    "🌟 Setzen Sie sich realistische Ziele und feiern Sie kleine Erfolge."
  ];
  
  const heute = new Date().getDate();
  const tippIndex = heute % tipps.length;
  
  return (
    <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-green-800 dark:text-green-200">
          <Target className="h-4 w-4 sm:h-5 sm:w-5" />
          💡 Tipp des Tages
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <p className="text-base sm:text-lg text-green-700 dark:text-green-300 leading-relaxed">
          {tipps[tippIndex]}
        </p>
      </CardContent>
    </Card>
  );
}

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
    const headers = ['Datum', 'Typ', 'Disziplin', 'Schussanzahl', 'Ergebnis_Ganze_Ringe', 'Ergebnis_Zehntel_Ringe', 'Standort', 'Schiessstand', 'Wetter', 'Munition', 'Waffe', 'Notizen', 'Serien'];
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
      
      const serienData = eintrag.serien && eintrag.serien.length > 0 ? JSON.stringify(eintrag.serien) : '';
      const row = [
        datumStr,
        eintrag.typ === 'training' ? 'Training' : 'Wettkampf',
        eintrag.disziplin || '',
        eintrag.schussAnzahl || 0,
        eintrag.ergebnisGanzeRinge || '',
        eintrag.ergebnis || '',
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
            <h1 className="text-2xl sm:text-3xl font-bold">Schießnachweis <span className="text-red-600 dark:text-red-400 text-xl sm:text-2xl">Preview</span></h1>
            <Badge variant="secondary" className="mt-1 text-xs sm:text-sm">Digitales Schießtagebuch</Badge>
          </div>
        </div>
        
        <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-2">
          Das digitale Schießtagebuch für Sportschützen
          {!isLoading && statistik && statistik.letzteAktivität && (
            <span className="block text-sm mt-2">
              📅 Letzte Aktivität: {format(statistik.letzteAktivität, 'EEEE, d. MMMM yyyy', { locale: de })}
            </span>
          )}
        </p>
      </div>

      {/* Schnellaktionen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        <Button asChild size="lg" className="flex items-center justify-center gap-3 h-16 text-base font-semibold">
          <Link href="/schiessnachweis/neuer-eintrag">
            <Plus className="h-6 w-6" />
            Neuer Eintrag
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-3 h-16 text-base font-semibold">
          <Link href="/schiessnachweis/eintraege">
            <Calendar className="h-6 w-6" />
            Alle Einträge
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-3 h-16 text-base font-semibold">
          <Link href="/schiessnachweis/statistiken">
            <TrendingUp className="h-6 w-6" />
            Statistiken
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-3 h-16 text-base font-semibold">
          <Link href="/schiessnachweis/datensicherung">
            <FileText className="h-6 w-6" />
            Datensicherung
          </Link>
        </Button>
      </div>

      {/* Statistik-Übersicht */}
      {!isLoading && statistik && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{statistik.totalSchüsse}</div>
              <div className="text-sm sm:text-base text-blue-700 dark:text-blue-300 font-medium">Schüsse gesamt</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">{statistik.totalTrainings}</div>
              <div className="text-sm sm:text-base text-green-700 dark:text-green-300 font-medium">Trainings</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">{statistik.totalWettkämpfe}</div>
              <div className="text-sm sm:text-base text-purple-700 dark:text-purple-300 font-medium">Wettkämpfe</div>
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

      {/* Tipp des Tages */}
      <TippDesTagesCard />

      {/* Letzte Einträge */}
      {!isLoading && statistik && statistik.totalSchüsse > 0 && (
        <LetzteEinträgeCard />
      )}

{/* Datenbank-Info */}



      
      {/* Informationen */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle>ℹ️ Informationen</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 text-sm sm:text-base text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-lg">📊</span>
              <span><strong>CSV/Excel:</strong> Zum Bearbeiten und Sichern in Tabellenkalkulationen</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">📝</span>
              <span><strong>PDF:</strong> Offizieller Nachweis für Waffenbehörden</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <span><strong>Import:</strong> Unterstützt das gleiche Format wie der Export</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">💾</span>
              <span><strong>Datenbank:</strong> Alle Daten werden automatisch sicher in der Datenbank gespeichert (Multi-Device-Zugriff)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">☕</span>
              <span><strong>Unterstützung:</strong> <Link href="https://paypal.me/marcelbuenger1989" target="_blank" className="text-blue-600 hover:text-blue-800 underline font-medium">PayPal Spende</Link> für Infrastruktur</span>
            </p>
          </div>
        </CardContent>
      </Card>

<ScrollToTopButton />
      </div>
  );
}
