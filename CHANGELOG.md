# Changelog

## Version 0.9.3 (25. Juni 2025)

### Behobene Fehler
- **Ergebniserfassung**: Korrektur der Anzeige von Teams mit fehlenden Ergebnissen
- **Ergebniserfassung**: Verbesserung der Benutzeroberfläche für vollständig erfasste Teams
- **Ergebniserfassung**: Behebung von Berechtigungsproblemen bei Liga-Updates
- **Statistiken**: Filterung von Saisons - nur laufende und abgeschlossene Saisons werden angezeigt
- **Termine**: Behebung des Fehlers bei der Bearbeitung von Terminen
- **Termine**: Verbesserte Anzeige der nächsten Termine unabhängig vom ausgewählten Monat
- **Allgemein**: Deaktivierung problematischer Offline-Funktionen zur Verbesserung der Stabilität

### Technische Verbesserungen
- Verbesserte Fehlerbehandlung bei Berechtigungsproblemen
- Aktualisierte Firestore-Regeln für Liga-Updates
- Optimierte Ladelogik für Schützen-Daten
- Automatische Bereinigung abgelaufener Termine

## Version 0.9.2 (20. Januar 2025)

### Performance-Optimierungen
- Hybrid Lazy Loading für optimale Performance
- Batch-Loading reduziert Datenbankabfragen von ~49 auf 3
- Intelligentes Caching für bereits geladene Daten
- Sofortige Anzeige der Team-Tabellen

### Technische Verbesserungen
- Implementierung von Batch-Loading für Firestore-Abfragen
- Optimierung der Datenstruktur für schnellere Verarbeitung
- Verbesserte Fehlerbehandlung und Logging

## Version 0.9.1 (15. Dezember 2024)

### Neue Funktionen
- Statistik-Dashboard mit Leistungsentwicklung, Mannschaftsvergleich und Geschlechterverteilung
- Saisonübergreifende Statistiken für Schützen und Mannschaften
- Schützenvergleich mit bis zu 6 Schützen

### Verbesserungen
- Optimierte Ladezeiten für Statistiken
- Verbesserte Darstellung von Diagrammen
- Export-Funktion für Diagramme als PNG

## Version 0.9.0 (1. November 2024)

### Neue Funktionen
- Mobile Optimierungen für alle Bereiche der Anwendung
- Responsive Design für Smartphones und Tablets
- Touch-freundliche Bedienelemente

### Verbesserungen
- Überarbeitete Navigation für mobile Geräte
- Optimierte Tabellendarstellung auf kleinen Bildschirmen
- Verbesserte Performance auf mobilen Geräten

## Ältere Versionen

Siehe separate Changelog-Dateien für frühere Versionen.