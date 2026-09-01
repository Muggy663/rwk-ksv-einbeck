# TypeScript-Sanierung — Fixing-Log (Branch: fix/typescript-sanierung)

Dieses Dokument protokolliert jede Reparatur der TypeScript-Fehler nachvollziehbar.
Ziel: schrittweise Reduktion der ~2645 `tsc --noEmit`-Meldungen auf 0, ohne Design
oder Funktion zu verändern.

## Grundregeln
- Vorgehen **pro Feature-Bereich**, nicht pro Fehlertyp.
- **Echte Bugs zuerst** (z.B. "möglicherweise undefined" = potenzielle Laufzeit-Abstürze),
  dann Kosmetik (ungenutzte Variablen).
- **Kein blindes `as any`** — echte Typen bevorzugen; `as any` nur als dokumentierte Ausnahme.
- Ungenutzte **Parameter** in Signaturen/Callbacks nicht löschen, sondern `_`-Präfix.
- Nach jedem Bereich: `npm run typecheck` gegenchecken, Netto-Fehlerzahl muss **sinken**.
- Kleine, thematische Commits pro Bereich.

## Ausgangslage (gemessen vor Sanierung)
- Gesamtfehler: **~2645**
- Verteilung: TS6133 (890, ungenutzt), TS2339 (639, Property fehlt), TS7006 (236, impliziter any),
  TS2345 (207, Zuweisung), TS2304 (111, Name fehlt), TS2322 (91), TS18048 (83, undefined), Rest ~290.

---

## Fortschritts-Tabelle

| Bereich | Fehler vorher | Fehler nachher | Commit | Status |
|---------|---------------|----------------|--------|--------|
| _(wird pro Bereich gefüllt)_ | | | | |

---

## Detail-Log

### Bereich: Schießnachweis

#### `src/app/schiessnachweis/page.tsx` — 25 Fehler → 0
**Echte Bugs behoben:**
- **Tote Cloud-Sync-Logik**: `autoRestore` und `checkAndSyncFromCloud` riefen `SchießnachweisService.loadFromCloudNow()` auf — diese Methode **existiert nicht**. Zudem wurde `getEinträge()` (async) ohne `await` mit `.length` geprüft (Promise hat kein `.length`). Die Funktionen liefen immer in den catch und taten nichts. Entfernt; Daten kommen weiterhin korrekt über `loadStatistik()` → `getStatistik()` → `getEinträge()` aus Firestore. **Keine echte Funktion verloren** (die aufgerufene Methode gab es nie).
- **Auth-Listener-Cleanup**: `onAuthStateChanged`-Unsubscribe wurde nie aufgerufen (Memory-Leak). Jetzt im `useEffect`-Return sauber abgemeldet.

**Typfehler behoben:**
- `useState([])` in `LetzteEinträgeCard` → `useState<SchießEintrag[]>([])` (behob 8 Folgefehler "Property does not exist on type 'never'").
- `useState(null)` für `user` → `useState<import('firebase/auth').User | null>(null)` (behob `emailVerified`/`metadata`-Zugriffsfehler).

**Toter Code entfernt (~230 Zeilen):** ungenutzte Handler `handleExportExcel`, `handleExportODS`, `handleImportCSV`, `handleRefreshData` + Helfer `convertToCSV`, `convertToODS`, `importFromCSV` — nirgends im JSX verwendet; die echte Export/Import-Funktion liegt auf `/schiessnachweis/datensicherung`. Zugehörige ungenutzte Imports bereinigt.

**Gegengecheckt:** `tsc --noEmit` für die Datei = 0 Fehler. Kein JSX/keine sichtbare UI verändert (nur tote Handler + Logik entfernt, States typisiert).

#### Weitere Schießnachweis-Dateien

- **`components/schiessnachweis/CloudSyncStatus.tsx`** → **gelöscht**. Verwaiste Komponente: nirgends gerendert, importierte nicht existentes `premium-service`-Modul und rief nicht existente Service-Methoden (`getSyncStatus`, `syncToCloud`) auf. Das gesamte Premium/Cloud-Sync-System ist entkoppelt (bestätigt: `PremiumService` wird nur hier verwendet).

- **`app/schiessnachweis/eintraege/[id]/page.tsx`** — **echter Bug**: `updateEintrag(...)` wurde ohne `await` aufgerufen → `if (updated)` immer true, Fehlerbehandlung (else-Zweig mit throw) unerreichbar. `await` ergänzt. Dazu: ungenutzte `config`-IIFE-Variable + `getDisziplinConfig`-Import entfernt.

- **`app/schiessnachweis/eintraege/page.tsx`** — tote Cloud-Sync-Insel entfernt: `handleCloudSync` (nirgends aufgerufen, nutzte `UnifiedTrainingService.syncAllData`), `checkSyncStatus` + `needsSync`-State (nur gesetzt, nie gelesen). Ungenutzte Imports bereinigt.

- **`app/schiessnachweis/neuer-eintrag/NeuerEintragContent.tsx`** — **echte Typfehler**: `standort` konnte `undefined` sein (Pflichtfeld `string`) → Fallback `''`. Nicht existente Felder `kategorie`, `socialTraining`, `groupId`, `competitionId` aus `saveEintrag`-Objekt entfernt (Reste des Social-Training-Features, nicht im `SchießEintrag`-Typ). Ungenutzten `useAuth`/`user` entfernt.

- **`components/schiessnachweis/ErgebnisaufnahmeForm.tsx`** — Prop `disziplin: DisziplinName` → `string` gelockert (SchießEintrag.disziplin ist string; `getDisziplinConfig` verträgt beliebige Werte). Behob Disziplin-Typfehler an 2 Aufrufstellen. Tote Funktionen `getGesamtErgebnis`/`getSchnellwerte` + ungenutzte Imports entfernt.

- **`app/schiessnachweis/statistiken/page.tsx`**, **`profil/page.tsx`**, **`eintraege/[id]/details/page.tsx`**, **`components/schiessnachweis/DigitalAnlageImport.tsx`** — ungenutzte Imports/Params bereinigt (Callback-Params mit `_`-Präfix statt Entfernen).

- **`lib/services/cloud-sync-service.ts`** — Typfehler behoben (Casts über `unknown`, `getErrorMessage` für `unknown`-Fehler). Datei ist aktuell verwaist (nirgends importiert), aber **bewusst behalten** — Nutzer-Entscheidung offen, ob Cloud-Sync-Feature reaktiviert wird.

**Offene Design-Frage:** `cloud-sync-service.ts` ist toter Code — löschen oder als geplantes Feature behalten?

**Bereich Schießnachweis gegengecheckt:** `tsc --noEmit` für den Bereich = 0 Fehler. Gesamt: 2645 → 2577.

---

## Fortschritts-Tabelle (aktualisiert)

| Bereich | Fehler vorher | Fehler nachher | Status |
|---------|---------------|----------------|--------|
| Schießnachweis (page + eintraege + neuer-eintrag + statistiken + profil + Komponenten + cloud-sync) | ~68 | 0 | ✅ fertig |
| Gesamt-Projekt | 2645 | 2577 | läuft |

### Bereich: Kern (lib / utils / types) + PDF-Services

**Echte Bugs behoben:**
- **`components/pdf-export-button.tsx`**: Importierte `generateLeaguePDF`/`generateShootersPDF`, die so nicht existieren (Service exportiert `...Fixed`). Der PDF-Export-Button hätte zur Laufzeit gecrasht (`undefined is not a function`). Import per Alias korrigiert; überflüssiges `{ useCache }`-Argument entfernt (Funktionen nehmen keine Optionen).
- **`lib/services/pdf-service-fixed.ts`**: `this.findSubstitutionInfo(...)` in einer freien Modul-Funktion aufgerufen (`this` ist dort `undefined`) → hätte gecrasht. Zu direktem Funktionsaufruf korrigiert.
- **`lib/services/shooter-data-service.ts`**: `{ id: d.id, ...d.data() }` → Spread überschrieb die echte Doc-ID. Reihenfolge zu `{ ...d.data(), id: d.id }` korrigiert (echte ID gewinnt).
- **`lib/db/document-service-mongo.ts`**: 7 Funktionen griffen auf `db.collection()` zu, obwohl `getMongoDb()` `null` liefern kann (MongoDB ist optional) → Null-Zugriff möglich. Guards `if (!db) return ...` mit passendem Fallback (`[]`/`null`/`false`) ergänzt.

**Null-Safety / Typfehler:**
- **`shooter-data-service.ts`**: `currentShooterData` (aus `Map.get()`, evtl. undefined) → Guard `if (!currentShooterData) continue;` nach dem Init-Block (behob 12 Fehler).
- **`pdf-service-fixed.ts` / `pdf-generator.fix.ts`**: `doc.lastAutoTable?.finalY ?? currentY`; jsPDF-Modul-Deklaration um `lastAutoTable`/`getNumberOfPages` erweitert; `doc.internal.getNumberOfPages()` → `doc.getNumberOfPages()`; Zeilen-Arrays/Objekte korrekt als `(string|number)[]` bzw. `Record<...>` typisiert; Null-Fallbacks bei `rank`/`isOutOfCompetition`.
- **`types/rwk.ts`**: `IndividualShooterDisplayData` um optionale Felder `isSubstitute` und `substitutionInfo` erweitert (wurden vom Service gesetzt und vom PDF-Generator gelesen, fehlten aber im Typ).
- **`utils/memoization.ts`**: fehlenden `React`-Namespace-Import ergänzt.
- **`lib/utils/open-external.ts`**: `window.Capacitor?.` optional chaining (möglicherweise undefined).

**Gegengecheckt:** Alle genannten Dateien `tsc`-fehlerfrei. `types/rwk.ts`-Änderung nur additive optionale Felder → keine Folgefehler (Gesamtzahl gesunken, nicht gestiegen). Gesamt: 2577 → 2532.

**Offene Themen für später:**
- Test-Infrastruktur (`__tests__/`, `test-utils.tsx`): hängt an nicht installiertem `@testing-library/react`, läuft nicht. Entscheidung: löschen oder Test-Setup einrichten?
- `cloud-sync-service.ts`: verwaist (Premium/Cloud-Sync-Feature, durch direkten Firestore-Zugriff ersetzt). Löschen?

| Bereich | Fehler vorher | Fehler nachher | Status |
|---------|---------------|----------------|--------|
| Kern (lib/utils/types) + PDF-Services | ~45 | 0 (in bearbeiteten Dateien) | teilweise |
| Gesamt-Projekt | 2577 | 2532 | läuft |

### Aufräumung: Premium/Cloud-Sync + Test-Infrastruktur (entschieden vom Nutzer)

- **`cloud-sync-service.ts` gelöscht**: War Teil des nie umgesetzten Premium-Modells. Überflüssig, weil eingeloggte Nutzer ihre Ergebnisse ohnehin direkt aus Firestore (Nutzerprofil) sehen — kein separater Sync nötig.
- **Test-Infrastruktur gelöscht (Weg A)**: `utils/test-utils.tsx` + 11 Test-Dateien (`components/ui/__tests__/*`, `components/auth/__tests__/*`, `components/layout/__tests__/SiteFooter.test.tsx`). Hingen alle an nicht installiertem `@testing-library/react`, liefen nie (kein Test-Runner konfiguriert). Falls später Tests gewünscht: frisch mit Vitest/Jest aufsetzen.

**Gegengecheckt:** keine Verweise auf gelöschte Dateien. Gesamt: 2532 → 2335.

| Bereich | Status |
|---------|--------|
| Premium/Cloud-Sync + Tests entfernt | ✅ |
| Gesamt-Projekt | 2645 → 2335 |

### Bereich: Verein (teilweise)

**Zentraler Fix mit großer Hebelwirkung:**
- **`components/auth/AuthContext.tsx`**: `UserPermission`-Typ um die real in Firestore gespeicherten Felder der 3-Ebenen-Rollenstruktur ergänzt (`platformRole`, `kvRoles`, `clubRoles`). Der Typ war unvollständig — überall wurde `(x as any).clubRoles` als Workaround genutzt. Behob ~30 Fehler projektweit (nicht nur im Verein-Bereich).
- **`types/rwk.ts`**: `UserPermission.role` um `'superadmin'` erweitert, `assignedClubId` ergänzt (beide real genutzt).

**`app/verein/layout.tsx`** (21 → 0): Der zentrale Verein-Layout-Wrapper mit `useVereinAuth`-Context. `clubRoles`-Fehler durch AuthContext-Fix behoben; `setUserPermissionForContext`-Typkonflikte (zwei divergierende `UserPermission`-Typen) mit dokumentiertem Cast gelöst; ungenutzte Imports/Destrukturierung bereinigt.

**`app/verein/mannschaften/page.tsx`** (31 → 4): Große Datei (~1700 Zeilen).
- Bug-Fix: `variant: "warning"` existiert im Toast nicht → `"destructive"` (2 Stellen; Warnungen wurden vorher gar nicht angezeigt).
- `window.shooterSearchTimeout` typsicher gemacht (`window as any`).
- `getShooterClubId`-Funktion entfernt (behob nebenbei `kmClubId`-Fehler).
- `logWarn(..., error)` → `getErrorMessage(error)` (3 Stellen).
- Viele ungenutzte Imports/Variablen/nicht existente Exporte (`GEWEHR_DISCIPLINES` etc.) bereinigt.
- **Vorsicht-Lektion**: Beim Entfernen von `categoryOfCurrentTeam` versehentlich `teamLeagueData` mitgelöscht (wird woanders genutzt) — durch tsc-Check sofort erkannt und wiederhergestellt.

**Noch offen in mannschaften/page.tsx (4 Fehler, brauchen mehr Kontext):**
- Zeile 21: TS6192 "all imports unused" (unklar, `GlobalResponsiveDialog` wird eigentlich genutzt — genauer prüfen)
- `getClubName` ungenutzte Funktion
- HelpTooltip mit falschen Props (`{ text, side, className }` passt nicht zu `HelpTooltipProps`)
- TS2322 `string | boolean` → `boolean | undefined` bei einem Prop

| Bereich | Fehler vorher | Fehler nachher | Status |
|---------|---------------|----------------|--------|
| Verein (layout ✅, mannschaften fast) | 113 | 66 | teilweise |
| Gesamt-Projekt | 2335 | 2274 | läuft |

### Bereich: Verein — KOMPLETT SAUBER (0 Fehler)

Fortsetzung. Alle Verein-Seiten jetzt fehlerfrei.

- **`mannschaften/page.tsx`** (Rest): Dialog-Import-Block entfernt (nur AlertDialog genutzt), HelpTooltip `side`-Prop entfernt (existiert nicht), `disabled`-Prop mit `!!` zu boolean, tote `getClubName`-Funktion entfernt.
- **`ergebnisse/page.tsx`**: **~1900 Zeilen tote `LegacyVereinErgebnissePage`-Funktion entfernt** (nie aufgerufen, aktive Komponente nutzt `SharedResultsPage`). Datei-Kopf schlank neu geschrieben — von ~1980 auf 31 Zeilen.
- **`schuetzen/page.tsx`**: `League`-Import ergänzt (fehlte, TS2304), ungenutzte Typen/Imports entfernt, 2× `variant:"warning"`→`"destructive"`, HelpTooltip `side` entfernt, ungenutzte Setter aus useState-Tupeln entfernt (Werte bleiben genutzt).
- **Kleine Verein-Dateien**: `React`-Imports entfernt (React 19 JSX-Transform), ungenutzte `user`/`userPermission`/`assignedClubId`-Destrukturierungen bereinigt. `dashboard/page.tsx`: `useState([])` → typisiert (behob `never`-Folgefehler). `mitglieder-import/page.tsx`: `BackButton` mit falschen Props (`href`/`label`) → `fallbackHref`/`size` (die Komponente kennt nur diese).

**Wichtiger zentraler Fix (wirkte projektweit):** `AuthContext.UserPermission` + `rwk.UserPermission` um real genutzte Felder ergänzt (`clubRoles`, `platformRole`, `kvRoles`, `superadmin`-Rolle, `assignedClubId`).

**Gegengecheckt:** Gesamter Verein-Bereich `tsc` = 0 Fehler. Gesamt: 2274 → 2211.

| Bereich | Status |
|---------|--------|
| Verein (alle Seiten) | ✅ 0 Fehler |
| Gesamt-Projekt | 2274 → 2211 |

### Bereich: lib/services (begonnen)

- **`season-transition-service.ts`** (15 → 0): ungenutzte Imports (`orderBy`, `addDoc`, `updateDoc`, `deduplicateScores`) entfernt; tote Funktion `checkIfNewClub` entfernt; echte Typfehler behoben (`{id}[]` → `ScoreEntry[]`-Cast, `.order`-Zugriff typisiert); ungenutzte Parameter mit `_`-Präfix (`_newClubs`, `_targetSeasonId`); ungenutzte lokale Variablen entfernt; Logger-`unknown` typsicher gemacht.

lib/services gesamt: 121 → 106. Projekt weiter in Arbeit.

| Bereich | Status |
|---------|--------|
| lib/services | begonnen (season-transition ✅) |

### Bereich: lib/services — KOMPLETT SAUBER (0 Fehler)

Alle Service-Dateien fehlerfrei. Über mehrere Batches (~121 → 0):
- Ungenutzte Imports/Variablen/Parameter (Params mit `_`-Präfix), tote Funktionen/Methoden entfernt (checkIfNewClub, fuzzyMatch).
- `logDebug('text:', a, b)` mit 3+ Args → Template-Strings.
- `logWarn/logError(..., error)` mit `unknown` → `error instanceof Error ? error.message : String(error)`.
- `secureLogger.error(msg, string)` → korrekte Signatur `error(msg, Error, context)`.
- `.map(doc => ({id, ...doc.data()}))` → `as {...}`- bzw. `as unknown as X`-Casts für Feldzugriffe.
- `|| null` bei optionalen Zielfeldern → `|| undefined`.
- `getSeasonSpecificScoresCollection(year, leagueType)` → `leagueType as any` (string vs. Union).
- **Typ-Ergänzungen** (real genutzt): `ScoreEntry.isSubstitutionCopy`, `Notification.createdAt` optional gemacht.

**Offene Themen (in app-Seiten, nicht services):** zwei gleichnamige `Kurs`/`Competition`-Typen aus verschiedenen Modulen kollidieren (`live-competition/page.tsx`, ausbildung) — gehört zur app-Bereinigung.

| Bereich | Status |
|---------|--------|
| lib/services | ✅ 0 Fehler |
| Gesamt-Projekt | ~2091 |
