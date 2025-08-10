"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Upload, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MigrationPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(1);

  const handleValidation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/migration/validate');
      const data = await response.json();
      setResult(data);
      toast({ 
        title: '🔍 Validierung abgeschlossen', 
        description: data.message 
      });
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: 'Validierung fehlgeschlagen', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('⚠️ ACHTUNG: Dies löscht ALLE Schützen unwiderruflich!\n\nNur nach RWK-Abschluss ausführen!\n\nFortfahren?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/migration/shooters-cleanup', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        setStep(2);
        toast({ 
          title: '🧹 Bereinigung erfolgreich', 
          description: data.message 
        });
      } else {
        toast({ 
          title: 'Fehler', 
          description: data.error, 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: 'Verbindungsfehler', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({ 
        title: 'Fehler', 
        description: 'Bitte Excel-Datei auswählen', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/migration/excel-import', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        setStep(3);
        toast({ 
          title: '📊 Import erfolgreich', 
          description: data.message 
        });
      } else {
        toast({ 
          title: 'Fehler', 
          description: data.error, 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Fehler', 
        description: 'Import fehlgeschlagen', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔄 Schützen-Migration</h1>
        <p className="text-muted-foreground">
          Komplette Bereinigung und Neu-Import aller Schützen
        </p>
      </div>

      <Alert className="mb-6 border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="font-medium">
          ⚠️ NUR NACH RWK-ABSCHLUSS AUSFÜHREN! Diese Aktion löscht alle bestehenden Schützen unwiderruflich.
        </AlertDescription>
      </Alert>

      {/* Schritt 1: Bereinigung */}
      <Card className={`mb-6 ${step >= 2 ? 'border-green-500 bg-green-50' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step >= 2 ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Trash2 className="h-5 w-5" />}
            Schritt 1: Daten-Bereinigung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Löscht alle bestehenden Schützen aus shooters und km_shooters</p>
          <Button 
            onClick={handleCleanup} 
            disabled={loading || step >= 2}
            variant={step >= 2 ? "outline" : "destructive"}
          >
            {step >= 2 ? '✅ Bereinigung abgeschlossen' : '🧹 Alle Schützen löschen'}
          </Button>
        </CardContent>
      </Card>

      {/* Schritt 2: Excel-Import */}
      <Card className={`mb-6 ${step >= 3 ? 'border-green-500 bg-green-50' : step === 2 ? 'border-blue-500' : 'opacity-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step >= 3 ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Upload className="h-5 w-5" />}
            Schritt 2: Excel-Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="mb-2">Excel-Format:</p>
            <div className="text-sm bg-gray-100 p-3 rounded font-mono">
              A1: Mitgliedsnummer (wird mit 0 aufgefüllt)<br/>
              B1: Verein<br/>
              C1: Akad. Titel<br/>
              D1: Name (Nachname)<br/>
              E1: Vorname<br/>
              F1: Nachsatz<br/>
              G1: Geburtsdatum
            </div>
          </div>
          
          <div className="space-y-4">
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={(e) => setFile(e.target.files[0])}
              disabled={step < 2 || step >= 3}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <Button 
              onClick={handleImport} 
              disabled={loading || !file || step < 2 || step >= 3}
              variant={step >= 3 ? "outline" : "default"}
            >
              {step >= 3 ? '✅ Import abgeschlossen' : '📊 Excel importieren'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schritt 3: Validierung */}
      <Card className={step >= 3 ? 'border-green-500 bg-green-50' : 'opacity-50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Schritt 3: Validierung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Automatische Validierung und manuelle Prüfung:</p>
          {step >= 3 && (
            <div className="space-y-4">
              <Button 
                onClick={async () => {
                  setLoading(true);
                  try {
                    const response = await fetch('/api/migration/validate');
                    const data = await response.json();
                    setResult(data);
                    toast({ title: '🔍 Validierung abgeschlossen', description: data.message });
                  } catch (error) {
                    toast({ title: 'Fehler', description: 'Validierung fehlgeschlagen', variant: 'destructive' });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full"
              >
                🔍 System validieren
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href="/admin/shooters" target="_blank">🎯 Schützen prüfen</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href="/verein/schuetzen" target="_blank">🏢 Vereinsansicht</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href="/rwk-tabellen" target="_blank">📊 RWK-Tabellen</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href="/km/meldungen" target="_blank">📝 KM-Meldungen</a>
                </Button>
              </div>
            </div>
          )}
          {step < 3 && (
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Alle Schützen korrekt importiert</li>
              <li>Vereinszuordnungen stimmen</li>
              <li>RWK-Tabellen funktionieren</li>
              <li>KM-Meldungen funktionieren</li>
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Ergebnis-Anzeige */}
      {result && (
        <Card className="mt-6 bg-blue-50 border-blue-500">
          <CardHeader>
            <CardTitle>📊 Ergebnis</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-white p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}