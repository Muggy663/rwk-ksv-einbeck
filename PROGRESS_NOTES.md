# Fortschrittsbericht und Aufgaben

## Behobene Probleme
- ✅ Fehler "seasonId is not defined" in der Ergebniserfassung behoben
- ✅ Durchgang wird beim Mannschaftswechsel nicht mehr zurückgesetzt

## Aktuelle Aufgabe
- 🔄 Mannschaftsfilterung in der Ergebniserfassung:
  - Ziel: Mannschaften, deren Schützen alle Ergebnisse für einen Durchgang haben, sollen aus dem Dropdown verschwinden
  - Bisheriger Ansatz: Implementierung mit availableTeamsForDropdown und useEffect zur Filterung
  - Problem: Die Filterung funktioniert noch nicht korrekt
  - Nächster Ansatz: Direkte Abfrage der Datenbank nach Ergebnissen für alle Mannschaften und Durchgänge

## Nächste Schritte
- Implementierung einer neuen Lösung für die Mannschaftsfilterung:
  - Beim Laden der Teams für eine Liga auch gleich alle Ergebnisse für den ausgewählten Durchgang laden
  - Teams filtern, bei denen alle Schützen bereits Ergebnisse haben
- Sicherstellen, dass die Zwischenliste beim Mannschaftswechsel erhalten bleibt
- Verbesserte Benutzerfreundlichkeit für weniger technikaffine Nutzer

## Kontext
- Die App verwaltet Rundenwettkämpfe für den Kreisschützenverband
- Vereinfachte Kategorisierung in Kleinkaliber und Luftdruck
- Ein Schütze darf pro Saison und Disziplin nur in einer Mannschaft schießen
- Datenbankstruktur:
  - rwk_scores: Ergebnisse mit teamId, shooterId, durchgang
  - rwk_teams: Teams mit shooterIds (Array mit Schützen-IDs)