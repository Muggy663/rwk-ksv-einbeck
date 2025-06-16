# Changelog

## Version 0.8.3 (15. Juni 2025) - Beta-Release

### "Außer Konkurrenz"-Funktion
- Hinzugefügt: Mannschaften können als "außer Konkurrenz" markiert werden
- Hinzugefügt: Anzeige eines "AK"-Badges in Tabellen mit Tooltip für den Grund
- Hinzugefügt: Migrationsfunktion für bestehende Teams
- Hinzugefügt: Admin-Seite für Migration unter `/admin/migrations`

### Verbesserungen
- Hinzugefügt: "Nicht zugewiesen" Filter für Ligen in der Mannschaftsverwaltung
- Behoben: RWK-Tabellen können jetzt vollständig minimiert werden
- Verbessert: Entwicklungsdokumentation für bessere Nachvollziehbarkeit
- Verbessert: Mannschaftsverwaltung behält Saison-Auswahl nach dem Speichern bei
- Behoben: Problem mit dem Speichern von Mannschaften mit "Außer Konkurrenz"-Status

## Version 0.8.2 (15. Juni 2025) - Beta-Release

### Verbesserte Dokumentenverwaltung
- Hinzugefügt: Neue Kategorie "Ligalisten & Handtabellen" für bessere Organisation
- Hinzugefügt: Jahresfilterung für Ligalisten und Handtabellen
- Hinzugefügt: Gruppierung von Ligalisten nach Liga-Typ (Kreisoberliga, Kreisliga, etc.)
- Hinzugefügt: Suchfunktion für alle Dokumente
- Hinzugefügt: Favoriten-System zum Speichern häufig verwendeter Dokumente
- Hinzugefügt: Integrierte PDF-Vorschau ohne Download
- Verbessert: Visuelle Kennzeichnung von eingeschränkten Dokumenten für Vereinsvertreter/Mannschaftsführer
- Verbessert: Jahr-Badges für schnelle Identifikation von Ligalisten

## Version 0.8.1 (12. Juni 2025) - Beta-Release

### Fehlerbehebungen
- Behoben: Anzeige von "durchgang" mit großem Anfangsbuchstaben auf der Startseite
- Behoben: Anzeige von Schützen-IDs statt Namen in erweiterten Statistiken
- Behoben: Anzeige von Screenshots in Support-Tickets im Admin-Bereich

### Neue Funktionen
- Hinzugefügt: E-Mail-Benachrichtigung bei neuen Support-Tickets
- Hinzugefügt: Hinweis zum Saisonvergleich (erst ab 2026 relevant)
- Verbessert: Benutzerfreundlichere Formulierungen im Support-Bereich

## Version 0.8.0 (10. Juni 2025) - Beta-Release

### Mobile Optimierung
- Hinzugefügt: Responsive Tabellendarstellung für mobile Geräte
- Hinzugefügt: Touch-freundliche Diagramme mit verbesserten Interaktionen
- Verbessert: Anpassung der Navigation für mobile Geräte
- Verbessert: Optimierte Darstellung auf kleinen Bildschirmen

### Caching-Strategie
- Hinzugefügt: Lokales Caching für häufig abgefragte Daten
- Hinzugefügt: Optimierte Abfragemuster für bessere Performance
- Hinzugefügt: Automatische Aktualisierung bei Datenänderungen
- Verbessert: Schnellere Ladezeiten durch intelligentes Caching

### Erweiterte Statistik-Funktionen
- Hinzugefügt: Saisonübergreifende Vergleiche für Schützen und Mannschaften
- Hinzugefügt: Trendanalyse für Leistungsentwicklung
- Hinzugefügt: Erweiterte Filteroptionen für Statistiken
- Verbessert: Neue Statistik-Übersichtsseite mit direkten Links zu allen Funktionen

### Benutzerfreundlichkeit
- Verbessert: Vereinfachte Navigation und Benutzeroberfläche
- Verbessert: Kombinierte Terminverwaltung im Vereinsdashboard
- Verbessert: Optimierte Terminkalender-Verlinkung auf der Startseite
- Verbessert: Konsistentere Benutzerführung in der gesamten Anwendung

## Version 0.7.5 (07. Juni 2025)

### MongoDB-Integration
- Hinzugefügt: MongoDB-Integration für die Dokumentenverwaltung
- Hinzugefügt: Speicherung von Dokumenten in MongoDB GridFS
- Hinzugefügt: Speichernutzungsüberwachung für MongoDB
- Hinzugefügt: Migrations-Tool für die Übertragung von Dokumenten von JSON zu MongoDB
- Verbessert: Fehlerbehandlung und Fallback-Mechanismen

## Version 0.7.4 (06. Juni 2025)

### Dokumentenverwaltung
- Hinzugefügt: JSON-basierte Dokumentenverwaltung
- Hinzugefügt: Admin-Interface für Dokumentenverwaltung
- Verbessert: Optimierte Dokumentenseite
- Verbessert: Optimierung der Dokumentenseite für mobile Geräte

## Version 0.7.3 (05. Juni 2025)

### PDF-Optimierung
- Hinzugefügt: Caching für PDF-Generierung
- Verbessert: Optimierung der Bildqualität und Dateigröße
- Verbessert: Fehlerbehandlung bei der PDF-Erstellung
- Hinzugefügt: Fortschrittsanzeige während der PDF-Generierung

## Version 0.7.2 (04. Juni 2025)

### Fehlerbehebungen & Verbesserungen
- Behoben: Login-Formular-Fehler "Required" auf Vercel
- Hinzugefügt: "Passwort ändern"-Funktion
- Behoben: Standard-Statistik-Seite korrigiert
- Hinzugefügt: "Erste Schritte starten"-Button mit Funktionalität
- Verbessert: Vereinfachung der Benutzeroberfläche
- Verbessert: JavaScript-Umstellung für bessere Kompatibilität

## Version 0.7.1 (03. Juni 2025)

### Vercel-Kompatibilität
- Behoben: Vercel-Build-Fehler
- Verbessert: Service-Module von TypeScript zu JavaScript konvertiert
- Hinzugefügt: Fehlende PDF-Generierungsfunktionen
- Hinzugefügt: Fallback-CSS-Stile

## Version 0.7.0 (03. Juni 2025)

### Neue Funktionen
- Hinzugefügt: Umfassendes Statistik-Dashboard mit erweiterten Visualisierungen
- Hinzugefügt: Schützenvergleich-Funktion mit Auswahl von bis zu 6 Schützen
- Hinzugefügt: Leistungsentwicklung von Schützen über die Saison (Liniendiagramm)
- Hinzugefügt: Vergleich zwischen Mannschaften einer Liga (Balkendiagramm)
- Hinzugefügt: Verteilung der Ergebnisse nach Geschlecht (Kreisdiagramm)
- Hinzugefügt: Übersichtlicher Kalender für alle Wettkämpfe und Veranstaltungen
- Hinzugefügt: Export von Terminen als iCal-Datei (kompatibel mit Google Kalender)
- Hinzugefügt: Progressive Web App (PWA) Funktionalität
- Hinzugefügt: Offline-Zugriff auf grundlegende Funktionen

### Verbesserungen
- Verbessert: Responsive Design für alle Seiten
- Verbessert: Touch-optimierte UI-Elemente
- Verbessert: Anpassung der Tabellen für kleine Bildschirme
- Verbessert: Optimierte Druckansicht für Ligaergebnisse ohne sensible Daten
- Verbessert: Direkter Druck aus der Tabellenseite
- Verbessert: Optimierte Ladezeiten für große Datenmengen
- Verbessert: Einheitliche Darstellung auf allen Geräten
- Verbessert: Konsistentes Layout mit Logo in der Kopfzeile und Footer

### Fehlerbehebungen
- Behoben: Router-Update-Fehler im AdminLayout beim automatischen Logout

## Version 0.6.5 (05. Juni 2025)

### Neue Funktionen
- Hinzugefügt: PDF-Export für Ligaergebnisse und Einzelschützenergebnisse
- Hinzugefügt: Druckfreundliche Darstellung der Tabellen
- Hinzugefügt: Logo in der oberen linken Ecke der Anwendung

### Fehlerbehebungen
- Behoben: Problem mit der Groß-/Kleinschreibung bei der Abfrage von Saisons in RWK-Tabellen
- Behoben: "RWK" aus dem Anzeigenamen der Wettbewerbe entfernt
- Behoben: Icons in der Hauptnavigation aktualisiert für bessere Verständlichkeit
- Behoben: Login-Button in der Hauptnavigation wiederhergestellt
- Behoben: Dokumente und Support-Links zur Hauptnavigation hinzugefügt
- Behoben: Beispieldaten für Termine entfernt, wenn keine Termine gefunden werden
- Behoben: Beispieldaten aus statistics-service entfernt

### Verbesserungen
- Verbessert: Protokollierung der verfügbaren Disziplinen für bessere Fehlerdiagnose
- Verbessert: Konsistente Behandlung von Groß-/Kleinschreibung bei Disziplinen (kk/KK, lg/LG)
- Verbessert: Ortsauswahl bei Terminen verwendet jetzt Clubs aus der Datenbank
- Verbessert: Konsistentes Layout mit Logo in der Kopfzeile für bessere Markenidentität

## Version 0.6.4 (02. Juni 2025)

### Benutzeroberfläche
- Verbessert: Logo in den Ergebnislisten ist jetzt rechtsbündig positioniert
- Behoben: Doppelte Anzeige von "Kleinkaliber" in den Urkunden entfernt
- Hinzugefügt: Unterschriftenbilder in den Urkunden für Präsident und Rundenwettkampfleiter
- Verbessert: Benutzerhandbuch für normale Benutzer vereinfacht, technische Begriffe entfernt
- Geändert: Begriff "Spielstärke" im Handbuch durch "Mannschaftsstärke" ersetzt
- Behoben: "undefined"-Einträge im Handbuch entfernt
- Verbessert: Nummerierung der Abschnitte im Handbuch für normale Benutzer korrigiert

### Dokumentation
- Aktualisiert: Handbuch mit benutzerfreundlicheren Erklärungen
- Aktualisiert: Versionsnummer und Datum in allen relevanten Dateien
- Geändert: Bezeichnung "Super-Administrator" durchgängig durch "Rundenwettkampfleiter" ersetzt
- Korrigiert: Hinweise auf mehrere Vereine pro Benutzer entfernt
- Aktualisiert: Information zur Passwortänderung beim ersten Login aktualisiert

### Technische Details
- Verbessert: PDF-Generierung für Urkunden mit Unterschriftenbildern
- Optimiert: Layout der Druckansicht für bessere Lesbarkeit

## Version 0.6.3 (01. Juni 2025)

### Sicherheit & Benutzerfreundlichkeit
- Neu: Automatischer Logout nach 10 Minuten Inaktivität mit sichtbarem Countdown-Timer
- Neu: Verbesserte Benutzerführung für Vereinsvertreter und Mannschaftsführer
- Verbessert: Onboarding-Dialog zeigt nur für relevante Benutzerrollen an

### PDF-Exporte & Auswertungen
- Neu: Gesamtrangliste aller Einzelschützen über alle Ligen hinweg (außer Sportpistole)
- Neu: Filterung der Einzelschützenergebnisse nach Geschlecht (männlich/weiblich)
- Neu: Urkunden-Generator für die besten Schützen und Mannschaften jeder Liga
- Neu: Automatische Erstellung von Urkunden für Gesamtsieger (bester Schütze, beste Dame)
- Verbessert: Optimiertes PDF-Layout mit Kreisverbandslogo und besserer Lesbarkeit
- Verbessert: Mehr Abstand zwischen Einzelschützenergebnissen für bessere Übersichtlichkeit

### Vercel-Kompatibilität
- Verbesserte Kompatibilität mit Vercel-Deployment durch Optimierung des URL-Parameter-Handlings
- Behebung von Fehlern beim statischen Rendering auf Vercel
- Optimierte Suspense-Boundary-Behandlung für Next.js 15
- Verbesserte Firestore-Abfragen für Vercel-Limits bei der Urkunden-Generierung
- Optimierte Asset-Handhabung für PDF-Generierung auf Vercel

## Version 0.6.2 (26. Mai 2025)

### Dokumentenverwaltung
- Neue Dokumentenverwaltung für Ausschreibungen, Formulare und Regelwerke
- Upload von PDF-Dateien oder Verlinkung zu externen Webseiten
- Kategorisierung nach Dokumenttyp (Ausschreibung, Formular, Regelwerk, Archiv)

### Benutzerfreundlichkeit
- Verbesserte Navigation und Filteroptionen in der Ergebniserfassung
- Optimierte Darstellung auf mobilen Geräten
- Hilfetexte und Tooltips für komplexe Funktionen

### Bugfixes
- Behebung von Darstellungs- und JavaScript-Fehlern auf der RWK-Tabellenseite (EOF, useSearchParams)
- Korrektur der Sortierung in der Einzelschützen-Rangliste
- Verbesserung der Ladezeiten bei großen Datenmengen

## Version 0.6.1 (26. Mai 2025)

### PDF-Funktionalität & Vorjahresdurchschnitt
- Neu: Druckfunktion für Ligaergebnisse implementiert
- Neu: Optimierte PDF-Layouts für bessere Lesbarkeit
- Neu: Integration des Vorjahresdurchschnitts in Team-Dialoge
- Neu: Hilfs-Tooltips für komplexe Funktionen
- Verbessert: Onboarding-Assistent mit zusätzlichen Hinweisen
- Verbessert: PDF-Export-Seite für Ergebnislisten und Urkunden
- Verbessert: Admin-Index für einfacheren Import von Admin-Komponenten
- Behoben: Verschiedene Bugfixes und Performance-Optimierungen

## Version 0.6.0 (28. Mai 2025)

### Benutzerführung & Audit-Trail
- Neu: "Erste Schritte"-Assistent für neue Vereinsvertreter und Mannschaftsführer
- Neu: Aufforderung zur Passwortänderung nach dem ersten Login
- Neu: Übersicht der Mannschaftsführer für Vereinsvertreter
- Neu: Audit-Trail für Ergebniserfassung mit detaillierter Änderungshistorie
- Neu: "Schnitt Vorjahr" Funktionalität in den Team-Dialogen implementiert
- Neu: PDF-Generierung für Ergebnislisten und Urkunden
- Verbessert: Vereins-Layout mit zusätzlichem Menüpunkt für Mannschaftsführer
- Verbessert: Dokumentation und Benutzerhandbuch aktualisiert

## Version 0.5.1 (27. Mai 2025)

### Bugfixes für Passwort-Reset und Mannschaftsführer-Anzeige
- Behoben: Fehler beim Passwort-Reset-Formular durch Auslagerung in separate Komponente
- Behoben: Mannschaftsführer wurden in der Übersicht nicht angezeigt aufgrund unterschiedlicher Feldnamen in der Datenbank
- Behoben: Firestore-Sicherheitsregeln für Vereinsvertreter korrigiert (Feldname clubId statt assignedClubId)
- Verbessert: Saisonauswahl in der Mannschaftsführer-Übersicht mit automatischer Auswahl der neuesten Saison
- Dokumentation aktualisiert mit Datenbankstruktur-Informationen und Berechtigungsmodell

## Version 0.5.0 (26. Mai 2025)

### UX-Verbesserungen & Benutzerfreundlichkeit
- Neu: Passwort-Reset-Funktion für Benutzer implementiert
- Neu: Suchfunktion für Schützen bei größeren Vereinen hinzugefügt
- Neu: Vereinfachte Mannschaftsanlage mit Dropdown für Mannschaftsstärke
- Neu: Admin-Panel mit Liste aller Mannschaftsführer einer Saison und Kontaktdaten
- Verbessert: Deutlichere visuelle Unterscheidung zwischen verfügbaren und zugewiesenen Schützen
- Verbessert: Automatische Vorauswahl des aktuellen Durchgangs basierend auf Datum
- Verbessert: Live-Validierung der Ringzahlen während der Eingabe
- Verbessert: Admin-Benutzerverwaltung mit optimierter Benutzeroberfläche

## Version 0.4.0 (25. Mai 2025)

### Berechtigungen für Ergebniserfassung & Tooltips
- Behoben: Vereinsvertreter können jetzt Ergebnisse für alle Mannschaften in einer Liga erfassen, in der ihr Verein teilnimmt
- Verbessert: Tooltips für bessere Benutzerführung in allen Bereichen hinzugefügt
- Optimiert: Ergebniserfassung speichert jetzt jedes Ergebnis einzeln, um Berechtigungsprobleme zu vermeiden
- Aktualisierung der Dokumentation und Handbuch mit den neuesten Funktionen

## Version 0.3.5 (24. Mai 2025)

### Verbesserte Ergebniserfassung & Benutzerfreundlichkeit
- Verbessert: Schützen ohne Ergebnisse werden in der Ergebniserfassung fett und mit Warnzeichen (⚠️) hervorgehoben
- Aktualisierung der Dokumentation und Handbuch mit den neuesten Funktionen

## Version 0.3.4 (24. Mai 2025)

### Firestore Sicherheitsregeln & Ergebniserfassung
- Behoben: Durchgang wird beim Mannschaftswechsel in der Ergebniserfassung nicht mehr zurückgesetzt (Admin und Vereinsvertreter)
- Behoben: "seasonId is not defined"-Fehler in der Ergebniserfassung für Admin und Vereinsvertreter
- Verbessert: Mannschaften, deren Schützen bereits alle Ergebnisse für einen Durchgang haben, werden aus dem Dropdown entfernt
- Verbessert: Anzeige "Alle Teams vollständig erfasst" wenn keine Mannschaften mehr für den ausgewählten Durchgang verfügbar sind
- Firestore-Sicherheitsregeln implementiert und getestet

## Version 0.3.3 (22. Mai 2025)

### Fehlerbehebung Admin-Schützenverwaltung & Stabilitätsverbesserungen
- Behoben: Fälschlicherweise angezeigter Fehler-Toast "maximal 3 Mannschaften ausgewählt" beim Öffnen des "Neuen Schützen anlegen"-Dialogs im Admin-Panel
- Diverse Korrekturen an Importen und Code-Struktur zur Verbesserung der Build-Stabilität auf Vercel
- Aktualisierung der Handbuch- und Agenda-Texte

## Version 0.3.1 (22. Mai 2025)

### RWK-Ordnung, Handbuch-Fix & Vorbereitung Admin-Agenda
- Neue Seite "/rwk-ordnung" mit Inhalt erstellt und in die Hauptnavigation aufgenommen
- Syntaxfehler auf der Seite "/handbuch" behoben, der das Rendern verhinderte
- Handbuch und Admin-Agenda mit den neuesten Funktionen und vereinfachten Formulierungen aktualisiert
- Fehlerbehebungen im Zusammenhang mit Icon-Importen auf verschiedenen Seiten

## Version 0.3.0 (22. Mai 2025)

### Verbesserte RWK-Tabellen, Doku & Fahrplan
- RWK-Tabellen (/rwk-tabellen) verarbeiten jetzt URL-Query-Parameter, um direkt spezifische Ligen und Jahre anzuzeigen (Verlinkung von Startseite)
- Ligen-Akkordeons in RWK-Tabellen sind jetzt standardmäßig geöffnet
- Einzelschützen in der aufgeklappten Mannschafts-Detailansicht (RWK-Tabellen) sind nun klickbar und öffnen den Statistik-Dialog
- Behebung von Darstellungs- und JavaScript-Fehlern auf der RWK-Tabellenseite (EOF, useSearchParams)
- Handbuch und Admin-Dashboard-Agenda an den aktuellen Entwicklungsstand angepasst
- Filterung von "Einzel"-Mannschaften aus der Mannschaftsrangliste
- Korrekte Berechnung von Mannschafts-Rundenergebnissen (nur wenn 3 Schützen Ergebnisse haben)
- Anpassung der DG-Spaltenüberschriften in der Mannschaftstabelle für bessere Lesbarkeit
- Behebung einer Dauerschleife auf der RWK-Tabellenseite durch Optimierung der React Hooks

## Version 0.2.0 (15. April 2025)

### Admin-Bereich & Öffentliche Ansichten
- Komplette Verwaltung von Saisons, Ligen, Vereinen, Mannschaften und Schützen
- Ergebniserfassung und -bearbeitung
- Support-Ticket-System
- RWK-Tabellen mit Mannschafts- und Einzelranglisten
- "Letzte Änderungen"-Feed auf der Startseite
- RWK-Ordnung und Impressum