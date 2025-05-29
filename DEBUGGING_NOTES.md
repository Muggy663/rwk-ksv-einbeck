# Debugging-Notizen für RWK Einbeck App

## Problem: Keine Mannschaften werden angezeigt

### Analyse der Teams-Seite (admin/teams/page.tsx)

Nach Überprüfung des Codes in `src/app/admin/teams/page.tsx` habe ich folgende potenzielle Probleme identifiziert:

1. **Fehlende automatische Suche**:
   - Die Seite lädt die Mannschaften nicht automatisch beim ersten Laden
   - Der Benutzer muss explizit auf "Mannschaften suchen" klicken
   - Es gibt keine automatische Vorauswahl der Saison

2. **Mögliche Probleme mit der Datenbankabfrage**:
   ```javascript
   const handleSearchTeams = useCallback(async () => {
     // ...
     let qConstraints: any[] = [
       where("competitionYear", "==", selectedSeasonData.competitionYear),
     ];
     // ...
     const teamsQuery = query(collection(db, TEAMS_COLLECTION), ...qConstraints, orderBy("name", "asc"));
     // ...
   }, [selectedSeasonId, selectedClubIdFilter, selectedLeagueIdFilter, allSeasons, toast]);
   ```

3. **Mögliche Probleme mit den Firestore-Regeln**:
   - Die Regeln für die `rwk_teams`-Collection könnten den Zugriff einschränken
   - Die Authentifizierung könnte fehlschlagen

### Lösungsvorschläge

1. **Automatische Suche implementieren**:
   - Füge einen `useEffect`-Hook hinzu, der `handleSearchTeams` aufruft, wenn `selectedSeasonId` gesetzt ist
   - Wähle automatisch die neueste Saison aus, wenn keine ausgewählt ist

2. **Debugging der Datenbankabfrage**:
   - Füge mehr Logging hinzu, um zu sehen, welche Abfragen ausgeführt werden
   - Überprüfe, ob die richtigen Parameter verwendet werden
   - Teste die Abfrage direkt in der Firebase-Konsole

3. **Überprüfung der Firestore-Regeln**:
   - Stelle sicher, dass die Regeln für `rwk_teams` korrekt sind
   - Überprüfe, ob der Benutzer die richtigen Berechtigungen hat

4. **Überprüfung der Datenbank**:
   - Bestätige, dass die Mannschaften tatsächlich in der Datenbank vorhanden sind
   - Überprüfe, ob die Mannschaften die richtigen Felder haben (competitionYear, clubId, etc.)

### Beispiel für eine Mannschaft in der Datenbank
```javascript
{
  captainEmail: "jangreve1@web.de",
  captainName: "Jan Greve",
  captainPhone: "",
  clubId: "UymGWWzwwwJz94lYrkBN",
  competitionYear: 2025,
  leagueId: "I2bXqsUouXhIbAKtROQA",
  name: "SV Lüthorst",
  seasonId: "HlFSjhrBOaYa782Jdjir",
  shooterIds: ["WcEY0MpCIHPAn30tUVMm", "DlFGwqsrq3G5psmdE1D3", "W8T7d5pT0iqt9mqJTdVt"]
}
```

### Nächste Schritte

1. Implementiere die automatische Suche
2. Füge mehr Logging hinzu
3. Überprüfe die Firestore-Regeln
4. Teste die Anwendung erneut