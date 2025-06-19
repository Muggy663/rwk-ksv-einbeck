# Firestore-Regeln für die Datenbereinigung

Um die Datenbereinigungsfunktion korrekt zu nutzen, müssen die Firestore-Regeln angepasst werden.
Hier sind die empfohlenen Regeln für die relevanten Collections:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Grundlegende Funktionen
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
        exists(/databases/$(database)/documents/user_permissions/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.email == 'admin@rwk-einbeck.de';
    }
    
    // Regeln für rwk_scores
    match /rwk_scores/{document=**} {
      // Admins können alles
      allow read, write: if isAdmin();
      
      // Vereinsvertreter können Ergebnisse für ihre Vereine lesen und schreiben
      allow read, write: if isSignedIn() && 
        exists(/databases/$(database)/documents/user_permissions/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.role == 'vereinsvertreter' &&
        get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.clubId == resource.data.clubId;
      
      // Alle anderen können nur lesen
      allow read: if isSignedIn();
    }
    
    // Regeln für rwk_shooter_team_assignments
    match /rwk_shooter_team_assignments/{document=**} {
      // Admins können alles
      allow read, write: if isAdmin();
      
      // Vereinsvertreter können Zuweisungen für ihre Vereine lesen und schreiben
      allow read, write: if isSignedIn() && 
        exists(/databases/$(database)/documents/user_permissions/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.role == 'vereinsvertreter' &&
        get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.clubId == resource.data.clubId;
      
      // Alle anderen können nur lesen
      allow read: if isSignedIn();
    }
    
    // Regeln für rwk_teams
    match /rwk_teams/{document=**} {
      // Admins können alles
      allow read, write: if isAdmin();
      
      // Vereinsvertreter können Teams für ihre Vereine lesen und schreiben
      allow read, write: if isSignedIn() && 
        exists(/databases/$(database)/documents/user_permissions/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.role == 'vereinsvertreter' &&
        get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.clubId == resource.data.clubId;
      
      // Alle anderen können nur lesen
      allow read: if isSignedIn();
    }
  }
}
```

Diese Regeln erlauben:
1. Admins haben vollen Zugriff auf alle Collections
2. Vereinsvertreter können nur Daten für ihre eigenen Vereine lesen und schreiben
3. Alle angemeldeten Benutzer können die Daten lesen

Für die Datenbereinigungsfunktion ist es wichtig, dass der angemeldete Benutzer die Berechtigung hat, Dokumente in den Collections `rwk_scores` und `rwk_shooter_team_assignments` zu löschen.