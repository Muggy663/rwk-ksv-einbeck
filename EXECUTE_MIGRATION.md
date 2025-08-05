# Migration ausführen

## Schritte:

1. **Migration Script ausführen:**
   ```bash
   # In Firebase Console oder Admin-Script
   node src/scripts/migrate-km-shooters.ts
   ```

2. **Ergebnis prüfen:**
   - `km_shooters` Collection sollte ~900 Einträge haben
   - `rwk_shooters` sollte nur noch RWK-Schützen enthalten

3. **KM-System testen:**
   - http://localhost:3000/km/mitglieder
   - Sollte nur KM-Schützen anzeigen

4. **RWK-System bereinigen:**
   - kmClubId Felder aus rwk_shooters entfernen
   - Nur noch clubId verwenden

## Status:
- ✅ Migration Script erstellt
- ✅ KM-System auf km_shooters umgestellt
- ⏳ Migration ausführen
- ⏳ RWK-System bereinigen