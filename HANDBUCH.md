# Benutzerhandbuch RWK Einbeck App

Dieses Handbuch beschreibt die Funktionen und die Bedienung der Rundenwettkampf (RWK) App für den Kreisschützenverband Einbeck.

## Inhaltsverzeichnis

1.  [Einleitung](#einleitung)
    *   [Zweck der Anwendung](#zweck-der-anwendung)
    *   [Zielgruppen](#zielgruppen)
2.  [Erste Schritte](#erste-schritte)
    *   [Login](#login)
    *   [Benutzerkonten & Rollen](#benutzerkonten--rollen)
3.  [Für Super-Administratoren](#fuer-super-administratoren)
    *   [Dashboard Übersicht](#dashboard-uebersicht-admin)
    *   [Saisonverwaltung](#saisonverwaltung)
    *   [Ligaverwaltung](#ligaverwaltung)
    *   [Vereinsverwaltung](#vereinsverwaltung)
    *   [Mannschaftsverwaltung (Admin)](#mannschaftsverwaltung-admin)
    *   [Schützenverwaltung (Admin)](#schuetzenverwaltung-admin)
    *   [Ergebniserfassung (Admin)](#ergebniserfassung-admin)
    *   [Ergebnisse bearbeiten/löschen (Admin)](#ergebnisse-bearbeitenloeschen-admin)
    *   [Benutzerverwaltung (Admin - Rechtevergabe)](#benutzerverwaltung-admin-rechtevergabe)
    *   [Support Tickets einsehen](#support-tickets-einsehen-admin)
    *   [Agenda / Offene Punkte](#agenda--offene-punkte-admin)
4.  [Für Vereinsvertreter und Mannschaftsführer](#fuer-vereinsvertreter-und-mannschaftsfuehrer)
    *   [Zugriff und Vereinskontext](#zugriff-und-vereinskontext-vvmf)
    *   [Dashboard Übersicht (VV/MF)](#dashboard-uebersicht-vvmf)
    *   [Vereinsauswahl (falls mehrere Vereine zugewiesen)](#vereinsauswahl-vvmf)
    *   [Mannschaftsverwaltung (nur Vereinsvertreter)](#mannschaftsverwaltung-vv)
    *   [Schützenverwaltung (nur Vereinsvertreter)](#schuetzenverwaltung-vv)
    *   [Ergebniserfassung (Vereinsvertreter und Mannschaftsführer)](#ergebniserfassung-vvmf)
5.  [Öffentliche Ansichten](#oeffentliche-ansichten)
    *   [RWK Tabellen](#rwk-tabellen)
    *   [Letzte Änderungen (Startseite)](#letzte-aenderungen-startseite)
    *   [Updates & Changelog](#updates--changelog)
    *   [Impressum](#impressum)
6.  [Support](#support)
    *   [Support-Ticket erstellen](#support-ticket-erstellen)

---

## 1. Einleitung

### Zweck der Anwendung
Die RWK Einbeck App dient zur Verwaltung und Darstellung der Rundenwettkämpfe des Kreisschützenverbandes Einbeck. Sie ermöglicht die Pflege von Stammdaten (Saisons, Ligen, Vereine, Mannschaften, Schützen), die Erfassung von Ergebnissen und die Anzeige von Tabellen und Ranglisten.

### Zielgruppen
*   **Super-Administratoren:** Verantwortlich für die Gesamtverwaltung der Anwendung, Anlage von Saisons, Ligen, Vereinen, Zuweisung von Mannschaften zu Ligen und die Verwaltung von Benutzerrechten.
*   **Vereinsvertreter:** Verantwortlich für die Verwaltung der Mannschaften und Schützen ihres/ihrer zugewiesenen Vereins/e sowie die Erfassung von Ergebnissen. Sie können Mannschaften und Schützen für ihren Verein anlegen und bearbeiten.
*   **Mannschaftsführer:** Primär verantwortlich für die Erfassung von Ergebnissen für die Ligen, an denen Mannschaften ihrer zugewiesenen Vereine teilnehmen. Können Stammdaten ihres Vereins einsehen, aber nicht bearbeiten (kein Anlegen/Ändern von Mannschaften oder Schützen).
*   **Öffentlichkeit/Schützen:** Können Tabellen, Ergebnisse und aktuelle Informationen einsehen.

## 2. Erste Schritte

### Login
Der Login erfolgt über die Login-Seite mit E-Mail und Passwort.

### Benutzerkonten & Rollen
*   Benutzerkonten (für Vereinsvertreter, Mannschaftsführer) werden **ausschließlich vom Super-Administrator manuell in der Firebase Authentication Konsole angelegt** (E-Mail, initiales Passwort).
*   Anschließend weist der Super-Administrator dem Benutzer über das Admin-Panel der App (unter "Benutzerverwaltung") eine **Rolle** ("vereinsvertreter" oder "mannschaftsfuehrer") und die zugehörigen **Vereine** (bis zu 3) zu. Diese Berechtigungen werden in der Datenbank (`user_permissions`-Collection) gespeichert.
*   Ein **Vereinsvertreter** hat erweiterte Rechte zur Verwaltung von Mannschaften und Schützen seines Vereins.
*   Ein **Mannschaftsführer** kann primär Ergebnisse für die Ligen seiner zugewiesenen Vereine eintragen.

## 3. Für Super-Administratoren
(Dieser Abschnitt ist nur im Handbuch sichtbar, wenn der Super-Admin eingeloggt ist)

Das Admin-Panel ist die zentrale Steuerungsinstanz für den Super-Administrator.

### Dashboard Übersicht (Admin)
Bietet eine zentrale Übersicht über die Verwaltungsfunktionen und eine Agenda für offene Punkte.

### Saisonverwaltung
Hier können neue Wettkampfsaisons (z.B. "RWK 2025 Kleinkaliber") mit Jahr, übergeordnetem Disziplintyp (Kleinkaliber, Luftdruck) und Status (Geplant, Laufend, Abgeschlossen) erstellt, bearbeitet und gelöscht werden. Der Status "Laufend" ist entscheidend für die Sichtbarkeit in den RWK-Tabellen und die Ergebniserfassung.

### Ligaverwaltung
Nach Auswahl einer Saison können hier Ligen (z.B. Kreisoberliga) angelegt werden. Der spezifische Disziplintyp (z.B. KKG, LGA, LP Freihand) muss aus einer Liste ausgewählt werden. Ligen können bearbeitet und gelöscht werden.

### Vereinsverwaltung
Ermöglicht das Anlegen, Bearbeiten und Löschen von Vereinen mit Name, Kürzel und Vereinsnummer.

### Mannschaftsverwaltung (Admin)
Der Super-Admin kann hier alle Mannschaften verwalten.
*   **Filter:** Saison, Verein und Liga auswählen, um Mannschaften zu filtern. Wichtig: Um "liga-lose" Mannschaften (die von VVs angelegt wurden) zu finden, Saison und Verein auswählen und den Liga-Filter auf "Alle Ligen" lassen.
*   **Anlegen/Bearbeiten:** Mannschaften erstellen oder bearbeiten, **Ligazugehörigkeit festlegen oder ändern**, Mannschaftsführer-Kontaktdaten erfassen.
*   **Schützen zuweisen:** Schützen den Teams zuordnen (max. 3 pro Team; Regel: ein Schütze pro Saison/Disziplinkategorie nur in einem Team).

### Schützenverwaltung (Admin)
Verwaltung aller Schützen.
*   **Anlegen/Bearbeiten:** Schützen mit Vorname, Nachname, Geschlecht und Vereinszugehörigkeit anlegen oder ändern.
*   **Mannschaftszuordnung:** Direkte Zuordnung zu Teams beim Anlegen/Bearbeiten möglich (unter Beachtung der Regeln).

### Ergebniserfassung (Admin)
Erfassung von Ergebnissen für alle Ligen.
*   **Auswahl:** Saison (nur "Laufend"), Liga, Mannschaft, Durchgang, Schütze.
*   **Eingabe:** Ringergebnis, Ergebnistyp (Regulär, Vorschießen, Nachschießen).
*   **Zwischenspeicher:** Ergebnisse werden gesammelt, bevor sie endgültig gespeichert werden. Bereits erfasste Schützen/Durchgänge werden im Dropdown nicht mehr angeboten.
*   **Speichern:** Schreibt Ergebnisse in die Datenbank und erstellt/aktualisiert einen Eintrag für den "Letzte Änderungen"-Feed auf der Startseite (gruppiert nach Liga, Tag, Disziplin und Jahr).

### Ergebnisse bearbeiten/löschen (Admin)
Ermöglicht die Suche, Bearbeitung (Ringzahl, Typ) und das Löschen von bereits erfassten Ergebnissen. Änderungen werden mit Benutzer und Zeitstempel versehen.

### Benutzerverwaltung (Admin - Rechtevergabe)
Der Super-Administrator kann hier Benutzern (die zuvor manuell in Firebase Authentication angelegt wurden und deren UID bekannt ist) Rollen ("vereinsvertreter", "mannschaftsfuehrer") und bis zu drei Vereine zuweisen. Diese Berechtigungen werden in der Datenbank (`user_permissions`-Collection) gespeichert.

### Support Tickets einsehen (Admin)
Zeigt eine Liste aller über das Support-Formular eingegangenen Tickets an. Der Status der Tickets kann hier verwaltet werden.

### Agenda / Offene Punkte (Admin)
Eine Liste geplanter Features und offener Aufgaben im Admin-Dashboard.

## 4. Für Vereinsvertreter und Mannschaftsführer

Nach dem Login mit den vom Super-Admin bereitgestellten Zugangsdaten und der Zuweisung der Rolle und Vereinszugehörigkeit(en) in der `user_permissions`-Collection, erhält der Benutzer Zugriff auf den "Mein Verein"-Bereich.

### Zugriff und Vereinskontext (VV/MF)
Die angezeigten Daten und Bearbeitungsmöglichkeiten sind auf den/die Verein(e) beschränkt, die dem eingeloggten Benutzer in seinen `user_permissions` zugewiesen sind. Die App liest diese Berechtigungen aus der Datenbank, um den Zugriff zu steuern.

### Dashboard Übersicht (VV/MF)
Pfad: `/verein/dashboard`. Zeigt eine Begrüßung, die zugewiesene Rolle und die Namen der Vereine an, für die der Benutzer zuständig ist.

### Vereinsauswahl (falls mehrere Vereine zugewiesen)
Wenn einem Benutzer mehrere Vereine in seinen `user_permissions` zugewiesen sind, erscheint auf den Verwaltungsseiten (Meine Mannschaften, Meine Schützen, Ergebnisse erfassen) oben ein Dropdown, um den Verein auszuwählen, für den aktuell Aktionen durchgeführt werden sollen (`activeClubId`). Ist nur ein Verein zugewiesen, entfällt diese Auswahl.

### Mannschaftsverwaltung (nur Vereinsvertreter)
Pfad: `/verein/mannschaften`. **Diese Funktion ist nur für Benutzer mit der Rolle "vereinsvertreter" verfügbar.** Mannschaftsführer sehen die Liste (falls der Link zugänglich wäre), können aber keine Änderungen vornehmen.
*   **Saisonauswahl:** Der VV wählt eine vom Super-Admin angelegte Saison aus.
*   **Anzeige:** Mannschaften des ausgewählten/zugewiesenen `activeClubId` für die gewählte Saison.
*   **Anlegen (VV):** Neue Mannschaften für den eigenen Verein und die gewählte Saison erstellen. **Die Zuweisung zu einer spezifischen Liga erfolgt ausschließlich durch den Super-Admin.** Name und Mannschaftsführer-Kontaktdaten können erfasst werden.
*   **Bearbeiten (VV):** Namen von Mannschaften und Mannschaftsführer-Kontaktdaten ändern.
*   **Schützen zuweisen (VV):** Schützen des eigenen Vereins können den Mannschaften zugeordnet werden (max. 3 pro Team; Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" wird geprüft, falls Team schon Ligatyp hat).
*   **Löschen (VV):** Eigene Mannschaften entfernen.

### Schützenverwaltung (nur Vereinsvertreter)
Pfad: `/verein/schuetzen`. **Diese Funktion ist nur für Benutzer mit der Rolle "vereinsvertreter" verfügbar.**
*   **Anzeige:** Schützen des ausgewählten/zugewiesenen `activeClubId`.
*   **Anlegen (VV):** Neue Schützen für den eigenen Verein erstellen (Nachname, Vorname, Geschlecht). Eine direkte Mannschaftszuordnung beim Anlegen erfolgt hier nicht, sondern über die Mannschaftsverwaltungsseite.
*   **Bearbeiten/Löschen (VV):** Stammdaten eigener Schützen ändern oder Schützen entfernen.

### Ergebniserfassung (Vereinsvertreter und Mannschaftsführer)
Pfad: `/verein/ergebnisse`.
*   **Vereinskontext:** Falls mehrere Vereine zugewiesen, Auswahl des Vereins (`activeClubIdForEntry`), für dessen Ligen Ergebnisse erfasst werden sollen.
*   **Saisonauswahl:** Nur "Laufende" Saisons.
*   **Ligaauswahl:** Nur Ligen, in denen der `activeClubIdForEntry` im gewählten Wettkampfjahr Mannschaften gemeldet hat.
*   **Mannschaftsauswahl:** Alle Mannschaften der ausgewählten Liga (eigene und gegnerische), damit Ergebnisse für Begegnungen eingetragen werden können.
*   **Schützenauswahl:** Schützen der ausgewählten Mannschaft.
*   Die weitere Erfassungslogik (Zwischenspeicher-Liste, Speichern, Validierung, Schütze verschwindet aus Dropdown) ist identisch zur Admin-Ergebniserfassung. Die `clubId` im Ergebnisdokument ist die des Teams, für das das Ergebnis eingetragen wird. Der `enteredByUserId` ist der des eingeloggten Benutzers.

## 5. Öffentliche Ansichten

### RWK Tabellen
Die RWK-Tabellen zeigen die aktuellen Ranglisten.
*   **Filter:** Auswahl von Wettkampfjahr (dynamisch aus vorhandenen Saisons mit Status "Laufend") und UI-Disziplin (Kleinkaliber, Luftdruck). Das aktuellste Jahr mit laufenden Saisons wird standardmäßig ausgewählt.
*   **Anzeige:** Zeigt nur Ligen von Saisons mit Status "Laufend". Die Ligen sind standardmäßig aufgeklappt.
*   **Mannschaftsrangliste:** Tabellarische Übersicht der Ligen mit Mannschaften, deren Rundenergebnissen, Gesamtergebnis und Schnitt. Mannschaften können aufgeklappt werden, um Einzelergebnisse der Schützen zu sehen. Schützennamen in dieser Detailansicht sind klickbar und öffnen einen Statistik-Dialog.
*   **Einzelschützenrangliste:** Tabellarische Übersicht aller Schützen der ausgewählten Saison/Disziplin, sortiert nach Gesamtleistung, mit Anzeige der Rundenergebnisse, Gesamt und Schnitt.
*   **Bester Schütze / Beste Dame:** Werden hervorgehoben.
*   **Detailansicht Schütze:** Klick auf einen Schützennamen (in Einzelrangliste oder Mannschaftsdetails) öffnet einen Dialog mit dessen Detailergebnissen und einem Leistungsdiagramm.

### Letzte Änderungen (Startseite)
Die Startseite zeigt die neuesten Aktualisierungen an, wenn Ergebnisse für Ligen hinzugefügt wurden (gruppiert pro Liga, Tag, Disziplin und Jahr). Jeder Eintrag ist direkt zur entsprechenden Liga in den RWK-Tabellen verlinkt.

### Updates & Changelog
Listet die Versionshistorie der Anwendung mit den wichtigsten Änderungen und Neuerungen auf.

### Impressum
Enthält die rechtlich notwendigen Angaben zum Betreiber der Webseite.

## 6. Support

### Support-Ticket erstellen
Ein Formular, um Fragen, Probleme oder Anregungen an den Administrator zu senden. Die Nachrichten werden in einer Datenbank (`support_tickets`) gespeichert und können vom Administrator eingesehen werden. Ein Hinweis zur Sicherung von Screenshots bei Problemen ist enthalten.

---
*Dieses Handbuch wird parallel zur Entwicklung der Anwendung aktualisiert.*
