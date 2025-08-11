"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Upload, FileText, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { David21Service } from '@/lib/services/david21-service';

export default function David21Page() {
  const router = useRouter();
  const [exportData, setExportData] = useState({
    wettkampfId: 'VW111',
    disziplinId: '',
    datum: new Date().toISOString().slice(0, 10),
    startzeit: '14:00'
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // TODO: Hier würdest du die echten Daten aus Firebase laden
      const mockData = {
        ...exportData,
        meldungen: [],
        schuetzen: [],
        vereine: [],
        disziplinen: [{ id: '1', spoNummer: '1.10', name: 'Luftgewehr' }],
        wettkampfklassen: []
      };

      const response = await fetch('/api/km/david21-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Download TXT Datei
        David21Service.downloadFile(
          result.files.txt.content,
          result.files.txt.filename,
          'text/plain'
        );
        
        // Download CTL Datei
        David21Service.downloadFile(
          result.files.ctl.content,
          result.files.ctl.filename,
          'text/plain'
        );
        
        alert(`Export erfolgreich! ${result.teilnehmerAnzahl} Teilnehmer exportiert.`);
      } else {
        alert('Export fehlgeschlagen: ' + result.error);
      }
    } catch (error) {
      console.error('Export Error:', error);
      alert('Export fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Bitte wähle eine Datei aus');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('wettkampfId', exportData.wettkampfId);

      const response = await fetch('/api/km/david21-import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Import erfolgreich! ${result.message}`);
        console.log('Importierte Ergebnisse:', result.ergebnisse);
        console.log('Statistik:', result.statistik);
      } else {
        alert('Import fehlgeschlagen: ' + result.error);
      }
    } catch (error) {
      console.error('Import Error:', error);
      alert('Import fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">🔄 David21 Integration</h1>
          <p className="text-muted-foreground">Export für Meyton Shootmaster & Ergebnis-Import</p>
        </div>
      </div>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            Startlisten Export
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            Ergebnis Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Startlisten für David21/Meyton exportieren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wettkampfId">Wettkampf-ID</Label>
                  <Input
                    id="wettkampfId"
                    value={exportData.wettkampfId}
                    onChange={(e) => setExportData({...exportData, wettkampfId: e.target.value})}
                    placeholder="z.B. VW111"
                  />
                </div>
                <div>
                  <Label htmlFor="disziplin">Disziplin</Label>
                  <Select 
                    value={exportData.disziplinId} 
                    onValueChange={(value) => setExportData({...exportData, disziplinId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Disziplin wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lg">Luftgewehr</SelectItem>
                      <SelectItem value="lp">Luftpistole</SelectItem>
                      <SelectItem value="kkg">KK Gewehr</SelectItem>
                      <SelectItem value="kkp">KK Pistole</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="datum">Wettkampf-Datum</Label>
                  <Input
                    id="datum"
                    type="date"
                    value={exportData.datum}
                    onChange={(e) => setExportData({...exportData, datum: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="startzeit">Startzeit</Label>
                  <Input
                    id="startzeit"
                    type="time"
                    value={exportData.startzeit}
                    onChange={(e) => setExportData({...exportData, startzeit: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Export-Format</h4>
                <p className="text-sm text-blue-800">
                  Generiert zwei Dateien im David21-Format:
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• <strong>.TXT</strong> - Startliste für Meyton Shootmaster</li>
                  <li>• <strong>.CTL</strong> - Control-Datei mit Wettkampf-Infos</li>
                </ul>
              </div>

              <Button 
                onClick={handleExport} 
                disabled={loading || !exportData.disziplinId}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? 'Exportiere...' : 'Startlisten exportieren'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Ergebnisse von David21 importieren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="resultFile">Ergebnis-Datei (.TXT)</Label>
                <Input
                  id="resultFile"
                  type="file"
                  accept=".txt,.TXT"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">📊 Import-Format</h4>
                <p className="text-sm text-green-800">
                  Unterstützte Dateien von David21:
                </p>
                <ul className="text-sm text-green-800 mt-2 space-y-1">
                  <li>• <strong>VMT*.TXT</strong> - Ergebnis-Dateien</li>
                  <li>• Format: StartNr;Name;Vorname;VerNr;Ringe;Zehntel;InnerZehner</li>
                </ul>
              </div>

              <Button 
                onClick={handleImport} 
                disabled={loading || !importFile}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Importiere...' : 'Ergebnisse importieren'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Workflow-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">1️⃣</div>
              <h4 className="font-semibold">Export</h4>
              <p className="text-sm text-muted-foreground">
                Startlisten aus RWK App für David21 exportieren
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl mb-2">2️⃣</div>
              <h4 className="font-semibold">Wettkampf</h4>
              <p className="text-sm text-muted-foreground">
                Dateien in Meyton Shootmaster laden und Wettkampf durchführen
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">3️⃣</div>
              <h4 className="font-semibold">Import</h4>
              <p className="text-sm text-muted-foreground">
                Ergebnisse zurück in RWK App importieren
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}