# UI-Mockups für Kreismeisterschaftsmeldungen

## 1. Vereinsportal - Meldungsformular

```
+----------------------------------------------------------------------+
|                     KREISMEISTERSCHAFT 2025                          |
|                     Meldungsformular                                 |
+----------------------------------------------------------------------+
| Verein: [SV Musterverein]                                            |
+----------------------------------------------------------------------+
| Schütze auswählen:                                                   |
| [Dropdown: Max Mustermann (2005, m)]                                 |
+----------------------------------------------------------------------+
| Disziplin auswählen:                                                 |
| [x] 1.10 Luftgewehr Freihand                                         |
| [ ] 1.11 Luftgewehr Auflage                                          |
| [ ] 1.35 KK 100m Freihand                                            |
| [ ] ...                                                              |
+----------------------------------------------------------------------+
| Wettkampfklasse: [Junioren A m] (automatisch berechnet)              |
+----------------------------------------------------------------------+
| Landesmeisterschaft-Teilnahme:                                       |
| ( ) Ja  (•) Nein                                                     |
+----------------------------------------------------------------------+
| Anmerkungen:                                                         |
| [                                                                  ] |
| [                                                                  ] |
+----------------------------------------------------------------------+
|                      [Meldung hinzufügen]                            |
+----------------------------------------------------------------------+

+----------------------------------------------------------------------+
|                     Aktuelle Meldungen                               |
+----------------------------------------------------------------------+
| Name        | Jahrgang | Disziplin           | Klasse      | LM      |
+----------------------------------------------------------------------+
| Mustermann  | 2005     | LG Freihand         | Junioren A m| Nein    |
| Musterfrau  | 2008     | LG Freihand         | Jugend w    | Ja      |
| ...         | ...      | ...                 | ...         | ...     |
+----------------------------------------------------------------------+
|                      [Mannschaften bilden]                           |
|                      [Meldungen abschließen]                         |
+----------------------------------------------------------------------+
```

## 2. Vereinsportal - Mannschaftsbildung

```
+----------------------------------------------------------------------+
|                     KREISMEISTERSCHAFT 2025                          |
|                     Mannschaftsbildung                               |
+----------------------------------------------------------------------+
| Verein: [SV Musterverein]                                            |
+----------------------------------------------------------------------+
| Disziplin: [Dropdown: Luftgewehr Freihand]                           |
+----------------------------------------------------------------------+
| Wettkampfklasse: [Dropdown: Junioren m/w]                            |
+----------------------------------------------------------------------+
| Verfügbare Schützen:                                | Mannschaft:    |
|                                                     |                |
| [ ] Mustermann, Max (Junioren A m)                  | > Mustermann   |
| [ ] Müller, Jan (Junioren B m)                      | > Müller       |
| [ ] Schmidt, Tim (Junioren A m)                     | > Schmidt      |
|                                                     |                |
| [Hinzufügen >]                                      | [< Entfernen]  |
+----------------------------------------------------------------------+
|                      [Mannschaft speichern]                          |
+----------------------------------------------------------------------+

+----------------------------------------------------------------------+
|                     Gemeldete Mannschaften                           |
+----------------------------------------------------------------------+
| Disziplin           | Klasse        | Schützen                       |
+----------------------------------------------------------------------+
| LG Freihand         | Junioren m/w  | Mustermann, Müller, Schmidt    |
| LG Freihand         | Herren I      | Beispiel, Muster, Test         |
| ...                 | ...           | ...                            |
+----------------------------------------------------------------------+
|                      [Zurück zu Meldungen]                           |
+----------------------------------------------------------------------+
```

## 3. Kreisverband - Meldungsübersicht

```
+----------------------------------------------------------------------+
|                     KREISMEISTERSCHAFT 2025                          |
|                     Meldungsübersicht                                |
+----------------------------------------------------------------------+
| Filter:                                                              |
| Verein: [Alle ▼]  Disziplin: [Alle ▼]  Klasse: [Alle ▼]  LM: [Alle ▼]|
+----------------------------------------------------------------------+
| Suche: [                                                           ] |
+----------------------------------------------------------------------+
| Meldungen: 127                                                       |
+----------------------------------------------------------------------+
| Name        | Verein      | Jahrgang | Disziplin    | Klasse    | LM  |
+----------------------------------------------------------------------+
| Mustermann  | SV Muster   | 2005     | LG Freihand  | Jun A m   | Nein|
| Musterfrau  | SV Beispiel | 2008     | LG Freihand  | Jugend w  | Ja  |
| ...         | ...         | ...      | ...          | ...       | ... |
+----------------------------------------------------------------------+
| Aktionen: [Exportieren ▼] [Startplan erstellen] [Statistik anzeigen] |
+----------------------------------------------------------------------+
```

## 4. Kreisverband - Startplanerstellung

```
+----------------------------------------------------------------------+
|                     KREISMEISTERSCHAFT 2025                          |
|                     Startplanerstellung                              |
+----------------------------------------------------------------------+
| Disziplin: [Dropdown: Luftgewehr Freihand]                           |
+----------------------------------------------------------------------+
| Wettkampftag: [Datumswähler: 15.02.2025]                             |
+----------------------------------------------------------------------+
| Verfügbare Zeiten:                                                   |
|                                                                      |
| [ ] 09:00 - 09:50 Uhr                                                |
| [ ] 10:00 - 10:50 Uhr                                                |
| [ ] 11:00 - 11:50 Uhr                                                |
| [ ] 13:00 - 13:50 Uhr                                                |
| [ ] 14:00 - 14:50 Uhr                                                |
+----------------------------------------------------------------------+
| Verfügbare Stände: [1-10]                                            |
+----------------------------------------------------------------------+
| Automatische Zuteilung nach:                                         |
| (•) Wettkampfklasse                                                  |
| ( ) Verein                                                           |
| ( ) Manuell                                                          |
+----------------------------------------------------------------------+
|                      [Startplan generieren]                          |
+----------------------------------------------------------------------+
```

## 5. Kreisverband - Statistik

```
+----------------------------------------------------------------------+
|                     KREISMEISTERSCHAFT 2025                          |
|                     Statistik                                        |
+----------------------------------------------------------------------+
| Gesamtmeldungen: 127                                                 |
| Teilnehmende Vereine: 8                                              |
+----------------------------------------------------------------------+
| Meldungen nach Disziplin:                                            |
|                                                                      |
| Luftgewehr Freihand:    45 Teilnehmer                                |
| Luftgewehr Auflage:     32 Teilnehmer                                |
| KK 100m Freihand:       12 Teilnehmer                                |
| ...                                                                  |
+----------------------------------------------------------------------+
| Meldungen nach Wettkampfklasse:                                      |
|                                                                      |
| Schüler m/w:            8 Teilnehmer                                 |
| Jugend m/w:             12 Teilnehmer                                |
| Junioren A/B m/w:       15 Teilnehmer                                |
| ...                                                                  |
+----------------------------------------------------------------------+
| LM-Teilnahme:                                                        |
|                                                                      |
| Ja:  38 Teilnehmer                                                   |
| Nein: 89 Teilnehmer                                                  |
+----------------------------------------------------------------------+
| Mannschaften: 22                                                     |
+----------------------------------------------------------------------+
|                      [Als PDF exportieren]                           |
+----------------------------------------------------------------------+
```

## 6. Mobile Ansicht - Meldungsformular

```
+----------------------------------+
|      KREISMEISTERSCHAFT 2025     |
|        Meldungsformular          |
+----------------------------------+
| Verein: [SV Musterverein]        |
+----------------------------------+
| Schütze:                         |
| [Dropdown: Max Mustermann]       |
+----------------------------------+
| Disziplin:                       |
| [Dropdown: Luftgewehr Freihand]  |
+----------------------------------+
| Wettkampfklasse:                 |
| [Junioren A m] (automatisch)     |
+----------------------------------+
| LM-Teilnahme:                    |
| ( ) Ja  (•) Nein                 |
+----------------------------------+
| Anmerkungen:                     |
| [                              ] |
+----------------------------------+
|      [Meldung hinzufügen]        |
+----------------------------------+
```

## 7. E-Mail-Benachrichtigung - Meldungsbestätigung

```
Betreff: Bestätigung Ihrer Meldung zur Kreismeisterschaft 2025

Sehr geehrte Sportfreunde des SV Musterverein,

hiermit bestätigen wir den Eingang Ihrer Meldungen zur Kreismeisterschaft 2025.

Gemeldete Schützen:
- Max Mustermann (Junioren A m): Luftgewehr Freihand
- Anna Musterfrau (Jugend w): Luftgewehr Freihand
- ...

Gemeldete Mannschaften:
- Luftgewehr Freihand (Junioren m/w): Mustermann, Müller, Schmidt
- ...

Der Startplan wird Ihnen rechtzeitig vor der Veranstaltung zugesandt.

Mit freundlichen Grüßen
Kreisschießsportleitung
KSV Einbeck
```