// src/app/admin/team-cleanup/page.tsx
"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import type { Team, Shooter } from '@/types/rwk';

interface TeamAnalysis {
  team: Team;
  totalShooters: number;
  validShooters: number;
  invalidShooterIds: string[];
  validShooterNames: string[];
}

export default function TeamCleanupPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [teamAnalysis, setTeamAnalysis] = useState<TeamAnalysis[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [backupCreated, setBackupCreated] = useState(false);

  const analyzeTeams = async () => {
    if (!user) return;
    setIsAnalyzing(true);
    try {
      const teamsSnapshot = await getDocs(collection(db, "rwk_teams"));
      const allTeams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      
      const shootersSnapshot = await getDocs(collection(db, "rwk_shooters"));
      const allShooters = shootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shooter));
      const validShooterIds = new Set(allShooters.map(s => s.id));

      const analysis: TeamAnalysis[] = [];

      for (const team of allTeams) {
        const shooterIds = team.shooterIds || [];
        const validIds: string[] = [];
        const invalidIds: string[] = [];
        const validNames: string[] = [];

        for (const shooterId of shooterIds) {
          if (validShooterIds.has(shooterId)) {
            validIds.push(shooterId);
            const shooter = allShooters.find(s => s.id === shooterId);
            if (shooter) validNames.push(shooter.name);
          } else {
            invalidIds.push(shooterId);
          }
        }

        if (invalidIds.length > 0) {
          analysis.push({
            team,
            totalShooters: shooterIds.length,
            validShooters: validIds.length,
            invalidShooterIds: invalidIds,
            validShooterNames: validNames
          });
        }
      }

      setTeamAnalysis(analysis);
      toast({ 
        title: `Analyse abgeschlossen`, 
        description: `${analysis.length} Teams mit ungültigen Schützen-IDs gefunden.` 
      });
    } catch (error) {
      console.error("Fehler bei Team-Analyse:", error);
      toast({ title: "Fehler bei Analyse", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createBackup = async () => {
    if (!user) return;
    setIsCreatingBackup(true);
    try {
      const teamsSnapshot = await getDocs(collection(db, "rwk_teams"));
      const allTeams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      
      const backupJson = JSON.stringify(allTeams, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rwk_teams_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupCreated(true);
      toast({ title: "Backup erstellt", description: "Teams-Backup wurde heruntergeladen." });
    } catch (error) {
      console.error("Fehler beim Backup:", error);
      toast({ title: "Backup-Fehler", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const cleanupTeams = async () => {
    if (!user || !backupCreated) return;
    setIsCleaningUp(true);
    try {
      const batch = writeBatch(db);
      let updatedCount = 0;

      for (const analysis of teamAnalysis) {
        const validShooterIds = analysis.team.shooterIds?.filter(id => 
          !analysis.invalidShooterIds.includes(id)
        ) || [];

        if (validShooterIds.length !== analysis.team.shooterIds?.length) {
          const teamRef = doc(db, "rwk_teams", analysis.team.id);
          batch.update(teamRef, {
            shooterIds: validShooterIds,
            lastCleanupByUserId: user.uid,
            lastCleanupByUserName: user.displayName || user.email || "Unbekannt",
            lastCleanupTimestamp: new Date()
          });
          updatedCount++;
        }
      }

      await batch.commit();
      toast({ 
        title: "Teams bereinigt", 
        description: `${updatedCount} Teams wurden erfolgreich bereinigt.` 
      });
      
      await analyzeTeams();
    } catch (error) {
      console.error("Fehler beim Bereinigen:", error);
      toast({ title: "Bereinigung fehlgeschlagen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Team-Bereinigung</h1>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Dieses Tool entfernt ungültige Schützen-IDs aus Teams. RWK-Tabellen und Ergebnisse bleiben unverändert.
          <strong> Erstellen Sie zuerst ein Backup!</strong>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Teams analysieren</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={analyzeTeams} disabled={isAnalyzing} className="w-full">
              {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Teams analysieren
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Backup erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createBackup} 
              disabled={isCreatingBackup || teamAnalysis.length === 0}
              className="w-full"
              variant={backupCreated ? "default" : "outline"}
            >
              {isCreatingBackup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {backupCreated && <CheckCircle className="mr-2 h-4 w-4" />}
              <Download className="mr-2 h-4 w-4" />
              {backupCreated ? "Backup erstellt" : "Backup herunterladen"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Teams bereinigen</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={cleanupTeams} 
              disabled={isCleaningUp || !backupCreated || teamAnalysis.length === 0}
              className="w-full"
              variant="destructive"
            >
              {isCleaningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Teams bereinigen
            </Button>
          </CardContent>
        </Card>
      </div>

      {teamAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Problematische Teams ({teamAnalysis.length})</CardTitle>
            <CardDescription>Teams mit ungültigen Schützen-IDs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Liga</TableHead>
                    <TableHead className="text-center">Gesamt</TableHead>
                    <TableHead className="text-center">Gültig</TableHead>
                    <TableHead className="text-center">Ungültig</TableHead>
                    <TableHead>Gültige Schützen</TableHead>
                    <TableHead>Ungültige IDs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamAnalysis.map((analysis) => (
                    <TableRow key={analysis.team.id}>
                      <TableCell className="font-medium">{analysis.team.name}</TableCell>
                      <TableCell>{analysis.team.leagueId}</TableCell>
                      <TableCell className="text-center">{analysis.totalShooters}</TableCell>
                      <TableCell className="text-center text-green-600">{analysis.validShooters}</TableCell>
                      <TableCell className="text-center text-red-600">{analysis.invalidShooterIds.length}</TableCell>
                      <TableCell className="text-sm">{analysis.validShooterNames.join(", ")}</TableCell>
                      <TableCell className="text-xs text-red-600 font-mono">
                        {analysis.invalidShooterIds.join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {teamAnalysis.length === 0 && !isAnalyzing && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <CheckCircle className="mx-auto h-10 w-10 mb-3 text-green-500" />
            <p>Keine Teams mit ungültigen Schützen-IDs gefunden oder Analyse noch nicht durchgeführt.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
