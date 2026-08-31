"use client";

import React, { useState } from 'react';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Upload, FileText, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { David21Service } from '@/lib/services/david21-service';

export default function David21Page() {
  const router = useRouter();
  const [exportData, setExportData] = useState({
    startlisteId: '',
    wettkampfId: '',
    datum: new Date().toISOString().slice(0, 10),
    startzeit: '14:00'
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState({
    saisonId: '',
    disziplinen: [] as string[],
    startlisteId: ''
  });
  const [saisons, setSaisons] = useState<any[]>([]);
  const [disziplinen, setDisziplinen] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [startlisten, setStartlisten] = useState<any[]>([]);
  const [selectedStartliste, setSelectedStartliste] = useState<any>(null);

  React.useEffect(() => {
    const loadStartlisten = async () => {
      try {
        // Lade direkt aus Firebase km_startlisten_v2
        const { getDocs, collection } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        
        const startlistenSnapshot = await getDocs(collection(db, 'km_startlisten_v2'));
        const startlistenData = startlistenSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setStartlisten(startlistenData.sort((a, b) => new Date(b.erstellt?.toDate?.() || b.erstellt) - new Date(a.erstellt?.toDate?.() || a.erstellt)));
      } catch (error) {
        logError('Fehler beim Laden der Startlisten:', error);
      }
    };
    
    const loadSaisons = async () => {
      try {
        const response = await fetch('/api/km/saisons');
        if (response.ok) {
          const data = await response.json();
          setSaisons(data.data || []);
        }
      } catch (error) {
        logError('Fehler beim Laden der Saisons:', error);
      }
    };
    
    const loadDisziplinen = async () => {
      try {
        const response = await fetch('/api/km/disziplinen');
        if (response.ok) {
          const data = await response.json();
          setDisziplinen(data.data?.map((d: any) => d.name) || []);
        }
      } catch (error) {
        logError('Fehler beim Laden der Disziplinen:', error);
      }
    };
    
    loadStartlisten();
    loadSaisons();
    loadDisziplinen();
  }, []);

  React.useEffect(() => {
    if (exportData.startlisteId) {
      const startliste = startlisten.find(s => s.id === exportData.startlisteId);
      if (startliste) {
        setSelectedStartliste(startliste);
        // Auto-generate wettkampfId from startliste
        const datum = startliste.konfiguration?.datum ? new Date(startliste.konfiguration.datum) : new Date();
        const year = datum.getFullYear();
        const month = String(datum.getMonth() + 1).padStart(2, '0');
        const day = String(datum.getDate()).padStart(2, '0');
        setExportData(prev => ({
          ...prev,
          wettkampfId: `KM${year}${month}${day}_${startliste.id.substring(0, 6)}`,
          datum: startliste.konfiguration?.datum || new Date().toISOString().slice(0, 10),
          startzeit: startliste.konfiguration?.startzeit || '09:00'
        }));
      }
    }
  }, [exportData.startlisteId, startlisten]);

  const handleExport = async () => {
    setLoading(true);
    try {
      const exportPayload = {
        startlisteId: exportData.startlisteId,
        wettkampfId: exportData.wettkampfId,
        datum: exportData.datum,
        startzeit: exportData.startzeit
      };

      const response = await fetch('/api/km/david21-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportPayload)
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
      logError('Export Error:', error);
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
      formData.append('saisonId', importData.saisonId);

      const response = await fetch('/api/km/david21-import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Import erfolgreich! ${result.message}`);
        logDebug('Importierte Ergebnisse:', result.ergebnisse);
        logDebug('Statistik:', result.statistik);
      } else {
        alert('Import fehlgeschlagen: ' + result.error);
      }
    } catch (error) {
      logError('Import Error:', error);
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
              <div className="space-y-4">
                <div>
                  <Label htmlFor="startliste">Gespeicherte Startliste auswählen *</Label>
                  <NativeSelect
                    value={exportData.startlisteId}
                    onValueChange={(value) => setExportData({...exportData, startlisteId: value})}
                    placeholder="Startliste wählen"
                    options={startlisten.map(s => {
                      const datum = s.konfiguration?.datum ? new Date(s.konfiguration.datum).toLocaleDateString('de-DE') : 'Kein Datum';
                      const starterCount = s.startliste?.length || 0;
                      const disziplinen = [...new Set(s.startliste?.map((starter: any) => starter.disziplin).filter(Boolean))] || [];
                      const austragungsort = s.konfiguration?.austragungsort || 'Unbekannt';
                      
                      return {
                        value: s.id,
                        label: `${datum} | ${starterCount} Starter | ${disziplinen.slice(0, 2).join(', ')}${disziplinen.length > 2 ? ` +${disziplinen.length - 2}` : ''} | ${austragungsort}`
                      };
                    })}
                  />
                </div>
                {selectedStartliste && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="wettkampfId">Wettkampf-ID</Label>
                      <Input
                        id="wettkampfId"
                        value={exportData.wettkampfId}
                        onChange={(e) => setExportData({...exportData, wettkampfId: e.target.value})}
                        placeholder="Automatisch generiert"
                      />
                    </div>
                    <div>
                      <Label>Starter gefunden</Label>
                      <div className="p-2 bg-gray-50 rounded border">
                        {selectedStartliste.startliste?.length || 0} Starter
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="datum">Wettkampf-Datum (aus Startliste)</Label>
                  <Input
                    id="datum"
                    type="date"
                    value={exportData.datum}
                    readOnly
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="startzeit">Startzeit (aus Startliste)</Label>
                  <Input
                    id="startzeit"
                    type="time"
                    value={exportData.startzeit}
                    readOnly
                    disabled
                    className="bg-gray-50"
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
                disabled={loading || !exportData.startlisteId || !selectedStartliste}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="saisonSelect">Saison auswählen *</Label>
                  <NativeSelect
                    value={importData.saisonId}
                    onValueChange={(value) => setImportData({...importData, saisonId: value})}
                    placeholder="Saison wählen"
                    options={saisons.map(s => ({
                      value: s.id,
                      label: s.name
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="disziplinSelect">Disziplinen auswählen *</Label>
                  <select
                    multiple
                    value={importData.disziplinen}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setImportData({...importData, disziplinen: selected});
                    }}
                    className="w-full p-2 border rounded-md min-h-[100px]"
                  >
                    {disziplinen.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Strg/Cmd + Klick für Mehrfachauswahl</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="startlisteSelect">Startliste (optional)</Label>
                <NativeSelect
                  value={importData.startlisteId}
                  onValueChange={(value) => setImportData({...importData, startlisteId: value})}
                  placeholder="Keine Startliste (automatische Zuordnung)"
                  options={[
                    { value: '', label: 'Keine Startliste (automatische Zuordnung)' },
                    ...startlisten.map(s => {
                      const datum = new Date(s.datum).toLocaleDateString('de-DE');
                      const starterCount = s.startliste?.length || 0;
                      return {
                        value: s.id,
                        label: `${datum} | ${starterCount} Starter`
                      };
                    })
                  ]}
                />
              </div>

              <div>
                <Label htmlFor="resultFile">Ergebnis-Datei (.TXT) *</Label>
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
                disabled={loading || !importFile || !importData.saisonId || importData.disziplinen.length === 0}
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