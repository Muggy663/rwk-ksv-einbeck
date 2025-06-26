# Copyright Header für Code-Dateien

## Standard Header für neue Dateien:

```javascript
/*
 * Copyright (c) 2025 Marcel Bünger für den KSV Einbeck
 * Alle Rechte vorbehalten.
 * 
 * Diese Software und der zugehörige Code sind urheberrechtlich geschützt.
 * Jede Vervielfältigung, Verbreitung oder Nutzung ohne ausdrückliche 
 * schriftliche Genehmigung von Marcel Bünger ist untersagt.
 * 
 * RWK App Einbeck - Rundenwettkampf Verwaltungssystem
 * Entwickelt für den Kreisschützenverband Einbeck
 */
```

## Kurzer Header für kleinere Dateien:

```javascript
// Copyright (c) 2025 Marcel Bünger für den KSV Einbeck. All rights reserved.
```

## Wichtige Dateien, die einen Header erhalten sollten:

### Core-Dateien:
- src/app/layout.tsx
- src/app/page.tsx
- src/lib/services/* (alle Service-Dateien)
- src/components/layout/* (Layout-Komponenten)

### Admin-Bereich:
- src/app/admin/dashboard/page.tsx
- src/app/admin/*/page.tsx (wichtige Admin-Seiten)

### API-Endpunkte:
- src/app/api/*/route.ts (alle API-Routen)

### Konfigurationsdateien:
- next.config.js
- tailwind.config.js
- package.json (bereits mit Copyright in Metadaten)

## Rechtliche Klarstellung:

**Urheber**: Marcel Bünger (Rundenwettkampfleiter)
**Auftraggeber**: KSV Einbeck
**Nutzungsrecht**: KSV Einbeck hat das Recht zur Nutzung der Software
**Urheberrecht**: Verbleibt bei Marcel Bünger

## Automatisierung:

Für zukünftige Dateien kann ein Pre-Commit-Hook eingerichtet werden, 
der automatisch Copyright-Header hinzufügt.