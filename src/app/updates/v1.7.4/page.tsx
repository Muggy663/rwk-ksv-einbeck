// src/app/updates/v1.7.4/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Users, Shield, Settings, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Update174Page() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link href="/updates">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Updates
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">Version 1.7.4</h1>
          <p className="text-muted-foreground">Mannschaftsführer-Rolle Implementation</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Hauptfeatures */}
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Users className="h-5 w-5" />
              Mannschaftsführer-Rolle vollständig implementiert
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Neu
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-700 dark:text-green-300">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                <span><strong>MANNSCHAFTSFUEHRER-Rolle hinzugefügt:</strong> Vollständige Integration in das 3-Tier-Rollensystem mit granularen Berechtigungen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                <span><strong>Ergebniserfassung-Zugriff:</strong> Mannschaftsführer können Ergebnisse für ihre Mannschaften eintragen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                <span><strong>Mannschaftsführer-Kontakte:</strong> Zugriff auf Kontaktdaten aller Mannschaftsführer in den eigenen Ligen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                <span><strong>Passwort-Ändern-Funktion:</strong> Eigenständige Passwort-Verwaltung für Mannschaftsführer</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* UX Verbesserungen */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Settings className="h-5 w-5" />
              Vereinfachte Dashboard-Auswahl
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Optimiert
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 dark:text-blue-300">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span><strong>Separate Mannschaftsführer-Karte entfernt:</strong> Alle Vereinsrollen nutzen jetzt den einheitlichen Vereinsbereich</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span><strong>Rollenbasierte Karten-Einschränkungen:</strong> Mannschaften/Schützen nur für Sportleiter/Vorstand sichtbar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span><strong>Grid-Layout optimiert:</strong> Dashboard-Auswahl von 4 auf 3 Spalten reduziert für bessere Übersicht</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span><strong>Einheitliche Login-Weiterleitung:</strong> Alle Benutzer werden zur Dashboard-Auswahl geleitet</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Berechtigungen */}
        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <Shield className="h-5 w-5" />
              Erweiterte Firestore-Berechtigungen
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Sicherheit
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-purple-700 dark:text-purple-300">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                <span><strong>Granulare Mannschaftsführer-Berechtigungen:</strong> Präzise Zugriffskontrolle auf Vereinsebene</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                <span><strong>Erweiterte Vereinsbereich-Logik:</strong> MANNSCHAFTSFUEHRER-Rolle in allen relevanten Bereichen integriert</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                <span><strong>Berechtigung-Prüfung in Ergebniserfassung:</strong> Validierung auf Frontend- und Backend-Ebene</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Technische Verbesserungen */}
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <Zap className="h-5 w-5" />
              Code-Optimierungen
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Performance
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700 dark:text-orange-300">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                <span><strong>Vereinfachte Architektur:</strong> Entfernung redundanter Komponenten und Routen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                <span><strong>Conditional Rendering:</strong> Effiziente rollenbasierte UI-Darstellung</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                <span><strong>Navigation bereinigt:</strong> Entfernung verwaister Pfade und Links</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                <span><strong>90% weniger Code:</strong> Durch Vereinfachung der Mannschaftsführer-Implementation</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Separator />

        {/* Technische Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technische Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Neue Komponenten:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• MANNSCHAFTSFUEHRER-Rolle in Club-Rollen</li>
                  <li>• Passwort-Ändern für Mannschaftsführer</li>
                  <li>• Erweiterte Berechtigung-Prüfungen</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Entfernte Komponenten:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Separates Mannschaftsführer-Dashboard</li>
                  <li>• Redundante Dashboard-Karte</li>
                  <li>• Spezielle Weiterleitungslogik</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Migration & Kompatibilität */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Migration & Kompatibilität</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded-md border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ Automatische Migration</h4>
                <p className="text-green-700 dark:text-green-300">
                  Bestehende Legacy-Mannschaftsführer (role: 'mannschaftsfuehrer') behalten vollen Zugriff. 
                  Neue Mannschaftsführer erhalten die moderne MANNSCHAFTSFUEHRER-Rolle.
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🔄 Rückwärtskompatibilität</h4>
                <p className="text-blue-700 dark:text-blue-300">
                  Alle bestehenden Funktionen bleiben erhalten. Die Vereinfachung betrifft nur die interne Architektur, 
                  nicht die Benutzererfahrung.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ausblick */}
        <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/50">
          <CardHeader>
            <CardTitle className="text-indigo-800 dark:text-indigo-200">Ausblick auf Version 1.8.0</CardTitle>
          </CardHeader>
          <CardContent className="text-indigo-700 dark:text-indigo-300">
            <p className="mb-3">Geplante Features für das nächste Update:</p>
            <ul className="space-y-1">
              <li>• Erweiterte Team-Manager-Funktionen</li>
              <li>• Verbesserte Mobile-Navigation</li>
              <li>• Zusätzliche Vereinssoftware-Module</li>
              <li>• Performance-Optimierungen</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}