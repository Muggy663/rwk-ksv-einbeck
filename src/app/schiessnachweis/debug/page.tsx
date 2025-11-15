"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { PremiumService } from "@/lib/services/premium-service";
import { CloudSyncService } from "@/lib/services/cloud-sync-service";
import { auth } from '@/lib/firebase/config';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Database, User, Cloud, TestTube } from "lucide-react";
import Link from "next/link";

export default function DebugPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const testCreateEntry = () => {
    try {
      const testEntry = SchießnachweisService.saveEintrag({
        datum: new Date(),
        typ: 'training',
        disziplin: 'Luftgewehr 10m',
        schussAnzahl: 40,
        ergebnis: 380.5,
        standort: 'Test-Standort',
        notizen: 'Debug-Test-Eintrag'
      });
      addLog(`✅ Test-Eintrag erstellt: ${testEntry.id}`);
    } catch (error) {
      addLog(`❌ Fehler beim Erstellen: ${error}`);
    }
  };

  const testSync = async () => {
    try {
      addLog('🔄 Starte manuellen Sync...');
      addLog(`User: ${auth.currentUser?.uid}`);
      addLog(`Email verified: ${auth.currentUser?.emailVerified}`);
      addLog(`Premium: ${PremiumService.isPremium()}`);
      
      await SchießnachweisService.syncToCloud();
      addLog('✅ Sync erfolgreich');
    } catch (error) {
      addLog(`❌ Sync fehlgeschlagen: ${error}`);
      console.error('Sync Error Details:', error);
    }
  };

  const showStatus = () => {
    const entries = SchießnachweisService.getEinträge();
    const premium = PremiumService.getSubscription();
    const syncStatus = CloudSyncService.getSyncStatus();
    const user = auth.currentUser;

    addLog(`📊 Status:`);
    addLog(`- Einträge: ${entries.length}`);
    addLog(`- Premium: ${premium.isActive ? 'Aktiv' : 'Inaktiv'}`);
    addLog(`- User: ${user ? user.uid.slice(0, 12) : 'Nicht angemeldet'}`);
    addLog(`- Email: ${user?.email}`);
    addLog(`- Email verifiziert: ${user?.emailVerified ? 'Ja' : 'Nein'}`);
    addLog(`- Pending Changes: ${syncStatus.pendingChanges}`);
    addLog(`- Last Sync: ${syncStatus.lastSync?.toLocaleString() || 'Nie'}`);
    addLog(`- Online: ${navigator.onLine}`);
  };

  const activatePremium = () => {
    try {
      PremiumService.activatePremium('monthly', 1, true);
      addLog('✅ Premium aktiviert (1 Monat, Auto-Renewal)');
    } catch (error) {
      addLog(`❌ Premium-Aktivierung fehlgeschlagen: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/schiessnachweis">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Schießnachweis
          </Link>
        </Button>
        
        <h1 className="text-2xl font-bold">🔧 Debug-Tools</h1>
        <p className="text-muted-foreground">
          Tools zum Testen der Synchronisation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test-Aktionen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={testCreateEntry} className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Test-Eintrag erstellen
            </Button>
            <Button 
              onClick={() => {
                try {
                  const data = localStorage.getItem('rwk_schiessnachweis');
                  if (data) {
                    const parsed = JSON.parse(data);
                    const fixed = parsed.map((eintrag: any) => {
                      let datum = new Date(eintrag.datum);
                      if (isNaN(datum.getTime()) || datum.getFullYear() < 2020) {
                        datum = new Date();
                        addLog(`🔧 Repariere Datum für Eintrag: ${eintrag.id}`);
                      }
                      return {
                        ...eintrag,
                        datum: datum.toISOString()
                      };
                    });
                    localStorage.setItem('rwk_schiessnachweis', JSON.stringify(fixed));
                    localStorage.setItem('rwk_schiessnachweis_backup', JSON.stringify(fixed));
                    addLog(`✅ ${fixed.length} Einträge repariert`);
                    toast({ title: "Daten repariert", description: `${fixed.length} Einträge mit korrigierten Daten.` });
                  }
                } catch (error) {
                  addLog(`❌ Reparatur fehlgeschlagen: ${error}`);
                }
              }}
              variant="outline" 
              className="w-full bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
            >
              📅 Daten reparieren (01.01.1970 Fix)
            </Button>
            <Button onClick={activatePremium} variant="outline" className="w-full">
              <User className="h-4 w-4 mr-2" />
              Premium aktivieren
            </Button>
            <Button onClick={testSync} variant="outline" className="w-full">
              <Cloud className="h-4 w-4 mr-2" />
              Manueller Sync
            </Button>
            <Button onClick={showStatus} variant="secondary" className="w-full">
              📊 Status anzeigen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktueller Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Einträge: {SchießnachweisService.getEinträge().length}</div>
              <div>Premium: {PremiumService.isPremium() ? '✅' : '❌'}</div>
              <div>User: {auth.currentUser?.uid?.slice(0, 8) || 'Nicht angemeldet'}</div>
              <div>Email: {auth.currentUser?.emailVerified ? '✅' : '❌'}</div>
              <div>Pending: {CloudSyncService.getSyncStatus().pendingChanges}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug-Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Keine Logs...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
        <h3 className="font-semibold mb-2">🔍 Firebase-Collection:</h3>
        <code className="text-sm">schiessnachweis_data/{auth.currentUser?.uid || 'USER_ID'}</code>
        <p className="text-sm text-muted-foreground mt-2">
          Die Collection wird erst erstellt, wenn der erste Sync erfolgreich ist.
        </p>
        <div className="mt-2 text-xs">
          <div>Current User: {auth.currentUser?.uid?.slice(0, 12) || 'None'}</div>
          <div>Email Verified: {auth.currentUser?.emailVerified ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  );
}