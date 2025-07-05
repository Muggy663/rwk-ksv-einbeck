# 🚀 Deployment-Guide - RWK Einbeck App v0.9.9

## 📋 Voraussetzungen

### Services einrichten:
1. **Firebase-Projekt** mit Firestore
2. **Resend-Account** mit Domain-Verifikation
3. **Sentry-Projekt** für Error-Monitoring
4. **Vercel-Account** für Hosting

## 🔧 Lokale Entwicklung

### 1. Repository klonen
```bash
git clone [repository-url]
cd rwk-app-einbeck
npm install
```

### 2. Umgebungsvariablen (.env.local)
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# E-Mail Service (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@rwk-einbeck.de

# Error Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://your_dsn@sentry.io/project_id

# Development
NODE_ENV=development
```

### 3. Entwicklungsserver starten
```bash
npm run dev
```

## 🌐 Production Deployment

### Vercel Deployment

#### 1. Vercel CLI installieren
```bash
npm i -g vercel
```

#### 2. Projekt verknüpfen
```bash
vercel login
vercel link
```

#### 3. Umgebungsvariablen setzen
```bash
# Firebase
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID

# E-Mail & Monitoring
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
vercel env add NEXT_PUBLIC_SENTRY_DSN
```

#### 4. Deployment
```bash
vercel --prod
```

## 📧 E-Mail-Setup (Resend)

### 1. Domain bei Resend hinzufügen
- Gehe zu: https://resend.com/domains
- Klicke "Add Domain"
- Gib `rwk-einbeck.de` ein

### 2. DNS-Records setzen
Resend zeigt dir die nötigen DNS-Einträge:

```dns
# SPF Record
TXT @ "v=spf1 include:_spf.resend.com ~all"

# DKIM Record
CNAME resend._domainkey "resend._domainkey.resend.com"

# DMARC Record (optional)
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@rwk-einbeck.de"
```

### 3. Verifikation abwarten
- Kann 24-48 Stunden dauern
- Status bei Resend prüfen
- Test-E-Mail senden

## 📊 Sentry Error-Monitoring

### 1. Sentry-Projekt erstellen
- Gehe zu: https://sentry.io
- Neues Projekt: "Next.js"
- DSN kopieren

### 2. E-Mail-Benachrichtigungen
- Project Settings → Alerts
- "Send a notification for high priority issues"
- E-Mail-Adresse hinzufügen

### 3. Performance-Monitoring
- Performance → Settings
- Sample Rate: 10% (Development), 1% (Production)

## 🔒 Firebase Security Rules

### Firestore Rules aktualisieren:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Benutzer-Berechtigungen
    match /user_permissions/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.role == 'admin');
    }
    
    // E-Mail-Kontakte (nur Admin)
    match /email_contacts/{contactId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.role == 'admin';
    }
    
    // E-Mail-Historie (nur Admin)
    match /email_history/{emailId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## ✅ Deployment-Checkliste

### Vor dem Deployment:
- [ ] Alle Umgebungsvariablen gesetzt
- [ ] Firebase Security Rules aktualisiert
- [ ] Resend Domain verifiziert
- [ ] Sentry-Projekt konfiguriert
- [ ] `npm run build` erfolgreich
- [ ] Tests durchgeführt

### Nach dem Deployment:
- [ ] E-Mail-System testen
- [ ] Error-Monitoring prüfen
- [ ] PWA-Installation testen
- [ ] Performance-Metriken prüfen
- [ ] Backup-Strategie implementieren

## 🔄 Updates & Wartung

### Regelmäßige Aufgaben:
- **Wöchentlich:** Sentry-Fehler prüfen
- **Monatlich:** Performance-Metriken analysieren
- **Quartalsweise:** Dependencies aktualisieren
- **Jährlich:** Security-Audit durchführen

### Update-Prozess:
```bash
# Lokale Änderungen testen
npm run dev

# Build testen
npm run build

# Deployment
vercel --prod
```

## 📞 Support & Monitoring

### Monitoring-URLs:
- **App:** https://rwk-einbeck.vercel.app
- **Sentry:** https://sentry.io/organizations/your-org/projects/
- **Resend:** https://resend.com/emails
- **Vercel:** https://vercel.com/dashboard

### Bei Problemen:
1. **Sentry-Dashboard** für Fehler-Details
2. **Vercel-Logs** für Deployment-Probleme
3. **Resend-Logs** für E-Mail-Probleme
4. **Firebase-Console** für Datenbank-Issues

---

**Version 0.9.9** - Vollständiges E-Mail-System mit Error-Monitoring