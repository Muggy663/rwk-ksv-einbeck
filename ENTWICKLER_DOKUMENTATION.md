# Entwicklerdokumentation RWK App Einbeck

## Projektübersicht

Die RWK App Einbeck ist eine Next.js-basierte Webanwendung zur Verwaltung von Rundenwettkämpfen des Kreisschützenverbandes Einbeck. Die Anwendung ermöglicht die Verwaltung von Saisons, Ligen, Vereinen, Mannschaften und Schützen sowie die Erfassung und Auswertung von Wettkampfergebnissen.

## Technologie-Stack

- **Frontend**: Next.js 14 mit React 18, JavaScript/TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore als Datenbank, Firebase Authentication)
- **Hosting**: Vercel
- **Zusätzliche Bibliotheken**:
  - shadcn/ui für UI-Komponenten
  - jsPDF und jspdf-autotable für PDF-Generierung
  - recharts für Diagramme und Visualisierungen
  - date-fns für Datums- und Zeitmanagement
  - lucide-react für Icons

## Projektstruktur

```
/
├── public/              # Statische Dateien (Bilder, Fonts)
│   ├── images/          # Bilder und Logos
│   └── styles/          # Fallback-CSS-Stile
├── src/
│   ├── app/             # Next.js App Router Struktur
│   │   ├── admin/       # Admin-Bereich
│   │   ├── verein/      # Vereinsbereich
│   │   ├── rwk-tabellen/# Öffentliche Tabellen
│   │   ├── statistik/   # Statistik-Dashboard
│   │   ├── termine/     # Terminkalender
│   │   ├── updates/     # Updates & Changelog
│   │   ├── handbuch/    # Benutzerhandbuch
│   │   ├── support/     # Support-Bereich
│   │   └── layout.js    # Root-Layout mit Header
│   ├── components/      # React-Komponenten
│   │   ├── auth/        # Authentifizierungskomponenten
│   │   ├── layout/      # Layout-Komponenten (Header, Footer)
│   │   ├── ui/          # UI-Komponenten (shadcn/ui)
│   │   └── ...          # Weitere Komponenten
│   ├── hooks/           # Custom React Hooks
│   ├── lib/             # Hilfsfunktionen und Services
│   │   ├── firebase/    # Firebase-Konfiguration
│   │   ├── services/    # Service-Module (JS)
│   │   └── utils.ts     # Utility-Funktionen
│   ├── styles/          # Zusätzliche Stile
│   └── types/           # TypeScript-Typdefinitionen und JS-Äquivalente
├── .env.local           # Umgebungsvariablen (nicht im Repository)
├── next.config.js       # Next.js-Konfiguration
├── tailwind.config.js   # Tailwind CSS-Konfiguration
├── postcss.config.js    # PostCSS-Konfiguration
└── package.json         # Projektabhängigkeiten
```

## Datenmodell

Die Anwendung verwendet Firestore als NoSQL-Datenbank mit folgenden Hauptkollektionen:

- **seasons**: Wettkampfsaisons mit Jahr, Disziplin und Status
- **leagues**: Ligen mit Zuordnung zu Saisons und Disziplintypen
- **clubs**: Vereine mit Namen, Kürzel und Vereinsnummer
- **teams**: Mannschaften mit Zuordnung zu Vereinen, Saisons und Ligen
- **shooters**: Schützen mit Zuordnung zu Vereinen
- **results**: Wettkampfergebnisse mit Zuordnung zu Schützen, Mannschaften, Ligen und Durchgängen
- **users**: Benutzerberechtigungen mit Rollen und Vereinszuordnungen
- **events**: Termine und Veranstaltungen
- **support**: Support-Tickets

## Authentifizierung und Berechtigungen

Die Anwendung verwendet Firebase Authentication für die Benutzerverwaltung. Es gibt drei Hauptrollen:

1. **Super-Administrator (Rundenwettkampfleiter)**: Vollzugriff auf alle Funktionen
2. **Vereinsvertreter**: Verwaltung von Mannschaften und Schützen des eigenen Vereins, Ergebniserfassung
3. **Mannschaftsführer**: Ergebniserfassung für Mannschaften des eigenen Vereins

Die Berechtigungen werden in der `users`-Kollektion in Firestore gespeichert und über den `useAuth`-Hook in der Anwendung verfügbar gemacht.

## Wichtige Komponenten und Funktionen

### Header und Navigation

Die Hauptnavigation befindet sich in `src/components/layout/MainNav.tsx` und zeigt je nach Benutzerrolle unterschiedliche Menüpunkte an. Das Logo wurde kürzlich in `src/app/layout.js` hinzugefügt, um es in der oberen linken Ecke anzuzeigen.

### Ergebniserfassung

Die Ergebniserfassung ist ein zentraler Bestandteil der Anwendung und wird über verschiedene Formulare in den Bereichen Admin und Verein implementiert. Die Logik zur Validierung und Speicherung der Ergebnisse befindet sich in den Service-Modulen.

### RWK-Tabellen

Die RWK-Tabellen zeigen die aktuellen Ranglisten der Mannschaften und Einzelschützen an. Die Logik zur Berechnung der Tabellen befindet sich in den entsprechenden Service-Modulen.

### PDF-Export

Die Anwendung unterstützt den Export von Ligaergebnissen und Einzelschützenergebnissen als PDF. Die PDF-Generierung wird mit jsPDF und jspdf-autotable implementiert und befindet sich in `src/lib/services/pdf-service.js`. Folgende PDF-Funktionen sind verfügbar:

- `generateTablePDF`: Generiert ein allgemeines Tabellen-PDF
- `generateLeaguePDF`: Generiert eine Mannschaftstabelle für eine Liga
- `generateShootersPDF`: Generiert eine Einzelschützentabelle für eine Liga
- `generateEmptySeasonTablePDF`: Generiert eine leere Handtabelle mit Kontaktdaten
- `generateGesamtlistePDF`: Generiert eine Gesamtliste für die Kreisoberliga

## JavaScript vs. TypeScript

Das Projekt verwendet eine Mischung aus TypeScript und JavaScript:

- **TypeScript**: Hauptsächlich für Komponenten und Typdefinitionen
- **JavaScript**: Für Konfigurationsdateien und Service-Module

Für die Vercel-Deployment-Kompatibilität wurden folgende Dateien von TypeScript zu JavaScript konvertiert:
- Konfigurationsdateien: `next.config.js`, `tailwind.config.js`, `postcss.config.js`
- Service-Module: Alle Dateien in `src/lib/services/`

Bei JavaScript-Dateien werden JSDoc-Kommentare verwendet, um Typsicherheit zu gewährleisten.

## Vercel-Deployment-Anforderungen

Für ein erfolgreiches Deployment auf Vercel müssen folgende Punkte beachtet werden:

1. **Konfigurationsdateien in JavaScript**: Vercel erwartet Konfigurationsdateien wie `next.config.js` und `tailwind.config.js` im JavaScript-Format, nicht als TypeScript.

2. **Service-Module als JavaScript**: Kritische Service-Module sollten als JavaScript-Dateien mit JSDoc-Typdefinitionen implementiert werden, um Kompatibilitätsprobleme zu vermeiden.

3. **Fallback-CSS**: Es sollten Fallback-CSS-Stile vorhanden sein, falls Tailwind nicht korrekt geladen wird. Diese befinden sich in `public/styles/fallback.css`.

4. **Webpack-Konfiguration**: In `next.config.js` sollte eine Webpack-Konfiguration enthalten sein, die problematische Bibliotheken wie `undici` deaktiviert.

## Aktuelle Entwicklung

Die aktuelle Version ist 0.7.1 mit folgenden Hauptfunktionen:
- Verbesserte Vercel-Kompatibilität durch JavaScript-Konvertierung
- PDF-Export für Ligaergebnisse und Einzelschützenergebnisse
- Handtabellen und Gesamtlisten für Vereine
- Fallback-CSS für verbesserte Zuverlässigkeit

Die nächste Version wird folgende Funktionen enthalten:
- Umfassendes Statistik-Dashboard mit erweiterten Visualisierungen
- Erweiterter Terminkalender mit iCal-Export
- Mobile Optimierung mit Progressive Web App (PWA) Funktionalität

## Hinweise für neue Entwickler

1. **Lokale Entwicklungsumgebung**: 
   - Repository klonen
   - `npm install` ausführen
   - `.env.local` mit Firebase-Konfiguration erstellen
   - `npm run dev` für den Entwicklungsserver starten

2. **Firebase-Konfiguration**:
   - Firestore-Regeln beachten (siehe `firestore.rules`)
   - Authentifizierungsmethoden sind auf E-Mail/Passwort beschränkt

3. **Deployment**:
   - Die Anwendung wird auf Vercel gehostet
   - Automatisches Deployment bei Push auf den main-Branch
   - Umgebungsvariablen müssen in der Vercel-Projektkonfiguration gesetzt werden
   - Konfigurationsdateien müssen im JavaScript-Format vorliegen

4. **Bekannte Probleme**:
   - Die Anwendung verwendet derzeit keine Caching-Strategie für Firestore-Abfragen
   - Die Ladezeiten können bei großen Datenmengen langsam sein
   - Die mobile Ansicht ist noch nicht vollständig optimiert

5. **Nächste Schritte**:
   - Implementierung des Statistik-Dashboards
   - Erweiterung der Terminkalender-Funktionalität
   - Mobile Optimierung
   - Verbesserung der Benutzerberechtigungen
   - Einführung von automatisierten Tests

## Kontakt

Bei Fragen zur Entwicklung wenden Sie sich bitte an den Rundenwettkampfleiter des Kreisschützenverbandes Einbeck.