// Firebase Messaging Service Worker
importScripts('/sw-config.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase config - loaded from environment
const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || "AIzaSyBlcJpndITalBIoqtXSOvefgfRQoBl6_0c",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "ksv-einbeck-app.firebaseapp.com",
  projectId: self.FIREBASE_PROJECT_ID || "ksv-einbeck-app",
  storageBucket: self.FIREBASE_STORAGE_BUCKET || "ksv-einbeck-app.appspot.com",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "110556513204",
  appId: self.FIREBASE_APP_ID || "1:110556513204:web:a78cd3a6c92d27e825a8e1"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('Background Message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'RWK Einbeck';
  const notificationOptions = {
    body: payload.notification?.body || 'Neue Benachrichtigung',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Öffnen'
      },
      {
        action: 'dismiss',
        title: 'Schließen'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Open app or specific page
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});