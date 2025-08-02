# Ergebnis-Eingabe Problem - Fehlende Schützen

## 🚨 Aktuelles Problem (31.07.2025)

### Symptom:
```
Fehlende Schützen im Cache: I87y7cNGfrjHZnCDC4E6, 1AMJVLl4Xkz8yAmvXOLZ, XZ74xBQzwZ349zoDtl9H
Zusätzlich geladene Schützen für Dropdown: 0
Verfügbare Schützen für DG 5: 0 von 3 gesamt
```

### Ursache:
- Team enthält Schützen-IDs die nie existiert haben oder gelöscht wurden
- **Wichtig**: Alte RWK-Teilnehmer haben noch ihre korrekten IDs!
- Problem sind spezifische Teams mit ungültigen Referenzen
- Wahrscheinlich durch fehlerhafte Team-Erstellung oder Datenbereinigung entstanden

## 🛠️ Sofortige Lösung:

### Option 1: Team-Bereinigung (Empfohlen)
```javascript
// Admin-Tool: Entferne ungültige Schützen-IDs aus Teams
for (team of teams) {
  const validShooterIds = [];
  for (shooterId of team.shooterIds) {
    const shooterExists = await checkShooterExists(shooterId);
    if (shooterExists) validShooterIds.push(shooterId);
  }
  team.shooterIds = validShooterIds;
}
```

### Option 2: Manuelle Team-Neuzuweisung
```javascript
// Admin kann betroffene Teams öffnen und korrekte Schützen zuweisen
// Alte RWK-Schützen sind noch da und haben ihre IDs!
```

### Option 3: Team löschen und neu erstellen
```javascript
// Betroffene Teams löschen und mit korrekten Schützen neu anlegen
```

## 📋 Betroffene Teams:
- Team-ID: `CyZJxy4xoLZsykVjKFka`
- Fehlende Schützen: 3 von 3
- Status: Keine Ergebnis-Eingabe möglich

## ⚡ Schnellfix für Produktion:
1. **Sofort**: Admin-Tool zum Bereinigen von Team-Schützen-Referenzen
2. **Alternativ**: Manuelle Neuzuweisung der Schützen im Team
3. **Notfall**: Betroffene Teams löschen und neu erstellen

## ℹ️ Wichtiger Hinweis:
**Die alten RWK-Teilnehmer haben noch ihre korrekten IDs!** 
Das Problem betrifft nur spezifische Teams mit ungültigen Referenzen.

---
*Problem dokumentiert: 31.07.2025*