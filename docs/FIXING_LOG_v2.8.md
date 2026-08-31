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
