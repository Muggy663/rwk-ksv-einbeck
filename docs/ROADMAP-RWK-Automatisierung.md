# Roadmap: RWK-Automatisierung

**Ziel:** Die Rundenwettkämpfe (Luftdruck + Kleinkaliber) so weit automatisieren, dass der
RWK-Leiter nur noch als Überwacher/Freigeber agiert. Fertig bis zum nächsten KK-Start
im kommenden Jahr. (KM ist ein eigenes Thema und hier NICHT relevant.)

**Leitprinzip:**
- Zeit-Trigger (Fenster auf/zu, Erinnerungen, Urkunden) → laufen vollautomatisch.
- Alles, was Ligen final festlegt oder an alle Vereine kommuniziert → nur mit Freigabe.
- Jede automatische Aktion wird protokolliert und meldet sich per Status-Mail.

---

## IST-STAND (nach Code-Analyse am 07.09.2026)

Vieles ist bereits vorhanden — teils automatisch, teils manuell:

- [x] **Täglicher Vercel-Cron** (`/api/cron/meldeschluss-reminder`), abgesichert per `CRON_SECRET`
- [x] **Meldeschluss-Erinnerung** 7 Tage vorher (RWK+KM) an Sportleiter, Mannschaftsführer,
      KM-Orga — gestaltete HTML-Mail inkl. Signatur; einmalig pro Saison (Flag)
- [x] **Meldefenster automatisch ÖFFNEN** (RWK): Feld `meldestart`; Cron setzt Status
      "Vorbereitung" → "Anmeldung möglich" am Meldestart-Tag; Info-Mail an Empfängerkreis
- [x] **Meldefenster automatisch SCHLIESSEN** (RWK): Cron setzt Status "Anmeldung möglich"
      → "Vorbereitung", wenn Meldeschluss vorbei; Zusammenfassungs-Mail an RWK-Leiter
      mit Anzahl gemeldeter Mannschaften
- [x] **Meldefenster-Banner** auf Startseite (RWK+KM)
- [x] **Auf-/Abstieg BERECHNEN** (`season-transition-service.ts` → `calculateLeagueStandings`,
      `generatePromotionRelegationSuggestions`): Tabellenstände + Regelwerk RWK-Ordnung §16
      (Meister auf, Letzter ab, Platz 2/Vorletzter mit Ringvergleich, Abmeldungen,
      offene Gruppen LG/LP, Ligaverkleinerung). Seite `/admin/promotion-relegation` mit
      PDF-Export und Bestätigen-Checkboxen. **ABER:** `applyPromotionRelegation` verschiebt
      noch KEINE Teams (nur Logging) → Umsetzung ist offen/manuell.
- [x] **Neue Saison anlegen + Ligen/Teams kopieren** (`createNewSeason`): automatischer Batch;
      neue Vereine in niedrigste Liga (§7). **ABER:** schreibt `status:'Geplant'`
      (nicht im Status-Enum → Inkonsistenz); keine Neueinteilung nach Auf/Abstieg.
- [x] **Fehlende Ergebnisse erkennen** (`/admin/missing-results`): datenbasiert (4/5 Durchgänge),
      auf Knopfdruck. **ABER:** nicht terminbasiert (kein "überfällig seit Datum").
- [x] **Urkunden erzeugen** (`/admin/exports/certificates`, `certificate-data-generator`):
      Liga-Sieger, beste Mannschaften, Gesamtsieger — manuell auf Knopfdruck.

### Datenmodell-Lücken (Basis für weitere Automatisierung)
- Saison (`seasons`): hat `status`, `meldeschluss` (ISO), `competitionYear`, `type`, `name`.
  `startDate`/`endDate` existieren im Typ, werden aber NICHT im Formular gepflegt.
- **Fehlt:** `meldestart` (für Auto-Öffnen), strukturierte **Durchgangs-Termine**
  (für terminbasierte Überfälligkeit), konsistenter Status "Geplant".
- Status-Enum: `Vorbereitung | Anmeldung möglich | Laufend | Abgeschlossen` (rein manuell).
- Teams `rwk_teams` (seasonId/leagueId/competitionYear), Ligen `rwk_leagues` (order = Hierarchie).

---

## OFFENE SCHRITTE (nach Priorität)

### [x] A. Meldefenster automatisch ÖFFNEN (Gegenstück zum Schließen) — ERLEDIGT
- Feld `meldestart` (ISO) im Season-Typ + Admin-Formular (sichtbar bei Status "Vorbereitung").
- Cron: wenn `heute >= meldestart` und Status "Vorbereitung" → "Anmeldung möglich".
- Info-Mail "Meldefenster offen" an Sportleiter/Mannschaftsführer/KM-Orga, inkl. Hinweis
  auf tägliche Öffnung/Schließung gegen 09:00 Uhr.
- Öffnungszeitpunkt-Faustregel: **4 Wochen vor Wettkampfbeginn** (LD ab 01.10. → ~18.08.;
  KK ab 01.05. → ~18.03.). Meldeschluss laut RWK-Ordnung: LD 15.09., KK 15.04.

### [x] B. Saison-Status "Geplant" konsistent gemacht — ERLEDIGT
- `createNewSeason` schreibt jetzt "Vorbereitung" statt des nicht existierenden "Geplant".

### [ ] C. Auf-/Abstieg ANWENDEN (Team-Verschiebung implementieren)
- `applyPromotionRelegation` real umsetzen: bestätigte Vorschläge verschieben Teams in die
  Ziel-Ligen der neuen Saison (leagueId aktualisieren).
- Bleibt Freigabe-gesteuert: RWK-Leiter bestätigt Vorschläge, dann Umsetzung per Klick.
- Aufwand: mittel–groß. Das Regelwerk existiert schon; nur die Umsetzung fehlt.

### [ ] D. Terminbasierte Ergebnis-Erinnerung
- Durchgangs-Termine als Datenbasis anlegen (pro Saison/Liga oder zentral).
- Cron erinnert Mannschaften, deren Durchgang-Ergebnis nach Termin fehlt (nutzt Mail-Mechanik).
- Aufwand: mittel (Datenmodell + Cron-Erweiterung).

### [ ] E. Fertige Ligen automatisch VERSENDEN (nach Freigabe)
- Zustand "Ligen freigegeben" (durch RWK-Leiter) → automatischer Versand der
  Zusammensetzungen an Vereine/Sportleiter.
- Aufwand: klein (Mail-Mechanik), hängt an C.

### [ ] F. Urkunden automatisch nach Saisonabschluss
- Nach Status "Abgeschlossen": Batch erzeugt Urkunden (Generator existiert).
- Bereitstellen/mailen, Freigabe empfohlen.
- Aufwand: mittel.

### [ ] G. Saison-Konfig + Automatik-Protokoll (begleitend)
- Zentrales Konfig-Objekt pro Sportart (meldestart, meldeschluss, Durchgangs-Termine,
  Saisonstart/-ende) — einmal pflegen, steuert alle Cron-Aktionen.
- Audit-Log + kurze Status-Mails an RWK-Leiter bei jedem Automatik-Schritt.
- Aufwand: klein–mittel.

---

## Empfohlene Reihenfolge
B (Fundament) → A (Auto-Öffnen) → D (Ergebnis-Erinnerung) → C (Auf/Abstieg anwenden) →
E (Ligen versenden) → F (Urkunden) → G begleitend.

## Offene Fachfrage: Öffnungszeitpunkt des Meldefensters
- Vorschlag: **4–6 Wochen vor Wettkampfbeginn** öffnen.
- Randbedingung: nicht zu lange Überschneidung mit dem jeweils anderen Wettkampf (LD/KK).
- Konkrete Wettkampf-/Meldetermine stehen in der RWK-Ordnung/Ausschreibung (nicht im
  App-Handbuch). Diese Termine müssen als `meldestart`/`meldeschluss` je Saison hinterlegt
  werden — dann steuert der Cron Öffnen und Schließen vollautomatisch.

## Hinweis zu Credits / Zeitplan
- Schritte B + A sind schnell und risikoarm — idealer nächster Schritt.
- Schritt C ist der aufwendigste Posten (Team-Verschiebung), Regelwerk existiert aber schon.
- Zeitziel: fertig bis zum nächsten KK-Start im kommenden Jahr.
