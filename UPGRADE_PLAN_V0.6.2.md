# Upgrade-Plan für Version 0.6.2

## Übersicht
Dieses Dokument beschreibt den Plan für das Upgrade der RWK Einbeck App von Version 0.6.1 auf Version 0.6.2. Die Hauptziele dieser Version sind die Behebung von Fehlern und die Verbesserung der Stabilität der bestehenden Funktionen.

## Identifizierte Probleme und Lösungen

### 1. PDF-Generierung
**Problem:** Die PDF-Generierung kann bei bestimmten Datenkonstellationen oder in verschiedenen Browsern zu Fehlern führen.

**Lösung:**
- Verbesserte Fehlerbehandlung in der PDF-Generator-Klasse
- Null-Checks für alle Daten, die in PDFs verwendet werden
- Fallback-Mechanismen für den Fall, dass die PDF-Generierung fehlschlägt
- Bessere Unterstützung für Umlaute und Sonderzeichen

### 2. Vorjahresdurchschnitt-Berechnung
**Problem:** Die Berechnung des Vorjahresdurchschnitts kann fehlschlagen, wenn keine Daten aus dem Vorjahr vorhanden sind oder wenn die Datenstruktur nicht wie erwartet ist.

**Lösung:**
- Verbesserte Fehlerbehandlung in der PreviousYearAverage-Komponente
- Klarere Anzeige, wenn keine Daten verfügbar sind
- Bessere Validierung der eingehenden Daten

### 3. Onboarding-Assistent und Passwortänderungsaufforderung
**Problem:** Die Verwendung von localStorage kann zu Problemen führen, wenn der Browser keine lokale Speicherung unterstützt oder wenn der Benutzer den Cache löscht.

**Lösung:**
- Try-Catch-Blöcke für alle localStorage-Zugriffe
- Fallback-Mechanismen, wenn localStorage nicht verfügbar ist
- Verhindern, dass Dialoge unbeabsichtigt geschlossen werden

### 4. Mannschaftsführer-Übersicht
**Problem:** Die Verwendung von sowohl `captainName` als auch `managerName` kann zu Verwirrung führen.

**Lösung:**
- Konsistente Verwendung der Feldnamen in der gesamten Anwendung
- Bessere Dokumentation der Feldnamen und ihrer Verwendung

### 5. Admin-Index
**Problem:** Die Datei `admin/index.ts` exportiert nicht alle Admin-Komponenten, was zu Importproblemen führen kann.

**Lösung:**
- Vervollständigung der Exporte in `admin/index.ts`

### 6. Firestore-Sicherheitsregeln
**Problem:** Die Regeln für `audit_logs` und `documents` fehlen in den aktuellen Firestore-Regeln.

**Lösung:**
- Hinzufügen der fehlenden Regeln für `audit_logs` und `documents`

### 7. Hilfs-Tooltips
**Problem:** Die Hilfs-Tooltips werden möglicherweise nicht konsistent in der gesamten Anwendung verwendet.

**Lösung:**
- Überprüfung und Vereinheitlichung der Verwendung von Hilfs-Tooltips

## Implementierungsreihenfolge

1. **Firestore-Sicherheitsregeln aktualisieren**
   - Hohe Priorität, da dies die Sicherheit der Anwendung betrifft

2. **Admin-Index vervollständigen**
   - Einfache Änderung, die schnell umgesetzt werden kann

3. **PDF-Generator verbessern**
   - Wichtig für die Kernfunktionalität der App

4. **Vorjahresdurchschnitt-Komponente verbessern**
   - Wichtig für die korrekte Anzeige von Statistiken

5. **Onboarding-Assistent und Passwortänderungsaufforderung verbessern**
   - Wichtig für die Benutzerfreundlichkeit

6. **Mannschaftsführer-Übersicht verbessern**
   - Wichtig für die Konsistenz der Daten

7. **Hilfs-Tooltips überprüfen**
   - Wichtig für die Benutzerfreundlichkeit

## Testplan

- Unit-Tests für die verbesserten Komponenten
- Integration-Tests für die Interaktion zwischen Komponenten
- Manuelle Tests mit verschiedenen Browsern und Datenkonstellationen
- Überprüfung der Firestore-Sicherheitsregeln mit dem Firebase Emulator

## Zeitplan

- Entwicklungszeit: 1 Woche
- Testphase: 3 Tage
- Deployment: Ende Juni 2025

## Verantwortlichkeiten

- Entwicklung: Entwicklungsteam
- Tests: QA-Team und ausgewählte Benutzer
- Dokumentation: Aktualisierung des Handbuchs und der PROGRESS_NOTES.md

## Risiken und Abhängigkeiten

- Kompatibilität der PDF-Funktionalität mit verschiedenen Browsern
- Verfügbarkeit von localStorage in verschiedenen Browsern
- Konsistenz der Datenstruktur in der Firestore-Datenbank

## Abnahmekriterien

- Alle identifizierten Probleme sind behoben
- Die Anwendung funktioniert stabil in verschiedenen Browsern
- Die Dokumentation ist aktualisiert