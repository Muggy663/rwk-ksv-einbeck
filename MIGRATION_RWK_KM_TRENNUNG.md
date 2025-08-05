# Migration: RWK und KM System Trennung

## Ziel
Trennung der rwk_shooters Collection in zwei separate Collections:
- `rwk_shooters` - nur für RWK-Rundenwettkämpfe
- `km_shooters` - nur für Kreismeisterschaften

## Aktuelle Probleme
- rwk_shooters enthält sowohl RWK (clubId) als auch KM (kmClubId) Schützen
- Konflikte bei Namensanzeige und Datenmanagement
- Schwierigkeiten bei Ergebniserfassung

## Migration Steps

### 1. Neue Collection erstellen
```javascript
// km_shooters Collection mit Struktur:
{
  id: "shooter_id",
  firstName: "Max",
  lastName: "Mustermann", 
  title: "Dr.",
  name: "Dr. Max Mustermann", // Fallback
  kmClubId: "club_id",
  gender: "male|female",
  createdAt: timestamp,
  createdBy: "migration_script"
}
```

### 2. Daten migrieren
- Alle Schützen mit `kmClubId` von rwk_shooters nach km_shooters kopieren
- rwk_shooters bereinigen (kmClubId entfernen)

### 3. Code anpassen
- KM-System: `/km/` Routen auf km_shooters umstellen
- RWK-System: Nur noch clubId verwenden

### 4. Collections nach Migration
- `rwk_shooters`: Nur RWK-Schützen (clubId)
- `km_shooters`: Nur KM-Schützen (kmClubId)

## Vorteile
✅ Saubere Trennung der Systeme
✅ Keine ID-Konflikte mehr  
✅ Einfachere Wartung
✅ Bessere Performance