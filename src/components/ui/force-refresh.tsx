"use client";
import { useEffect } from 'react';

export function ForceRefresh() {
  useEffect(() => {
    // Version automatisch aus Build-Zeit generieren
    const currentVersion = process.env.NEXT_PUBLIC_BUILD_ID || '1.8.1';
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion !== currentVersion) {
      console.log(`Version Update: ${storedVersion} → ${currentVersion}`);
      
      // Cache leeren
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      // Service Worker aktualisieren
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Neue Version speichern
      localStorage.setItem('app_version', currentVersion);
      
      // Hard Reload mit Cache-Bypass
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, []);

  return null;
}