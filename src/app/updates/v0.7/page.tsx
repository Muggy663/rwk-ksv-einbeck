"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function Version07UpdatesPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/updates" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary">Updates & Changelog: Version 0.7.x</h1>
        <p className="text-muted-foreground mt-2">MongoDB-Integration und Dokumentenverwaltung.</p>
      </div>
      
      <div className="space-y-4">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
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
                <CardTitle className="text-xl">Version 0.7.0 (05. Juni 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Grundlegende Dokumentenverwaltung</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Neu: Dokumentenseite mit Anzeige von PDF-Dokumenten</li>
                      <li>Neu: Einfache Kategorisierung von Dokumenten</li>
                      <li>Neu: Grundlegende Zugriffssteuerung für Dokumente</li>
                      <li>Verbessert: Optimierte Darstellung von Dokumenten auf mobilen Geräten</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
