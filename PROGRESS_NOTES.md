# Fortschrittsbericht und Aufgaben RWK Einbeck App

## Projektübersicht
Die RWK Einbeck App ist eine Webanwendung zur Verwaltung von Rundenwettkämpfen des Kreisschützenverbandes Einbeck. Sie ermöglicht die Verwaltung von Saisons, Ligen, Vereinen, Mannschaften und Schützen sowie die Erfassung und Anzeige von Wettkampfergebnissen.

## Technologie-Stack
- **Frontend**: Next.js 15.x mit TypeScript, React, Tailwind CSS, shadcn/ui Komponenten
- **Backend**: Firebase (Firestore für Datenbank, Authentication für Benutzerverwaltung)
- **Hosting**: Vercel
- **Versionskontrolle**: Git

## Datenbankstruktur
- **seasons**: Wettkampfsaisons mit Jahr, Disziplin (Kleinkaliber, Luftdruck) und Status
- **rwk_leagues**: Ligen mit Zuordnung zu Saisons und spezifischem Disziplintyp
- **clubs**: Vereine mit Name, Kürzel und Vereinsnummer
- **rwk_teams**: Mannschaften mit Zuordnung zu Verein, Liga und Saison sowie Schützen-IDs
- **rwk_shooters**: Schützen mit Name, Geschlecht und Vereinszugehörigkeit
- **rwk_scores**: Ergebnisse mit Zuordnung zu Mannschaft, Schütze, Durchgang und Liga
- **league_updates**: Aktualisierungen für den "Letzte Änderungen"-Feed auf der Startseite
- **support_tickets**: Support-Anfragen von Benutzern
- **user_permissions**: Benutzerberechtigungen mit Rolle und Vereinszuordnung

## Benutzerrollen und Berechtigungen
- **Super-Administrator**: Vollzugriff auf alle Funktionen, verwaltet Saisons, Ligen, Vereine und Benutzerrechte
- **Vereinsvertreter**: Kann Mannschaften und Schützen für seinen Verein verwalten und Ergebnisse erfassen
- **Mannschaftsführer**: Kann Ergebnisse für seine Mannschaften erfassen, aber keine Stammdaten ändern
- **Öffentlichkeit**: Kann Tabellen, Ergebnisse und allgemeine Informationen einsehen

## Firestore-Sicherheitsregeln
Die Sicherheitsregeln sind implementiert und basieren auf der `user_permissions`-Collection:
- Öffentlich lesbare Collections: seasons, clubs, rwk_leagues, newsItems
- Beschränkte Schreibrechte für Vereinsvertreter und Mannschaftsführer auf ihre eigenen Daten
- Vollzugriff für Super-Administrator auf alle Collections
- Validierung der Benutzerrechte basierend auf UID und zugewiesenem Verein

## Abgeschlossene Aufgaben
- ✅ Basis-Admin-Funktionen (Stammdaten CRUD, Ergebniserfassung/-bearbeitung)
- ✅ Basis-VV/MF-Funktionen (Dashboard, Mannschafts-/Schützenansicht, Ergebniserfassung)
- ✅ RWK-Tabellen mit Filtern, Detailansichten und URL-Parameter-Verarbeitung
- ✅ Handbuch, Impressum, RWK-Ordnung und Support-Formular
- ✅ Admin-Benutzerverwaltung mit Rollenzuweisung und Vereinszuordnung
- ✅ Firestore-Sicherheitsregeln implementiert und getestet
- ✅ Fehler "seasonId is not defined" in der Ergebniserfassung behoben
- ✅ Durchgang bleibt beim Mannschaftswechsel in der Ergebniserfassung erhalten
- ✅ Mannschaften mit vollständigen Ergebnissen werden aus dem Dropdown entfernt

## Aktuelle Aufgaben
- 🔄 Weitere UX-Verbesserungen für die Ergebniserfassung:
  - Automatische Vorauswahl des aktuellen Durchgangs basierend auf Datum
  - ✅ Visuelle Hervorhebung von Schützen, für die noch keine Ergebnisse eingetragen wurden
  - Live-Validierung der Ringzahlen

## Geplante Verbesserungen (Version 0.5.0)
- Vereinfachte Mannschaftsanlage mit Dropdown für Mannschaftsstärke (I, II, III)
- Automatische Vorschläge für Mannschaftsnamen basierend auf Verein und Stärke
- Suchfunktion für Schützen bei größeren Vereinen
- Deutlichere visuelle Unterscheidung zwischen verfügbaren und bereits zugewiesenen Schützen
- Admin-Panel: Liste aller Mannschaftsführer einer Saison mit Kontaktdaten
- Login: Passwort-Reset-Funktion
- RWK-Tabellen: Druckfunktion für Ligaergebnisse
- Admin-Benutzerverwaltung: UI-Verbesserungen

## Geplante Features (Version 0.6.0)
- Audit-Trail für Ergebniserfassung (Admin)
- "Schnitt Vorjahr" in den Team-Dialogen mit echter Funktionalität
- PDF-Generierung für Gesamtlisten und Urkunden

## Wichtige Regeln und Einschränkungen
- Ein Schütze darf pro Saison und Disziplinkategorie (Gewehr/Pistole) nur in einer Mannschaft schießen
- Maximal 3 Schützen pro Mannschaft
- Mannschaften werden nach Spielstärke benannt (I, II, III)
- Einzelschützen werden in speziellen "Einzel"-Mannschaften geführt
- Nur der Super-Admin kann Mannschaften Ligen zuweisen
- Vereinsvertreter können nur ihre eigenen Mannschaften und Schützen verwalten

## Benutzerfreundlichkeit
Die App ist für weniger technikaffine Nutzer konzipiert und legt Wert auf:
- Intuitive Benutzerführung
- Klare Fehlermeldungen
- Hilfreiche Hinweise und Tooltips
- Konsistente Benutzeroberfläche
- Automatische Filterung und Vorauswahl wo möglich

## Aktuelle Version
- **Version**: 0.4.0 (Stand: 24. Mai 2025)
- **Letzte Änderungen**: Dokumentenverwaltung & Benutzerfreundlichkeit
  - Neue Seite für Dokumente & Ausschreibungen mit Kategorien
  - Admin-Dokumenten-Manager zum Hochladen und Verwalten von Dokumenten
  - Live-Tooltips für Vereinsvertreter zur besseren Benutzerführung
  - Schützen ohne Ergebnisse werden fett und mit Warnzeichen hervorgehoben
  - Firestore-Sicherheitsregeln implementiert

## Nächste Schritte
- ✅ Implementierung der Seite für Dokumente/Ausschreibungen
- ✅ Weitere UX-Verbesserungen für die Ergebniserfassung
- ✅ Dokumenten-Manager für Admins
- ✅ Live-Tooltips für Vereinsvertreter
- Vorbereitung für erste breitere Tests mit Vereinsvertretern und Mannschaftsführern