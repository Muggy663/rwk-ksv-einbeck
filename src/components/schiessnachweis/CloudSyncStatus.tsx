"use client";

import { useState, useEffect } from "react";
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, CloudOff, RefreshCw, Crown, Lock, Wifi, WifiOff } from "lucide-react";
import { PremiumService } from "@/lib/services/premium-service";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { useToast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase/config';
import Link from "next/link";

interface CloudSyncStatusProps {
  className?: string;
}

export function CloudSyncStatus({ className }: CloudSyncStatusProps) {
  const { toast } = useToast();
  const [isPremium, setIsPremium] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Auth-Status überwachen
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoggedIn(!!user);
      // Premium-Check mit Admin-Verifizierung
      if (user) {
        const isPremiumActive = await PremiumService.isPremium();
        setIsPremium(isPremiumActive);
      } else {
        setIsPremium(false);
      }
    });
    
    // Sync-Status laden
    const syncStatus = SchießnachweisService.getSyncStatus();
    setLastSync(syncStatus.lastSync);
    setPendingChanges(syncStatus.pendingChanges);
    setIsSyncing(syncStatus.syncInProgress);
    
    // Online-Status überwachen
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);
    
    // Event-basierte Updates statt Polling
    const handleSyncStatusChange = (event: CustomEvent) => {
      const status = event.detail;
      setLastSync(status.lastSync);
      setPendingChanges(status.pendingChanges);
      setIsSyncing(status.syncInProgress);
    };
    
    window.addEventListener('syncStatusChanged', handleSyncStatusChange as EventListener);
    
    // Auto-Sync nur bei Änderungen
    const handleAutoSync = async (event: CustomEvent) => {
      const status = event.detail;
      if (isPremium && isOnline && status.pendingChanges > 0 && !status.syncInProgress) {
        logDebug('🔄 Auto-Sync gestartet - Ausstehende Änderungen:', status.pendingChanges);
        try {
          await SchießnachweisService.syncToCloud();
          logDebug('✅ Auto-Sync erfolgreich');
        } catch (error) {
          logDebug('❌ Auto-Sync fehlgeschlagen:', error);
        }
      }
    };
    
    window.addEventListener('syncStatusChanged', handleAutoSync as EventListener);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('syncStatusChanged', handleSyncStatusChange as EventListener);
      window.removeEventListener('syncStatusChanged', handleAutoSync as EventListener);
      unsubscribe();
    };
  }, []);

  const handleSync = async () => {
    logDebug('Sync-Versuch:', { isPremium, isOnline, emailVerified: auth.currentUser?.emailVerified });
    
    if (!isPremium || !isOnline) {
      logDebug('Sync blockiert: Premium oder Offline');
      return;
    }
    
    setIsSyncing(true);
    
    try {
      logDebug('Starte Cloud-Sync...');
      await SchießnachweisService.syncToCloud();
      const status = SchießnachweisService.getSyncStatus();
      setLastSync(status.lastSync);
      setPendingChanges(status.pendingChanges);
      
      toast({
        title: "🌍 Sync erfolgreich",
        description: "Ihre Daten wurden in die Cloud synchronisiert.",
      });
    } catch (error) {
      toast({
        title: "Sync fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <Card className={`border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CloudOff className="h-4 w-4 text-gray-600" />
            Cloud-Synchronisation
            <Badge variant="outline" className="ml-auto">
              Anmeldung erforderlich
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Nur lokale Speicherung
              </span>
            </div>
            <Link href="/schiessnachweis/login">
              <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                Anmelden
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Testphase: E-Mail-Verifizierung übersprungen
  
  if (!isPremium) {
    return (
      <Card className={`border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CloudOff className="h-4 w-4 text-yellow-600" />
            Cloud-Synchronisation
            <Badge variant="outline" className="ml-auto">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                Offline-Modus
              </span>
            </div>
            <Link href="/schiessnachweis/premium">
              <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                Upgraden
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {isOnline ? (
            <Cloud className="h-4 w-4 text-blue-600" />
          ) : (
            <CloudOff className="h-4 w-4 text-gray-500" />
          )}
          Cloud-Synchronisation
          <Badge variant="default" className="ml-auto">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <div className="text-sm">
              {isOnline ? (
                <div className="text-green-700 dark:text-green-300">
                  <div>Online</div>
                  {lastSync && (
                    <div className="text-xs text-muted-foreground">
                      Sync: {lastSync.toLocaleTimeString()}
                    </div>
                  )}
                  {pendingChanges > 0 && (
                    <div className="text-xs text-yellow-600">
                      {pendingChanges} Änderung(en) ausstehend
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-red-600 dark:text-red-400">Offline</span>
              )}
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleSync}
            disabled={!isOnline || isSyncing}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
