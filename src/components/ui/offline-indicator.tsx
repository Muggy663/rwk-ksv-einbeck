// src/components/ui/offline-indicator.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (!online) {
        setShowOfflineMessage(true);
      } else if (showOfflineMessage) {
        // Zeige kurz "Wieder online" Nachricht
        setTimeout(() => {
          setShowOfflineMessage(false);
        }, 3000);
      }
    };

    // Initial check
    updateOnlineStatus();

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [showOfflineMessage]);

  if (!showOfflineMessage) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className={`shadow-lg ${isOnline ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${isOnline ? 'text-green-800' : 'text-amber-800'}`}>
                {isOnline ? 'Wieder online' : 'Keine Internetverbindung'}
              </p>
              <p className={`text-xs ${isOnline ? 'text-green-600' : 'text-amber-600'}`}>
                {isOnline 
                  ? 'Alle Funktionen sind wieder verfügbar.'
                  : 'Einige Funktionen sind möglicherweise eingeschränkt.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
