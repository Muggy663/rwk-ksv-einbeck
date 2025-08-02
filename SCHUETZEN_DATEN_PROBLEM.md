# Schützen-Daten Inkonsistenz Problem

## 🔍 Problem identifiziert (31.07.2025)

### Hauptproblem: Ungültige Team-Referenzen
**Teams enthalten Schützen-IDs die nicht mehr existieren!**

Beispiel: Team `CyZJxy4xoLZsykVjKFka` enthält:
- I87y7cNGfrjHZnCDC4E6 ❌ (existiert nicht)
- 1AMJVLl4Xkz8yAmvXOLZ ❌ (existiert nicht) 
- XZ74xBQzwZ349zoDtl9H ❌ (existiert nicht)

### Datenstruktur-Unterschiede (Sekundärproblem):

**RWK-Schützen (Original):**
```
clubId: "xMDWdLkVW5kdugTVaMeZ" (ID als String)
name: "Melina Brinckmann"
```

**Excel-Importierte Schützen:**
```
kmClubId: "Schützen-Club Naensen von 1955" (Vereinsname als String!)
name: "Wehe" (nur Nachname)
source: "excel_missing_import"
```

## ⚠️ Auswirkungen:

1. **Ergebnis-Eingabe unmöglich**: Teams mit ungültigen Schützen-IDs können nicht geladen werden
2. **Team-Anzeige**: Teams werden als "vollständig" angezeigt obwohl Schützen fehlen
3. **Datenbank-Queries**: Gemischte Datenstrukturen erschweren Abfragen

## 🛠️ Sofortige Lösung benötigt:

### Team-Bereinigung (Priorität 1):
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

## 🛠️ Bereits implementierte Fixes (v0.9.9.6):

- ✅ Mannschafts-Erstellung: Beide Schützen-Typen werden geladen
- ✅ Namen-Korrektur: `firstName + name` für Excel-Importe
- ✅ Validierung: Robuste Prüfung existierender Dokumente
- ✅ Team-Filterung: Korrigierte Logik für fehlende Ergebnisse

## 📅 Lösung für nächste Saison:

### Vor Saisonstart 2026:
1. **Team-Referenzen bereinigen**: Alle ungültigen Schützen-IDs entfernen
2. **Daten-Normalisierung**: Einheitliche Schützen-Struktur
3. **Club-ID Migration**: `kmClubId` → `clubId`
4. **Vollständige Datenbereinigung**

## 🚨 Wichtig:

**NICHT während laufender Saison ändern!** 
Anmeldungen für nächste Saison laufen bereits.

## 📊 Status:

- **Aktuell**: Funktioniert mit Workarounds
- **Nächste Saison**: Vollständige Normalisierung erforderlich
- **Priorität**: Hoch (vor Saisonstart 2026)

---
*Erstellt: 31.07.2025 - Version 0.9.9.6*