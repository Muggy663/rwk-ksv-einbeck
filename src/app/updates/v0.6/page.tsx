"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function Version06UpdatesPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/updates" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary">Updates & Changelog: Version 0.6.x</h1>
        <p className="text-muted-foreground mt-2">Erweiterte Funktionen und Optimierungen.</p>
      </div>
      
      <div className="space-y-4">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.6.3 (30. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Erweiterte Statistik-Funktionen</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Neu: Erweiterte Statistik-Seite mit detaillierten Analysen</li>
                      <li>Neu: Vergleichsfunktion für Schützen über mehrere Saisons</li>
                      <li>Neu: Trendanalyse für Mannschaftsleistungen</li>
                      <li>Verbessert: Optimierte Darstellung von Statistik-Diagrammen</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.6.2 (29. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Verbesserte Dokumentenverwaltung</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Neu: Kategorisierung von Dokumenten nach Typ und Jahr</li>
                      <li>Neu: Filterfunktion für Dokumente nach Kategorie</li>
                      <li>Verbessert: Optimierte Darstellung der Dokumentenliste</li>
                      <li>Verbessert: Schnellere Ladezeiten für Dokumente</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.6.1 (28. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Optimierungen und Fehlerbehebungen</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Behoben: Probleme mit der Anzeige von Mannschaftsergebnissen</li>
                      <li>Verbessert: Schnellere Ladezeiten für RWK-Tabellen</li>
                      <li>Verbessert: Optimierte Datenbankabfragen für bessere Performance</li>
                      <li>Neu: Caching-Mechanismen für häufig abgerufene Daten</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.6.0 (27. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Erweiterte Benutzerrollen und Berechtigungen</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Neu: Differenzierte Benutzerrollen mit angepassten Berechtigungen</li>
                      <li>Neu: Rollenbasierte Ansichten für verschiedene Benutzertypen</li>
                      <li>Verbessert: Optimierte Benutzeroberfläche für Vereinsvertreter</li>
                      <li>Verbessert: Erweiterte Funktionen für Mannschaftsführer</li>
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
