# Design — Zentrale Mitgliederliste (RWK + KM)

## Überblick

Eine zentrale Mitgliederverwaltung ersetzt die drei bestehenden, dupliziert implementierten Listen (`verein/schuetzen`, `km/mitglieder`, `km-orga/mitglieder`). Kernbausteine:

- **Eine Seite/Route** `/mitglieder` (zentral, bereichsübergreifend) mit einer **wiederverwendbaren Komponente** `MemberList`.
- **Eine abgesicherte API** `/api/members` (GET/POST/PATCH/DELETE) als einziger Schreibweg; Lesen rollenbasiert gefiltert.
- **Zentrale Rollen-/Rechte-Utility** `getMemberPermissions()`, die aus dem Auth-Kontext die konkreten Rechte ableitet (nicht über die `useKMAuth`-`|| true`-Schwäche).
- **Soft-Delete mit Kaskade + Audit-Log** serverseitig.
- **Eine Card** in `dashboard-auswahl` als einziger Einstieg; die bisherigen Bereichs-Cards/Einstiege werden entfernt/umgeleitet.
- **Datenmodell**: `Shooter`-Typ wird um die real vorhandenen (Mitcom-)Felder ergänzt; `clubId` bleibt einziges Vereinsfeld.

Leitprinzip: **Datenquelle und Schreiblogik zentralisieren, Sichtbarkeit rollenbasiert steuern, bestehende Referenzen (Teams/Ergebnisse/Meldungen) nicht brechen.**

## Architektur

```
dashboard-auswahl (Card "Mitglieder", nur bei Berechtigung)
        │  Link
        ▼
/mitglieder (page.tsx)
   ├─ ermittelt Rechte via getMemberPermissions(auth)
   ├─ rendert <MemberList mode="rwk"|"km" permissions=... />
   │
   └─ <MemberList>  (components/members/MemberList.tsx)
        ├─ liest via GET /api/members?scope=...  (rollenbasiert gefiltert)
        ├─ Suche / Sortierung / (mobil: Karten, desktop: Tabelle)
        ├─ Formular-Dialog (Anlegen/Bearbeiten)  → POST/PATCH /api/members
        └─ Löschen (Soft-Delete)                 → DELETE /api/members/[id]

/api/members            (route.ts: GET, POST)
/api/members/[id]       (route.ts: PATCH, DELETE)
   └─ verifyApiAuth  →  getServerMemberPermissions  →  Firestore (shooters, rwk_teams, audit_logs)
```

### Warum eine neue Route `/mitglieder` statt einer der bestehenden?
- Bereichsneutral: weder unter `/verein` noch `/km` „beheimatet“ → passt zum zentralen Einstieg.
- Die bestehenden Seiten (`verein/schuetzen`, `km/mitglieder`, `km-orga/mitglieder`) werden zu Weiterleitungen auf `/mitglieder` (bzw. entfernt), damit alte Links/Buttons nicht ins Leere laufen.
- RWK-spezifische Zusatzfunktion (Team-Zuordnung beim Anlegen) bleibt erhalten, wird aber in die zentrale Komponente als optionaler `mode="rwk"`-Block integriert.

## Komponenten und Interfaces

### 1. `MemberList` (Client-Komponente)
`src/components/members/MemberList.tsx`

```typescript
interface MemberListProps {
  mode: 'rwk' | 'km';
  permissions: MemberPermissions;   // aus getMemberPermissions()
  // optional: initialer Vereinsfilter (z.B. aktiver Verein im RWK-Kontext)
  defaultClubId?: string;
}
```

Verhalten:
- Lädt Mitglieder über `GET /api/members` (die API filtert serverseitig nach Rolle/Vereinen). Kein direkter Firestore-Zugriff aus der Komponente mehr.
- **Spalten je Modus:**
  - Beide: Nachname, Vorname, Geburtsjahr, Geschlecht, Verein.
  - `mode="km"` zusätzlich: Mitgliedsnummer, AK Auflage / AK Freihand (via `calculateAgeClass` aus `lib/utils/altersklassen`, Sportjahr-Logik: ab 1. Juli Folgejahr).
- **Suche** (Name + Mitgliedsnummer), **Sortierung** (Nachname/Vorname/Geburtsjahr/Verein).
- **Responsive:** Desktop = Tabelle, Mobil = Karten (bestehendes Muster aus `mobile-table.tsx` / vorhandenen Card-Layouts wiederverwenden).
- **Aktionen** nur wenn `permissions.canEdit`: Anlegen (Dialog), Bearbeiten (Dialog), Löschen (Bestätigungsdialog).
- **Verein-Auswahl im Formular:** Für Admin/KM-Orga Dropdown aller Vereine; für Sportleiter auf zugeordnete Vereine beschränkt (Vorauswahl aktiver/erster Verein).
- **RWK-Team-Zuordnung:** Nur bei `mode="rwk"` und `canEdit` — optionaler Abschnitt im Anlegen-Dialog (wie bisher, Regel `MAX_SHOOTERS_PER_TEAM`, 1 Team je Saison/Disziplinkategorie). Läuft weiterhin gegen `rwk_teams` (kann zunächst als eigener, bestehender Schreibpfad bleiben; die Mitglied-Stammdaten selbst gehen über `/api/members`).

### 2. Rechte-Utility (Client + Server)
`src/lib/permissions/memberPermissions.ts`

```typescript
export type MemberRole = 'admin' | 'km_orga' | 'sportleiter' | 'mannschaftsfuehrer' | 'none';

export interface MemberPermissions {
  role: MemberRole;
  canViewMembers: boolean;      // Admin, KM-Orga, Sportleiter
  canEdit: boolean;             // Admin, KM-Orga, Sportleiter (für erlaubte Vereine)
  canViewAllClubs: boolean;     // Admin, KM-Orga
  allowedClubIds: string[];     // leer + canViewAllClubs=true => alle; sonst Whitelist
}

// Client: leitet aus userAppPermissions ab (kein "|| true")
export function getMemberPermissions(auth): MemberPermissions
```

Regeln (aus Requirements-Rollenmatrix):
- **Admin** (`admin@rwk-einbeck.de`, `platformRole === 'SUPER_ADMIN'`, `role === 'superadmin'`): alles, alle Vereine.
- **KM-Orga** (`KV_KM_ORGA`/`KV_WETTKAMPFLEITER`, `role === 'km_organisator'`, bekannte Orga-Email): ansehen/bearbeiten alle Vereine.
- **Sportleiter** (`clubRoles` enthält `SPORTLEITER`): ansehen/bearbeiten nur `allowedClubIds` (aus `representedClubs` bzw. Keys von `clubRoles` bzw. `clubId`).
- **Mannschaftsführer** (`MANNSCHAFTSFUEHRER` / `role === 'mannschaftsfuehrer'`): `canViewMembers=false`, `canEdit=false`.
- **Vorstand:** Altlast — wird NICHT als Verwaltungsrolle behandelt (kein `canEdit` allein aus `VORSTAND`).

Serverseitiges Pendant `getServerMemberPermissions(decodedToken)` (in der API) leitet dieselben Rechte aus dem verifizierten Token + `user_permissions`-Doc ab. **Maßgeblich für Autorisierung ist der Server**, die Client-Variante steuert nur die UI-Sichtbarkeit.

### 3. API — einziger Schreibweg
`src/app/api/members/route.ts` und `src/app/api/members/[id]/route.ts`

Alle Handler: zuerst `verifyApiAuth(request)` (bestehende Utility), dann `getServerMemberPermissions`.

- **GET `/api/members`**: liefert Mitglieder gefiltert nach Rechten.
  - `canViewAllClubs` → alle aktiven (`isActive !== false`) Mitglieder.
  - sonst → nur Mitglieder, deren `clubId` in `allowedClubIds` liegt.
  - Query-Param optional `?clubId=` (zusätzlicher Filter, muss in `allowedClubIds` liegen, sonst 403).
- **POST `/api/members`** (`canEdit`): legt Mitglied an. Schreibt **nur `clubId`** (kein `kmClubId`/`rwkClubId`), setzt `name` = `"Vorname Nachname"`, `isActive: true`, `createdAt`, `createdBy`, `source: 'manual'`. Validiert/normalisiert (Geschlecht → `male`/`female`, Geburtsjahr plausibel). Sportleiter darf nur für `allowedClubIds` anlegen (sonst 403).
- **PATCH `/api/members/[id]`** (`canEdit`): aktualisiert Whitelist-Felder (firstName, lastName, name, gender, birthYear, mitgliedsnummer, Kontaktfelder, clubId). Prüft, dass Ziel-`clubId` (alt UND neu) in `allowedClubIds` liegt (außer Admin/KM-Orga).
- **DELETE `/api/members/[id]`** (`canEdit`): **Soft-Delete-Kaskade** (siehe unten).

Antworten einheitlich `{ success, data?, error? }`; Statuscodes 401 (nicht auth), 403 (nicht berechtigt), 400 (Validierung), 404 (nicht gefunden).

### 4. Soft-Delete-Kaskade (serverseitig, DELETE-Handler)
Reihenfolge in einer Batch/Transaction, wo möglich:
1. `shooters/{id}`: `isActive = false`, `deletedAt = serverTimestamp()`, `deletedBy = uid`. **Kein** `.delete()`.
2. Aus aktiven Mannschaften entfernen: alle `rwk_teams` mit `shooterIds` enthält `id` → `shooterIds` per `arrayRemove(id)` aktualisieren. (KM-Mannschaften `km_mannschaften`: analog `schuetzenIds`, falls vorhanden.)
3. Ergebnisse (`rwk_scores*`) und KM-Meldungen (`km_meldungen_*`) bleiben **unverändert** erhalten (Historie/Statistik).
4. `audit_logs`: neuer Eintrag `{ action: 'member_soft_delete', shooterId, by: uid, at: serverTimestamp(), details }`.
5. Der Lösch-Dialog in der UI beschreibt genau dieses Verhalten (deaktiviert, aus aktiven Mannschaften entfernt, Ergebnisse bleiben erhalten, Audit-Log).

Harte Löschung: nur Admin-Sonderaktion (bestehende `/api/shooters?action=cleanup-*` bleibt Admin-only; keine neue harte Löschung in `/api/members`).

### 5. Dashboard-Card
`src/app/dashboard-auswahl/page.tsx`
- Neue Card "👥 Mitglieder" im vorhandenen `grid grid-cols-1 md:grid-cols-2`-Layout, sichtbar nur wenn `getMemberPermissions(...).canViewMembers`.
- Beschreibung/Hinweis: „Zentrale Mitgliederliste — gilt für RWK und Kreismeisterschaft.“
- Button → `/mitglieder`.
- Mannschaftsführer/Individual-Nutzer: Card nicht gerendert.

Entfernen/Umleiten:
- `verein/dashboard`: „Schützen“-Card entfernen (bzw. Button auf `/mitglieder` umstellen — Entscheidung im Task, Default: entfernen).
- `km-orga` Dashboard: Link „Alle Mitglieder“ → auf `/mitglieder` umstellen.
- `verein/schuetzen`, `km/mitglieder`, `km-orga/mitglieder`: als Redirect auf `/mitglieder` umsetzen (Seiten bleiben als dünne Redirects, um alte Bookmarks/Links zu bedienen).

## Datenmodell

`src/types/rwk.ts` — `Shooter` um real vorhandene Felder ergänzen (alle optional, um Bestandsdaten nicht zu brechen). Ausrichtung an Mitcom-Import + realem Dokument:

```typescript
export interface Shooter {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  gender: 'male' | 'female' | 'unknown';
  birthYear?: number;
  birthDate?: Date;
  clubId?: string;              // EINZIGES Vereinsfeld
  isActive?: boolean;           // Soft-Delete-Flag
  teamIds?: string[];

  // Mitcom-/Stammdaten (real vorhanden)
  mitgliedsnummer?: string;     // Verbandsnummer ohne führende 0
  email?: string;
  telefon?: string;
  mobil?: string;
  strasse?: string;
  plz?: string;
  ort?: string;

  // KM-spezifisch (bereits vorhanden)
  sondergenehmigung?: boolean;
  kmStartrechte?: Record<string, string>;

  // Meta
  genderGuessed?: boolean;
  source?: string;              // 'mitcom_import' | 'manual' | 'migration_excel' | 'auto-from-scores'
  createdBy?: string;
  createdAt?: any;
  importedAt?: any;
  updatedAt?: any;
  deletedAt?: any;
  deletedBy?: string;
}
```

Hinweis: Das im Typ bisher vorhandene `phone` wird durch `telefon`/`mobil` (Mitcom-nah) ersetzt bzw. ergänzt. Bestehende Nutzung von `phone` wird beim Umbau geprüft (der RWK-Import schrieb `phone`); im Task wird auf ein einheitliches Feld (`telefon`) konsolidiert und Altfeld `phone` beim Lesen als Fallback berücksichtigt.

`kmClubId`/`rwkClubId` werden NICHT mehr gesetzt. `getShooterClubId()` bleibt als tolerante Lese-Utility (liest `clubId`, Fallback historisch), damit Altdaten weiter korrekt zugeordnet werden.

## Error Handling
- API: try/catch je Handler, einheitliches `{ success:false, error }`, korrekte Statuscodes; Logging über `secureLogger` (korrekte Signatur `error(msg, Error?, context)`).
- Client: Toast bei Fehlern; optimistische UI-Updates nur nach erfolgreicher API-Antwort (kein „Geist“-Eintrag bei Fehler).
- Soft-Delete-Kaskade: schlägt ein Teilschritt (z.B. Team-Update) fehl, wird der Fehler geloggt, aber die Deaktivierung nicht zurückgerollt (Mitglied bleibt deaktiviert); Audit-Log hält den Teil-Erfolg fest. (Alternativ Transaction — im Task bewerten, abhängig von Anzahl betroffener Teams.)

## Sicherheit
- **Server ist maßgeblich:** Jede schreibende und lesende API prüft Auth + Rechte serverseitig. UI-Sichtbarkeit ist nur Komfort.
- Das `/api/km/shooters/*`-Auth-Loch wird für die Mitgliederverwaltung nicht mehr genutzt; die zentrale Liste ruft ausschließlich `/api/members*` auf. (Die alten Routen werden im Task entweder abgesichert oder als deprecated markiert — Firestore Rules bleiben unangetastet, sofern nicht ausdrücklich freigegeben.)
- Sportleiter-Beschränkung auf `allowedClubIds` wird bei GET (Filter) und bei POST/PATCH/DELETE (403 bei fremdem Verein) durchgesetzt.

## Testing-Strategie
- **Typecheck:** `npx tsc --noEmit` bleibt bei 0 Fehlern (Requirement 7.3 / 8.4).
- **Build:** `npm run build` grün.
- **Manuelle Rollen-Tests** (durch Nutzer, da Test-Setup „Weg A“ = kein automatisiertes Test-Framework): je Rolle (Admin, KM-Orga, Sportleiter mit 1 und mit mehreren Vereinen, Mannschaftsführer) Sichtbarkeit + Aktionen prüfen.
- **Regression:** RWK-Team-Zuordnung, Ergebnis-/Meldungsansichten nach Umstellung stichprobenartig prüfen.
- **Soft-Delete:** nach Löschen prüfen: Mitglied weg aus Liste, aus aktiven Teams entfernt, Ergebnisse noch vorhanden, Audit-Eintrag existiert.

## Migrations-/Rollout-Hinweise
- Keine Datenmigration. Bestehende Dokumente ohne `isActive` gelten als aktiv (Filter: `isActive !== false`).
- Alte Seiten als Redirects → keine „toten“ Links.
- Der Mitcom-Import (`verein/mitglieder-import`) bleibt bestehen; er wird angepasst, damit er ebenfalls nur `clubId` (kein `kmClubId`) schreibt und `telefon` statt `phone` nutzt (konsistent mit neuem Modell) — als eigener Task.

## Offene, bewusst ausgeklammerte Punkte (nicht Teil dieses Features)
- Zusammenführung `user_permissions` / `km_user_permissions`.
- Vollständige Absicherung/Refactoring aller Alt-Routen `/api/km/shooters/*` über den Mitglieder-Use-Case hinaus.
- `useKMAuth`-`|| true`-Schwäche global beheben (hier nur für den Mitglieder-Use-Case umgangen, indem `getMemberPermissions` eigenständig prüft).
