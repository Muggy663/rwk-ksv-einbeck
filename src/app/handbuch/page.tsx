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
            Funktionen und Bedienung der Rundenwettkampf (RWK) App. (Stand: 25. Juni 2025, Version 0.9.4 Beta)
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
                        <li><a href="#login" className="text-primary hover:underline">Zugang zur App</a></li>
                    </ul>
                </li>
                {isSuperAdmin && ( 
                  <li><a href="#fuer-super-administratoren" className="text-primary hover:underline">3. Für Rundenwettkampfleiter</a></li>
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
                         <li><a href="#statistiken" className="text-primary hover:underline">Statistiken</a></li>
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
        
        <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5">
              <CardTitle id="login" className="text-xl text-primary scroll-mt-24">Zugang zur App</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Der Zugang zur App erfolgt über die Login-Seite mittels E-Mail-Adresse und Passwort.</p>
                
                <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                  <p className="font-medium text-blue-800">Wichtig: Benutzerkonten werden ausschließlich vom Rundenwettkampfleiter angelegt. Eine Selbstregistrierung ist nicht möglich.</p>
                  <p className="mt-1 text-blue-700">Wenn Sie einen Zugang benötigen, wenden Sie sich bitte per E-Mail an: <strong>rwk-leiter-ksve@gmx.de</strong></p>
                </div>
                
                <h4 className="font-medium mt-4 mb-2">Passwort ändern</h4>
                <p>Sie können Ihr Passwort jederzeit ändern:</p>
                <ol className="list-decimal list-inside pl-2 mt-1 space-y-1">
                  <li>Gehen Sie zum Vereins-Dashboard</li>
                  <li>Klicken Sie auf die Schaltfläche "Passwort ändern"</li>
                  <li>Geben Sie Ihr aktuelles und neues Passwort ein</li>
                </ol>
                
                <h4 className="font-medium mt-4 mb-2">Benutzerrollen</h4>
                <p>Je nach Ihrer Funktion erhalten Sie eine der folgenden Rollen:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong>Vereinsvertreter:</strong> Sie können Mannschaften und Schützen Ihres Vereins verwalten sowie Ergebnisse eintragen.</li>
                  <li><strong>Mannschaftsführer:</strong> Sie können Ergebnisse für Ihre Mannschaften eintragen, aber keine Mannschaften oder Schützen verwalten.</li>
                </ul>
            </CardContent>
        </Card>
      </section>
      
      <Separator className="my-6" />

      {isSuperAdmin && ( 
        <section id="fuer-super-administratoren" className="space-y-4 scroll-mt-20">
          <h2 className="text-3xl font-semibold text-primary border-b pb-2">3. Für Rundenwettkampfleiter</h2>
          <p className="text-muted-foreground">(Dieser Abschnitt ist nur sichtbar, wenn der Rundenwettkampfleiter eingeloggt ist)</p>
          <p>Detaillierte Informationen zur Administration des Systems.</p>
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
                    <li><strong>Sortierlogik:</strong> Die Tabelle wird nach dem letzten vollständig abgeschlossenen Durchgang sortiert. Teams, die bereits weitere Durchgänge begonnen haben, werden erst neu eingeordnet, wenn alle Teams diesen Durchgang abgeschlossen haben. Bei Teams mit unterschiedlichem Fortschritt wird die Wertungspunktzahl angezeigt.</li>
                    <li><strong>Einzelschützenrangliste:</strong> Diese Tabelle zeigt alle Schützen der ausgewählten Saison und Disziplin, sortiert nach ihrem Gesamtergebnis. Sie sehen die Ergebnisse jedes Durchgangs, das Gesamtergebnis und den Durchschnitt. Mit einem Auswahlmenü können Sie die Anzeige auf eine bestimmte Liga beschränken.</li>
                    <li><strong>Bester Schütze / Beste Dame:</strong> Werden für den gesamten ausgewählten Wettbewerb (Jahr/Disziplin) hervorgehoben.</li>
                    <li><strong>Detailansicht Schütze:</strong> Klick auf einen Schützennamen öffnet einen Dialog mit dessen Detailergebnissen und einem Leistungsdiagramm.</li>
                    <li><strong>Teamfilter:</strong> Mit dem Schnellfilter können Sie nach bestimmten Teams suchen.</li>
                    <li><strong>Fortschrittsanzeige:</strong> Zeigt an, welche Durchgänge bereits vollständig abgeschlossen sind.</li>
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
            <CardContent>
              <p>Eine zentrale Seite für alle wichtigen Dokumente, Ausschreibungen, Formulare und Ligalisten.</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Kategorien:</strong> Dokumente sind in Ausschreibungen, Formulare, Ligalisten & Handtabellen, Regelwerke und Archiv unterteilt.</li>
                <li><strong>Suchfunktion:</strong> Ermöglicht das schnelle Finden von Dokumenten nach Stichworten.</li>
                <li><strong>Favoriten:</strong> Häufig benötigte Dokumente können als Favoriten markiert werden.</li>
                <li><strong>Jahresfilter:</strong> Ligalisten können nach Jahr gefiltert werden.</li>
                <li><strong>Vorschau:</strong> PDF-Dokumente können direkt im Browser angesehen werden, ohne sie herunterladen zu müssen.</li>
                <li><strong>Eingeschränkte Dokumente:</strong> Bestimmte Dokumente sind nur für Vereinsvertreter und Mannschaftsführer sichtbar (z.B. Handtabellen mit Kontaktdaten).</li>
              </ul>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle id="statistiken" className="text-xl text-accent scroll-mt-24">Statistiken</CardTitle></CardHeader>
            <CardContent>
              <p>Das Statistik-Dashboard bietet umfangreiche Analysemöglichkeiten für Schützen- und Mannschaftsleistungen. Entdecken Sie wertvolle Einblicke in die Leistungsdaten!</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-muted/20 p-3 rounded-md">
                  <h4 className="font-medium mb-2 text-primary">Leistungsanalyse</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Leistungsentwicklung:</strong> Verfolgen Sie die Entwicklung der Top 6 Schützen über alle Durchgänge mit farbigen Liniendiagrammen</li>
                    <li><strong>Mannschaftsvergleich:</strong> Visualisierung der durchschnittlichen Leistung aller Teams einer Liga mit übersichtlichen Balkendiagrammen</li>
                    <li><strong>Trendanalyse:</strong> Automatische Erkennung von Leistungstrends (steigend/stabil/fallend) mit intelligenten Algorithmen</li>
                  </ul>
                </div>
                
                <div className="bg-muted/20 p-3 rounded-md">
                  <h4 className="font-medium mb-2 text-primary">Vergleichsfunktionen</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Schützenvergleich:</strong> Direkter Vergleich von bis zu 6 Schützen mit detaillierten Leistungskurven</li>
                    <li><strong>Geschlechterverteilung:</strong> Analyse der Verteilung männlicher und weiblicher Schützen in interaktiven Kreisdiagrammen</li>
                    <li><strong>Saisonübergreifende Statistiken:</strong> Umfassende Analyse von Schützenleistungen über mehrere Jahre hinweg</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-muted/20 p-3 rounded-md mt-4">
                <h4 className="font-medium mb-2 text-primary">Benutzerfreundliche Funktionen</h4>
                <ul className="list-disc pl-5 space-y-1 grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <li><strong>Interaktive Diagramme:</strong> Bewegen Sie den Mauszeiger über Datenpunkte für detaillierte Informationen</li>
                  <li><strong>Export-Funktionen:</strong> Alle Diagramme können als PNG-Dateien exportiert werden</li>
                  <li><strong>Umfangreiche Filter:</strong> Filtern Sie nach Saison, Liga und Verein für maßgeschneiderte Analysen</li>
                  <li><strong>Responsive Design:</strong> Optimale Darstellung auf allen Geräten, vom Desktop bis zum Smartphone</li>
                </ul>
              </div>
            </CardContent>
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