# Entwicklungsagenda für RWK App Einbeck

## Aktuelle Entwicklungsphase (Version 0.7.1)
- Fehlerbehebungen und Verbesserungen der Benutzerfreundlichkeit
- Vereinfachung der Navigation und Benutzeroberfläche
- Optimierung der Statistik-Funktionen

## Nächste Schritte

### Für Version 0.7.1 (Priorität)
1. **Fehlerbehebungen**
   - Standard-Statistik-Seite korrigieren, insbesondere den Mannschaftsvergleich
   - "Erste Schritte starten"-Button mit Funktionalität versehen
   - "Passwort ändern"-Funktion implementieren

2. **Vereinfachung der Benutzeroberfläche**
   - "Hilfe & Einstellungen" entfernen und die Buttons zwischen "Zur Startseite" und "Logout" platzieren
   - Doppelte Verlinkung zum Terminkalender auf der Startseite vereinfachen
   - Vereinfachung des Vereinsdashboards (Terminkalender und Termin Hinzufügen zusammenfassen)
   - Allgemeine Überprüfung der Navigationsstruktur für bessere Benutzerfreundlichkeit

### Mittelfristig (Version 0.8.0 - Beta-Phase)
1. **Benachrichtigungssystem**
   - E-Mail-Benachrichtigungen für neue Ergebnisse
   - In-App-Benachrichtigungen für wichtige Ereignisse
   - Abonnement-Funktion für bestimmte Ligen oder Teams

2. **Erweiterte Benutzerberechtigungen**
   - Feinere Abstufung der Berechtigungen für Vereinsvertreter und Mannschaftsführer
   - Vereinfachung der Benutzerverwaltung für Administratoren
   - Mehrfaktor-Authentifizierung für sensible Bereiche

3. **Automatischer Saisonabschluss / Auf- und Abstieg**
   - Automatisierte Verwaltung des Saisonwechsels
   - Regelbasierte Auf- und Abstiegslogik
   - Archivierung abgeschlossener Saisons

### Langfristig (Version 0.9.0 und 1.0.0)
1. **Automatisierte Tests**
   - Einführung von Unit-Tests für kritische Funktionen
   - End-to-End-Tests für wichtige Benutzerflüsse
   - Continuous Integration für automatisierte Tests

2. **Feedback-Integration aus der Beta-Phase**
   - Umsetzung von Verbesserungsvorschlägen der Beta-Tester
   - Behebung gemeldeter Fehler
   - Optimierung der Benutzerfreundlichkeit basierend auf Nutzerfeedback

## Abgeschlossene Aufgaben (Version 0.7.0)
- ✅ Umfassendes Statistik-Dashboard mit erweiterten Visualisierungen
- ✅ Schützenvergleich-Funktion mit Auswahl von bis zu 6 Schützen
- ✅ Leistungsentwicklung von Schützen über die Saison (Liniendiagramm)
- ✅ Vergleich zwischen Mannschaften einer Liga (Balkendiagramm)
- ✅ Verteilung der Ergebnisse nach Geschlecht (Kreisdiagramm)
- ✅ Übersichtlicher Kalender für alle Wettkämpfe und Veranstaltungen
- ✅ Export von Terminen als iCal-Datei
- ✅ Progressive Web App (PWA) Funktionalität
- ✅ Offline-Zugriff auf grundlegende Funktionen
- ✅ Responsive Design für alle Seiten
- ✅ Touch-optimierte UI-Elemente
- ✅ Anpassung der Tabellen für kleine Bildschirme
- ✅ PDF-Export für Ligaergebnisse und Einzelschützenergebnisse
- ✅ Druckfreundliche Darstellung der Tabellen
- ✅ Logo in der oberen linken Ecke der Anwendung
- ✅ Footer mit Versionsinformation und Impressum

## Technische Schulden
- Vereinheitlichung der Datenstruktur in Firestore
- Optimierung der Datenbankabfragen für bessere Performance
- Verbesserung der Fehlerbehandlung und Logging
- Refactoring der Komponenten für bessere Wiederverwendbarkeit