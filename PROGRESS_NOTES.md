# Fortschrittsbericht und Aufgaben RWK Einbeck App

## Projektübersicht
Die RWK Einbeck App ist eine Webanwendung zur Verwaltung von Rundenwettkämpfen des Kreisschützenverbandes Einbeck. Sie ermöglicht die Verwaltung von Saisons, Ligen, Vereinen, Mannschaften und Schützen sowie die Erfassung und Anzeige von Wettkampfergebnissen.

## Technologie-Stack
- **Frontend**: Next.js 15.x mit TypeScript, React, Tailwind CSS, shadcn/ui Komponenten
- **Backend**: Firebase (Firestore für Datenbank, Authentication für Benutzerverwaltung)
- **Hosting**: Vercel
- **Versionskontrolle**: Git

## Datenbankstruktur
- **seasons**: Wettkampfsaisons mit Jahr, Disziplin (Kleinkaliber, Luftdruck), Status und competitionYear (numerischer Wert für Sortierung)
- **rwk_leagues**: Ligen mit Zuordnung zu Saisons und spezifischem Disziplintyp (KKG, KKP, LG, LGA, LP, LPA)
- **clubs**: Vereine mit Name, Kürzel und Vereinsnummer
- **rwk_teams**: Mannschaften mit Zuordnung zu Verein, Liga und Saison sowie Schützen-IDs. Enthält auch captainName/Email/Phone oder managerName/Email/Phone für Kontaktdaten des Mannschaftsführers
- **rwk_shooters**: Schützen mit Name (firstName, lastName), Geschlecht (gender: 'male'/'female') und Vereinszugehörigkeit (clubId)
- **rwk_scores**: Ergebnisse mit Zuordnung zu Mannschaft, Schütze, Durchgang und Liga. Enthält auch Metadaten wie enteredByUserId und entryTimestamp
- **league_updates**: Aktualisierungen für den "Letzte Änderungen"-Feed auf der Startseite
- **support_tickets**: Support-Anfragen von Benutzern mit Name, E-Mail, Betreff, Nachricht und Status
- **user_permissions**: Benutzerberechtigungen mit Rolle ('vereinsvertreter', 'mannschaftsfuehrer'), clubId (Vereinszuordnung) und Benutzermetadaten

## Benutzerrollen und Berechtigungen
- **Super-Administrator**: Vollzugriff auf alle Funktionen, verwaltet Saisons, Ligen, Vereine und Benutzerrechte
- **Vereinsvertreter**: Kann Mannschaften und Schützen für seinen Verein verwalten und Ergebnisse erfassen
- **Mannschaftsführer**: Kann Ergebnisse für seine Mannschaften erfassen, aber keine Stammdaten ändern
- **Öffentlichkeit**: Kann Tabellen, Ergebnisse und allgemeine Informationen einsehen

## Firestore-Sicherheitsregeln
Die Sicherheitsregeln sind implementiert und basieren auf der `user_permissions`-Collection:
- Öffentlich lesbare Collections: seasons, clubs, rwk_leagues, newsItems
- Beschränkte Schreibrechte für Vereinsvertreter und Mannschaftsführer auf ihre eigenen Daten
- Vollzugriff für Super-Administrator auf alle Collections (identifiziert durch E-Mail admin@rwk-einbeck.de)
- Validierung der Benutzerrechte basierend auf UID und zugewiesenem Verein (clubId)

Die Berechtigungsprüfung erfolgt über Hilfsfunktionen:
```javascript
function isSuperAdmin() {
  return request.auth != null && request.auth.token.email == 'admin@rwk-einbeck.de';
}

function isVereinsvertreter() {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.role == 'vereinsvertreter';
}

function hasClubAccess(clubId) {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/user_permissions/$(request.auth.uid)).data.clubId == clubId;
}
```

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

## Abgeschlossene Verbesserungen (Version 0.5.0 & 0.5.1)
- ✅ Vereinfachte Mannschaftsanlage mit Dropdown für Mannschaftsstärke (I, II, III)
- ✅ Automatische Vorschläge für Mannschaftsnamen basierend auf Verein und Stärke
- ✅ Suchfunktion für Schützen bei größeren Vereinen
- ✅ Deutlichere visuelle Unterscheidung zwischen verfügbaren und bereits zugewiesenen Schützen
- ✅ Admin-Panel: Liste aller Mannschaftsführer einer Saison mit Kontaktdaten
- ✅ Login: Passwort-Reset-Funktion
- ❌ RWK-Tabellen: Druckfunktion für Ligaergebnisse (verschoben auf Version 0.5.2)
- ✅ Admin-Benutzerverwaltung: UI-Verbesserungen
- ✅ Firestore-Sicherheitsregeln für Vereinsvertreter korrigiert (clubId statt assignedClubId)

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
- **Version**: 0.5.1 (Stand: 27. Mai 2025)
- **Letzte Änderungen**: Bugfixes & Verbesserungen
  - Behoben: Fehler beim Passwort-Reset-Formular durch Auslagerung in separate Komponente
  - Behoben: Mannschaftsführer wurden in der Übersicht nicht angezeigt aufgrund unterschiedlicher Feldnamen (captainName vs. managerName)
  - Behoben: Firestore-Sicherheitsregeln für Vereinsvertreter korrigiert (Feldname clubId statt assignedClubId)
  - Verbessert: Saisonauswahl in der Mannschaftsführer-Übersicht mit automatischer Auswahl der neuesten Saison
  - Dokumentation aktualisiert mit Datenbankstruktur-Informationen und Berechtigungsmodell

- **Version**: 0.5.0 (Stand: 26. Mai 2025)
- **Letzte Änderungen**: UX-Verbesserungen & Benutzerfreundlichkeit
  - Neu: Passwort-Reset-Funktion für Benutzer implementiert
  - Neu: Suchfunktion für Schützen bei größeren Vereinen hinzugefügt
  - Neu: Vereinfachte Mannschaftsanlage mit Dropdown für Mannschaftsstärke
  - Neu: Admin-Panel: Liste aller Mannschaftsführer einer Saison mit Kontaktdaten
  - Verbessert: Deutlichere visuelle Unterscheidung zwischen verfügbaren und zugewiesenen Schützen
  - Verbessert: Automatische Vorauswahl des aktuellen Durchgangs basierend auf Datum
  - Verbessert: Live-Validierung der Ringzahlen während der Eingabe
  - Verbessert: Admin-Benutzerverwaltung mit optimierter Benutzeroberfläche

## Nächste Schritte (Version 0.5.2 & 0.6.0)
- RWK-Tabellen: Druckfunktion für Ligaergebnisse (Version 0.5.2)
- Vorbereitung für erste breitere Tests mit Vereinsvertretern und Mannschaftsführern
- Audit-Trail für Ergebniserfassung (Admin) (Version 0.6.0)
- "Schnitt Vorjahr" in den Team-Dialogen mit echter Funktionalität (Version 0.6.0)
- PDF-Generierung für Gesamtlisten und Urkunden (Version 0.6.0)

## Abgeschlossene Schritte
- ✅ Implementierung der Seite für Dokumente/Ausschreibungen
- ✅ Weitere UX-Verbesserungen für die Ergebniserfassung
- ✅ Dokumenten-Manager für Admins
- ✅ Live-Tooltips für Vereinsvertreter
- ✅ Passwort-Reset-Funktion für Benutzer
- ✅ Mannschaftsführer-Übersicht für Admins