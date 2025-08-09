// src/app/updates/v0.10.1/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Users, Edit, Shield, Sync } from 'lucide-react';

export default function Update0101Page() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/updates">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Updates
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-primary">Version 0.10.1</h1>
          <Badge variant="default" className="bg-green-600">Aktuell</Badge>
        </div>
        <p className="text-muted-foreground">
          Veröffentlicht am 09. August 2025
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Schützen-Verwaltung für Vereinsvertreter
            </CardTitle>
            <CardDescription>
              Vollständige CRUD-Funktionalität für Schützen mit Mannschaftszuordnung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Schützen anlegen</h4>
                    <p className="text-sm text-muted-foreground">
                      Vereinsvertreter können neue Schützen mit allen Daten erstellen
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Edit className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Schützen bearbeiten</h4>
                    <p className="text-sm text-muted-foreground">
                      Alle Felder editierbar: Name, Geschlecht, Geburtsjahr, Mitgliedsnummer
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Mannschaftszuordnung</h4>
                    <p className="text-sm text-muted-foreground">
                      Direkte Zuordnung zu Teams beim Anlegen mit Regelvalidierung
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Sync className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Duale Synchronisation</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatische Speicherung in rwk_shooters + km_shooters
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Berechtigungssystem</h4>
                    <p className="text-sm text-muted-foreground">
                      Nur autorisierte Vereinsvertreter können Schützen verwalten
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Regelvalidierung</h4>
                    <p className="text-sm text-muted-foreground">
                      Ein Schütze darf pro Saison/Disziplin nur einem Team angehören
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Erweiterte Suche</h4>
                    <p className="text-sm text-muted-foreground">
                      Filter nach Mannschaftsmitgliedern und verbesserte Suchfunktion
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Verbessertes Design</h4>
                    <p className="text-sm text-muted-foreground">
                      Emojis, bessere Typografie und peppigere Benutzeroberfläche
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔧 Technische Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">API-Erweiterungen</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• POST /api/shooters - Neue Schützen anlegen</li>
                  <li>• PATCH /api/shooters/[id] - Schützen bearbeiten</li>
                  <li>• Erweiterte GET /api/shooters - Multi-Club-ID Suche</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Datenbank-Synchronisation</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Automatische Speicherung in rwk_shooters Collection</li>
                  <li>• Parallele Speicherung in km_shooters für KM-Meldungen</li>
                  <li>• Konsistente Datenstruktur zwischen beiden Systemen</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">UI/UX Verbesserungen</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Dialog-basierte Formulare für bessere UX</li>
                  <li>• Intelligente Fallback-Logik für Datenextraktion</li>
                  <li>• Toast-Benachrichtigungen für alle Aktionen</li>
                  <li>• Responsive Design für alle Bildschirmgrößen</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📍 Zugriff</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3">Die neue Schützen-Verwaltung ist verfügbar unter:</p>
            <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm">
              <Link href="/verein/schuetzen" className="text-primary hover:underline">
                http://localhost:3000/verein/schuetzen
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Nur für Benutzer mit der Rolle "vereinsvertreter" zugänglich.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}