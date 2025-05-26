# Upgrade-Plan für Version 0.5.0

## Übersicht
Dieses Dokument beschreibt den Plan für das Upgrade der RWK Einbeck App von Version 0.4.0 auf Version 0.5.0. Die Hauptziele dieser Version sind UX-Verbesserungen und die Vorbereitung für erste breitere Tests mit Vereinsvertretern und Mannschaftsführern.

## Geplante Features

### 1. Ergebniserfassung: UX-Verbesserungen
- **Automatische Vorauswahl des aktuellen Durchgangs** basierend auf Datum
- **Live-Validierung der Ringzahlen** während der Eingabe
- **Visuelle Hervorhebung von Schützen** ohne Ergebnisse (bereits teilweise umgesetzt)

### 2. Admin-Panel: Liste aller Mannschaftsführer einer Saison
- Neue Seite im Admin-Bereich zur Anzeige aller Mannschaftsführer einer ausgewählten Saison
- Anzeige von Kontaktdaten (Name, E-Mail, Telefon)
- Filtermöglichkeiten nach Liga und Verein
- Export-Funktion (optional)

### 3. Login: Passwort-Reset-Funktion
- Implementierung einer "Passwort vergessen"-Funktion auf der Login-Seite
- Integration mit Firebase Authentication für sicheres Zurücksetzen

### 4. Anzeige 'Mannschaften (Info)' verfeinern
- Verbesserung der Anzeige von Mannschaftszuordnungen in der Schützenübersicht
- Anzeige des Teamnamens, wenn ein Schütze nur einem Team zugeordnet ist

### 5. RWK-Tabellen: Druckfunktion für Ligaergebnisse
- Implementierung einer druckfreundlichen Ansicht für Ligaergebnisse
- Button zum Auslösen des Druckvorgangs
- Optimierte CSS-Styles für den Druck (ohne Navigation, Footer, etc.)

### 6. Admin-Benutzerverwaltung: UI-Verbesserungen
- Überarbeitung der Benutzerlistenansicht
- Vereinfachung des Bearbeitungsprozesses
- Verbesserte Fehlerbehandlung und Feedback

### 7. Vereinfachte Mannschaftsanlage (aus PROGRESS_NOTES.md)
- Dropdown für Mannschaftsstärke (I, II, III)
- Automatische Vorschläge für Mannschaftsnamen basierend auf Verein und Stärke

### 8. Suchfunktion für Schützen (aus PROGRESS_NOTES.md)
- Implementierung einer Suchfunktion für Schützen bei größeren Vereinen
- Echtzeit-Filterung der Schützenliste

### 9. Visuelle Unterscheidung zwischen verfügbaren und zugewiesenen Schützen (aus PROGRESS_NOTES.md)
- Deutlichere visuelle Trennung in der UI
- Farbliche Hervorhebung oder Icons zur besseren Unterscheidung

## Implementierungsreihenfolge

1. **Ergebniserfassung: UX-Verbesserungen**
   - Hohe Priorität, da es die Kernfunktionalität der App betrifft
   - Bereits teilweise umgesetzt, daher guter Startpunkt

2. **Login: Passwort-Reset-Funktion**
   - Wichtig für die Benutzerfreundlichkeit und Selbsthilfe der Nutzer
   - Relativ einfach zu implementieren mit Firebase Authentication

3. **Suchfunktion für Schützen & Visuelle Unterscheidung**
   - Verbessert die Benutzerfreundlichkeit für Vereinsvertreter
   - Hilft bei der Verwaltung größerer Vereine

4. **Vereinfachte Mannschaftsanlage**
   - Reduziert Fehler bei der Mannschaftserstellung
   - Verbessert die Konsistenz der Daten

5. **Anzeige 'Mannschaften (Info)' verfeinern**
   - Erhöht die Übersichtlichkeit in der Schützenansicht

6. **Admin-Panel: Liste aller Mannschaftsführer**
   - Nützliches Tool für Administratoren
   - Verbessert die Kommunikationsmöglichkeiten

7. **RWK-Tabellen: Druckfunktion**
   - Wichtig für die Dokumentation und Offline-Nutzung
   - Kann als letztes implementiert werden, da es keine kritische Funktion ist

8. **Admin-Benutzerverwaltung: UI-Verbesserungen**
   - Verbessert die Effizienz der Administratoren
   - Kann parallel zu anderen Features entwickelt werden

## Technische Anforderungen

- Firebase Authentication für Passwort-Reset
- React-to-Print oder ähnliche Bibliothek für die Druckfunktion
- Erweiterte Formularvalidierung für Live-Validierung
- Optimierte Datenbankabfragen für Suchfunktionen

## Testplan

- Unit-Tests für neue Funktionen
- Integration-Tests für die Interaktion zwischen Komponenten
- Manuelle Tests mit verschiedenen Benutzerrollen
- Feedback von ausgewählten Vereinsvertretern und Mannschaftsführern

## Zeitplan

- Entwicklungszeit: 2-3 Wochen
- Testphase: 1 Woche
- Deployment: Ende Juni 2025

## Verantwortlichkeiten

- Entwicklung: Entwicklungsteam
- Tests: QA-Team und ausgewählte Benutzer
- Dokumentation: Aktualisierung des Handbuchs und der PROGRESS_NOTES.md

## Risiken und Abhängigkeiten

- Abhängigkeit von Firebase Authentication für Passwort-Reset
- Kompatibilität der Druckfunktion mit verschiedenen Browsern
- Leistungsoptimierung bei großen Datenmengen für die Suchfunktion

## Abnahmekriterien

- Alle Features funktionieren wie beschrieben
- Keine kritischen Bugs
- Positive Rückmeldungen von Testbenutzern
- Aktualisierte Dokumentation