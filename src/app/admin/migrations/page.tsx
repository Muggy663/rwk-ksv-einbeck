"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { migrateTeamsForOutOfCompetition } from '@/lib/migrations/team-out-of-competition-migration';

export default function AdminMigrationsPage() {
  const { toast } = useToast();
  const [isRunningMigration, setIsRunningMigration] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success?: boolean;
    message?: string;
    migratedCount?: number;
  } | null>(null);

  const handleRunTeamMigration = async () => {
    setIsRunningMigration(true);
    setMigrationResult(null);
    
    try {
      const result = await migrateTeamsForOutOfCompetition();
      setMigrationResult(result);
      
      if (result.success) {
        toast({
          title: "Migration erfolgreich",
          description: result.message,
          variant: "default"
        });
      } else {
        toast({
          title: "Migration fehlgeschlagen",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Fehler bei der Migration:", error);
      setMigrationResult({
        success: false,
        message: `Unerwarteter Fehler: ${error instanceof Error ? error.message : String(error)}`,
        migratedCount: 0
      });
      
      toast({
        title: "Migration fehlgeschlagen",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsRunningMigration(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">Datenbank-Migrationen</h1>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Außer Konkurrenz Status für Teams</CardTitle>
          <CardDescription>
            Fügt das "outOfCompetition"-Feld zu allen bestehenden Teams hinzu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Diese Migration fügt allen bestehenden Teams in der Datenbank das Feld "outOfCompetition" mit dem Standardwert "false" hinzu,
              falls es noch nicht vorhanden ist. Dies ist notwendig für die neue "Außer Konkurrenz"-Funktionalität.
            </p>
            
            {migrationResult && (
              <Alert variant={migrationResult.success ? "default" : "destructive"} className={migrationResult.success ? "bg-green-50 border-green-200" : ""}>
                {migrationResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {migrationResult.message}
                  {migrationResult.success && migrationResult.migratedCount !== undefined && (
                    <span className="font-medium"> ({migrationResult.migratedCount} Teams migriert)</span>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={handleRunTeamMigration} 
                disabled={isRunningMigration}
                className="w-full sm:w-auto"
              >
                {isRunningMigration && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Migration ausführen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground mt-8">
        <p>Hinweis: Migrationen sollten nur einmal ausgeführt werden. Wiederholte Ausführungen sind in der Regel harmlos, 
        da sie nur fehlende Felder ergänzen, aber nicht bestehende Daten überschreiben.</p>
      </div>
    </div>
  );
}