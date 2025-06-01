"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function UpdatesPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">Updates & Changelog</h1>
      
      <Tabs defaultValue="latest" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="latest">Aktuelle Version</TabsTrigger>
          <TabsTrigger value="previous">Vorherige Versionen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="latest" className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-xl text-primary flex items-center justify-between">
                <span>Version 0.6.3 (01. Juni 2025)</span>
                <span className="text-sm bg-primary/20 px-2 py-1 rounded-full">Aktuell</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Sicherheit & Benutzerfreundlichkeit</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neu: Automatischer Logout nach 10 Minuten Inaktivität mit sichtbarem Countdown-Timer</li>
                    <li>Neu: Verbesserte Benutzerführung für Vereinsvertreter und Mannschaftsführer</li>
                    <li>Verbessert: Onboarding-Dialog zeigt nur für relevante Benutzerrollen an</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">PDF-Exporte & Auswertungen</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neu: Gesamtrangliste aller Einzelschützen über alle Ligen hinweg (außer Sportpistole)</li>
                    <li>Neu: Filterung der Einzelschützenergebnisse nach Geschlecht (männlich/weiblich)</li>
                    <li>Neu: Urkunden-Generator für die besten Schützen und Mannschaften jeder Liga</li>
                    <li>Neu: Automatische Erstellung von Urkunden für Gesamtsieger (bester Schütze, beste Dame)</li>
                    <li>Verbessert: Optimiertes PDF-Layout mit Kreisverbandslogo und besserer Lesbarkeit</li>
                    <li>Verbessert: Mehr Abstand zwischen Einzelschützenergebnissen für bessere Übersichtlichkeit</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Vercel-Kompatibilität</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Verbesserte Kompatibilität mit Vercel-Deployment durch Optimierung des URL-Parameter-Handlings</li>
                    <li>Behebung von Fehlern beim statischen Rendering auf Vercel</li>
                    <li>Optimierte Suspense-Boundary-Behandlung für Next.js 15</li>
                    <li>Verbesserte Firestore-Abfragen für Vercel-Limits bei der Urkunden-Generierung</li>
                    <li>Optimierte Asset-Handhabung für PDF-Generierung auf Vercel</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Benutzerfreundlichkeit</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neu: Passwort-Sichtbarkeits-Toggle für einfachere Passworteingabe</li>
                    <li>Verbessert: Zurück-Button bei Urkunden-Erstellung für bessere Navigation</li>
                    <li>Verbessert: Entfernung von "RWK" aus Saisonnamen für bessere Lesbarkeit</li>
                    <li>Verbessert: Kennzeichnung von Platzhalter-Funktionen in der Dokumentenverwaltung</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Bugfixes</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Behebung des Fehlers "CircleAlert is not defined" in der Dokumentenverwaltung</li>
                    <li>Behebung von Rendering-Problemen in verschiedenen Admin-Bereichen</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Version 0.6.2 (26. Mai 2025)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Dokumentenverwaltung</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neue Dokumentenverwaltung für Ausschreibungen, Formulare und Regelwerke</li>
                    <li>Upload von PDF-Dateien oder Verlinkung zu externen Webseiten</li>
                    <li>Kategorisierung nach Dokumenttyp (Ausschreibung, Formular, Regelwerk, Archiv)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Benutzerfreundlichkeit</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Verbesserte Navigation und Filteroptionen in der Ergebniserfassung</li>
                    <li>Optimierte Darstellung auf mobilen Geräten</li>
                    <li>Hilfetexte und Tooltips für komplexe Funktionen</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Bugfixes</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Behebung von Darstellungs- und JavaScript-Fehlern auf der RWK-Tabellenseite (EOF, useSearchParams).</li>
                    <li>Korrektur der Sortierung in der Einzelschützen-Rangliste</li>
                    <li>Verbesserung der Ladezeiten bei großen Datenmengen</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="previous" className="space-y-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.6.1 (26. Mai 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">PDF-Funktionalität & Vorjahresdurchschnitt</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Druckfunktion für Ligaergebnisse implementiert</li>
                        <li>Neu: Optimierte PDF-Layouts für bessere Lesbarkeit</li>
                        <li>Neu: Integration des Vorjahresdurchschnitts in Team-Dialoge</li>
                        <li>Neu: Hilfs-Tooltips für komplexe Funktionen</li>
                        <li>Verbessert: Onboarding-Assistent mit zusätzlichen Hinweisen</li>
                        <li>Verbessert: PDF-Export-Seite für Ergebnislisten und Urkunden</li>
                        <li>Verbessert: Admin-Index für einfacheren Import von Admin-Komponenten</li>
                        <li>Behoben: Verschiedene Bugfixes und Performance-Optimierungen</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.6.0 (28. Mai 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Benutzerführung & Audit-Trail</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: "Erste Schritte"-Assistent für neue Vereinsvertreter und Mannschaftsführer</li>
                        <li>Neu: Aufforderung zur Passwortänderung nach dem ersten Login</li>
                        <li>Neu: Übersicht der Mannschaftsführer für Vereinsvertreter</li>
                        <li>Neu: Audit-Trail für Ergebniserfassung mit detaillierter Änderungshistorie</li>
                        <li>Neu: "Schnitt Vorjahr" Funktionalität in den Team-Dialogen implementiert</li>
                        <li>Neu: PDF-Generierung für Ergebnislisten und Urkunden</li>
                        <li>Verbessert: Vereins-Layout mit zusätzlichem Menüpunkt für Mannschaftsführer</li>
                        <li>Verbessert: Dokumentation und Benutzerhandbuch aktualisiert</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.5.1 (27. Mai 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Bugfixes für Passwort-Reset und Mannschaftsführer-Anzeige</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Fehler beim Passwort-Reset-Formular durch Auslagerung in separate Komponente</li>
                        <li>Behoben: Mannschaftsführer wurden in der Übersicht nicht angezeigt aufgrund unterschiedlicher Feldnamen in der Datenbank</li>
                        <li>Behoben: Firestore-Sicherheitsregeln für Vereinsvertreter korrigiert (Feldname clubId statt assignedClubId)</li>
                        <li>Verbessert: Saisonauswahl in der Mannschaftsführer-Übersicht mit automatischer Auswahl der neuesten Saison</li>
                        <li>Dokumentation aktualisiert mit Datenbankstruktur-Informationen und Berechtigungsmodell</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.5.0 (26. Mai 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">UX-Verbesserungen & Benutzerfreundlichkeit</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Passwort-Reset-Funktion für Benutzer implementiert</li>
                        <li>Neu: Suchfunktion für Schützen bei größeren Vereinen hinzugefügt</li>
                        <li>Neu: Vereinfachte Mannschaftsanlage mit Dropdown für Mannschaftsstärke</li>
                        <li>Neu: Admin-Panel mit Liste aller Mannschaftsführer einer Saison und Kontaktdaten</li>
                        <li>Verbessert: Deutlichere visuelle Unterscheidung zwischen verfügbaren und zugewiesenen Schützen</li>
                        <li>Verbessert: Automatische Vorauswahl des aktuellen Durchgangs basierend auf Datum</li>
                        <li>Verbessert: Live-Validierung der Ringzahlen während der Eingabe</li>
                        <li>Verbessert: Admin-Benutzerverwaltung mit optimierter Benutzeroberfläche</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.4.0 (25. Mai 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Berechtigungen für Ergebniserfassung & Tooltips</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Vereinsvertreter können jetzt Ergebnisse für alle Mannschaften in einer Liga erfassen, in der ihr Verein teilnimmt</li>
                        <li>Verbessert: Tooltips für bessere Benutzerführung in allen Bereichen hinzugefügt</li>
                        <li>Optimiert: Ergebniserfassung speichert jetzt jedes Ergebnis einzeln, um Berechtigungsprobleme zu vermeiden</li>
                        <li>Aktualisierung der Dokumentation und Handbuch mit den neuesten Funktionen</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.3.5 (24. Mai 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Verbesserte Ergebniserfassung & Benutzerfreundlichkeit</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Schützen ohne Ergebnisse werden in der Ergebniserfassung fett und mit Warnzeichen (⚠️) hervorgehoben</li>
                        <li>Aktualisierung der Dokumentation und Handbuch mit den neuesten Funktionen</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.3.4 (24. Mai 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Firestore Sicherheitsregeln & Ergebniserfassung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Durchgang wird beim Mannschaftswechsel in der Ergebniserfassung nicht mehr zurückgesetzt (Admin und Vereinsvertreter)</li>
                        <li>Behoben: "seasonId is not defined"-Fehler in der Ergebniserfassung für Admin und Vereinsvertreter</li>
                        <li>Verbessert: Mannschaften, deren Schützen bereits alle Ergebnisse für einen Durchgang haben, werden aus dem Dropdown entfernt</li>
                        <li>Verbessert: Anzeige "Alle Teams vollständig erfasst" wenn keine Mannschaften mehr für den ausgewählten Durchgang verfügbar sind</li>
                        <li>Firestore-Sicherheitsregeln implementiert und getestet</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.3.3 (22. Mai 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Fehlerbehebung Admin-Schützenverwaltung & Stabilitätsverbesserungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Fälschlicherweise angezeigter Fehler-Toast "maximal 3 Mannschaften ausgewählt" beim Öffnen des "Neuen Schützen anlegen"-Dialogs im Admin-Panel</li>
                        <li>Diverse Korrekturen an Importen und Code-Struktur zur Verbesserung der Build-Stabilität auf Vercel</li>
                        <li>Aktualisierung der Handbuch- und Agenda-Texte</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.3.1 (22. Mai 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">RWK-Ordnung, Handbuch-Fix & Vorbereitung Admin-Agenda</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neue Seite "/rwk-ordnung" mit Inhalt erstellt und in die Hauptnavigation aufgenommen</li>
                        <li>Syntaxfehler auf der Seite "/handbuch" behoben, der das Rendern verhinderte</li>
                        <li>Handbuch und Admin-Agenda mit den neuesten Funktionen und vereinfachten Formulierungen aktualisiert</li>
                        <li>Fehlerbehebungen im Zusammenhang mit Icon-Importen auf verschiedenen Seiten</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.3.0 (22. Mai 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Verbesserte RWK-Tabellen, Doku & Fahrplan</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>RWK-Tabellen (/rwk-tabellen) verarbeiten jetzt URL-Query-Parameter, um direkt spezifische Ligen und Jahre anzuzeigen (Verlinkung von Startseite)</li>
                        <li>Ligen-Akkordeons in RWK-Tabellen sind jetzt standardmäßig geöffnet</li>
                        <li>Einzelschützen in der aufgeklappten Mannschafts-Detailansicht (RWK-Tabellen) sind nun klickbar und öffnen den Statistik-Dialog</li>
                        <li>Behebung von Darstellungs- und JavaScript-Fehlern auf der RWK-Tabellenseite (EOF, useSearchParams)</li>
                        <li>Handbuch und Admin-Dashboard-Agenda an den aktuellen Entwicklungsstand angepasst</li>
                        <li>Filterung von "Einzel"-Mannschaften aus der Mannschaftsrangliste</li>
                        <li>Korrekte Berechnung von Mannschafts-Rundenergebnissen (nur wenn 3 Schützen Ergebnisse haben)</li>
                        <li>Anpassung der DG-Spaltenüberschriften in der Mannschaftstabelle für bessere Lesbarkeit</li>
                        <li>Behebung einer Dauerschleife auf der RWK-Tabellenseite durch Optimierung der React Hooks</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.2.0 (15. April 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Admin-Bereich</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Komplette Verwaltung von Saisons, Ligen, Vereinen, Mannschaften und Schützen</li>
                        <li>Ergebniserfassung und -bearbeitung</li>
                        <li>Support-Ticket-System</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Öffentliche Ansichten</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>RWK-Tabellen mit Mannschafts- und Einzelranglisten</li>
                        <li>"Letzte Änderungen"-Feed auf der Startseite</li>
                        <li>RWK-Ordnung und Impressum</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}