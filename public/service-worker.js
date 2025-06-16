/**
 * Service Worker für Offline-Funktionalität
 * Vercel-kompatible Implementierung
 */

const CACHE_NAME = 'rwk-app-v1';

// Zu cachende URLs
const urlsToCache = [
  '/',
  '/images/logo.png',
  '/images/logo2.png',
  '/images/nssv.png',
  '/styles/fallback.css'
];

// Installation des Service Workers
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache-Fehler:', error);
      })
  );
});

// Aktivierung des Service Workers
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch-Handler für Netzwerkanfragen
self.addEventListener('fetch', (event) => {
  // Nur GET-Anfragen cachen
  if (event.request.method !== 'GET') return;
  
  // API-Anfragen nicht cachen
  if (event.request.url.includes('/api/')) return;
  
  // Firestore und Firebase-Anfragen nicht cachen
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Anfrage klonen, da sie nur einmal verwendet werden kann
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Ungültige Antworten nicht cachen
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Antwort klonen, da sie nur einmal verwendet werden kann
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // Bei Netzwerkfehlern Fallback-Seite anzeigen
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});