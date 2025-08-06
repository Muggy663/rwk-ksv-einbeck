"use client";

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Aktuelle App-Version
const CURRENT_APP_VERSION = '0.9.9.6';

export function AppUpdateChecker() {
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  
  useEffect(() => {
    // Prüfe, ob wir in der nativen App sind
    const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();
    
    if (isNativeApp) {
      // Versuche, die installierte Version aus dem localStorage zu lesen
      const storedVersion = localStorage.getItem('app_version');
      
      if (!storedVersion) {
        // Wenn keine Version gespeichert ist, speichere die aktuelle Version
        localStorage.setItem('app_version', CURRENT_APP_VERSION);
      } else if (storedVersion !== CURRENT_APP_VERSION) {
        // Wenn die gespeicherte Version nicht der aktuellen entspricht, zeige Update-Hinweis
        setInstalledVersion(storedVersion);
        setShowUpdateAlert(true);
      }
    }
  }, []);
  
  if (!showUpdateAlert) {
    return null;
  }
  
  return (
    <Alert className="mb-4 border-amber-300 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">App-Update verfügbar</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-2">
          Sie verwenden Version {installedVersion}, aber Version {CURRENT_APP_VERSION} ist verfügbar.
          Bitte aktualisieren Sie die App für verbesserte PDF-Anzeige und Fehlerbehebungen.
        </p>
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
          asChild
        >
          <a href="/app">Update herunterladen</a>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
