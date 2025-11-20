// Service Worker für Push-Notifications
const CACHE_NAME = 'rwk-einbeck-v1';

// Install Event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

// Push Event - Empfange Push-Notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'RWK Einbeck',
        body: event.data.text() || 'Neue Benachrichtigung',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png'
      };
    }
  }

  const options = {
    title: notificationData.title || 'RWK Einbeck',
    body: notificationData.body || 'Neue Benachrichtigung',
    icon: notificationData.icon || '/icons/icon-192x192.png',
    badge: notificationData.badge || '/icons/badge-72x72.png',
    tag: notificationData.tag || 'rwk-notification',
    data: notificationData.data || {},
    actions: notificationData.actions || [
      {
        action: 'open',
        title: 'Öffnen'
      },
      {
        action: 'close',
        title: 'Schließen'
      }
    ],
    requireInteraction: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Öffne die App oder fokussiere sie
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Prüfe ob die App bereits geöffnet ist
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Öffne neue Instanz
      if (self.clients.openWindow) {
        const targetUrl = event.notification.data?.url || '/notifications';
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Background Sync für Offline-Funktionalität
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Hier könnten offline gespeicherte Daten synchronisiert werden
      Promise.resolve()
    );
  }
});

// Fetch Event für Caching (optional)
self.addEventListener('fetch', (event) => {
  // Einfaches Netzwerk-First Caching für API-Calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Erfolgreiche Antwort - optional cachen
          return response;
        })
        .catch(() => {
          // Netzwerk-Fehler - aus Cache laden falls verfügbar
          return caches.match(event.request);
        })
    );
  }
});