"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, Activity, Database, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { auditDatabase, analyzeCriticalDataLoss, type DatabaseAuditResult } from '@/lib/services/database-audit';
import type { Club } from '@/types/rwk';

export default function RecoveryPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('global');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<DatabaseAuditResult | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const clubsQuery = query(collection(db, 'rwk_clubs'), orderBy('name', 'asc'));
        const snapshot = await getDocs(clubsQuery);
        const fetchedClubs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Club[];
        setClubs(fetchedClubs);
      } catch (error) {
        toast({
          title: 'Fehler beim Laden der Vereine',
          variant: 'destructive'
        });
      }
    };
    fetchClubs();
  }, [toast]);

  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      // Verwende null für globale Analyse statt leerer String
      const clubIdForAudit = selectedClubId === 'global' ? null : selectedClubId;
      const result = await auditDatabase(clubIdForAudit);
      setAuditResult(result);
      
      const analysisResult = analyzeCriticalDataLoss(result);
      setAnalysis(analysisResult);
      
      toast({
        title: 'Datenbank-Audit abgeschlossen',
        description: `Schweregrad: ${analysisResult.severity.toUpperCase()}`,
        variant: analysisResult.severity === 'critical' ? 'destructive' : 'default'
      });
    } catch (error) {
      toast({
        title: 'Fehler beim Audit',
        variant: 'destructive'
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Database className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Notfall-Datenbank-Audit</h1>
          <p className="text-sm text-muted-foreground">Überprüft den Zustand der Datenbank nach der Bereinigung</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium mb-2">NOTFALL-AUDIT:</p>
            <p>Diese Funktion überprüft, welche Daten durch die Bereinigung gelöscht wurden und bewertet den Schaden.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Datenbank-Audit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Verein auswählen (optional - für detaillierte Analyse)</Label>
            <Select value={selectedClubId} onValueChange={setSelectedClubId}>
              <SelectTrigger>
                <SelectValue placeholder="Verein auswählen oder leer lassen für globale Analyse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Alle Vereine (globale Analyse)</SelectItem>
                {clubs.map(club => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAudit} disabled={isAuditing} className="w-full">
            {isAuditing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Datenbank-Audit starten
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {analysis.severity === 'critical' ? <XCircle className="mr-2 h-5 w-5 text-red-600" /> : 
               analysis.severity === 'low' ? <CheckCircle className="mr-2 h-5 w-5 text-green-600" /> :
               <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />}
              Schadensbewertung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg border ${getSeverityColor(analysis.severity)}`}>
              <h4 className="font-bold mb-2">Schweregrad: {analysis.severity.toUpperCase()}</h4>
              
              {analysis.issues.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium mb-2">Gefundene Probleme:</h5>
                  <ul className="text-sm space-y-1">
                    {analysis.issues.map((issue: string, index: number) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.recommendations.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Empfohlene Maßnahmen:</h5>
                  <ul className="text-sm space-y-1">
                    {analysis.recommendations.map((rec: string, index: number) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {auditResult && (
        <Card>
          <CardHeader>
            <CardTitle>Detaillierte Datenbank-Analyse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(auditResult.collections).map(([collectionName, data]) => (
                <div key={collectionName} className="flex justify-between items-center p-3 bg-muted/20 rounded">
                  <div>
                    <span className="font-medium">{collectionName}</span>
                    {data.isEmpty && <span className="ml-2 text-red-600 text-sm">(LEER!)</span>}
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${data.isEmpty ? 'text-red-600' : 'text-green-600'}`}>
                      {data.count} Einträge
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis?.severity === 'critical' && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Sofortmaßnahmen erforderlich</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">1. Backup-Wiederherstellung:</h4>
                <p>Falls Sie ein Backup haben, stellen Sie die Datenbank sofort wieder her.</p>
              </div>
              <div>
                <h4 className="font-medium">2. Manuelle Dateneingabe:</h4>
                <p>Ohne Backup müssen alle Daten (Teams, Schützen, Ergebnisse) manuell neu eingegeben werden.</p>
              </div>
              <div>
                <h4 className="font-medium">3. Kontakt zum Support:</h4>
                <p>Wenden Sie sich sofort an den technischen Support für weitere Hilfe.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}