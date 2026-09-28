# Aufgabenliste – nächster Monat

Stand: 20.09.2026 (App-Version 3.0.14)

## ✅ ERLEDIGT (in /admin/rwk-tabellen-neu umgesetzt, lokal)
- Hebel A: Vorab-Laden aller Einzelranglisten (Promise.all pro Liga) entfernt.
- Hebel B: Substitutions nur noch 1× geladen (doppelter Service-Load + Nachlade-useEffect entfernt).
- Hebel C: loadTeamShooters lädt Schützen jetzt per documentId()-Batch statt N+1 getDoc.
- Offen: Bonus (sessionStorage-Cache lesen) + großer Wurf (Aggregat-Dokumente).
- Noch gegen Live-Zahlen gegenprüfen, bevor Vorschau die öffentliche Seite ersetzt.

## Firestore-Abfragen der RWK-Tabellen reduzieren (Kosten + Ladezeit)

Analyse-Ergebnis: Beim Öffnen eines Wettkampfs entstehen sehr viele redundante Reads.
Der dominierende Kostentreiber ist das Vorab-Laden aller Einzelranglisten.
Umsetzung isoliert in der Vorschau-Seite `src/app/admin/rwk-tabellen-neu/`, danach
Liga für Liga gegen die Live-Zahlen vergleichen, bevor produktiv.

**WICHTIG:** Der Data-Layer ist verhaltenskritisch (Sortierung, AK-Regeln,
Substitutionen, "liga-weit vollständiger Durchgang"). Jede Optimierung muss die
angezeigten Zahlen exakt gleich lassen – nur *wann/wie oft* geladen wird, darf sich ändern.

### Hebel A – Einzelranglisten NICHT mehr vorab für alle Ligen laden (größter Effekt)
- Der `Promise.all`-Block am Ende von `fetchCompetitionTeamData`, der
  `fetchIndividualShooterData` für JEDE Liga aufruft, entfällt.
- Die Einzelrangliste wird ohnehin lazy geladen, sobald im Einzel-Tab eine Liga
  gewählt wird (macht `loadData` schon).
- Ersparnis: eliminiert den kompletten `L × [teams + scores + substitutions + shooters]`-Term.
  Bei ~10 Ligen grob Halbierung bis Drittelung der Reads + deutlich schnellere Ladezeit.
- VORHER PRÜFEN: braucht irgendeine sichtbare Funktion (z.B. Team-PDF-Button) die
  vorab gefüllten `individualLeagueShooters` beim ersten Render? (PDF-Button lädt selbst nach.)

### Hebel B – Substitutions nur EINMAL laden
- Aktuell: 2× in `fetchCompetitionTeamData` + 1× pro Liga in `fetchIndividualShooterData`
  + 1× im useEffect = bei 10 Ligen ~13 identische Queries.
- Einmal laden, an alle durchreichen. Reduziert auf 1.
- Stolperstein: zwei Key-Formate (`teamId-shooterId` vs. `teamId|shooterId`) beibehalten
  oder sauber vereinheitlichen.

### Hebel C – Schützen im Team-Aufklappen batchen statt N+1
- `loadTeamShooters` holt jeden Schützen einzeln per `getDoc` (5 Schützen = 5 Reads).
- Auf `where(documentId(), 'in', [...])` umstellen (Muster existiert schon in
  `fetchIndividualShooterData`). Pro 5er-Team von 6 auf 2 Reads.

### Bonus – toter sessionStorage-Cache
- In `loadData` wird ein Team-Cache (`rwk-teams-{year}-{discipline}`) GESCHRIEBEN,
  aber nie wieder GELESEN. Beim Laden tatsächlich auslesen (kurze Gültigkeit für
  laufende Saisons, lange für abgeschlossene) → spart Reloads bei Tab-Wechsel/Zurück.

### Großer Wurf (optional, nur bei echtem Kostendruck)
- Aggregat-Dokumente: beim Ergebnis-Erfassen ein fertiges `rwk_standings/{leagueId}`
  fortschreiben. Anzeige liest 1 Dokument statt hunderte Scores. Echter Umbau
  (Schreibpfad + Migration), höheres Risiko.

Reihenfolge nach Nutzen: A ≫ B ≥ C, dann Bonus, dann (nur bei Bedarf) der große Wurf.

## Weitere offene Punkte
- Vorschau-Seite `/admin/rwk-tabellen-neu` final testen und ggf. gegen die
  öffentliche `/rwk-tabellen` austauschen. Beim Austausch: veralteten
  "Querformat drehen"-Hinweis in `RWKLegend` entfernen.
- Optional: die beiden Tab-Inhalte (`MannschaftenTab`, `EinzelschuetzenTab`) als
  eigene Komponenten auslagern → page.tsx unter ~900 Zeilen.
