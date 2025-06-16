# Vercel Deployment Guide

Diese Anleitung beschreibt, wie die RWK App Einbeck auf Vercel deployed wird und welche Konfigurationen dabei zu beachten sind.

## Voraussetzungen

- Ein Vercel-Konto (kostenlos verfügbar)
- Git-Repository mit dem Projekt
- Zugriff auf die Firebase-Konfiguration

## Deployment-Prozess

### 1. Projekt auf Vercel importieren

1. Melde dich bei [Vercel](https://vercel.com) an
2. Klicke auf "New Project"
3. Importiere das Git-Repository
4. Wähle "Next.js" als Framework-Preset

### 2. Umgebungsvariablen konfigurieren

Folgende Umgebungsvariablen müssen in den Vercel-Projekteinstellungen konfiguriert werden:

```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
FIREBASE_ADMIN_CLIENT_EMAIL=xxx
FIREBASE_ADMIN_PRIVATE_KEY=xxx
```

> **Wichtig**: Bei `FIREBASE_ADMIN_PRIVATE_KEY` muss der gesamte Private Key inklusive der Zeilenumbrüche eingefügt werden.

### 3. Build-Einstellungen

Die Build-Einstellungen werden automatisch von Vercel erkannt, da wir Next.js verwenden. Die folgenden Befehle werden ausgeführt:

- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install` oder `yarn install`

### 4. TypeScript-spezifische Einstellungen

Mit der Umstellung auf TypeScript müssen folgende Punkte beachtet werden:

- Der Build wird fehlschlagen, wenn TypeScript-Fehler vorhanden sind
- Stelle sicher, dass `tsconfig.json` korrekt konfiguriert ist
- Vercel führt automatisch `tsc --noEmit` aus, um Typfehler zu prüfen

Um TypeScript-Fehler im Build zu ignorieren (nicht empfohlen), kann folgende Umgebungsvariable gesetzt werden:

```
NEXT_TYPESCRIPT_IGNORE_ERRORS=true
```

### 5. Deployment-Domains

Vercel stellt automatisch eine Domain im Format `[project-name].vercel.app` bereit. Zusätzlich können eigene Domains konfiguriert werden:

1. Gehe zu den Projekteinstellungen
2. Wähle "Domains"
3. Füge deine eigene Domain hinzu
4. Folge den Anweisungen zur DNS-Konfiguration

### 6. Deployment-Logs überprüfen

Nach jedem Deployment sollten die Logs auf TypeScript-spezifische Warnungen überprüft werden:

1. Gehe zum Deployment
2. Klicke auf "View Build Logs"
3. Suche nach TypeScript-Warnungen oder -Fehlern

### 7. Automatische Deployments

Vercel deployed automatisch:
- Bei jedem Push in den `main`-Branch
- Bei Pull Requests (als Preview-Deployment)

## Troubleshooting

### TypeScript-Build-Fehler

Wenn der Build aufgrund von TypeScript-Fehlern fehlschlägt:

1. Führe lokal `npm run type-check` aus, um die Fehler zu identifizieren
2. Behebe die Fehler oder füge temporär `// @ts-ignore` hinzu
3. Committe und pushe die Änderungen

### Umgebungsvariablen-Probleme

Wenn Firebase-Verbindungsfehler auftreten:

1. Überprüfe die Umgebungsvariablen in den Vercel-Einstellungen
2. Stelle sicher, dass der Firebase Admin Private Key korrekt formatiert ist
3. Überprüfe, ob die Variablen im Code korrekt verwendet werden

### Performance-Optimierungen

Um die Performance des Deployments zu verbessern:

1. Aktiviere die Vercel Cache-Optimierungen
2. Konfiguriere die `next.config.js` für optimale Build-Zeiten
3. Nutze die Vercel Analytics, um Performance-Probleme zu identifizieren

## Nützliche Befehle

Vor dem Deployment können folgende Befehle lokal ausgeführt werden, um Probleme zu vermeiden:

```bash
# TypeScript-Typprüfung
npm run type-check

# Linting
npm run lint

# Build testen
npm run build
```