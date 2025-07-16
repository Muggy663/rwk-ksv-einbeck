# RWK Einbeck - Native App Setup Dokumentation

## 📱 Übersicht
Verwandlung der bestehenden Next.js Web-App in eine native Android/iOS App mit Capacitor.

## 🛠️ Installation & Setup

### 1. Capacitor Installation
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

### 2. Capacitor Initialisierung
```bash
npx cap init "RWK Einbeck" "de.rwk.einbeck" --web-dir=out
```

### 3. Android-Plattform hinzufügen
```bash
npx cap add android
```

## ⚙️ Konfiguration

### capacitor.config.ts
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.rwk.einbeck',
  appName: 'RWK Einbeck',
  webDir: '.next/static',
  server: {
    url: 'https://rwk-einbeck.vercel.app',
    cleartext: true
  }
};

export default config;
```

### package.json - Neue Scripts
```json
{
  "scripts": {
    "build:capacitor": "set NEXT_CONFIG=capacitor && next build"
  }
}
```

### next.config.js - Capacitor-Modus
```javascript
const isCapacitor = process.env.NEXT_CONFIG === 'capacitor';

const nextConfig = {
  ...(isCapacitor && {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true }
  }),
  // ... rest der config
};
```

## 🔄 Build-Prozess

### 1. Web-App für Capacitor bauen
```bash
npm run build:capacitor
```

### 2. Capacitor synchronisieren
```bash
npx cap sync
```

### 3. Android Studio öffnen
```bash
npx cap open android
```

## 📂 Projektstruktur
```
RWK App Einbeck/
├── android/                 # Android-spezifische Dateien
├── .next/static/            # Web-Assets für Capacitor
├── capacitor.config.ts      # Capacitor-Konfiguration
└── src/                     # Bestehende Next.js App
```

## 🚀 App-Funktionalität

### Hybrid-Ansatz
- **App-Shell**: Native Android/iOS Container
- **Inhalt**: Lädt Web-App von rwk-einbeck.vercel.app
- **Updates**: Automatisch über Web-App (keine neue APK nötig)

### Vorteile
- ✅ Bestehende Codebase wiederverwendbar
- ✅ Automatische Updates für Inhalte
- ✅ Native App-Features möglich
- ✅ Kein App Store nötig

## 📱 Nächste Schritte

### Für APK-Erstellung benötigt:
1. **Android Studio** installieren
2. **Java JDK** (wird mit Android Studio installiert)
3. **Android SDK** konfigurieren

### APK-Build-Prozess:
1. `npx cap open android`
2. In Android Studio: Build → Generate Signed Bundle/APK
3. APK-Datei für Installation bereit

### Verteilung:
- APK-Datei in Dokumente-Bereich hochladen
- QR-Code für einfache Installation
- Anleitung für "Unbekannte Quellen" aktivieren

## 🔧 Troubleshooting

### Häufige Probleme:
- **Build-Fehler**: API-Routes funktionieren nicht im Export-Modus
- **Lösung**: Separate Capacitor-Build-Konfiguration verwenden

### Sync-Probleme:
- **Fehler**: "Could not find web assets directory"
- **Lösung**: Einfache index.html mit Weiterleitung erstellen

## 📊 Update-Strategie

### Automatische Updates (90% der Fälle):
- Neue Dokumente, Ergebnisse, Texte
- Änderungen an der Web-App
- Sofort verfügbar ohne neue APK

### Manuelle Updates (10% der Fälle):
- Neue native Features
- Design-Änderungen an der App-Shell
- Neue APK erforderlich

## 🎯 Fazit
Capacitor ermöglicht es, die bestehende RWK Web-App mit minimalem Aufwand in eine native App zu verwandeln, während die meisten Updates automatisch über die Web-App erfolgen.