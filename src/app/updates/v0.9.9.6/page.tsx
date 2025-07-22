"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileDown, Eye, Share2 } from 'lucide-react';

export default function WebUpdatePage() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/updates" className="text-primary hover:text-primary/80 flex items-center mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> Zurück zur Übersicht
        </Link>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Version 0.9.9.6</h1>
            <p className="text-muted-foreground">
              Verbesserte PDF-Anzeige in der nativen App
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs py-1 px-2">
              <span>Veröffentlicht: 21.07.2025</span>
            </Badge>
          </div>
        </div>
      </div>

      <Card className="mb-6 shadow-md">
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Neue Features</CardTitle>
            <Badge variant="secondary">v0.9.9.6</Badge>
          </div>
          <CardDescription>Verbesserte PDF-Anzeige und Statusleisten-Fix</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-700">📱 Verbesserte PDF-Anzeige</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>PDF-Öffnen-Funktion</strong> für native Android-App komplett überarbeitet</li>
                <li><strong>Intent-URLs</strong> für direktes Öffnen von PDFs mit nativen PDF-Viewern implementiert</li>
                <li><strong>"Im Browser öffnen"-Button</strong> funktioniert jetzt zuverlässig in der nativen App</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-700">🔧 Technische Verbesserungen</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Statusleisten-Fix</strong>: Die App überlagert nicht mehr die Statusleiste des Smartphones</li>
                <li><strong>Verbesserte URL-Behandlung</strong> für absolute Pfade</li>
                <li><strong>Robustere Fehlerbehandlung</strong> mit Fallbacks</li>
                <li><strong>Plattformspezifische Optimierungen</strong> für Android</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-700">🔄 Versionierungsstrategie</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Hybride Versionierungsstrategie</strong>: Klare Trennung zwischen Web-App und nativer App</li>
                <li><strong>Web-App</strong>: 0.9.9.x - Aktuelle Version: 0.9.9.6</li>
                <li><strong>Native App</strong>: 0.9.x.y - Aktuelle Version: 0.9.1.0</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Funktionsweise der PDF-Anzeige</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <p>
              Die PDF-Anzeige in der nativen App wurde grundlegend überarbeitet, um eine bessere Benutzererfahrung zu bieten:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center mb-2">
                  <Eye className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-medium">Im Browser öffnen</h4>
                </div>
                <p className="text-sm">
                  Öffnet das PDF direkt im Browser des Geräts, ideal für schnelles Anzeigen ohne zusätzliche Apps.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center mb-2">
                  <FileDown className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-medium">Herunterladen</h4>
                </div>
                <p className="text-sm">
                  Speichert das PDF auf dem Gerät für die spätere Offline-Nutzung oder zum Teilen.
                </p>
              </div>
              
              <div className="border rounded-lg p-4 bg-purple-50">
                <div className="flex items-center mb-2">
                  <Share2 className="h-5 w-5 text-purple-600 mr-2" />
                  <h4 className="font-medium">Mit App öffnen</h4>
                </div>
                <p className="text-sm">
                  Nur in der mobilen Web-Version verfügbar. Öffnet das PDF mit einer installierten PDF-Viewer-App.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mt-8">
        <Link href="/updates" className="text-primary hover:text-primary/80 flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> Zurück zur Übersicht
        </Link>
      </div>
    </div>
  );
}