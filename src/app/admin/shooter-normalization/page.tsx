// src/app/admin/shooter-normalization/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, CheckCircle, AlertTriangle, Loader2, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import type { Shooter, Club } from '@/types/rwk';
import Link from 'next/link';

interface ExcelShooter extends Shooter {
  kmClubId?: string;
  source?: string;
}

interface NormalizationPlan {
  shooterId: string;
  currentName: string;
  currentFirstName: string;
  currentKmClubId: string;
  newFirstName: string;
  newLastName: string;
  newClubId: string;
  action: 'normalize' | 'delete' | 'skip';
  isDuplicate: boolean;
  duplicateOf?: string;
}

export default function ShooterNormalizationPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [excelShooters, setExcelShooters] = useState<ExcelShooter[]>([]);
  const [normalShooters, setNormalShooters] = useState<Shooter[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [normalizationPlans, setNormalizationPlans] = useState<NormalizationPlan[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backupCreated, setBackupCreated] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Alle Schützen laden
      const shootersSnapshot = await getDocs(collection(db, "rwk_shooters"));
      const allShooters = shootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExcelShooter));
      
      // Excel-Schützen (haben kmClubId, kein clubId)
      const excel = allShooters.filter(s => s.kmClubId && !s.clubId);
      setExcelShooters(excel);
      
      // Normale Schützen (haben clubId)
      const normal = allShooters.filter(s => s.clubId && !s.kmClubId);
      setNormalShooters(normal);
      
      // Clubs laden
      const clubsSnapshot = await getDocs(collection(db, "clubs"));
      const clubs = clubsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
      setAllClubs(clubs);
      
      // Normalisierungspläne erstellen
      const plans: NormalizationPlan[] = excel.map(shooter => {
        // Versuche Club zu finden
        const matchingClub = clubs.find(c => c.name === shooter.kmClubId);
        
        // Namen aufteilen - "Adrian" → firstName="", lastName="Adrian"
        const currentName = shooter.name || '';
        const currentFirstName = shooter.firstName || '';
        
        // Vorschlag: firstName bleibt, name wird lastName
        const newFirstName = currentFirstName;
        const newLastName = currentName;
        
        // Prüfe auf Duplikate
        const fullName = `${newFirstName} ${newLastName}`.trim();
        const duplicate = normal.find(ns => 
          ns.name.toLowerCase() === fullName.toLowerCase() && 
          ns.clubId === matchingClub?.id
        );
        
        return {
          shooterId: shooter.id,
          currentName,
          currentFirstName,
          currentKmClubId: shooter.kmClubId || '',
          newFirstName,
          newLastName,
          newClubId: matchingClub?.id || '',
          action: duplicate ? 'delete' : 'normalize',
          isDuplicate: !!duplicate,
          duplicateOf: duplicate?.name
        };
      });
      
      setNormalizationPlans(plans);
      
    } catch (error) {
      console.error("Fehler beim Laden der Daten:", error);
      toast({ title: "Fehler", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      const backupData = {
        excelShooters,
        timestamp: new Date().toISOString(),
        plans: normalizationPlans
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `excel_shooters_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupCreated(true);
      toast({ title: "Backup erstellt", description: "Excel-Schützen Backup wurde heruntergeladen." });
    } catch (error) {
      toast({ title: "Backup-Fehler", description: (error as Error).message, variant: "destructive" });
    }
  };

  const updatePlan = (shooterId: string, field: keyof NormalizationPlan, value: any) => {
    setNormalizationPlans(prev => prev.map(plan => 
      plan.shooterId === shooterId ? { ...plan, [field]: value } : plan
    ));
  };

  const processNormalization = async () => {
    if (!backupCreated) {
      toast({ title: "Backup erforderlich", description: "Bitte erstellen Sie zuerst ein Backup.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      let normalizedCount = 0;
      let deletedCount = 0;
      
      for (const plan of normalizationPlans) {
        if (plan.action === 'skip') continue;
        
        const shooterRef = doc(db, "rwk_shooters", plan.shooterId);
        
        if (plan.action === 'delete') {
          batch.delete(shooterRef);
          deletedCount++;
        } else if (plan.action === 'normalize' && plan.newClubId) {
          const normalizedData = {
            firstName: plan.newFirstName,
            lastName: plan.newLastName,
            name: `${plan.newFirstName} ${plan.newLastName}`.trim(),
            clubId: plan.newClubId,
            // Entferne Excel-spezifische Felder
            kmClubId: null,
            source: null
          };
          
          batch.update(shooterRef, normalizedData);
          normalizedCount++;
        }
      }
      
      await batch.commit();
      
      toast({ 
        title: "Normalisierung abgeschlossen", 
        description: `${normalizedCount} Schützen normalisiert, ${deletedCount} Duplikate gelöscht.` 
      });
      
      // Daten neu laden
      await loadData();
      setBackupCreated(false);
      
    } catch (error) {
      console.error("Fehler bei Normalisierung:", error);
      toast({ title: "Normalisierung fehlgeschlagen", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mr-3" />
        <p>Lade Excel-Schützen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-primary">Excel-Schützen Normalisierung</h1>
        <Link href="/admin">
          <Button variant="outline" size="sm">Zurück zum Dashboard</Button>
        </Link>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Dieses Tool normalisiert Excel-importierte Schützen zu korrekter Datenstruktur. 
          <strong> Erstellen Sie zuerst ein Backup!</strong> Verwenden Sie dies nur nach der Saison.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Excel-Schützen gefunden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{excelShooters.length}</div>
            <p className="text-sm text-muted-foreground">Schützen mit kmClubId</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Backup erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createBackup} 
              className="w-full"
              variant={backupCreated ? "default" : "outline"}
            >
              {backupCreated && <CheckCircle className="mr-2 h-4 w-4" />}
              <Download className="mr-2 h-4 w-4" />
              {backupCreated ? "Backup erstellt" : "Backup herunterladen"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Normalisierung starten</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={processNormalization} 
              disabled={!backupCreated || isProcessing || excelShooters.length === 0}
              className="w-full"
              variant="destructive"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Edit3 className="mr-2 h-4 w-4" />
              Normalisierung starten
            </Button>
          </CardContent>
        </Card>
      </div>

      {excelShooters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Excel-Schützen Review ({normalizationPlans.length})</CardTitle>
            <CardDescription>
              Überprüfen Sie jeden Schützen vor der Normalisierung. Duplikate werden zum Löschen vorgeschlagen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aktuell</TableHead>
                    <TableHead>Vorname (neu)</TableHead>
                    <TableHead>Nachname (neu)</TableHead>
                    <TableHead>Verein</TableHead>
                    <TableHead>Aktion</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {normalizationPlans.map((plan) => (
                    <TableRow key={plan.shooterId}>
                      <TableCell>
                        <div className="text-sm">
                          <div><strong>{plan.currentFirstName} {plan.currentName}</strong></div>
                          <div className="text-muted-foreground">{plan.currentKmClubId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={plan.newFirstName}
                          onChange={(e) => updatePlan(plan.shooterId, 'newFirstName', e.target.value)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={plan.newLastName}
                          onChange={(e) => updatePlan(plan.shooterId, 'newLastName', e.target.value)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={plan.newClubId}
                          onValueChange={(value) => updatePlan(plan.shooterId, 'newClubId', value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Verein wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {allClubs.map(club => (
                              <SelectItem key={club.id} value={club.id}>
                                {club.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={plan.action}
                          onValueChange={(value) => updatePlan(plan.shooterId, 'action', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normalize">Normalisieren</SelectItem>
                            <SelectItem value="delete">Löschen</SelectItem>
                            <SelectItem value="skip">Überspringen</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {plan.isDuplicate && (
                          <div className="text-sm text-amber-600">
                            <AlertTriangle className="inline h-4 w-4 mr-1" />
                            Duplikat von: {plan.duplicateOf}
                          </div>
                        )}
                        {!plan.newClubId && plan.action === 'normalize' && (
                          <div className="text-sm text-red-600">
                            <AlertTriangle className="inline h-4 w-4 mr-1" />
                            Verein fehlt
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {excelShooters.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <CheckCircle className="mx-auto h-10 w-10 mb-3 text-green-500" />
            <p>Keine Excel-Schützen gefunden. Alle Schützen haben bereits die korrekte Datenstruktur.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}