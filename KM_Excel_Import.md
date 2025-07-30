# Import von Mitgliederdaten für Kreismeisterschaftsmeldungen

## Konzept: Excel-Import für Mitgliederdaten

### Ausgangssituation
- Vorhandene Excel-Liste aller Mitglieder im Kreisverband mit Vereinszuordnung
- Bedarf an effizienter Erstbefüllung des Systems ohne manuelle Neueingabe

### Importprozess

1. **Datenaufbereitung**
   - Prüfung und Standardisierung der Excel-Datei
   - Festlegung der Mindestdaten (Name, Vorname, Geburtsdatum, Geschlecht, Verein)
   - Optional: Ergänzung um Mitgliedsnummer, Kontaktdaten, etc.

2. **Import-Funktionalität**
   - Upload-Funktion für Excel-Dateien im Admin-Bereich
   - Mapping-Assistent zur Zuordnung der Excel-Spalten zu Datenbankfeldern
   - Vorschau der zu importierenden Daten mit Validierungsergebnissen

3. **Validierung und Fehlerbehandlung**
   - Prüfung auf Vollständigkeit der Pflichtfelder
   - Erkennung von Duplikaten (basierend auf Name + Geburtsdatum)
   - Prüfung der Vereinszugehörigkeit
   - Fehlerprotokoll für manuelle Nachbearbeitung

4. **Datenintegration**
   - Anlage der Schützen in der Datenbank
   - Automatische Zuordnung zu Vereinen
   - Generierung eindeutiger IDs für jeden Schützen

### Datenmodell für Mehrfachmeldungen

```
+----------------+       +----------------+       +----------------+
| Schütze        |       | Meldung        |       | Disziplin      |
+----------------+       +----------------+       +----------------+
| id             |<----->| schütze_id     |       | id             |
| vorname        |       | disziplin_id   |<----->| name           |
| nachname       |       | wettkampfkl_id |       | ...            |
| geburtsdatum   |       | lm_teilnahme   |       |                |
| geschlecht     |       | ...            |       |                |
| verein_id      |       |                |       |                |
+----------------+       +----------------+       +----------------+
```

- Ein Schütze kann mehrere Meldungen haben (1:n-Beziehung)
- Jede Meldung bezieht sich auf genau eine Disziplin
- Dadurch können beliebig viele Disziplinen pro Schütze erfasst werden

### Benutzeroberfläche für Mehrfachmeldungen

- Vereinsadmins sehen ihre importierten Schützen in einer Liste
- Für jeden Schützen können mehrere Disziplinen ausgewählt werden
- Übersichtliche Darstellung aller Meldungen eines Schützen
- Einfaches Hinzufügen und Entfernen von Disziplinen

### Vorteile des Excel-Imports

1. **Zeitersparnis**
   - Keine manuelle Neueingabe aller Schützen notwendig
   - Schnelle Erstbefüllung des Systems
   - Vereinsadmins müssen nur noch Disziplinen zuordnen

2. **Datenqualität**
   - Einheitliche Datenbasis von Beginn an
   - Vermeidung von Tippfehlern und Duplikaten
   - Konsistente Vereinszuordnung

3. **Benutzerakzeptanz**
   - Geringerer Initialaufwand für Vereine
   - Positive Nutzererfahrung von Beginn an
   - Höhere Bereitschaft zur Systemnutzung

### Technische Umsetzung

- Entwicklung eines Excel-Parsers mit PHP/Laravel oder Node.js
- Validierungslogik für die importierten Daten
- Transaktionale Verarbeitung (alles oder nichts)
- Protokollierung des Importvorgangs

### Aufwandsschätzung

| Aufgabe | Aufwand (Tage) |
|---------|----------------|
| Entwicklung des Excel-Parsers | 2 |
| Mapping-Assistent | 1 |
| Validierungslogik | 1 |
| Datenintegration | 1 |
| Tests und Fehlerbehandlung | 1 |
| **Gesamt** | **6** |

### Nächste Schritte

1. Analyse der vorhandenen Excel-Datei (Struktur, Vollständigkeit)
2. Definition des Datenmodells für den Import
3. Entwicklung des Import-Tools
4. Testlauf mit einer Teilmenge der Daten
5. Vollständiger Import und Qualitätssicherung