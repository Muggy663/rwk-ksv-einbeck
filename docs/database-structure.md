# 🗄️ Firestore Datenbankstruktur - RWK Einbeck App

> **Letzte Aktualisierung:** Januar 2025  
> **Version:** 1.7.3

## 📋 Übersicht Collections (Real Database)

### 🏆 **RWK (Rundenwettkampf) Collections**

#### `seasons` - Saisons
```typescript
interface Season {
  id: string;
  name: string;                    // "Saison 2024/25"
  competitionYear: number;         // 2025
  status: 'Laufend' | 'Beendet';
  startDate?: Timestamp;
  endDate?: Timestamp;
}
```

#### `rwk_leagues` - Ligen
```typescript
interface League {
  id: string;
  name: string;                    // "1. Kreisklasse Gewehr"
  seasonId: string;                // Referenz zu seasons
  competitionYear: number;         // 2025
  type: FirestoreLeagueSpecificDiscipline; // 'KKG' | 'KKP' | 'LGA' | 'LGS' | 'LP'
  order?: number;                  // Sortierung
  maxTeams?: number;
  minTeams?: number;
}
```

#### `clubs` - Vereine
```typescript
interface Club {
  id: string;
  name: string;                    // "SV Musterverein (SVM)"
  shortName?: string;              // "SVM"
  address?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  active: boolean;
}
```

#### `rwk_teams` - Mannschaften
```typescript
interface Team {
  id: string;
  name: string;                    // "SVM I"
  clubId: string;                  // Referenz zu clubs
  seasonId: string;                // Referenz zu seasons
  leagueId: string | null;         // Referenz zu rwk_leagues (null = nicht zugewiesen)
  leagueType?: FirestoreLeagueSpecificDiscipline;
  competitionYear: number;         // 2025
  shooterIds: string[];            // Array von shooter IDs
  captainName?: string;
  captainEmail?: string;
  captainPhone?: string;
  outOfCompetition?: boolean;      // Außer Konkurrenz
  outOfCompetitionReason?: string;
}
```

#### `shooters` - Schützen
```typescript
interface Shooter {
  id: string;
  name: string;                    // Vollname oder Nachname
  firstName?: string;
  lastName?: string;
  gender: 'male' | 'female' | 'unknown';
  birthYear?: number;
  clubId?: string;                 // Hauptverein
  rwkClubId?: string;              // RWK-spezifischer Verein
  teamIds: string[];               // Array von team IDs
  title?: string;                  // "Dr.", "Prof." etc.
  email?: string;
  phone?: string;
  active?: boolean;
}
```

#### `rwk_scores` - Ergebnisse
```typescript
interface ScoreEntry {
  id: string;
  seasonId: string;
  seasonName: string;
  leagueId: string;
  leagueName: string;
  leagueType: FirestoreLeagueSpecificDiscipline;
  teamId: string;
  teamName: string;
  clubId: string;
  shooterId: string;
  shooterName: string;
  shooterGender: 'male' | 'female' | 'unknown';
  durchgang: number;               // 1-5 (Gewehr) oder 1-4 (Luftwaffen)
  totalRinge: number;              // Ergebnis in Ringen
  scoreInputType: 'regular' | 'pre' | 'post'; // Regulär/Vor-/Nachschießen
  competitionYear: number;
  entryTimestamp: Timestamp;
  enteredByUserId: string;
  enteredByUserName: string;
}
```

#### `league_updates` - Liga-Updates für Tabellen-Neuberechnung
```typescript
interface LeagueUpdateEntry {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueType: FirestoreLeagueSpecificDiscipline;
  competitionYear: number;
  timestamp: Timestamp;
  action: 'results_added' | 'team_added' | 'manual_update';
}
```

### 🏅 **KM (Kreismeisterschaft) Collections**

#### `km_jahre` - KM-Jahre
```typescript
interface KMYear {
  id: string;
  year: number;                   // 2025, 2026
  status: 'Planung' | 'Meldungen' | 'Laufend' | 'Beendet';
  disciplines: string[];          // Verfügbare Disziplinen
}
```

#### `km_disziplinen` - KM-Disziplinen
```typescript
interface KMDiscipline {
  id: string;
  name: string;                   // "Kleinkaliber", "Luftgewehr"
  shortName: string;              // "KK", "LG"
  maxRings: number;               // 300, 400
  active: boolean;
}
```

#### `km_wettkampfklassen` - Wettkampfklassen
```typescript
interface KMCompetitionClass {
  id: string;
  name: string;                   // "Jugend", "Erwachsene", "Senioren"
  minAge?: number;
  maxAge?: number;
  gender?: 'male' | 'female' | 'mixed';
}
```

#### `km_meldungen_JAHR_DISZIPLIN` - KM-Meldungen
```typescript
// Beispiel: km_meldungen_2026_kk
interface KMMeldung {
  id: string;
  shooterId: string;
  shooterName: string;
  clubId: string;
  clubName: string;
  discipline: string;
  ageClass: string;
  year: number;
  registrationDate: Timestamp;
  registeredBy: string;
}
```

#### `km_mannschaften` - KM-Mannschaften
```typescript
interface KMTeam {
  id: string;
  name: string;
  clubId: string;
  discipline: string;
  year: number;
  shooterIds: string[];
}
```

#### `km_startlisten` - Startlisten
```typescript
interface KMStartlist {
  id: string;
  discipline: string;
  year: number;
  ageClass: string;
  participants: {
    shooterId: string;
    shooterName: string;
    clubName: string;
    startNumber: number;
  }[];
}
```

#### `km_startlisten_configs` - Startlisten-Konfiguration
```typescript
interface KMStartlistConfig {
  id: string;
  discipline: string;
  year: number;
  settings: {
    groupSize: number;
    startTime: string;
    lanes: number;
  };
}
```

#### `km_vm_ergebnisse` - Vereinsmeisterschafts-Ergebnisse
```typescript
interface KMVMResult {
  id: string;
  shooterId: string;
  discipline: string;
  year: number;
  result: number;
  rank: number;
}
```

#### `km_user_permissions` - KM-spezifische Berechtigungen
```typescript
interface KMUserPermission {
  uid: string;
  email: string;
  role: 'km_orga' | 'vereinsvertreter';
  clubIds: string[];
  active: boolean;
}
```

### 👥 **Vereinssoftware Collections**

#### `clubs/{clubId}/mitglieder` - Mitglieder (Multi-Tenant)
```typescript
// Beispiel: clubs/xMDWdLkVW5kdugTVaMeZ/mitglieder
interface Member {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  birthDate: Timestamp;
  joinDate: Timestamp;
  exitDate?: Timestamp;
  address?: {
    street: string;
    zipCode: string;
    city: string;
  };
  contact?: {
    email: string;
    phone: string;
    mobile: string;
  };
  membershipType: 'Erwachsene' | 'Jugend' | 'Senioren' | 'Familie';
  status: 'active' | 'inactive';
  sepaMandate?: {
    mandateId: string;
    iban: string;
    bic: string;
    bankName: string;
    accountHolder: string;
    signedDate: Timestamp;
  };
  paymentMethod: 'SEPA' | 'Überweisung' | 'Bar';
}
```

#### `vereinsrecht_protokolle` - Vereinsrecht Protokolle
```typescript
interface VereinsrechtProtocol {
  id: string;
  clubId: string;                 // clubs/xMDWdLkVW5kdugTVaMeZ
  title: string;
  date: Timestamp;
  type: 'Vorstandssitzung' | 'Mitgliederversammlung' | 'Sonstige';
  agenda: string[];
  decisions: string[];
  participants: string[];
  status: 'Entwurf' | 'Fertig' | 'Versendet';
  createdBy: string;
  createdAt: Timestamp;
}
```

### 📰 **News & Events**

#### `newsItems` - News-Artikel
```typescript
interface NewsItem {
  id: string;
  title: string;
  content: string;
  author: string;
  publishDate: Timestamp;
  category: 'RWK' | 'KM' | 'Allgemein';
  published: boolean;
  tags?: string[];
}
```

#### `rwk_news` - RWK-spezifische News
```typescript
interface RWKNews {
  id: string;
  title: string;
  content: string;
  leagueId?: string;
  seasonId?: string;
  publishDate: Timestamp;
  author: string;
}
```

#### `events` - Termine/Events
```typescript
interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  location?: string;
  type: 'RWK' | 'KM' | 'Training' | 'Sonstige';
  clubId?: string;
  public: boolean;
}
```

### 📧 **Kommunikation & Support**

#### `email_contacts` - E-Mail-Kontakte
```typescript
interface EmailContact {
  id: string;
  name: string;
  email: string;
  role: string;
  clubId?: string;
  active: boolean;
}
```

#### `support_tickets` - Support-Tickets
```typescript
interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'Offen' | 'In Bearbeitung' | 'Geschlossen';
  priority: 'Niedrig' | 'Normal' | 'Hoch' | 'Kritisch';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `support_sessions` - Support-Sitzungen
```typescript
interface SupportSession {
  id: string;
  userId: string;
  clubId?: string;
  sessionCode: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  status: 'active' | 'expired';
}
```

### ⚙️ **System & Configuration**

#### `admin_settings` - Admin-Einstellungen
```typescript
interface AdminSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  updatedBy: string;
  updatedAt: Timestamp;
}
```

#### `system_config` - System-Konfiguration
```typescript
interface SystemConfig {
  id: string;
  feature: string;
  enabled: boolean;
  config: Record<string, any>;
  version: string;
}
```

#### `app_stats` - App-Statistiken
```typescript
interface AppStats {
  id: string;
  date: Timestamp;
  activeUsers: number;
  totalLogins: number;
  featuresUsed: Record<string, number>;
  errors: number;
}
```

#### `audit_logs` - Audit-Protokolle
```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}
```

### 🔐 **Benutzer & Berechtigungen**

#### `user_permissions` - Benutzerberechtigungen
```typescript
interface UserPermission {
  uid: string;                    // Firebase Auth UID
  email: string;
  
  // Legacy Rollen (wird ausgemustert)
  role?: 'vereinsvertreter' | 'mannschaftsfuehrer' | 'superadmin';
  clubId?: string;                // Legacy
  clubIds?: string[];             // Legacy
  representedClubs?: string[];    // Legacy
  
  // Neue Rollen-Struktur
  clubRoles?: {                   // Multi-Verein-Rollen
    [clubId: string]: 'SPORTLEITER' | 'VORSTAND' | 'KASSENWART' | 'SCHRIFTFUEHRER';
  };
  kvRole?: 'KV_WETTKAMPFLEITER' | 'KV_KM_ORGA'; // Kreisverband-Rollen
  
  // Zusätzliche Berechtigungen
  roles?: string[];               // ['vereinssoftware', 'km_access']
  lastLogin?: Timestamp;
  active: boolean;
}
```

## 🔄 **Datenbeziehungen**

### RWK-Beziehungen
```
seasons (1) ←→ (n) rwk_leagues
clubs (1) ←→ (n) rwk_teams
rwk_leagues (1) ←→ (n) rwk_teams
rwk_teams (1) ←→ (n) shooters (via shooterIds array)
rwk_teams (1) ←→ (n) rwk_scores
shooters (1) ←→ (n) rwk_scores
```

### KM-Beziehungen
```
clubs (1) ←→ (n) km_shooters
km_shooters (1) ←→ (n) km_meldungen_JAHR_DISZIPLIN
```

### Vereinssoftware-Beziehungen (Multi-Tenant)
```
clubs/{clubId}/members (1) ←→ (n) clubs/{clubId}/licenses
clubs/{clubId}/members (1) ←→ (n) clubs/{clubId}/birthdays
clubs/{clubId}/members (1) ←→ (n) clubs/{clubId}/tasks (assignedTo)
```

## 🛡️ **Firestore Security Rules Struktur**

### RWK-Bereiche
- **Admin (superadmin)**: Vollzugriff auf alle RWK-Collections
- **Sportleiter**: Lese-/Schreibzugriff auf eigene Vereins-Teams und Schützen
- **Vereinsvertreter**: Lesezugriff auf eigene Daten

### KM-Bereiche  
- **KV_KM_ORGA**: Vollzugriff auf KM-Collections
- **Vereinsvertreter**: Schreibzugriff auf eigene KM-Meldungen

### Vereinssoftware
- **Multi-Tenant**: Zugriff nur auf `/clubs/{clubId}/` wo User berechtigt ist
- **Rollen-basiert**: SPORTLEITER, VORSTAND, KASSENWART, SCHRIFTFUEHRER

## 📊 **Wichtige Indizes**

### Performance-kritische Abfragen
```javascript
// rwk_teams
{ clubId: 1, competitionYear: 1 }
{ leagueId: 1, competitionYear: 1 }

// rwk_scores  
{ teamId: 1, competitionYear: 1, durchgang: 1 }
{ leagueId: 1, competitionYear: 1 }
{ shooterId: 1, competitionYear: 1 }

// shooters
{ clubId: 1, active: 1 }
{ rwkClubId: 1 }

// user_permissions
{ email: 1 }
{ clubRoles: 1 }
```

## 🔧 **Disziplin-Typen**

```typescript
type FirestoreLeagueSpecificDiscipline = 
  | 'KKG'    // Kleinkaliber Gewehr
  | 'KKP'    // Kleinkaliber Pistole  
  | 'LGA'    // Luftgewehr Auflage
  | 'LGS'    // Luftgewehr Freihand
  | 'LP'     // Luftpistole
  | 'LPA';   // Luftpistole Auflage
```

## 📝 **Besonderheiten**

### Multi-Tenant Architektur
- Vereinssoftware nutzt `/clubs/{clubId}/` Subcollections
- Automatische Datentrennung zwischen Vereinen
- Skalierbar für beliebig viele Vereine

### Jahres-spezifische Collections
- KM-Meldungen: `km_meldungen_2025_KKG`, `km_meldungen_2025_LGA`, etc.
- Automatische Erstellung neuer Collections pro Jahr/Disziplin

### Legacy-Support
- Alte Rollen-Struktur wird noch unterstützt
- Schrittweise Migration zu neuer `clubRoles`-Struktur
- Rückwärtskompatibilität gewährleistet

---

**📧 Kontakt bei Fragen:** rwk-leiter-ksve@gmx.de