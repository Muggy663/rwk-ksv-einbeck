# Entwicklungsdokumentation RWK App Einbeck

Diese Dokumentation dient als Gedächtnisstütze für die Entwicklung und enthält wichtige Informationen über die Implementierung, Struktur und Änderungen der Anwendung.

## Projektstruktur

- Next.js Anwendung mit TypeScript
- Firebase/Firestore als Datenbank
- Tailwind CSS für Styling
- shadcn/ui für UI-Komponenten

## Wichtige Sammlungen in Firestore

- `seasons`: Saisons mit Status "Laufend"
- `clubs`: Vereine
- `rwk_leagues`: Ligen
- `rwk_teams`: Mannschaften
- `rwk_shooters`: Schützen
- `rwk_scores`: Ergebnisse
- `events`: Termine
- `user_permissions`: Benutzerberechtigungen

## Implementierte Features

### "Außer Konkurrenz"-Status für Teams (2024-06-XX)

- Teams können als "außer Konkurrenz" markiert werden
- Anzeige eines "AK"-Badges in Tabellen
- Implementierung in `src/types/rwk.ts`, `src/components/teams/TeamStatusBadge.tsx`
- Migrationsfunktion in `src/lib/migrations/team-out-of-competition-migration.ts`
- Admin-Seite für Migration unter `/admin/migrations`
- Dokumentation in `IMPLEMENTIERUNG_AUSSER_KONKURRENZ_STATUS.md`

### Bugfix: RWK-Tabellen können vollständig minimiert werden (2024-06-XX)

- Problem: In der RWK-Tabellen-Ansicht konnten nicht alle Liga-Tabellen geschlossen werden
- Lösung: Eigene `ManualAccordion`-Komponente implementiert in `src/app/rwk-tabellen/manual-accordion.tsx`
- Ersetzt die Radix UI Accordion-Komponenten in der RWK-Tabellen-Seite
- Erlaubt das Schließen aller Elemente ohne Einschränkungen

### Verbesserung: "Nicht zugewiesen" Filter für Ligen (2024-06-XX)

- In der Mannschaftsverwaltung unter `/admin/teams` hinzugefügt
- Ermöglicht schnelle Übersicht über Teams ohne Liga-Zuordnung
- Implementiert in `src/app/admin/teams/page.tsx`

## Laufende Entwicklungen

- Anpassung der Ranglisten-Berechnung für "Außer Konkurrenz"-Teams
- Anpassung der Statistiken für "Außer Konkurrenz"-Teams
- Anpassung der PDF-Exporte für "Außer Konkurrenz"-Teams

## Bekannte Probleme

- Keine bekannten Probleme zum aktuellen Zeitpunkt

## Technische Schulden

- Refactoring der Tabellen-Komponenten für bessere Performance
- Vereinheitlichung der Styling-Konventionen

## Nützliche Befehle

- Entwicklungsserver starten: `npm run dev`
- Build erstellen: `npm run build`
- Tests ausführen: `npm test`