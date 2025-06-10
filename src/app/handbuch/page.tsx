// src/app/handbuch/page.tsx
"use client"; 

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookOpenCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth'; 

const ADMIN_EMAIL = "admin@rwk-einbeck.de";

export default function HandbuchPage() {
  const { user, loading } = useAuth(); 
  const isSuperAdmin = !loading && user?.email === ADMIN_EMAIL;

  return (
    <div className="space-y-8 container mx-auto px-4 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <BookOpenCheck className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Benutzerhandbuch RWK Einbeck App</h1>
          <p className="text-lg text-muted-foreground">
            Funktionen und Bedienung der Rundenwettkampf (RWK) App. (Stand: 10. Juni 2025, Version 0.8.0 Beta)
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
                        <li><a href="#benutzerkonten-rollen" className="text-primary hover:underline">Benutzerkonten &amp; Rollen</a></li>
                    </ul>
                </li>
                {isSuperAdmin && ( 
                  <li><a href="#fuer-super-administratoren" className="text-primary hover:underline">3. Für Rundenwettkampfleiter</a>
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
                <li><a href="#fuer-vereinsvertreter-und-mannschaftsfuehrer" className="text-primary hover:underline">3. Für Vereinsvertreter und Mannschaftsführer</a>
                     <ul className="list-circle list-inside pl-6 text-xs">
                        <li><a href="#zugriff-und-vereinskontext-vvmf" className="text-primary hover:underline">Zugriff und Vereinskontext</a></li>
                        <li><a href="#dashboard-uebersicht-vvmf" className="text-primary hover:underline">Dashboard Übersicht (VV/MF)</a></li>
                        <li><a href="#mannschaftsverwaltung-vv" className="text-primary hover:underline">Mannschaftsverwaltung (nur Vereinsvertreter)</a>
                           <ul className="list-['-_'] list-inside pl-8 text-xs">
                             <li><a href="#umgang-mit-einzelschuetzen-vv" className="text-primary hover:underline">Umgang mit Einzelschützen (ohne volle Mannschaft)</a></li>
                           </ul>
                        </li>
                        <li><a href="#schuetzenverwaltung-vv" className="text-primary hover:underline">Schützenverwaltung (nur Vereinsvertreter)</a></li>
                        <li><a href="#ergebniserfassung-vvmf" className="text-primary hover:underline">Ergebniserfassung (Vereinsvertreter und Mannschaftsführer)</a></li>
                    </ul>
                </li>
                <li><a href="#oeffentliche-ansichten" className="text-primary hover:underline">4. Öffentliche Ansichten</a>
                    <ul className="list-circle list-inside pl-6 text-xs">
                        <li><a href="#rwk-tabellen" className="text-primary hover:underline">RWK Tabellen</a></li>
                        <li><a href="#terminkalender" className="text-primary hover:underline">Terminkalender</a></li>
                        <li><a href="#letzte-aenderungen-startseite" className="text-primary hover:underline">Letzte Änderungen (Startseite)</a></li>
                        <li><a href="#updates--changelog" className="text-primary hover:underline">Updates &amp; Changelog</a></li>
                        <li><a href="#impressum" className="text-primary hover:underline">Impressum</a></li>
                         <li><a href="#rwk-ordnung" className="text-primary hover:underline">RWK-Ordnung</a></li>
                         <li><a href="#dokumente" className="text-primary hover:underline">Dokumente</a></li>
                    </ul>
                </li>
                <li><a href="#support" className="text-primary hover:underline">5. Support</a>
                     <ul className="list-circle list-inside pl-6 text-xs">
                        <li><a href="#support-ticket-erstellen" className="text-primary hover:underline">Support-Ticket erstellen</a></li>
                    </ul>
                </li>
            </ul>
        </CardContent>
      </Card>
      
      <Separator className="my-6" />

      {/* Section 1: Einleitung */}
      <section id="einleitung" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">1. Einleitung</h2>
        <Card>
            <CardHeader><CardTitle id="zweck-der-anwendung" className="text-xl text-accent scroll-mt-24">Zweck der Anwendung</CardTitle></CardHeader>
            <CardContent><p>Die RWK Einbeck App dient zur digitalen Verwaltung und übersichtlichen Darstellung der Rundenwettkämpfe des Kreisschützenverbandes Einbeck. Sie ermöglicht die Pflege wichtiger Daten (wie Saisons, Ligen, Vereine, Mannschaften und Schützen), die einfache Erfassung von Ergebnissen sowie die Anzeige von aktuellen Tabellen und Ranglisten.</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="zielgruppen" className="text-xl text-accent scroll-mt-24">Zielgruppen</CardTitle></CardHeader>
            <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Rundenwettkampfleiter:</strong> Verantwortlich für die Gesamtverwaltung der Anwendung. Dazu gehört das Anlegen von Wettkampfsaisons, Ligen und Vereinen, die Zuweisung von Mannschaften zu den Ligen und die Verwaltung der Benutzerzugänge und -rechte.</li>
                    <li><strong>Vereinsvertreter:</strong> Zuständig für die Verwaltung der Mannschaften und Schützen ihres Vereins. Sie können Ergebnisse für die Wettkämpfe ihres Vereins erfassen sowie Mannschaften und Schützen für ihren Verein anlegen und bearbeiten.</li>
                    <li><strong>Mannschaftsführer:</strong> Hauptsächlich verantwortlich für die Erfassung von Ergebnissen für die Ligen, an denen die Mannschaften ihres Vereins teilnehmen. Sie können die Stammdaten ihres Vereins (Mannschaften, Schützen) einsehen, aber keine Änderungen daran vornehmen.</li>
                    <li><strong>Öffentlichkeit/Schützen:</strong> Alle Interessierten können die aktuellen Tabellen, Ergebnisse, die RWK-Ordnung und weitere Informationen rund um die Rundenwettkämpfe einsehen.</li>
                </ul>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-6" />

      {/* Section 2: Erste Schritte */}
      <section id="erste-schritte" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">2. Erste Schritte</h2>
        <Card>
            <CardHeader><CardTitle id="login" className="text-xl text-accent scroll-mt-24">Login</CardTitle></CardHeader>
            <CardContent>
                <p>Der Zugang zur App erfolgt über die Login-Seite mittels E-Mail-Adresse und Passwort. Ein Captcha-Platzhalter ist vorhanden und wird zu einem späteren Zeitpunkt aktiviert.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="benutzerkonten-rollen" className="text-xl text-accent scroll-mt-24">Benutzerkonten &amp; Rollen</CardTitle></CardHeader>
            <CardContent>
                 <p>Benutzerkonten (z.B. für Vereinsvertreter, Mannschaftsführer) werden <strong>ausschließlich vom Rundenwettkampfleiter angelegt</strong>. Der Rundenwettkampfleiter erstellt den Account (E-Mail, initiales Passwort) und teilt dem Benutzer diese Daten mit.</p>
                 <p className="mt-2">Anschließend weist der Rundenwettkampfleiter über die Seite "Benutzerverwaltung" jedem Benutzer eine <strong>Rolle</strong> (z.B. "Vereinsvertreter" oder "Mannschaftsführer") und den zugehörigen <strong>Verein</strong> zu. Diese Berechtigungen werden sicher in der Datenbank gespeichert.</p>
                <p className="mt-2">Diese Zuweisungen legen fest, welche Funktionen und Daten der Benutzer in der App sehen und bearbeiten kann. Man kann sich nicht selbst für die App registrieren - ein Zugang wird nur vom Rundenwettkampfleiter eingerichtet.</p>
                <p className="mt-2">Ein <strong>Vereinsvertreter</strong> hat erweiterte Rechte zur Verwaltung von Mannschaften und Schützen seines/seiner zugewiesenen Vereins/e.</p>
                <p className="mt-1">Ein <strong>Mannschaftsführer</strong> kann primär Ergebnisse für die Ligen eintragen, in denen Mannschaften seines/seiner zugewiesenen Vereins/e teilnehmen. Die Verwaltung von Mannschaften und Schützen ist ihm nicht gestattet.</p>
                <p className="mt-2">Benutzer werden beim ersten Login automatisch aufgefordert, ihr initiales Passwort zu ändern.</p>
            </CardContent>
        </Card>
      </section>
      
      <Separator className="my-6" />

      {isSuperAdmin && ( 
        <section id="fuer-super-administratoren" className="space-y-4 scroll-mt-20">
          <h2 className="text-3xl font-semibold text-primary border-b pb-2">3. Für Rundenwettkampfleiter</h2>
          <p className="text-muted-foreground">(Dieser Abschnitt ist nur sichtbar, wenn der Rundenwettkampfleiter eingeloggt ist)</p>
          <p>Das Admin-Panel ist die zentrale Steuerungsinstanz für den Rundenwettkampfleiter.</p>
          
          <Card>
              <CardHeader><CardTitle id="dashboard-uebersicht-admin" className="text-xl text-accent scroll-mt-24">Dashboard Übersicht (Admin)</CardTitle></CardHeader>
              <CardContent><p>Bietet eine zentrale Übersicht über die Verwaltungsfunktionen und eine Agenda für offene Punkte und geplante Features (Roadmap).</p></CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="saisonverwaltung" className="text-xl text-accent scroll-mt-24">Saisonverwaltung</CardTitle></CardHeader>
              <CardContent>
                  <p>Hier können neue Wettkampfsaisons (z.B. "RWK 2025 Kleinkaliber") mit Jahr, Disziplin (Kleinkaliber, Luftdruck) und Status (Geplant, Laufend, Abgeschlossen) erstellt, bearbeitet und gelöscht werden. Der Status "Laufend" ist entscheidend für die Sichtbarkeit in den öffentlichen RWK-Tabellen und die Ergebniserfassung.</p>
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
                  <p>Ermöglicht das Anlegen, Bearbeiten und Löschen von Vereinen mit Name, Kürzel und Vereinsnummer. Eine Prüfung auf doppelte Vereinsnamen ist implementiert.</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="mannschaftsverwaltung-admin" className="text-xl text-accent scroll-mt-24">Mannschaftsverwaltung (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Der Super-Admin kann hier alle Mannschaften verwalten.</p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Filter:</strong> Saison, Verein und Liga auswählen, um Mannschaften zu filtern. Wichtig: Um Mannschaften zu finden, die noch keiner Liga zugewiesen sind (z.B. von Vereinsvertretern neu angelegte), Saison und Verein auswählen und den Liga-Filter auf "Alle Ligen" lassen.</li>
                      <li><strong>Anlegen/Bearbeiten:</strong> Mannschaften erstellen oder bearbeiten. Hier erfolgt die **Zuweisung einer Mannschaft zu einer spezifischen Liga** oder die Änderung dieser Zuweisung. Kontaktdaten des Mannschaftsführers (Name, E-Mail, Telefon - optional) können erfasst werden. Ein Hinweis erinnert an die korrekte Benennung nach Mannschaftsstärke (I, II, ...).</li>
                      <li><strong>Schützen zuweisen:</strong> Schützen den Teams zuordnen (maximal 3 pro Team; Regel: ein Schütze pro Saison und spezifischer Disziplinkategorie (Gewehr/Pistole) nur in einem Team).</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="schuetzenverwaltung-admin" className="text-xl text-accent scroll-mt-24">Schützenverwaltung (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Verwaltung aller Schützen.</p>
                   <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Filter:</strong> Nach Verein filtern.</li>
                      <li><strong>Anlegen/Bearbeiten:</strong> Schützen mit Vorname, Nachname, Geschlecht und Vereinszugehörigkeit anlegen oder ändern. Beim Anlegen können Schützen direkt Mannschaften zugeordnet werden (Beachtung der Regeln für maximale Schützenzahl und Disziplin-Beschränkungen).</li>
                      <li><strong>Mannschaftszuordnung (Info):</strong> In der Schützenliste wird angezeigt, welchen Mannschaften ein Schütze zugeordnet ist.</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="ergebniserfassung-admin" className="text-xl text-accent scroll-mt-24">Ergebniserfassung (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Erfassung von Ergebnissen für alle Ligen.</p>
                   <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Auswahl:</strong> Nur Saisons mit Status "Laufend", Liga, Durchgang (jetzt vor Mannschaft), Mannschaft, Schütze.</li>
                      <li><strong>Eingabe:</strong> Ringergebnis (mit Prüfung auf Maximalwert je nach Disziplin: LG/LP max. 400, KK max. 300), Ergebnistyp (Regulär, Vorschießen, Nachschießen).</li>
                      <li><strong>Zwischenspeicher:</strong> Ergebnisse werden gesammelt ("Zur Liste hinzufügen"), bevor sie endgültig gespeichert werden. Bereits erfasste Schützen/Durchgänge werden im Dropdown nicht mehr angeboten. Die Liste der vorgemerkten Ergebnisse bleibt auch beim Wechsel der Mannschaft (im gleichen Durchgang/Liga/Saison) erhalten.</li>
                      <li><strong>Speichern:</strong> Schreibt Ergebnisse in die Datenbank und erstellt/aktualisiert einen Eintrag für den "Letzte Änderungen"-Feed auf der Startseite (gruppiert pro Liga und Tag).</li>
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
                <p>Der Administrator legt Benutzerkonten manuell an (E-Mail, initiales Passwort). Anschließend weist er diesen Benutzern auf der Seite "Benutzerverwaltung" in der App eine Rolle ("Vereinsvertreter" oder "Mannschaftsführer") und den zugehörigen Verein (oder bis zu 3 Vereine) zu. Diese Berechtigungen bestimmen, welche Funktionen und Daten der Benutzer in der App sehen und bearbeiten kann.</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle id="support-tickets-einsehen-admin" className="text-xl text-accent scroll-mt-24">Support Tickets einsehen</CardTitle></CardHeader>
              <CardContent>
                  <p>Zeigt eine Liste aller über das Support-Formular eingegangenen Tickets an. Der Status der Tickets (Neu, In Bearbeitung, Gelesen, Geschlossen) kann hier verwaltet werden.</p>
              </CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle id="agenda--offene-punkte-admin" className="text-xl text-accent scroll-mt-24">Agenda / Offene Punkte (Admin)</CardTitle></CardHeader>
              <CardContent>
                <p>Eine Liste geplanter Features und offener Aufgaben im Admin-Dashboard, strukturiert nach potenziellen Versionen, um den Entwicklungsfortschritt zu verfolgen.</p>
              </CardContent>
          </Card>
        </section>
      )}

      <Separator className="my-6" />

      {/* Section 4: Für Vereinsvertreter und Mannschaftsführer */}
      <section id="fuer-vereinsvertreter-und-mannschaftsfuehrer" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">3. Für Vereinsvertreter und Mannschaftsführer</h2>
        <Card>
            <CardHeader><CardTitle id="zugriff-und-vereinskontext-vvmf" className="text-xl text-accent scroll-mt-24">Zugriff und Vereinskontext (VV/MF)</CardTitle></CardHeader>
            <CardContent>
                <p>Nach dem Login mit den vom Rundenwettkampfleiter erhaltenen Zugangsdaten kommt der Benutzer in den "Vereinsbereich". Hier kann er nur die Daten seines eigenen Vereins sehen und bearbeiten. Was genau er tun darf, hängt von seiner Rolle ab - entweder als "Vereinsvertreter" oder als "Mannschaftsführer".</p>
                <p className="mt-2">Auf allen Seiten (Mannschaften, Schützen, Ergebnisse) sehen Sie automatisch nur die Daten Ihres eigenen Vereins. Der Name Ihres Vereins wird meistens oben auf der Seite angezeigt.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="dashboard-uebersicht-vvmf" className="text-xl text-accent scroll-mt-24">Dashboard Übersicht (VV/MF)</CardTitle></CardHeader>
            <CardContent><p>Zeigt eine Begrüßung, die zugewiesene Rolle ("Vereinsvertreter" oder "Mannschaftsführer") und den Namen des Vereins an, für den der Benutzer zuständig ist.</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="mannschaftsverwaltung-vv" className="text-xl text-accent scroll-mt-24">Mannschaftsverwaltung (nur Vereinsvertreter)</CardTitle></CardHeader>
            <CardContent>
                <p>Diese Funktion ist nur für Benutzer mit der Rolle "vereinsvertreter" verfügbar. Mannschaftsführer sehen die Liste ihrer Mannschaften (sofern sie einer Liga zugeordnet sind), können aber keine Änderungen vornehmen oder neue anlegen (entsprechende Schaltflächen sind ausgeblendet).</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">

                    <li><strong>Saisonauswahl:</strong> Der VV wählt eine vom Rundenwettkampfleiter angelegte Saison aus.</li>
                    <li><strong>Anzeige:</strong> Mannschaften des ausgewählten Vereins für die gewählte Saison.</li>
                    <li><strong>Anlegen (VV):</strong> Neue Mannschaften für den eigenen Verein und die gewählte Saison erstellen. <strong>Wichtig: Nur der Rundenwettkampfleiter kann die Mannschaft später einer Liga zuweisen.</strong> Sie können den Namen der Mannschaft und die Kontaktdaten des Mannschaftsführers (freiwillig) eingeben. Bitte beachten Sie den Hinweis zur richtigen Benennung nach Mannschaftsstärke (I, II, ...). Auf dieser Seite können Sie auch Schützen zu den Mannschaften zuordnen.</li>
                    <li><strong>Bearbeiten (VV):</strong> Namen von Mannschaften und Mannschaftsführer-Kontaktdaten ändern.</li>
                    <li><strong>Schützen zuweisen (VV):</strong> Schützen des eigenen Vereins können den Mannschaften zugeordnet werden (max. 3 pro Team; Regel "Ein Schütze pro Saison/spezifischer Disziplinkategorie (Gewehr/Pistole) nur in einem Team" wird geprüft, falls das Team bereits einer Liga mit einem Disziplintyp zugeordnet wurde).</li>
                    <li><strong>Löschen (VV):</strong> Eigene Mannschaften entfernen.</li>
                </ul>
                 <h4 id="umgang-mit-einzelschuetzen-vv" className="font-semibold text-md mt-3 scroll-mt-24">Umgang mit Einzelschützen (ohne volle Mannschaft) durch Vereinsvertreter</h4>
                <p>Manchmal hat ein Verein nicht genug Schützen (weniger als drei) für eine komplette Mannschaft. Wenn diese Schützen trotzdem am Rundenwettkampf teilnehmen und in der Einzelwertung erscheinen sollen, können Sie als Vereinsvertreter so vorgehen:</p>
                <ol className="list-decimal list-inside pl-5 mt-1 space-y-0.5 text-sm">
                    <li>Auf der Seite "Meine Mannschaften" eine neue Mannschaft anlegen.</li>
                    <li>Als Mannschaftsnamen eine Bezeichnung wählen, die klar auf Einzelstarter hinweist, z.B. "**Vereinsname Einzel**" (Beispiel: "Einbecker Schützengilde Einzel").</li>
                    <li>Dieser "Einzel"-Mannschaft dann die 1 oder 2 Schützen zuweisen.</li>
                </ol>
                <p className="text-sm mt-1">Die App filtert Mannschaften, deren Name "Einzel" enthält, automatisch aus der Mannschafts-Rangliste in den RWK-Tabellen heraus. Die Ergebnisse dieser Schützen fließen aber in die Einzelschützen-Rangliste ein.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="schuetzenverwaltung-vv" className="text-xl text-accent scroll-mt-24">Schützenverwaltung (nur Vereinsvertreter)</CardTitle></CardHeader>
            <CardContent>
                <p>Diese Funktion ist nur für Benutzer mit der Rolle "vereinsvertreter" verfügbar. Mannschaftsführer können Schützenlisten einsehen, aber keine Änderungen vornehmen.</p>
                 <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Anzeige:</strong> Schützen des ausgewählten/zugewiesenen Vereins.</li>
                    <li><strong>Anlegen (VV):</strong> Neue Schützen für den eigenen Verein erstellen (Nachname, Vorname, Geschlecht). Die Zuordnung zu Mannschaften erfolgt über die Seite "Meine Mannschaften".</li>
                    <li><strong>Bearbeiten/Löschen (VV):</strong> Stammdaten eigener Schützen ändern oder Schützen entfernen.</li>
                </ul>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="ergebniserfassung-vvmf" className="text-xl text-accent scroll-mt-24">Ergebniserfassung (Vereinsvertreter und Mannschaftsführer)</CardTitle></CardHeader>
            <CardContent>
                 <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Saisonauswahl:</strong> Nur Saisons mit Status "Laufend".</li>
                    <li><strong>Ligaauswahl:</strong> Nur Ligen, in denen der ausgewählte/zugewiesene Verein im gewählten Wettkampfjahr Mannschaften gemeldet hat.</li>
                    <li><strong>Mannschaftsauswahl:</strong> Alle Mannschaften der ausgewählten Liga (eigene und gegnerische), damit Ergebnisse für Begegnungen eingetragen werden können.</li>
                    <li><strong>Schützenauswahl:</strong> Schützen der ausgewählten Mannschaft.</li>
                    <li>Die Ergebnisse werden zunächst in einer Liste gesammelt, bevor Sie sie endgültig speichern. Bereits erfasste Schützen werden aus der Auswahlliste entfernt. Das System prüft automatisch, ob die eingegebenen Ringzahlen gültig sind. Es wird auch gespeichert, wer das Ergebnis eingetragen hat.</li>
                </ul>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-6" />

      {/* Section 5: Öffentliche Ansichten */}
      <section id="oeffentliche-ansichten" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">4. Öffentliche Ansichten</h2>
        <Card>
            <CardHeader><CardTitle id="rwk-tabellen" className="text-xl text-accent scroll-mt-24">RWK Tabellen</CardTitle></CardHeader>
            <CardContent>
                 <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Filter:</strong> Sie können das Wettkampfjahr und die Disziplin (Kleinkaliber oder Luftdruck) auswählen. Das aktuelle Jahr ist normalerweise schon vorausgewählt. Wenn Sie auf der Startseite auf einen Eintrag unter "Letzte Änderungen" klicken, werden Sie direkt zur richtigen Tabelle mit den passenden Einstellungen weitergeleitet.</li>
                    <li><strong>Anzeige:</strong> Zeigt nur Ligen von Saisons mit Status "Laufend". Die Ligen sind standardmäßig aufgeklappt, können aber einzeln geschlossen werden.</li>
                    <li><strong>Mannschaftsrangliste:</strong> Hier sehen Sie eine Tabelle mit allen Mannschaften einer Liga, ihren Ergebnissen in den einzelnen Durchgängen, dem Gesamtergebnis und dem Durchschnitt. Mannschaften mit "Einzel" im Namen werden nicht in dieser Liste angezeigt. Sie können auf eine Mannschaft klicken, um die Ergebnisse der einzelnen Schützen zu sehen. Wenn Sie dann auf einen Schützennamen klicken, öffnet sich ein Fenster mit detaillierten Statistiken und einem Leistungsdiagramm.</li>
                    <li><strong>Einzelschützenrangliste:</strong> Diese Tabelle zeigt alle Schützen der ausgewählten Saison und Disziplin, sortiert nach ihrem Gesamtergebnis. Sie sehen die Ergebnisse jedes Durchgangs, das Gesamtergebnis und den Durchschnitt. Mit einem Auswahlmenü können Sie die Anzeige auf eine bestimmte Liga beschränken.</li>
                    <li><strong>Bester Schütze / Beste Dame:</strong> Werden für den gesamten ausgewählten Wettbewerb (Jahr/Disziplin) hervorgehoben.</li>
                    <li><strong>Detailansicht Schütze:</strong> Klick auf einen Schützennamen öffnet einen Dialog mit dessen Detailergebnissen und einem Leistungsdiagramm.</li>
                </ul>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="terminkalender" className="text-xl text-accent scroll-mt-24">Terminkalender</CardTitle></CardHeader>
            <CardContent>
              <p>Der Terminkalender bietet eine übersichtliche Darstellung aller anstehenden Wettkämpfe und Veranstaltungen.</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Kalenderansicht:</strong> Termine werden im Monatskalender farblich markiert angezeigt.</li>
                <li><strong>Filterung:</strong> Sie können nach Liga und Termintyp filtern.</li>
                <li><strong>Termindetails:</strong> Durch Klick auf ein Datum sehen Sie alle Termine dieses Tages mit Details wie Ort, Uhrzeit und Beschreibung.</li>
                <li><strong>Export:</strong> Termine können als iCal-Datei exportiert und in Ihren persönlichen Kalender importiert werden.</li>
                <li><strong>Terminverwaltung:</strong> Angemeldete Benutzer können neue Termine hinzufügen. Administratoren können Termine bearbeiten und löschen.</li>
              </ul>
            </CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle id="letzte-aenderungen-startseite" className="text-xl text-accent scroll-mt-24">Letzte Änderungen (Startseite)</CardTitle></CardHeader>
            <CardContent><p>Die Startseite zeigt die neuesten Aktualisierungen an, wenn Ergebnisse für Ligen hinzugefügt wurden (gruppiert pro Liga, Tag, Disziplin und Jahr). Jeder Eintrag ist direkt zur entsprechenden Liga in den RWK-Tabellen verlinkt.</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="updates--changelog" className="text-xl text-accent scroll-mt-24">Updates &amp; Changelog</CardTitle></CardHeader>
            <CardContent><p>Listet die Versionshistorie der Anwendung mit den wichtigsten Änderungen und Neuerungen auf. Die Einträge sind benutzerfreundlich formuliert.</p></CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle id="impressum" className="text-xl text-accent scroll-mt-24">Impressum</CardTitle></CardHeader>
            <CardContent><p>Enthält die rechtlich notwendigen Angaben zum Betreiber der Webseite.</p></CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle id="rwk-ordnung" className="text-xl text-accent scroll-mt-24">RWK-Ordnung</CardTitle></CardHeader>
            <CardContent><p>Eine eigene Seite zeigt den Inhalt der Rundenwettkampfordnung an.</p></CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle id="dokumente" className="text-xl text-accent scroll-mt-24">Dokumente</CardTitle></CardHeader>
            <CardContent><p>Eine Seite, auf der zukünftig wichtige Dokumente und Ausschreibungen zum Download oder zur Ansicht bereitgestellt werden können (aktuell Platzhalter).</p></CardContent>
        </Card>
      </section>

      <Separator className="my-6" />
      
      {/* Section 6: Support */}
      <section id="support" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">5. Support</h2>
        <Card>
            <CardHeader><CardTitle id="support-ticket-erstellen" className="text-xl text-accent scroll-mt-24">Support-Ticket erstellen</CardTitle></CardHeader>
            <CardContent>
              <p>Ein Formular, um Fragen, Probleme oder Anregungen an den Rundenwettkampfleiter zu senden. Die Nachrichten werden sicher gespeichert und können vom Rundenwettkampfleiter eingesehen werden. Ein Hinweis zur Sicherung von Screenshots bei Problemen ist enthalten.</p>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-6"/>
      <p className="text-center text-sm text-muted-foreground"><em>Dieses Handbuch wird parallel zur Entwicklung der Anwendung aktualisiert.</em></p>
    </div>
  );
}

    