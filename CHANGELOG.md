# Changelog

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