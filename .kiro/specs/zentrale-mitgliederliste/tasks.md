# Tasks — Zentrale Mitgliederliste (RWK + KM)

- [ ] 1. Datenmodell: Shooter-Typ um reale Mitcom-/Meta-Felder erweitern
  - `Shooter` in `src/types/rwk.ts` ergänzen: `telefon?`, `mobil?`, `strasse?`, `plz?`, `ort?`, `source?`, `createdBy?`, `deletedAt?`, `deletedBy?`, `genderGuessed?`, Zeitstempel als `any`; `isActive?` sicherstellen. `phone?` als Legacy behalten (Lese-Fallback).
  - Sicherstellen: nur `clubId` als Vereinsfeld dokumentiert; `kmClubId`/`rwkClubId` bleiben optional im Typ (Altdaten), werden aber nicht mehr geschrieben.
  - Verifikation: `npx tsc --noEmit` → 0 Fehler.
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 2. Rechte-Utility (Client + Server)
- [ ] 2.1 `getMemberPermissions()` (Client)
  - Datei `src/lib/permissions/memberPermissions.ts`: Typen `MemberRole`, `MemberPermissions`; Funktion leitet Rechte aus `userAppPermissions` ab (admin/km_orga/sportleiter/mannschaftsfuehrer), OHNE `|| true`.
  - `allowedClubIds` aus `representedClubs` bzw. Keys von `clubRoles` bzw. `clubId`.
  - _Requirements: 2.1–2.6, 3.1, 3.2_
- [ ] 2.2 `getServerMemberPermissions()` (Server)
  - Serverseitiges Pendant im API-Modul (aus verifiziertem Token + `user_permissions`-Doc). Maßgeblich für Autorisierung.
  - _Requirements: 3.6, 4.2, 4.3_

- [ ] 3. Gemeinsame API `/api/members`
- [ ] 3.1 GET/POST unter `src/app/api/members/route.ts`
  - `verifyApiAuth` + `getServerMemberPermissions`.
  - GET: rollenbasiert gefiltert (alle vs. `allowedClubIds`), nur `isActive !== false`; optional `?clubId=` (muss erlaubt sein, sonst 403).
  - POST (`canEdit`): anlegen, nur `clubId`, `name` mitführen, `isActive:true`, `createdBy`, `source:'manual'`; validieren/normalisieren; Sportleiter nur eigener Verein (403 sonst).
  - _Requirements: 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.5_
- [ ] 3.2 PATCH/DELETE unter `src/app/api/members/[id]/route.ts`
  - PATCH (`canEdit`): Whitelist-Update; Ziel-clubId (alt+neu) muss erlaubt sein.
  - DELETE (`canEdit`): Soft-Delete-Kaskade (Task 4).
  - _Requirements: 3.1, 3.2, 3.6, 4.1–4.3_

- [ ] 4. Soft-Delete-Kaskade + Audit-Log (im DELETE-Handler)
  - `shooters/{id}`: `isActive=false`, `deletedAt`, `deletedBy` (kein `.delete()`).
  - Aus aktiven `rwk_teams.shooterIds` (und `km_mannschaften.schuetzenIds` falls vorhanden) via `arrayRemove` entfernen.
  - Ergebnisse/Meldungen unangetastet lassen.
  - `audit_logs`-Eintrag schreiben.
  - _Requirements: 5.1–5.5, 5.7_

- [ ] 5. Zentrale Komponente `MemberList`
- [ ] 5.1 Grundgerüst + Laden
  - `src/components/members/MemberList.tsx` mit Props `{ mode, permissions, defaultClubId? }`.
  - Laden via `GET /api/members`; Loading/Empty-States.
  - _Requirements: 1.1, 1.2, 2.x_
- [ ] 5.2 Darstellung (Spalten, Suche, Sortierung, responsive)
  - Spalten je Modus (km: + Mitgliedsnummer + AK Auflage/Freihand via `calculateAgeClass`, Sportjahr ab 1. Juli Folgejahr).
  - Suche (Name+Mitgliedsnummer), Sortierung; Desktop-Tabelle + Mobil-Karten.
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_
- [ ] 5.3 Anlegen/Bearbeiten-Dialog
  - Formular (Pflicht: Vorname/Nachname/Geschlecht/Geburtsjahr/Verein; optional Mitgliedsnummer + Kontakt).
  - Verein-Dropdown je Rechten (alle vs. allowedClubIds).
  - Speichern über POST/PATCH `/api/members`; nur bei `permissions.canEdit`.
  - _Requirements: 3.1–3.5_
- [ ] 5.4 Löschen-Dialog
  - Bestätigungsdialog mit korrektem Text (deaktivieren, aus aktiven Mannschaften entfernen, Ergebnisse bleiben, Audit-Log); DELETE `/api/members/[id]`.
  - _Requirements: 5.6_
- [ ] 5.5 RWK-Team-Zuordnung (nur mode="rwk")
  - Optionaler Abschnitt im Anlegen-Dialog: Team-Zuordnung wie bisher gegen `rwk_teams` (Regel MAX_SHOOTERS_PER_TEAM).
  - _Requirements: 8.1, 8.2_

- [ ] 6. Zentrale Seite `/mitglieder`
  - `src/app/mitglieder/page.tsx`: Rechte via `getMemberPermissions`; bei fehlender Berechtigung Hinweis/Redirect.
  - Modus bestimmen (Default `km` für Orga/Admin, `rwk` für Sportleiter im RWK-Kontext — oder Umschalter). Rendert `MemberList`.
  - _Requirements: 1.1, 2.5_

- [ ] 7. Dashboard-Card + Entfernen der Alt-Einstiege
- [ ] 7.1 Card in `dashboard-auswahl`
  - Neue Card "Mitglieder" (nur wenn `canViewMembers`), Hinweis "für RWK und KM", responsive, Link `/mitglieder`. Nicht für Mannschaftsführer/Individual.
  - _Requirements: 6.1–6.4, 6.6_
- [ ] 7.2 Alt-Einstiege entfernen/umleiten
  - `verein/dashboard`: „Schützen“-Card entfernen.
  - `km-orga` Dashboard: „Alle Mitglieder“-Link → `/mitglieder`.
  - `verein/schuetzen`, `km/mitglieder`, `km-orga/mitglieder`: als dünne Redirects auf `/mitglieder`.
  - _Requirements: 6.5_

- [ ] 8. Mitcom-Import an neues Modell angleichen
  - `verein/mitglieder-import`: nur `clubId` schreiben (kein `kmClubId`); Kontaktfeld `telefon` statt `phone` (Fallback lesen).
  - _Requirements: 3.4, 7.2_

- [ ] 9. Abschluss-Verifikation
  - `npx tsc --noEmit` → 0 Fehler; `npm run build` grün.
  - Regression: Team-Zuordnung, Ergebnis-/Meldungsansichten stichprobenartig ok.
  - Alte Links leiten korrekt um.
  - _Requirements: 7.3, 8.3, 8.4_
