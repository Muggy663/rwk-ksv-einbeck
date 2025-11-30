"use client";

import { useEffect } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

/**
 * Komponente zur Registrierung des Service Workers
 * Muss als Client-Komponente markiert sein, da useEffect verwendet wird
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {

          })
          .catch(error => {
            logError('Service Worker Registrierungsfehler:', error);
          });
      });
    }
  }, []);
  
  return null;
}
