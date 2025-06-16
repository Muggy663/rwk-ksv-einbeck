# "Außer Konkurrenz"-Status für Teams

## Übersicht
Diese Funktion ermöglicht es, Teams als "außer Konkurrenz" zu kennzeichnen. Diese Teams nehmen an Wettkämpfen teil, werden aber nicht in der offiziellen Wertung berücksichtigt.

## Implementierte Änderungen

### 1. Datenmodell
- Team-Interface in `src/types/rwk.ts`:
  - `outOfCompetition?: boolean`
  - Vereinfachtes Modell ohne Begründungsfeld
- Separates `TeamCompetitionStatus`-Interface für Wiederverwendbarkeit

### 2. Datenmigration
- Migrationsfunktion in `src/lib/migrations/team-out-of-competition-migration.ts`
- Admin-Seite unter `/admin/migrations` zur Ausführung der Migration

### 3. UI-Komponenten
- Bestehende `TeamStatusBadge`-Komponente zeigt "AK"-Badge mit Tooltip
- Integration in `virtualized-team-table.js` für Tabellendarstellung

### 4. Admin-Bereich
- Erweiterung der Mannschaftsverwaltung:
  - Checkbox für "Außer Konkurrenz"-Status
  - Visuelle Hervorhebung mit amber-Farben
  - Verbesserte Speicherfunktion für zuverlässiges Speichern
  - Beibehaltung der Saison-Auswahl nach dem Speichern

## Nächste Schritte
1. **Ranglisten-Berechnung anpassen**
   - Kennzeichnung und optionale Filterung in der Rangliste

2. **Statistiken anpassen**
   - Berücksichtigung des Status in Statistiken

3. **PDF-Exporte anpassen**
   - Anzeige des Status in PDF-Exporten

## Testfälle
1. Team als "außer Konkurrenz" markieren und Grund angeben
2. Korrekte Anzeige des AK-Badges und Tooltips in Tabellen
3. Erfolgreiche Migration bestehender Teams