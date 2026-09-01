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

### Bereich: components (in Arbeit, 413 → 176)

Tote Duplikat-Dateien komplett gelöscht (vor Löschung immer per grep auf Import-Nutzung geprüft):
- **`results/shared-results-page.tsx`** gelöscht (69 Fehler) — nirgends importiert; aktive Version ist `shared-results-complete.tsx`.
- **`UpdateNotification.tsx`** gelöscht (5) — nirgends importiert; aktiver Update-Hinweis ist `VersionCheck`.
- **`ui/handzettel-ocr.tsx`** gelöscht (8) — nirgends importiert; aktive OCR-Komponente ist `handzettel-ocr-simple.tsx`.

Aktive Komponenten saniert:
- **`handzettel/HandzettelGenerator.tsx`** (58 → 0): `document.querySelector(...)`/`querySelectorAll(...)` zu `<HTMLElement>` typisiert (`.style`-Zugriff); lokaler Typ `TeamWithShooters = Team & { shooters?... }` für zur Laufzeit aufgelöste Schützen (statt `.shooterIds`); `resultsData` als `Record<string, string|number>`; `gesamt`/`teamGesamt` als `number|string`; ungenutztes `idx` entfernt.
- **`results/shared-results-complete.tsx`** (16 → 0, zentral genutzt): ungenutzte Imports/State; `RadioGroup`-Import korrigiert (wird real genutzt), `Table`-Import entfernt (echt unused); `as const` auf Ternary entfernt + Objekt als `PendingScoreEntry` gecastet; 3× `logWarn(unknown)` → getErrorMessage-Muster.
- **`statistics/team-season-stats.tsx`** (15 → 0) und **`cross-season-stats.tsx`** (13 → 0): `React`-Import entfernt; **redeclare** von `years`/`allScores` in derselben Funktion umbenannt (`statYears`/`allRingScores`); `disc as any`; doc-map `as unknown as X`; `logWarn(unknown)`-Fix; ungenutzter recharts-formatter-Param `_name`; teams-map mit explizitem Objekttyp.
- **`ui/handzettel-ocr-simple.tsx`** (14 → 0): ungenutzte Imports; ungenutzte Props aus Destrukturierung entfernt (Interface unverändert, Aufrufer bleiben kompatibel); `setOcrResult` weggelassen; `logDebug` 3-Args → Template-String; `logWarn(unknown)`-Fix; `useEffect` `return undefined` (TS7030 "not all code paths return").
- **`layout/MainNav.tsx`** (7 → 0): ungenutzte Icons/`loading`; tote `vereinsvertreterRoutes`-Konstante + Bool-Variable; No-Op-`.filter(route => true)` entfernt.
- **`onboarding/OnboardingWizard.tsx`** (6 → 0): `userPermissions` → `userAppPermissions` (echter AuthContext-Feldname); ungenutzte Imports/State; `variant:"warning"` → `"destructive"`.
- **`onboarding/InteractiveGuide.tsx`** (6 → 0), **`dark-mode-demo.tsx`** (5 → 0): ungenutzte Imports.
- **`auth/AuthProvider.tsx`** (5 → 0): `kvRole` → `kvRoles` mit `Object.values().some()` (analog clubRoles); `onAuthStateChanged`-User via Cast auf `FirebaseUser` gemappt; `variant:"success"` entfernt.
- **`ui/native-pdf-button.tsx`** (5 → 0): ungenutzte Imports/`numRounds`-Prop/toter dynamischer Import/`fileName` entfernt.
- **`ui/pdf-button.tsx`** (5 → 0): `React`-Import, `league as any`, `safariDetected` entfernt.

**BUGFIX (real):** `lib/utils/safari-pdf-fix.ts` — `showSafariPDFInstructions()` war als Rückgabetyp `void` deklariert, gab aber `confirm(...)` (boolean) zurück; der Aufrufer in `pdf-button.tsx` prüfte `!showSafariPDFInstructions()` (Abbruch-Entscheidung). Rückgabetyp auf `boolean` korrigiert — Abbruch-Logik ist jetzt typkorrekt. Datei zusätzlich bereinigt (logWarn-unknown, 3 ungenutzte forEach-Index-Params).

| Bereich | Status |
|---------|--------|
| components | in Arbeit (413 → 176) |

### Bereich: components — KOMPLETT SAUBER (0 Fehler)

Von 413 → 0 über mehrere Batches. Vorgehen: erst tote Duplikate löschen (immer per grep auf Import-Nutzung geprüft), dann mechanischen Long-Tail (ungenutzte Imports/Vars) im Batch, zuletzt die echten Typfehler einzeln.

Gelöschte tote Dateien (nirgends importiert): `results/shared-results-page.tsx` (aktiv: -complete), `UpdateNotification.tsx` (aktiv: VersionCheck), `ui/handzettel-ocr.tsx` (aktiv: -simple), `mobile/MobileNavigation.tsx` (hing am verworfenen PremiumProvider).

Wiederkehrende echte Fixes:
- **TS7030 "not all code paths return"**: useEffect mit bedingtem Cleanup-Return brauchte `return undefined;` im else-/Fall-Pfad (NotificationBell, Onboarding, ThemeProvider, aria-live, native-app-detector 2×, TargetVisualization).
- **`useRef<number>()` ohne Argument** (React19-Typen): → `useRef<number | undefined>(undefined)` (TargetVisualization, fireworks).
- **HelpTooltip**: Aufrufer nutzten `content=` + eigenes Icon als children, Komponente akzeptiert aber nur `text` und rendert eigenes Icon → `content` → `text`, children entfernt (PreviousYearAverageDisplay, team-strength-selector).
- **TeamStatusBadge** (zwei Varianten `teams/` und `ui/`): Prop-Vertrag auf die real genutzten separaten Props `outOfCompetition`/`reason` vereinheitlicht (Aufrufer in rwk-tabellen/page + mobile-team-cards); nicht existierenden `TeamCompetitionStatus`-Import entfernt.
- **Auth/SDK-User-Diskrepanz**: eigener `FirebaseUser`-Typ vs. echter Firebase-SDK-`User` → gezielte Casts bei `reauthenticateWithCredential`/`updatePassword` (PasswordChangePrompt) und `onAuthStateChanged` (AuthProvider).
- **`getSeasonSpecificScoresCollection(y, leagueType)`** string vs. Union → `as any` (PreviousYearAverage, statistics).
- **`secureLogger.error(msg, string)`** → korrekte Signatur `error(msg, Error, context)` (error-boundary).
- Diverse Einzelfälle: `improved-headings` `JSX.IntrinsicElements` → `React.ElementType`; `toaster` Rest-Destrukturierung mit `ReactNode`-Typ; `custom-accordion` Radix-`type`/`collapsible`-Union → `props as any`; `report-button` `size:"md"` → `"default"` gemappt; `pull-to-refresh` ref-Cast auf `RefObject<HTMLDivElement>`; `David21ImportDialog` `KMErgebnis[]`-Cast; `optimized-league-view` ungültige `politeness`-Prop entfernt; `NotificationCenter` `createdAt as any`; `SubstitutionDialog` `leagueId || ''`; `create-duel-dialog` optional chaining.

**BUGFIX (real, siehe Teil 4):** `safari-pdf-fix.ts` `showSafariPDFInstructions()` Rückgabetyp `void` → `boolean`.

Der mechanische Long-Tail (~145 Fehler über ~96 Dateien: `React`-Import bei React19, ungenutzte Imports/Vars/Params, Toast-variant, logWarn-unknown) wurde an einen Sub-Agent delegiert und danach vom Hauptagent verifiziert (0 neue Fehler).

| Bereich | Status |
|---------|--------|
| components | ✅ 0 Fehler |
| Gesamt-Projekt | ~1672 |

### Bereich: km (app) — KOMPLETT SAUBER (0 Fehler)

Von 187 → 0. Aktiv genutzter Bereich (Kreismeisterschaft-Meldungen), daher priorisiert.

Zentraler Fix mit projektweiter Wirkung: **`Shooter`-Typ** in types/rwk um real genutzte KM-Felder erweitert: `kmClubId?`, `kmStartrechte?: Record<string,string>`.

Wiederkehrende Muster in diesem Bereich:
- **`useState([])` ohne Typ-Argument** → inferiert `never[]` → alle Feldzugriffe (`.id`, `.name`, `.jahr`, `.status`, `.meldeschluss`) schlagen fehl. Fix: State explizit typisieren (inline-Objekttypen mit den benötigten Feldern). Löste jeweils 10-30 Folgefehler pro Datei (uebersicht, mannschaftsregeln, page, mannschaften, mitglieder).
- **`.map(doc => ({id, ...doc.data()}))`** → `{id:string}[]` → mit State-Typen gecastet (`as unknown as Shooter[]/KMDisziplin[]/KMMeldung[]` bzw. inline).
- **`setX(prev => ...)` mit `prev is possibly null`** (mannschaftsregeln): Null-Guards `if (!prev) return prev;` und typisierte Callback-Parameter.
- **implizite `any`-Parameter** in sort/filter/forEach/map/getDeadline-Callbacks → explizit typisiert.
- **`logDebug(msg, a, b)` mit 3+ Args** → Template-Strings / `JSON.stringify`.
- **`.filter(Boolean)` narrowt nicht** → `.filter((c): c is string => Boolean(c))` type-guard; alternativ `x || ''`-Fallback bei `Array.includes`.
- Lokale Typen (km/mannschaften: eigenes `Mannschaft`/`Shooter`-Interface) um real genutzte Felder erweitert (`clubId?`, `firstName?`, `lastName?`).
- `EventTarget.value` → `e.currentTarget.value`; `useState<number>()` bzw. optionale `.jahr` mit `|| 0`; `vmDatum.toDate` cast.
- Tote lokale Funktionen/Variablen entfernt (handleEdit/DeleteMeldung, createDefaultRegeln, testTeam, clubFilter), ungenutzte Imports/States bereinigt.

| Bereich | Status |
|---------|--------|
| km (app) | ✅ 0 Fehler |
