"use client";

import { useState } from "react";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function GroupCleanupPanel() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{
    warned: number;
    archived: number;
  } | null>(null);

  const runCleanup = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/admin/cleanup-groups', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLastResult({ warned: data.warned, archived: data.archived });
        toast({
          title: "Cleanup erfolgreich",
          description: data.message,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Cleanup konnte nicht ausgeführt werden",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Trainingsgruppen Cleanup
        </CardTitle>
        <CardDescription>
          Automatische Bereinigung inaktiver Trainingsgruppen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Warnung nach 90 Tagen</span>
            </div>
            <p className="text-sm text-yellow-700">
              Gruppen ohne Aktivität erhalten eine Inaktivitäts-Warnung
            </p>
          </div>
          
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Archivierung nach 120 Tagen</span>
            </div>
            <p className="text-sm text-red-700">
              Gruppen werden automatisch deaktiviert und archiviert
            </p>
          </div>
        </div>

        {lastResult && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Letztes Cleanup-Ergebnis:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• {lastResult.warned} Gruppen gewarnt</li>
              <li>• {lastResult.archived} Gruppen archiviert</li>
            </ul>
          </div>
        )}

        <Button 
          onClick={runCleanup} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Cleanup läuft...' : 'Cleanup jetzt ausführen'}
        </Button>
      </CardContent>
    </Card>
  );
}
