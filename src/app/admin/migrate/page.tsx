"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, AlertTriangle, CheckCircle } from 'lucide-react';

export default function MigratePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runMigration = async () => {
    // Sicherheitscheck
    if (window.location.hostname !== 'localhost') {
      setError('Migration nur auf localhost erlaubt!');
      return;
    }

    setIsRunning(true);
    setLogs([]);
    setError(null);
    setIsComplete(false);

    try {
      addLog('🚀 Starte Migration...');
      
      // Dynamic import der Migration
      const { migrateRWKScores } = await import('@/scripts/migrate-rwk-scores');
      
      // Override console.log für Live-Updates
      const originalLog = console.log;
      console.log = (...args) => {
        addLog(args.join(' '));
        originalLog(...args);
      };

      await migrateRWKScores();
      
      // Restore console.log
      console.log = originalLog;
      
      setIsComplete(true);
      addLog('✅ Migration erfolgreich abgeschlossen!');
      
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler');
      addLog(`❌ Fehler: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">RWK Scores Migration</h1>
        <p className="text-muted-foreground">
          Kopiert bestehende rwk_scores in saison-spezifische Collections
        </p>
      </div>

      <div className="space-y-6">
        {/* Sicherheitswarnung */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Nur auf localhost:</strong> Diese Migration funktioniert nur in der lokalen Entwicklungsumgebung.
            Original-Daten bleiben als Backup erhalten.
          </AlertDescription>
        </Alert>

        {/* Migration Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Migration Details
            </CardTitle>
            <CardDescription>
              Was passiert bei der Migration?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>• Liest alle Einträge aus <code>rwk_scores</code></div>
              <div>• Gruppiert nach <code>seasonId</code></div>
              <div>• Erstellt neue Collections: <code>rwk_scores_[seasonId]</code></div>
              <div>• Kopiert Daten (Original bleibt unverändert)</div>
              <div>• Beispiel: <code>rwk_scores_HlFSjhrBOaYa782Jdjir</code></div>
            </div>
          </CardContent>
        </Card>

        {/* Migration Button */}
        <Card>
          <CardHeader>
            <CardTitle>Migration starten</CardTitle>
            <CardDescription>
              Klicken Sie auf den Button um die Migration zu starten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runMigration} 
              disabled={isRunning || window.location.hostname !== 'localhost'}
              className="w-full"
            >
              {isRunning ? 'Migration läuft...' : 'Migration starten'}
            </Button>
            
            {window.location.hostname !== 'localhost' && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Migration nur auf localhost verfügbar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {isComplete && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Migration erfolgreich abgeschlossen! Die neuen Collections sind bereit.
            </AlertDescription>
          </Alert>
        )}

        {/* Live Logs */}
        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Migration Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}