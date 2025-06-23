"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, RefreshCw, Search, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { cleanupAllDeletedTeamReferencesForClub } from '@/lib/services/team-cleanup';
import { diagnoseDatabaseInconsistencies, performAdvancedCleanup, type CleanupDiagnosis } from '@/lib/services/advanced-cleanup';
import type { Club } from '@/types/rwk';

interface DiagnosisResult {
  orphanedTeamShooters: number;
  duplicateShooterAssignments: number;
  orphanedTeamReferences: number;
  inconsistentShooterArrays: number;
}

interface DetailedDiagnosis extends CleanupDiagnosis {
  // Erweiterte Diagnose-Informationen
}

export default function CleanupPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [detailedDiagnosis, setDetailedDiagnosis] = useState<CleanupDiagnosis | null>(null);

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
    setDiagnosisResult(null);
    setDetailedDiagnosis(null);
    
    try {
      const diagnosis = await diagnoseDatabaseInconsistencies(selectedClubId);
      setDetailedDiagnosis(diagnosis);
      
      const result: DiagnosisResult = {
        orphanedTeamShooters: diagnosis.orphanedTeamShooters.length,
        duplicateShooterAssignments: diagnosis.duplicateShooterAssignments.length,
        orphanedTeamReferences: diagnosis.orphanedTeamReferences.length,
        inconsistentShooterArrays: diagnosis.inconsistentShooterArrays.length
      };

      setDiagnosisResult(result);
      
      const totalProblems = result.orphanedTeamShooters + result.duplicateShooterAssignments + 
                           result.orphanedTeamReferences + result.inconsistentShooterArrays;
      
      toast({
        title: 'Diagnose abgeschlossen',
        description: `${totalProblems} Probleme gefunden.`,
        variant: totalProblems > 0 ? 'destructive' : 'default'
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
    
    if (!selectedClubId) {
      toast({
        title: 'Kein Verein ausgewählt',
        description: 'Bitte wählen Sie einen Verein aus.',
        variant: 'destructive'
      });
      return;
    }

    setIsCleaningUp(true);
    setCleanupResult(null);
    
    try {
      // Verwende erweiterte Bereinigung wenn Diagnose verfügbar
      if (detailedDiagnosis) {
        const result = await performAdvancedCleanup(selectedClubId, detailedDiagnosis);
        
        const resultText = `Bereinigung abgeschlossen:
• ${result.orphanedTeamShootersFixed} verwaiste Team-Schützen-Referenzen
• ${result.duplicateAssignmentsFixed} doppelte Zuordnungen
• ${result.orphanedReferencesFixed} verwaiste Referenzen
• ${result.inconsistentArraysFixed} inkonsistente Arrays
Gesamt: ${result.totalFixed} Probleme behoben`;

        setCleanupResult(resultText);
        toast({
          title: 'Erweiterte Bereinigung abgeschlossen',
          description: `${result.totalFixed} Probleme wurden behoben.`,
        });
        
        // Diagnose zurücksetzen nach erfolgreicher Bereinigung
        setDiagnosisResult(null);
        setDetailedDiagnosis(null);
      } else {
        // Fallback zur alten Bereinigung
        const deletedCount = await cleanupAllDeletedTeamReferencesForClub(selectedClubId);
        
        if (deletedCount > 0) {
          setCleanupResult(`${deletedCount} verwaiste Referenzen wurden erfolgreich bereinigt.`);
          toast({
            title: 'Bereinigung abgeschlossen',
            description: `${deletedCount} verwaiste Referenzen wurden erfolgreich bereinigt.`,
          });
        } else {
          setCleanupResult('Keine verwaisten Referenzen gefunden. Alles ist bereits sauber.');
          toast({
            title: 'Keine Änderungen notwendig',
            description: 'Es wurden keine verwaisten Referenzen gefunden.',
          });
        }
      }
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
        <RefreshCw className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Datenbereinigung</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Datenbank-Diagnose
            </CardTitle>
            <CardDescription>
              Analysiert die Datenbank auf Inkonsistenzen und verwaiste Referenzen.
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
                  Analysiere...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Datenbank analysieren
                </>
              )}
            </Button>

            {diagnosisResult && (
              <div className="space-y-2 p-4 bg-muted/20 rounded-md">
                <h4 className="font-medium">Gefundene Probleme:</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Verwaiste Team-Schützen:</span>
                    <span className={diagnosisResult.orphanedTeamShooters > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {diagnosisResult.orphanedTeamShooters}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Doppelte Zuordnungen:</span>
                    <span className={diagnosisResult.duplicateShooterAssignments > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {diagnosisResult.duplicateShooterAssignments}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verwaiste Referenzen:</span>
                    <span className={diagnosisResult.orphanedTeamReferences > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {diagnosisResult.orphanedTeamReferences}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inkonsistente Arrays:</span>
                    <span className={diagnosisResult.inconsistentShooterArrays > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {diagnosisResult.inconsistentShooterArrays}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <Trash2 className="mr-2 h-5 w-5" />
              Datenbereinigung
            </CardTitle>
            <CardDescription>
              Bereinigt verwaiste Referenzen und Inkonsistenzen in der Datenbank.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnosisResult && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Empfehlung:</p>
                  <p>Führen Sie zuerst eine Diagnose durch, bevor Sie die Bereinigung starten.</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleCleanup}
              disabled={!selectedClubId || isCleaningUp || isDiagnosing || !user}
              className="w-full"
            >
              {isCleaningUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bereinigung läuft...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Bereinigung starten
                </>
              )}
            </Button>

            {cleanupResult && (
              <div className={`p-4 rounded-md ${cleanupResult.includes('Fehler') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                {cleanupResult}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Häufige Probleme und Lösungen</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <div>
            <h4 className="font-medium text-foreground">Problem: Schütze wird in mehreren Mannschaften angezeigt</h4>
            <p>Ursache: Verwaiste Referenzen in rwk_team_shooters oder teams.shooterIds</p>
            <p>Lösung: Datenbereinigung für den betroffenen Verein ausführen</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground">Problem: Gelöschte Mannschaften noch in Dropdowns</h4>
            <p>Ursache: Referenzen in anderen Collections nicht aktualisiert</p>
            <p>Lösung: Vollständige Bereinigung aller Referenzen</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground">Problem: Inkonsistente Schützen-Arrays</h4>
            <p>Ursache: teams.shooterIds nicht synchron mit rwk_team_shooters</p>
            <p>Lösung: Array-Synchronisation durch Bereinigung</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}