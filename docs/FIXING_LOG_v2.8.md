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
