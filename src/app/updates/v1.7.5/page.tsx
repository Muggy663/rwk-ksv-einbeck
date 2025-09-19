// src/app/updates/v1.7.5/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Settings, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Update175Page() {
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
          <h1 className="text-3xl font-bold text-primary">Version 1.7.5</h1>
          <p className="text-muted-foreground">Termine-System Optimierung</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Hauptfeatures */}
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Calendar className="h-5 w-5" />
              Termine-System vollständig überarbeitet
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Vereinfacht
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-700 dark:text-green-300">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                <span><strong>Alle Termine sichtbar:</strong> Keine Liga/Saison-Filter mehr - Terminkalender zeigt alle Termine ohne Einschränkungen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                <span><strong>Vereinfachte Termin-Erstellung:</strong> Saison/Liga-Felder entfernt - alles kann in den Titel geschrieben werden</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                <span><strong>Mannschaftsführer-Zugriff:</strong> Können jetzt problemlos Termine erstellen und bearbeiten</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                <span><strong>Optimierter Titel-Placeholder:</strong> "z.B. 3. Durchgang 1. Kreisklasse KK 2024/25" als Beispiel</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Firestore Rules */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Shield className="h-5 w-5" />
              Firestore-Rules korrigiert
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Behoben
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 dark:text-blue-300">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span><strong>Events-Collection Berechtigung:</strong> Alle angemeldeten Benutzer können Termine erstellen und bearbeiten</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span><strong>Mannschaftsführer-Problem gelöst:</strong> Restriktive Rules verhinderten Termin-Erstellung</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span><strong>Vereinfachte Logik:</strong> Keine clubId-Abhängigkeiten mehr für Termine</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* UI Verbesserungen */}
        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <Settings className="h-5 w-5" />
              Dark Mode Kalender-Fix
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                UX
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-purple-700 dark:text-purple-300">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                <span><strong>Lesbarkeit verbessert:</strong> Termine-Tage im Dark Mode haben dezenten Hintergrund</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                <span><strong>Kontrast optimiert:</strong> Zahlen sind wieder klar lesbar ohne dicke grüne Kästen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                <span><strong>Konsistentes Design:</strong> Termine-Hervorhebung passt zum Dark Mode Theme</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Technische Verbesserungen */}
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <Zap className="h-5 w-5" />
              Code-Vereinfachungen
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Performance
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700 dark:text-orange-300">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                <span><strong>Entfernte Filter-Logik:</strong> Keine Liga/Saison-Dropdowns mehr in Termine-Übersicht</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                <span><strong>Vereinfachte Termin-Erstellung:</strong> Weniger Felder, weniger Komplexität</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                <span><strong>Automatische Vorauswahl entfernt:</strong> Keine Firestore-IDs mehr in Textfeldern</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                <span><strong>Saubere Event-Struktur:</strong> Konsistente Datenstruktur ohne überflüssige Felder</span>
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
                <h4 className="font-semibold mb-2">Geänderte Komponenten:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• /termine/page.tsx - Filter entfernt</li>
                  <li>• /termine/add/page.tsx - Vereinfacht</li>
                  <li>• firestore.rules - Events-Berechtigung</li>
                  <li>• Kalender Dark Mode Styling</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Entfernte Features:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Liga/Saison-Filter in Termine-Übersicht</li>
                  <li>• Saison/Liga-Textfelder in Erstellung</li>
                  <li>• Automatische Firestore-ID Vorauswahl</li>
                  <li>• Komplexe Berechtigung-Logik für Events</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benutzer-Impact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Auswirkungen für Benutzer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded-md border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ Für Mannschaftsführer</h4>
                <p className="text-green-700 dark:text-green-300">
                  Können jetzt problemlos Termine erstellen und alle Termine einsehen. 
                  Keine technischen Hürden mehr durch restriktive Berechtigungen.
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📅 Für alle Benutzer</h4>
                <p className="text-blue-700 dark:text-blue-300">
                  Termine-Erstellung ist jetzt viel einfacher - alles in den Titel schreiben statt 
                  mehrere Felder ausfüllen. Terminkalender zeigt alle Termine ohne Filter.
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
              <li>• Termine-Verwaltung für Ersteller</li>
              <li>• Erweiterte Kalender-Funktionen</li>
              <li>• Push-Benachrichtigungen für Termine</li>
              <li>• Mobile App Termine-Synchronisation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}