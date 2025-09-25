// src/app/updates/v1.7.5.3/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Target, Calendar, Database, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function Update1753Page() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <Link href="/updates">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Updates
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold">Version 1.7.5.3</h1>
          <Badge variant="default" className="bg-green-600">
            Sportleiter Update
          </Badge>
        </div>
        
        <p className="text-muted-foreground text-lg">
          Veröffentlicht am 25. September 2025
        </p>
      </div>

      <div className="space-y-6">
        {/* Hauptfeatures */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Users className="h-5 w-5" />
              Sportleiter Schützen-Vollzugriff
            </CardTitle>
            <CardDescription>
              SPORTLEITER erhalten jetzt vollständige Berechtigung zur Schützenverwaltung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Schützen anlegen und erstellen</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Schützen bearbeiten und aktualisieren</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Schützen löschen (mit Sicherheitsabfrage)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Mannschaftszuordnung beim Anlegen</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Wichtig:</strong> Sportleiter haben jetzt die gleichen Rechte wie Vereinsvertreter 
                bei der Schützenverwaltung. Dies erleichtert die Mannschaftsplanung erheblich.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verbesserungen */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Target className="h-5 w-5" />
              Dialog-Verbesserungen
            </CardTitle>
            <CardDescription>
              Benutzerfreundlichkeit beim Schützen-Anlegen optimiert
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span>Geburtsjahr-Input korrigiert - jetzt händische Eingabe möglich</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span>Altersklassen-Vorschau für Auflage und Freihand</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span>Teams nur aus laufenden Saisons werden angezeigt</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span>Abgeschlossene Kleinkaliber-Saisons ausgeblendet</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stammdaten-Hinweis */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Database className="h-5 w-5" />
              Stammdaten-Hinweis
            </CardTitle>
            <CardDescription>
              Wichtige Information zur Datenverantwortung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-100 p-4 rounded-lg border border-amber-300">
              <p className="text-amber-900 font-medium mb-2">
                📊 Neuer Hinweis im RWK Dashboard
              </p>
              <p className="text-sm text-amber-800">
                Die Stammdaten der Schützen stammen vom <strong>01.08.2025</strong>. 
                Ab diesem Zeitpunkt sind die Vereine für die Pflege und Aktualisierung 
                der Daten selbst verantwortlich.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-amber-600" />
              <span>Prominente Platzierung im RWK Dashboard für alle Vereine sichtbar</span>
            </div>
          </CardContent>
        </Card>

        {/* Technische Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Technische Verbesserungen
            </CardTitle>
            <CardDescription>
              Backend und Sicherheit optimiert
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <span>API-Berechtigung für SPORTLEITER-Rolle erweitert</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <span>Auth-Token korrekt bei DELETE-Requests übertragen</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <span>Firestore-Abfragen für laufende Saisons optimiert</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <span>Multi-Disziplin Support für LGS/LGA Teams</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auswirkungen */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Calendar className="h-5 w-5" />
              Auswirkungen für Vereine
            </CardTitle>
            <CardDescription>
              Was bedeutet dieses Update für Sie?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-green-100 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>✅ Für Sportleiter:</strong> Sie können jetzt eigenständig Schützen verwalten, 
                  ohne auf den Vereinsvertreter angewiesen zu sein.
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>📋 Für Vereinsvertreter:</strong> Entlastung bei der Schützenverwaltung, 
                  da Sportleiter diese Aufgaben übernehmen können.
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>📊 Für alle Vereine:</strong> Beachten Sie den Hinweis zur Datenverantwortung 
                  ab 01.08.2025 im RWK Dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 pt-6 border-t">
        <p className="text-sm text-muted-foreground text-center">
          Bei Fragen zu diesem Update wenden Sie sich an: 
          <a href="mailto:rwk-leiter-ksve@gmx.de" className="text-primary hover:underline ml-1">
            rwk-leiter-ksve@gmx.de
          </a>
        </p>
      </div>
    </div>
  );
}