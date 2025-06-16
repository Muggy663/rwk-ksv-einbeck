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
                <span>Version 0.8.3 (15. Juni 2025)</span>
                <span className="text-sm bg-primary/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <span>Aktuell</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">Beta</span>
                </span>
              </CardTitle>
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
        </TabsContent>
        
        <TabsContent value="previous" className="space-y-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
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
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Benutzerfreundlichkeit</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Vereinfachte Navigation und Benutzeroberfläche</li>
                        <li>Verbessert: Kombinierte Terminverwaltung im Vereinsdashboard</li>
                        <li>Verbessert: Optimierte Terminkalender-Verlinkung auf der Startseite</li>
                        <li>Verbessert: Konsistentere Benutzerführung in der gesamten Anwendung</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.8.1 (09. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Fehlerbehebungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Anzeige von "durchgang" mit großem Anfangsbuchstaben auf der Startseite</li>
                        <li>Behoben: Anzeige von Schützen-IDs statt Namen in erweiterten Statistiken</li>
                        <li>Behoben: Anzeige von Screenshots in Support-Tickets im Admin-Bereich</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Leistungsoptimierung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Schnellere Ladezeiten für Statistik-Dashboards</li>
                        <li>Verbessert: Optimierte Datenbankabfragen für bessere Performance</li>
                        <li>Verbessert: Reduzierte Bundle-Größe für schnellere Seitenladezeiten</li>
                        <li>Behoben: Speicherlecks in der Diagramm-Darstellung</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.8.0 (08. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Mobile Optimierung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Responsive Tabellendarstellung für mobile Geräte</li>
                        <li>Neu: Touch-freundliche Diagramme mit verbesserten Interaktionen</li>
                        <li>Verbessert: Anpassung der Navigation für mobile Geräte</li>
                        <li>Verbessert: Optimierte Darstellung auf kleinen Bildschirmen</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Caching-Strategie</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Lokales Caching für häufig abgefragte Daten</li>
                        <li>Neu: Optimierte Abfragemuster für bessere Performance</li>
                        <li>Neu: Automatische Aktualisierung bei Datenänderungen</li>
                        <li>Verbessert: Schnellere Ladezeiten durch intelligentes Caching</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Neue Funktionen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Schützenvergleich-Funktion mit Auswahl von bis zu 6 Schützen</li>
                        <li>Neu: Saisonübergreifende Statistiken für Mannschaften</li>
                        <li>Neu: Automatische Benachrichtigungen bei neuen Ergebnissen</li>
                        <li>Neu: Erweiterte Exportfunktionen für alle Statistiken</li>
                        <li>Neu: Verbesserte Druckansichten mit anpassbaren Optionen</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.7.5 (07. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">MongoDB-Integration</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: MongoDB-Integration für die Dokumentenverwaltung</li>
                        <li>Neu: Speicherung von Dokumenten in MongoDB GridFS</li>
                        <li>Neu: Speichernutzungsüberwachung für MongoDB</li>
                        <li>Neu: Migrations-Tool für die Übertragung von Dokumenten von JSON zu MongoDB</li>
                        <li>Verbessert: Fehlerbehandlung und Fallback-Mechanismen</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.7.4 (06. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Dokumentenverwaltung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: JSON-basierte Dokumentenverwaltung</li>
                        <li>Neu: Admin-Interface für Dokumentenverwaltung</li>
                        <li>Verbessert: Optimierte Dokumentenseite</li>
                        <li>Verbessert: Optimierung der Dokumentenseite für mobile Geräte</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.7.3 (05. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">PDF-Optimierung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Caching für PDF-Generierung</li>
                        <li>Verbessert: Optimierung der Bildqualität und Dateigröße</li>
                        <li>Verbessert: Fehlerbehandlung bei der PDF-Erstellung</li>
                        <li>Neu: Fortschrittsanzeige während der PDF-Generierung</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.7.2 (04. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Fehlerbehebungen & Verbesserungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Login-Formular-Fehler "Required" auf Vercel</li>
                        <li>Neu: "Passwort ändern"-Funktion</li>
                        <li>Behoben: Standard-Statistik-Seite korrigiert</li>
                        <li>Neu: "Erste Schritte starten"-Button mit Funktionalität</li>
                        <li>Verbessert: Vereinfachung der Benutzeroberfläche</li>
                        <li>Verbessert: JavaScript-Umstellung für bessere Kompatibilität</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.7.1 (03. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Vercel-Kompatibilität</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Vercel-Build-Fehler</li>
                        <li>Verbessert: Service-Module von TypeScript zu JavaScript konvertiert</li>
                        <li>Neu: Fehlende PDF-Generierungsfunktionen</li>
                        <li>Neu: Fallback-CSS-Stile</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.7.0 (03. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Neue Funktionen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Umfassendes Statistik-Dashboard mit erweiterten Visualisierungen</li>
                        <li>Neu: Schützenvergleich-Funktion mit Auswahl von bis zu 6 Schützen</li>
                        <li>Neu: Leistungsentwicklung von Schützen über die Saison (Liniendiagramm)</li>
                        <li>Neu: Vergleich zwischen Mannschaften einer Liga (Balkendiagramm)</li>
                        <li>Neu: Verteilung der Ergebnisse nach Geschlecht (Kreisdiagramm)</li>
                        <li>Neu: Übersichtlicher Kalender für alle Wettkämpfe und Veranstaltungen</li>
                        <li>Neu: Export von Terminen als iCal-Datei (kompatibel mit Google Kalender)</li>
                        <li>Neu: Progressive Web App (PWA) Funktionalität</li>
                        <li>Neu: Offline-Zugriff auf grundlegende Funktionen</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Verbesserungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Responsive Design für alle Seiten</li>
                        <li>Verbessert: Touch-optimierte UI-Elemente</li>
                        <li>Verbessert: Anpassung der Tabellen für kleine Bildschirme</li>
                        <li>Verbessert: Optimierte Druckansicht für Ligaergebnisse ohne sensible Daten</li>
                        <li>Verbessert: Direkter Druck aus der Tabellenseite</li>
                        <li>Verbessert: Optimierte Ladezeiten für große Datenmengen</li>
                        <li>Verbessert: Einheitliche Darstellung auf allen Geräten</li>
                        <li>Verbessert: Konsistentes Layout mit Logo in der Kopfzeile und Footer</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Fehlerbehebungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Router-Update-Fehler im AdminLayout beim automatischen Logout</li>
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