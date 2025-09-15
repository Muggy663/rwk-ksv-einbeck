# 🚨 MINIMALE Wartungsarbeiten 15.09.2025

## ⚠️ WARUM MINIMAL?
- Aktuelle Firebase Rules sind bereits komplex und fehleranfällig
- Mehrere temporäre `allow write: if true;` Regeln
- Doppelte Definitionen für `/clubs/{clubId}/{document=**}`
- Unvollständige Regel am Ende der Datei
- **Risiko von Totalausfall zu hoch!**

## 🎯 NUR DIESE 2 ÄNDERUNGEN MORGEN:

### 1. Marcel auf SUPER_ADMIN setzen (2 Min)
```javascript
// Firestore Console: user_permissions/marcel-uid
{
  role: 'SUPER_ADMIN',  // Statt 'vereinsvertreter'
  email: 'marcel.buenger@gmx.de',
  clubId: 'ksv-einbeck'
}
```

### 2. Dashboard-Bereiche anpassen (10 Min)
```typescript
// In Dashboard-Komponente
const hasVereinsoftwareAccess = () => {
  if (userPermissions?.role === 'SUPER_ADMIN') return true;
  if (userPermissions?.role === 'vereinsvorstand') return true;
  return false; // Alle anderen gesperrt
};
```

## ❌ WAS NICHT GEMACHT WIRD:
- ❌ Keine Firebase Rules Änderungen
- ❌ Keine neuen Rollen-Strukturen  
- ❌ Keine URL-Sicherung
- ❌ Keine Multi-Tenant Änderungen

## ✅ WARUM DAS SICHER IST:
- Bestehende Rules bleiben unverändert
- Nur Frontend-Änderungen
- Sofort rückgängig machbar
- Kein Risiko für RWK-System

## 🔄 ROLLBACK (30 Sekunden):
```bash
# Marcel-Rolle zurücksetzen
# Firestore Console: role: 'vereinsvertreter'

# Dashboard zurücksetzen
git checkout HEAD -- src/components/Dashboard.tsx
```

## 📅 NÄCHSTE SCHRITTE (WOCHEN SPÄTER):
1. **Woche 1:** Firebase Rules aufräumen und vereinfachen
2. **Woche 2:** Eine neue Rolle testen (z.B. Kassenwart)
3. **Woche 3:** URL-Sicherung für eine Seite
4. **Woche 4:** Wenn alles stabil → nächste Rolle

## 🎯 ZIEL MORGEN:
- ✅ System läuft weiter wie bisher
- ✅ Marcel hat Admin-Zugang
- ✅ Wartungshinweis für Benutzer
- ✅ Keine Ausfälle oder Probleme
- ✅ Basis für schrittweise Erweiterung

**Motto: Sicherheit vor Geschwindigkeit!** 🛡️