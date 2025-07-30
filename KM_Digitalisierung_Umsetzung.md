# Umsetzungskonzept: Digitalisierung der Kreismeisterschaftsmeldungen

Basierend auf der Ausschreibung der Kreisverbandsmeisterschaft 2025 wird folgendes Umsetzungskonzept vorgeschlagen:

## Datenmodell

### Schütze
- ID
- Name
- Vorname
- Geburtsdatum/Jahrgang
- Geschlecht (m/w)
- Verein (Referenz)
- Mitgliedsnummer/Ausweisnummer
- Sondergenehmigung (für Schützen unter 12 Jahren)

### Meldung
- ID
- SchützeID (Referenz)
- Disziplin (Referenz)
- Wettkampfklasse (automatisch berechnet aus Jahrgang)
- LM-Teilnahme (Boolean)
- Anmerkung
- Saison (z.B. "2025")
- Meldedatum
- Status (gemeldet, bestätigt, abgelehnt)

### Disziplin
- ID
- SpO-Nummer (z.B. "1.10")
- Name (z.B. "Luftgewehr Freihand")
- Kategorie (LG, LP, KK, etc.)
- Schusszahl
- Schießzeit
- Mindestalter
- Auflage (Boolean)

### Wettkampfklasse
- ID
- Name (z.B. "Schüler m", "Senioren I")
- Geschlecht (m/w)
- MinJahrgang
- MaxJahrgang
- Saison (z.B. "2025")

### Mannschaft
- ID
- Name
- VereinID
- DisziplinID
- WettkampfklasseID
- Saison
- SchützenIDs (Array von 3 Schützen)

## Funktionen des Systems

### 1. Meldungserfassung
- **Vereinsportal**: Jeder Verein erhält Zugang zum System
- **Schützenverwaltung**: Vereine können ihre Schützen verwalten
- **Meldungsformular**: Digitales Formular zur Meldung von Schützen
  - Auswahl des Schützen (aus Vereinsdatenbank)
  - Auswahl der Disziplin(en)
  - Angabe zur LM-Teilnahme (ja/nein)
  - Anmerkungsfeld
  - Automatische Berechnung der Wettkampfklasse
- **Mannschaftsmeldung**: Zusammenstellung von Mannschaften aus gemeldeten Schützen
- **Bulk-Upload**: Möglichkeit, mehrere Schützen gleichzeitig zu melden

### 2. Wettkampfklassenberechnung
- **Automatische Zuordnung**: System berechnet die Wettkampfklasse basierend auf:
  - Jahrgang des Schützen
  - Geschlecht
  - Disziplin
- **Jährliche Konfiguration**: Admin kann die Altersklassen für jede Saison neu definieren
- **Validierung**: Prüfung auf Einhaltung der Regeln (z.B. Mindestalter 12 Jahre)

### 3. Verwaltungsfunktionen für Kreisverband
- **Meldungsübersicht**: Alle eingegangenen Meldungen einsehen
- **Filterung**: Nach Verein, Disziplin, Wettkampfklasse
- **Bearbeitung**: Möglichkeit, Meldungen zu korrigieren oder zu bestätigen
- **Startplan**: Erstellung eines Startplans basierend auf den Meldungen
- **Statistiken**: Teilnehmerzahlen nach Disziplinen, Wettkampfklassen, etc.

### 4. Export und Berichte
- **PDF-Export**: Meldelisten, Startlisten, Ergebnislisten
- **Excel/CSV-Export**: Für weitere Verarbeitung
- **Automatische Meldung an NSSV**: Export der Daten für die Landesmeisterschaft

### 5. Benachrichtigungen
- **Erinnerungen**: Automatische E-Mails vor Meldeschluss
- **Bestätigungen**: Nach erfolgreicher Meldung
- **Änderungsmitteilungen**: Bei Änderungen am Startplan

## Integration in die RWK Einbeck App

### Vorteile der Integration
- Nutzung der bestehenden Benutzer- und Vereinsverwaltung
- Gemeinsame Datenbasis für Schützen
- Einheitliche Benutzeroberfläche

### Notwendige Erweiterungen
1. **Neues Modul "Kreismeisterschaft"**
   - Untermenü in der Hauptnavigation
   - Eigene Berechtigungsstruktur

2. **Datenbankerweiterung**
   - Neue Tabellen für Disziplinen, Wettkampfklassen, Meldungen
   - Verknüpfung mit bestehenden Tabellen (Schützen, Vereine)

3. **Benutzeroberfläche**
   - Meldungsformular für Vereine
   - Verwaltungsoberfläche für Kreisverband
   - Startplanverwaltung

4. **Berechtigungssystem**
   - Vereinsadmins: Meldungen für eigenen Verein
   - Kreisverbandsadmins: Gesamtverwaltung

## Zeitplan für die Umsetzung

1. **Phase 1: Grundfunktionen** (2 Monate)
   - Datenmodell implementieren
   - Meldungsformular erstellen
   - Wettkampfklassenberechnung umsetzen

2. **Phase 2: Verwaltungsfunktionen** (1 Monat)
   - Übersichten und Filterungen
   - Bearbeitungsfunktionen
   - Startplanverwaltung

3. **Phase 3: Export und Berichte** (1 Monat)
   - PDF-Generierung
   - Excel/CSV-Export
   - NSSV-Schnittstelle

4. **Phase 4: Benachrichtigungen und Tests** (1 Monat)
   - E-Mail-System
   - Umfassende Tests
   - Fehlerbehebung

5. **Phase 5: Schulung und Einführung** (1 Monat)
   - Dokumentation erstellen
   - Schulung der Vereinsadmins
   - Pilotphase mit ausgewählten Vereinen

## Besonderheiten aus der Ausschreibung

- **Altersregelungen**: Schützen unter 12 Jahren sind nur mit Sondergenehmigung startberechtigt
- **Meldeschluss**: 15. Dezember 2024 für die KVM 2025
- **Dokumentenpflicht**: Mitgliedsausweis/Wettkampfpass muss vorgelegt werden
- **Mannschaftsbildung**: Drei Starter eines Vereins bilden eine Mannschaft
- **Wertungsregeln**: Unterschiedliche Regeln für Freihand (volle Ringwertung) und Auflage (Zehntelwertung)
- **Startgeld**: Wird dem Verein in Rechnung gestellt, auch bei Nichtantritt

## Nächste Schritte

1. Abstimmung des Konzepts mit dem Kreispräsidenten
2. Detaillierte Anforderungsanalyse mit den Vereinsvertretern
3. Prototyp-Entwicklung für das Meldungsformular
4. Test der Wettkampfklassenberechnung mit realen Daten