# RWK Einbeck App - Version 0.9.9

Eine moderne Web-Anwendung für die Verwaltung von Rundenwettkämpfen im Schießsport.

## 🚀 Neue Features in Version 0.9.9

### 📧 Vollständiges E-Mail-System
- **Rundschreiben-Verwaltung** mit Kontakten und Gruppen
- **Anhang-Funktion** für PDF, Word-Dokumente und Bilder
- **Liga-Filter** für zielgerichtete Kommunikation
- **Einzelkontakt-Auswahl** zusätzlich zu Gruppen
- **Resend-Integration** mit eigener Domain (rwk-einbeck.de)

### 📊 Error-Monitoring
- **Sentry-Integration** für automatische Fehlerüberwachung
- **E-Mail-Benachrichtigungen** bei kritischen Fehlern
- **Performance-Tracking** für Optimierungen
- **Detaillierte Fehler-Logs** mit Browser/OS-Informationen

### 📱 PWA-Verbesserungen
- **Automatischer Install-Prompt** nach 30 Sekunden
- **Offline-Status-Anzeige** bei Verbindungsproblemen
- **Verbessertes App-Manifest** mit Kategorien
- **Service Worker** für bessere Performance

## 🛠️ Setup & Installation

### Voraussetzungen
- Node.js 18+
- Firebase-Projekt
- Resend-Account mit eigener Domain

### Installation
```bash
# Repository klonen
git clone [repository-url]
cd rwk-app-einbeck

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env.local
```

### Umgebungsvariablen (.env.local)
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# E-Mail Service (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@your-domain.de

# Error Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://your_dsn@sentry.io/project_id
```

### Domain-Setup für E-Mails
1. **Domain bei Resend hinzufügen:** https://resend.com/domains
2. **DNS-Records setzen** (SPF, DKIM, DMARC)
3. **Domain-Verifikation abwarten** (24-48h)
4. **E-Mail-Adresse in .env.local konfigurieren**

### Entwicklung starten
```bash
npm run dev
```

## 📋 Features

### Wettkampf-Verwaltung
- **Liga-Management** mit flexiblen Schusszahlen
- **Alle Disziplinen** (KK, LG, LP, Benutzerdefiniert)
- **Tabellen-Generierung** mit Statistiken
- **Ergebnis-Eingabe** mit Validierung

### Benutzer-Management
- **Rollen-System** (Admin, Mannschaftsführer, Vereinsvertreter)
- **Kontakt-Verwaltung** für E-Mail-System
- **Gruppen-Organisation** nach Rollen und Ligen

### Admin-Bereich
- **E-Mail-System** für Rundschreiben
- **Benutzer-Verwaltung** mit Rollen
- **Liga-Konfiguration** und Einstellungen
- **Statistiken** und Analytics

## 🔒 Sicherheit

- **OWASP-Scan bestanden** (0 kritische Schwachstellen)
- **Firebase Security Rules** korrekt konfiguriert
- **Input-Validierung** auf Client und Server
- **Error-Handling** ohne Datenpreisgabe

## 📈 Performance

- **Firestore-Indizes** optimiert
- **Batch-Loading** für große Datensätze
- **Caching-Strategien** implementiert
- **Bundle-Optimierung** für schnelle Ladezeiten

## 🚀 Deployment

### Vercel (Empfohlen)
```bash
# Vercel CLI installieren
npm i -g vercel

# Deployment
vercel --prod
```

### Umgebungsvariablen in Vercel setzen
- Alle .env.local Variablen in Vercel Dashboard eintragen
- Domain-Konfiguration für E-Mail-Versand prüfen

## 📞 Support

Bei Fragen oder Problemen:
- **E-Mail:** rwk-leiter-ksv@gmx.de
- **Sentry-Dashboard:** Automatische Fehlerbenachrichtigungen
- **Updates:** Über integriertes Update-System

## 📄 Lizenz

Dieses Projekt ist für den RWK Einbeck entwickelt und nicht für kommerzielle Nutzung bestimmt.

---

**Version 0.9.9** - Vollständiges E-Mail-System mit Error-Monitoring