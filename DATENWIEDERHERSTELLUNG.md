# Datenwiederherstellung nach Datenverlust

## Betroffene Daten

Die Datenbereinigungsfunktion im Admin-Dashboard hat versehentlich folgende Daten gelöscht:
- Schützen (rwk_shooters)
- Schützen-Ergebnisse (rwk_scores)
- Schützen-Team-Zuordnungen (rwk_team_shooters)

Die Mannschaften (rwk_teams) und Saisons (seasons) sind noch vorhanden.

## Wiederherstellungsplan

### 1. Schützen wiederherstellen

1. Erstellen Sie eine Excel-Tabelle mit folgenden Spalten:
   - Name
   - Verein (ID)
   - Geschlecht (male/female)
   - Geburtsjahr

2. Nutzen Sie die Mannschaftslisten, um die Schützen zu identifizieren

3. Verwenden Sie die Schützen-Verwaltung im Admin-Bereich, um die Schützen neu anzulegen

### 2. Schützen den Teams zuordnen

1. Gehen Sie in die Mannschaftsverwaltung im Admin-Bereich

2. Wählen Sie jede Mannschaft aus und fügen Sie die entsprechenden Schützen hinzu

### 3. Ergebnisse wiederherstellen

1. Erstellen Sie eine Excel-Tabelle mit folgenden Spalten:
   - Schütze (ID)
   - Mannschaft (ID)
   - Durchgang
   - Ergebnis (Ringe)
   - Saison (ID)
   - Liga (ID)

2. Nutzen Sie die Ergebniserfassung im Vereinsbereich, um die Ergebnisse neu einzutragen

## Prioritäten

1. Aktuelle Saison (2025)
2. Wichtige Teams
3. Letzte Durchgänge

## Langfristige Maßnahmen

1. Regelmäßige Backups der Firestore-Datenbank einrichten
2. Point-in-Time Recovery für Firestore aktivieren
3. Verbesserte Sicherheitsmaßnahmen für kritische Funktionen implementieren
4. Testumgebung für gefährliche Operationen einrichten