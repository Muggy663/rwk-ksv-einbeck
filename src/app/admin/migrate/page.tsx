"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, ArrowRight, Database } from 'lucide-react';

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigration = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      setError(null);

      const response = await fetch('/api/migrate', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler bei der Migration');
      }

      setResult({
        success: true,
        message: data.message
      });
    } catch (err: any) {
      setError(err.message || 'Ein unbekannter Fehler ist aufgetreten');
      setResult({
        success: false,
        message: 'Migration fehlgeschlagen'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Daten-Migration</h1>
          <p className="text-muted-foreground">Migrieren Sie Ihre Dokumente von JSON zu MongoDB</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Migration zu MongoDB
          </CardTitle>
          <CardDescription>
            Diese Funktion migriert alle Dokumente aus der JSON-Datei zu MongoDB. 
            Bestehende Dokumente in MongoDB werden überschrieben.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Vor der Migration:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Stellen Sie sicher, dass Ihre MongoDB-Verbindung korrekt konfiguriert ist</li>
              <li>Erstellen Sie ein Backup Ihrer Daten, falls erforderlich</li>
              <li>Diese Aktion kann nicht rückgängig gemacht werden</li>
            </ul>
          </div>

          {result && (
            <Alert variant={result.success ? "success" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? 'Erfolg' : 'Fehler'}</AlertTitle>
              <AlertDescription>
                {result.message}
                {error && <div className="mt-2 text-sm">{error}</div>}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleMigration} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? 'Migration läuft...' : 'Migration starten'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}