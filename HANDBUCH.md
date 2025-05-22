
# Benutzerhandbuch RWK Einbeck App

Dieses Handbuch beschreibt die Funktionen und die Bedienung der Rundenwettkampf (RWK) App für den Kreisschützenverband Einbeck. (Stand: 22. Mai 2025)

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
    *   [Mannschaftsverwaltung (nur Vereinsvertreter)](#mannschaftsverwaltung-vv)
        *   [Umgang mit Einzelschützen (ohne volle Mannschaft)](#umgang-mit-einzelschuetzen-vv)
    *   [Schützenverwaltung (nur Vereinsvertreter)](#schuetzenverwaltung-vv)
    *   [Ergebniserfassung (Vereinsvertreter und Mannschaftsführer)](#ergebniserfassung-vvmf)
5.  [Öffentliche Ansichten](#oeffentliche-ansichten)
    *   [RWK Tabellen](#rwk-tabellen)
    *   [Letzte Änderungen (Startseite)](#letzte-aenderungen-startseite)
    *   [Updates & Changelog](#updates--changelog)
    *   [Impressum](#impressum)
    *   [RWK-Ordnung](#rwk-ordnung)
6.  [Support](#support)
    *   [Support-Ticket erstellen](#support-ticket-erstellen)

---

## 1. Einleitung

### Zweck der Anwendung
Die RWK Einbeck App dient zur digitalen Verwaltung und übersichtlichen Darstellung der Rundenwettkämpfe des Kreisschützenverbandes Einbeck. Sie ermöglicht die Pflege wichtiger Daten (wie Saisons, Ligen, Vereine, Mannschaften und Schützen), die einfache Erfassung von Ergebnissen sowie die Anzeige von aktuellen Tabellen und Ranglisten.

### Zielgruppen
*   **Super-Administratoren (Rundenwettkampfleiter):** Verantwortlich für die Gesamtverwaltung der Anwendung. Dazu gehört das Anlegen von Wettkampfsaisons, Ligen und Vereinen, die Zuweisung von Mannschaften zu den Ligen und die Verwaltung der Benutzerzugänge und -rechte.
*   **Vereinsvertreter:** Zuständig für die Verwaltung der Mannschaften und Schützen ihres Vereins. Sie können Ergebnisse für die Wettkämpfe ihres Vereins erfassen sowie Mannschaften und Schützen für ihren Verein anlegen und bearbeiten.
*   **Mannschaftsführer:** Hauptsächlich verantwortlich für die Erfassung von Ergebnissen für die Ligen, an denen die Mannschaften ihres Vereins teilnehmen. Sie können die Stammdaten ihres Vereins einsehen, aber keine Mannschaften oder Schützen anlegen oder ändern.
*   **Öffentlichkeit/Schützen:** Alle Interessierten können die aktuellen Tabellen, Ergebnisse, die RWK-Ordnung und weitere Informationen rund um die Rundenwettkämpfe einsehen.

## 2. Erste Schritte

### Login
Der Zugang zur App erfolgt über die Login-Seite mittels E-Mail-Adresse und Passwort.

### Benutzerkonten & Rollen
*   Benutzerkonten für Vereinsvertreter und Mannschaftsführer werden **ausschließlich vom Super-Administrator manuell angelegt**. Eine Selbstregistrierung ist nicht vorgesehen.
*   Der Super-Administrator weist jedem Benutzer im Verwaltungsbereich der App eine **Rolle** (z.B. "Vereinsvertreter" oder "Mannschaftsführer") und den zugehörigen **Verein** (oder bei Bedarf mehrere Vereine) zu. Diese Zuweisungen bestimmen, welche Funktionen und Daten der Benutzer in der App sehen und bearbeiten kann.
*   Ein **Vereinsvertreter** hat erweiterte Rechte zur Verwaltung von Mannschaften und Schützen seines Vereins.
*   Ein **Mannschaftsführer** kann primär Ergebnisse für die Ligen eintragen, in denen Mannschaften seines Vereins teilnehmen.
*   Es ist geplant, Benutzer beim ersten Login zur Änderung ihres initialen Passworts aufzufordern (diese Funktion ist noch in Entwicklung).

## 3. Für Super-Administratoren
(Dieser Abschnitt ist nur im Handbuch sichtbar, wenn der Super-Admin eingeloggt ist)

Das Admin-Panel ist die zentrale Steuerungsinstanz für den Super-Administrator.

### Dashboard Übersicht (Admin)
Bietet eine zentrale Übersicht über die Verwaltungsfunktionen und eine Agenda für offene Punkte und geplante Features (Roadmap).

### Saisonverwaltung
Hier können neue Wettkampfsaisons (z.B. "RWK 2025 Kleinkaliber") mit Jahr, Disziplin (Kleinkaliber, Luftdruck) und Status (Geplant, Laufend, Abgeschlossen) erstellt, bearbeitet und gelöscht werden. Der Status "Laufend" ist entscheidend für die Sichtbarkeit in den öffentlichen RWK-Tabellen und die Ergebniserfassung.

### Ligaverwaltung
Nach Auswahl einer Saison können hier Ligen (z.B. Kreisoberliga) angelegt werden. Der spezifische Disziplintyp (z.B. KKG, LGA, LP Freihand) muss aus einer Liste ausgewählt werden. Ligen können bearbeitet und gelöscht werden.

### Vereinsverwaltung
Ermöglicht das Anlegen, Bearbeiten und Löschen von Vereinen mit Name, Kürzel und Vereinsnummer. Eine Prüfung auf doppelte Vereinsnamen ist implementiert.

### Mannschaftsverwaltung (Admin)
Der Super-Admin kann hier alle Mannschaften verwalten.
*   **Filter:** Saison, Verein und Liga auswählen, um Mannschaften zu filtern. Wichtig: Um Mannschaften zu finden, die noch keiner Liga zugewiesen sind (z.B. von Vereinsvertretern neu angelegte), Saison und Verein auswählen und den Liga-Filter auf "Alle Ligen" lassen.
*   **Anlegen/Bearbeiten:** Mannschaften erstellen oder bearbeiten. Hier erfolgt die **Zuweisung einer Mannschaft zu einer spezifischen Liga** oder die Änderung dieser Zuweisung. Kontaktdaten des Mannschaftsführers (Name, E-Mail, Telefon - optional) können erfasst werden. Ein Hinweis erinnert an die korrekte Benennung nach Spielstärke (I, II, ...).
*   **Schützen zuweisen:** Schützen den Teams zuordnen (maximal 3 pro Team; Regel: ein Schütze pro Saison und spezifischer Disziplin nur in einem Team).

### Schützenverwaltung (Admin)
Verwaltung aller Schützen.
*   **Filter:** Nach Verein filtern.
*   **Anlegen/Bearbeiten:** Schützen mit Vorname, Nachname, Geschlecht und Vereinszugehörigkeit anlegen oder ändern. Beim Anlegen können Schützen direkt Mannschaften zugeordnet werden (Beachtung der Regeln für maximale Schützenzahl und Disziplin-Beschränkungen).
*   **Mannschaftszuordnung (Info):** In der Schützenliste wird angezeigt, welchen Mannschaften ein Schütze zugeordnet ist.

### Ergebniserfassung (Admin)
Erfassung von Ergebnissen für alle Ligen.
*   **Auswahl:** Nur Saisons mit Status "Laufend", Liga, Durchgang, Mannschaft, Schütze. Die Reihenfolge der Auswahlfelder wurde optimiert (Durchgang vor Mannschaft).
*   **Eingabe:** Ringergebnis (mit Prüfung auf Maximalwert je nach Disziplin), Ergebnistyp (Regulär, Vorschießen, Nachschießen).
*   **Zwischenspeicher:** Ergebnisse werden gesammelt ("Zur Liste hinzufügen"), bevor sie endgültig gespeichert werden. Bereits erfasste Schützen/Durchgänge werden im Dropdown nicht mehr angeboten (auch nach Neuladen der Seite oder wenn Ergebnisse bereits in der Datenbank sind). Die Liste der vorgemerkten Ergebnisse bleibt auch beim Wechsel der Mannschaft (im gleichen Durchgang/Liga/Saison) erhalten.
*   **Speichern:** Schreibt Ergebnisse in die Datenbank und erstellt/aktualisiert einen Eintrag für den "Letzte Änderungen"-Feed auf der Startseite.

### Ergebnisse bearbeiten/löschen (Admin)
Ermöglicht die Suche, Bearbeitung (Ringzahl, Typ) und das Löschen von bereits erfassten Ergebnissen. Änderungen werden mit Benutzer und Zeitstempel versehen.

### Benutzerverwaltung (Admin - Rechtevergabe)
Der Super-Administrator legt Benutzerkonten **manuell in der Firebase Konsole (Bereich "Authentication")** an (E-Mail, initiales Passwort). Anschließend weist er diesen Benutzern (identifiziert durch ihre eindeutige Benutzer-ID, die er aus der Konsole entnimmt und in der App eingibt) auf dieser Seite in der App eine Rolle ("vereinsvertreter", "mannschaftsfuehrer") und den zugehörigen Verein (oder bis zu 3 Vereine) zu. Diese Berechtigungen werden sicher in der Datenbank gespeichert. Die Eingabe von E-Mail und Anzeigenamen des Benutzers in der App dient der Referenz und Vervollständigung der gespeicherten Berechtigungsdaten.

### Support Tickets einsehen (Admin)
Zeigt eine Liste aller über das Support-Formular eingegangenen Tickets an. Der Status der Tickets (Neu, In Bearbeitung, Gelesen, Geschlossen) kann hier verwaltet werden.

### Agenda / Offene Punkte (Admin)
Eine Liste geplanter Features und offener Aufgaben im Admin-Dashboard, strukturiert nach potenziellen Versionen, um den Entwicklungsfortschritt zu verfolgen.

## 4. Für Vereinsvertreter und Mannschaftsführer

Nach dem Login mit den vom Super-Admin bereitgestellten Zugangsdaten erhält der Benutzer Zugriff auf den "Mein Verein"-Bereich, sofern ihm eine Rolle und mindestens ein Verein zugewiesen wurden.

### Zugriff und Vereinskontext (VV/MF)
Die angezeigten Daten und Bearbeitungsmöglichkeiten sind auf den/die Verein(e) beschränkt, der/die dem eingeloggten Benutzer zugewiesen ist/sind. Die App prüft diese Berechtigungen, um den Zugriff zu steuern. Wenn einem Benutzer mehrere Vereine zugewiesen sind, erscheint auf den relevanten Verwaltungsseiten (Mannschaften, Schützen, Ergebnisse) ein Dropdown zur Auswahl des aktuell zu bearbeitenden Vereins.

### Dashboard Übersicht (VV/MF)
Zeigt eine Begrüßung, die zugewiesene Rolle ("Vereinsvertreter" oder "Mannschaftsführer") und den Namen des/der Vereins/e an, für den/die der Benutzer zuständig ist.

### Mannschaftsverwaltung (nur Vereinsvertreter)
Diese Funktion ist nur für Benutzer mit der Rolle "vereinsvertreter" verfügbar. Mannschaftsführer sehen die Liste ihrer Mannschaften, können aber keine Änderungen vornehmen oder neue anlegen (entsprechende Schaltflächen sind ausgeblendet).
*   **Vereinsauswahl (falls zutreffend):** Wenn dem VV mehrere Vereine zugewiesen sind, wählt er hier den Verein, für den er Mannschaften verwalten möchte.
*   **Saisonauswahl:** Der VV wählt eine vom Super-Admin angelegte Saison aus.
*   **Anzeige:** Mannschaften des ausgewählten Vereins für die gewählte Saison.
*   **Anlegen (VV):** Neue Mannschaften für den eigenen Verein und die gewählte Saison erstellen. **Die Zuweisung zu einer spezifischen Liga erfolgt ausschließlich durch den Super-Admin.** Name und Mannschaftsführer-Kontaktdaten können erfasst werden. Ein Hinweis erinnert an die korrekte Benennung nach Spielstärke (I, II, ...).
*   **Bearbeiten (VV):** Namen von Mannschaften und Mannschaftsführer-Kontaktdaten ändern.
*   **Schützen zuweisen (VV):** Schützen des eigenen Vereins können den Mannschaften zugeordnet werden (max. 3 pro Team; Regel "Ein Schütze pro Saison/spezifischer Disziplin nur in einem Team" wird geprüft, falls das Team bereits einer Liga mit einem Disziplintyp zugeordnet wurde).
*   **Löschen (VV):** Eigene Mannschaften entfernen.

#### Umgang mit Einzelschützen (ohne volle Mannschaft) durch Vereinsvertreter
Wenn ein Verein nicht genügend Schützen (also weniger als drei) für eine vollständige Mannschaft in einer Disziplin hat, diese aber dennoch am Rundenwettkampf teilnehmen sollen (um in der Einzelwertung berücksichtigt zu werden), geht der Vereinsvertreter wie folgt vor:
1.  Auf der Seite "Meine Mannschaften" eine neue Mannschaft anlegen.
2.  Als Mannschaftsnamen eine Bezeichnung wählen, die klar auf Einzelstarter hinweist, z.B. "**Vereinsname Einzel**" (Beispiel: "SV Mackensen Einzel").
3.  Dieser "Einzel"-Mannschaft dann die 1 oder 2 Schützen zuweisen.
Die App filtert Mannschaften, deren Name "Einzel" enthält, automatisch aus der Mannschafts-Rangliste in den RWK-Tabellen heraus. Die Ergebnisse dieser Schützen fließen aber in die Einzelschützen-Rangliste ein.

### Schützenverwaltung (nur Vereinsvertreter)
Diese Funktion ist nur für Benutzer mit der Rolle "vereinsvertreter" verfügbar. Mannschaftsführer können Schützenlisten einsehen, aber keine Änderungen vornehmen.
*   **Vereinsauswahl (falls zutreffend):** Auswahl des Vereinskontexts.
*   **Anzeige:** Schützen des ausgewählten/zugewiesenen Vereins.
*   **Anlegen (VV):** Neue Schützen für den eigenen Verein erstellen (Nachname, Vorname, Geschlecht). Die Zuordnung zu Mannschaften erfolgt über die Seite "Meine Mannschaften".
*   **Bearbeiten/Löschen (VV):** Stammdaten eigener Schützen ändern oder Schützen entfernen.

### Ergebniserfassung (Vereinsvertreter und Mannschaftsführer)
*   **Vereinsauswahl (falls zutreffend):** Auswahl des Vereinskontexts, für dessen Ligen Ergebnisse erfasst werden sollen.
*   **Saisonauswahl:** Nur Saisons mit Status "Laufend".
*   **Ligaauswahl:** Nur Ligen, in denen der ausgewählte/zugewiesene Verein im gewählten Wettkampfjahr Mannschaften gemeldet hat.
*   **Mannschaftsauswahl:** Alle Mannschaften der ausgewählten Liga (eigene und gegnerische), damit Ergebnisse für Begegnungen eingetragen werden können.
*   **Schützenauswahl:** Schützen der ausgewählten Mannschaft.
*   Die weitere Erfassungslogik (Zwischenspeicher-Liste, Speichern, Validierung, Schütze verschwindet aus Dropdown) ist identisch zur Admin-Ergebniserfassung. Die Vereins-ID im Ergebnisdokument ist die des Teams, für das das Ergebnis eingetragen wird. Der Erfasser wird ebenfalls gespeichert.

## 5. Öffentliche Ansichten

### RWK Tabellen
Die RWK-Tabellen zeigen die aktuellen Ranglisten.
*   **Filter:** Auswahl von Wettkampfjahr (dynamisch aus vorhandenen Saisons mit Status "Laufend") und Disziplin (Kleinkaliber, Luftdruck). Das aktuellste Jahr mit laufenden Saisons wird standardmäßig ausgewählt. Bei Klick auf einen Link aus dem "Letzte Änderungen"-Feed werden Jahr, Disziplin und Liga vorausgewählt und die Liga direkt geöffnet.
*   **Anzeige:** Zeigt nur Ligen von Saisons mit Status "Laufend". Die Ligen sind standardmäßig aufgeklappt, können aber einzeln geschlossen werden.
*   **Mannschaftsrangliste:** Tabellarische Übersicht der Ligen mit Mannschaften, deren Rundenergebnissen, Gesamtergebnis und Schnitt. Mannschaften, deren Name "Einzel" enthält, werden hier nicht aufgeführt. Mannschaften können aufgeklappt werden, um Einzelergebnisse der Schützen zu sehen. Schützennamen in dieser Detailansicht sind klickbar und öffnen einen Statistik-Dialog mit Leistungsdiagramm.
*   **Einzelschützenrangliste:** Tabellarische Übersicht aller Schützen der ausgewählten Saison/Disziplin, sortiert nach Gesamtleistung, mit Anzeige der Rundenergebnisse, Gesamt und Schnitt. Optional kann über ein Dropdown nach einer spezifischen Liga gefiltert werden, um nur deren Einzelschützen anzuzeigen.
*   **Bester Schütze / Beste Dame:** Werden für den gesamten ausgewählten Wettbewerb (Jahr/Disziplin) hervorgehoben.
*   **Detailansicht Schütze:** Klick auf einen Schützennamen öffnet einen Dialog mit dessen Detailergebnissen und einem Leistungsdiagramm.

### Letzte Änderungen (Startseite)
Die Startseite zeigt die neuesten Aktualisierungen an, wenn Ergebnisse für Ligen hinzugefügt wurden (gruppiert pro Liga, Tag, Disziplin und Jahr). Jeder Eintrag ist direkt zur entsprechenden Liga in den RWK-Tabellen verlinkt.

### Updates & Changelog
Listet die Versionshistorie der Anwendung mit den wichtigsten Änderungen und Neuerungen auf. Die Einträge sind benutzerfreundlich formuliert.

### Impressum
Enthält die rechtlich notwendigen Angaben zum Betreiber der Webseite.

### RWK-Ordnung
Eine eigene Seite zeigt den Inhalt der Rundenwettkampfordnung an oder verlinkt auf das entsprechende Dokument.

## 6. Support

### Support-Ticket erstellen
Ein Formular, um Fragen, Probleme oder Anregungen an den Administrator zu senden. Die Nachrichten werden sicher gespeichert und können vom Administrator eingesehen werden. Ein Hinweis zur Sicherung von Screenshots bei Problemen ist enthalten.

---
*Dieses Handbuch wird parallel zur Entwicklung der Anwendung aktualisiert.*
