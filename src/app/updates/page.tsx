// src/app/updates/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export default function UpdatesPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Updates & Changelog</h1>
          <p className="text-muted-foreground">
            Übersicht aller Änderungen und Verbesserungen der RWK App Einbeck
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs py-1 px-2 border-green-300 bg-green-50 text-green-700">
              <span>Web-Version: 0.10.1 (09.08.2025)</span>
            </Badge>
            <Badge variant="outline" className="text-xs py-1 px-2 border-blue-300 bg-blue-50 text-blue-700">
              <span>App-Version: 0.9.1.0 (31.07.2025)</span>
            </Badge>
            <Badge variant="default" className="text-xs py-1 px-2 bg-green-600">
              <span>🌐 Live: rwk-einbeck.de</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">Version 0.10.1 - Schützen-Verwaltung für Vereinsvertreter</CardTitle>
              <Badge variant="default" className="bg-green-600">Neu</Badge>
            </div>
            <CardDescription>09.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Vollständige Schützen-Verwaltung für Vereinsvertreter mit Mannschaftszuordnung und km_shooters Synchronisation.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">🎯 Schützen-Verwaltung v0.10.1</h4>
              <div className="text-xs text-blue-700">
                Vereinsvertreter können jetzt vollständig Schützen verwalten
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>🎯 <strong>Schützen anlegen:</strong> Vereinsvertreter können neue Schützen erstellen</li>
              <li>✏️ <strong>Schützen bearbeiten:</strong> Alle Daten (Name, Geschlecht, Geburtsjahr, Mitgliedsnummer) editierbar</li>
              <li>👥 <strong>Mannschaftszuordnung:</strong> Direkte Zuordnung zu Teams beim Anlegen</li>
              <li>🔄 <strong>Duale Synchronisation:</strong> Automatische Speicherung in rwk_shooters + km_shooters</li>
              <li>⚖️ <strong>Regelvalidierung:</strong> Ein Schütze pro Saison/Disziplin nur einem Team</li>
              <li>🔍 <strong>Erweiterte Suche:</strong> Filter nach Mannschaftsmitgliedern</li>
              <li>🎨 <strong>Verbessertes Design:</strong> Emojis, bessere Typografie, peppigere UI</li>
              <li>🛡️ <strong>Berechtigungen:</strong> Nur autorisierte Vereinsvertreter können bearbeiten</li>
            </ul>
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-blue-800">🎯 Schützen-Verwaltung</span>
                  <p className="text-xs text-blue-600 mt-1">Vollständige CRUD-Operationen + Mannschaftszuordnung</p>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                  🚀 v0.10.1
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Version 0.10.0 - Projekt-Aufräumung & Code-Bereinigung</CardTitle>
            <CardDescription>06.08.2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Große Aufräumung des Projekts: Debug-Funktionen entfernt, überflüssige Dateien gelöscht, produktionsreife Version.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>🗑️ Debug-Funktionen entfernt</li>
              <li>📄 40+ MD-Dateien gelöscht</li>
              <li>🔇 Console.log entfernt</li>
              <li>📁 Projektstruktur bereinigt</li>
              <li>🔧 Favicon-Problem behoben</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Ältere Versionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Link href="/updates/v0.10" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.10.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.9" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.9.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.8" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.8.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.7" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.7.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.6" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.6.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.5" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.5.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.4" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.4.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.3" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.3.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0.2" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.2.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link href="/updates/v0" className="text-primary hover:text-primary/80 flex items-center">
                Version 0.1.0 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}