# Datenbankschema RWK Einbeck App

Dieses Dokument beschreibt die Datenbankstruktur der RWK Einbeck App und dient als Referenz für die Entwicklung.

## Firestore Collections

### seasons
Wettkampfsaisons mit Jahr, Disziplin und Status.

```typescript
interface Season {
  id: string;
  competitionYear: number;
  name: string;
  type: 'KK' | 'LD'; // Kleinkaliber oder Luftdruck
  status: 'Geplant' | 'Laufend' | 'Abgeschlossen';
}
```

### rwk_leagues
Ligen mit Zuordnung zu Saisons und spezifischem Disziplintyp.

```typescript
interface League {
  id: string;
  name: string;
  shortName?: string;
  seasonId: string;
  competitionYear: number;
  type: 'KKG' | 'KKP' | 'LG' | 'LGA' | 'LP' | 'LPA'; // Spezifischer Disziplintyp
  order?: number;
}
```

### clubs
Vereine mit Name, Kürzel und Vereinsnummer.

```typescript
interface Club {
  id: string;
  name: string;
  shortName?: string;
  clubNumber?: string;
}
```

### rwk_teams
Mannschaften mit Zuordnung zu Verein, Liga und Saison sowie Schützen-IDs.

```typescript
interface Team {
  id: string;
  name: string;
  clubId: string;
  leagueId?: string | null;
  seasonId?: string;
  competitionYear: number;
  shooterIds?: string[];
  captainName?: string;
  captainEmail?: string;
  captainPhone?: string;
}
```

### rwk_shooters
Schützen mit Name, Geschlecht und Vereinszugehörigkeit.

```typescript
interface Shooter {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  clubId: string;
  gender?: 'male' | 'female' | string;
  teamIds?: string[];
}
```

### rwk_scores
Ergebnisse mit Zuordnung zu Mannschaft, Schütze, Durchgang und Liga.

```typescript
interface ScoreEntry {
  id: string;
  seasonId: string;
  seasonName?: string;
  leagueId: string;
  leagueName?: string;
  leagueType: 'KKG' | 'KKP' | 'LG' | 'LGA' | 'LP' | 'LPA';
  teamId: string;
  teamName?: string;
  clubId: string;
  shooterId: string;
  shooterName?: string;
  shooterGender?: 'male' | 'female' | string;
  durchgang: number;
  totalRinge: number;
  scoreInputType: 'regular' | 'pre' | 'post';
  competitionYear: number;
  enteredByUserId: string;
  enteredByUserName: string;
  entryTimestamp: Timestamp;
  lastEditedByUserId?: string;
  lastEditedByUserName?: string;
  lastEditTimestamp?: Timestamp;
}
```

### league_updates
Aktualisierungen für den "Letzte Änderungen"-Feed auf der Startseite.

```typescript
interface LeagueUpdateEntry {
  id?: string;
  leagueId: string;
  leagueName: string;
  leagueType: 'KKG' | 'KKP' | 'LG' | 'LGA' | 'LP' | 'LPA';
  competitionYear: number;
  timestamp: Timestamp;
  action: 'results_added';
}
```

### support_tickets
Support-Anfragen von Benutzern.

```typescript
interface SupportTicket {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: Timestamp;
  status: 'neu' | 'in Bearbeitung' | 'gelesen' | 'geschlossen';
  reportedByUserId?: string | null;
}
```

### user_permissions
Benutzerberechtigungen mit Rolle und Vereinszuordnung.

```typescript
interface UserPermission {
  uid: string; // User-ID aus Firebase Auth, dient als Dokument-ID
  email: string;
  displayName?: string | null;
  role: 'vereinsvertreter' | 'mannschaftsfuehrer' | null;
  clubId: string | null;
  lastUpdated?: Timestamp;
}
```

### audit_logs
Protokollierung von Änderungen an Ergebnissen und anderen wichtigen Daten.

```typescript
interface AuditLog {
  id: string;
  timestamp: Timestamp;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete';
  resourceType: 'score' | 'team' | 'shooter' | 'user_permission';
  resourceId: string;
  oldValue?: any;
  newValue: any;
  details?: string;
}
```

## Firestore Sicherheitsregeln

Die Sicherheitsregeln basieren auf der `user_permissions`-Collection und definieren den Zugriff für verschiedene Benutzerrollen:

### Aktuelle Sicherheitsregeln (Version 0.6.1)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // === Globale Hilfsfunktionen ===
    function isSuperAdmin() {
      return request.auth != null && request.auth.token.email == 'admin@rwk-einbeck.de';
    }

    function isAuthenticated() {
      return request.auth != null;
    }

    function isVereinsvertreter() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.role == 'vereinsvertreter';
    }

    function isMannschaftsfuehrer() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.role == 'mannschaftsfuehrer';
    }

    function hasClubAccess(clubId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.clubId == clubId;
    }

    // === Regeln für Collections ===

    // Öffentlich lesbare, nur von Admin schreibbare Collections
    match /seasons/{season} {
      allow read: if true;
      allow write: if isSuperAdmin();
    }

    match /clubs/{club} {
      allow read: if true;
      allow write: if isSuperAdmin();
    }

    match /rwk_leagues/{league} {
      allow read: if true;
      allow write: if isSuperAdmin();
    }

    match /newsItems/{newsItem} { 
      allow read: if true;
      allow write: if isSuperAdmin();
    }

    // Teams - Verwaltung durch Admin und Vereinsvertreter
    match /rwk_teams/{teamId} {
      allow read: if true;
      
      allow create: if isSuperAdmin() ||
                      (isVereinsvertreter() && 
                       hasClubAccess(request.resource.data.clubId));
      
      allow update: if isSuperAdmin() ||
                      (isVereinsvertreter() && 
                       hasClubAccess(resource.data.clubId) && 
                       hasClubAccess(request.resource.data.clubId));
                        
      allow delete: if isSuperAdmin() || 
                      (isVereinsvertreter() && 
                       hasClubAccess(resource.data.clubId));
    }

    // Schützen - Verwaltung durch Admin und Vereinsvertreter
    match /rwk_shooters/{shooterId} {
      allow read: if true; 
      
      allow create: if isSuperAdmin() ||
                      (isVereinsvertreter() && 
                       hasClubAccess(request.resource.data.clubId));

      allow update: if isSuperAdmin() ||
                      (isVereinsvertreter() && 
                       hasClubAccess(resource.data.clubId) &&
                       hasClubAccess(request.resource.data.clubId));

      allow delete: if isSuperAdmin() ||
                      (isVereinsvertreter() && 
                       hasClubAccess(resource.data.clubId));
    }

    // Ergebnisse - Erfassung durch jeden authentifizierten Benutzer
    match /rwk_scores/{scoreId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isSuperAdmin();
    }

    // Liga-Updates - Lesbar für alle, schreibbar für authentifizierte Benutzer
    match /league_updates/{updateId} { 
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isSuperAdmin();
    }

    // Support-Tickets - Erstellung für alle, Verwaltung nur für Admin
    match /support_tickets/{ticketId} {
      allow create: if true;
      allow read, update, delete: if isSuperAdmin();
    }

    // Benutzerberechtigungen - Lesbar für Admin und eigenen Benutzer, schreibbar nur für Admin
    match /user_permissions/{userId} {
      allow read: if isSuperAdmin() || (isAuthenticated() && request.auth.uid == userId);
      allow write: if isSuperAdmin();
    }

    // Fallback-Regel: Alles andere verbieten
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Zugriffsregeln Zusammenfassung

- **Öffentlich lesbare Collections**: seasons, clubs, rwk_leagues, newsItems
- **Beschränkte Schreibrechte** für Vereinsvertreter und Mannschaftsführer auf ihre eigenen Daten
- **Vollzugriff** für Super-Administrator auf alle Collections
- **Validierung der Benutzerrechte** basierend auf UID und zugewiesenem Verein (clubId)

## Wichtige Konstanten und Einschränkungen

```typescript
// Disziplinkategorien
const GEWEHR_DISCIPLINES = ['KKG', 'LG', 'LGA'];
const PISTOL_DISCIPLINES = ['KKP', 'LP', 'LPA'];

// Maximale Anzahl Schützen pro Mannschaft
const MAX_SHOOTERS_PER_TEAM = 3;

// UI-Disziplinfilter
const uiDisciplineFilterOptions = [
  { value: 'KK', label: 'Kleinkaliber (KK)', firestoreTypes: ['KKG', 'KKP'] },
  { value: 'LD', label: 'Luftdruck (LG/LP)', firestoreTypes: ['LG', 'LGA', 'LP', 'LPA'] },
];
```

## Geschäftsregeln

1. Ein Schütze darf pro Saison und Disziplinkategorie (Gewehr/Pistole) nur in einer Mannschaft schießen
2. Maximal 3 Schützen pro Mannschaft
3. Mannschaften werden nach Spielstärke benannt (I, II, III)
4. Einzelschützen werden in speziellen "Einzel"-Mannschaften geführt
5. Nur der Super-Admin kann Mannschaften Ligen zuweisen
6. Vereinsvertreter können nur ihre eigenen Mannschaften und Schützen verwalten

## Benutzerrollen und Berechtigungen

- **Super-Administrator**: Vollzugriff auf alle Funktionen, verwaltet Saisons, Ligen, Vereine und Benutzerrechte
- **Vereinsvertreter**: Kann Mannschaften und Schützen für seinen Verein verwalten und Ergebnisse erfassen
- **Mannschaftsführer**: Kann Ergebnisse für seine Mannschaften erfassen, aber keine Stammdaten ändern
- **Öffentlichkeit**: Kann Tabellen, Ergebnisse und allgemeine Informationen einsehen