"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Users,
  FileText,
  Play,
  RefreshCw
} from 'lucide-react';
import { ClubMigrationService } from '@/lib/services/club-migration-service';

export default function ClubMigrationPage() {
  const [clubId, setClubId] = useState('1icqJ91FFStTBn6ORukx');
  const [migrationStatus, setMigrationStatus] = useState<{
    shooters: 'pending' | 'running' | 'completed' | 'error';
    vereinsrecht: 'pending' | 'running' | 'completed' | 'error';
  }>({
    shooters: 'pending',
    vereinsrecht: 'pending'
  });
  const [migrationResults, setMigrationResults] = useState<{
    shootersCount?: number;
    vereinsrechtCount?: number;
    errors?: string[];
  }>({});

  const migrateShooters = async () => {
    setMigrationStatus(prev => ({ ...prev, shooters: 'running' }));
    
    try {
      console.log('Starting migration for all clubs...');
      const result = await ClubMigrationService.migrateAllClubs();
      console.log('Migration result:', result);
      setMigrationStatus(prev => ({ ...prev, shooters: 'completed' }));
      setMigrationResults(prev => ({ ...prev, shootersCount: result.totalMigrated }));
    } catch (error) {
      console.error('Shooter-Migration fehlgeschlagen:', error);
      setMigrationStatus(prev => ({ ...prev, shooters: 'error' }));
      setMigrationResults(prev => ({ 
        ...prev, 
        errors: [...(prev.errors || []), `Shooter-Migration: ${error.message}`]
      }));
    }
  };

  const migrateVereinsrecht = async () => {
    setMigrationStatus(prev => ({ ...prev, vereinsrecht: 'running' }));
    
    try {
      await ClubMigrationService.migrateVereinsrechtData(clubId);
      setMigrationStatus(prev => ({ ...prev, vereinsrecht: 'completed' }));
      setMigrationResults(prev => ({ ...prev, vereinsrechtCount: 0 }));
    } catch (error) {
      console.error('Vereinsrecht-Migration fehlgeschlagen:', error);
      setMigrationStatus(prev => ({ ...prev, vereinsrecht: 'error' }));
      setMigrationResults(prev => ({ 
        ...prev, 
        errors: [...(prev.errors || []), `Vereinsrecht-Migration: ${error.message}`]
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'running': return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Play className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container py-4 px-2 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <BackButton className="mr-2" fallbackHref="/admin" />
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Database className="h-8 w-8" />
            Club-Migration zu Multi-Tenant
          </h1>
        </div>
        <p className="text-muted-foreground">
          Migration von globalen Collections zu club-spezifischen Collections
        </p>
      </div>

      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">🚀 Automatische Migration aller Vereine</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800">
            Diese Migration verarbeitet automatisch alle 16 Vereine in der Datenbank. 
            Keine manuelle Club-ID Eingabe erforderlich.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold">Schützen → Mitglieder (Alle Vereine)</h3>
                  <p className="text-sm text-muted-foreground">
                    Migriert Shooter-Daten aller Vereine zu vollständigen Mitglieder-Profilen
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(migrationStatus.shooters)}>
                  {getStatusIcon(migrationStatus.shooters)}
                  <span className="ml-1 capitalize">{migrationStatus.shooters}</span>
                </Badge>
                
                <Button 
                  onClick={migrateShooters}
                  disabled={migrationStatus.shooters === 'running'}
                  variant={migrationStatus.shooters === 'completed' ? 'outline' : 'default'}
                >
                  {migrationStatus.shooters === 'completed' ? 'Erneut ausführen' : 'Starten'}
                </Button>
              </div>
            </div>
            
            {migrationResults.shootersCount !== undefined && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ {migrationResults.shootersCount} Schützen aus allen Vereinen erfolgreich zu Mitgliedern migriert
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold">Vereinsrecht-Daten</h3>
                  <p className="text-sm text-muted-foreground">
                    Migriert Protokolle, Wahlen und andere Vereinsrecht-Daten
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(migrationStatus.vereinsrecht)}>
                  {getStatusIcon(migrationStatus.vereinsrecht)}
                  <span className="ml-1 capitalize">{migrationStatus.vereinsrecht}</span>
                </Badge>
                
                <Button 
                  onClick={migrateVereinsrecht}
                  disabled={migrationStatus.vereinsrecht === 'running' || !clubId}
                  variant={migrationStatus.vereinsrecht === 'completed' ? 'outline' : 'default'}
                >
                  {migrationStatus.vereinsrecht === 'completed' ? 'Erneut ausführen' : 'Starten'}
                </Button>
              </div>
            </div>
            
            {migrationResults.vereinsrechtCount !== undefined && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ {migrationResults.vereinsrechtCount} Vereinsrecht-Dokumente erfolgreich migriert
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {migrationResults.errors && migrationResults.errors.length > 0 && (
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Migration-Fehler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {migrationResults.errors.map((error, index) => (
                <div key={index} className="p-2 bg-red-50 rounded text-sm text-red-700">
                  {error}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Migration-Hinweise:</p>
              <ul className="text-blue-800 space-y-1">
                <li>• RWK/KM-Daten bleiben in globalen Collections</li>
                <li>• Vereinssoftware-Daten werden club-spezifisch</li>
                <li>• Originaldaten bleiben als Backup erhalten</li>
                <li>• Migration kann mehrfach ausgeführt werden</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}