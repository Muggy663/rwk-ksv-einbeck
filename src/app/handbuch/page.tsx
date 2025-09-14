// src/app/handbuch/page.tsx
"use client"; 

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookOpenCheck, Target, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth'; 

const ADMIN_EMAIL = "admin@rwk-einbeck.de";

export default function HandbuchPage() {
  const { user, loading } = useAuth(); 
  const isSuperAdmin = !loading && user?.email === ADMIN_EMAIL;
  const [activeTab, setActiveTab] = useState('rwk');

  return (
    <div className="space-y-8 container mx-auto px-4 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <BookOpenCheck className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Benutzerhandbuch KSV Einbeck App</h1>
          <p className="text-lg text-muted-foreground">
            Funktionen und Bedienung der Rundenwettkampf (RWK), Kreismeisterschafts (KM) und Vereinssoftware. (Stand: 14.09.2025, Web-Version 1.5.9, App-Version 0.9.4.1, Vereinssoftware 1.5.9)
          </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('rwk')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'rwk' 
              ? 'bg-background text-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>Rundenwettkampf (RWK)</span>
        </button>
        <button
          onClick={() => setActiveTab('km')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'km' 
              ? 'bg-background text-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Kreismeisterschaften (KM)</span>
        </button>
        <button
          onClick={() => setActiveTab('vereinssoftware')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'vereinssoftware' 
              ? 'bg-background text-primary shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpenCheck className="h-4 w-4" />
          <span>Vereinssoftware</span>
        </button>
      </div>

      {activeTab === 'rwk' && (
        <>
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
                         <li><a href="#news-system" className="text-primary hover:underline">News-System</a></li>
                         <li><a href="#protest-system" className="text-primary hover:underline">Protest-System</a></li>
                         <li><a href="#push-notifications" className="text-primary hover:underline">Push-Benachrichtigungen</a></li>
                         <li><a href="#android-app" className="text-primary hover:underline">Android-App</a></li>
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
                
                <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2">🏢 Multi-Verein-System (Neu in Version 0.9.9)</h4>
                  <p className="text-blue-700">Falls Sie mehreren Vereinen zugeordnet sind, erscheint nach dem Login eine <strong>Club-Auswahl-Seite</strong>. Wählen Sie den gewünschten Verein aus.</p>
                  <p className="text-blue-700 mt-1">In der Navigation finden Sie einen <strong>Club-Switcher</strong>, mit dem Sie jederzeit zwischen Ihren Vereinen wechseln können. Ihre Auswahl wird gespeichert.</p>
                </div>
                
                <p className="mt-2">Auf allen Seiten (Mannschaften, Schützen, Ergebnisse) sehen Sie automatisch nur die Daten des aktuell ausgewählten Vereins. Der Name Ihres Vereins wird oben auf der Seite angezeigt.</p>
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
                    <li><strong>Voice Input (Neu):</strong> Sprechen Sie "185 Ringe" statt zu tippen - Deutsche Zahlenerkennung für schnellere Eingabe.</li>
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
        
        <Card>
            <CardHeader><CardTitle id="news-system" className="text-xl text-accent scroll-mt-24">News-System</CardTitle></CardHeader>
            <CardContent>
              <p>Das News-System ermöglicht die Verwaltung und Anzeige offizieller Mitteilungen des Kreisschützenverbandes.</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Kategorien:</strong> News werden in Allgemein, Ergebnisse, Termine, Regeländerung und Wichtig unterteilt</li>
                <li><strong>Prioritäten:</strong> Normal, Hoch und Dringend für bessere Sichtbarkeit wichtiger Mitteilungen</li>
                <li><strong>Zielgruppen:</strong> News können für alle Benutzer oder spezifische Gruppen (Vereinsvertreter, Mannschaftsführer, Admins) erstellt werden</li>
                <li><strong>Content-Filter:</strong> Automatische Filterung unerlaubter Inhalte</li>
                <li><strong>Suchfunktion:</strong> Volltext-Suche und Filterung nach Kategorien</li>
                <li><strong>Admin-Features:</strong> Entwurf-Modus, Pinning wichtiger Artikel, Tag-System</li>
              </ul>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle id="protest-system" className="text-xl text-accent scroll-mt-24">Protest-System</CardTitle></CardHeader>
            <CardContent>
              <p>Digitales System für die Einreichung und Bearbeitung von Einsprüchen und Beschwerden.</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Workflow:</strong> Protest einreichen → Prüfung durch Rundenwettkampfleiter → Entscheidung und Benachrichtigung</li>
                <li><strong>Kategorien:</strong> Ergebnis-Einsprüche, Verhalten, Regelverstöße, Sonstiges</li>
                <li><strong>Status-Tracking:</strong> Eingereicht, In Bearbeitung, Entschieden, Abgelehnt</li>
                <li><strong>Kommentar-System:</strong> Kommunikation zwischen Einreicher und Rundenwettkampfleiter</li>
                <li><strong>Prioritäten:</strong> Niedrig, Mittel, Hoch für bessere Bearbeitung</li>
                <li><strong>Transparenz:</strong> Vollständige Nachverfolgung aller Protest-Aktivitäten</li>
              </ul>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle id="push-notifications" className="text-xl text-accent scroll-mt-24">Push-Benachrichtigungen</CardTitle></CardHeader>
            <CardContent>
              <p>Sofortige Benachrichtigungen über wichtige Ereignisse direkt im Browser.</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Benachrichtigungstypen:</strong> Neue Ergebnisse, Termine, News und Proteste</li>
                <li><strong>Granulare Kontrolle:</strong> Separate Ein-/Ausschaltung für jeden Benachrichtigungstyp</li>
                <li><strong>Browser-Integration:</strong> Funktioniert auch wenn die App geschlossen ist</li>
                <li><strong>Click-Actions:</strong> Benachrichtigungen öffnen direkt die relevante Seite</li>
                <li><strong>Einstellungen:</strong> Unter "Benachrichtigungen" können Sie Ihre Präferenzen verwalten</li>
                <li><strong>Berechtigung:</strong> Browser-Berechtigung erforderlich - wird beim ersten Aktivieren abgefragt</li>
              </ul>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle id="android-app" className="text-xl text-accent scroll-mt-24">Android-App</CardTitle></CardHeader>
            <CardContent>
              <p>Die RWK Einbeck App ist jetzt auch als native Android-App verfügbar für bessere Performance und einfachere Nutzung.</p>
              
              <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
                <h4 className="font-medium text-green-800 mb-2">📱 Neue Android-App (Version 0.9.1.0)</h4>
                <p className="text-green-700">Die native Android-App bietet alle Funktionen der Web-App mit verbesserter Performance und einfacherer Installation.</p>
                <p className="text-green-700 mt-1"><strong>Neu in Version 0.9.1.0:</strong> Verbesserte PDF-Anzeige und Statusleisten-Fix</p>
              </div>
              
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Download:</strong> APK-Datei über die App-Seite oder Dokumente-Bereich herunterladen</li>
                <li><strong>Installation:</strong> 3 einfache Schritte - APK herunterladen, "Trotzdem installieren" bei "Unbekannte App", fertig!</li>
                <li><strong>Kompatibilität:</strong> Android 5.0+ (unterstützt 95% aller Android-Geräte)</li>
                <li><strong>Updates:</strong> 90% der Updates erfolgen automatisch über die Web-App, nur bei neuen Features ist eine neue APK nötig</li>
                <li><strong>Warum "Unbekannte Quelle"?</strong> Normal bei Apps außerhalb Play Store - die RWK App ist sicher und offiziell</li>
                <li><strong>iPhone-Nutzer:</strong> Können die Web-App im Safari-Browser nutzen oder als PWA zum Home-Bildschirm hinzufügen</li>
                <li><strong>Versionierungsstrategie:</strong> Web-App (0.9.9.x) und Native App (0.9.x.y) haben unterschiedliche Versionsnummern</li>
              </ul>
              
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-4">
                <h4 className="font-medium text-blue-800 mb-2">Hybride Versionierungsstrategie:</h4>
                <p className="text-blue-700 mb-2">Ab Version 0.9.9.6/0.9.1.0 verwenden wir eine hybride Versionierungsstrategie:</p>
                <ul className="list-disc pl-5 space-y-1 text-blue-700">
                  <li><strong>Web-App:</strong> 0.9.9.x - Aktuelle Version: 0.9.9.6</li>
                  <li><strong>Native App:</strong> 0.9.x.y - Aktuelle Version: 0.9.1.0</li>
                </ul>
                <p className="text-blue-700 mt-2">Dies ermöglicht unabhängige Entwicklungszyklen für Web und App, während die Hauptversion (0.9) synchron bleibt.</p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-4">
                <h4 className="font-medium text-blue-800 mb-2">Installation Schritt-für-Schritt:</h4>
                <ol className="list-decimal pl-5 space-y-1 text-blue-700">
                  <li>APK-Datei mit Chrome-Browser herunterladen</li>
                  <li>Bei Warnung "Unbekannte App" auf "Trotzdem installieren" tippen</li>
                  <li>RWK-App-Icon antippen und loslegen!</li>
                </ol>
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
        </>
      )}
      
      {activeTab === 'km' && (
        <>
          {/* KM Handbuch Content */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent">Kreismeisterschaften - Benutzerhandbuch</CardTitle>
              <CardDescription>Anleitung zur Nutzung des Kreismeisterschafts-Moduls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li><a href="#km-einleitung" className="text-primary hover:underline">1. Einleitung KM-System</a></li>
                <li><a href="#km-meldungen" className="text-primary hover:underline">2. Meldungen erstellen</a></li>
                <li><a href="#km-startlisten" className="text-primary hover:underline">3. Startlisten-System</a></li>
                <li><a href="#km-mannschaften" className="text-primary hover:underline">4. Mannschaftsbildung</a></li>
                <li><a href="#km-wettkampfklassen" className="text-primary hover:underline">5. Wettkampfklassen</a></li>
                <li><a href="#km-vm-ergebnisse" className="text-primary hover:underline">6. VM-Ergebnisse</a></li>
              </ul>
            </CardContent>
          </Card>
          
          <Separator className="my-6" />
          
          <section id="km-einleitung" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">1. Einleitung KM-System</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Zweck des KM-Moduls</CardTitle></CardHeader>
              <CardContent>
                <p>Das Kreismeisterschafts-Modul digitalisiert den bisher papierbasierten Meldeprozess für die jährlichen Kreismeisterschaften des KSV Einbeck.</p>
                <div className="mt-4 bg-green-50 p-3 rounded-md border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">🎯 Hauptvorteile:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-green-700">
                    <li><strong>75% Zeitersparnis:</strong> Von 40-60h auf 8-15h Gesamtaufwand</li>
                    <li><strong>Automatische Wettkampfklassen-Berechnung</strong> nach DSB-Sportordnung</li>
                    <li><strong>Echtzeit-Validierung</strong> verhindert Fehler bei der Eingabe</li>
                    <li><strong>Gemeinsame Schützendatenbank</strong> mit RWK-System</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>
          

          
          <Separator className="my-6" />
          
          <section id="km-meldungen" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">2. Meldungen erstellen</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Meldungsformular bedienen</CardTitle></CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">Schritt-für-Schritt Anleitung:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Verein filtern (optional):</strong> Wählen Sie Ihren Verein aus der Dropdown-Liste</li>
                  <li><strong>Schütze auswählen:</strong> Alle Vereinsmitglieder werden alphabetisch angezeigt</li>
                  <li><strong>Disziplinen wählen:</strong> Mehrfachauswahl möglich - wählen Sie alle gewünschten Disziplinen</li>
                  <li><strong>Wettkampfklassen:</strong> Werden automatisch nach DSB-Sportordnung berechnet</li>
                  <li><strong>VM-Ergebnis eingeben:</strong> Für Durchmeldungs-Disziplinen erforderlich, sonst optional</li>
                  <li><strong>LM-Teilnahme:</strong> Ja/Nein für Landesmeisterschaft</li>
                  <li><strong>Anmerkungen:</strong> Besondere Wünsche (z.B. "nicht mit Ehemann zusammen")</li>
                </ol>
                
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-4">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Wichtige Hinweise:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                    <li><strong>Sportjahr = Kalenderjahr:</strong> Alter in 2026 ist entscheidend für KM 2026</li>
                    <li><strong>Auflage vs. Freihand:</strong> Verschiedene Wettkampfklassen (Senioren bei Auflage)</li>
                    <li><strong>Mehrfachauswahl:</strong> Ein Schütze kann in mehreren Disziplinen gemeldet werden</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <Separator className="my-6" />
          
          <section id="km-startlisten" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">3. Startlisten-System</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Intelligente Startlisten-Generierung</CardTitle></CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-4">
                  <h4 className="font-medium text-green-800 mb-2">🎯 Startlisten-Assistent (Neu in Version 0.9.9.9)</h4>
                  <p className="text-green-700">Das neue Startlisten-System generiert automatisch optimierte Startlisten mit KI-Unterstützung und berücksichtigt alle Besonderheiten des Schießsports.</p>
                </div>
                
                <h4 className="font-semibold mb-2">Funktionen:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Altersklassen-System:</strong> Automatische Schießzeit-Berechnung basierend auf Alter (Schüler: 20 Schuss, andere: 40 Schuss)</li>
                  <li><strong>Anlagensystem-Unterscheidung:</strong> Zuganlagen vs. Elektronische Anlagen (Disag, Meyton) mit angepassten Zeiten</li>
                  <li><strong>KI-Optimierung:</strong> Intelligente Verteilung der Schützen auf Stände und Zeiten</li>
                  <li><strong>Gewehr-Sharing:</strong> Automatische Berücksichtigung von geteilten Gewehren mit Zeitpuffern</li>
                  <li><strong>Konfiguration speichern:</strong> Wiederverwendbare Einstellungen für nächste Jahre</li>
                  <li><strong>Startlisten bearbeiten:</strong> Nachträgliche Anpassungen möglich</li>
                  <li><strong>PDF/Excel Export:</strong> Mit RWK-Logo für professionelle Dokumente</li>
                </ul>
                
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-4">
                  <h4 className="font-medium text-blue-800 mb-2">📋 Workflow für Sportleiterin:</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-blue-700">
                    <li>Meldungen prüfen und VM-Ergebnisse kontrollieren</li>
                    <li>Startlisten-Assistent: Wettkampf konfigurieren</li>
                    <li>Automatische Generierung mit KI-Optimierung</li>
                    <li>Manuelle Anpassungen bei Bedarf</li>
                    <li>PDF-Export für Aushang und Versand</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <Separator className="my-6" />
          
          <section id="km-mannschaften" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">4. Mannschaftsbildung</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Automatische Mannschaftsgenerierung</CardTitle></CardHeader>
              <CardContent>
                <p>Das System bildet automatisch 3er-Mannschaften basierend auf den Meldungen und Mannschaftsregeln.</p>
                
                <h4 className="font-semibold mt-4 mb-2">Mannschaftsregeln:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-md">
                    <h5 className="font-medium text-green-800 mb-2">Gemischte Mannschaften erlaubt:</h5>
                    <ul className="list-disc pl-5 text-sm text-green-700">
                      <li>Schüler/Jugend</li>
                      <li>Senioren 0</li>
                      <li>Senioren I+II</li>
                      <li>Senioren III-VI</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <h5 className="font-medium text-blue-800 mb-2">Geschlechtergetrennt:</h5>
                    <ul className="list-disc pl-5 text-sm text-blue-700">
                      <li>Junioren I/II</li>
                      <li>Herren/Damen I-V</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          

          
          <Separator className="my-6" />
          
          <section id="km-wettkampfklassen" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">5. Wettkampfklassen</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-accent flex items-center justify-between">
                  Wettkampfklassen nach DSB-Sportordnung
                  <a 
                    href="https://dsb.de/fileladmin/dsb/sportordnung/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    → DSB-Sportordnung
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Standard (Freihand):</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Schüler: ≤ 14 Jahre</li>
                      <li>Jugend: 15-16 Jahre</li>
                      <li>Junioren II: 17-18 Jahre</li>
                      <li>Junioren I: 19-20 Jahre</li>
                      <li>Herren/Damen I: 21-40 Jahre</li>
                      <li>Herren/Damen II: 41-50 Jahre</li>
                      <li>Herren/Damen III: 51-60 Jahre</li>
                      <li>Herren/Damen IV: 61-70 Jahre</li>
                      <li>Herren/Damen V: ≥ 71 Jahre</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Auflage (Senioren):</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Bis 40 Jahre: wie Standard</li>
                      <li>Senioren 0: 41-50 Jahre</li>
                      <li>Senioren I: 51-60 Jahre</li>
                      <li>Senioren II: 61-65 Jahre</li>
                      <li>Senioren III: 66-70 Jahre</li>
                      <li>Senioren IV: 71-75 Jahre</li>
                      <li>Senioren V: 76-80 Jahre</li>
                      <li>Senioren VI: ≥ 81 Jahre</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <Separator className="my-6" />
          
          <section id="km-vm-ergebnisse" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">6. VM-Ergebnisse</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Vereinsmeisterschafts-Ergebnisse</CardTitle></CardHeader>
              <CardContent>
                <p>VM-Ergebnisse sind wichtig für die Qualifikation zur Landesmeisterschaft und die Startlisten-Sortierung.</p>
                
                <h4 className="font-semibold mt-4 mb-2">VM-Ergebnisse-Übersicht:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Qualifikationslimits 2025:</strong> Automatische Prüfung gegen LM-Limits</li>
                  <li><strong>Status-Anzeige:</strong> OK, Fraglich oder VM fehlt</li>
                  <li><strong>Filter-Funktionen:</strong> Nach Disziplin und Status filterbar</li>
                  <li><strong>Excel-Export:</strong> Für weitere Bearbeitung und Archivierung</li>
                </ul>
                
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-4">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Wichtige Hinweise:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                    <li><strong>Durchmeldungen:</strong> Benötigen zwingend VM-Ergebnis</li>
                    <li><strong>LM-Teilnahme:</strong> VM-Ergebnis muss Qualifikationslimit erreichen</li>
                    <li><strong>Startlisten-Sortierung:</strong> VM-Ergebnisse werden für optimale Verteilung genutzt</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <Separator className="my-6" />
          <p className="text-center text-sm text-muted-foreground"><em>KM-Handbuch wird parallel zur Entwicklung aktualisiert.</em></p>
        </>
      )}
      
      {activeTab === 'vereinssoftware' && (
        <>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-accent">Vereinssoftware - Benutzerhandbuch</CardTitle>
              <CardDescription>Version 1.5.9 - Vereinsbereich UX-Verbesserungen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li><a href="#vs-einleitung" className="text-primary hover:underline">1. Was ist die Vereinssoftware?</a></li>
                <li><a href="#vs-mitgliederverwaltung" className="text-primary hover:underline">2. Mitglieder verwalten</a></li>
                <li><a href="#vs-beitraege" className="text-primary hover:underline">3. Beiträge & SEPA-Lastschrift</a></li>
                <li><a href="#vs-jubilaeen" className="text-primary hover:underline">4. Geburtstage & Jubiläen</a></li>
                <li><a href="#vs-lizenzen" className="text-primary hover:underline">5. Lizenzen & Ausbildungen</a></li>
                <li><a href="#vs-aufgaben" className="text-primary hover:underline">6. Aufgaben für den Vorstand</a></li>
                <li><a href="#vs-suche" className="text-primary hover:underline">7. Globale Suche nutzen</a></li>
              </ul>
            </CardContent>
          </Card>
          
          <Separator className="my-6" />
          
          <section id="vs-einleitung" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">1. Was ist die Vereinssoftware?</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Moderne Vereinsverwaltung für Schützenvereine</CardTitle></CardHeader>
              <CardContent>
                <p>Die Vereinssoftware hilft Ihnen dabei, Ihren Schützenverein digital zu verwalten. Sie können Mitglieder erfassen, Beiträge verwalten, Jubiläen planen und vieles mehr.</p>
                
                <div className="mt-4 bg-green-50 p-3 rounded-md border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">✨ Das können Sie mit der Vereinssoftware v1.5.8 machen:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-green-700">
                    <li><strong>👥 Mitglieder verwalten:</strong> Alle Daten an einem Ort - Name, Adresse, Geburtstag, E-Mail</li>
                    <li><strong>💳 SEPA-Beiträge:</strong> Multi-Bank-Export für automatische Lastschrift-Zahlungen</li>
                    <li><strong>🎂 Jubiläen planen:</strong> Geburtstage & Vereinsjubiläen mit 5-Jahres-Vorausplanung</li>
                    <li><strong>🏆 Lizenzen & Ausbildungen:</strong> 8 Schießsport-Lizenzen mit Ablauf-Überwachung</li>
                    <li><strong>👔 12 Vorstandspositionen:</strong> Von 1. Vorsitzender bis Kassenprüfer verwalten</li>
                    <li><strong>📋 Aufgaben verwalten:</strong> To-Do-Listen für Vorstand mit Prioritäten</li>
                    <li><strong>🔍 Alles finden:</strong> Globale Suche über alle Bereiche</li>
                    <li><strong>⚖️ Vereinsrecht:</strong> Protokolle, Wahlen & Compliance-Management</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-4">
                  <h4 className="font-medium text-blue-800 mb-2">🎯 Für wen ist das gedacht?</h4>
                  <p className="text-blue-700">Die Vereinssoftware ist perfekt für Vereinsvorstände, Kassenwarte und Geschäftsführer, die ihren Verein modern und effizient verwalten möchten.</p>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <Separator className="my-6" />
          
          <section id="vs-mitgliederverwaltung" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">2. Mitglieder verwalten</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Alle Mitgliederdaten an einem Ort</CardTitle></CardHeader>
              <CardContent>
                <p>In der Mitgliederverwaltung können Sie alle wichtigen Daten Ihrer Vereinsmitglieder erfassen und bearbeiten.</p>
                
                <h4 className="font-semibold mt-4 mb-2">So funktioniert es:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Neues Mitglied anlegen:</strong> Klicken Sie auf "Mitglied hinzufügen" und füllen Sie das Formular aus</li>
                  <li><strong>Daten bearbeiten:</strong> Klicken Sie bei einem Mitglied auf "Bearbeiten" und ändern Sie die Daten</li>
                  <li><strong>Mitglied suchen:</strong> Nutzen Sie das Suchfeld, um schnell ein bestimmtes Mitglied zu finden</li>
                  <li><strong>Status ändern:</strong> Setzen Sie Mitglieder auf "Inaktiv" wenn sie austreten</li>
                </ol>
                
                <h4 className="font-semibold mt-4 mb-2">Diese Daten können Sie erfassen:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h5 className="font-medium mb-2">📋 Grunddaten:</h5>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Vor- und Nachname</li>
                      <li>Geburtstag</li>
                      <li>Geschlecht (für Wettkämpfe wichtig)</li>
                      <li>Mitgliedsnummer</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h5 className="font-medium mb-2">📍 Kontaktdaten:</h5>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Straße und Hausnummer</li>
                      <li>Postleitzahl und Ort</li>
                      <li>Telefonnummer</li>
                      <li>E-Mail-Adresse</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <Separator className="my-6" />
          
          <section id="vs-beitraege" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">3. Beiträge & SEPA-Lastschrift</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Automatische Beitragsverwaltung</CardTitle></CardHeader>
              <CardContent>
                <p>Mit der SEPA-Lastschrift können Sie Mitgliedsbeiträge automatisch einziehen. Das spart Zeit und reduziert Zahlungsausfälle.</p>
                
                <h4 className="font-semibold mt-4 mb-2">So richten Sie SEPA ein:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>SEPA-Mandate sammeln:</strong> Lassen Sie Ihre Mitglieder ein SEPA-Mandat unterschreiben</li>
                  <li><strong>Daten erfassen:</strong> Tragen Sie IBAN und Mandatsdatum in die Software ein</li>
                  <li><strong>Beiträge festlegen:</strong> Definieren Sie die Beitragshöhe für jedes Mitglied</li>
                  <li><strong>Lastschrift erstellen:</strong> Die Software erstellt automatisch die SEPA-Datei für Ihre Bank</li>
                </ol>
                
                <div className="bg-green-50 p-3 rounded-md border border-green-200 mt-4">
                  <h4 className="font-medium text-green-800 mb-2">💰 Vorteile der SEPA-Lastschrift:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-green-700">
                    <li><strong>Automatisch:</strong> Beiträge werden pünktlich eingezogen</li>
                    <li><strong>Weniger Arbeit:</strong> Keine manuellen Überweisungen mehr nötig</li>
                    <li><strong>Übersichtlich:</strong> Sie sehen sofort, wer bezahlt hat und wer nicht</li>
                    <li><strong>Mahnwesen:</strong> Automatische Erinnerungen bei offenen Beiträgen</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <Separator className="my-6" />
          
          <section id="vs-jubilaeen" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">4. Geburtstage & Jubiläen</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Nie wieder einen Geburtstag vergessen</CardTitle></CardHeader>
              <CardContent>
                <p>Die Software hilft Ihnen dabei, alle wichtigen Geburtstage und Vereinsjubiläen im Blick zu behalten.</p>
                
                <h4 className="font-semibold mt-4 mb-2">Das macht die Software für Sie:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Geburtstage anzeigen:</strong> Wer hat diesen Monat Geburtstag?</li>
                  <li><strong>Jubiläen berechnen:</strong> Wer ist seit 25, 40 oder 50 Jahren im Verein?</li>
                  <li><strong>Ehrungen planen:</strong> Welche Ehrungen stehen in den nächsten Jahren an?</li>
                  <li><strong>Urkunden erstellen:</strong> Automatische Jubiläums-Urkunden mit Vereinslogo</li>
                </ul>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <h5 className="font-medium text-blue-800 mb-2">🎂 Geburtstags-Ehrungen:</h5>
                    <ul className="list-disc pl-5 text-sm text-blue-700">
                      <li>18 Jahre: Glückwunschkarte</li>
                      <li>50 Jahre: Besondere Ehrung</li>
                      <li>60, 70 Jahre: Gutschein</li>
                      <li>Ab 70: Alle 5 Jahre</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <h5 className="font-medium text-green-800 mb-2">🏆 Vereins-Jubiläen:</h5>
                    <ul className="list-disc pl-5 text-sm text-green-700">
                      <li>10 Jahre: Bronze-Ehrennadel</li>
                      <li>25 Jahre: Silber-Ehrennadel</li>
                      <li>40 Jahre: Gold-Ehrennadel</li>
                      <li>50+ Jahre: Besondere Ehrungen</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-4">
                  <h4 className="font-medium text-yellow-800 mb-2">📅 5-Jahres-Planung:</h4>
                  <p className="text-yellow-700">Sie können bis zu 5 Jahre im Voraus planen und sehen, welche Ehrungen in den kommenden Jahren anstehen. So können Sie rechtzeitig Urkunden bestellen und Feiern organisieren.</p>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <Separator className="my-6" />
          
          <section id="vs-lizenzen" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">5. Lizenzen & Ausbildungen</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Schießsport-Lizenzen im Blick behalten</CardTitle></CardHeader>
              <CardContent>
                <p>Viele Schützen haben verschiedene Lizenzen und Ausbildungen, die regelmäßig erneuert werden müssen. Die Software hilft Ihnen dabei, den Überblick zu behalten.</p>
                
                <h4 className="font-semibold mt-4 mb-2">Diese Lizenzen & Ausbildungen können Sie verwalten (v1.5.8):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h5 className="font-medium mb-2">🎯 8 Echte Schießsport-Ausbildungen:</h5>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>Waffensachkunde</li>
                      <li>Schieß- und Standaufsicht</li>
                      <li>JugendBasisLizenz</li>
                      <li>Schießsportleiter</li>
                      <li>Fachschießsportleiter</li>
                      <li>Trainer C Basis</li>
                      <li>Kampfrichter B</li>
                      <li>Trainer C Leistung</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h5 className="font-medium mb-2">👔 12 Vorstandspositionen:</h5>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      <li>1./2. Vorsitzender</li>
                      <li>Kassenwart</li>
                      <li>Schriftführer</li>
                      <li>Schießwart</li>
                      <li>Jugendwart</li>
                      <li>Damenwart</li>
                      <li>Zeugwart</li>
                      <li>Pressewart</li>
                      <li>Beisitzer</li>
                      <li>Ehrenvorsitzender</li>
                      <li>Kassenprüfer</li>
                      <li>+ DSB-Lizenznummern</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-red-50 p-3 rounded-md border border-red-200 mt-4">
                  <h4 className="font-medium text-red-800 mb-2">⚠️ Automatische 90-Tage-Warnung (v1.5.8):</h4>
                  <p className="text-red-700">Die Software warnt Sie automatisch 90 Tage vor Ablauf mit Status-Ampel: <strong>Grün</strong> (aktiv), <strong>Gelb</strong> (läuft bald ab), <strong>Rot</strong> (abgelaufen). Live-Statistiken zeigen Ihnen sofort, welche Lizenzen Aufmerksamkeit benötigen.</p>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <Separator className="my-6" />
          
          <section id="vs-aufgaben" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">6. Aufgaben für den Vorstand</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">To-Do-Listen für bessere Organisation</CardTitle></CardHeader>
              <CardContent>
                <p>Mit dem Aufgaben-Management können Sie wichtige Vereinsaufgaben planen, verteilen und verfolgen.</p>
                
                <h4 className="font-semibold mt-4 mb-2">So funktioniert es:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Aufgabe erstellen:</strong> Beschreiben Sie, was gemacht werden muss</li>
                  <li><strong>Zuständigkeit festlegen:</strong> Wer soll die Aufgabe erledigen?</li>
                  <li><strong>Frist setzen:</strong> Bis wann muss die Aufgabe erledigt sein?</li>
                  <li><strong>Priorität wählen:</strong> Ist es dringend oder kann es warten?</li>
                  <li><strong>Status verfolgen:</strong> Ist die Aufgabe erledigt oder noch offen?</li>
                </ol>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-red-50 p-3 rounded-md">
                    <h5 className="font-medium text-red-800 mb-2">🔴 Hoch:</h5>
                    <ul className="list-disc pl-5 text-sm text-red-700">
                      <li>Jahreshauptversammlung</li>
                      <li>Steuererklärung</li>
                      <li>Versicherung erneuern</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <h5 className="font-medium text-yellow-800 mb-2">🟡 Mittel:</h5>
                    <ul className="list-disc pl-5 text-sm text-yellow-700">
                      <li>Vereinszeitung erstellen</li>
                      <li>Schießstand renovieren</li>
                      <li>Neue Mitglieder werben</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <h5 className="font-medium text-green-800 mb-2">🟢 Niedrig:</h5>
                    <ul className="list-disc pl-5 text-sm text-green-700">
                      <li>Website aktualisieren</li>
                      <li>Archiv sortieren</li>
                      <li>Vereinsausflug planen</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <Separator className="my-6" />
          
          <section id="vs-suche" className="space-y-4 scroll-mt-20">
            <h2 className="text-3xl font-semibold text-primary border-b pb-2">7. Globale Suche nutzen</h2>
            <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Alles finden mit einem Klick</CardTitle></CardHeader>
              <CardContent>
                <p>Die globale Suche hilft Ihnen dabei, schnell alles zu finden - egal ob Mitglieder, Aufgaben, Beiträge oder andere Vereinsdaten.</p>
                
                <h4 className="font-semibold mt-4 mb-2">So nutzen Sie die Suche:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Suchfeld finden:</strong> Das Suchfeld steht oben in der Navigation</li>
                  <li><strong>Begriff eingeben:</strong> Tippen Sie ein, was Sie suchen (Name, Aufgabe, etc.)</li>
                  <li><strong>Ergebnisse anschauen:</strong> Die Software zeigt Ihnen passende Treffer</li>
                  <li><strong>Direkt hinspringen:</strong> Klicken Sie auf ein Ergebnis, um direkt dorthin zu gelangen</li>
                </ol>
                
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-4">
                  <h4 className="font-medium text-blue-800 mb-2">🔍 Das können Sie suchen:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                      <li><strong>Mitglieder:</strong> "Hans Müller" oder "Müller"</li>
                      <li><strong>Aufgaben:</strong> "Jahreshauptversammlung"</li>
                      <li><strong>Beiträge:</strong> "SEPA" oder "Lastschrift"</li>
                      <li><strong>Jubiläen:</strong> "Geburtstag" oder "Ehrung"</li>
                    </ul>
                    <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
                      <li><strong>Lizenzen:</strong> "Sportschütze" oder "Jagdschein"</li>
                      <li><strong>Bereiche:</strong> "Dashboard" oder "Statistik"</li>
                      <li><strong>Funktionen:</strong> "Backup" oder "Export"</li>
                      <li><strong>Und vieles mehr...</strong></li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-md border border-green-200 mt-4">
                  <h4 className="font-medium text-green-800 mb-2">💡 Tipp:</h4>
                  <p className="text-green-700">Die Suche ist sehr intelligent - sie findet auch Ergebnisse, wenn Sie sich bei der Schreibweise nicht ganz sicher sind. Probieren Sie es einfach aus!</p>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <Separator className="my-6" />
          <p className="text-center text-sm text-muted-foreground"><em>Dieses Handbuch wird regelmäßig aktualisiert, wenn neue Funktionen hinzukommen.</em></p>
        </>
      )}
    </div>
  );
}
