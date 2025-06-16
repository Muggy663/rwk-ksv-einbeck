# Implementierung der "Außer Konkurrenz"-Funktion

## Übersicht

Die "Außer Konkurrenz"-Funktion ermöglicht es, Teams an Wettkämpfen teilnehmen zu lassen, ohne dass ihre Ergebnisse in die offizielle Wertung einfließen. Dies ist nützlich für Gastmannschaften oder Teams, die bestimmte Voraussetzungen nicht erfüllen.

## Datenmodell

In `src/types/rwk.ts` wurde ein neues Interface hinzugefügt:

```typescript
export interface TeamCompetitionStatus {
  outOfCompetition: boolean;
  outOfCompetitionReason?: string;
}
```

## Implementierungsschritte

### 1. Datenmodell erweitern

- Das Team-Datenmodell um die Felder `outOfCompetition` (boolean) und `outOfCompetitionReason` (optional string) erweitern
- Sicherstellen, dass diese Felder in Firestore gespeichert und gelesen werden können

### 2. Admin-Bereich anpassen

- In der Mannschaftsverwaltung (`src/app/admin/teams/page.tsx`) ein Checkbox-Feld für "Außer Konkurrenz" hinzufügen
- Ein optionales Textfeld für den Grund hinzufügen (z.B. "Gastmannschaft", "Nicht regelkonform", etc.)
- Die Speicherfunktion anpassen, um diese Felder zu berücksichtigen

### 3. Ergebnisdarstellung anpassen

- In den Ligatabellen Teams mit "Außer Konkurrenz"-Status visuell kennzeichnen
- In der Rangliste diese Teams entsprechend markieren oder am Ende der Tabelle anzeigen
- Tooltips mit Erklärungen zum Status hinzufügen

### 4. Statistiken anpassen

- Sicherstellen, dass Statistiken den "Außer Konkurrenz"-Status berücksichtigen
- Option hinzufügen, um Teams "außer Konkurrenz" ein- oder auszublenden

### 5. PDF-Exporte anpassen

- In PDF-Exporten den "Außer Konkurrenz"-Status deutlich kennzeichnen
- Legende für die Kennzeichnung hinzufügen

## Benutzeroberfläche

- Klare visuelle Unterscheidung für Teams "außer Konkurrenz" (z.B. kursive Schrift, spezielle Farbe oder Icon)
- Filteroptionen in Tabellen und Listen, um Teams "außer Konkurrenz" ein- oder auszublenden
- Informative Tooltips, die den Status und Grund erklären

## Testfälle

1. Team als "außer Konkurrenz" markieren und speichern
2. Überprüfen, ob der Status korrekt in der Datenbank gespeichert wird
3. Überprüfen, ob der Status in allen relevanten Ansichten korrekt angezeigt wird
4. Testen, ob die Ranglisten-Berechnung Teams "außer Konkurrenz" korrekt behandelt
5. Überprüfen, ob PDF-Exporte den Status korrekt darstellen