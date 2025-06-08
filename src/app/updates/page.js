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
                <span>Version 0.7.4 (08. Juni 2025)</span>
                <span className="text-sm bg-primary/20 px-2 py-1 rounded-full">Aktuell</span>
              </CardTitle>
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
        </TabsContent>
        
        <TabsContent value="previous" className="space-y-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
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
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Vereinfachung der Benutzeroberfläche</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Vereinfachte Navigation mit optimierter Button-Anordnung</li>
                        <li>Verbessert: Optimierte Startseite mit weniger Redundanz</li>
                        <li>Verbessert: Vereinfachtes Vereinsdashboard für bessere Übersichtlichkeit</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">JavaScript-Umstellung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Weitere Komponenten von TypeScript zu JavaScript konvertiert</li>
                        <li>Verbessert: JSDoc-Typdefinitionen für bessere Entwicklererfahrung</li>
                        <li>Neu: Platzhalter für automatischen Saisonabschluss / Auf- und Abstieg</li>
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
                        <li>Verbessert: Konfigurationsdateien von TypeScript zu JavaScript konvertiert für bessere Vercel-Kompatibilität</li>
                        <li>Verbessert: Service-Module als JavaScript mit JSDoc-Typdefinitionen implementiert</li>
                        <li>Verbessert: Webpack-Konfiguration für problematische Bibliotheken angepasst</li>
                        <li>Neu: Fallback-CSS-Stile für verbesserte Zuverlässigkeit bei Problemen mit Tailwind</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">PDF-Generierung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Vollständige Implementierung aller PDF-Generierungsfunktionen</li>
                        <li>Neu: Unterstützung für Mannschaftstabellen, Einzelschützentabellen, Handtabellen und Gesamtlisten</li>
                        <li>Verbessert: Optimierte PDF-Layouts für bessere Lesbarkeit</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Benutzerfreundlichkeit</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Login-Formular-Fehler "Required" auf Vercel</li>
                        <li>Verbessert: Explizite Validierungsmeldungen für Formularfelder</li>
                        <li>Verbessert: Fehlerbehandlung bei der Anmeldung</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Dokumentation</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Dokumentation der Vercel-Deployment-Anforderungen</li>
                        <li>Aktualisiert: Entwicklerdokumentation mit Informationen zu JavaScript-Service-Modulen</li>
                        <li>Verbessert: Roadmap für zukünftige Entwicklungen</li>
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
                        <li>Neu: Unterscheidung zwischen RWK-Terminen und Kreisverbandsterminen</li>
                        <li>Neu: Terminverwaltung zum Bearbeiten und Löschen von Terminen (nur für Administratoren)</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Mobile Optimierung</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Responsive Design für alle Seiten</li>
                        <li>Neu: Progressive Web App (PWA) Funktionalität</li>
                        <li>Neu: Offline-Zugriff auf grundlegende Funktionen</li>
                        <li>Verbessert: Touch-optimierte UI-Elemente</li>
                        <li>Verbessert: Anpassung der Tabellen für kleine Bildschirme</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Druckfunktion</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Neu: Optimierte Druckansicht für Ligaergebnisse ohne sensible Daten</li>
                        <li>Verbessert: Direkter Druck aus der Tabellenseite</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Fehlerbehebungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Router-Update-Fehler im AdminLayout beim automatischen Logout</li>
                        <li>Verbessert: Optimierte Ladezeiten für große Datenmengen</li>
                        <li>Verbessert: Einheitliche Darstellung auf allen Geräten</li>
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
                        <li>Hinzugefügt: Logo in der oberen linken Ecke der Anwendung für bessere Markenidentität</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Fehlerbehebungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Behoben: Problem mit der Groß-/Kleinschreibung bei der Abfrage von Saisons in RWK-Tabellen</li>
                        <li>Behoben: "RWK" aus dem Anzeigenamen der Wettbewerbe entfernt</li>
                        <li>Behoben: Icons in der Hauptnavigation aktualisiert für bessere Verständlichkeit</li>
                        <li>Behoben: Login-Button in der Hauptnavigation wiederhergestellt</li>
                        <li>Behoben: Dokumente und Support-Links zur Hauptnavigation hinzugefügt</li>
                        <li>Behoben: Beispieldaten für Termine entfernt, wenn keine Termine gefunden werden</li>
                        <li>Behoben: Beispieldaten aus statistics-service entfernt</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Verbesserungen</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: Protokollierung der verfügbaren Disziplinen für bessere Fehlerdiagnose</li>
                        <li>Verbessert: Konsistente Behandlung von Groß-/Kleinschreibung bei Disziplinen (kk/KK, lg/LG)</li>
                        <li>Verbessert: Ortsauswahl bei Terminen verwendet jetzt Clubs aus der Datenbank</li>
                        <li>Verbessert: Konsistentes Layout mit Logo in der Kopfzeile für bessere Markenidentität</li>
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
                        <li>Verbessert: Benutzerhandbuch für normale Benutzer vereinfacht, technische Begriffe entfernt</li>
                        <li>Geändert: Begriff "Spielstärke" im Handbuch durch "Mannschaftsstärke" ersetzt</li>
                        <li>Behoben: "undefined"-Einträge im Handbuch entfernt</li>
                        <li>Verbessert: Nummerierung der Abschnitte im Handbuch für normale Benutzer korrigiert</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Dokumentation</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Aktualisiert: Handbuch mit benutzerfreundlicheren Erklärungen</li>
                        <li>Aktualisiert: Versionsnummer und Datum in allen relevanten Dateien</li>
                        <li>Geändert: Bezeichnung "Super-Administrator" durchgängig durch "Rundenwettkampfleiter" ersetzt</li>
                        <li>Korrigiert: Hinweise auf mehrere Vereine pro Benutzer entfernt</li>
                        <li>Aktualisiert: Information zur Passwortänderung beim ersten Login aktualisiert</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Technische Details</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Verbessert: PDF-Generierung für Urkunden mit Unterschriftenbildern</li>
                        <li>Optimiert: Layout der Druckansicht für bessere Lesbarkeit</li>
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
                  </div>
                </CardContent>
              </Card>
              
              {/* Weitere Versionen hier... */}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}