# Changelog Version 0.6.2

## Übersicht
Version 0.6.2 ist ein Bugfix-Release, das sich auf die Verbesserung der Stabilität und Zuverlässigkeit der in Version 0.6.0 und 0.6.1 eingeführten Funktionen konzentriert.

## Änderungen

### PDF-Generator
- Verbesserte Fehlerbehandlung mit Try-Catch-Blöcken für alle kritischen Operationen
- Null-Checks für alle Daten, die in PDFs verwendet werden
- Fallback-Mechanismen für den Fall, dass die PDF-Generierung fehlschlägt
- Verbesserte Unterstützung für Umlaute und Sonderzeichen

### Vorjahresdurchschnitt-Komponente
- Verbesserte Fehlerbehandlung mit detaillierten Fehlermeldungen
- Klarere Anzeige, wenn keine Daten verfügbar sind
- Bessere Validierung der eingehenden Daten
- Korrekte Behandlung von fehlenden Daten aus dem Vorjahr

### Onboarding-Assistent
- Try-Catch-Blöcke für alle localStorage-Zugriffe
- Fallback-Mechanismen, wenn localStorage nicht verfügbar ist
- Verhindern, dass der Dialog unbeabsichtigt geschlossen wird
- Verbesserte Fehlerbehandlung bei fehlenden Schritten

### Passwortänderungsaufforderung
- Try-Catch-Blöcke für alle localStorage-Zugriffe
- Fallback-Mechanismen, wenn localStorage nicht verfügbar ist
- Verhindern, dass der Dialog unbeabsichtigt geschlossen wird
- Verbesserte Validierung der Passwörter
- Bessere Fehlermeldungen bei Authentifizierungsproblemen

### Admin-Index
- Vervollständigung der Exporte in `admin/index.ts`
- Alle Admin-Komponenten werden jetzt exportiert, was den Import vereinfacht

### Mannschaftsführer-Übersicht
- Konsistente Verwendung der Feldnamen für Mannschaftsführer (captainName/managerName)
- Verbesserte Fehlerbehandlung beim CSV-Export
- Bessere Sortierung der Saisons nach Jahr

### Firestore-Sicherheitsregeln
- Hinzufügen der fehlenden Regeln für `audit_logs`
- Hinzufügen der fehlenden Regeln für `documents`

## Bekannte Probleme
- Die PDF-Generierung kann in einigen älteren Browsern Probleme mit Umlauten haben
- Die localStorage-Funktionalität ist von der Browser-Unterstützung abhängig

## Nächste Schritte
- Weitere Verbesserungen der Benutzerfreundlichkeit
- Implementierung der in Version 0.7.0 geplanten Features
- Weitere Optimierung der Performance bei großen Datenmengen