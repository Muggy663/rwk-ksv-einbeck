# Entwicklerdokumentation RWK App Einbeck

## Projektübersicht

Die RWK App Einbeck ist eine Next.js-basierte Webanwendung zur Verwaltung von Rundenwettkämpfen des Kreisschützenverbandes Einbeck. Die Anwendung ermöglicht die Verwaltung von Saisons, Ligen, Vereinen, Mannschaften und Schützen sowie die Erfassung und Auswertung von Wettkampfergebnissen.

## Technologie-Stack

- **Frontend**: Next.js 14 mit React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore als Datenbank, Firebase Authentication)
- **Hosting**: Vercel
- **Zusätzliche Bibliotheken**:
  - shadcn/ui für UI-Komponenten
  - react-pdf für PDF-Generierung
  - recharts für Diagramme und Visualisierungen
  - date-fns für Datums- und Zeitmanagement
  - lucide-react für Icons

## Projektstruktur

```
/
├── public/              # Statische Dateien (Bilder, Fonts)
│   ├── images/          # Bilder und Logos
│   └── fonts/           # Schriftarten
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
│   │   └── layout.tsx   # Root-Layout mit Header
│   ├── components/      # React-Komponenten
│   │   ├── auth/        # Authentifizierungskomponenten
│   │   ├── layout/      # Layout-Komponenten (Header, Footer)
│   │   ├── ui/          # UI-Komponenten (shadcn/ui)
│   │   └── ...          # Weitere Komponenten
│   ├── hooks/           # Custom React Hooks
│   ├── lib/             # Hilfsfunktionen und Services
│   │   ├── services/    # Firebase-Services
│   │   └── utils.ts     # Utility-Funktionen
│   └── types/           # TypeScript-Typdefinitionen
├── .env.local           # Umgebungsvariablen (nicht im Repository)
├── next.config.js       # Next.js-Konfiguration
├── tailwind.config.js   # Tailwind CSS-Konfiguration
├── tsconfig.json        # TypeScript-Konfiguration
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

Die Hauptnavigation befindet sich in `src/components/layout/MainNav.tsx` und zeigt je nach Benutzerrolle unterschiedliche Menüpunkte an. Das Logo wurde kürzlich in `src/app/layout.tsx` hinzugefügt, um es in der oberen linken Ecke anzuzeigen.

### Ergebniserfassung

Die Ergebniserfassung ist ein zentraler Bestandteil der Anwendung und wird über verschiedene Formulare in den Bereichen Admin und Verein implementiert. Die Logik zur Validierung und Speicherung der Ergebnisse befindet sich in `src/lib/services/results-service.ts`.

### RWK-Tabellen

Die RWK-Tabellen zeigen die aktuellen Ranglisten der Mannschaften und Einzelschützen an. Die Logik zur Berechnung der Tabellen befindet sich in `src/lib/services/tables-service.ts`.

### PDF-Export

Die Anwendung unterstützt den Export von Ligaergebnissen und Einzelschützenergebnissen als PDF. Die PDF-Generierung wird mit react-pdf implementiert und befindet sich in `src/components/pdf/`.

## Aktuelle Entwicklung

Die aktuelle Version ist 0.6.5 mit folgenden Hauptfunktionen:
- PDF-Export für Ligaergebnisse und Einzelschützenergebnisse
- Druckfreundliche Darstellung der Tabellen
- Logo in der oberen linken Ecke der Anwendung

Die nächste Version 0.7.0 wird folgende Funktionen enthalten:
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