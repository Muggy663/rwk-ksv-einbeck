# Firestore-Indizes Prüfung

## So gehst du vor:

### 1. Firebase Console öffnen
- https://console.firebase.google.com
- Dein Projekt auswählen
- Firestore Database → Indizes

### 2. Diese Indizes sollten existieren:

#### rwk_scores Collection:
- `competitionYear` (aufsteigend) + `leagueType` (aufsteigend)
- `teamId` (aufsteigend) + `durchgang` (aufsteigend)
- `shooterId` (aufsteigend) + `competitionYear` (aufsteigend)

#### rwk_teams Collection:
- `seasonId` (aufsteigend) + `leagueId` (aufsteigend)
- `clubId` (aufsteigend) + `competitionYear` (aufsteigend)

#### events Collection:
- `date` (aufsteigend) + `leagueId` (aufsteigend)

### 3. Fehlende Indizes erstellen:
Wenn Indizes fehlen:
- "Index erstellen" klicken
- Collection auswählen
- Felder hinzufügen (siehe oben)
- "Erstellen" klicken

### 4. Automatische Index-Erstellung:
Firebase schlägt automatisch Indizes vor wenn Queries langsam sind.
Schau in die Console-Logs nach "Index creation" Meldungen.

## Warum wichtig:
- Ohne Index: Query dauert 5-10 Sekunden
- Mit Index: Query dauert 50-200ms
- Bessere User Experience!