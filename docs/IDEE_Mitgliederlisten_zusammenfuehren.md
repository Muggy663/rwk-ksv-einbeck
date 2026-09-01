# Idee (für später): Mitgliederlisten RWK + KM zusammenführen

> Status: **vorgemerkt, noch NICHT umgesetzt.** Umsetzung sinnvoll erst **nach Abschluss der TypeScript-Sanierung**, weil saubere, konsistente Typen die Voraussetzung dafür sind.
> Notiert am: 31.08.2026 (während der TypeScript-Sanierung, Branch `fix/typescript-sanierung`).

## Worum geht es

Es gibt aktuell **zwei getrennte Mitglieder-/Schützen-Ansichten**, die aber auf **dieselbe Datenbank** zugreifen:

- **Vereinsbereich (RWK):** Schützenliste für den Rundenwettkampf — `src/app/verein/schuetzen/page.tsx`
- **KM-Bereich:** Mitgliederliste für die Kreismeisterschaft — `src/app/km/mitglieder/page.tsx` und `src/app/km-orga/mitglieder/page.tsx`

Beide lesen real aus der Firestore-Collection **`shooters`**. Sie sind aber **unterschiedlich aufgebaut** (unterschiedliche Felder, unterschiedliche Anzeige, teils sogar unterschiedliche lokale Typdefinitionen). Das Ziel: **ein gemeinsames Datenmodell und konsistente Listen**, wobei der KM-Bereich **mehr Infos** anzeigt/braucht als der RWK-Bereich.

## Warum das wichtig ist (Risiko)

Da beide auf dieselbe Collection schreiben und lesen, führen inkonsistente Feldnamen zu **schwer auffindbaren Bugs**: Ein Feld, das die eine Seite unter Namen A speichert und die andere unter Namen B liest, "verschwindet" scheinbar. Genau solche Doppelstrukturen existieren bereits (siehe unten).

## Belegte Ist-Situation (aus dem Code während der Sanierung)

1. **Mehrere parallele Vereins-ID-Felder am `Shooter`-Typ:**
   - `clubId` (Hauptverein)
   - `rwkClubId` (RWK-spezifisch)
   - `kmClubId` (KM-spezifisch — während der Sanierung ergänzt, weil real genutzt)
   - Es gibt eine Helferfunktion `getShooterClubId()` (in `src/lib/utils/altersklassen.ts`), die entscheidet, welches Feld gilt. Das ist ein klares Zeichen für gewachsene Doppelstruktur.

2. **KM-spezifische Felder** am `Shooter`-Typ (in `src/types/rwk.ts`), die der RWK nicht braucht:
   - `mitgliedsnummer`
   - `kmStartrechte` (Record<string,string> — Startrechte je Disziplin/Bereich; während der Sanierung ergänzt)
   - `sondergenehmigung` (für Schützen unter 12)
   - genauere Altersklassen-/Geburtsjahr-Nutzung

3. **Abweichender lokaler Typ:** `src/app/km/mannschaften/page.tsx` hatte einen **eigenen, engeren lokalen `Shooter`-Typ** definiert — mit `vereinId` statt `clubId`. Solche lokalen Abweichungen sind fehleranfällig und sollten verschwinden.

4. **Doku vs. Realität — GEKLÄRT (31.08.2026):** Die tatsächliche Firestore-Collection-Liste wurde geprüft. Es gibt **KEINE** `km_shooters`-Collection. Der `km_shooters`-Verweis in `docs/database-structure.md` ist ein **Doku-Altstand**. → Real existiert nur **eine** Schützen-Quelle: `shooters`. Für die Zusammenführung heißt das: **keine Collection-Migration nötig**, nur Feld-/Anzeige-Struktur vereinheitlichen.

5. **Analoge Doppelstruktur bei Berechtigungen:** In der echten DB existieren **zwei** getrennte Collections: `user_permissions` (RWK/allgemein) UND `km_user_permissions` (KM). Dieselbe RWK/KM-Trennung wie bei den Schützen. Nicht Teil dieser Mitglieder-Idee, aber im Hinterkopf behalten (evtl. eigenes späteres Konsolidierungsthema).

6. **Keine `clubs/{clubId}/mitglieder`-Subcollection:** Die in der DB-Doku beschriebene "Vereinssoftware Multi-Tenant"-Mitgliederstruktur existiert real (noch) NICHT. Es geht bei dieser Idee also ausschließlich um `shooters` — keine dritte Mitgliederquelle.

### Tatsächlicher Datenbank-Stand (Collections, 31.08.2026)
Relevant für dieses Thema: `shooters` (einzige Schützen-Quelle), `clubs`, `user_permissions` + `km_user_permissions`, `km_meldungen_2026_kk|kkp|ld` / `km_meldungen_2027_kk`, `km_saisons`, `km_disziplinen`, `km_wettkampfklassen`, `km_altersklassen`, `rwk_teams`, `km_mannschaften`. (Keine `km_shooters`, keine `clubs/*/mitglieder`.)

## Lösungsskizze (Vorschlag, noch nicht final)

1. **Eine Datenquelle:** `shooters` ist bereits real die einzige Schützen-Collection (bestätigt — keine `km_shooters`). Es ist **keine Collection-Migration** nötig, nur die Vereinheitlichung von Feldnamen und Anzeige.
2. **Ein gemeinsamer Basis-Typ** `Shooter` mit den Kernfeldern, die beide teilen:
   - `id`, `firstName`/`lastName` (bzw. `name`), `birthYear`, `gender`, ein **einheitliches** Vereinsfeld
3. **Vereins-ID vereinheitlichen:** langfristig die drei Felder (`clubId`/`rwkClubId`/`kmClubId`) auf ein klares Modell reduzieren. Entweder ein `clubId` + optional abweichender `kmClubId` (dokumentiert, warum), oder eine bewusste Migration. `getShooterClubId()` als einzige Zugriffsstelle behalten, bis migriert ist.
4. **KM-Zusatzfelder als optionale Erweiterung** am selben Typ (NICHT als zweiter Typ) — so wie `kmClubId`/`kmStartrechte` schon jetzt optional am `Shooter` hängen.
5. **Eine gemeinsame Listen-Komponente** (z.B. `MemberList`) mit einem Prop `mode: 'rwk' | 'km'`:
   - `mode="rwk"`: zeigt die schlanke Spaltenauswahl (Name, Verein, Geburtsjahr, Geschlecht …)
   - `mode="km"`: zeigt zusätzlich KM-Felder (Mitgliedsnummer, Startrechte, genaue Altersklasse …)
   - Beide lesen/schreiben **dieselben Felder mit denselben Namen**. Unterschied ist nur die **Sichtbarkeit**, nicht das Datenmodell.

## Empfohlenes Vorgehen

- Als **Spec** anlegen (Requirements → Design → Tasks), nicht als schneller Vibe-Fix — es berührt Datenmodell, mehrere Seiten und potenziell eine Migration.
- **Vor Design:** im echten Firestore prüfen, welche **Felder** auf `shooters`-Dokumenten real befüllt sind (Collection-Frage ist geklärt: nur `shooters`). Besonders: sind `rwkClubId`/`kmClubId` bei vielen Schützen wirklich unterschiedlich befüllt, oder meist leer/identisch? Das entscheidet, wie aggressiv man die ClubId-Felder konsolidieren kann.
- **Reihenfolge:** erst nach der TS-Sanierung, damit auf konsistenten Typen aufgesetzt wird.
- **Firestore Rules** dabei NICHT ungefragt anfassen (bestehende Projekt-Regel).

## Betroffene Dateien (Einstiegspunkte)

- `src/types/rwk.ts` — zentraler `Shooter`-Typ
- `src/lib/utils/altersklassen.ts` — `getShooterClubId()`
- `src/app/verein/schuetzen/page.tsx` — RWK-Schützenliste
- `src/app/km/mitglieder/page.tsx` — KM-Mitgliederliste (Verein-Sicht)
- `src/app/km-orga/mitglieder/page.tsx` — KM-Mitgliederliste (Orga-Sicht)
- `src/app/km/mannschaften/page.tsx` — enthielt abweichenden lokalen `Shooter`-Typ
- `docs/database-structure.md` — Doku (enthält evtl. veralteten `km_shooters`-Verweis)
