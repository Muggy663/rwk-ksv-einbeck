# Konzept: Digitalisierung der Kreismeisterschaftsmeldungen

## Ausgangssituation
Die RWK Einbeck App wird bereits für die Verwaltung von Rundenwettkämpfen genutzt. Der Kreispräsident möchte nun auch die Meldungen zur Kreismeisterschaft digitalisieren, um den Prozess für alle Beteiligten zu vereinfachen.

## Anforderungen

### Benötigte Daten pro Meldung
- Name des Schützen
- Jahrgang
- Disziplin
- Anmerkungen
- Landesmeisterschaft-Teilnahme (ja/nein)
- Automatische Berechnung der Wettkampfklasse basierend auf Jahrgang

### Funktionale Anforderungen
1. **Meldungserfassung**
   - Formular für Vereine zur Eingabe ihrer Schützen
   - Bulk-Upload-Möglichkeit für mehrere Schützen
   - Validierung der Eingaben

2. **Wettkampfklassenberechnung**
   - Automatische Zuordnung basierend auf Jahrgang
   - Jährliche Konfigurationsmöglichkeit der Altersklassen
   - Berücksichtigung von Sonderregeln

3. **Verwaltungsfunktionen**
   - Übersicht aller Meldungen für Administratoren
   - Filterung nach Vereinen, Disziplinen, Wettkampfklassen
   - Bearbeitung und Korrektur von Meldungen

4. **Export und Berichte**
   - PDF-Export der Meldelisten
   - Excel/CSV-Export für weitere Verarbeitung
   - Statistiken zu Teilnehmerzahlen

5. **Benachrichtigungen**
   - Erinnerungen an Meldeschluss
   - Bestätigungen nach erfolgreicher Meldung
   - Informationen zu Änderungen

## Technische Integration

### Option 1: Integration in bestehende RWK App
- Neues Modul innerhalb der vorhandenen Anwendung
- Nutzung der bestehenden Benutzer- und Vereinsverwaltung
- Gemeinsame Datenbasis für Schützen und Disziplinen

**Vorteile:**
- Einheitliche Benutzeroberfläche
- Gemeinsame Nutzerverwaltung
- Synergie bei Stammdaten (Vereine, Schützen)

**Nachteile:**
- Komplexere Anpassung der bestehenden App
- Risiko von Störungen im RWK-Betrieb

### Option 2: Separate Anwendung mit Datenaustausch
- Eigenständige Anwendung speziell für Kreismeisterschaftsmeldungen
- Schnittstelle zur RWK App für Datenaustausch
- Eigene, vereinfachte Benutzerverwaltung

**Vorteile:**
- Unabhängige Entwicklung und Betrieb
- Spezialisierte Benutzeroberfläche
- Geringeres Risiko für bestehende Systeme

**Nachteile:**
- Doppelte Datenhaltung
- Zusätzliche Anmeldung für Benutzer

## Datenmodell (Entwurf)

```
Meldung:
- ID
- SchützeID (Referenz)
- Jahrgang
- DisziplinID (Referenz)
- Anmerkung
- LM_Teilnahme (Boolean)
- WettkampfklasseID (berechnet)
- VereinID (Referenz)
- Saison
- Meldedatum
- Status

Wettkampfklasse:
- ID
- Name
- MinAlter
- MaxAlter
- Geschlecht (optional)
- Saison

Disziplin:
- ID
- Name
- Kategorie (LG, LP, KK, etc.)
- Schusszahl
```

## Zeitplan und nächste Schritte

1. **Analyse**
   - Bestehende Ausschreibung analysieren
   - Aktuelle Wettkampfklassen dokumentieren
   - Anforderungen mit Kreispräsident abstimmen

2. **Konzeption**
   - Detailliertes Datenmodell erstellen
   - UI-Mockups entwickeln
   - Integrationsstrategie festlegen

3. **Implementierung**
   - Datenbank-Erweiterung
   - Backend-Entwicklung
   - Frontend-Implementierung
   - Testphase

4. **Einführung**
   - Schulung für Administratoren
   - Dokumentation für Vereine
   - Pilotphase mit ausgewählten Vereinen

## Offene Fragen

- Wie sieht der genaue Meldeprozess aktuell aus?
- Welche Wettkampfklassen gibt es und wie werden sie berechnet?
- Gibt es spezielle Regeln für bestimmte Disziplinen?
- Welcher Zeitraum steht für die Entwicklung zur Verfügung?
- Soll die Lösung auch für andere Kreise nutzbar sein?