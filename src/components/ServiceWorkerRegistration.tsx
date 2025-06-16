"use client";

import { useEffect } from 'react';

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
            console.log('Service Worker registriert:', registration);
          })
          .catch(error => {
            console.error('Service Worker Registrierungsfehler:', error);
          });
      });
    }
  }, []);
  
  return null;
}