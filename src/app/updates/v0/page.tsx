"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function Version0UpdatesPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/updates" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary">Updates & Changelog: Version 0.x</h1>
        <p className="text-muted-foreground mt-2">Beta-Versionen mit grundlegenden Funktionen und kontinuierlichen Verbesserungen.</p>
      </div>
      
      <Tabs defaultValue="latest" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="latest">Aktuelle Version</TabsTrigger>
          <TabsTrigger value="previous">Vorherige Versionen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="latest" className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-xl text-primary flex items-center justify-between">
                <span>Version 0.8.5 (17. Juni 2025)</span>
                <span className="text-sm bg-primary/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <span>Aktuell</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">Beta</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verbesserte Update-Dokumentation</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neu: Strukturierte Update-Seiten für bessere Übersicht</li>
                    <li>Verbessert: Schnellere Ladezeiten durch optimierte Seitenstruktur</li>
                    <li>Verbessert: Einfachere Navigation zwischen Versionshistorien</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Version 0.8.4 (16. Juni 2025)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">UI-Modernisierung</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neu: Modernes Dashboard-Layout mit abgerundeten Karten und subtilen Schatten</li>
                    <li>Neu: Optimierte mobile Ansicht für Tabellen und Touch-freundliche Bedienelemente</li>
                    <li>Neu: Verbesserte visuelle Hierarchie mit Farbakzenten für wichtige Aktionen</li>
                    <li>Neu: Interaktive Diagramme für Ergebnistrends mit Leistungsindikatoren</li>
                    <li>Neu: Farbkodierte Leistungsindikatoren (grün für Verbesserung, rot für Verschlechterung)</li>
                    <li>Neu: Platzhalter für Benachrichtigungssystem für wichtige Updates</li>
                    <li>Verbessert: Konsistente Farbpalette mit Hauptfarbton und Akzentfarben</li>
                    <li>Verbessert: Mehr Weißraum zwischen Elementen für bessere Lesbarkeit</li>
                    <li>Hervorgehoben: Progressive Web App (PWA) Funktionalität bereits integriert</li>
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
                  <CardTitle className="text-xl">Version 0.8.3 (15. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">"Außer Konkurrenz"-Funktion</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Mannschaften können als "außer Konkurrenz" markiert werden</li>
                        <li>Neu: Anzeige eines "AK"-Badges in Tabellen mit Tooltip für den Grund</li>
                        <li>Neu: Migrationsfunktion für bestehende Teams</li>
                        <li>Neu: Admin-Seite für Migration unter `/admin/migrations`</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">TypeScript-Optimierung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: TypeScript-Konfiguration mit strengeren Typprüfungen</li>
                        <li>Verbessert: ESLint-Konfiguration für TypeScript mit erweiterten Regeln</li>
                        <li>Neu: Konvertierung von JavaScript-Hooks zu TypeScript mit expliziten Typdefinitionen</li>
                        <li>Neu: Erweiterte zentrale Typdefinitionen für bessere Codequalität</li>
                        <li>Verbessert: Test-Utilities mit erweiterten Optionen für Routing und State-Management</li>
                        <li>Neu: Dokumentation für TypeScript-Best-Practices und Vercel-Deployment</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Verbesserungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: "Nicht zugewiesen" Filter für Ligen in der Mannschaftsverwaltung</li>
                        <li>Behoben: RWK-Tabellen können jetzt vollständig minimiert werden</li>
                        <li>Verbessert: Entwicklungsdokumentation für bessere Nachvollziehbarkeit</li>
                        <li>Verbessert: Mannschaftsverwaltung behält Saison-Auswahl nach dem Speichern bei</li>
                        <li>Behoben: Problem mit dem Speichern von Mannschaften mit "Außer Konkurrenz"-Status</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Technische Optimierungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Migration von JavaScript-Services zu TypeScript für bessere Typsicherheit</li>
                        <li>Verbessert: Entfernung doppelter und ungenutzter Dateien für schlankere Projektstruktur</li>
                        <li>Verbessert: Optimierte Projektstruktur mit konsistenten Dateiendungen</li>
                        <li>Neu: Aktualisierte Dokumentation mit Aufräumplan für zukünftige Verbesserungen</li>
                        <li>Verbessert: Reduzierte Projektgröße durch Entfernung temporärer und Backup-Dateien</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.8.2 (10. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Verbesserte Dokumentenverwaltung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Kategorie "Ligalisten & Handtabellen" für bessere Organisation</li>
                        <li>Neu: Jahresfilterung für Ligalisten und Handtabellen</li>
                        <li>Neu: Gruppierung von Ligalisten nach Liga-Typ (Kreisoberliga, Kreisliga, etc.)</li>
                        <li>Neu: Suchfunktion für alle Dokumente</li>
                        <li>Neu: Integrierte PDF-Vorschau ohne Download</li>
                        <li>Verbessert: Visuelle Kennzeichnung von eingeschränkten Dokumenten</li>
                        <li>Verbessert: Jahr-Badges für schnelle Identifikation von Ligalisten</li>
                        <li>Verbessert: Zugriffsschutz für eingeschränkte Dokumente (nur für Vereinsvertreter, Mannschaftsführer und Admin)</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Erweiterte Statistik-Funktionen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Saisonübergreifende Vergleiche für Schützen und Mannschaften</li>
                        <li>Neu: Trendanalyse für Leistungsentwicklung</li>
                        <li>Neu: Erweiterte Filteroptionen für Statistiken</li>
                        <li>Verbessert: Neue Statistik-Übersichtsseite mit direkten Links zu allen Funktionen</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Weitere Versionen können hier hinzugefügt werden */}
              
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
                        <li>Behoben: Durchgang wird beim Mannschaftswechsel in der Ergebniserfassung nicht mehr zurückgesetzt</li>
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
                        <li>Behoben: Fälschlicherweise angezeigter Fehler-Toast "maximal 3 Mannschaften ausgewählt" beim Öffnen des "Neuen Schützen anlegen"-Dialogs</li>
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
                        <li>RWK-Tabellen verarbeiten jetzt URL-Query-Parameter, um direkt spezifische Ligen und Jahre anzuzeigen</li>
                        <li>Ligen-Akkordeons in RWK-Tabellen sind jetzt standardmäßig geöffnet</li>
                        <li>Einzelschützen in der aufgeklappten Mannschafts-Detailansicht sind nun klickbar und öffnen den Statistik-Dialog</li>
                        <li>Behebung von Darstellungs- und JavaScript-Fehlern auf der RWK-Tabellenseite</li>
                        <li>Filterung von "Einzel"-Mannschaften aus der Mannschaftsrangliste</li>
                        <li>Korrekte Berechnung von Mannschafts-Rundenergebnissen (nur wenn 3 Schützen Ergebnisse haben)</li>
                        <li>Anpassung der DG-Spaltenüberschriften in der Mannschaftstabelle für bessere Lesbarkeit</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.2.6a (22. Mai 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Hotfix: Handbuch-Fehler und Build-Stabilität</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Syntaxfehler auf der Handbuch-Anzeigeseite behoben, der das Rendern verhinderte</li>
                        <li>Korrekturen an Icon-Importen zur Verbesserung der Vercel-Build-Stabilität</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Ältere Versionen (0.0.2.0 - 0.2.5)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p>Frühere Versionen enthielten grundlegende Funktionen wie:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Vereins-, Saison-, Liga-, Mannschafts- und Schützenverwaltung für Admins</li>
                    <li>Grundstruktur für Vereinsvertreter-Bereich</li>
                    <li>RWK-Tabellenseite mit Anzeige von Ligen, Mannschaften und Einzelschützen</li>
                    <li>Support-System mit Ticket-Verwaltung</li>
                    <li>Firestore-Sicherheitsregeln und Benutzerberechtigungen</li>
                    <li>Responsive Design und mobile Optimierung</li>
                    <li>Progressive Web App (PWA) Funktionalität</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
