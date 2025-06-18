"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function Version08UpdatesPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/updates" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary">Updates & Changelog: Version 0.8.x</h1>
        <p className="text-muted-foreground mt-2">UI-Modernisierung und strukturierte Update-Dokumentation.</p>
      </div>
      
      <div className="space-y-4">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.8.5 (17. Juni 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Dunkelmodus & Barrierefreiheit</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Neu: Systemweiter Dunkelmodus mit automatischer Erkennung der Systemeinstellungen</li>
                      <li>Neu: Manueller Dark/Light Mode Toggle in den Benutzereinstellungen</li>
                      <li>Verbessert: Kontrastreiche Farbschemata für bessere Zugänglichkeit</li>
                      <li>Neu: Vollständige Tastaturnavigation mit sichtbarem Fokus-Indikator</li>
                      <li>Verbessert: ARIA-Labels und Screenreader-Optimierungen</li>
                    </ul>

                    <h3 className="text-lg font-semibold mb-2 mt-4">Leistungsoptimierungen</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Verbessert: Optimierte Datenbankabfragen für schnellere Ladezeiten</li>
                      <li>Neu: React.memo und useMemo für effizienteres Rendering</li>
                      <li>Verbessert: Code-Splitting für reduzierte Bundle-Größe</li>
                      <li>Verbessert: Lazy Loading für Komponenten und Routen</li>
                    </ul>

                    <h3 className="text-lg font-semibold mb-2 mt-4">Modernes Layout & UI</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Neu: Überarbeitetes Layout mit verbesserter Raumnutzung</li>
                      <li>Verbessert: Konsistente Abstände und Typografie</li>
                      <li>Neu: Sanfte Übergänge und Animationen</li>
                      <li>Verbessert: Responsive Design für alle Bildschirmgrößen</li>
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
                      <li>Verbessert: Zugriffsschutz für eingeschränkte Dokumente</li>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.8.1 (09. Juni 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Technische Optimierungen</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Verbessert: Optimierte Datenbankabfragen für schnellere Ladezeiten</li>
                      <li>Verbessert: Reduzierte Bundle-Größe durch Code-Splitting</li>
                      <li>Verbessert: Verbesserte Caching-Strategien für häufig abgerufene Daten</li>
                      <li>Behoben: Diverse kleinere Fehler und UI-Inkonsistenzen</li>
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
                    <h3 className="text-lg font-semibold mb-2">Designsystem-Überarbeitung</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Neu: Einheitliches Designsystem mit konsistenten Komponenten</li>
                      <li>Neu: Verbesserte Farbpalette mit besseren Kontrasten</li>
                      <li>Neu: Optimierte Typografie für bessere Lesbarkeit</li>
                      <li>Verbessert: Responsive Design für alle Bildschirmgrößen</li>
                      <li>Verbessert: Barrierefreiheit durch verbesserte Fokus-Zustände und Screenreader-Unterstützung</li>
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