# Benutzerhandbuch RWK Einbeck App

Dieses Handbuch beschreibt die Funktionen und die Bedienung der Rundenwettkampf (RWK) App für den Kreisschützenverband Einbeck.

## Inhaltsverzeichnis

1.  [Einleitung](#einleitung)
    *   [Zweck der Anwendung](#zweck-der-anwendung)
    *   [Zielgruppen](#zielgruppen)
2.  [Erste Schritte](#erste-schritte)
    *   [Login](#login)
3.  [Für Super-Administratoren](#für-super-administratoren)
    *   [Dashboard Übersicht](#dashboard-übersicht-admin)
    *   [Saisonverwaltung](#saisonverwaltung)
    *   [Ligaverwaltung](#ligaverwaltung)
    *   [Vereinsverwaltung](#vereinsverwaltung)
    *   [Mannschaftsverwaltung (Admin)](#mannschaftsverwaltung-admin)
        *   [Mannschaften anlegen/bearbeiten](#mannschaften-anlegenbearbeiten-admin)
        *   [Mannschaftsführer-Kontaktdaten](#mannschaftsführer-kontaktdaten)
        *   [Schützen einer Mannschaft zuweisen](#schützen-einer-mannschaft-zuweisen-admin)
        *   [Mannschaften einer Liga zuweisen](#mannschaften-einer-liga-zuweisen-admin)
    *   [Schützenverwaltung (Admin)](#schützenverwaltung-admin)
    *   [Ergebniserfassung (Admin)](#ergebniserfassung-admin)
    *   [Ergebnisse bearbeiten/löschen (Admin)](#ergebnisse-bearbeitenlöschen-admin)
    *   [Benutzerverwaltung](#benutzerverwaltung)
        *   [Benutzer manuell in Firebase Auth anlegen](#benutzer-manuell-in-firebase-auth-anlegen)
        *   [Rollen und Vereinszugehörigkeiten zuweisen](#rollen-und-vereinszugehörigkeiten-zuweisen)
    *   [Support Tickets einsehen](#support-tickets-einsehen)
    *   [Agenda / Offene Punkte](#agenda--offene-punkte)
4.  [Für Vereinsvertreter](#für-vereinsvertreter)
    *   [Dashboard Übersicht](#dashboard-übersicht-vv)
    *   [Vereinsauswahl (falls mehrere Vereine zugewiesen)](#vereinsauswahl-vv)
    *   [Mannschaftsverwaltung (VV)](#mannschaftsverwaltung-vv)
        *   [Mannschaften für eigenen Verein anlegen/bearbeiten](#mannschaften-anlegenedit-vv)
        *   [Mannschaftsführer-Kontaktdaten (VV)](#mannschaftsführer-kontaktdaten-vv)
        *   [Schützen des eigenen Vereins zuweisen](#schützen-zuweisen-vv)
    *   [Schützenverwaltung (VV)](#schützenverwaltung-vv)
    *   [Ergebniserfassung (VV)](#ergebniserfassung-vv)
5.  [Öffentliche Ansichten](#öffentliche-ansichten)
    *   [RWK Tabellen](#rwk-tabellen)
    *   [Letzte Änderungen (Startseite)](#letzte-änderungen-startseite)
    *   [Updates & Changelog](#updates--changelog)
6.  [Support](#support)
    *   [Support-Ticket erstellen](#support-ticket-erstellen)

---

## 1. Einleitung

### Zweck der Anwendung
Die RWK Einbeck App dient zur Verwaltung und Darstellung der Rundenwettkämpfe des Kreisschützenverbandes Einbeck. Sie ermöglicht die Pflege von Stammdaten, die Erfassung von Ergebnissen und die Anzeige von Tabellen und Ranglisten.

### Zielgruppen
*   **Super-Administratoren:** Verantwortlich für die Gesamtverwaltung der Anwendung, Anlage von Saisons, Ligen, Vereinen und die Zuweisung von Benutzerrechten.
*   **Vereinsvertreter/Mannschaftsführer:** Verantwortlich für die Verwaltung der Mannschaften und Schützen ihres Vereins sowie die Erfassung von Ergebnissen.
*   **Öffentlichkeit/Schützen:** Können Tabellen, Ergebnisse und aktuelle Informationen einsehen.

## 2. Erste Schritte

### Login
Der Login erfolgt über die "/login"-Seite mit den vom Super-Administrator bereitgestellten Zugangsdaten (E-Mail und Passwort).

## 3. Für Super-Administratoren

### Dashboard Übersicht (Admin)
Das Admin-Dashboard (erreichbar über den Link "Admin Panel" in der Hauptnavigation nach Login als Super-Admin) bietet eine zentrale Übersicht über die Verwaltungsfunktionen.

### Saisonverwaltung
Pfad: `/admin/seasons`
*   **Anlegen:** Neue Wettkampfsaisons (z.B. "RWK 2025 Kleinkaliber") mit Jahr, Disziplintyp (Kleinkaliber, Luftdruck) und Status (Geplant, Laufend, Abgeschlossen) erstellen.
*   **Bearbeiten:** Bestehende Saisondaten ändern.
*   **Löschen:** Saisons entfernen (Vorsicht: Auswirkungen auf zugehörige Ligen und Daten).
*   **Navigation:** Von hier aus können direkt die Ligen einer Saison verwaltet werden.

### Ligaverwaltung
Pfad: `/admin/leagues`
*   **Vorauswahl:** Zuerst eine Saison auswählen.
*   **Anlegen:** Neue Ligen (z.B. Kreisoberliga, Kreisliga) für die ausgewählte Saison erstellen. Der spezifische Disziplintyp (z.B. KKG, LGA) muss ausgewählt werden.
*   **Bearbeiten/Löschen:** Bestehende Ligen ändern oder entfernen.
*   **Navigation:** Von hier aus können direkt die Mannschaften einer Liga verwaltet werden.

### Vereinsverwaltung
Pfad: `/admin/clubs`
*   **Anlegen:** Neue Vereine mit Name, Kürzel und Vereinsnummer (Format 08-XXX) erfassen.
*   **Bearbeiten/Löschen:** Vereinsdaten ändern oder Vereine entfernen.
*   **Prüfung:** Verhindert das Anlegen von Vereinen mit identischem Namen.

### Mannschaftsverwaltung (Admin)
Pfad: `/admin/teams`
*   **Filter:** Saison, Verein und Liga auswählen, um die anzuzeigenden Mannschaften zu filtern. Wichtig, um "liga-lose" Mannschaften eines Vereins für eine Saison zu finden.
*   **Anlegen:** Neue Mannschaften erstellen. Der Verein wird aus der Liste der existierenden Vereine ausgewählt. Die Saison wird übernommen. Die Liga kann hier zugewiesen werden.
*   **Bearbeiten:** Mannschaftsname, Ligazugehörigkeit und Mannschaftsführer-Kontaktdaten ändern.
*   **Mannschaftsführer-Kontaktdaten:** Name, E-Mail und Telefon des Mannschaftsführers können optional erfasst werden.
*   **Schützen zuweisen:** Bestehende Schützen (die dem Verein der Mannschaft angehören) können der Mannschaft zugeordnet werden (max. 3). Die Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" wird geprüft.
*   **Löschen:** Mannschaften entfernen.

### Schützenverwaltung (Admin)
Pfad: `/admin/shooters`
*   **Filter:** Nach Verein filtern.
*   **Anlegen:** Neue Schützen mit Vorname, Nachname, Geschlecht und Vereinszugehörigkeit erstellen. Direkte Zuweisung zu Mannschaften ist möglich (unter Beachtung der Regeln).
*   **Bearbeiten/Löschen:** Schützendaten ändern oder Schützen entfernen.
*   **Prüfung:** Verhindert das Anlegen von Schützen mit identischem vollen Namen im selben Verein.

### Ergebniserfassung (Admin)
Pfad: `/admin/results`
*   **Auswahl:** Saison (nur "Laufend"), Liga, Mannschaft, Durchgang und Schütze auswählen.
*   **Eingabe:** Ringergebnis und Ergebnistyp (Regulär, Vorschießen, Nachschießen) eintragen.
*   **Validierung:** Ringzahlen werden auf Plausibilität geprüft (nicht negativ, Maximalwert je nach Disziplin).
*   **Liste:** Ergebnisse werden vor dem endgültigen Speichern in einer Liste gesammelt.
*   **Speichern:** Alle gesammelten Ergebnisse werden in die Datenbank geschrieben. Bereits für einen Durchgang/Schützen erfasste Ergebnisse werden im Dropdown nicht mehr angeboten.
*   **"Letzte Änderungen"-Feed:** Erfolgreich gespeicherte Ergebnisse erstellen/aktualisieren einen Eintrag für die Startseite (gruppiert nach Liga/Tag).

### Ergebnisse bearbeiten/löschen (Admin)
Pfad: `/admin/edit-results`
*   **Filter:** Ergebnisse nach Saison, Liga, Mannschaft, Schütze, Durchgang suchen.
*   **Anzeige:** Gefundene Ergebnisse in einer Tabelle.
*   **Bearbeiten:** Ringzahl und Ergebnistyp eines Ergebnisses können geändert werden. Die Änderungshistorie (wer, wann) wird gespeichert.
*   **Löschen:** Ergebnisse können endgültig gelöscht werden.

### Benutzerverwaltung
Pfad: `/admin/user-management`
*   **Aktueller Stand (ohne Cloud Functions für User-Erstellung/Rechte-Abruf):**
    1.  Der Super-Admin legt neue Benutzer **manuell in der Firebase Authentication Konsole** an (E-Mail, initiales Passwort). Die UID des neuen Benutzers muss notiert werden.
    2.  Auf dieser Seite trägt der Super-Admin die **UID, E-Mail und den Anzeigenamen** des Benutzers ein.
    3.  Eine **Rolle** ("vereinsvertreter" oder "mannschaftsfuehrer") und bis zu **drei Vereine** können zugewiesen werden.
    4.  Beim Speichern wird ein Dokument in der `user_permissions`-Collection in Firestore erstellt/aktualisiert.
*   **Zukünftige Entwicklung (mit Cloud Functions, aktuell auf Eis):**
    *   Direktes Anlegen von Firebase Auth-Benutzern aus der UI.
    *   Automatisches Setzen von Custom Claims (`role`, `clubIds`).
    *   Anzeige von "Nutzern ohne zugewiesene Rolle".
*   **Wichtig:** Die Firestore-Sicherheitsregeln müssen so konfiguriert sein, dass nur der Super-Admin Schreibzugriff auf `user_permissions` hat.

### Support Tickets einsehen
Pfad: `/admin/support-tickets`
*   Zeigt eine Liste aller über das Support-Formular eingegangenen Tickets an, sortiert nach Datum.
*   Aktuell reine Anzeige-Funktion.

### Agenda / Offene Punkte
Diese Sektion im Admin-Dashboard listet geplante Features und offene Aufgaben für die Weiterentwicklung der App.

## 4. Für Vereinsvertreter

Nach dem Login mit den vom Super-Admin bereitgestellten Zugangsdaten und der Zuweisung der Rolle "vereinsvertreter" sowie der Vereinszugehörigkeit(en) in der Benutzerverwaltung, erhält der Vereinsvertreter Zugriff auf den "Mein Verein"-Bereich.

### Dashboard Übersicht (VV)
Pfad: `/verein/dashboard`
*   Zeigt eine Begrüßung und die Namen der Vereine an, für die der VV zuständig ist.

### Vereinsauswahl (falls mehrere Vereine zugewiesen)
Wenn einem VV mehrere Vereine zugewiesen sind, erscheint auf den Seiten "Meine Mannschaften", "Meine Schützen" und "Ergebnisse erfassen" oben ein Dropdown, um den Verein auszuwählen, für den aktuell Aktionen durchgeführt werden sollen.

### Mannschaftsverwaltung (VV)
Pfad: `/verein/mannschaften`
*   **Kontext:** Alle Aktionen beziehen sich auf den ausgewählten/zugewiesenen Verein.
*   **Saisonauswahl:** Der VV wählt eine vom Super-Admin angelegte Saison aus.
*   **Anzeige:** Mannschaften des eigenen Vereins für die gewählte Saison.
*   **Anlegen:** Neue Mannschaften für den eigenen Verein und die gewählte Saison erstellen. **Die Zuweisung zu einer spezifischen Liga erfolgt durch den Super-Admin.**
*   **Bearbeiten:** Namen von Mannschaften und Mannschaftsführer-Kontaktdaten ändern.
*   **Schützen zuweisen:** Schützen des eigenen Vereins können den Mannschaften zugeordnet werden (max. 3, Regel "Ein Schütze pro Saison/Disziplin nur in einem Team" wird geprüft, falls Team schon Ligatyp hat).
*   **Löschen:** Eigene Mannschaften entfernen.

### Schützenverwaltung (VV)
Pfad: `/verein/schuetzen`
*   **Kontext:** Alle Aktionen beziehen sich auf den ausgewählten/zugewiesenen Verein.
*   **Anzeige:** Schützen des eigenen Vereins.
*   **Anlegen:** Neue Schützen für den eigenen Verein erstellen (Vorname, Nachname, Geschlecht). Eine direkte Mannschaftszuordnung beim Anlegen erfolgt hier nicht, sondern über die Mannschaftsverwaltungsseite.
*   **Bearbeiten/Löschen:** Stammdaten eigener Schützen ändern oder Schützen entfernen.

### Ergebniserfassung (VV)
Pfad: `/verein/ergebnisse`
*   **Kontext:** Bezug auf den ausgewählten/zugewiesenen Verein.
*   **Saisonauswahl:** Nur "Laufende" Saisons.
*   **Ligaauswahl:** Nur Ligen, in denen der eigene Verein im gewählten Wettkampfjahr Mannschaften gemeldet hat.
*   **Mannschaftsauswahl:** Alle Mannschaften der ausgewählten Liga (eigene und gegnerische), damit Ergebnisse für Begegnungen eingetragen werden können.
*   **Schützenauswahl:** Schützen der ausgewählten Mannschaft.
*   Die weitere Erfassungslogik (Liste, Speichern, Validierung) ist identisch zur Admin-Ergebniserfassung. Die `clubId` im Ergebnisdokument ist die des Teams, für das das Ergebnis eingetragen wird.

## 5. Öffentliche Ansichten

### RWK Tabellen
Pfad: `/rwk-tabellen`
*   **Filter:** Auswahl von Wettkampfjahr und Disziplin (Kleinkaliber, Luftdruck).
*   **Anzeige:** Zeigt nur Ligen von Saisons mit Status "Laufend".
*   **Mannschaftsrangliste:** Tabellarische Übersicht der Ligen mit Mannschaften, deren Rundenergebnissen, Gesamtergebnis und Schnitt. Mannschaften können aufgeklappt werden, um Einzelergebnisse der Schützen zu sehen.
*   **Einzelschützenrangliste:** Tabellarische Übersicht aller Schützen der ausgewählten Saison/Disziplin, sortiert nach Gesamtleistung, mit Anzeige der Rundenergebnisse, Gesamt und Schnitt.
*   **Bester Schütze / Beste Dame:** Werden hervorgehoben.
*   **Detailansicht Schütze:** Klick auf einen Schützennamen öffnet einen Dialog mit dessen Detailergebnissen und einem Leistungsdiagramm.

### Letzte Änderungen (Startseite)
Pfad: `/` (Startseite)
*   Zeigt die neuesten Aktualisierungen an, wenn Ergebnisse für Ligen hinzugefügt wurden (gruppiert pro Liga und Tag, mit Angabe der Disziplin).

### Updates & Changelog
Pfad: `/updates`
*   Listet die Versionshistorie der Anwendung mit den wichtigsten Änderungen und Neuerungen auf.

## 6. Support

### Support-Ticket erstellen
Pfad: `/support`
*   Ein Formular, um Fragen, Probleme oder Anregungen an den Administrator zu senden.
*   Die Nachrichten werden in einer Datenbank gespeichert und können vom Administrator eingesehen werden.

---
*Dieses Handbuch wird parallel zur Entwicklung der Anwendung aktualisiert.*
