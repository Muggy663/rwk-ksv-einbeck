// src/app/handbuch/page.tsx
"use client"; 

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookOpenCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth'; 

const ADMIN_EMAIL = "admin@rwk-einbeck.de";

export default function HandbuchPage() {
  const { user, loading } = useAuth(); 

  // Calculate isSuperAdmin only after loading is false and user is determined
  const isSuperAdmin = !loading && user?.email === ADMIN_EMAIL;

  return (
    <div className="space-y-8 container mx-auto px-4 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <BookOpenCheck className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Benutzerhandbuch RWK Einbeck App</h1>
          <p className="text-lg text-muted-foreground">
            Funktionen und Bedienung der Rundenwettkampf (RWK) App.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle id="inhaltsverzeichnis" className="text-2xl text-accent scroll-mt-24">Inhaltsverzeichnis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <ul className="list-disc list-inside pl-4 space-y-1">
                <li><a href="#einleitung" className="text-primary hover:underline">1. Einleitung</a>
                    <ul className="list-circle list-inside pl-6 text-xs">
                        <li><a href="#zweck-der-anwendung" className="text-primary hover:underline">Zweck der Anwendung</a></li>
                        <li><a href="#zielgruppen" className="text-primary hover:underline">Zielgruppen</a></li>
                    </ul>
                </li>
                <li><a href="#erste-schritte" className="text-primary hover:underline">2. Erste Schritte</a>
                    <ul className="list-circle list-inside pl-6 text-xs">
                        <li><a href="#login" className="text-primary hover:underline">Login</a></li>
                        <li><a href="#benutzerkonten-rollen" className="text-primary hover:underline">Benutzerkonten & Rollen</a></li>
                    </ul>
                </li>
                {isSuperAdmin && ( 
                  <li><a href="#fuer-super-administratoren" className="text-primary hover:underline">3. Für Super-Administratoren</a>
                    <ul className="list-circle list-inside pl-6 text-xs">
                        <li><a href="#dashboard-uebersicht-admin" className="text-primary hover:underline">Dashboard Übersicht</a></li>
                        <li><a href="#saisonverwaltung" className="text-primary hover:underline">Saisonverwaltung</a></li>
                        <li><a href="#ligaverwaltung" className="text-primary hover:underline">Ligaverwaltung</a></li>
                        <li><a href="#vereinsverwaltung" className="text-primary hover:underline">Vereinsverwaltung</a></li>
                        <li><a href="#mannschaftsverwaltung-admin" className="text-primary hover:underline">Mannschaftsverwaltung (Admin)</a></li>
                        <li><a href="#schuetzenverwaltung-admin" className="text-primary hover:underline">Schützenverwaltung (Admin)</a></li>
                        <li><a href="#ergebniserfassung-admin" className="text-primary hover:underline">Ergebniserfassung (Admin)</a></li>
                        <li><a href="#ergebnisse-bearbeitenloeschen-admin" className="text-primary hover:underline">Ergebnisse bearbeiten/löschen (Admin)</a></li>
                        <li><a href="#benutzerverwaltung-admin-rechtevergabe" className="text-primary hover:underline">Benutzerverwaltung (Admin - Rechtevergabe)</a></li>
                        <li><a href="#support-tickets-einsehen-admin" className="text-primary hover:underline">Support Tickets einsehen</a></li>
                        <li><a href="#agenda--offene-punkte-admin" className="text-primary hover:underline">Agenda / Offene Punkte</a></li>
                    </ul>
                  </li>
                )}
                <li><a href="#fuer-vereinsvertreter-und-mannschaftsfuehrer" className="text-primary hover:underline">4. Für Vereinsvertreter und Mannschaftsführer</a>
                     <ul className="list-circle list-inside pl-6 text-xs">
                        <li><a href="#zugriff-und-vereinskontext-vvmf" className="text-primary hover:underline">Zugriff und Vereinskontext</a></li>
                        <li><a href="#dashboard-uebersicht-vvmf" className="text-primary hover:underline">Dashboard Übersicht (VV/MF)</a></li>
                        <li><a href="#vereinsauswahl-vvmf" className="text-primary hover:underline">Vereinsauswahl (falls mehrere Vereine zugewiesen)</a></li>
                        <li><a href="#mannschaftsverwaltung-vv" className="text-primary hover:underline">Mannschaftsverwaltung (nur Vereinsvertreter)</a></li>
                        <li><a href="#schuetzenverwaltung-vv" className="text-primary hover:underline">Schützenverwaltung (nur Vereinsvertreter)</a></li>
                        <li><a href="#ergebniserfassung-vvmf" className="text-primary hover:underline">Ergebniserfassung (Vereinsvertreter und Mannschaftsführer)</a></li>
                    </ul>
                </li>
                <li><a href="#oeffentliche-ansichten" className="text-primary hover:underline">5. Öffentliche Ansichten</a>
                    <ul className="list-circle list-inside pl-6 text-xs">
                        <li><a href="#rwk-tabellen" className="text-primary hover:underline">RWK Tabellen</a></li>
                        <li><a href="#letzte-aenderungen-startseite" className="text-primary hover:underline">Letzte Änderungen (Startseite)</a></li>
                        <li><a href="#updates--changelog" className="text-primary hover:underline">Updates & Changelog</a></li>
                        <li><a href="#impressum" className="text-primary hover:underline">Impressum</a></li>
                    </ul>
                </li>
                <li><a href="#support" className="text-primary hover:underline">6. Support</a>
                     <ul className="list-circle list-inside pl-6 text-xs">
                        <li><a href="#support-ticket-erstellen" className="text-primary hover:underline">Support-Ticket erstellen</a></li>
                    </ul>
                </li>
            </ul>
        </CardContent>
      </Card>
      
      <Separator className="my-6" />

      <section id="einleitung" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">1. Einleitung</h2>
        <Card>
            <CardHeader><CardTitle id="zweck-der-anwendung" className="text-xl text-accent scroll-mt-24">Zweck der Anwendung</CardTitle></CardHeader>
            <CardContent><p>Die RWK Einbeck App dient zur Verwaltung und Darstellung der Rundenwettkämpfe des Kreisschützenverbandes Einbeck. Sie ermöglicht die Pflege von Stammdaten (Saisons, Ligen, Vereine, Mannschaften, Schützen), die Erfassung von Ergebnissen und die Anzeige von Tabellen und Ranglisten.</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="zielgruppen" className="text-xl text-accent scroll-mt-24">Zielgruppen</CardTitle></CardHeader>
            <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Super-Administratoren:</strong> Verantwortlich für die Gesamtverwaltung der Anwendung, Anlage von Saisons, Ligen, Vereinen, Zuweisung von Mannschaften zu Ligen und die Verwaltung von Benutzerrechten.</li>
                    <li><strong>Vereinsvertreter:</strong> Verantwortlich für die Verwaltung der Mannschaften und Schützen ihres/ihrer zugewiesenen Vereins/e sowie die Erfassung von Ergebnissen. Sie können Mannschaften und Schützen für ihren Verein anlegen und bearbeiten.</li>
                    <li><strong>Mannschaftsführer:</strong> Primär verantwortlich für die Erfassung von Ergebnissen für die Ligen, an denen Mannschaften ihrer zugewiesenen Vereine teilnehmen. Können Stammdaten ihres Vereins einsehen, aber nicht bearbeiten (kein Anlegen/Ändern von Mannschaften oder Schützen).</li>
                    <li><strong>Öffentlichkeit/Schützen:</strong> Können Tabellen, Ergebnisse und aktuelle Informationen einsehen.</li>
                </ul>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-6" />

      <section id="erste-schritte" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">2. Erste Schritte</h2>
        <Card>
            <CardHeader><CardTitle id="login" className="text-xl text-accent scroll-mt-24">Login</CardTitle></CardHeader>
            <CardContent>
                <p>Der Login erfolgt über die Login-Seite mit E-Mail und Passwort.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="benutzerkonten-rollen" className="text-xl text-accent scroll-mt-24">Benutzerkonten & Rollen</CardTitle></CardHeader>
            <CardContent>
                <p>
                    Benutzerkonten (für Vereinsvertreter, Mannschaftsführer) werden <strong>ausschließlich vom Super-Administrator manuell in der Firebase Authentication Konsole angelegt</strong> (E-Mail, initiales Passwort).
                    Anschließend weist der Super-Administrator dem Benutzer über das Admin-Panel der App (unter "Benutzerverwaltung") eine <strong>Rolle</strong> ("vereinsvertreter" oder "mannschaftsfuehrer") und die zugehörigen <strong>Vereine</strong> (bis zu 3) zu. Diese Berechtigungen werden in der Datenbank (`user_permissions`-Collection) gespeichert.
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Ein <strong>Vereinsvertreter</strong> hat erweiterte Rechte zur Verwaltung von Mannschaften und Schützen seines Vereins.</li>
                    <li>Ein <strong>Mannschaftsführer</strong> kann primär Ergebnisse für die Ligen seiner zugewiesenen Vereine eintragen.</li>
                </ul>
            </CardContent>
        </Card>
      </section>
      
      <Separator className="my-6" />

      {isSuperAdmin && ( 
        <section id="fuer-super-administratoren" className="space-y-4 scroll-mt-20">
          <h2 className="text-3xl font-semibold text-primary border-b pb-2">3. Für Super-Administratoren</h2>
          <p className="text-muted-foreground">Das Admin-Panel ist die zentrale Steuerungsinstanz für den Super-Administrator.</p>
          <Card>
              <CardHeader><CardTitle id="dashboard-uebersicht-admin" className="text-xl text-accent scroll-mt-24">Dashboard Übersicht (Admin)</CardTitle></CardHeader>
              <CardContent><p>Bietet eine zentrale Übersicht über die Verwaltungsfunktionen und eine Agenda für offene Punkte.</p></CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="saisonverwaltung" className="text-xl text-accent scroll-mt-24">Saisonverwaltung</CardTitle></CardHeader>
              <CardContent>
                  <p>Hier können neue Wettkampfsaisons (z.B. "RWK 2025 Kleinkaliber") mit Jahr, übergeordnetem Disziplintyp (Kleinkaliber, Luftdruck) und Status (Geplant, Laufend, Abgeschlossen) erstellt, bearbeitet und gelöscht werden. Der Status "Laufend" ist entscheidend für die Sichtbarkeit in den RWK-Tabellen und die Ergebniserfassung.</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="ligaverwaltung" className="text-xl text-accent scroll-mt-24">Ligaverwaltung</CardTitle></CardHeader>
              <CardContent>
                  <p>Nach Auswahl einer Saison können hier Ligen (z.B. Kreisoberliga) angelegt werden. Der spezifische Disziplintyp (z.B. KKG, LGA, LP Freihand) muss aus einer Liste ausgewählt werden. Ligen können bearbeitet und gelöscht werden.</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="vereinsverwaltung" className="text-xl text-accent scroll-mt-24">Vereinsverwaltung</CardTitle></CardHeader>
              <CardContent>
                  <p>Ermöglicht das Anlegen, Bearbeiten und Löschen von Vereinen mit Name, Kürzel und Vereinsnummer.</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="mannschaftsverwaltung-admin" className="text-xl text-accent scroll-mt-24">Mannschaftsverwaltung (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Der Super-Admin kann hier alle Mannschaften verwalten.</p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Filter:</strong> Saison, Verein und Liga auswählen, um Mannschaften zu filtern. Wichtig: Um "liga-lose" Mannschaften (die von VVs angelegt wurden) zu finden, Saison und Verein auswählen und den Liga-Filter auf "Alle Ligen" lassen.</li>
                      <li><strong>Anlegen/Bearbeiten:</strong> Mannschaften erstellen oder bearbeiten, <strong>Ligazugehörigkeit festlegen oder ändern</strong>, Mannschaftsführer-Kontaktdaten erfassen.</li>
                      <li><strong>Schützen zuweisen:</strong> Schützen den Teams zuordnen (max. 3 pro Team; Regel: ein Schütze pro Saison/Disziplinkategorie nur in einem Team).</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="schuetzenverwaltung-admin" className="text-xl text-accent scroll-mt-24">Schützenverwaltung (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Verwaltung aller Schützen.</p>
                   <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Anlegen/Bearbeiten:</strong> Schützen mit Vorname, Nachname, Geschlecht und Vereinszugehörigkeit anlegen oder ändern.</li>
                      <li><strong>Mannschaftszuordnung:</strong> Direkte Zuordnung zu Teams beim Anlegen/Bearbeiten möglich (unter Beachtung der Regeln).</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="ergebniserfassung-admin" className="text-xl text-accent scroll-mt-24">Ergebniserfassung (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Erfassung von Ergebnissen für alle Ligen.</p>
                   <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Auswahl:</strong> Saison (nur "Laufend"), Liga, Mannschaft, Durchgang, Schütze.</li>
                      <li><strong>Eingabe:</strong> Ringergebnis, Ergebnistyp (Regulär, Vorschießen, Nachschießen). Ringzahlen werden validiert.</li>
                      <li><strong>Zwischenspeicher:</strong> Ergebnisse werden gesammelt, bevor sie endgültig gespeichert werden. Bereits erfasste Schützen/Durchgänge werden im Dropdown nicht mehr angeboten.</li>
                      <li><strong>Speichern:</strong> Schreibt Ergebnisse in die Datenbank und erstellt/aktualisiert einen Eintrag für den "Letzte Änderungen"-Feed auf der Startseite (gruppiert nach Liga, Tag, Disziplin und Jahr).</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="ergebnisse-bearbeitenloeschen-admin" className="text-xl text-accent scroll-mt-24">Ergebnisse bearbeiten/löschen (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Ermöglicht die Suche, Bearbeitung (Ringzahl, Typ) und das Löschen von bereits erfassten Ergebnissen. Änderungen werden mit Benutzer und Zeitstempel versehen.</p>
              </CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle id="benutzerverwaltung-admin-rechtevergabe" className="text-xl text-accent scroll-mt-24">Benutzerverwaltung (Admin - Rechtevergabe)</CardTitle></CardHeader>
              <CardContent>
                  <p>Der Super-Administrator legt Benutzer manuell in der Firebase Authentication Konsole an. Anschließend weist er diesen Benutzern (identifiziert durch ihre UID) auf der Seite "Benutzerverwaltung" in der App eine Rolle ("vereinsvertreter" oder "mannschaftsfuehrer") und bis zu drei Vereine zu. Diese Berechtigungen werden in der Datenbank (`user_permissions`-Collection) gespeichert.</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="support-tickets-einsehen-admin" className="text-xl text-accent scroll-mt-24">Support Tickets einsehen</CardTitle></CardHeader>
              <CardContent>
                  <p>Zeigt eine Liste aller über das Support-Formular eingegangenen Tickets an. Der Status der Tickets kann hier verwaltet werden.</p>
              </CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle id="agenda--offene-punkte-admin" className="text-xl text-accent scroll-mt-24">Agenda / Offene Punkte (Admin)</CardTitle></CardHeader>
              <CardContent>
                <p>Eine Liste geplanter Features und offener Aufgaben im Admin-Dashboard.</p>
              </CardContent>
          </Card>
        </section>
      )}

      <Separator className="my-6" />

      <section id="fuer-vereinsvertreter-und-mannschaftsfuehrer" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">4. Für Vereinsvertreter und Mannschaftsführer</h2>
        <Card>
            <CardHeader><CardTitle id="zugriff-und-vereinskontext-vvmf" className="text-xl text-accent scroll-mt-24">Zugriff und Vereinskontext</CardTitle></CardHeader>
            <CardContent><p>Nach dem Login mit den vom Super-Admin bereitgestellten Zugangsdaten und der Zuweisung der Rolle und Vereinszugehörigkeit(en) in der `user_permissions`-Collection, erhält der Benutzer Zugriff auf den "Mein Verein"-Bereich. Die angezeigten Daten und Bearbeitungsmöglichkeiten sind auf den/die Verein(e) beschränkt, die dem eingeloggten Benutzer in seinen Berechtigungen zugewiesen sind. Die App liest diese Berechtigungen aus der Datenbank, um den Zugriff zu steuern.</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="dashboard-uebersicht-vvmf" className="text-xl text-accent scroll-mt-24">Dashboard Übersicht (VV/MF)</CardTitle></CardHeader>
            <CardContent><p>Pfad: `/verein/dashboard`. Zeigt eine Begrüßung, die zugewiesene Rolle und die Namen der Vereine an, für die der Benutzer zuständig ist.</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="vereinsauswahl-vvmf" className="text-xl text-accent scroll-mt-24">Vereinsauswahl (falls mehrere Vereine zugewiesen)</CardTitle></CardHeader>
            <CardContent><p>Wenn einem Benutzer mehrere Vereine in seinen Berechtigungen zugewiesen sind, erscheint auf den Verwaltungsseiten (Meine Mannschaften, Meine Schützen, Ergebnisse erfassen) oben ein Dropdown, um den Verein auszuwählen, für den aktuell Aktionen durchgeführt werden sollen (`activeClubId`). Ist nur ein Verein zugewiesen, entfällt diese Auswahl.</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="mannschaftsverwaltung-vv" className="text-xl text-accent scroll-mt-24">Mannschaftsverwaltung (nur Vereinsvertreter)</CardTitle></CardHeader>
            <CardContent>
                <p>Pfad: `/verein/mannschaften`. <strong>Diese Funktion ist nur für Benutzer mit der Rolle "vereinsvertreter" verfügbar.</strong> Mannschaftsführer sehen die Liste (falls der Link zugänglich wäre), können aber keine Änderungen vornehmen.</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Saisonauswahl:</strong> Der VV wählt eine vom Super-Admin angelegte Saison aus.</li>
                    <li><strong>Anzeige:</strong> Mannschaften des ausgewählten/zugewiesenen Vereins für die gewählte Saison.</li>
                    <li><strong>Anlegen (VV):</strong> Neue Mannschaften für den eigenen Verein und die gewählte Saison erstellen. <strong>Die Zuweisung zu einer spezifischen Liga erfolgt ausschließlich durch den Super-Admin.</strong> Name und Mannschaftsführer-Kontaktdaten können erfasst werden.</li>
                    <li><strong>Bearbeiten (VV):</strong> Namen von Mannschaften und Mannschaftsführer-Kontaktdaten ändern.</li>
                    <li><strong>Schützen zuweisen (VV):</strong> Schützen des eigenen Vereins können den Mannschaften zugeordnet werden (max. 3 pro Team; Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" wird geprüft, falls Team schon Ligatyp hat).</li>
                    <li><strong>Löschen (VV):</strong> Eigene Mannschaften entfernen.</li>
                </ul>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="schuetzenverwaltung-vv" className="text-xl text-accent scroll-mt-24">Schützenverwaltung (nur Vereinsvertreter)</CardTitle></CardHeader>
            <CardContent>
                <p>Pfad: `/verein/schuetzen`. <strong>Diese Funktion ist nur für Benutzer mit der Rolle "vereinsvertreter" verfügbar.</strong></p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Anzeige:</strong> Schützen des ausgewählten/zugewiesenen Vereins.</li>
                    <li><strong>Anlegen (VV):</strong> Neue Schützen für den eigenen Verein erstellen (Nachname, Vorname, Geschlecht). Eine direkte Mannschaftszuordnung beim Anlegen erfolgt hier nicht, sondern über die Mannschaftsverwaltungsseite.</li>
                    <li><strong>Bearbeiten/Löschen (VV):</strong> Stammdaten eigener Schützen ändern oder Schützen entfernen.</li>
                </ul>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="ergebniserfassung-vvmf" className="text-xl text-accent scroll-mt-24">Ergebniserfassung (Vereinsvertreter und Mannschaftsführer)</CardTitle></CardHeader>
            <CardContent>
                <p>Pfad: `/verein/ergebnisse`.</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Vereinskontext:</strong> Falls mehrere Vereine zugewiesen, Auswahl des Vereins (`activeClubIdForEntry`), für dessen Ligen Ergebnisse erfasst werden sollen.</li>
                    <li><strong>Saisonauswahl:</strong> Nur "Laufende" Saisons.</li>
                    <li><strong>Ligaauswahl:</strong> Nur Ligen, in denen der `activeClubIdForEntry` im gewählten Wettkampfjahr Mannschaften gemeldet hat.</li>
                    <li><strong>Mannschaftsauswahl:</strong> Alle Mannschaften der ausgewählten Liga (eigene und gegnerische), damit Ergebnisse für Begegnungen eingetragen werden können.</li>
                    <li><strong>Schützenauswahl:</strong> Schützen der ausgewählten Mannschaft.</li>
                    <li>Die weitere Erfassungslogik (Zwischenspeicher-Liste, Speichern, Validierung, Schütze verschwindet aus Dropdown) ist identisch zur Admin-Ergebniserfassung. Die `clubId` im Ergebnisdokument ist die des Teams, für das das Ergebnis eingetragen wird. Der `enteredByUserId` ist der des eingeloggten Benutzers.</li>
                </ul>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-6" />

      <section id="oeffentliche-ansichten" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">5. Öffentliche Ansichten</h2>
        <Card>
            <CardHeader><CardTitle id="rwk-tabellen" className="text-xl text-accent scroll-mt-24">RWK Tabellen</CardTitle></CardHeader>
            <CardContent>
                 <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Filter:</strong> Auswahl von Wettkampfjahr (dynamisch aus vorhandenen Saisons mit Status "Laufend") und UI-Disziplin (Kleinkaliber, Luftdruck). Das aktuellste Jahr mit laufenden Saisons wird standardmäßig ausgewählt.</li>
                    <li><strong>Anzeige:</strong> Zeigt nur Ligen von Saisons mit Status "Laufend". Die Ligen sind standardmäßig aufgeklappt.</li>
                    <li><strong>Mannschaftsrangliste:</strong> Tabellarische Übersicht der Ligen mit Mannschaften, deren Rundenergebnissen, Gesamtergebnis und Schnitt. Mannschaften können aufgeklappt werden, um Einzelergebnisse der Schützen zu sehen. Schützennamen in dieser Detailansicht sind klickbar und öffnen einen Statistik-Dialog.</li>
                    <li><strong>Einzelschützenrangliste:</strong> Tabellarische Übersicht aller Schützen der ausgewählten Saison/Disziplin, sortiert nach Gesamtleistung, mit Anzeige der Rundenergebnisse, Gesamt und Schnitt.</li>
                    <li><strong>Bester Schütze / Beste Dame:</strong> Werden hervorgehoben.</li>
                    <li><strong>Detailansicht Schütze:</strong> Klick auf einen Schützennamen (in Einzelrangliste oder Mannschaftsdetails) öffnet einen Dialog mit dessen Detailergebnissen und einem Leistungsdiagramm.</li>
                </ul>
            </CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle id="letzte-aenderungen-startseite" className="text-xl text-accent scroll-mt-24">Letzte Änderungen (Startseite)</CardTitle></CardHeader>
            <CardContent><p>Die Startseite zeigt die neuesten Aktualisierungen an, wenn Ergebnisse für Ligen hinzugefügt wurden (gruppiert pro Liga, Tag, Disziplin und Jahr). Jeder Eintrag ist direkt zur entsprechenden Liga in den RWK-Tabellen verlinkt.</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="updates--changelog" className="text-xl text-accent scroll-mt-24">Updates & Changelog</CardTitle></CardHeader>
            <CardContent><p>Listet die Versionshistorie der Anwendung mit den wichtigsten Änderungen und Neuerungen auf.</p></CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle id="impressum" className="text-xl text-accent scroll-mt-24">Impressum</CardTitle></CardHeader>
            <CardContent><p>Enthält die rechtlich notwendigen Angaben zum Betreiber der Webseite.</p></CardContent>
        </Card>
      </section>

      <Separator className="my-6" />
      
      <section id="support" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">6. Support</h2>
        <Card>
            <CardHeader><CardTitle id="support-ticket-erstellen" className="text-xl text-accent scroll-mt-24">Support-Ticket erstellen</CardTitle></CardHeader>
            <CardContent>
              <p>Ein Formular, um Fragen, Probleme oder Anregungen an den Administrator zu senden. Die Nachrichten werden in einer Datenbank (`support_tickets`) gespeichert und können vom Administrator eingesehen werden. Ein Hinweis zur Sicherung von Screenshots bei Problemen ist enthalten.</p>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-6"/>
      <p className="text-center text-sm text-muted-foreground"><em>Dieses Handbuch wird parallel zur Entwicklung der Anwendung aktualisiert.</em></p>
    </div>
  );
}

    