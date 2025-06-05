# Vercel Deployment Guide für RWK App Einbeck

Diese Dokumentation beschreibt die Anforderungen und Best Practices für das Deployment der RWK App Einbeck auf Vercel.

## Grundlegende Anforderungen

Für ein erfolgreiches Deployment auf Vercel müssen folgende Anforderungen erfüllt sein:

### 1. Konfigurationsdateien im JavaScript-Format

Vercel erwartet Konfigurationsdateien im JavaScript-Format, nicht als TypeScript. Folgende Dateien müssen als `.js` vorliegen:

- `next.config.js` (nicht `next.config.ts`)
- `tailwind.config.js` (nicht `tailwind.config.ts`)
- `postcss.config.js` (nicht `postcss.config.mjs`)

**Beispiel für next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Lösung für das undici-Problem mit privaten Klassenfeldern
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      undici: false, // Deaktiviert undici und verwendet den Node.js-Fetch
    };
    return config;
  },
};

module.exports = nextConfig;
```

### 2. Service-Module als JavaScript

Kritische Service-Module sollten als JavaScript-Dateien mit JSDoc-Typdefinitionen implementiert werden:

- `calendar-service.js`
- `statistics-service.js`
- `pdf-service.js`
- `updates-service.js`

**Beispiel für JSDoc-Typdefinitionen:**
```javascript
/**
 * @typedef {Object} Event
 * @property {string} [id]
 * @property {string} title
 * @property {Date} date
 * @property {string} time
 */

/**
 * Lädt Termine aus der Datenbank
 * @param {Date} [startDate] - Startdatum für die Filterung
 * @param {Date} [endDate] - Enddatum für die Filterung
 * @returns {Promise<Event[]>} Liste der Termine
 */
export async function fetchEvents(startDate, endDate) {
  // Implementierung
}
```

### 3. Fallback-CSS für Tailwind

Um Probleme mit der Tailwind-Kompilierung zu vermeiden, sollten Fallback-CSS-Stile vorhanden sein:

- Erstellen Sie eine `fallback.css` in `public/styles/`
- Binden Sie diese in `src/app/layout.js` ein

**Beispiel für Einbindung:**
```javascript
<head>
  <Script src="/disable-onboarding.js" strategy="beforeInteractive" />
  {/* Fallback CSS für den Fall, dass Tailwind nicht richtig lädt */}
  <link rel="stylesheet" href="/styles/fallback.css" />
</head>
```

### 4. Webpack-Konfiguration für problematische Bibliotheken

In `next.config.js` sollte eine Webpack-Konfiguration enthalten sein, die problematische Bibliotheken wie `undici` deaktiviert:

```javascript
webpack: (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    undici: false, // Deaktiviert undici und verwendet den Node.js-Fetch
  };
  return config;
}
```

## Deployment-Prozess

1. **Vorbereitung:**
   - Stellen Sie sicher, dass alle Konfigurationsdateien im JavaScript-Format vorliegen
   - Überprüfen Sie, dass alle kritischen Service-Module als JavaScript implementiert sind
   - Fügen Sie Fallback-CSS-Stile hinzu

2. **Deployment:**
   - Pushen Sie die Änderungen in das GitHub-Repository
   - Vercel wird automatisch ein neues Deployment starten
   - Überwachen Sie den Build-Prozess auf Fehler

3. **Fehlerbehebung:**
   - Bei Build-Fehlern prüfen Sie die Vercel-Logs
   - Häufige Probleme sind fehlende Abhängigkeiten oder TypeScript-Konfigurationsdateien
   - Beheben Sie die Fehler lokal und pushen Sie die Änderungen erneut

## Bekannte Probleme und Lösungen

### Problem: "Configuring Next.js via 'next.config.ts' is not supported"
**Lösung:** Konvertieren Sie `next.config.ts` zu `next.config.js`

### Problem: "Module parse failed: Unexpected token (#target)"
**Lösung:** Fügen Sie die Webpack-Konfiguration hinzu, um `undici` zu deaktivieren

### Problem: "Module not found: Can't resolve '@/lib/services/calendar-service'"
**Lösung:** Erstellen Sie die fehlenden Service-Module als JavaScript-Dateien

### Problem: "Module not found: Can't resolve '@radix-ui/react-radio-group'"
**Lösung:** Fügen Sie die fehlenden Abhängigkeiten in `package.json` hinzu und führen Sie `npm install` aus

### Problem: Fehlende Formatierung und Stile auf der Vercel-Seite
**Lösung:** Fügen Sie Fallback-CSS-Stile hinzu und stellen Sie sicher, dass die Tailwind-Konfiguration korrekt ist

## Best Practices

1. **Verwenden Sie JavaScript für Konfigurationsdateien:**
   - Alle Konfigurationsdateien sollten im JavaScript-Format vorliegen
   - Verwenden Sie JSDoc-Kommentare für Typdefinitionen

2. **Implementieren Sie kritische Service-Module als JavaScript:**
   - Service-Module, die für die Kernfunktionalität wichtig sind, sollten als JavaScript implementiert werden
   - Verwenden Sie JSDoc-Typdefinitionen für Typsicherheit

3. **Fügen Sie Fallback-Stile hinzu:**
   - Stellen Sie sicher, dass die Anwendung auch funktioniert, wenn Tailwind nicht korrekt geladen wird
   - Implementieren Sie grundlegende Stile für die wichtigsten UI-Elemente

4. **Testen Sie lokal vor dem Deployment:**
   - Verwenden Sie `next build` und `next start`, um die Produktionsversion lokal zu testen
   - Überprüfen Sie, ob alle Funktionen wie erwartet funktionieren

5. **Überwachen Sie die Vercel-Logs:**
   - Überprüfen Sie die Logs nach jedem Deployment
   - Beheben Sie Fehler sofort, um die Verfügbarkeit der Anwendung zu gewährleisten