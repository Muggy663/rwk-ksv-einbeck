"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function Version09Page() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">Version 0.9.x Updates</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Erweiterte Funktionen und verbesserte Benutzerverwaltung.
      </p>

      <Tabs defaultValue="latest" className="space-y-4">
        <TabsList>
          <TabsTrigger value="latest">Aktuelle Version</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="latest" className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-xl text-primary flex items-center justify-between">
                <span>Version 0.9.0 (20. Juni 2025)</span>
                <span className="text-sm bg-primary/20 px-2 py-1 rounded-full">Aktuell</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Erweiterte Statistikfunktionen</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neu: Saisonübergreifende Statistiken für Schützen</li>
                    <li>Neu: Saisonübergreifende Statistiken für Mannschaften</li>
                    <li>Neu: Visualisierung von Leistungstrends über mehrere Saisons</li>
                    <li>Neu: Detaillierte Analyse der Durchschnittsentwicklung</li>
                    <li>Neu: Chronologischer Leistungsverlauf mit Trendlinien</li>
                    <li>Neu: Vergleich von Schützen innerhalb einer Mannschaft</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Auf-/Abstiegsfunktion</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neu: Verwaltung des Auf- und Abstiegs von Mannschaften zwischen Ligen</li>
                    <li>Neu: Automatisierte Verarbeitung basierend auf Saisonergebnissen</li>
                    <li>Neu: Integration in den Saisonwechsel-Prozess</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verbessertes Änderungsprotokoll</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neu: Automatische Erfassung aller relevanten Änderungen</li>
                    <li>Neu: Filterbare Ansicht nach Benutzer, Datum und Aktionstyp</li>
                    <li>Verbessert: Übersichtliche Darstellung der Änderungen</li>
                    <li>Verbessert: Aktualisierungsfunktion zum manuellen Neuladen</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verbesserte Benutzerverwaltung</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neu: Integriertes Formular zum Anlegen neuer Benutzer direkt in der Weboberfläche</li>
                    <li>Neu: Übersichtliche Tabs für verschiedene Funktionen (Erstellen, Bearbeiten, Liste)</li>
                    <li>Neu: Anzeige des letzten Logins in der Benutzerübersicht</li>
                    <li>Verbessert: Detaillierte Anleitung zur Benutzerverwaltung</li>
                    <li>Verbessert: Automatische Aktualisierung der Benutzerliste nach Änderungen</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Datenbereinigung</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Neu: Funktion zum Bereinigen von Referenzen auf gelöschte Mannschaften</li>
                    <li>Neu: Admin-Seite zur Datenbereinigung</li>
                    <li>Verbessert: Benutzerfreundliche Oberfläche mit Statusanzeigen</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Allgemeine Verbesserungen</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Verbessert: Optimierte Benutzeroberfläche für bessere Lesbarkeit</li>
                    <li>Verbessert: Konsistente Farbgebung im hellen und dunklen Modus</li>
                    <li>Neu: Übersichtliches Admin-Dashboard</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Roadmap für Version 0.9</CardTitle>
              <CardDescription>
                Geplante Features und deren Entwicklungsstatus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Hohe Priorität</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li className="flex items-start">
                      <span className="flex-grow">Benutzerverwaltung vereinfachen: Integriertes Formular zum Anlegen neuer Benutzer direkt in der Weboberfläche</span>
                      <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Erweiterte Statistikfunktionen: Saisonübergreifende Statistiken für Schützen und Mannschaften</span>
                      <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Leistungstrends über mehrere Saisons visualisieren</span>
                      <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Änderungsprotokoll verbessern: Automatische Erfassung aller relevanten Änderungen</span>
                      <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Filterbare Ansicht nach Benutzer, Datum, Änderungstyp</span>
                      <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Automatisierter Saisonwechsel mit Migration der Daten</span>
                      <Badge variant="outline" className="ml-2">In Arbeit</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Auf-/Abstiegsregelung implementieren</span>
                      <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Mittlere Priorität</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li className="flex items-start">
                      <span className="flex-grow">Liga-Verwaltung intuitiver gestalten: Drag-and-Drop-Interface für die Zuordnung von Vereinen zu Ligen</span>
                      <Badge variant="outline" className="ml-2">Geplant</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Vorschau der Liga-Struktur vor dem Speichern</span>
                      <Badge variant="outline" className="ml-2">Geplant</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Assistenten für die Erstellung neuer Ligen mit Vorschlägen basierend auf Vorjahren</span>
                      <Badge variant="outline" className="ml-2">Geplant</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Terminverwaltung erweitern: Integration mit externen Kalendern (iCal-Export)</span>
                      <Badge variant="outline" className="ml-2">Geplant</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Erinnerungsfunktion für wichtige Termine</span>
                      <Badge variant="outline" className="ml-2">Geplant</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Mobile Optimierung für Ergebniserfassung</span>
                      <Badge variant="outline" className="ml-2">Geplant</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Dokumentenverwaltung erweitern: Kategorisierung und verbesserte Suchfunktion</span>
                      <Badge variant="outline" className="ml-2">Geplant</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Zugriffsrechte pro Dokument oder Kategorie</span>
                      <Badge variant="outline" className="ml-2">Geplant</Badge>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Zu evaluieren</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li className="flex items-start">
                      <span className="flex-grow">Offline-Modus für Ergebniserfassung ohne Internetverbindung</span>
                      <Badge variant="outline" className="ml-2">Zu prüfen</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Benachrichtigungssystem für wichtige Ereignisse</span>
                      <Badge variant="outline" className="ml-2">Zu prüfen</Badge>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-grow">Integrierter Chat für Mannschaftsführer und Vereinsvertreter</span>
                      <Badge variant="outline" className="ml-2">Zu prüfen</Badge>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}