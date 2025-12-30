"use client";

import { useState, useEffect } from "react";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { ArrowLeft, Download, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from "date-fns";

export default function DatensicherungPage() {
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleExportExcel = async () => {
    try {
      const csvData = await SchießnachweisService.exportToCSV();
      
      if (csvData === 'Keine Daten zum Exportieren vorhanden') {
        toast({
          title: "Keine Daten",
          description: "Es sind keine Einträge zum Exportieren vorhanden.",
          variant: "destructive"
        });
        return;
      }
      
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
        description: "CSV-Datei wurde heruntergeladen.",
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

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedCount = await SchießnachweisService.importData(text);
      
      toast({
        title: "✅ Import erfolgreich",
        description: `${importedCount} neue Einträge importiert.`,
      });
      
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
    } catch (error) {
      logError('Daten-Aktualisierung fehlgeschlagen:', error);
      toast({
        title: "Aktualisierung fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
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
        
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold">Datensicherung & Export</h1>
        </div>
        <p className="text-muted-foreground">
          Sichern Sie Ihre Daten regelmäßig und exportieren Sie Nachweise
        </p>
      </div>

      <div className="space-y-6">
        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              📤 Export
            </CardTitle>
            <CardDescription>
              Exportieren Sie Ihre Daten für Backup oder externe Nutzung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onClick={handleExportExcel} 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12"
                disabled={isMobile}
              >
                <Download className="h-4 w-4" />
                Excel (.csv) {isMobile && '(Desktop)'}
              </Button>
              <Button 
                asChild={!isMobile} 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12"
                disabled={isMobile}
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
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              📥 Import
            </CardTitle>
            <CardDescription>
              Importieren Sie Daten aus CSV/Excel-Dateien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => document.getElementById('csv-import')?.click()} 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12 w-full"
                disabled={isMobile}
              >
                <Upload className="h-4 w-4" />
                CSV/Excel importieren {isMobile && '(Desktop)'}
              </Button>
              <input
                id="csv-import"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImportCSV}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Datenbank-Synchronisation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              🔄 Datenbank-Synchronisation
            </CardTitle>
            <CardDescription>
              Aktualisieren Sie Ihre lokalen Daten aus der Datenbank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleRefreshData} 
              variant="outline" 
              className="flex items-center justify-center gap-2 h-12 w-full bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
            >
              <Download className="h-4 w-4" />
              🔄 Daten aktualisieren
            </Button>
          </CardContent>
        </Card>

        {/* Informationen */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Informationen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📊 <strong>CSV/Excel:</strong> Zum Bearbeiten und Sichern in Tabellenkalkulationen</p>
              <p>📝 <strong>PDF:</strong> Offizieller Nachweis für Waffenbehörden</p>
              <p>💡 <strong>Import:</strong> Unterstützt das gleiche Format wie der Export</p>
              <p>💾 <strong>Datenbank:</strong> Alle Daten werden automatisch sicher in der Datenbank gespeichert (Multi-Device-Zugriff)</p>
              <p>☕ <strong>Unterstützung:</strong> <Link href="https://paypal.me/marcelbuenger1989" target="_blank" className="text-blue-600 hover:text-blue-800 underline">PayPal Spende</Link> für Infrastruktur</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}