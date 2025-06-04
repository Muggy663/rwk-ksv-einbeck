# Entwicklungs-Agenda für RWK Einbeck App Version 0.7.0

## Überblick
Dieses Dokument enthält den Entwicklungsplan für Version 0.7.0 der RWK Einbeck App mit Hinweisen zu den geplanten Features und bekannten Problemen.

## Bekannte Probleme
- **Router-Update-Fehler im AdminLayout**: Bei automatischem Logout tritt folgender Fehler auf:
  ```
  Error: Cannot update a component (`Router`) while rendering a different component (`AdminLayout`).
  ```
  Ursache: Wahrscheinlich wird eine Navigation während des Renderings ausgelöst.
  Lösung: Die Navigation sollte in einen useEffect verschoben oder mit setTimeout verzögert werden.

## Geplante Features für Version 0.7.0

### 1. Statistik-Dashboard mit erweiterten Visualisierungen
- **Priorität**: Hoch
- **Geschätzter Aufwand**: 9-17 Stunden
- **Platzhalter-Status**: Grundstruktur vorhanden
- **Zu implementieren**:
  - Leistungsentwicklung von Schützen über die Saison (Liniendiagramm)
  - Vergleich zwischen Mannschaften einer Liga (Balkendiagramm)
  - Verteilung der Ergebnisse nach Geschlecht (Kreisdiagramm)
  - Filter für Saison, Liga und Verein
  - Exportfunktion für Diagramme

### 2. Mobile Optimierung und Progressive Web App (PWA)
- **Priorität**: Hoch
- **Geschätzter Aufwand**: 9-17 Stunden
- **Platzhalter-Status**: Grundlegende Meta-Tags vorhanden
- **Zu implementieren**:
  - Responsive Design für alle Seiten
  - PWA-Manifest
  - Service Worker für Offline-Funktionalität
  - Touch-optimierte UI-Elemente
  - Anpassung der Tabellen für kleine Bildschirme

### 3. Druckfunktion für Ligaergebnisse
- **Priorität**: Mittel
- **Geschätzter Aufwand**: 3-5 Stunden
- **Platzhalter-Status**: PDF-Generator vorhanden
- **Zu implementieren**:
  - Druckansicht ohne sensible Daten
  - Optimiertes Layout für Druckausgabe
  - Direkte Druckfunktion aus der Tabellenseite

### 4. Terminkalender für Wettkämpfe
- **Priorität**: Mittel
- **Geschätzter Aufwand**: 9-14 Stunden
- **Platzhalter-Status**: Grundstruktur vorhanden
- **Zu implementieren**:
  - Kalenderansicht mit Monats- und Wochenübersicht
  - Termin-Eingabeformular für Administratoren
  - Benachrichtigungsfunktion für anstehende Wettkämpfe
  - Integration mit der Startseite

### 5. Automatischer Saisonabschluss / Auf- und Abstieg
- **Priorität**: Niedrig (komplex)
- **Geschätzter Aufwand**: 10-17 Stunden
- **Platzhalter-Status**: Konzept vorhanden
- **Zu implementieren**:
  - Konfigurationsseite für Auf-/Abstiegsregeln
  - Automatische Berechnung der Auf-/Absteiger
  - Vorschau der neuen Ligastruktur
  - Bestätigungsprozess für Administratoren

## Hinweise für die Implementierung
- Beginnen Sie mit den Features höchster Priorität
- Testen Sie die mobile Ansicht regelmäßig während der Entwicklung
- Achten Sie auf Kompatibilität mit Vercel-Deployment
- Vermeiden Sie setState während des Renderings (siehe bekannter Fehler)
- Implementieren Sie Features inkrementell, um früh Feedback zu erhalten

## Beta-Test-Plan
- Nach Fertigstellung der Version 0.7.0 sollen Beta-Tester eingeladen werden
- Fokus auf Benutzerfreundlichkeit und mobile Nutzung
- Feedback-Formular für Tester vorbereiten
- Testphase von 2-3 Wochen einplanen