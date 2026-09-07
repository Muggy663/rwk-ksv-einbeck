# Roadmap: RWK-Automatisierung

**Ziel:** Die Rundenwettkämpfe (Luftdruck + Kleinkaliber) so weit automatisieren, dass der
RWK-Leiter nur noch als Überwacher/Freigeber agiert. Fertig werden bis zum nächsten
KK-Start im kommenden Jahr.

**Leitprinzip:**
- Zeit-Trigger (Fenster auf/zu, Erinnerungen, Urkunden) → laufen vollautomatisch.
- Alles, was Ligen final festlegt oder an alle Vereine kommuniziert → nur mit Freigabe.
- Jede automatische Aktion wird protokolliert (Audit-Log) und meldet sich per Status-Mail.

**Bereits erledigt (Fundament):**
- [x] Täglicher Vercel-Cron vorhanden (`/api/cron/meldeschluss-reminder`)
- [x] Meldeschluss-Erinnerung 7 Tage vorher (RWK + KM) an Sportleiter, Mannschaftsführer, KM-Orga — gestaltete HTML-Mail inkl. Signatur
- [x] Muster für "einmalig ausführen" via Flag-Collection (`meldeschluss_reminders`)
- [x] Meldefenster-Banner auf Startseite (RWK + KM)
- [x] `Season.meldeschluss` (RWK, ISO) + `km_saisons.meldeschluss` (KM)

---

## Phase 1 — Schnelle Siege (geringes Risiko, hoher Nutzen)

### [ ] 1. Meldefenster automatisch ÖFFNEN (30 Tage vorher)
- Neues Feld `meldestart` (Datum) pro Saison/Sportart, gepflegt aus der RWK-Ordnung.
- Täglicher Cron: wenn `heute >= meldestart` und Status = "Vorbereitung" → Status auf
  "Anmeldung möglich" setzen (einmalig, mit Flag).
- Optional: Info-Mail "Meldefenster für <Saison> ist jetzt offen" an Empfängerkreis.
- Aufwand: klein. Spiegelbild der bestehenden Erinnerungslogik.

### [ ] 2. Meldefenster automatisch SCHLIESSEN + Zusammenfassung an RWK-Leiter
- Cron: wenn `heute > meldeschluss` und Status = "Anmeldung möglich" → "Anmeldung geschlossen".
- Zusammenfassungs-Mail an RWK-Leiter: Anzahl gemeldeter Mannschaften je Verein/Liga.
- Reversibel (Admin kann wieder öffnen).
- Aufwand: klein.

### [ ] 3. Überfällig-Erinnerung für Ergebnisse
- Cron: erkennt Durchgänge, deren Ergebnis nach Termin X noch fehlt.
- Erinnerungs-Mail an die betreffende Mannschaft / den Sportleiter (gleiche Mail-Mechanik).
- Aufwand: klein–mittel (braucht Durchgangs-Termine als Datenbasis).

---

## Phase 2 — Herzstück (braucht Abstimmung + Freigabe-Schritte)

### [ ] 4. Auf-/Abstiegsregeln definieren (KLÄRUNGSBEDARF, zuerst!)
- Offene Fragen, die vor dem Bau beantwortet sein müssen:
  - Wie viele Mannschaften steigen pro Liga auf / ab?
  - Gibt es Relegation? Wenn ja, welche Regel?
  - Wie werden Rückzüge / nicht erneut gemeldete Mannschaften behandelt?
  - Wie werden Neueinsteiger einsortiert?
  - Sonderregeln Kreis (z. B. mehrere Mannschaften eines Vereins)?
- Ergebnis: schriftliches Regelwerk als Grundlage für Schritt 5.
- Aufwand: nur Denkarbeit/Absprache, kein Code.

### [ ] 5. Ligen-Zusammensetzung VORSCHLAGEN (Auf/Abstieg berechnen)
- App berechnet aus Abschlusstabellen der Vorsaison + Regelwerk (Schritt 4) einen
  Ligen-Vorschlag für die neue Saison.
- Darstellung als bearbeitbarer Vorschlag; RWK-Leiter korrigiert/bestätigt.
- KEIN automatisches Finalisieren.
- Aufwand: groß. Das ist der zentrale, komplexeste Baustein.

### [ ] 6. Finale Ligen automatisch VERSENDEN (nach Freigabe)
- Neuer Zustand "Ligen freigegeben" (durch RWK-Leiter gesetzt).
- Danach: automatischer Versand der fertigen Zusammensetzungen an Vereine/Sportleiter.
- Aufwand: klein (nutzt Mail-Mechanik), hängt an Freigabe aus Schritt 5.

---

## Phase 3 — Saisonabschluss & Kreislauf

### [ ] 7. Urkunden automatisch nach Saisonabschluss
- Nach Status "Abgeschlossen": Batch erzeugt Urkunden/PDFs für Platzierte
  (App kann Zertifikate bereits generieren).
- Bereitstellen und/oder per Mail versenden (Freigabe empfohlen).
- Aufwand: mittel.

### [ ] 8. Saison-Übergang / nächste Saison anlegen (Kreislauf schließen)
- Nutzt vorhandenen `season-transition-service`.
- Neue Saison in Status "Vorbereitung" anlegen, Termine (`meldestart`, `meldeschluss`,
  Durchgänge) aus RWK-Ordnung setzen → mündet zurück in Phase 1, Schritt 1.
- Halbautomatisch: App bereitet vor, RWK-Leiter gibt frei.
- Aufwand: mittel.

---

## Phase 4 — Überwachung & Betrieb (begleitend)

### [ ] 9. Zentrales Saison-Konfig-Objekt
- Pro Sportart alle Termine der RWK-Ordnung an einer Stelle pflegen
  (`meldestart`, `meldeschluss`, Durchgangs-Termine, Saisonstart/-ende).
- Steuert alle Cron-Aktionen. Einmal pflegen statt an vielen Stellen.

### [ ] 10. Automatik-Protokoll (Audit-Log) + Status-Mails
- Jede automatische Aktion wird protokolliert (was, wann, welche Saison).
- Kurze Status-Mails an RWK-Leiter bei wichtigen Schritten, damit man nicht in die
  App schauen muss, um zu wissen, dass alles läuft.
- Aufwand: klein–mittel.

---

## Empfohlene Reihenfolge
1 → 2 → 3 (schnelle Siege) → 4 (Regeln klären) → 5 (Herzstück) → 6 → 7 → 8.
Schritt 9 + 10 begleitend einziehen, sobald der erste Cron-Übergang steht.

## Hinweis zu Credits / Zeitplan
- Phase 1 (Schritte 1–3) und Phase 3 (7) sind risikoarm und schnell umsetzbar.
- Schritt 4 kostet KEINE Credits (reine Absprache) — kann jederzeit vorbereitet werden.
- Schritt 5 ist der aufwendigste Posten; dafür Credits einplanen.
- Zeitziel: fertig bis zum nächsten KK-Start im kommenden Jahr.
