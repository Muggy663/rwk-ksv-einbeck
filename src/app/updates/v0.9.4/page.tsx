'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Bug, Wrench, LineChart as LineChartIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UpdateV094Page() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/updates" className="mr-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Alle Updates
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-primary">Version 0.9.4</h1>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="mr-2 h-5 w-5 text-amber-500" />
            Bugfix-Update (25. Juni 2025)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Dieses Update behebt Fehler in der Datenbank-Recovery-Seite, der Terminverwaltung und den RWK-Tabellen. Außerdem wurden zahlreiche UI-Verbesserungen vorgenommen.
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Bug className="mr-2 h-5 w-5 text-amber-500" />
            Behobene Fehler
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Admin</strong>: Fehler in der Datenbank-Recovery-Seite behoben</li>
            <li><strong>Termine</strong>: Fehler beim Hinzufügen von Terminen behoben</li>
            <li><strong>RWK-Tabellen</strong>: Fehler bei der Sortierung der Teams behoben</li>
            <li><strong>RWK-Tabellen</strong>: NaN-Fehler bei Ligen ohne abgeschlossene Durchgänge behoben</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Wrench className="mr-2 h-5 w-5 text-blue-500" />
            Technische Verbesserungen
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Verbesserte Fehlerbehandlung in UI-Komponenten</li>
            <li>Korrektur von Typ-Validierungen in Formularfeldern</li>
            <li>Verbesserte Sortierlogik für RWK-Tabellen basierend auf vollständig abgeschlossenen Durchgängen</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <LineChartIcon className="mr-2 h-5 w-5 text-green-500" />
            UI-Verbesserungen
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Verbesserte Anzeige der Wertungspunkte in RWK-Tabellen</li>
            <li>Hinzugefügt: Erklärung der Tabellensortierung und Anzeige des aktuellen Durchgangs</li>
            <li>Hinzugefügt: Fortschrittsanzeige für Durchgänge in RWK-Tabellen</li>
            <li>Hinzugefügt: Schnellfilter für Teams in RWK-Tabellen</li>
            <li>Verbesserte mobile Ansicht für RWK-Tabellen</li>
            <li>Entfernung des redundanten "Saisons"-Tabs im Statistik-Dashboard</li>
            <li>Hervorhebung der Saisonübergreifenden Statistiken auf der Übersichtsseite</li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Link href="/updates/v0.9.3">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Version 0.9.3
          </Button>
        </Link>
      </div>
    </div>
  );
}