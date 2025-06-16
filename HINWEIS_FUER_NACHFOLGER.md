# Hinweis für den nächsten Entwickler

## Dokumentenverwaltung

Die Dokumentenverwaltung wurde überarbeitet, um eingeschränkte Dokumente nur für autorisierte Benutzer anzuzeigen:

- Dokumente mit dem `restricted`-Flag werden nur für eingeloggte Benutzer mit den Rollen Vereinsvertreter, Mannschaftsführer oder Admin angezeigt
- Die Benutzerrolle wird über den `useAuth`-Hook geprüft
- Nicht autorisierte Benutzer erhalten einen Hinweis, dass einige Dokumente nur für angemeldete Benutzer sichtbar sind

## Entfernte Features

- Der Favoriten-Tab wurde entfernt, da er als überflüssig angesehen wurde
- Der Archiv-Tab wurde ebenfalls entfernt, da die Dokumente bereits in der Admin-Dokumentenverwaltung als inaktiv markiert werden können

## Nächste Schritte für Version 0.8.3

### Priorität: "Außer Konkurrenz"-Funktion
- Erweiterung des Team-Datenmodells um ein `outOfCompetition`-Flag
- Anpassung der Mannschaftsverwaltung im Admin-Bereich
- Anpassung der Ergebnisdarstellung, um Teams "außer Konkurrenz" entsprechend zu kennzeichnen
- Berücksichtigung dieses Status bei der Berechnung von Ranglisten und Statistiken

### Weitere Verbesserungen
- Implementierung einer Benachrichtigungsfunktion für neue Dokumente und Ergebnisse
- Verbesserung der Suchfunktion mit Filtern nach Kategorien
- Anzeige von kürzlich angesehenen Dokumenten für eingeloggte Benutzer
- Feinere Abstufung der Benutzerberechtigungen für Vereinsvertreter und Mannschaftsführer

### Technische Schulden
- Vereinheitlichung der Datenstruktur
- Konsolidierung doppelter Dateien (.js und .ts)
- Optimierung der Datenbankabfragen für bessere Performance

Die Änderungen wurden in der Update-Seite (Version 0.8.2) dokumentiert.