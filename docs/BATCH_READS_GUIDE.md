# 🚀 Batch Reads - Implementierungs-Guide

## Problem
```typescript
// ❌ VORHER - 50 Shooter = 50 Firebase Reads
const shooters = [];
for (const result of results) {
  const shooterDoc = await getDoc(doc(db, 'shooters', result.shooterId));
  shooters.push({ id: shooterDoc.id, ...shooterDoc.data() });
}
```

## Lösung
```typescript
// ✅ NACHHER - 50 Shooter = 2 Firebase Reads (30+20)
import { batchGetShooters, getShooterName } from '@/lib/utils/batch-reads';

// 1. Sammle alle IDs
const shooterIds = results.map(r => r.shooterId);

// 2. Lade alle in einem Batch
const shooterMap = await batchGetShooters(shooterIds);

// 3. Nutze die Map
const enrichedResults = results.map(result => ({
  ...result,
  shooterName: getShooterName(result.shooterId, shooterMap),
  shooter: shooterMap.get(result.shooterId)
}));
```

## 📊 Performance-Gewinn

| Anzahl Shooter | Vorher (Reads) | Nachher (Reads) | Ersparnis |
|----------------|----------------|-----------------|-----------|
| 10             | 10             | 1               | 90%       |
| 50             | 50             | 2               | 96%       |
| 100            | 100            | 4               | 96%       |
| 500            | 500            | 17              | 97%       |

## 🎯 Wo einsetzen?

### 1. RWK-Tabellen (Höchste Priorität)
**Datei:** `src/lib/services/shooter-data-service.ts`
**Funktion:** `fetchShooterDataForCompetition()`

```typescript
// Statt einzeln Shooter zu laden:
const shooterIds = scores.map(s => s.shooterId);
const shooterMap = await batchGetShooters(shooterIds);
```

### 2. KM-Meldungen
**Datei:** `src/app/km-orga/meldungen/page.tsx`

```typescript
// Beim Laden der Meldungen:
const shooterIds = meldungen.map(m => m.schuetzeId);
const shooterMap = await batchGetShooters(shooterIds);
```

### 3. Social Training Leaderboards
**Datei:** `src/app/training-groups/[id]/page.tsx`

```typescript
// Beim Laden der Gruppen-Ergebnisse:
const userIds = results.map(r => r.userId);
const shooterMap = await batchGetShooters(userIds);
```

## 🔧 Migration Schritt-für-Schritt

### Schritt 1: Import hinzufügen
```typescript
import { batchGetShooters, getShooterName } from '@/lib/utils/batch-reads';
```

### Schritt 2: IDs sammeln
```typescript
const shooterIds = data.map(item => item.shooterId).filter(Boolean);
```

### Schritt 3: Batch laden
```typescript
const shooterMap = await batchGetShooters(shooterIds);
```

### Schritt 4: Daten anreichern
```typescript
const enriched = data.map(item => ({
  ...item,
  shooterName: getShooterName(item.shooterId, shooterMap)
}));
```

## 💡 Best Practices

1. **Früh laden**: Batch-Load am Anfang der Funktion
2. **Einmal laden**: Nicht in Schleifen
3. **Map wiederverwenden**: Für mehrere Operationen
4. **Null-Checks**: IDs filtern vor Batch-Load

## ⚠️ Limitierungen

- Firebase 'in' Query: Max 30 IDs pro Query
- Automatisches Batching in Utility implementiert
- Bei >30 IDs: Mehrere Queries automatisch

## 🎯 Nächste Schritte

Soll ich eine dieser Stellen konkret umsetzen?
1. RWK-Tabellen (größter Impact)
2. KM-Meldungen
3. Social Training
