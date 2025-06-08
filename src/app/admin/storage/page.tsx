"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Database, HardDrive } from 'lucide-react';

interface StorageInfo {
  rwkEinbeckSizeInMB: number;
  isNearLimit: boolean;
  limit: number;
  threshold: number;
  percentUsed: number;
  error?: string;
}

export default function StoragePage() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkStorage() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/storage-check');
        
        if (!response.ok) {
          throw new Error('Fehler beim Abrufen der Speicherinformationen');
        }
        
        const data = await response.json();
        setStorageInfo(data);
      } catch (err: any) {
        console.error('Fehler beim Prüfen des Speicherplatzes:', err);
        setError(err.message || 'Ein unbekannter Fehler ist aufgetreten');
      } finally {
        setLoading(false);
      }
    }
    
    checkStorage();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Speichernutzung</h1>
          <p className="text-muted-foreground">Überwachen Sie die Nutzung Ihres MongoDB-Speicherplatzes</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            MongoDB-Speichernutzung
          </CardTitle>
          <CardDescription>
            Ihr MongoDB Atlas-Konto hat ein Limit von 512 MB im kostenlosen Tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p>Lade Speicherinformationen...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : storageInfo ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">RWK Einbeck Datenbank</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {storageInfo.rwkEinbeckSizeInMB.toFixed(2)} MB / {storageInfo.limit} MB
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round((storageInfo.rwkEinbeckSizeInMB / storageInfo.limit) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.round((storageInfo.rwkEinbeckSizeInMB / storageInfo.limit) * 100)} 
                    className="h-2 mt-1" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-md flex flex-col items-center">
                  <HardDrive className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-lg font-bold">{storageInfo.rwkEinbeckSizeInMB.toFixed(2)} MB</span>
                  <span className="text-xs text-muted-foreground">Genutzt</span>
                </div>
                <div className="bg-muted p-4 rounded-md flex flex-col items-center">
                  <Database className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-lg font-bold">{(storageInfo.limit - storageInfo.rwkEinbeckSizeInMB).toFixed(2)} MB</span>
                  <span className="text-xs text-muted-foreground">Verfügbar</span>
                </div>
              </div>
              
              {storageInfo.isNearLimit && (
                <Alert variant="warning" className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Warnung: Speicherplatz fast aufgebraucht</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Sie haben {Math.round((storageInfo.rwkEinbeckSizeInMB / storageInfo.limit) * 100)}% Ihres MongoDB-Speicherplatzes verwendet. 
                    Bitte löschen Sie nicht benötigte Daten, um Platz freizugeben.
                  </AlertDescription>
                </Alert>
              )}
              
              {storageInfo.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Fehler bei der Speicherberechnung</AlertTitle>
                  <AlertDescription>{storageInfo.error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <p>Keine Speicherinformationen verfügbar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}