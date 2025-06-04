# Agenda für Version 0.7.1

## Fehlerbehebungen
- [x] Vercel-Build-Fehler behoben (next.config.ts zu next.config.js konvertiert)
- [x] Fehlende Radix UI-Abhängigkeiten hinzugefügt
- [x] Service-Module von TypeScript zu JavaScript konvertiert für bessere Kompatibilität
- [x] Tailwind-Konfiguration von TypeScript zu JavaScript konvertiert (tailwind.config.ts → tailwind.config.js)
- [x] PostCSS-Konfiguration aktualisiert (postcss.config.mjs → postcss.config.js)
- [x] Lose page.tsx im Wurzelverzeichnis zu page.js konvertiert

## Zu implementieren
- [ ] Fehlende PDF-Generierungsfunktionen im pdf-service.js implementieren:
  - [ ] `generateEmptySeasonTablePDF` (für /verein/handtabellen/page.tsx)
  - [ ] `generateGesamtlistePDF` (für /verein/handtabellen/page.tsx)
  - [ ] `generateLeaguePDF` (für pdf-export-button.tsx)
  - [ ] `generateShootersPDF` (für pdf-export-button.tsx)

## Verbesserungen
- [ ] Alle verbleibenden TypeScript-Konfigurationsdateien zu JavaScript konvertieren
- [ ] Überprüfen und sicherstellen, dass alle CSS-Stile korrekt geladen werden

## Neue Features

## Dokumentation
- [ ] Aktualisierung der Entwicklerdokumentation bezüglich der JavaScript-Service-Module
- [ ] Dokumentation der Vercel-Deployment-Anforderungen (JS statt TS für Konfigurationsdateien)