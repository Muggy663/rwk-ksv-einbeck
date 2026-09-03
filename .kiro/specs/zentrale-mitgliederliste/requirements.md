# Requirements — Zentrale Mitgliederliste (RWK + KM)

## Einleitung

Aktuell gibt es drei getrennt implementierte Schützen-/Mitgliederlisten (`verein/schuetzen`, `km/mitglieder`, `km-orga/mitglieder`), die alle auf dieselbe Firestore-Collection `shooters` zugreifen, aber unterschiedliche Filter, Spalten, Schreibwege und Löschlogik haben. Das führt zu inkonsistenten Daten (z. B. widersprüchliches Setzen von Vereinsfeldern) und doppeltem Pflegeaufwand.

Ziel dieses Features: **Eine** zentrale Mitgliederverwaltung als Single Source of Truth, auf die sowohl der RWK-Vereinsbereich als auch der KM-Bereich zugreifen. Sichtbarkeit und Bearbeitungsrechte werden über die Rolle gesteuert. Ein Einstieg erfolgt über eine Dashboard-Card. Schreibzugriffe laufen über **eine** abgesicherte API. Löschen erfolgt als Soft-Delete mit Kaskade und Audit-Log.

## Begriffe und Rahmenbedingungen (bestätigt)

- **Ein Vereinsfeld:** Es wird ausschließlich `clubId` verwendet (das reale `shooters`-Dokument hat kein `kmClubId`/`rwkClubId`). Neue/geänderte Datensätze schreiben nur `clubId`. `getShooterClubId()` darf als Lesezugriff bestehen bleiben.
- **Rollen (maßgeblich):** Admin, KM-Orga, Sportleiter, Mannschaftsführer. "Vorstand" ist eine Altlast aus der Vereinssoftware-Zeit und wird NICHT als eigenständige Verwaltungsrolle behandelt.
- **Datenquelle:** Collection `shooters`. Keine Datenmigration im Rahmen dieses Features.
- **Nicht-Ziele:** Keine Zusammenführung der `user_permissions`/`km_user_permissions`-Collections; keine Änderung an Firestore Rules ohne ausdrückliche Freigabe; keine Vereinheitlichung von `km_shooters` (separate, hier nicht genutzte Collection).

## Rollen-/Rechtematrix (Sollzustand)

| Rolle | Mitglieder ansehen | Anlegen / Bearbeiten / Löschen | RWK-Ergebnisse eintragen | KM verwalten |
|---|---|---|---|---|
| Admin | alle | ja (alle Vereine) | ja | ja |
| KM-Orga | alle Mitglieder inkl. deren Vereine | ja (alle Vereine) | – | ja |
| Sportleiter | eigene (zugeordnete) Vereine | ja (eigene Vereine) | ja | ja (eigene Vereine) |
| Mannschaftsführer | – | – | ja (nur RWK-Ergebnisse) | – |

---

## Requirement 1 — Zentrale Mitgliederliste als wiederverwendbare Komponente

**User Story:** Als Entwickler/Betreiber möchte ich eine einzige Mitgliederlisten-Komponente, die in RWK- und KM-Bereich eingebunden wird, damit Daten, Darstellung und Verhalten konsistent sind und nur an einer Stelle gepflegt werden.

#### Acceptance Criteria
1. WHEN die Mitgliederliste in einem beliebigen Bereich (RWK-Verein, KM-Verein, KM-Orga) gerendert wird, THEN SHALL das System dieselbe zugrundeliegende Komponente und denselben Datenzugriff (Collection `shooters`, Feld `clubId`) verwenden.
2. THE Komponente SHALL einen Modus-Parameter (z. B. `mode: 'rwk' | 'km'`) akzeptieren, der die angezeigten Spalten und verfügbaren Aktionen steuert, ohne die zugrundeliegenden Daten zu verändern.
3. WHEN Mitglieder angezeigt werden, THEN SHALL die Liste mindestens Nachname, Vorname, Geburtsjahr, Geschlecht und Verein anzeigen.
4. WHEN der Modus `km` aktiv ist, THEN SHALL die Liste zusätzlich Mitgliedsnummer und die berechnete Altersklasse (Auflage und Freihand für das aktuelle Sportjahr) anzeigen.
5. THE Altersklassen-Berechnung SHALL die vorhandene zentrale Utility (`calculateAgeClass`/`berechneAltersklasse` in `lib/utils/altersklassen`) verwenden und NICHT pro Seite dupliziert werden.
6. THE Liste SHALL Suche (nach Name und Mitgliedsnummer) sowie Sortierung nach Nachname, Vorname, Geburtsjahr und Verein unterstützen.
7. THE Liste SHALL auf Mobilgeräten eine benutzbare Darstellung bieten (z. B. Karten- oder responsive Tabellendarstellung).

## Requirement 2 — Rollenbasierte Sichtbarkeit

**User Story:** Als Nutzer möchte ich nur die Mitglieder sehen, für die ich zuständig bin, damit die Ansicht relevant und datenschutzkonform ist.

#### Acceptance Criteria
1. WHEN ein Admin oder KM-Orga die Liste öffnet, THEN SHALL das System alle Mitglieder aller Vereine anzeigen.
2. WHEN ein KM-Orga die Liste öffnet, THEN SHALL zu jedem Mitglied der zugehörige Verein angezeigt werden.
3. WHEN ein Sportleiter die Liste öffnet, THEN SHALL das System nur Mitglieder der ihm zugeordneten Vereine anzeigen.
4. IF ein Sportleiter mehreren Vereinen zugeordnet ist, THEN SHALL das System Mitglieder aller seiner zugeordneten Vereine anzeigen (mit optionaler Vereins-Filterung in der UI).
5. WHEN ein Mannschaftsführer versucht, die Mitgliederverwaltung zu öffnen, THEN SHALL das System keinen Zugriff auf die Mitgliederverwaltung gewähren (Mannschaftsführer haben ausschließlich Zugriff auf die RWK-Ergebniserfassung).
6. THE Sichtbarkeitsprüfung SHALL nicht allein von der bekannten `useKMAuth`-Schwäche (`hasKMAccess` endet mit `|| true`) abhängen, sondern auf der konkreten Rolle und den `userClubIds` basieren.

## Requirement 3 — Mitglieder anlegen, bearbeiten, löschen (rollenabhängig)

**User Story:** Als berechtigter Nutzer möchte ich Mitglieder anlegen, bearbeiten und löschen können, damit die Stammdaten aktuell bleiben.

#### Acceptance Criteria
1. WHEN ein Admin oder KM-Orga ein Mitglied anlegt/bearbeitet/löscht, THEN SHALL das System dies für Mitglieder beliebiger Vereine erlauben.
2. WHEN ein Sportleiter ein Mitglied anlegt/bearbeitet/löscht, THEN SHALL das System dies nur für Mitglieder seiner zugeordneten Vereine erlauben.
3. WHEN ein Mitglied angelegt wird, THEN SHALL das System die Pflichtfelder Vorname, Nachname, Geschlecht, Geburtsjahr und Verein (`clubId`) erfassen; optionale Felder sind Mitgliedsnummer und Kontaktdaten (E-Mail, Telefon/Mobil, Straße, PLZ, Ort).
4. WHEN ein Mitglied gespeichert wird, THEN SHALL das System das Vereinsfeld ausschließlich als `clubId` schreiben (kein `kmClubId`/`rwkClubId`).
5. WHEN ein Mitglied gespeichert wird, THEN SHALL das System das abgeleitete `name`-Feld (`"Vorname Nachname"`) konsistent mitführen (Kompatibilität mit bestehenden Anzeigen).
6. WHEN ein berechtigter Nutzer eine Aktion ausführt, für die ihm die Rolle fehlt (z. B. Sportleiter bei fremdem Verein), THEN SHALL das System die Aktion serverseitig ablehnen (nicht nur UI-seitig ausblenden).

## Requirement 4 — Einheitlicher, abgesicherter Schreibweg (API)

**User Story:** Als Betreiber möchte ich, dass alle schreibenden Zugriffe auf Mitglieder über eine einzige, authentifizierte API laufen, damit Sicherheit und Verhalten einheitlich sind.

#### Acceptance Criteria
1. THE schreibenden Operationen (Anlegen, Bearbeiten, Löschen) SHALL über eine gemeinsame, serverseitig authentifizierte API-Route erfolgen.
2. WHEN eine schreibende Anfrage ohne gültige Authentifizierung erfolgt, THEN SHALL das System sie mit Statuscode 401 ablehnen.
3. WHEN eine authentifizierte, aber unberechtigte schreibende Anfrage erfolgt (z. B. Verein nicht zugeordnet), THEN SHALL das System sie mit Statuscode 403 ablehnen.
4. THE bestehende ungesicherte API-Familie `/api/km/shooters/*` SHALL nicht mehr für schreibende Operationen aus der Mitgliederverwaltung genutzt werden; bestehende Aufrufer werden auf die gesicherte Route umgestellt.
5. THE gemeinsame API SHALL Eingaben validieren und normalisieren (z. B. Geschlecht auf `male`/`female`, Geburtsjahr als plausible Zahl).
6. IF bestehende Routen aus Kompatibilitätsgründen bestehen bleiben, THEN SHALL sichergestellt sein, dass die Mitgliederverwaltung ausschließlich die gesicherte Route verwendet.

## Requirement 5 — Löschen als Soft-Delete mit Kaskade und Audit-Log

**User Story:** Als Betreiber möchte ich, dass das Löschen eines Mitglieds keine verwaisten Referenzen und keinen Verlust historischer Ergebnisse verursacht, damit Tabellen und Statistiken konsistent bleiben.

#### Acceptance Criteria
1. WHEN ein Mitglied gelöscht wird, THEN SHALL das System es als inaktiv markieren (Soft-Delete, z. B. `isActive: false` und/oder `deletedAt`) statt das Dokument hart zu entfernen.
2. WHEN ein Mitglied gelöscht wird, THEN SHALL das System es aus den `shooterIds`/`teamIds` der aktiven Mannschaften entfernen.
3. WHEN ein Mitglied gelöscht wird, THEN SHALL zugehörige Ergebnisse und KM-Meldungen erhalten bleiben (nicht hart gelöscht), sodass Statistiken/Historie intakt bleiben.
4. WHEN ein Mitglied gelöscht wird, THEN SHALL das System einen Audit-Log-Eintrag erstellen (wer, was, wann).
5. WHEN ein gelöschtes (inaktives) Mitglied vorliegt, THEN SHALL es in den Standard-Verwaltungslisten nicht mehr erscheinen.
6. THE Lösch-Bestätigungsdialog SHALL das tatsächliche Verhalten korrekt beschreiben (kein Versprechen von Aktionen, die nicht ausgeführt werden).
7. IF eine harte, endgültige Löschung erforderlich ist, THEN SHALL diese ausschließlich einer Admin-Sonderfunktion vorbehalten sein.

## Requirement 6 — Zentraler Dashboard-Einstieg per Card (statt Bereichs-Cards)

**User Story:** Als Nutzer möchte ich die Mitgliederliste über eine einzige Card im zentralen Dashboard ("Arbeitsbereich auswählen") erreichen, damit klar ist, dass es eine gemeinsame Liste für RWK und KM ist.

#### Acceptance Criteria
1. WHEN ein berechtigter Nutzer die zentrale Dashboard-Auswahl (`dashboard-auswahl`) öffnet, THEN SHALL genau eine Card "Mitglieder" sichtbar sein, die zur zentralen Mitgliederliste führt.
2. THE Card SHALL einen kurzen Hinweis anzeigen, dass die Liste für beide Bereiche (RWK und KM) gilt.
3. THE Card SHALL nur für Rollen sichtbar sein, die Mitglieder verwalten dürfen (Admin, KM-Orga, Sportleiter); für Mannschaftsführer und reine Individual-/Schießnachweis-Nutzer SHALL sie NICHT sichtbar sein.
4. THE Card SHALL auf Mobilgeräten korrekt und vollständig sichtbar sein (responsive, im bestehenden Grid der Dashboard-Auswahl).
5. THE bisherigen "Schützen"-/"Mitglieder"-Cards bzw. -Einstiege im RWK-Vereins-Dashboard und im KM-Bereich SHALL entfernt werden, sodass es nur noch den zentralen Einstieg gibt (bestehende Detailseiten/Links werden auf die zentrale Liste umgeleitet oder entfernt).
6. THE Card SHALL das bestehende Card-Muster der Dashboard-Auswahl (shadcn `Card` mit Titel/Beschreibung/Badge/Button) wiederverwenden.

## Requirement 7 — Datenmodell-Konsistenz (Typen)

**User Story:** Als Entwickler möchte ich ein sauberes, vollständiges Shooter-Datenmodell, damit die reale Datenstruktur korrekt abgebildet ist.

#### Acceptance Criteria
1. THE `Shooter`-Typ (in `types/rwk.ts`) SHALL die real in `shooters` vorhandenen Felder abbilden, inkl. optionaler Kontakt-/Metafelder (`email`, `mobil`/`telefon`, `strasse`, `plz`, `ort`, `mitgliedsnummer`, `createdBy`, `source`, `genderGuessed`, `isActive`, Zeitstempel).
2. THE Feature SHALL keine neuen abweichenden Vereinsfelder einführen; `clubId` bleibt das einzige Vereinsfeld.
3. WHEN das Datenmodell ergänzt wird, THEN SHALL das gesamte Projekt weiterhin 0 TypeScript-Fehler haben (`npx tsc --noEmit`).

## Requirement 8 — Keine Regression bestehender Funktion

**User Story:** Als Nutzer möchte ich, dass bestehende Abläufe (Team-Zuordnung, RWK-Ergebniserfassung, KM-Meldungen) unverändert funktionieren, damit die Umstellung risikoarm ist.

#### Acceptance Criteria
1. WHEN die zentrale Mitgliederliste eingeführt wird, THEN SHALL die bestehende RWK-Team-Zuordnung (Schütze ↔ `rwk_teams`) weiterhin funktionieren.
2. WHEN ein Mitglied im RWK-Kontext angelegt wird, THEN SHALL die optionale initiale Mannschaftszuordnung wie bisher möglich sein.
3. THE bestehenden Ergebnis-/Meldungs-Ansichten SHALL nach der Umstellung unverändert korrekte Daten anzeigen.
4. WHEN das Feature abgeschlossen ist, THEN SHALL das Projekt weiterhin fehlerfrei bauen (`npm run build`) und 0 TypeScript-Fehler haben.
