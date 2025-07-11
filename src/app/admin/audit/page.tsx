"use client";

import React, { useState, useEffect } from 'react';
import { AuditTrail } from '@/components/audit/AuditTrail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, BarChart3, Activity, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auditLogService } from '@/lib/services/audit-service';
import Link from 'next/link';

export default function AuditPage() {
  const [stats, setStats] = useState<{
    total: number;
    creates: number;
    updates: number;
    deletes: number;
    byEntityType: Record<string, number>;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const auditStats = await auditLogService.getAuditStats();
        setStats(auditStats);
      } catch (error) {
        console.error('Fehler beim Laden der Audit-Statistiken:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Änderungsprotokoll</h1>
          <p className="text-muted-foreground">
            Protokollierung aller Änderungen an Ergebnissen und anderen Daten.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/audit/create-samples">Beispiel-Einträge erstellen</Link>
        </Button>
      </div>
      
      {/* Statistiken */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Audit-Einträge</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erstellt</CardTitle>
              <div className="h-4 w-4 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.creates}</div>
              <p className="text-xs text-muted-foreground">Neue Einträge</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktualisiert</CardTitle>
              <div className="h-4 w-4 bg-blue-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.updates}</div>
              <p className="text-xs text-muted-foreground">Änderungen</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gelöscht</CardTitle>
              <div className="h-4 w-4 bg-red-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.deletes}</div>
              <p className="text-xs text-muted-foreground">Löschungen</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Entitätstyp-Statistiken */}
      {!isLoadingStats && stats && Object.keys(stats.byEntityType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Aktivität nach Typ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.byEntityType).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {type === 'score' ? 'Ergebnisse' :
                     type === 'news_article' ? 'News' :
                     type === 'protest' ? 'Proteste' :
                     type === 'team' ? 'Teams' :
                     type === 'shooter' ? 'Schützen' :
                     type}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Über das Änderungsprotokoll
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Das Änderungsprotokoll zeichnet alle Änderungen an Ergebnissen und anderen wichtigen Daten auf.
            Es hilft dabei, nachzuvollziehen, wer wann welche Änderungen vorgenommen hat.
          </p>
          <p className="mt-2">
            Für jede Änderung werden folgende Informationen gespeichert:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Zeitpunkt der Änderung</li>
            <li>Benutzer, der die Änderung vorgenommen hat</li>
            <li>Art der Änderung (Erstellen, Aktualisieren, Löschen)</li>
            <li>Betroffene Entität (Ergebnis, Mannschaft, Schütze, etc.)</li>
            <li>Details zur Änderung</li>
          </ul>
        </CardContent>
      </Card>

      <AuditTrail showFilters={true} limit={100} />
    </div>
  );
}