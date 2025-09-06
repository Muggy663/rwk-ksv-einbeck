"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Navigation, Smartphone, MousePointer, Zap } from 'lucide-react';
import Link from 'next/link';

export default function UpdateV0133Page() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/updates" className="mr-4">
          <ArrowLeft className="h-6 w-6 text-muted-foreground hover:text-primary" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">Version 0.13.3</h1>
          <p className="text-muted-freground">Navigation & Benutzerfreundlichkeit</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Systematische Navigation mit BackButtons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">✨ Neue Features</h3>
              <ul className="space-y-2 text-green-700">
                <li>• <strong>BackButtons auf allen Seiten:</strong> Einheitliche Zurück-Navigation</li>
                <li>• <strong>Intelligente Fallbacks:</strong> Automatische Weiterleitung zur übergeordneten Seite</li>
                <li>• <strong>Mobile Optimierung:</strong> Touch-freundliche Button-Größen</li>
                <li>• <strong>Konsistente Positionierung:</strong> Immer links neben dem Seitentitel</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🎯 Betroffene Bereiche</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-blue-700">
                <div>
                  <strong>Hauptseiten:</strong>
                  <ul className="text-sm mt-1 space-y-1">
                    <li>• RWK Tabellen</li>
                    <li>• Dokumente & Ausschreibungen</li>
                    <li>• Statistik Dashboard</li>
                    <li>• Support & Kontakt</li>
                    <li>• Login</li>
                    <li>• RWK Ordnung</li>
                    <li>• Terminkalender</li>
                  </ul>
                </div>
                <div>
                  <strong>Spezialseiten:</strong>
                  <ul className="text-sm mt-1 space-y-1">
                    <li>• Handzettel Generator</li>
                    <li>• Gesamtergebnisliste Generator</li>
                    <li>• KM Mannschaften</li>
                    <li>• Admin Teams</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">📱 Mobile Experience</h3>
              <ul className="space-y-2 text-purple-700">
                <li>• <strong>Touch-optimiert:</strong> Größere Buttons für bessere Bedienbarkeit</li>
                <li>• <strong>Responsive Design:</strong> Anpassung an verschiedene Bildschirmgrößen</li>
                <li>• <strong>Intuitive Navigation:</strong> Weniger Verwirrung bei der Seitennavigation</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Technische Verbesserungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">🔧 Implementierung</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Einheitliche BackButton Komponente:</strong> Wiederverwendbar und konsistent</li>
                <li>• <strong>Browser History Integration:</strong> Nutzt natürliche Browser-Navigation</li>
                <li>• <strong>Fallback-System:</strong> Sichere Navigation auch bei fehlender History</li>
                <li>• <strong>Performance-optimiert:</strong> Minimaler Code-Overhead</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benutzerfreundlichkeit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MousePointer className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">Verbesserte Navigation</h3>
                  <p className="text-sm text-muted-foreground">
                    Benutzer können jetzt einfach und intuitiv zwischen den Seiten navigieren, 
                    ohne sich in der App zu verlieren.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">Mobile First</h3>
                  <p className="text-sm text-muted-freground">
                    Besonders auf mobilen Geräten ist die Navigation jetzt deutlich 
                    benutzerfreundlicher und entspricht modernen App-Standards.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-6 border-t">
          <Badge variant="outline">Navigation Update</Badge>
          <p className="text-sm text-muted-foreground">
            Veröffentlicht: Januar 2025
          </p>
        </div>
      </div>
    </div>
  );
}