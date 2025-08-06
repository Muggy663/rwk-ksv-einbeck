"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UpdateV09Page() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button asChild variant="ghost" size="sm" className="mr-4">
          <Link href="/updates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Updates
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">Version 0.9.0 Beta</h1>
          <p className="text-muted-foreground">Statistik-Dashboard mit Trendanalyse</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Neues Statistik-Dashboard
              </CardTitle>
              <Badge variant="default">Neu</Badge>
            </div>
            <CardDescription>
              Umfassendes Dashboard mit 5 verschiedenen Statistik-Ansichten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Leistungsentwicklung:</strong> Entwicklung der Top 6 Schützen über alle Durchgänge</li>
              <li>• <strong>Mannschaftsvergleich:</strong> Durchschnittliche Leistung aller Teams</li>
              <li>• <strong>Geschlechterverteilung:</strong> Verteilung der Schützen nach Geschlecht</li>
              <li>• <strong>Saisonvergleich:</strong> Saisonübergreifende Schützenstatistiken</li>
              <li>• <strong>Trendanalyse:</strong> Leistungstrends aller Schützen</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Trendanalyse-Feature
              </CardTitle>
              <Badge variant="secondary">Highlight</Badge>
            </div>
            <CardDescription>
              Automatische Erkennung von Leistungstrends bei Schützen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• <span className="text-green-600 font-semibold">Steigende Leistung:</span> Schützen mit Verbesserung über die Saison</li>
              <li>• <span className="text-amber-600 font-semibold">Stabile Leistung:</span> Schützen mit konstanter Leistung</li>
              <li>• <span className="text-red-600 font-semibold">Fallende Leistung:</span> Schützen mit nachlassender Leistung</li>
              <li>• Automatische Berechnung basierend auf Durchgangsergebnissen</li>
              <li>• Filterung nach Saison, Liga und Verein</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Terminkalender-Verbesserungen
              </CardTitle>
              <Badge variant="outline">Verbessert</Badge>
            </div>
            <CardDescription>
              Optimierte Anzeige von Terminen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Heutige Termine werden bis 24 Uhr angezeigt</li>
              <li>• Hervorhebung heutiger Termine auf der Startseite</li>
              <li>• Verbesserte "Nächste Termine" Anzeige</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation & Benutzerfreundlichkeit</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Vereinfachte Navigation zwischen Statistikseiten</li>
              <li>• Einheitliche Filter für alle Statistik-Komponenten</li>
              <li>• Export-Funktionen für Diagramme</li>
              <li>• Responsive Design für alle Bildschirmgrößen</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Hinweis für Beta-Tester</h3>
        <p className="text-sm text-muted-foreground">
          Diese Version bringt umfangreiche neue Statistik-Features. Bitte testen Sie alle 
          Tabs im Statistik-Dashboard und geben Sie Feedback zur Trendanalyse-Funktion.
        </p>
      </div>
    </div>
  );
}
