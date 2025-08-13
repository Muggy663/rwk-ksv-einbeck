// src/app/updates/v0.11.5/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Users, Target, Settings, Bug } from 'lucide-react';

export default function UpdateV0115() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/updates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Updates
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">🎯 Version 0.11.5</h1>
          <p className="text-muted-foreground">KM-Bereich: Mehrvereine-Support & Mannschafts-Optimierung</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Hauptfeatures */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Users className="h-5 w-5" />
              🏆 Hauptfeatures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-800">Mehrvereine-Support für KM-Bereich</h4>
                  <p className="text-sm text-green-700">
                    Vereinsvertreter können jetzt mehrere Vereine gleichzeitig verwalten. 
                    Unterstützung für <code>representedClubs</code> Array in Benutzerberechtigungen.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-800">Vereinsauswahl in KM-Übersicht</h4>
                  <p className="text-sm text-green-700">
                    Dropdown-Auswahl für Vereine in der KM-Übersicht wenn mehrere Vereine berechtigt sind.
                    Filterung nach ausgewähltem Verein möglich.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-800">Optimierte Mannschafts-Generierung</h4>
                  <p className="text-sm text-green-700">
                    Neue einfache Logik: Schützen werden nach Altersklassen gruppiert, 
                    nach VM-Ergebnis/Name sortiert und in 3er-Teams aufgeteilt.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-800">Auflage-Mannschaftsregeln</h4>
                  <p className="text-sm text-green-700">
                    Korrekte Umsetzung: Auflage-Disziplinen erlauben gemischte Teams (männlich + weiblich),
                    Freihand-Disziplinen sind geschlechtergetrennt.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KM-Bereich Verbesserungen */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Target className="h-5 w-5" />
              🎯 KM-Bereich Verbesserungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Meldungen</h4>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Vereinsfilter-Dropdown vereinfacht (keine doppelten Einträge)</li>
                <li>• Individuelle LM-Teilnahme pro Schütze im "Disziplin → Schützen" Modus</li>
                <li>• VM-Ergebnis Felder in beiden Modi (Schütze→Disziplinen & Disziplin→Schützen)</li>
                <li>• Bearbeitungsmodus bleibt nach Änderungen aktiv</li>
                <li>• Mehrvereine-Unterstützung in Schützen-Filterung</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Mitglieder</h4>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Anzeige aller Schützen aus berechtigten Vereinen</li>
                <li>• Filterung nach <code>clubId</code>, <code>rwkClubId</code> und <code>kmClubId</code></li>
                <li>• Vereinsauswahl-Dropdown für Multi-Verein-Vertreter</li>
                <li>• Vereine-Dropdown im Schützen-Formular</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Mannschaften</h4>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Vereinsgetrennte Mannschafts-Generierung</li>
                <li>• "Fertig" statt "Abbrechen" Button (intuitivere Bedienung)</li>
                <li>• Manuelle Mannschafts-Erstellung möglich</li>
                <li>• Bearbeitungsmodus bleibt aktiv nach Änderungen</li>
                <li>• Vereinsauswahl-Dropdown für Multi-Verein-Vertreter</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Übersicht</h4>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Altersklassen-Spalte in Meldungstabelle</li>
                <li>• Automatische Altersklassen-Berechnung (Auflage/Freihand)</li>
                <li>• Vereinsauswahl-Dropdown bei mehreren Vereinen</li>
                <li>• Client-seitige Filterung nach representedClubs</li>
                <li>• Performance-Optimierung (useKMAuth Hook bereinigt)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Bugfixes */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bug className="h-5 w-5" />
              🐛 Bugfixes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-orange-700 space-y-2">
              <li>• <strong>KM-Meldungen:</strong> Vereinsfilter zeigt jetzt alle berechtigten Vereine</li>
              <li>• <strong>KM-Mitglieder:</strong> Schützen aller zugewiesenen Vereine werden angezeigt</li>
              <li>• <strong>KM-Mannschaften:</strong> Nur eigene Vereins-Mannschaften sichtbar</li>
              <li>• <strong>KM-Übersicht:</strong> Korrekte Filterung nach representedClubs</li>
              <li>• <strong>Mannschafts-Generierung:</strong> Keine vereinsübergreifenden Teams mehr</li>
              <li>• <strong>LM-Teilnahme:</strong> Korrekte Speicherung als true/false statt undefined</li>
              <li>• <strong>Bearbeitungsmodus:</strong> Bleibt nach Änderungen aktiv</li>
              <li>• <strong>Performance:</strong> useKMAuth Hook Debug-Ausgaben entfernt</li>
              <li>• <strong>Dropdown-Menüs:</strong> Keine doppelten Einträge oder Balken</li>
            </ul>
          </CardContent>
        </Card>

        {/* Version Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" className="bg-primary">v0.11.5</Badge>
                  <Badge variant="outline">KM-Optimierung</Badge>
                  <Badge variant="outline">Mehrvereine-Support</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Veröffentlicht: 14. August 2025 • Entwickelt für KSV Einbeck
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Nächste Version</p>
                <p className="text-xs text-muted-foreground">v0.11.6 - TBD</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}