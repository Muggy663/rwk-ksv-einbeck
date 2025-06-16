# RWK App Einbeck

Die digitale Plattform für die Rundenwettkämpfe des Kreisschützenverbandes Einbeck e.V.

## Technologie-Stack

- **Frontend**: Next.js 14 mit TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Hosting**: Vercel

## Entwicklung

### Voraussetzungen

- Node.js (v18 oder höher)
- npm oder yarn

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd RWK-App-Einbeck

# Abhängigkeiten installieren
npm install
# oder
yarn install
```

### Entwicklungsserver starten

```bash
npm run dev
# oder
yarn dev
```

Die Anwendung ist dann unter [http://localhost:3000](http://localhost:3000) verfügbar.

### Tests ausführen

```bash
npm run test
# oder
yarn test

# Tests mit Watch-Modus
npm run test:watch
# oder
yarn test:watch

# Tests mit Coverage-Report
npm run test:coverage
# oder
yarn test:coverage
```

### Linting und Formatierung

```bash
# Linting durchführen
npm run lint
# oder
yarn lint

# Code formatieren
npm run format
# oder
yarn format

# TypeScript-Typprüfung
npm run type-check
# oder
yarn type-check
```

## TypeScript

Das Projekt verwendet TypeScript für bessere Typsicherheit und Entwicklererfahrung. Die TypeScript-Konfiguration ist für maximale Typsicherheit optimiert mit aktivierten strengen Prüfungen.

### Wichtige TypeScript-Dateien

- `src/types/` - Zentrale Typdefinitionen
  - `index.ts` - Allgemeine Typen und Utility-Types
  - `rwk.ts` - Domänenspezifische Typen für Rundenwettkämpfe
  - `documents.ts` - Typen für Dokumente
  - `updates.ts` - Typen für Updates
- `src/utils/type-guards.ts` - Type Guards für Laufzeittypchecks

### Best Practices

- Verwende explizite Typen für Props und State
- Nutze Interfaces für Datenstrukturen
- Definiere Union Types für begrenzte Werte
- Verwende generische Typen für wiederverwendbare Komponenten
- Nutze Type Guards für sichere Typprüfungen zur Laufzeit

## Performance-Optimierungen

Das Projekt enthält verschiedene Utilities für Performance-Optimierungen:

- `src/utils/performance.ts` - Hooks für Debounce und Throttle
- `src/utils/memoization.ts` - Utilities für die Memoization von Komponenten und Funktionen

## Projektstruktur

```
RWK-App-Einbeck/
├── public/            # Statische Dateien
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React-Komponenten
│   ├── hooks/         # Custom React Hooks
│   ├── lib/           # Bibliotheken und Dienste
│   ├── styles/        # CSS-Dateien
│   ├── types/         # TypeScript-Typdefinitionen
│   └── utils/         # Hilfsfunktionen
│       ├── date-utils.ts      # Datum-Utilities
│       ├── memoization.ts     # Memoization-Utilities
│       ├── performance.ts     # Performance-Utilities
│       ├── string-utils.ts    # String-Utilities
│       ├── test-utils.tsx     # Test-Utilities
│       └── type-guards.ts     # Type Guards
├── .eslintrc.json     # ESLint-Konfiguration
├── .prettierrc        # Prettier-Konfiguration
├── jest.config.js     # Jest-Konfiguration
├── jest.setup.js      # Jest-Setup
├── next.config.js     # Next.js-Konfiguration
├── tailwind.config.js # Tailwind-Konfiguration
├── tsconfig.json      # TypeScript-Konfiguration
└── tsconfig.jest.json # TypeScript-Konfiguration für Tests
```

## Testing

Das Projekt verwendet Jest und React Testing Library für Tests. Die Test-Utilities in `src/utils/test-utils.tsx` bieten einen benutzerdefinierten Renderer mit allen benötigten Providern.

## Deployment

Die Anwendung wird automatisch auf Vercel deployed, wenn Änderungen in den `main`-Branch gepusht werden. Die TypeScript-Konfiguration ist so eingestellt, dass der Build fehlschlägt, wenn TypeScript-Fehler vorhanden sind.

## Lizenz

Alle Rechte vorbehalten. © KSV Einbeck e.V.