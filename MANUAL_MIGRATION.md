# Manuelle Migration - Firebase Konsole

## Problem
Firebase-Verbindungsfehler verhindert automatische Migration

## Lösung: Manuelle Ausführung

### 1. Firebase Console öffnen
- https://console.firebase.google.com/
- Projekt: ksv-einbeck-app
- Firestore Database

### 2. Neue Collection erstellen
- Collection ID: `km_shooters`
- Erste Dokument-ID: `test`
- Feld: `name` = `test`
- Speichern

### 3. Daten kopieren (JavaScript in Browser-Konsole)
```javascript
// In Firebase Console > Firestore > Browser-Konsole (F12)
const db = firebase.firestore();

async function copyShooters() {
  console.log('🚀 Starte Kopierung...');
  
  const shooters = await db.collection('rwk_shooters').get();
  console.log(`📊 Gefunden: ${shooters.docs.length} Schützen`);
  
  const batch = db.batch();
  let count = 0;
  
  shooters.docs.forEach(doc => {
    const data = doc.data();
    const kmRef = db.collection('km_shooters').doc(doc.id);
    batch.set(kmRef, {
      ...data,
      migratedAt: new Date(),
      migratedFrom: 'rwk_shooters'
    });
    count++;
  });
  
  await batch.commit();
  console.log(`✅ ${count} Schützen kopiert!`);
}

copyShooters();
```

### 4. Ergebnis prüfen
- km_shooters sollte ~1500 Einträge haben
- Gleiche IDs wie rwk_shooters