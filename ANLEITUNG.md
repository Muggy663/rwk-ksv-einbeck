# Anleitung zur Behebung des Problems mit Einzelschützen für 2025 Kleinkaliber

## Problem
Bei der Anzeige von Einzelschützen für 2025 Kleinkaliber erscheint die Meldung "Für die aktuelle Auswahl wurden keine Einzelschützenergebnisse gefunden."

## Ursache
Das Problem liegt in der Firestore-Abfrage in der `fetchIndividualShooterData`-Funktion. Firestore hat eine Begrenzung von maximal 10 Werten für die `in`-Abfrage. Wenn zu viele Disziplinen abgefragt werden, schlägt die Abfrage fehl.

## Lösung
1. Wir haben einen neuen Service erstellt, der die Abfrage anders strukturiert:
   - `src/lib/services/shooter-data-service.ts`: Enthält eine verbesserte Funktion zum Laden der Einzelschützendaten
   - `src/app/rwk-tabellen/loadData.ts`: Wrapper für den neuen Service

2. Die neue Implementierung:
   - Sucht zuerst nach Saisons für das ausgewählte Jahr und die Disziplin
   - Findet dann die zugehörigen Ligen
   - Lädt dann die Scores für diese Ligen (in Batches von maximal 10, wenn nötig)
   - Verarbeitet die Daten wie bisher

3. Um die Änderungen zu implementieren:
   - Ersetze die `loadData`-Funktion in `page.tsx` mit der Version aus `page-modified.tsx`
   - Stelle sicher, dass die neuen Dateien im Projekt vorhanden sind

4. Testen:
   - Wähle das Jahr 2025 und die Disziplin Kleinkaliber
   - Wechsle zum Tab "Einzelschützen"
   - Die Daten sollten jetzt korrekt angezeigt werden

## Hinweis
Diese Lösung umgeht die Firestore-Begrenzung, indem sie die Abfrage in kleinere Teile aufteilt und die Ergebnisse zusammenführt. Dies sollte für alle Disziplinen und Jahre funktionieren.