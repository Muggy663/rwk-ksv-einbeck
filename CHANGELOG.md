# 📋 Changelog – RWK Einbeck App

Alle Versionen und Änderungen in chronologischer Reihenfolge.

---

## Version 3.0.0
- **👥 Zentrale Mitgliederliste (RWK + KM)**: Es gibt jetzt EINE gemeinsame Mitgliederliste unter `/mitglieder` für beide Bereiche — ein Datenbestand, eine Ansicht. Die Liste zeigt alle Stammdaten inkl. Mitgliedsnummer, Altersklassen (Auflage/Freihand) fürs aktuelle Sportjahr sowie Kontaktdaten (E-Mail, Telefon, Ort); jeder Bereich nutzt daraus, was er braucht. Mit Anzahl-Anzeige, Suche, Sortierung und mobiltauglicher Darstellung (Tabelle am Desktop, Karten am Handy)
- **🏢 Vereinsfilter statt gemischter Liste**: Wer mehreren Vereinen zugeordnet ist, wählt oben gezielt einen Verein — keine vermischte Ansicht mehr. Bei nur einem Verein wird dieser automatisch verwendet
- **📥 Mitcom-Import bei den Mitgliedern**: Der Excel-Import ist von der Vereinsseite in die zentrale Mitgliederverwaltung umgezogen (`/mitglieder/import`) und importiert in den aktiven Verein
- **🔐 Neue abgesicherte Mitglieder-API**: Anlegen, Bearbeiten und Löschen laufen ausschließlich über eine serverseitig geschützte Schnittstelle (`/api/members`). Die Berechtigungen werden verbindlich auf dem Server geprüft — nicht mehr nur in der Oberfläche
- **👤 Klare Rollen für die Mitgliederverwaltung**: Admin und KM-Organisation sehen und verwalten alle Vereine; Sportleiter verwalten ihre zugeordneten Vereine (RWK + KM + Mitglieder); Mannschaftsführer tragen weiterhin nur RWK-Ergebnisse ein
- **🗑️ Sanftes Löschen mit Sicherheitsnetz**: Beim Entfernen eines Mitglieds wird es deaktiviert und aus allen aktiven Mannschaften (RWK und KM) genommen — bereits erfasste Ergebnisse und Meldungen bleiben erhalten, und der Vorgang wird protokolliert
- **🧭 Aufgeräumte Einstiege**: Die bisherigen getrennten Listen (Vereinsbereich „Schützen“, KM „Mitglieder“, KM-Orga „Alle Mitglieder“) führen jetzt alle zur zentralen Liste. Im Dashboard erscheint die Mitglieder-Kachel nur mit passender Berechtigung, mit Hinweis, dass die Liste für RWK und KM gemeinsam gilt
- **📇 Einheitliches Mitglieder-Datenmodell**: Vereinszuordnung über ein einziges Feld, Kontakt-/Stammdaten (Telefon, Mobil, Adresse) vereinheitlicht; der Mitcom-Import schreibt jetzt konsistent ins gemeinsame Modell
- **🏢 Vereinsverwaltung vereinheitlicht (Multi-Verein)**: Der aktive Verein wird jetzt zentral an einer Stelle verwaltet. Vorher liefen drei getrennte Systeme mit eigenem Gedächtnis nebeneinander — ein Vereinswechsel wirkt jetzt einheitlich über RWK, KM und die Mitgliederliste. Die Vereinsauswahl nach dem Login ist robuster geworden
- **📊 Saisonübergreifende Statistik wieder da**: Die zuvor deaktivierte Auswertung über mehrere Jahre funktioniert wieder — inkl. Zusammenführung mehrerer KK-Saisons und mehrerer Vereinseinträge desselben Schützen. In der Schützensuche wird der Verein angezeigt, um Namensgleiche zu unterscheiden
- **🎨 Statistik-Bereich modernisiert**: Übersicht, Dashboard, Vergleich und saisonübergreifende Statistik im neuen Look — mit Kennzahlen-Kacheln, klaren Filtern und an das App-Design angepassten Diagrammfarben
- **🧭 Modernere Navigation & Startkacheln**: Menüleiste mit deutlicherem aktivem Zustand; die Kacheln der Arbeitsbereich-Auswahl sind einheitlicher; der Schießnachweis ist als eigenständiges Zusatz-Feature abgesetzt
- **🎯 Schießnachweis ist offiziell (kein Beta mehr)**: Kennzeichnung entfernt. Beim Behörden-PDF lässt sich jetzt die Empfänger-Anschrift eintragen (passend für Fensterumschläge), Unterschriftsfelder für Schütze und Vereinsschießsportleiter bleiben erhalten
- **⏱️ Automatische Abmeldung vereinheitlicht**: Die angezeigte Rest-Zeit bis zur Abmeldung stimmt jetzt überall mit der tatsächlichen Abmeldung überein (vorher konnten zwei Anzeigen abweichen)
- **🔒 Sicherheitslücken geschlossen (Mitglieder-Daten)**: Ungeschützte interne Schnittstellen entfernt bzw. abgesichert, über die Mitgliederdaten ohne Anmeldung abrufbar oder änderbar gewesen wären. Das Laden der Schützenliste erfordert jetzt eine Anmeldung und liefert nur die Vereine, für die man berechtigt ist; das Löschen prüft jetzt zuverlässig die Berechtigung
- **📥 Mitglieder-Import repariert**: Der Link „Mitglieder importieren" im KM-Orga-Bereich führte ins Leere (404) — er zeigt jetzt korrekt auf den umgezogenen Import
- **✉️ E-Mail-Versand genauer**: Ungültige E-Mail-Adressen werden jetzt vor dem Versand aussortiert und nicht mehr mitgezählt — die Erfolgsmeldung („an X Empfänger gesendet") stimmt jetzt
- **🧩 Vereinszuordnung vereinheitlicht (technisch)**: Die Ermittlung, welche Vereine einem Nutzer gehören, läuft jetzt überall über dieselbe Logik — verhindert unterschiedliche Ergebnisse in verschiedenen Bereichen
- **🧹 Datenmodell weiter bereinigt**: Alle verbliebenen Anlege-/Import-Wege schreiben Mitglieder jetzt einheitlich mit einem einzigen Vereinsfeld (kein doppeltes Alt-Feld mehr)
- **🐛 Bugfix VM-Qualifikation**: In der VM-Übersicht wurde das Qualifikationslimit immer nach „Herren" bewertet — Damen wird jetzt korrekt das Damen-Limit zugeordnet
- **🧹 Weiterer Code-Frühjahrsputz**: Mehrere ungenutzte Alt-Komponenten entfernt (doppelte Onboarding-/Theme-/Wartungs-Bausteine, ungenutztes Suchfeld). Reduziert Ballast, keine sichtbaren Änderungen
- **📉 Sentry im Live-Betrieb sparsamer**: Detail-Aufzeichnung (Tracing) in Produktion auf 10% reduziert (spart Ressourcen, in der Entwicklung weiterhin vollständig)
- **🧹 Social Training & Premium entfernt**: Die nicht mehr genutzten Bereiche Social Training (Trainingsgruppen, Duelle, Live-Wettkämpfe, Community-Profile) und die Premium-/Bezahl-Reste wurden vollständig aus der App entfernt. Schlankere, fokussierte Anwendung
- **🔒 Weitere Sicherheitslücken geschlossen**: Mehrere interne Schnittstellen, über die ohne Anmeldung Daten hätten massenhaft gelöscht oder Berechtigungen manipuliert werden können, wurden entfernt bzw. mit Anmelde- und Rechteprüfung abgesichert. Die Registrierung legt Berechtigungen jetzt nur noch für das eigene Konto an
- **🔒 Kreismeisterschafts-Schnittstellen abgesichert**: Alle schreibenden KM-Funktionen (Meldungen anlegen/ändern/löschen/verschieben, Ergebnisse speichern und importieren, Mannschaften generieren/bearbeiten/löschen, Disziplinen, Jahre/Saisons, Altersklassen, Startlisten, David21-Import, Mannschaftsregeln) prüfen jetzt serverseitig Anmeldung und KM-Berechtigung — vorher waren einige ohne echte Prüfung erreichbar. Zusätzlich wurde ein unsicherer „Pseudo-Anmelde"-Weg beim KM-Melden durch echte Token-Prüfung ersetzt
- **🐛 Bugfix Mannschaften generieren**: Beim automatischen Erstellen von KM-Mannschaften wurden die Mannschaftsregeln am falschen Ort gesucht und daher nicht angewandt — jetzt werden die konfigurierten Regeln korrekt geladen und berücksichtigt
- **🎯 Altersklassen jetzt einheitlich (eine Quelle für alles)**: Die Wettkampfklasse eines Schützen wird jetzt überall aus derselben, im KM-Bereich gepflegten Altersklassen-Tabelle abgeleitet — beim Melden, in der KM-Orga-Übersicht, bei der Mannschaftsbildung und in den Startlisten inkl. PDF. Zuvor rechnete jede Seite eigenständig (und teils widersprüchlich). Grundlage ist immer das Jahr der jeweiligen Saison, nicht mehr das aktuelle Kalenderjahr
- **🎯 Klasse wird bei der Meldung festgehalten**: Beim Melden wird die passende Altersklasse ermittelt und mit der Meldung gespeichert. Folgeseiten zeigen genau diese Klasse an, statt sie neu zu berechnen
- **🎯 Auflage/Freihand & Kreis-Sonderregel berücksichtigt**: Freihand nutzt die Herren-/Damen-Klassen, Auflage die Senioren-Klassen. Die kreisinterne Ausnahme (bei Auflage 1.41/1.11 dürfen 21- bis 40-Jährige als Herren/Damen I starten) ist abgebildet — mit korrektem Hinweis, dass dies für die Kreismeisterschaft, aber nicht für die Landesmeisterschaft gilt
- **🎯 Altersgenehmigung für junge Schützen**: Neue Option „Altersgenehmigung vorhanden" in der Schützenverwaltung. Damit dürfen 10-/11-Jährige mit Luftgewehr (offiziell ab 12) starten und werden in der Schülerklasse 12–14 gewertet
- **🐛 PDF-Altersklassen korrigiert**: In den Startlisten-PDFs wurde die Altersklasse teils nach dem aktuellen Kalenderjahr statt nach dem Saisonjahr berechnet — das ist behoben
- **💬 Verständliche Hinweise bei KI-Problemen**: Wenn die automatische Startlisten-Erstellung oder die Foto-/Handzettel-Erkennung (Google Gemini) mal nicht klappt, erscheint jetzt eine klare Meldung mit Handlungsempfehlung — z. B. „KI-Dienst gerade überlastet, bitte in ein bis zwei Minuten erneut versuchen" oder „Tageslimit erreicht, morgen erneut versuchen". Vorher blieb der Fehler teils unsichtbar oder verwies irreführend auf den API-Schlüssel
- **🔑 Support-Code-Generierung wieder da**: Vereinsvertreter können unter „Support-Zugang generieren" wieder einen zeitlich begrenzten Code erzeugen und dem Administrator schicken
- **🗑️ Änderungsprotokoll aufräumbar**: Administratoren können alte Protokoll-Einträge bis zu einem Stichtag löschen (z. B. vor Saisonbeginn)
- **🧹 Startgelder & Startlisten nach Saison**: Die Startgelder-Übersicht zählt nur noch Mannschaften der gewählten Saison (statt aller eines Jahres); die Startlisten-Übersicht lässt sich für alle vorhandenen Jahre auswählen und filtert korrekt nach Saison
- **🔤 Anzeigefehler behoben**: Falsch kodierte Umlaute/Symbole im Admin-Bereich (z. B. „MannschaftsfÃ¼hrer") werden wieder korrekt dargestellt
- **⏱️ Automatische Abmeldung vereinheitlicht (technisch)**: Ein überflüssiger, ins Leere laufender zweiter Abmelde-Timer wurde entfernt; es bleibt der eine funktionierende mit sichtbarer Restzeit
- **🐛 Anmeldefehler in KM-Ansichten behoben (401)**: Einige KM-Seiten (u. a. die Übersicht) luden Daten teils ohne gültiges Anmelde-Token und liefen dann auf „nicht angemeldet". Die Anmeldung wird jetzt zuverlässig mitgeschickt — auch direkt nach dem Laden einer Seite, bevor die Sitzung vollständig hergestellt ist
- **🐛 Flackern in der KM-Übersicht behoben**: Beim Öffnen erschienen kurz alle Meldungen des Jahres und erst nach der Saison-Auswahl die passenden. Jetzt werden Meldungen erst nach Auswahl der Saison geladen — kein Zwischenstand mehr
- **🔒 Wartungsbereich geschützt**: Die System-Initialisierungsseite (KM) ist jetzt nur noch für Administratoren und die KM-Organisation zugänglich; die Altersklassen-Migration ist ausschließlich für Administratoren sichtbar
- **🔗 GitHub-Link im Footer**: Der Quellcode des Projekts ist jetzt direkt aus der Fußzeile erreichbar
- **🐛 KM-Meldung bearbeiten repariert**: Das Ändern einer bestehenden Meldung (LM-Teilnahme, Anmerkung, VM-Ergebnis) lief bisher ins Leere, weil serverseitig keine Bearbeiten-Funktion vorhanden war — jetzt werden Änderungen korrekt gespeichert (mit Anmelde- und Rechteprüfung)
- **🔒 Weitere KM-Schnittstellen abgesichert**: Foto-/Ergebnis-Erkennung, PDF-/Listen-Export, David21-Export und das Laden von Meldungen und Ergebnissen erfordern jetzt eine Anmeldung mit KM-Berechtigung. Ein ungenutztes, ungeschütztes Reparaturskript für Meldungen wurde entfernt
- **⏱️ Automatische Abmeldung entschlackt**: Es gab zwei parallele Timer — einer davon zeigte nur eine Warnung und rief eine gar nicht vorhandene Funktion auf. Dieser überflüssige Mechanismus wurde entfernt; es bleibt der eine, funktionierende Abmelde-Timer mit sichtbarer Restzeit
- **🧹 Projekt weiter entschlackt**: Weitere ungenutzte Komponenten und veraltete Arbeitsnotizen entfernt; doppelte Hilfsfunktionen zur Vereinszuordnung vereinheitlicht; überflüssige Datenbankabfragen reduziert
- **🏗️ Große TypeScript-Grundsanierung (abgeschlossen)**: Die gesamte Codebasis wurde systematisch typsicher gemacht — TypeScript-Meldungen von ~3860 auf **0** reduziert. Ziel: langfristige Wartbarkeit, weniger versteckte Laufzeit-Bugs, schnelleres und sichereres Weiterentwickeln
- **✅ Komplett sauber (0 TypeScript-Fehler) in allen Bereichen**: Schießnachweis, Vereinsbereich, Kern (Typen/Utils), Services, UI-Komponenten, Kreismeisterschaft (KM), KM-Organisation, Admin, öffentliche RWK-Tabellen, API-Routen und alle übrigen App-Seiten
- **📦 Keine funktionalen Änderungen an bestehenden Features**: Design und Bedienung bleiben unverändert — es wurden Typen ergänzt, toter Code entfernt und mehrere echte Bugs behoben
- **🐛 Bugfix Ergebnis-Speicherung (API)**: In einer Server-Route zum Speichern von Ergebnissen wurde ein Zeitstempel falsch erzeugt (`FieldValue` war zur Laufzeit nicht verfügbar) — hätte beim Speichern einen Fehler ausgelöst; korrigiert
- **🐛 Bugfix Rollenvergabe (API)**: Ein Prüf-Aufruf (`exists`) war als Funktion statt als Eigenschaft verwendet — hätte die Rollenvergabe abbrechen können; korrigiert
- **🐛 Bugfix Safari-PDF**: Die Abbruch-Rückfrage beim PDF-Export unter Safari war fehlerhaft typisiert — korrigiert
- **🐛 Bugfix KM-Ergebnis-Import**: Der Fortschrittsdialog beim Foto-/PDF-Batch-Import verlor bei jedem Schritt interne Zustandsinfos (z.B. den Pausengrund bei API-Limit) — jetzt bleibt der Zustand korrekt erhalten
- **🐛 Bugfix Zeitungsbericht (Admin)**: Zugriff auf eine nicht vorhandene Variable in einem Fallback-Pfad korrigiert
- **🐛 Bugfix Handzettel-Generator**: Druck-/Style-Zugriffe und die Schützen-Auflösung robuster gemacht
- **🧹 Toter Code entfernt**: mehrere tausend Zeilen ungenutzte Legacy-Funktionen (u.a. zwei alte Ergebnis-Seiten mit zusammen ~3300 Zeilen), veraltete Alternativ-Versionen und verwaiste Komponenten — jeweils vorher geprüft, dass sie nirgends verwendet werden
- **🔧 Zentrale Typen vereinheitlicht**: Nutzer-Berechtigungen (Rollen je Verein/Kreis/Plattform) und Schützen-/Team-Datenfelder (u.a. KM-Startrechte, KM-Verein) sauber abgebildet — Grundlage für konsistentere Daten
- **📝 Nachvollziehbarkeit**: Jede Reparatur wurde in kleinen, thematischen Schritten festgehalten
- **📋 Vermerkte Empfehlungen fürs nächste Update** (kein Fehler, aber Aufräumbedarf): Sentry-Tracing auf die neue API migrieren; `send-email`-Empfängerzählung prüfen
- **✅ Umgesetzt**: Die zuvor vorgemerkte Zusammenführung der Mitgliederlisten (Vereinsbereich RWK + KM) ist in dieser Version realisiert — siehe „Zentrale Mitgliederliste (RWK + KM)“ oben

## Version 2.8.0
- **🧹 Große Code-Bereinigung**: Toten und veralteten Code entfernt (~3850 Zeilen) — alte Suffix-Duplikate (`page-fixed`, `page_new`, `page-modified`, `page-clean`, `page-with-*`), doppelte PDF-/Zertifikat-Basisdateien, Pages-Router-Rest `_app.tsx`, ungenutzte UI-Varianten (enhanced-/improved-card, native-/android-button) und toter Context
- **🔧 Logger-Imports bereinigt**: In 479 Dateien pauschal eingefügte, ungenutzte `secure-logger`-Importe entfernt bzw. auf tatsächlich genutzte Funktionen reduziert — rein auf Import-Ebene, keine Funktionslogik verändert
- **🐛 Bugfix Vereins-Migration**: Nicht existierende `secureLogger.logError`-Aufrufe korrigiert (hätten zur Laufzeit einen TypeError ausgelöst und die Migration abgebrochen)
- **✅ Qualität**: Neues `npm run typecheck`-Skript; TypeScript-Meldungen um über 1200 reduziert (~3860 → ~2645) ohne funktionale Änderungen
- **📦 Keine funktionalen Änderungen**: Diese Version ist reine Wartung/Aufräumung — alle Features verhalten sich unverändert

## Version 2.7.2
- **🔄 Update-Hinweis verbessert**: Bei neuer Version wird jetzt die richtige Tastenkombination angezeigt (Strg+Shift+R unter Windows/Linux, Cmd+Shift+R am Mac) — ein normales F5 reicht nicht. Der „Aktualisieren“-Button leert zusätzlich Cache und Service Worker für ein echtes Neuladen
- **🐛 PDF-Export Absturz behoben**: Der Behörden-Nachweis brach bei Einträgen mit fehlenden Feldern (z.B. Disziplin/Standort) still ab — jetzt robust gegen unvollständige Datensätze
- **🎨 PDF-Design modernisiert**: Farbiges Kopfband, Info-Karten für Persönliche Daten und Schießtätigkeit, KI-Begleittext in eigener Box
- **📊 PDF-Tabelle über AutoTable**: Saubere Kopfzeile mit Zebra-Streifen statt handgezeichneter Linien — die verrutschte Trennlinie in der ersten Zeile ist behoben
- **📄 Seitenfußzeile**: Jede PDF-Seite hat jetzt eine Fußzeile mit Seitenzahl ("Seite x von y")
- **📥 CSV-Export Excel-kompatibel**: UTF-8-BOM und CRLF-Zeilenenden ergänzt — Umlaute (ä, ö, ü, ß) werden in Excel korrekt dargestellt
- **🔄 CSV-Import repariert**: Import erkennt jetzt automatisch CSV und JSON — die eigene exportierte CSV kann wieder eingelesen werden

## Version 2.7.1
- **📱 Android App 1.0.0**: Erste offizielle Vollversion im Google Play Store
- **🏆 KM Mannschaftsregeln**: Komplett überarbeitete Generierung nach NSSV-Disziplinenplan und Kreisausschreibung
- **🔀 Auflage Mannschaften**: Senioren 0, I-II, III-VI jeweils m/w gemischt; Kreisintern Junioren I/II m/w + Schützen I/Damen I zusammen
- **🎯 Freihand Mannschaften**: Schüler/Jugend m/w gemischt, Junioren I+II zusammen (Geschlecht getrennt), Herren/Damen getrennt
- **⚡ KI-Generierung pro Disziplin**: Optional nur für eine gewählte Disziplin generieren statt alle
- **🏷️ Beta-Hinweis**: KI-Generierung als Beta gekennzeichnet
- **📋 Disziplinen sortiert**: spoNummer-Sortierung in KM Meldungen und Mannschaften
- **🐛 Schützen-Deduplizierung entfernt**: Doppelt existierende Schützen (z.B. RWK + KM Verein) werden nicht mehr fälschlich ausgeblendet
- **🐛 KM Meldungen Ladefix**: `sortedSaisons` wurde vor Deklaration verwendet — behoben
- **🐛 KM Collection-Name**: Generate-Route findet jetzt korrekt `km_meldungen_2027_kk` statt `km_meldungen`
- **🗑️ Sofortiges Löschen**: Meldungen und Mannschaften verschwinden sofort aus der Liste (optimistic update)
- **📱 Mannschaften Layout**: Buttons bleiben bei kleinen Fenstern innerhalb der Card
- **💡 Manuell erstellen**: Button ausgegraut wenn keine Disziplin gewählt + Hinweistext
- **🔓 Login bereinigt**: Social Training entfernt aus Login-Texten
- **📸 Schießnachweis Zehntel-Fix**: Ganze Ringe und Zehntel getrennt angezeigt (immer .0 bei ganzen Zahlen)
- **🔄 Wizard Reset-Button**: Ergebnis wird beim Zurückgehen automatisch zurückgesetzt
- **⚠️ Scheiben-Scanner Hinweis**: Zeigt fehlende Schüsse an und bietet direkt weitere Aufnahme an
- **📐 DigitalAnlage Buttons**: Fotografieren/Galerie-Buttons untereinander gestapelt
- **🔧 Serien-Datentyp**: Scheiben-Scanner erzeugt korrekte Schuss-Objekte statt roher Arrays
- **🔢 Schussanzahl Default**: Erste verfügbare Schussanzahl wird automatisch voreingestellt

## Version 2.7.0 
- **📥 Mannschafts-Umbau**: Neuer Dialog zum Auflösen und Neuordnen von Mannschaften mit selektiver Ergebnis-Übertragung
- **🔧 Team-Verwaltung in Substitutions-Seite**: Inline-Umbenennen, Löschen und Umbauen direkt in der Übersicht
- **🔍 Ersatzschütze Namenssuche**: Suchfeld im Dialog zum schnellen Finden des Ersatzschützens
- **🐛 RWK Einzelrangliste**: Substitutionen werden jetzt liga-spezifisch gefiltert — Schütze in anderer Liga wird nicht mehr fälschlicherweise ausgeblendet
- **🐛 RWK Einzelrangliste**: Alle Schützen werden jetzt direkt aus Scores geladen — kein Aufklappen der Mannschaft mehr nötig
- **📊 KKG Gesamtliste**: Filtert korrekt nach Liga-IDs statt leagueType — keine KKP-Vermischung mehr
- **🔢 KM dynamisches Sportjahr**: Alle KM-Seiten berechnen das Sportjahr automatisch (ab 1. Juli → Folgejahr)
- **📋 KM Disziplinen**: Jahresunabhängig — werden nach Typ der Saison gefiltert, kein manuelles Initialisieren mehr nötig
- **🔒 KM Meldungen**: Nur noch aktive Saisons im Dropdown, archivierte ausgeblendet
- **🎯 KM Auflage-Regel**: Sonderregelung Kreisverband — alle ab 15 dürfen an KM Auflage teilnehmen (nicht LM-berechtigt)
- **🗑️ KM Meldung löschen**: Neue API-Route `/api/km/meldungen/[id]` für das Löschen einzelner Meldungen
- **📋 Substitutions Liga-Filter**: Zeigt nur Ersatzschützen der gewählten Saison/Liga an
- **🧹 Social Training entfernt**: Aus Dashboard-Auswahl, Navigationen, Handbuch, Schießnachweis
- **📄 Updates-Seite entfernt**: Inhalte sind im CHANGELOG.md
- **🔇 Admin bereinigt**: 11 veraltete Seiten gelöscht, Vereinssoftware-Reste entfernt
- **🐛 Login-Fix**: INDIVIDUAL userType blockiert nicht mehr den Zugang wenn clubRoles vorhanden
- **🔄 Versions-Check**: Banner bei veraltetem Browser-Tab — fordert zum Neuladen auf
- **📸 Scheiben-Scanner (Beta)**: KI-basierte Erkennung von Einschusslöchern auf Papierscheiben im Schießnachweis
- **🤖 Zentrale AI-Config**: Gemini-Modell wird zentral in einer Datei konfiguriert — einfache Updates
- **📧 Ergebnis-Mail CC**: Eintragender bekommt jetzt eine Kopie der Ergebnis-Benachrichtigung
- **📱 Schießnachweis Wizard-UI**: Komplett neue mobile-optimierte Eingabe in 4 Schritten statt endlosem Scroll
- **🎯 4 Eingabemethoden**: Schnelleingabe, Serien, Scheibe fotografieren, Ausdruck digitale Anlage
- **🏢 Schießstände aktualisiert**: Alle Vereine des Kreisverbands als Standorte hinterlegt
- **📝 Optionale Felder**: Wetter, Waffe, Munition als aufklappbare Zusatzdetails
- **📥 Mitcom-Import (Verein & Admin)**: Excel-Import für Mitgliedsdaten mit automatischem Matching und Vereinsnummer-Schutz
- **📊 Einträge-Übersicht**: Filter nach Monat, Disziplin, Typ + Sortierung nach Datum/Ergebnis
- **🔢 Zehntel-Anzeige korrigiert**: Ganze Ringe und Zehntel werden überall getrennt und korrekt angezeigt (z.B. 47 ganze Ringe + 49.0 mit Zehntel)
- **🔄 Reset-Button im Wizard**: Ergebnis wird beim Zurückgehen automatisch zurückgesetzt — kein altes Ergebnis mehr beim erneuten Eingeben
- **⚠️ Fehlende Schüsse Hinweis**: Scheiben-Scanner zeigt aktiv an wenn noch Scheiben fehlen und bietet direkt den Upload an
- **📐 Buttons gestapelt**: Fotografieren/Galerie-Buttons untereinander für bessere mobile Bedienbarkeit
- **🔧 Serien-Datentyp Fix**: Scheiben-Scanner erzeugt jetzt korrekte Schuss-Objekte statt roher Zahlenarrays

## Version 2.6.3 
- **🐛 Bugfix Login**: Benutzer mit `userType: INDIVIDUAL` und gleichzeitig gesetzten `clubRoles` werden korrekt zum RWK/KM-Dashboard weitergeleitet
- **🐛 Bugfix Dashboard**: `clubRoles` haben Vorrang vor `userType: INDIVIDUAL`
- **🗑️ Social Training**: Aus Dashboard-Auswahl entfernt

## Version 2.6.2 
- **🔒 API-Sicherheit**: `/api/admin/fix-mitgliedsnummer` jetzt mit Bearer-Token Auth-Check — nur Admin kann die Route aufrufen
- **🐛 excel-import-service**: `unknown` wird nicht mehr auf `male` gesetzt — Geschlecht bleibt `unknown` wenn nicht erkennbar
- **📊 RWK-Tabellen Schnitt**: Schnitt-Spalte basiert jetzt ebenfalls auf dem liga-weiten vollständigen Durchgang — konsistent mit der Sortierung
- **💡 Tooltip Vorschau**: Klammer-Wert `(2513)` hat jetzt einen erklärenden Tooltip beim Hover
- **✅ Geburtsjahr Pflichtfeld**: Beim Anlegen eines neuen Schützen im Vereinsbereich ist ein gültiges Geburtsjahr jetzt Pflicht
- **🎯 Geschlecht vereinheitlicht**: `unknown`-Gender wird überall als `?` angezeigt (statt `-` in km/mitglieder)
- **⚠️ Vereinsnummer-Warnung**: Import warnt wenn kein `clubNumber`-Feld für den Verein gepflegt ist
- **🧹 Aufräumen Admin**: 9 veraltete/einmalige Admin-Seiten entfernt (migrate, migration, migrations, club-migration, dev-setup, import-contacts, km-users, kommunikation, auf-abstieg, captains)
- **🗑️ Vereinssoftware-Reste entfernt**: license-management Seite, Vereinssoftware-Lizenz Checkbox im Benutzerformular entfernt
- **📋 Admin-Navigation bereinigt**: Sidebar nur noch mit aktiv genutzten Seiten
- **🔇 Social Training deaktiviert**: Weiterleitung zur Startseite, aus allen Navigationen entfernt
- **📄 Updates-Seite entfernt**: Inhalte sind im CHANGELOG.md — kein Duplikat mehr
- **🏠 Handbuch bereinigt**: Social Training Tab und Inhalte entfernt
- **🐛 RWK Einzelrangliste**: Schützen die in einer anderen Liga/Disziplin als Ersatzschütze eingetragen sind werden nicht mehr fälschlicherweise aus anderen Ligen gefiltert (Hartmut Kahl Bug)

## Version 2.6.1
- **🐛 Bugfix RWK-Tabellen**: Tabellensortierung basiert jetzt auf dem liga-weit vollständigen Durchgang — ein Team das einen Durchgang mehr eingetragen hat wird nicht mehr vorzeitig nach oben sortiert
- **🔢 Sortierlogik**: Neu berechneter Sortierscore verwendet `leagueCompleteRound` (Minimum aller Teams) statt des individuellen Team-Durchgangs
- **👁️ Vorschau bleibt**: Der Gesamtwert in Klammern (z.B. `(2513)`) wird weiterhin als Vorschau angezeigt — nur die Sortierung ist angepasst

## Version 2.6.0
- **📥 Mitcom-Import**: Vereine können ihre Mitgliederdaten direkt aus der Mitcom-Excel importieren
- **🎯 Automatisches Matching**: Schützen werden per Verbandsnummer oder Name erkannt und aktualisiert
- **👤 Geschlecht & Geburtsjahr**: Werden aus Mitcom übernommen — kein manuelles Nachpflegen mehr
- **🔢 Mitgliedsnummer**: Wird korrekt im Format `08-XXX-XXXX` gespeichert (führende 0 wird automatisch entfernt)
- **🛡️ Vereinsnummer-Prüfung**: Mitglieder anderer Vereine werden beim Import automatisch erkannt und übersprungen — kein versehentliches Überschreiben von Schützen anderer Vereine (z.B. Doppelmitglieder)
- **🏢 Vereinsbereich**: Import unter "Meine Schützen → Mitcom-Import" für jeden Verein selbst
- **🛡️ Admin**: Import mit Vereinsauswahl unter Admin → Stammdaten → Mitcom-Import
- **🔗 KM-Dashboard**: Mitcom-Import Button direkt unter "Mitglieder verwalten" erreichbar
- **🐛 Bugfix Geschlecht**: In `/verein/schuetzen` wurde `unknown` fälschlicherweise als `W` angezeigt — jetzt korrekt `?`
- **🔒 Bugfix Gender-Überschreibung**: Geschlecht wird beim Ergebnis-Eintragen nicht mehr überschrieben (aus v2.5.3 übernommen)
- **⚙️ Nur Excel**: Import ausschließlich per .xls/.xlsx — kein PDF, kein CSV
- **📢 Startseite**: Neuigkeiten-Banner für Version 2.6.0

## Version 2.5.3
- **🐛 Bugfix**: Geschlecht (gender) von Schützen wird beim Ergebnis-Eintragen nicht mehr überschrieben
- **🔒 Datenschutz**: Schützen-Dokumente werden beim Speichern von Ergebnissen nur noch angelegt wenn sie noch nicht existieren – bestehende Daten bleiben unberührt
- **🔧 Refactoring**: `forEach` → `for...of` in `shared-results-complete.tsx` für korrekte async/await-Unterstützung
- **📁 Betroffene Dateien**: `shared-results-complete.tsx`, `verein/ergebnisse/page.tsx`, `rwk-tabellen/page.tsx`

## Version 2.5.2
- **🔒 Sicherheit**: Alle ungeschützten API-Routen mit Auth-Checks versehen (bulk-delete, license-management, substitutions, shooters, set-download-count, send-verification-email, excel-import, assign-roles)
- **🗑️ API**: `/api/repair-substitution` deaktiviert (war einmaliger DB-Fix mit hardcodierten IDs)
- **🛡️ XSS-Fix**: Benutzereingaben in Support-E-Mails werden jetzt sanitisiert
- **⚙️ Middleware**: `securityMiddleware` wird jetzt tatsächlich aufgerufen – Security Headers aktiv
- **🔧 TypeScript**: Alle 120 TS18046-Fehler behoben – `catch (error)` Blöcke überall mit `getErrorMessage()` gesichert
- **🔧 TypeScript**: Ungetypte `reduce({})` Aufrufe in Startlisten, PDF-Export und KM-Seiten mit expliziten Typen versehen
- **🔧 TypeScript**: React-Children-Traversal in `smart-table.tsx` und `ResponsiveTable.tsx` korrekt getyped
- **🎓 Ausbildung**: Grundgerüst für Ausbildungsmodul angelegt (`/ausbildung`) – noch nicht öffentlich verlinkt

## Version 2.5.1.2
- **📧 E-Mail-Verifizierung (Login)**: "Bestätigungs-E-Mail erneut senden"-Button auf der Login-Seite – erscheint automatisch wenn ein Konto noch nicht verifiziert ist
- **🛠️ E-Mail-Verifizierung (Admin)**: Neuer Button direkt im Support-Ticket-Dialog – Verifizierungslink per Firebase Admin SDK generieren und per E-Mail versenden ohne Umweg über die Benutzerverwaltung
- **⚙️ API**: Neue Route `/api/admin/resend-verification` für serverseitiges Generieren von Verifizierungslinks

## Version 2.5.1.1
- **🐛 Duplikat-Ergebnisse**: Doppelte Einträge beim manuellen Hinzufügen werden jetzt blockiert (Prüfung gegen DB, Zwischenliste und gerade gespeicherte Ergebnisse)
- **📧 E-Mail Signatur**: Doppelte Signatur in Benachrichtigungs-E-Mails behoben
- **🔍 Firestore Index**: `orderBy` aus dynamischen Collection-Queries entfernt, clientseitige Sortierung stattdessen (kein manueller Index-Aufwand pro Saison mehr)

## Version 2.5.1
- **🔒 Mannschaften**: Kontaktdaten Mannschaftsführer auch bei laufender Saison bearbeitbar
- **📝 Selektive Sperre**: Alle anderen Felder (Name, Disziplin, Schützen) bleiben bei laufender Saison gesperrt
- **ℹ️ Hinweis im Dialog**: Klarer Hinweis wenn nur Kontaktdaten geändert werden können

## Version 2.5.0
- **🔒 reCAPTCHA**: Umstellung auf v2 Invisible - keine Bildaufgaben mehr beim Login
- **⚡ Login**: Dynamische Sicherheitshinweise mit rotierenden wahrheitsgemäßen Texten
- **📊 Login-Monitoring**: Admin-Widget mit Erfolgs-/Fehlversuche-Statistiken und Fehlergründen
- **🚨 Verdächtige Accounts**: Automatische Erkennung bei ≥3 Fehlversuchen
- **📋 Ereignislog**: Letzte Login-Versuche mit E-Mail (maskiert), Grund und Uhrzeit
- **🏆 RWK-Tabellen**: KKP/KKG Scores werden jetzt korrekt aus allen Collections geladen (Mannschafts-Gesamt 0 Bug behoben)
- **📄 Handzettel**: Abgabetermin dynamisch aus Saison-Name (KK = 15. August, LG = 1. März)
- **📊 Gesamtergebnisliste**: Abgabetermin ebenfalls dynamisch eingefügt
- **👤 Schützen-Namen**: In PDFs jetzt korrekt Vor- + Nachname statt nur Nachname
- **🏢 Handzettel**: Vereinsname des Gastgebers unter 1. Durchgang
- **🔧 TypeScript**: Fehler von ~700 auf 24 reduziert (Code-Qualität)
- **🔒 Firebase Admin**: undefined-Bug in getFirestore() behoben
- **⚡ Services**: Fehlende Imports und Duplicate-Identifier-Fehler behoben

## Version 2.4.8
- **📄 Handzettel**: Abgabetermin dynamisch aus Saison-Name (KK = 15. August, LG = 1. März)
- **📊 Gesamtergebnisliste**: Abgabetermin ebenfalls dynamisch eingefügt
- **👤 Schützen-Namen**: In PDFs jetzt korrekt Vor- + Nachname statt nur Nachname
- **🏢 Handzettel**: Vereinsname des Gastgebers unter 1. Durchgang
- **🔧 TypeScript**: Fehler von ~700 auf 24 reduziert (Code-Qualität)
- **🔒 Firebase Admin**: undefined-Bug in getFirestore() behoben
- **⚡ Services**: Fehlende Imports und Duplicate-Identifier-Fehler behoben

## Version 2.4.7
- *In Entwicklung*

## Version 2.4.6
- *In Entwicklung*

## Version 2.4.5
- **🏢 Admin Teams**: Automatische Namensgenerierung aus Vereinsname + Mannschaftsstärke (römische Zahl)
- **🔧 Admin Teams**: Leerzeichen im Vereinsnamen werden beim Generieren normalisiert
- **➕ Admin Teams**: Mannschaftsstärke "Einzel" als neue Option hinzugefügt
- **⚡ Admin Teams**: Schützen-Liste lädt nicht mehr neu beim Tippen in anderen Feldern
- **📊 Admin Teams**: Altersübersicht zwischen Filter und Tabelle (0–20 / 21–40 / Ab 41 / Unbekannt)
- **👥 Admin Teams**: Anzeige von eindeutigen Schützen UND Gesamtmeldungen (Schützen in mehreren Disziplinen)
- **🏅 Urkunden**: Layout verfeinert und Fehler behoben
- **🎨 Glassmorphism**: CSS-Optimierungen und Micro-Animationen verfeinert

## Version 2.4.4 (21. März 2026)
- **⚡ Startseite**: Skeleton Loading für alle Karten (Updates, Termine, News)
- **📊 Startseite**: Gefühlte Ladezeit deutlich verbessert
- **🔧 Mannschaften**: Speichern-Button Mobile-Fix (requestSubmit statt form-Attribut)
- **🔧 Admin Teams**: 3-Query-Methode für Schützen-Laden
- **➕ Admin Teams**: Neue Mannschaft anlegen möglich
- **🔧 Admin Teams**: getShooterClubId Funktion ergänzt

## Version 2.4.3 (15. März 2026)
- **👥 Mannschaften**: Schützen-Suche nach Vor- und Nachname
- **🔍 Mannschaften**: Anzahl gefundener Schützen im Dialog angezeigt
- **🔧 Mannschaften**: Schützen-Ladelogik auf 3-Query-Methode umgestellt (clubId, rwkClubId, kmClubId)
- **🗓️ Termine**: Bearbeiten-Funktion repariert (Next.js 16 params-Fix)
- **🧹 Termine**: Auto-Cleanup abgelaufener Termine nach 30 Tagen
- **🏠 Startseite**: Hover-Effekt auf Termine-Karte entfernt
- **📱 Portal**: Umbenennung von App zu Portal im Manifest
- **🔒 Sicherheit**: Vercel AI-Training opt-out aktiviert

## Version 2.4.2 (5. März 2026)
- **🔐 Registrierung**: Optionales Name-Feld bei der Registrierung hinzugefügt
- **🏆 Urkunden**: Saison-Auswahl zeigt jetzt alle Saisons (nicht nur laufende)
- **👥 Dashboard**: KM-Karte für KV_KM_ORGA Benutzer wieder sichtbar
- **🐛 Tabellen-Flackern**: Hover-Effekt in User-Management Tabelle behoben
- **📋 Mannschaften**: Status-Anzeige und Legende bei Saison-Auswahl
- **🔒 Mannschaften**: Bearbeitung bei laufender Saison gesperrt (nur RWK-Leiter)

## Version 2.4.1 (17. Februar 2026)
- **✨ UX-Verbesserungen**: Neue UI-Komponenten für bessere Benutzerfreundlichkeit
- **🔘 LoadingButton**: Konsistente Loading-States mit Spinner in allen Buttons
- **⚠️ ConfirmDialog**: Bestätigungs-Dialoge für kritische Aktionen (Löschen)
- **📭 EmptyState**: Schöne leere Zustände statt leerer Tabellen
- **🍞 Breadcrumbs**: Navigation-Pfad für bessere Orientierung
- **📝 FormField**: Inline-Validierung mit sofortigem Fehler-Feedback
- **⏱️ useDebounce**: Optimierte Suche ohne unnötige API-Calls
- **🎯 Liga-weite Durchgangszählung**: Wertung nur bei vollständigen Durchgängen
- **📱 Mobile Optimierung**: Ligalisten-Seite für Smartphones angepasst

## Version 2.4 (16. Februar 2026)
- **🔐 Passwort-Reset**: "Passwort vergessen" Funktion auf Login-Seite hinzugefügt
- **👤 Profil-Verwaltung**: Neue Profil-Seite für Schießnachweis-Benutzer
- **📝 Erweiterte Felder**: Vorname, Nachname, Verein, Kreisverband, Straße, PLZ, Wohnort
- **🔒 Firestore Rules**: Profil-Updates für user_permissions erlaubt
- **🚫 Zugriffskontrolle**: Schießnachweis-Benutzer sehen nur Schießnachweis/Social Training
- **✅ Sicherheit**: INDIVIDUAL userType hat keinen Zugriff auf RWK/KM-Bereiche
- **🔄 Letztes Training wiederholen**: Button zum schnellen Wiederholen des letzten Trainings
- **🎯 Unified Login**: Einheitlicher Login für alle Benutzertypen mit automatischem Routing

## Version 2.4.0 (15. Februar 2026)
- **🎨 Glassmorphism Design**: Modernes, glasiges UI mit Blur-Effekten und sanften Animationen
- **🌈 Neue Farbpalette**: Sanftere Grüntöne im Light Mode, tiefere Farben im Dark Mode
- **✨ Animierte Hintergründe**: Gradient-Shifts und dynamische Farbverläufe
- **💎 Glass-Komponenten**: Cards, Buttons, Inputs mit durchscheinenden Effekten
- **🎭 Verbesserte Schatten**: Tiefere, weichere Schatten für bessere Tiefenwirkung
- **🔄 Smooth Transitions**: Flüssige Animationen und Hover-Effekte überall
- **🌙 Dark Mode Optimierung**: Automatische Anpassung aller Glaseffekte
- **🚀 Next.js 16 Migration**: Upgrade auf Next.js 16.1.6 mit React 19 Kompatibilität
- **⚡ Performance-Optimierung**: Batch Reads für Firebase - 68% weniger Datenbankzugriffe
- **🔧 Code-Refactoring**: Zentrale getShooterClubId() Funktion für konsistente clubId-Verwaltung
- **✅ Inkonsistenzen behoben**: 21 Dateien aktualisiert - einheitliche Shooter-clubId-Logik
- **📦 Wartbarkeit**: Reduzierung von Code-Duplikation durch zentrale Utility-Funktion
- **🎯 Stabilität**: Konsistente Verarbeitung von clubId/rwkClubId/kmClubId in allen Modulen
- **🔒 Sicherheit**: Alle console.log durch secure-logger ersetzt (DSGVO-konform)
- **📊 Firebase Optimierung**: Batch-Read Utility für 90-97% weniger Reads bei RWK-Tabellen

## Version 2.3.12 (09. Februar 2026)
- **📸 KM-Ergebnisse Batch-Import**: Alle Ergebnisse auf einmal per PDF/Foto hochladen
- **🤖 Gemini AI Integration**: Automatische Erkennung von Namen, Ringen und Serien
- **🎯 Namen-Matching**: Intelligente Zuordnung unabhängig von Namensformat (Vorname Nachname / Nachname, Vorname)
- **📊 Serien-Import**: Automatische Berechnung und Speicherung aller Serien (102.3, 104.7, etc.)
- **⚡ Batch-Verarbeitung**: 64 PDFs in einem Request - nur 1 API-Call statt 64
- **🗑️ Ergebnisse löschen**: Löschen-Button speichert jetzt korrekt in Datenbank
- **🌙 Dark-Mode**: Optimierte Darstellung für KM-Ergebnisse Seite

## Version 2.3.11 (30. Januar 2026)
- **📄 KM-Meldungen PDF-Export**: Neuer Button zum Exportieren der Meldungen als PDF-Datei
- **🔢 Nummerierte Meldungen**: PDF enthält fortlaufende Nummerierung (1-n) für bessere Übersicht
- **🎯 Perfekt für KKP**: Ideal für Disziplinen ohne Startlisten - einfach Meldungen als PDF exportieren
- **📊 Gefilterte Exporte**: PDF berücksichtigt aktuelle Filter (Verein, Disziplin, Suche)
- **📱 Responsive Design**: Button funktioniert auf Desktop und Mobile optimal

## Version 2.3.10 (24. Januar 2026)
- **🔧 Ersatzschützen-Verbesserung**: Ersetzte Schützen werden automatisch aus Einzelranglisten ausgeblendet
- **📊 Sortierung korrigiert**: Ersatzschützen nach Gesamtpunktzahl, normale Schützen nach Durchschnitt
- **🏷️ Substitution-Badges**: Verbesserte Anzeige von Ersatzschützen in Mannschaftstabellen
- **🎯 Automatische Erkennung**: System erkennt ersetzte Schützen über team_substitutions Datenbank
- **📱 Konsistente Darstellung**: Einheitliche Behandlung in Desktop-, Mobile- und PDF-Ansichten

## Version 2.3.9
- Vorherige Verbesserungen und Bugfixes

---

*Entwickelt mit ❤️ für den deutschen Schießsport – KSV Einbeck*
