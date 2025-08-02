"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, RefreshCw, Search, AlertTriangle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { safeDiagnoseDatabaseInconsistencies, performSafeCleanup, type SafeCleanupDiagnosis } from '@/lib/services/safe-cleanup';
import type { Club } from '@/types/rwk';

export default function CleanupPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<SafeCleanupDiagnosis | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoading(true);
      try {
        const clubsQuery = query(collection(db, 'clubs'), orderBy('name', 'asc'));
        const snapshot = await getDocs(clubsQuery);
        const fetchedClubs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Club[];
        
        setClubs(fetchedClubs);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        toast({
          title: 'Fehler beim Laden der Vereine',
          description: 'Die Vereinsliste konnte nicht geladen werden.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubs();
  }, [toast]);

  const handleDiagnosis = async () => {
    if (!selectedClubId) {
      toast({
        title: 'Kein Verein ausgewählt',
        description: 'Bitte wählen Sie einen Verein aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsDiagnosing(true);
    setDiagnosis(null);
    setCleanupResult(null);
    
    try {
      const result = await safeDiagnoseDatabaseInconsistencies(selectedClubId);
      setDiagnosis(result);
      
      const totalProblems = result.trulyOrphanedTeamShooters.length + result.trulyOrphanedScores.length;
      
      toast({
        title: 'Sichere Diagnose abgeschlossen',
        description: `${totalProblems} wirklich verwaiste Einträge gefunden.`,
        variant: totalProblems > 0 ? 'default' : 'default'
      });
    } catch (error: any) {
      console.error('Error during diagnosis:', error);
      toast({
        title: 'Fehler bei der Diagnose',
        description: error.message || 'Bei der Diagnose ist ein Fehler aufgetreten.',
        variant: 'destructive'
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleCleanup = async () => {
    if (!user) {
      toast({
        title: 'Nicht angemeldet',
        description: 'Sie müssen angemeldet sein, um diese Funktion zu nutzen.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!selectedClubId || !diagnosis) {
      toast({
        title: 'Keine Diagnose verfügbar',
        description: 'Bitte führen Sie zuerst eine Diagnose durch.',
        variant: 'destructive'
      });
      return;
    }

    if (!diagnosis.safeToDelete) {
      toast({
        title: 'Bereinigung nicht sicher',
        description: 'Die Diagnose hat Sicherheitswarnungen ergeben. Bereinigung abgebrochen.',
        variant: 'destructive'
      });
      return;
    }

    setIsCleaningUp(true);
    setCleanupResult(null);
    
    try {
      const result = await performSafeCleanup(selectedClubId, diagnosis);
      
      const resultText = `Sichere Bereinigung abgeschlossen:
• ${diagnosis.trulyOrphanedTeamShooters.length} verwaiste Team-Schützen-Verknüpfungen gelöscht
• ${diagnosis.trulyOrphanedScores.length} verwaiste Ergebnisse gelöscht
Gesamt: ${result.deleted} Einträge sicher entfernt

${result.warnings.length > 0 ? 'Warnungen:\n' + result.warnings.join('\n') : ''}`;

      setCleanupResult(resultText);
      toast({
        title: 'Sichere Bereinigung abgeschlossen',
        description: `${result.deleted} verwaiste Einträge wurden sicher entfernt.`,
      });
      
      // Diagnose zurücksetzen nach erfolgreicher Bereinigung
      setDiagnosis(null);
    } catch (error: any) {
      console.error('Error during cleanup:', error);
      setCleanupResult(`Fehler bei der Bereinigung: ${error.message}`);
      toast({
        title: 'Fehler bei der Bereinigung',
        description: error.message || 'Bei der Bereinigung ist ein Fehler aufgetreten.',
        variant: 'destructive'
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Sichere Datenbereinigung</h1>
          <p className="text-sm text-muted-foreground">Verbesserte Version - löscht nur wirklich verwaiste Daten</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-2">WICHTIGER HINWEIS:</p>
            <p>Diese verbesserte Bereinigungsfunktion prüft sorgfältig, welche Daten wirklich verwaist sind, bevor sie gelöscht werden. 
            Sie berücksichtigt aktive Saisons und vorhandene Ergebnisse, um Datenverlust zu vermeiden.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Sichere Diagnose
            </CardTitle>
            <CardDescription>
              Analysiert die Datenbank auf wirklich verwaiste Referenzen unter Berücksichtigung aktiver Daten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clubSelect">Verein auswählen</Label>
              <Select
                value={selectedClubId}
                onValueChange={setSelectedClubId}
                disabled={isLoading || isDiagnosing || isCleaningUp}
              >
                <SelectTrigger id="clubSelect">
                  <SelectValue placeholder="Verein auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleDiagnosis}
              disabled={!selectedClubId || isDiagnosing || isCleaningUp}
              className="w-full"
              variant="outline"
            >
              {isDiagnosing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sichere Analyse läuft...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Sichere Diagnose starten
                </>
              )}
            </Button>

            {diagnosis && (
              <div className="space-y-3 p-4 bg-muted/20 rounded-md">
                <h4 className="font-medium flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  Sichere Diagnose-Ergebnisse:
                </h4>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Wirklich verwaiste Team-Schützen:</span>
                    <span className={diagnosis.trulyOrphanedTeamShooters.length > 0 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                      {diagnosis.trulyOrphanedTeamShooters.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wirklich verwaiste Ergebnisse:</span>
                    <span className={diagnosis.trulyOrphanedScores.length > 0 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                      {diagnosis.trulyOrphanedScores.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Bereinigung sicher:</span>
                    <span className={diagnosis.safeToDelete ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {diagnosis.safeToDelete ? '✓ Ja' : '✗ Nein'}
                    </span>
                  </div>
                </div>
                
                {diagnosis.warnings.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                    <h5 className="font-medium text-amber-800 mb-1">Warnungen:</h5>
                    <ul className="text-xs text-amber-700 space-y-1">
                      {diagnosis.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Sichere Bereinigung
            </CardTitle>
            <CardDescription>
              Entfernt nur wirklich verwaiste Daten und bewahrt alle aktiven Verknüpfungen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!diagnosis && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Diagnose erforderlich:</p>
                  <p>Führen Sie zuerst eine sichere Diagnose durch, bevor Sie die Bereinigung starten.</p>
                </div>
              </div>
            )}

            {diagnosis && !diagnosis.safeToDelete && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Bereinigung nicht sicher:</p>
                  <p>Die Diagnose hat Sicherheitswarnungen ergeben. Bereinigung wird verhindert.</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleCleanup}
              disabled={!selectedClubId || isCleaningUp || isDiagnosing || !user || !diagnosis?.safeToDelete}
              className="w-full"
            >
              {isCleaningUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sichere Bereinigung läuft...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Sichere Bereinigung starten
                </>
              )}
            </Button>

            {cleanupResult && (
              <div className={`p-4 rounded-md whitespace-pre-line ${cleanupResult.includes('Fehler') ? 'bg-destructive/10 text-destructive' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                {cleanupResult}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Was macht die sichere Bereinigung?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <div>
            <h4 className="font-medium text-foreground">✓ Sichere Prüfungen:</h4>
            <p>• Berücksichtigt nur die aktuelle Saison</p>
            <p>• Prüft auf vorhandene Ergebnisse vor dem Löschen</p>
            <p>• Warnt vor zu vielen Löschungen ({'>'}100 Einträge)</p>
            <p>• Löscht nur Daten ohne aktive Verknüpfungen</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground">✗ Wird NICHT gelöscht:</h4>
            <p>• Schützen oder Teams mit vorhandenen Ergebnissen</p>
            <p>• Aktive Verknüpfungen der aktuellen Saison</p>
            <p>• Daten mit unklarem Status</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground">⚠️ Zur Wiederherstellung:</h4>
            <p>Falls Daten versehentlich gelöscht wurden, können diese nur aus einem Backup wiederhergestellt werden.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}