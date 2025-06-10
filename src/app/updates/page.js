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
                <span>Version 0.8.1 (12. Juni 2025)</span>
                <span className="text-sm bg-primary/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <span>Aktuell</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">Beta</span>
                </span>
              </CardTitle>
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
                  <h3 className="text-lg font-semibold mb-2">Neue Funktionen</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neu: E-Mail-Benachrichtigung bei neuen Support-Tickets</li>
                    <li>Neu: Hinweis zum Saisonvergleich (erst ab 2026 relevant)</li>
                    <li>Verbessert: Benutzerfreundlichere Formulierungen im Support-Bereich</li>
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
                  <CardTitle className="text-xl">Version 0.8.0 (10. Juni 2025)</CardTitle>
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
                  <CardTitle className="text-xl">Version 0.7.5 (15. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">MongoDB-Integration für Dokumente</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: MongoDB-Integration für die Dokumentenverwaltung</li>
                        <li>Neu: Speicherung von Dokumenten in MongoDB GridFS</li>
                        <li>Neu: Speichernutzungsüberwachung für MongoDB</li>
                        <li>Neu: Migrations-Tool für die Übertragung von Dokumenten von JSON zu MongoDB</li>
                        <li>Verbessert: Zuverlässigere Dokumentenverwaltung auf Vercel</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Verbesserte Fehlerbehandlung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Robustere Fehlerbehandlung bei der Dokumentenverwaltung</li>
                        <li>Neu: Fallback-Mechanismus zur JSON-Datei, wenn MongoDB nicht verfügbar ist</li>
                        <li>Verbessert: Bessere Fehlerbehandlung beim Hochladen von Dokumenten</li>
                        <li>Verbessert: Detaillierte Fehlerprotokolle für die Diagnose von Problemen</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Admin-Panel-Erweiterungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Speichernutzungsanzeige für MongoDB im Admin-Panel</li>
                        <li>Neu: Migrations-Tool für die Übertragung von Dokumenten im Admin-Panel</li>
                        <li>Verbessert: Optimierte Dokumentenverwaltung mit MongoDB-Integration</li>
                        <li>Verbessert: Verbesserte Benutzeroberfläche für die Dokumentenverwaltung</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.7.4 (08. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Dokumentenverwaltung im Admin-Panel</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Admin-Interface zur Verwaltung von Dokumenten</li>
                        <li>Neu: JSON-basierte Metadatenverwaltung für Dokumente</li>
                        <li>Neu: API-Endpunkte für CRUD-Operationen auf Dokumenten</li>
                        <li>Neu: Benutzerfreundliches Formular zum Hinzufügen und Bearbeiten von Dokumenten</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Verbesserte Dokumentenseite</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Kategorisierte Ansicht von Dokumenten (Ausschreibungen, Formulare, Regelwerke, Archiv)</li>
                        <li>Neu: Strukturierte Dokumentenablage in Unterordnern nach Kategorien</li>
                        <li>Verbessert: Optimierte Darstellung von Dokumenten mit Metadaten</li>
                        <li>Verbessert: Mobile Optimierung der Dokumentenseite</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Mobile Optimierungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Responsive Tabs mit 2 Spalten auf kleinen Bildschirmen</li>
                        <li>Verbessert: Angepasste Schriftgrößen und Abstände für mobile Geräte</li>
                        <li>Verbessert: Optimierte Button-Darstellung auf kleinen Bildschirmen</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.7.3 (08. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Optimierung der PDF-Generierung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Caching-System für PDF-Dokumente zur Verbesserung der Performance</li>
                        <li>Neu: Fortschrittsanzeige während der PDF-Generierung</li>
                        <li>Verbessert: Komprimierungsoptionen für kleinere Dateigrößen</li>
                        <li>Verbessert: Robustere Fehlerbehandlung bei der PDF-Erstellung</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Technische Verbesserungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Optimierte Speichernutzung durch intelligentes Caching</li>
                        <li>Verbessert: Schnellere Reaktionszeiten bei wiederholten PDF-Exporten</li>
                        <li>Neu: Cache-Verwaltung mit automatischer Invalidierung</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.7.2 (07. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Fehlerbehebungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Login-Formular-Fehler "Required" auf Vercel</li>
                        <li>Behoben: Standard-Statistik-Seite mit korrigiertem Mannschaftsvergleich</li>
                        <li>Verbessert: Dynamische Y-Achse für bessere Darstellung der Mannschaftsvergleiche</li>
                        <li>Verbessert: Filterung von Teams ohne Ergebnisse in Statistiken</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Neue Funktionen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: "Erste Schritte starten"-Button mit interaktivem Einführungs-Wizard</li>
                        <li>Neu: Rollenbasierte Inhalte im Einführungs-Wizard für verschiedene Benutzertypen</li>
                        <li>Neu: "Passwort ändern"-Funktion für erhöhte Sicherheit</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.7.1 (06. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Vercel-Kompatibilität</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Konfigurationsdateien von TypeScript zu JavaScript konvertiert</li>
                        <li>Verbessert: Service-Module als JavaScript mit JSDoc-Typdefinitionen implementiert</li>
                        <li>Verbessert: Webpack-Konfiguration für problematische Bibliotheken angepasst</li>
                        <li>Neu: Fallback-CSS-Stile für verbesserte Zuverlässigkeit bei Problemen mit Tailwind</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">PDF-Generierung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Vollständige Implementierung aller PDF-Generierungsfunktionen</li>
                        <li>Neu: Unterstützung für Mannschaftstabellen, Einzelschützentabellen und Gesamtlisten</li>
                        <li>Verbessert: Optimierte PDF-Layouts für bessere Lesbarkeit</li>
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
                      <h3 className="text-lg font-semibold mb-2">Statistik-Dashboard</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Umfassendes Statistik-Dashboard mit erweiterten Visualisierungen</li>
                        <li>Neu: Leistungsentwicklung von Schützen über die Saison (Liniendiagramm)</li>
                        <li>Neu: Vergleich zwischen Mannschaften einer Liga (Balkendiagramm)</li>
                        <li>Neu: Verteilung der Ergebnisse nach Geschlecht (Kreisdiagramm)</li>
                        <li>Neu: Filter für Saison, Liga und Verein</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Terminkalender</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Übersichtlicher Kalender für alle Wettkämpfe und Veranstaltungen</li>
                        <li>Neu: Filterung nach Liga und Termintyp</li>
                        <li>Neu: Export von Terminen als iCal-Datei (kompatibel mit Google Kalender)</li>
                        <li>Neu: Einfaches Eingabeformular für neue Termine mit Tooltips</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.6.5 (05. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Neue Funktionen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Hinzugefügt: PDF-Export für Ligaergebnisse und Einzelschützenergebnisse</li>
                        <li>Hinzugefügt: Druckfreundliche Darstellung der Tabellen</li>
                        <li>Hinzugefügt: Logo in der oberen linken Ecke der Anwendung</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Fehlerbehebungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Problem mit der Groß-/Kleinschreibung bei der Abfrage von Saisons</li>
                        <li>Behoben: "RWK" aus dem Anzeigenamen der Wettbewerbe entfernt</li>
                        <li>Behoben: Icons in der Hauptnavigation aktualisiert für bessere Verständlichkeit</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.6.4 (02. Juni 2025)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Benutzeroberfläche</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Logo in den Ergebnislisten ist jetzt rechtsbündig positioniert</li>
                        <li>Behoben: Doppelte Anzeige von "Kleinkaliber" in den Urkunden entfernt</li>
                        <li>Hinzugefügt: Unterschriftenbilder in den Urkunden für Präsident und Rundenwettkampfleiter</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Dokumentation</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Aktualisiert: Handbuch mit benutzerfreundlicheren Erklärungen</li>
                        <li>Aktualisiert: Versionsnummer und Datum in allen relevanten Dateien</li>
                        <li>Geändert: Bezeichnung "Super-Administrator" durch "Rundenwettkampfleiter" ersetzt</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Version 0.6.3 (01. Juni 2025)</CardTitle>
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
                        <li>Neu: Gesamtrangliste aller Einzelschützen über alle Ligen hinweg</li>
                        <li>Neu: Filterung der Einzelschützenergebnisse nach Geschlecht</li>
                        <li>Neu: Urkunden-Generator für die besten Schützen und Mannschaften jeder Liga</li>
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