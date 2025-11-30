"use client";
import { Button } from '@/components/ui/button';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ClearCacheButton() {
  const { toast } = useToast();

  const clearCache = async () => {
    try {
      // Cache leeren
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Service Worker neu registrieren
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      // LocalStorage leeren (außer wichtige Daten)
      const keysToKeep = ['user_preferences', 'auth_token'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      toast({
        title: 'Cache geleert',
        description: 'Die App wird neu geladen...',
      });

      // Seite neu laden
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      logError('Fehler beim Cache leeren:', error);
      toast({
        title: 'Fehler',
        description: 'Cache konnte nicht geleert werden.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={clearCache}
      className="text-xs cache-button"
    >
      <RefreshCw className="h-3 w-3 mr-1" />
      Cache leeren
    </Button>
  );
}
