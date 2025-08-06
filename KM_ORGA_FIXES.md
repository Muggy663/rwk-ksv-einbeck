# KM-Orga Fixes

## Behobene Probleme

### 1. 404 Error für Meldungs-Statistiken
**Problem**: Link zu `/km-orga/meldungen/statistik` führte zu 404 Error
**Lösung**: Statistik-Seite erstellt unter `src/app/km-orga/meldungen/statistik/page.tsx`
**Features der neuen Seite**:
- Übersicht über alle Meldungen
- Statistiken nach Disziplin, Verein und Altersklasse
- Filterbare Jahresauswahl
- Responsive Design

### 2. Schießzeiten für Schüler korrigiert
**Problem**: Schüler hatten 40 Schuss statt der korrekten 20 Schuss
**Lösung**: Separate Schüler-Disziplinen mit "S" Suffix hinzugefügt
**Betroffene Disziplinen**:
- `1.10S` - Luftgewehr Schüler (20 Schuss, 45 Min)
- `1.11S` - Luftgewehr Auflage Schüler (20 Schuss, 40 Min)
- `2.10S` - Luftpistole Schüler (20 Schuss, 45 Min)
- `2.11S` - Luftpistole Auflage Schüler (20 Schuss, 40 Min)
- `11.10S` - Lichtgewehr Schüler (20 Schuss, 40 Min)
- `11.11S` - Faszination Lichtgewehr Schüler (20 Schuss, 40 Min)
- `11.50S` - Lichtpistole Schüler (20 Schuss, 40 Min)
- `11.51S` - Faszination Lichtpistole Schüler (20 Schuss, 40 Min)

### 3. Farb- und Nummerierungskonsistenz
**Problem**: Zahlen und Farben der Schritte-Karten passten nicht zusammen
**Lösung**: Alle Hauptkarten verwenden jetzt einheitlich blaue Farbe mit korrekter Nummerierung (1, 2, 3)

## Neue Hilfsfunktionen

### `getCorrectDisciplineForAge()`
Automatische Auswahl der korrekten Disziplin basierend auf dem Alter:
- Schüler (≤14 Jahre) erhalten automatisch die "S"-Variante mit 20 Schuss
- Alle anderen erhalten die Standard-Disziplin mit 40 Schuss

## Technische Details

- Alle Änderungen sind rückwärtskompatibel
- Bestehende Meldungen bleiben unverändert
- Neue Meldungen können die korrekten Schüler-Disziplinen verwenden
- Statistik-Seite verwendet dieselben APIs wie die Hauptseite

## Nächste Schritte

1. Testen der neuen Statistik-Seite
2. Überprüfung der Schüler-Disziplinen in der Meldungserfassung
3. Ggf. Migration bestehender Schüler-Meldungen zu den neuen Disziplinen