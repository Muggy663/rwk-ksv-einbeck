# Firestore Rules Update

## Problem
km_shooters Collection hat keine Berechtigung

## Lösung: Manuelle Rule-Ergänzung

### 1. Firebase Console öffnen
- https://console.firebase.google.com/
- Projekt: ksv-einbeck-app
- Firestore Database > Rules

### 2. Diese Regel hinzufügen
```javascript
// Nach der rwk_shooters Regel einfügen:
match /km_shooters/{shooterId} {
  allow read: if true;
  allow create: if true;
  allow update: if true; 
  allow delete: if true;
}
```

### 3. Veröffentlichen
- "Veröffentlichen" Button klicken
- Warten bis aktiv

### 4. Migration erneut versuchen
- http://localhost:3000/admin/simple-copy
- Button klicken