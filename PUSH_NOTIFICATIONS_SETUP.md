# 🔔 Push-Notifications Setup Guide

## 1. Firebase Console Konfiguration

### Schritt 1: Web Push Certificate generieren
1. Öffne [Firebase Console](https://console.firebase.google.com)
2. Wähle dein Projekt "rwk-einbeck"
3. Gehe zu **Project Settings** (Zahnrad-Symbol)
4. Klicke auf **Cloud Messaging** Tab
5. Scrolle zu **Web configuration**
6. Klicke auf **Generate key pair** unter "Web Push certificates"
7. Kopiere den generierten **VAPID Key**

### Schritt 2: VAPID Key konfigurieren
Ersetze in `src/lib/services/push-notification-service.ts`:

```typescript
// Get FCM token
const token = await getToken(this.messaging, {
  vapidKey: 'DEIN_VAPID_KEY_HIER'
});
```

## 2. Service Worker vervollständigen

Ersetze `public/firebase-messaging-sw.js` mit:

```javascript
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBqoWGcp-4t2WQEOvjUyHkBft_8TJQOYaI",
  authDomain: "rwk-einbeck.firebaseapp.com",
  projectId: "rwk-einbeck",
  storageBucket: "rwk-einbeck.appspot.com",
  messagingSenderId: "1092527848623",
  appId: "1:1092527848623:web:a5b2c3d4e5f6g7h8i9j0k1"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background Message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'RWK Einbeck';
  const notificationOptions = {
    body: payload.notification?.body || 'Neue Benachrichtigung',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    tag: payload.data?.type || 'general',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
```

## 3. Cloud Functions für Server-side Notifications

Erstelle `functions/src/notifications.ts`:

```typescript
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

export const sendNewsNotification = functions.firestore
  .document('rwk_news/{newsId}')
  .onCreate(async (snap, context) => {
    const newsData = snap.data();
    
    if (newsData.status !== 'veroeffentlicht') return;
    
    const message = {
      notification: {
        title: 'Neue RWK-News',
        body: newsData.title
      },
      data: {
        type: 'news',
        url: `/news`
      },
      topic: 'rwk_news'
    };
    
    await admin.messaging().send(message);
  });

export const sendProtestNotification = functions.firestore
  .document('protests/{protestId}')
  .onCreate(async (snap, context) => {
    const protestData = snap.data();
    
    const message = {
      notification: {
        title: 'Neuer Protest eingereicht',
        body: protestData.title
      },
      data: {
        type: 'protest',
        url: `/protests`
      },
      topic: 'protests'
    };
    
    await admin.messaging().send(message);
  });
```

## 4. Testing

1. Gehe zu `/notifications` in der App
2. Klicke auf "Benachrichtigungen aktivieren"
3. Erlaube Browser-Benachrichtigungen
4. Teste mit Firebase Console → Cloud Messaging → "Send test message"

## 5. Deployment

```bash
# Service Worker deployen
# Datei ist bereits in public/ - wird automatisch deployed

# Cloud Functions deployen (optional)
cd functions
npm run deploy
```

## 🎯 Features nach Setup:

- ✅ **Browser-Benachrichtigungen** für neue News
- ✅ **Push bei Protesten** für Sportausschuss
- ✅ **Ergebnis-Notifications** bei neuen Scores
- ✅ **Termin-Erinnerungen** vor wichtigen Events
- ✅ **Granulare Kontrolle** über Notification-Typen

## 🔧 Troubleshooting:

- **"Permission denied"**: Browser-Einstellungen prüfen
- **"Invalid VAPID key"**: Key aus Firebase Console kopieren
- **Service Worker Fehler**: Browser-Cache leeren
- **No notifications**: Cloud Functions Status prüfen