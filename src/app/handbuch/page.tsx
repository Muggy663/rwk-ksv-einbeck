// src/app/handbuch/page.tsx
"use client"; // Required for useAuth hook

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookOpenCheckIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

const ADMIN_EMAIL = "admin@rwk-einbeck.de"; // Define Super Admin Email

export default function HandbuchPage() {
  const { user, loading } = useAuth(); // Get user and loading state

  // Determine if the current user is the Super Admin
  // Only consider not loading and user is present
  const isSuperAdmin = !loading && user?.email === ADMIN_EMAIL;

  // While loading auth state, we can show a loader or nothing for the admin section
  // For simplicity, if loading, isSuperAdmin will be false, and the section won't show.

  return (
    <div className="space-y-8 container mx-auto px-4 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <BookOpenCheckIcon className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Benutzerhandbuch RWK Einbeck App</h1>
          <p className="text-lg text-muted-foreground">
            Funktionen und Bedienung der Rundenwettkampf (RWK) App.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-accent">Inhaltsverzeichnis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <ul className="list-disc list-inside pl-4 space-y-1">
                <li><a href="#einleitung" className="text-primary hover:underline">Einleitung</a></li>
                <li><a href="#erste-schritte" className="text-primary hover:underline">Erste Schritte</a></li>
                {isSuperAdmin && ( // Conditionally render link to admin section
                  <li><a href="#fuer-super-administratoren" className="text-primary hover:underline">Für Super-Administratoren</a></li>
                )}
                <li><a href="#fuer-vereinsvertreter" className="text-primary hover:underline">Für Vereinsvertreter</a></li>
                <li><a href="#oeffentliche-ansichten" className="text-primary hover:underline">Öffentliche Ansichten</a></li>
                <li><a href="#support" className="text-primary hover:underline">Support</a></li>
            </ul>
        </CardContent>
      </Card>
      
      <Separator className="my-6" />

      <section id="einleitung" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">1. Einleitung</h2>
        <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Zweck der Anwendung</CardTitle></CardHeader>
            <CardContent><p>Die RWK Einbeck App dient zur Verwaltung und Darstellung der Rundenwettkämpfe des Kreisschützenverbandes Einbeck. Sie ermöglicht die Pflege von Stammdaten (Saisons, Ligen, Vereine, Mannschaften, Schützen), die Erfassung von Ergebnissen und die Anzeige von Tabellen und Ranglisten.</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Zielgruppen</CardTitle></CardHeader>
            <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Super-Administratoren:</strong> Verantwortlich für die Gesamtverwaltung der Anwendung, Anlage von Saisons, Ligen, Vereinen, Zuweisung von Mannschaften zu Ligen und die Verwaltung von Benutzerrechten.</li>
                    <li><strong>Vereinsvertreter/Mannschaftsführer:</strong> Verantwortlich für die Verwaltung der Mannschaften und Schützen ihres/ihrer zugewiesenen Vereins/e sowie die Erfassung von Ergebnissen für die Ligen, an denen ihre Vereine teilnehmen.</li>
                    <li><strong>Öffentlichkeit/Schützen:</strong> Können Tabellen, Ergebnisse und aktuelle Informationen einsehen.</li>
                </ul>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-6" />

      <section id="erste-schritte" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">2. Erste Schritte</h2>
        <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Login</CardTitle></CardHeader>
            <CardContent>
                <p>Der Login erfolgt über die "/login"-Seite.</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Vereinsvertreter/Mannschaftsführer</strong> erhalten ihre Zugangsdaten (E-Mail, initiales Passwort) vom Super-Administrator. Dieser legt die Benutzerkonten manuell in Firebase Authentication an und weist die Rolle und Vereinszugehörigkeit(en) über das Admin-Panel der App zu.</li>
                </ul>
            </CardContent>
        </Card>
      </section>
      
      <Separator className="my-6" />

      {isSuperAdmin && ( // Conditionally render the entire admin section
        <section id="fuer-super-administratoren" className="space-y-4 scroll-mt-20">
          <h2 className="text-3xl font-semibold text-primary border-b pb-2">3. Für Super-Administratoren</h2>
          <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Dashboard Übersicht (Admin)</CardTitle></CardHeader>
              <CardContent><p>Das Admin-Dashboard (erreichbar über den Link "Admin Panel" in der Hauptnavigation nach Login als Super-Admin) bietet eine zentrale Übersicht über die Verwaltungsfunktionen und eine Agenda für offene Punkte.</p></CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Saisonverwaltung</CardTitle></CardHeader>
              <CardContent>
                  <p>Pfad: <code>/admin/seasons</code></p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Anlegen:</strong> Neue Wettkampfsaisons (z.B. "RWK 2025 Kleinkaliber") mit Jahr, Disziplintyp (Kleinkaliber, Luftdruck) und Status (Geplant, Laufend, Abgeschlossen) erstellen.</li>
                      <li><strong>Bearbeiten:</strong> Bestehende Saisondaten ändern.</li>
                      <li><strong>Löschen:</strong> Saisons entfernen.</li>
                      <li><strong>Navigation:</strong> Von hier aus können direkt die Ligen einer Saison verwaltet werden.</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Ligaverwaltung</CardTitle></CardHeader>
              <CardContent>
                  <p>Pfad: <code>/admin/leagues</code></p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Vorauswahl:</strong> Zuerst eine Saison auswählen.</li>
                      <li><strong>Anlegen:</strong> Neue Ligen (z.B. Kreisoberliga, Kreisliga) für die ausgewählte Saison erstellen. Der spezifische Disziplintyp (z.B. KKG, LGA) muss aus einer Liste ausgewählt werden.</li>
                      <li><strong>Bearbeiten/Löschen:</strong> Bestehende Ligen ändern oder entfernen.</li>
                      <li><strong>Navigation:</strong> Von hier aus können direkt die Mannschaften einer Liga verwaltet werden.</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Vereinsverwaltung</CardTitle></CardHeader>
              <CardContent>
                  <p>Pfad: <code>/admin/clubs</code></p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Anlegen:</strong> Neue Vereine mit Name, Kürzel und Vereinsnummer (Format 08-XXX) erfassen.</li>
                      <li><strong>Bearbeiten/Löschen:</strong> Vereinsdaten ändern oder Vereine entfernen.</li>
                      <li><strong>Prüfung:</strong> Verhindert das Anlegen von Vereinen mit identischem Namen.</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Mannschaftsverwaltung (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Pfad: <code>/admin/teams</code></p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Filter:</strong> Saison, Verein und Liga auswählen, um die anzuzeigenden Mannschaften zu filtern. Wichtig, um "liga-lose" Mannschaften eines Vereins für eine Saison zu finden und diese einer Liga zuzuordnen.</li>
                      <li><strong>Anlegen:</strong> Neue Mannschaften erstellen. Der Verein wird aus der Liste der existierenden Vereine ausgewählt. Die Saison wird übernommen. Die Liga kann hier zugewiesen werden.</li>
                      <li><strong>Bearbeiten:</strong> Mannschaftsname, Ligazugehörigkeit und Mannschaftsführer-Kontaktdaten ändern.</li>
                      <li><strong>Mannschaftsführer-Kontaktdaten:</strong> Name, E-Mail und Telefon des Mannschaftsführers können optional erfasst werden.</li>
                      <li><strong>Schützen zuweisen:</strong> Bestehende Schützen (die dem Verein der Mannschaft angehören) können der Mannschaft zugeordnet werden (max. 3). Die Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" wird geprüft.</li>
                      <li><strong>Löschen:</strong> Mannschaften entfernen. (Bereinigt auch Referenzen in Schützen-Dokumenten).</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Schützenverwaltung (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Pfad: <code>/admin/shooters</code></p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Filter:</strong> Nach Verein filtern.</li>
                      <li><strong>Anlegen:</strong> Neue Schützen mit Vorname, Nachname, Geschlecht und Vereinszugehörigkeit erstellen. Beim Anlegen können Schützen direkt Mannschaften des ausgewählten Vereins zugeordnet werden, unter Beachtung der Regeln (max. 3 pro Team, ein Schütze pro Saison/Disziplinkategorie nur einem Team).</li>
                      <li><strong>Bearbeiten/Löschen:</strong> Schützendaten ändern oder Schützen entfernen. (Löschen bereinigt Referenzen in Team-Dokumenten).</li>
                      <li><strong>Prüfung:</strong> Verhindert das Anlegen von Schützen mit identischem vollen Namen im selben Verein.</li>
                      <li><strong>Anzeige:</strong> Zugehörigkeit zu Mannschaften wird informativ angezeigt.</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Ergebniserfassung (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Pfad: <code>/admin/results</code></p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Auswahl:</strong> Saison (nur "Laufend"), Liga, Mannschaft, Durchgang und Schütze auswählen.</li>
                      <li><strong>Eingabe:</strong> Ringergebnis und Ergebnistyp (Regulär, Vorschießen, Nachschießen) eintragen. Ringzahlen werden auf Plausibilität geprüft.</li>
                      <li><strong>Liste:</strong> Ergebnisse werden vor dem endgültigen Speichern in einer Liste gesammelt ("Zur Liste hinzufügen"). Bereits für einen Durchgang/Schützen erfasste Ergebnisse (auch die in der aktuellen Sitzung gespeicherten oder vorgemerkten oder bereits in der DB existierenden) werden im Dropdown nicht mehr angeboten.</li>
                      <li><strong>Speichern:</strong> Alle gesammelten Ergebnisse werden in die Datenbank (`rwk_scores`) geschrieben. Enthält Erfasser-Infos (Admin-UID, Name).</li>
                      <li><strong>"Letzte Änderungen"-Feed:</strong> Erfolgreich gespeicherte Ergebnisse erstellen/aktualisieren einen Eintrag für die Startseite (gruppiert nach Liga/Tag, mit Disziplintyp).</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Ergebnisse bearbeiten/löschen (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Pfad: <code>/admin/edit-results</code></p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li><strong>Filter:</strong> Ergebnisse nach Saison, Liga, Mannschaft, Schütze, Durchgang suchen.</li>
                      <li><strong>Anzeige:</strong> Gefundene Ergebnisse in einer Tabelle mit Erfasser- und Änderungs-Infos.</li>
                      <li><strong>Bearbeiten:</strong> Ringzahl und Ergebnistyp eines Ergebnisses können geändert werden. Die Änderungshistorie (wer, wann) wird gespeichert.</li>
                      <li><strong>Löschen:</strong> Ergebnisse können endgültig gelöscht werden.</li>
                  </ul>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Benutzerverwaltung (Admin)</CardTitle></CardHeader>
              <CardContent>
                  <p>Pfad: <code>/admin/user-management</code></p>
                  <p className="font-medium mt-2">Aktueller Workflow (ohne Cloud Functions für Benutzeranlage, aber mit Firestore für Berechtigungen):</p>
                  <ol className="list-decimal list-inside space-y-1 pl-4 text-sm text-muted-foreground">
                      <li>Der Super-Admin legt neue Benutzer **manuell in der Firebase Authentication Konsole** an (E-Mail, initiales Passwort). Die UID des neuen Benutzers muss notiert werden.</li>
                      <li>Auf dieser Seite (`/admin/user-management`) trägt der Super-Admin die **UID, E-Mail und den Anzeigenamen** des Benutzers ein.</li>
                      <li>Eine **Rolle** ("vereinsvertreter" oder "mannschaftsfuehrer") und bis zu **drei Vereine** können zugewiesen werden.</li>
                      <li>Beim Speichern wird ein Dokument in der `user_permissions`-Collection in Firestore erstellt/aktualisiert (mit der UID als Dokument-ID).</li>
                  </ol>
                   <p className="mt-2 text-sm text-muted-foreground">Hinweis: Die Implementierung zur direkten Benutzeranlage aus der App heraus (was eine Cloud Function erfordern würde) oder das Auflisten von Nutzern ohne Berechtigungseintrag wurde aufgrund von Firebase-Billing-Plan-Abhängigkeiten (Blaze Plan für Cloud Functions) vorerst zurückgestellt bzw. so umgangen.</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Support Tickets einsehen</CardTitle></CardHeader>
              <CardContent>
                  <p>Pfad: <code>/admin/support-tickets</code></p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Zeigt eine Liste aller über das Support-Formular eingegangenen Tickets an, sortiert nach Datum.</li>
                      <li>Aktuell reine Anzeige-Funktion.</li>
                  </ul>
              </CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle className="text-xl text-accent">Agenda / Offene Punkte</CardTitle></CardHeader>
              <CardContent>
                <p>Diese Sektion im Admin-Dashboard listet geplante Features und offene Aufgaben für die Weiterentwicklung der App.</p>
                {/* Hier könnte dynamisch eine Liste aus der /admin/page.tsx geladen werden oder statisch gepflegt werden */}
              </CardContent>
          </Card>
        </section>
      )}

      <Separator className="my-6" />

      <section id="fuer-vereinsvertreter" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">4. Für Vereinsvertreter</h2>
         <CardContent><p>Nach dem Login mit den vom Super-Admin bereitgestellten Zugangsdaten und der Zuweisung der Rolle ("vereinsvertreter" oder "mannschaftsfuehrer") sowie der Vereinszugehörigkeit(en) in der `user_permissions`-Collection, erhält der Benutzer Zugriff auf den "Mein Verein"-Bereich. Die App liest diese Berechtigungen aus Firestore, um den Zugriff zu steuern.</p></CardContent>
        <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Dashboard Übersicht (VV)</CardTitle></CardHeader>
            <CardContent><p>Pfad: <code>/verein/dashboard</code>. Zeigt eine Begrüßung und die Namen der Vereine an, für die der VV zuständig ist (basierend auf den `user_permissions`).</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Vereinsauswahl (falls mehrere Vereine zugewiesen)</CardTitle></CardHeader>
            <CardContent><p>Wenn einem VV mehrere Vereine in seinen `user_permissions` zugewiesen sind, erscheint auf den Seiten "Meine Mannschaften", "Meine Schützen" und "Ergebnisse erfassen" oben ein Dropdown, um den Verein auszuwählen, für den aktuell Aktionen durchgeführt werden sollen (`activeClubId`).</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Mannschaftsverwaltung (VV)</CardTitle></CardHeader>
            <CardContent>
                <p>Pfad: <code>/verein/mannschaften</code>. Aktionen beziehen sich auf den ausgewählten/zugewiesenen `activeClubId`.</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Saisonauswahl:</strong> Der VV wählt eine vom Super-Admin angelegte Saison aus.</li>
                    <li><strong>Anzeige:</strong> Mannschaften des eigenen Vereins für die gewählte Saison (und ggf. Liga, falls vom Admin zugewiesen).</li>
                    <li><strong>Anlegen:</strong> Neue Mannschaften für den eigenen Verein und die gewählte Saison erstellen. **Die Zuweisung zu einer spezifischen Liga erfolgt durch den Super-Admin.** Name und Mannschaftsführer-Kontaktdaten können erfasst werden.</li>
                    <li><strong>Bearbeiten:</strong> Namen von Mannschaften und Mannschaftsführer-Kontaktdaten ändern.</li>
                    <li><strong>Schützen zuweisen:</strong> Schützen des eigenen Vereins können den Mannschaften zugeordnet werden (max. 3, Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" wird geprüft, falls Team schon Ligatyp hat).</li>
                    <li><strong>Löschen:</strong> Eigene Mannschaften entfernen.</li>
                </ul>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Schützenverwaltung (VV)</CardTitle></CardHeader>
            <CardContent>
                <p>Pfad: <code>/verein/schuetzen</code>. Aktionen beziehen sich auf den ausgewählten/zugewiesenen `activeClubId`.</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Anzeige:</strong> Schützen des eigenen Vereins.</li>
                    <li><strong>Anlegen:</strong> Neue Schützen für den eigenen Verein erstellen (Vorname, Nachname, Geschlecht). Eine direkte Mannschaftszuordnung beim Anlegen erfolgt hier nicht, sondern über die Mannschaftsverwaltungsseite.</li>
                    <li><strong>Bearbeiten/Löschen:</strong> Stammdaten eigener Schützen ändern oder Schützen entfernen.</li>
                </ul>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Ergebniserfassung (VV)</CardTitle></CardHeader>
            <CardContent>
                <p>Pfad: <code>/verein/ergebnisse</code>. Bezug auf den ausgewählten/zugewiesenen `activeClubId` für die Filterung der Ligen.</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Saisonauswahl:</strong> Nur "Laufende" Saisons.</li>
                    <li><strong>Ligaauswahl:</strong> Nur Ligen, in denen der `activeClubId` im gewählten Wettkampfjahr Mannschaften gemeldet hat.</li>
                    <li><strong>Mannschaftsauswahl:</strong> Alle Mannschaften der ausgewählten Liga (eigene und gegnerische), damit Ergebnisse für Begegnungen eingetragen werden können.</li>
                    <li><strong>Schützenauswahl:</strong> Schützen der ausgewählten Mannschaft.</li>
                    <li>Die weitere Erfassungslogik (Liste, Speichern, Validierung, Schütze verschwindet aus Dropdown) ist identisch zur Admin-Ergebniserfassung. Die `clubId` im Ergebnisdokument ist die des Teams, für das das Ergebnis eingetragen wird. Der `enteredByUserId` ist der des eingeloggten VV.</li>
                </ul>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-6" />

      <section id="oeffentliche-ansichten" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">5. Öffentliche Ansichten</h2>
        <Card>
            <CardHeader><CardTitle className="text-xl text-accent">RWK Tabellen</CardTitle></CardHeader>
            <CardContent>
                <p>Pfad: <code>/rwk-tabellen</code></p>
                 <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Filter:</strong> Auswahl von Wettkampfjahr (dynamisch aus vorhandenen Saisons) und Disziplin (Kleinkaliber, Luftdruck).</li>
                    <li><strong>Anzeige:</strong> Zeigt nur Ligen von Saisons mit Status "Laufend".</li>
                    <li><strong>Mannschaftsrangliste:</strong> Tabellarische Übersicht der Ligen mit Mannschaften, deren Rundenergebnissen, Gesamtergebnis und Schnitt. Mannschaften können aufgeklappt werden, um Einzelergebnisse der Schützen zu sehen.</li>
                    <li><strong>Einzelschützenrangliste:</strong> Tabellarische Übersicht aller Schützen der ausgewählten Saison/Disziplin, sortiert nach Gesamtleistung, mit Anzeige der Rundenergebnisse, Gesamt und Schnitt.</li>
                    <li><strong>Bester Schütze / Beste Dame:</strong> Werden hervorgehoben.</li>
                    <li><strong>Detailansicht Schütze:</strong> Klick auf einen Schützennamen öffnet einen Dialog mit dessen Detailergebnissen und einem Leistungsdiagramm.</li>
                </ul>
            </CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Letzte Änderungen (Startseite)</CardTitle></CardHeader>
            <CardContent><p>Pfad: <code>/</code> (Startseite). Zeigt die neuesten Aktualisierungen an, wenn Ergebnisse für Ligen hinzugefügt wurden (gruppiert pro Liga, Tag und Disziplin, mit Angabe der Disziplin).</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Updates & Changelog</CardTitle></CardHeader>
            <CardContent><p>Pfad: <code>/updates</code>. Listet die Versionshistorie der Anwendung mit den wichtigsten Änderungen und Neuerungen auf.</p></CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Impressum</CardTitle></CardHeader>
            <CardContent><p>Pfad: <code>/impressum</code>. Enthält die rechtlich notwendigen Angaben zum Betreiber der Webseite.</p></CardContent>
        </Card>
      </section>

      <Separator className="my-6" />
      
      <section id="support" className="space-y-4 scroll-mt-20">
        <h2 className="text-3xl font-semibold text-primary border-b pb-2">6. Support</h2>
        <Card>
            <CardHeader><CardTitle className="text-xl text-accent">Support-Ticket erstellen</CardTitle></CardHeader>
            <CardContent>
              <p>Pfad: <code>/support</code></p>
              <p className="mt-1">Ein Formular, um Fragen, Probleme oder Anregungen an den Administrator zu senden. Die Nachrichten werden in einer Firestore-Datenbank (`support_tickets`) gespeichert und können vom Administrator eingesehen werden.</p>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-6"/>
      <p className="text-center text-sm text-muted-foreground"><em>Dieses Handbuch wird parallel zur Entwicklung der Anwendung aktualisiert.</em></p>
    </div>
  );
}
