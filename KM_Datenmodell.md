# Datenmodell für Kreismeisterschaftsmeldungen

## Tabellen und Beziehungen

```
+----------------+       +----------------+       +----------------+
| Schütze        |       | Meldung        |       | Disziplin      |
+----------------+       +----------------+       +----------------+
| id             |<----->| schütze_id     |       | id             |
| vorname        |       | disziplin_id   |<----->| spo_nummer     |
| nachname       |       | wettkampfkl_id |<----->| name           |
| geburtsdatum   |       | lm_teilnahme   |       | kategorie      |
| geschlecht     |       | anmerkung      |       | schusszahl     |
| verein_id      |<-+    | saison         |       | schiesszeit    |
| mitgliedsnr    |  |    | meldedatum     |       | mindestalter   |
| sondergenehmig |  |    | status         |       | auflage        |
+----------------+  |    +----------------+       +----------------+
                    |                                     ^
                    |                                     |
+----------------+  |    +----------------+       +----------------+
| Verein         |  |    | Mannschaft     |       | Wettkampfklasse|
+----------------+  |    +----------------+       +----------------+
| id             |<-+----| verein_id      |       | id             |
| name           |       | disziplin_id   |<----->| name           |
| ansprechpartner|       | wettkampfkl_id |<----->| geschlecht     |
| email          |       | saison         |       | min_jahrgang   |
| telefon        |       | schützen_ids   |       | max_jahrgang   |
+----------------+       +----------------+       | saison         |
                                                  +----------------+
```

## Tabellendefinitionen

### Schütze
| Feld             | Typ      | Beschreibung                                |
|------------------|----------|--------------------------------------------|
| id               | Integer  | Primärschlüssel                            |
| vorname          | String   | Vorname des Schützen                       |
| nachname         | String   | Nachname des Schützen                      |
| geburtsdatum     | Date     | Geburtsdatum für Altersklassenberechnung   |
| geschlecht       | Enum     | m/w für geschlechtsspezifische Klassen     |
| verein_id        | Integer  | Fremdschlüssel zum Verein                  |
| mitgliedsnr      | String   | Mitgliedsnummer/Ausweisnummer              |
| sondergenehmigung| Boolean  | Für Schützen unter 12 Jahren               |

### Meldung
| Feld             | Typ      | Beschreibung                                |
|------------------|----------|--------------------------------------------|
| id               | Integer  | Primärschlüssel                            |
| schütze_id       | Integer  | Fremdschlüssel zum Schützen                |
| disziplin_id     | Integer  | Fremdschlüssel zur Disziplin               |
| wettkampfkl_id   | Integer  | Fremdschlüssel zur Wettkampfklasse         |
| lm_teilnahme     | Boolean  | Teilnahme an Landesmeisterschaft (ja/nein) |
| anmerkung        | Text     | Zusätzliche Informationen                  |
| saison           | String   | Sportjahr (z.B. "2025")                    |
| meldedatum       | DateTime | Zeitpunkt der Meldung                      |
| status           | Enum     | gemeldet, bestätigt, abgelehnt             |

### Disziplin
| Feld             | Typ      | Beschreibung                                |
|------------------|----------|--------------------------------------------|
| id               | Integer  | Primärschlüssel                            |
| spo_nummer       | String   | Nummer gemäß Sportordnung (z.B. "1.10")    |
| name             | String   | Bezeichnung der Disziplin                  |
| kategorie        | Enum     | LG, LP, KK, etc.                           |
| schusszahl       | Integer  | Anzahl der zu schießenden Schüsse          |
| schiesszeit      | Integer  | Zeit in Minuten                            |
| mindestalter     | Integer  | Mindestalter für Teilnahme                 |
| auflage          | Boolean  | Auflage ja/nein                            |

### Wettkampfklasse
| Feld             | Typ      | Beschreibung                                |
|------------------|----------|--------------------------------------------|
| id               | Integer  | Primärschlüssel                            |
| name             | String   | Bezeichnung der Klasse (z.B. "Schüler m")  |
| geschlecht       | Enum     | m/w oder null (für gemischte Klassen)      |
| min_jahrgang     | Integer  | Ältester zugelassener Jahrgang             |
| max_jahrgang     | Integer  | Jüngster zugelassener Jahrgang             |
| saison           | String   | Sportjahr (z.B. "2025")                    |

### Verein
| Feld             | Typ      | Beschreibung                                |
|------------------|----------|--------------------------------------------|
| id               | Integer  | Primärschlüssel                            |
| name             | String   | Name des Vereins                           |
| ansprechpartner  | String   | Name des Sportleiters                      |
| email            | String   | Kontakt-E-Mail                             |
| telefon          | String   | Kontakt-Telefonnummer                      |

### Mannschaft
| Feld             | Typ      | Beschreibung                                |
|------------------|----------|--------------------------------------------|
| id               | Integer  | Primärschlüssel                            |
| verein_id        | Integer  | Fremdschlüssel zum Verein                  |
| disziplin_id     | Integer  | Fremdschlüssel zur Disziplin               |
| wettkampfkl_id   | Integer  | Fremdschlüssel zur Wettkampfklasse         |
| saison           | String   | Sportjahr (z.B. "2025")                    |
| schützen_ids     | Array    | IDs der 3 Mannschaftsschützen              |

## Beispieldaten für Wettkampfklassen 2025

| Name           | Geschlecht | Min-Jahrgang | Max-Jahrgang | Saison |
|----------------|------------|--------------|--------------|--------|
| Schüler m      | m          | 2011         | 2013         | 2025   |
| Schüler w      | w          | 2011         | 2013         | 2025   |
| Jugend m       | m          | 2007         | 2010         | 2025   |
| Jugend w       | w          | 2007         | 2010         | 2025   |
| Junioren A m   | m          | 2005         | 2006         | 2025   |
| Junioren A w   | w          | 2005         | 2006         | 2025   |
| Junioren B m   | m          | 2003         | 2004         | 2025   |
| Junioren B w   | w          | 2003         | 2004         | 2025   |
| Herren I       | m          | 1984         | 2002         | 2025   |
| Damen I        | w          | 1984         | 2002         | 2025   |
| Herren II      | m          | 1974         | 1983         | 2025   |
| Damen II       | w          | 1974         | 1983         | 2025   |
| Herren III     | m          | 1964         | 1973         | 2025   |
| Damen III      | w          | 1964         | 1973         | 2025   |
| Herren IV      | m          | 1954         | 1963         | 2025   |
| Damen IV       | w          | 1954         | 1963         | 2025   |
| Senioren 0     | m          | 1949         | 1953         | 2025   |
| Seniorinnen 0  | w          | 1949         | 1953         | 2025   |
| Senioren I     | m          | 1944         | 1948         | 2025   |
| Seniorinnen I  | w          | 1944         | 1948         | 2025   |
| Senioren II    | m          | 1939         | 1943         | 2025   |
| Seniorinnen II | w          | 1939         | 1943         | 2025   |
| Senioren III   | m          | 1934         | 1938         | 2025   |
| Seniorinnen III| w          | 1934         | 1938         | 2025   |
| Senioren IV    | m          | 1929         | 1933         | 2025   |
| Seniorinnen IV | w          | 1929         | 1933         | 2025   |
| Senioren V     | m          | 1900         | 1928         | 2025   |
| Seniorinnen V  | w          | 1900         | 1928         | 2025   |