# Upgrade-Plan für Version 0.6.1

## Übersicht
Dieses Dokument beschreibt den Plan für das Upgrade der RWK Einbeck App von Version 0.6.0 auf Version 0.6.1. Die Hauptziele dieser Version sind die Verbesserung der PDF-Funktionalität, die Integration des Vorjahresdurchschnitts in die Team-Dialoge und weitere Verbesserungen der Benutzerfreundlichkeit.

## Geplante Features

### 1. Verbesserung der PDF-Funktionalität
- **Druckfunktion für Ligaergebnisse** (verschoben von Version 0.5.2)
- **Optimierung der PDF-Layouts** für bessere Lesbarkeit
- **Unterstützung für Logos und Wasserzeichen** in PDFs

### 2. Integration des Vorjahresdurchschnitts in Team-Dialoge
- **Anzeige des Vorjahresdurchschnitts** in den Team-Dialogen
- **Vergleich mit aktuellem Durchschnitt** für bessere Leistungsanalyse
- **Visuelle Hervorhebung** von Verbesserungen und Verschlechterungen

### 3. Verbesserung der Benutzerfreundlichkeit
- **Optimierung des Onboarding-Assistenten** basierend auf Feedback
- **Erweiterte Tooltips** für komplexe Funktionen
- **Verbesserte Fehlermeldungen** für häufige Probleme

### 4. Bugfixes und Optimierungen
- **Behebung bekannter Fehler** aus Version 0.6.0
- **Performance-Optimierungen** für große Datenmengen
- **Verbesserung der Barrierefreiheit** für alle Benutzer

## Implementierungsreihenfolge

1. **Integration des Vorjahresdurchschnitts in Team-Dialoge**
   - Hohe Priorität, da es die Kernfunktionalität der App betrifft
   - Bereits teilweise umgesetzt, daher guter Startpunkt

2. **Verbesserung der PDF-Funktionalität**
   - Wichtig für die Dokumentation und Offline-Nutzung
   - Aufbauend auf der bestehenden PDF-Generator-Klasse

3. **Verbesserung der Benutzerfreundlichkeit**
   - Basierend auf Feedback aus der Nutzung von Version 0.6.0
   - Fokus auf häufig genutzte Funktionen

4. **Bugfixes und Optimierungen**
   - Kontinuierliche Verbesserung der Stabilität und Performance
   - Basierend auf gemeldeten Problemen und eigenen Tests

## Technische Anforderungen

- Erweiterung der PDF-Generator-Klasse für verbesserte Layouts
- Integration der PreviousYearAverage-Komponente in Team-Dialoge
- Optimierung der Datenbankabfragen für bessere Performance

## Testplan

- Unit-Tests für neue Funktionen
- Integration-Tests für die Interaktion zwischen Komponenten
- Manuelle Tests mit verschiedenen Benutzerrollen
- Feedback von ausgewählten Vereinsvertretern und Mannschaftsführern

## Zeitplan

- Entwicklungszeit: 1-2 Wochen
- Testphase: 1 Woche
- Deployment: Mitte Juni 2025

## Verantwortlichkeiten

- Entwicklung: Entwicklungsteam
- Tests: QA-Team und ausgewählte Benutzer
- Dokumentation: Aktualisierung des Handbuchs und der PROGRESS_NOTES.md

## Risiken und Abhängigkeiten

- Kompatibilität der PDF-Funktionalität mit verschiedenen Browsern
- Performance-Implikationen bei der Berechnung des Vorjahresdurchschnitts
- Benutzerakzeptanz der neuen Funktionen

## Abnahmekriterien

- Alle Features funktionieren wie beschrieben
- Keine kritischen Bugs
- Positive Rückmeldungen von Testbenutzern
- Aktualisierte Dokumentation