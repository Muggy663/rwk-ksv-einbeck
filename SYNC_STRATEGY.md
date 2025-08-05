# KM/RWK Synchronisation Strategy

## Ziel
- `km_shooters` - KM-System (kmClubId)
- `rwk_shooters` - RWK-System (clubId) 
- **Automatische Synchronisation** zwischen beiden

## Vorteile
✅ Vereine müssen keine Schützen doppelt anlegen
✅ Beide Systeme haben gleichen Datenstand
✅ Saubere Trennung der Logik
✅ Automatische Sync-Funktionen

## Sync-Mechanismus
```javascript
// Bei KM-Schütze anlegen → auch in rwk_shooters
// Bei RWK-Schütze anlegen → auch in km_shooters
// Bei Update → beide Collections aktualisieren
```

## Implementation
1. **Migration**: 1:1 Kopie aller Schützen
2. **Sync-Functions**: Automatische Synchronisation
3. **UI-Trennung**: KM nutzt km_shooters, RWK nutzt rwk_shooters