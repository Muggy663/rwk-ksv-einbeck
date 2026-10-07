# Firestore-Datenbankstruktur – RWK Einbeck App

> **Letzte Aktualisierung:** Oktober 2026 (App-Version 3.3.2)
> **Quelle:** aus dem Code ermittelt (`firestore.rules`, `src/types/`, `src/lib/`). Belege sind je Abschnitt angegeben.

Dieses Dokument beschreibt den tatsächlichen Stand der Firestore-Collections und der wichtigsten Dokumentfelder. Es ersetzt die veraltete Vorgängerfassung (Stand Januar 2025), die in mehreren Punkten nicht mehr stimmte.

---

## 0. Datenbank-Instanz (wichtig!)

Die App nutzt **nicht** die Firestore-Default-Datenbank, sondern eine **benannte Datenbank** mit der ID `restored-main`.

- Client-SDK: `src/lib/firebase/config.ts`
  `const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'restored-main';`
  → `getFirestore(app, databaseId)`. Cloud-Functions-Region: `europe-west1`.
- Admin-SDK: `src/lib/firebase/admin.ts`
  `const databaseId = process.env.FIREBASE_DATABASE_ID || 'restored-main';`. Service-Account aus `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`.

> ⚠️ **Stolperstein:** Wer gegen `(default)` statt `restored-main` testet, sieht leere Collections. Diagnose-Skripte müssen die DB-ID explizit setzen.

---

## 1. Dynamische (saison-/jahr-spezifische) Collections

Zwei Daten-Arten liegen **nicht** in einer einzigen Collection, sondern nach Jahr und Disziplin aufgeteilt. Das ist der häufigste Grund für „ich finde ein Ergebnis nicht" und für neue Index-Anforderungen pro Saison.

### RWK-Ergebnisse: `rwk_scores_{JAHR}_{TYP}`
Erzeugt in `src/lib/utils/collection-names.ts` → `getSeasonSpecificScoresCollection(year, leagueType)` als `rwk_scores_${year}_${normalizedDiscipline}`.

Die Disziplin wird dabei **normalisiert/zusammengefasst** (nicht 1:1 der Liga-Typ):

| Liga-Typ | normalisiert zu |
|---|---|
| `KK`, `KKG` | `KK` |
| `LG`, `LGA`, `LGS`, `LP`, `LPA` | `LD` |
| `KKP` | `KKP` |
| alles andere | `UNKNOWN` |

> ⚠️ **Gotcha:** `LGS` (Luftgewehr Freihand) gehört bewusst zu `LD`. Fehlt die Zuordnung, landet ein LGS-Ergebnis in `rwk_scores_JAHR_UNKNOWN` und ist für Tabellen/Statistik unauffindbar.

Beispiele real: `rwk_scores_2024_KK`, `rwk_scores_2026_LD`, `rwk_scores_2026_KKP`. Ohne Jahr/Typ fällt `getScoresCollectionName()` auf die Alt-Collection `rwk_scores` zurück. Die Rules matchen per Wildcard `collection.matches('rwk_scores_.*')`.

### KM-Meldungen: `km_meldungen_{JAHR}_{kuerzel}`
Erzeugt in `src/app/api/km/jahre/route.ts` beim Anlegen einer KM-Saison; der Name wird als Feld `collectionName` im `km_saisons`-Dokument gespeichert. Kürzel **kleingeschrieben**: `kk`, `ld`, `kkp` (z. B. `km_meldungen_2026_ld`).

> ⚠️ KM-Meldungen liegen über mehrere Collections verteilt (Jahr + Disziplin), **plus** eine ältere unversionierte Sammel-Collection `km_meldungen`. Beim Suchen einer Meldung müssen ggf. mehrere Collections geprüft werden. Beachte: RWK-Scores nutzen Großbuchstaben (`KK/LD/KKP`), KM-Meldungen Kleinbuchstaben (`kk/ld/kkp`).

---

## 2. RWK-Collections (Rundenwettkampf)

| Collection | Zweck | Entität | Zugriff (grob) |
|---|---|---|---|
| `seasons` | Saisons | `Season` | read öffentlich, write Admin |
| `rwk_leagues` | Ligen | `League` | read öffentlich, write Admin |
| `clubs` | Vereine | `Club` | read öffentlich; update Sportleiter/Vorstand des Vereins; create/delete Admin |
| `shooters` | Schützen/Mitglieder (zentral für RWK **und** KM) | `Shooter` | read öffentlich; create/update bei Rolle; **delete nur Admin-SDK** |
| `rwk_teams` | Mannschaften | `Team` | create/update/delete durch Admin oder Club-Rollen (anhand `clubId`) |
| `rwk_scores` | Alt-/Fallback-Ergebnisse | `ScoreEntry` | read öffentlich; create auth+gültige Ringe; update/delete Admin |
| `rwk_scores_{JAHR}_{TYP}` | saisonspezifische Ergebnisse | `ScoreEntry` | wie `rwk_scores` (per Wildcard) |
| `team_substitutions` | Ersatzschützen | – | read öffentlich, write Admin |
| `ausrichter_historie` | Ausrichter 1. Durchgang | – | write Admin/KM-Orga/Sportleiter/Vorstand |

### Season (`src/types/rwk.ts`)
```typescript
interface Season {
  id: string;
  name: string;
  competitionYear: number;
  type: string;
  status: 'Vorbereitung' | 'Anmeldung möglich' | 'Laufend' | 'Abgeschlossen';
  startDate?: Date;
  endDate?: Date;
  meldestart?: string;   // ISO "YYYY-MM-DD" – Cron öffnet Meldefenster ab diesem Tag
  meldeschluss?: string; // ISO "YYYY-MM-DD"
  wettkampfende?: string; // ISO "YYYY-MM-DD" – Abgabeschluss
}
```
> ⚠️ 4 feste deutsche Status-Werte (inkl. „Anmeldung möglich" mit Leerzeichen). KM-Saisons nutzen ein **eigenes** Status-Feld mit anderen Werten (Default `'vorbereitung'`).

### Liga-Disziplin-Typ (`FirestoreLeagueSpecificDiscipline`)
```typescript
type FirestoreLeagueSpecificDiscipline =
  'KK' | 'KKP' | 'KKG' | 'LG' | 'LGA' | 'LGS' | 'LP' | 'LPA' | 'LD';
```
UI-Gruppierung: `KK` = {KK, KKP, KKG}; `LG`/Luftdruck = {LG, LGA, LGS, LP, LPA, LD}.

### League (`src/types/rwk.ts`)
```typescript
interface League {
  id: string;
  name: string;
  shortName?: string;
  type: FirestoreLeagueSpecificDiscipline;
  seasonId: string;
  competitionYear: number;
  order?: number;              // Liga-Rang (Hierarchie); kann fehlen
  shotSettings?: {             // konfigurierbar über /admin/league-settings
    discipline: string;        // Klartext, z. B. "Luftgewehr Freihand"
    shotCount: number;
    maxRings: number;
    description?: string;
    customDiscipline?: string;
  };
}
```

### Club (`src/types/rwk.ts`)
```typescript
interface Club {
  id: string;
  name: string;
  shortName?: string;
  clubNumber?: string;             // Vereinsnummer, Format "08-XXX"
  address?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  ausrichterDisziplinen?: string[]; // 'LG' | 'KKG' | 'KKP' (Standkapazität)
  mapsUrl?: string;                 // Anfahrt-Link
  homepageUrl?: string;
  keineEigenenStaende?: boolean;    // z. B. Schießsportgemeinschaft
}
```

### Team (`src/types/rwk.ts`)
```typescript
interface Team {
  id: string;
  name: string;
  clubId: string;
  leagueId?: string | null;        // null = (noch) nicht zugewiesen
  leagueType?: FirestoreLeagueSpecificDiscipline | null;
  seasonId: string;
  competitionYear: number;
  shooterIds: string[];
  captainName?: string;
  captainEmail?: string;
  captainPhone?: string;
  teamLeader?: string;             // Legacy (nicht mehr geschrieben)
  teamLeaderEmail?: string;        // Legacy
  teamLeaderPhone?: string;        // Legacy
  outOfCompetition?: boolean;
  outOfCompetitionReason?: string;
}
```

### Shooter (`src/types/rwk.ts`)
```typescript
interface Shooter {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  gender: 'male' | 'female' | 'unknown';
  birthYear?: number;
  birthDate?: Date;
  clubId?: string;                 // EINZIGES aktives Vereinsfeld
  rwkClubId?: string;              // Legacy (nur Lese-Fallback)
  isActive?: boolean;              // false = Soft-Delete
  teamIds?: string[];
  email?: string;
  telefon?: string;
  mobil?: string;
  phone?: string;                  // Legacy (nur Lese-Fallback)
  strasse?: string;
  plz?: string;
  ort?: string;
  // KM-spezifisch
  mitgliedsnummer?: string;        // Verbandsnummer (ohne führende 0)
  sondergenehmigung?: boolean;     // für Schützen unter 12
  kmClubId?: string;               // Legacy
  kmStartrechte?: Record<string, string>;
  // Meta/Audit
  genderGuessed?: boolean;
  source?: string;                 // 'mitcom_import' | 'manual' | 'migration_excel' | 'auto-from-scores'
  createdBy?: string; createdAt?: any; importedAt?: any;
  updatedAt?: any; deletedAt?: any; deletedBy?: string;
}
```
> ⚠️ Mehrere konkurrierende Felder aus der Historie: Verein aktiv nur über `clubId` (`rwkClubId`/`kmClubId` sind Legacy); drei Telefon-Varianten (`telefon`/`mobil`/`phone`).

### ScoreEntry (`src/types/rwk.ts`)
```typescript
interface ScoreEntry {
  id: string;
  shooterId: string; shooterName: string; shooterGender?: string;
  teamId: string; teamName: string; clubId: string;
  leagueId: string; leagueType: FirestoreLeagueSpecificDiscipline;
  competitionYear: number;
  durchgang: number;
  totalRinge: number;              // in Rules validiert: 0–600
  scoreInputType: 'regular' | 'pre' | 'post'; // regulär / Vor- / Nachschießen
  enteredByUserId?: string; enteredByUserName?: string;
  entryTimestamp?: Timestamp;
  teamOutOfCompetition?: boolean; teamOutOfCompetitionReason?: string;
  isSubstitutionCopy?: boolean;
}
```

---

## 3. KM-Collections (Kreismeisterschaft)

| Collection | Zweck | Zugriff (grob) |
|---|---|---|
| `km_saisons` | KM-Saisons (Felder u. a. `jahr`, `disziplinTyp`, `name`, `collectionName`, `meldeschluss`, `status`) | read öffentlich, write Admin |
| `km_jahre` | KM-Jahre | read öffentlich, write Admin |
| `km_meldungen` + `km_meldungen_{jahr}_{kk\|ld\|kkp}` | Meldungen (`KMMeldung`) | write Admin/KM-Orga (+ Verein bei Alt-Collection) |
| `km_disziplinen` | Disziplinen (`KMDisziplin`) | read öffentlich, write Admin |
| `km_shooters` | KM-Schützen (mit `shooters` synchronisiert) | write Admin/KM-Orga |
| `km_ergebnisse` | KM-Ergebnisse | write Admin/KM-Orga |
| `km_startlisten`, `km_startlisten_v2`, `km_startlisten_configs`, `km_startlisten_aenderungen` | Startlisten (aktiv v. a. `_v2`) | write Admin/KM-Orga |
| `km_mannschaften` | KM-Mannschaften (`KMMannschaft`) | – |
| `km_user_permissions` | KM-spezifische Berechtigungen | – |

### KMDisziplin / KMMeldung / KMMannschaft (`src/types/km.ts`)
```typescript
interface KMDisziplin {
  id: string;
  spoNummer: string;               // z. B. "1.10"
  name: string;
  kategorie: 'LG' | 'LP' | 'KKG' | 'KKP' | 'AB' | 'LI' | 'BR'; // BR = Blasrohr
  schusszahl: number;
  schiesszeit?: number;            // Minuten
  mindestalter: number;
  auflage: boolean;
  aktiv: boolean;
  nurVereinsmeisterschaft?: boolean;
}

interface KMMeldung {
  id: string;
  schuetzeId: string; disziplinId: string; wettkampfklasseId: string;
  lmTeilnahme: boolean; anmerkung?: string;
  saison: string; meldedatum: Date;
  status: 'gemeldet' | 'bestaetigt' | 'abgelehnt';
  gemeldeteVon: string;
  vmErgebnis?: { ringe: number; datum: Date; bemerkung?: string };
}

interface KMMannschaft {
  id: string;
  vereinId: string; disziplinId: string;
  wettkampfklassen: string[];
  saison: string;
  schuetzenIds: string[];          // genau 3
  name?: string; geschlechtGemischt?: boolean;
}
```
> ⚠️ Schüler-Disziplinen tragen ein „S"-Suffix (z. B. `1.10S`) mit 20 statt 40 Schuss. Seed-Liste: `KM_DISZIPLINEN_2026` in `src/types/km.ts`.

---

## 4. Subcollections

- `schiessnachweis_data/{userId}` und `schiessnachweis_data/{userId}/eintraege/{id}` – digitaler Schießnachweis. Migration vom Alt-Modell (ein Dokument mit Array) zum Ein-Dokument-pro-Eintrag-Modell in der Subcollection `eintraege` (`src/lib/services/schiessnachweis-service.ts`). Zugriff: **nur der eigene User** (`request.auth.uid == userId`).
- `clubs/{clubId}/{document=**}` – Fallback-Regel für Vereins-Subdokumente (read `hasClubAccess`, write `canWriteClub`).

> **Hinweis:** Es gibt **keine** `clubs/{id}/mitglieder`-Subcollection. „Mitgliederverwaltung" ist nur eine UI-Route und arbeitet auf der zentralen Collection `shooters` – eine gemeinsame Liste für RWK und KM.

---

## 5. Weitere Collections

### News / Termine
- `newsItems`, `rwk_news` – News (read öffentlich, write Admin).
- `events` – Termine/Kalender (`src/lib/services/calendar-service.ts`); create/update für Angemeldete, delete Admin.
- `updates`, `league_updates` – App-/Liga-Updates (`LeagueUpdateEntry` in `rwk.ts`).

### Kommunikation / Support
- `email_contacts`, `email_history`, `email_templates` – E-Mail-System (Admin/KM-Orga/Sportleiter/Vorstand).
- `support_sessions` – Support-Zugänge (`clubId`, `supportCode`, `isActive`, `expiresAt` …).
- `support_tickets` – Tickets (`SupportTicket`; create offen, read/update/delete Admin).
- `feedback` – Bewertungen (create/read offen).
- `protests` – Proteste (read Admin oder eigener Einreicher).

### System / Admin / Audit
- `user_permissions` – zentrale Berechtigungen (siehe unten).
- `users` – read/write Admin oder eigener User.
- `audit_logs` – Audit (create offen für Admin-SDK, read Admin, kein update/delete).
- `login_events` – Login-Monitoring (create offen, read Admin).
- `access_requests` – Vereinszugang-Anträge (read Admin; Client-Write gesperrt, nur über Admin-SDK-API).
- `admin_settings`, `system_config`, `app_stats` – nur Admin.

### Social Training / Ausbildung (in Rules vorhanden)
`social_profiles`, `public_profiles`, `training_groups` (+ `members`, `results`), `live_competitions` (+ `results`), `social_training_results`, `duels`, `ausbildung_kurse`, `ausbildung_anmeldungen`.

---

## 6. Benutzer & Berechtigungen

### UserPermission (`src/types/rwk.ts`), Collection `user_permissions`
```typescript
interface UserPermission {
  uid: string;
  email: string;
  displayName?: string;
  // Legacy
  role?: 'admin' | 'superadmin' | 'vereinsvertreter' | 'mannschaftsfuehrer' | 'km_orga';
  clubId?: string;
  assignedClubId?: string;
  representedClubs?: string[];
  isActive?: boolean;
  createdAt?: Date;
  lastLogin?: Date;
  // Neue 3-Ebenen-Struktur
  platformRole?: string;                  // z. B. 'SUPER_ADMIN'
  kvRoles?: Record<string, string>;       // Kreisverband-Rollen
  clubRoles?: Record<string, string>;     // clubId -> 'SPORTLEITER' | 'VORSTAND' | 'MANNSCHAFTSFUEHRER' | ...
}
```
> ⚠️ **Rollen-Gotcha:** KV-Rollen liegen in Altdaten mal als Einzelfeld `kvRole` (String), mal als Map `kvRoles` vor – die Rules akzeptieren **beide**. Zusätzlich existieren Legacy-`role`-Werte. Neue Zuordnungen laufen über `clubRoles`/`kvRoles`/`platformRole`.

---

## 7. Zugriffsmodell (Firestore-Rules, grob)

Rollen-Helfer in `firestore.rules`:
- `isSuperAdmin()` – E-Mail `admin@rwk-einbeck.de` **oder** `platformRole == 'SUPER_ADMIN'`.
- `isKmOrgaGlobal()` – KV-Rolle `KV_KM_ORGA` / `KM_ORGANISATOR` / `KV_WETTKAMPFLEITER` (via `kvRole` oder `kvRoles`) oder Legacy `role == 'km_organisator'`.
- Club-Rollen aus `clubRoles[clubId]`: `VORSTAND`, `SPORTLEITER`, `MANNSCHAFTSFUEHRER` (+ Legacy-Fallback).

Grobe Linien:
- **Öffentlich lesbar** sind fast alle Anzeige-Collections (seasons, clubs, leagues, shooters, teams, scores inkl. `rwk_scores_*`, km_* lesend, news, user_permissions für Namensanzeige …).
- **Nur Admin schreibt** Stammdaten wie seasons, rwk_leagues, news, km_disziplinen/km_jahre/km_saisons, admin_settings/system_config/app_stats.
- **Ergebnisse** (`rwk_scores` + `rwk_scores_*`): create nur mit gültiger Ringzahl (0–600) und einer Erfassungs-Rolle; update/delete nur Admin.
- **Schützen** (`shooters`): delete grundsätzlich gesperrt (`false`) – nur über die Admin-SDK-API.
- **Schießnachweis** und Club-Subdokumente: strikt auf eigenen User bzw. Vereinszugehörigkeit begrenzt.
- Catch-all am Ende: `match /{document=**} { allow read, write: if false; }`.

---

## 8. Backstop: Ringzahl-Validierung

In `firestore.rules`:
```
function isValidRingCount(rings) {
  return rings is number && rings >= 0 && rings <= 600;
}
```
Diese Grenze (≤ 600) ist ein großzügiges Sicherheitsnetz gegen Tippfehler. Die eigentliche, feine Disziplin-Grenze setzt `League.shotSettings.maxRings` bzw. der zentrale Helfer `getLeagueShotConfig()` (`src/lib/utils/league-shot-config.ts`). Erst wenn eine Disziplin mehr als 600 mögliche Ringe hätte, müsste diese Rule angehoben werden.
