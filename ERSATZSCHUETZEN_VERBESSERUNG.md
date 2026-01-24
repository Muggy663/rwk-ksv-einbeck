# RWK Tabellen - Ersatzschützen Verbesserung

## Problem
Hartmut Kahl wurde ab DG3 durch Martin Baselt ersetzt, aber das System zeigte noch den Durchschnitt statt der Gesamtpunktzahl für ersetzte Schützen an.

## Lösung
Die folgenden Änderungen wurden implementiert:

### 1. Erweiterte Substitution-Typen
- Neuer Substitution-Typ: `'replaced_shooter'` für ersetzte Schützen
- Unterscheidung zwischen Ersatzschützen (`'new_shooter'`) und ersetzten Schützen (`'replaced_shooter'`)

### 2. Angepasste Anzeige-Logik
**Dateien geändert:**
- `src/app/rwk-tabellen/page.tsx`
- `src/components/ui/mobile-team-cards.tsx`
- `src/components/ui/mobile-shooter-cards.tsx`
- `src/components/ui/substitution-badge.tsx`

**Änderungen:**
- Ersetzte Schützen zeigen jetzt die Gesamtpunktzahl statt Durchschnitt in der "Schnitt"-Spalte
- Orange Hervorhebung für ersetzte Schützen (statt gelb für Ersatzschützen)
- Verbesserte Tooltip-Texte und Badge-Anzeigen

### 3. Datenbank-Eintrag erforderlich
Um Hartmut Kahl korrekt als ersetzt zu markieren, muss folgender Eintrag in die `team_substitutions` Collection hinzugefügt werden:

```javascript
{
  competitionYear: 2026,
  teamId: "[SGi_Einbeck_Team_ID]", // Echte Team-ID einfügen
  originalShooterId: "[hartmut_kahl_shooter_id]", // Echte Schützen-ID einfügen
  originalShooterName: "Hartmut Kahl",
  replacementShooterId: "[martin_baselt_shooter_id]", // Echte Schützen-ID einfügen
  replacementShooterName: "Martin Baselt",
  fromRound: 3, // DG3
  reason: "Ersatz ab DG3",
  type: "replaced_shooter", // Wichtig: Neuer Typ!
  createdAt: new Date(),
  createdBy: "admin"
}
```

### 4. Visuelle Unterscheidung
- **Ersatzschützen** (neue Schützen): Gelber Badge "Ersatz ab DG3 für [Name]"
- **Ersetzte Schützen**: Oranger Badge "Ersetzt ab DG3"
- **Schnitt-Spalte**: Ersetzte Schützen zeigen Gesamtpunktzahl in Orange statt Durchschnitt

### 5. Anwendung
1. Die echten IDs für Team und Schützen in der Firestore-Konsole nachschlagen
2. Den Substitution-Eintrag mit den korrekten IDs erstellen
3. Das System erkennt automatisch den `type: "replaced_shooter"` und zeigt Hartmut Kahl entsprechend an

### 6. Ergebnis
- Hartmut Kahl wird als "Ersetzt ab DG3" angezeigt
- Seine Schnitt-Spalte zeigt die Gesamtpunktzahl (591) statt eines Durchschnitts
- Martin Baselt wird weiterhin normal als Ersatzschütze angezeigt
- Die Mannschaftswertung bleibt unverändert korrekt

## Dateien zur Referenz
- `add-substitution-hartmut-kahl.js` - Hilfsskript mit Beispiel-Datenstruktur
- Alle UI-Komponenten wurden entsprechend angepasst für konsistente Darstellung