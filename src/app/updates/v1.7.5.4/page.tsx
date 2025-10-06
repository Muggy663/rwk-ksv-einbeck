// src/app/updates/v1.7.5.4/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, TrendingUp, Users, BarChart3, Shield } from 'lucide-react';
import Link from 'next/link';

export default function UpdateV1754Page() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BarChart3 className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold text-primary">Version 1.7.5.4</h1>
            <p className="text-xl text-muted-foreground">Google Analytics Integration</p>
          </div>
        </div>
        <Badge variant="default" className="text-sm px-3 py-1">
          📊 Analytics & Tracking
        </Badge>
      </div>

      <Separator className="my-8" />

      {/* Hauptfeatures */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Neue Features
        </h2>

        <div className="grid gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Google Analytics 4 Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Vollständige Integration von Google Analytics 4 für professionelles Website-Tracking und Besucheranalyse.
              </p>
              
              <div className="bg-green-50 dark:bg-green-950/50 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✨ Neue Analytics-Features:</h4>
                <ul className="list-disc pl-5 space-y-1 text-green-700 dark:text-green-300">
                  <li><strong>Besucherzähler im Footer:</strong> Dezente Anzeige der Besucherzahlen mit Users-Icon</li>
                  <li><strong>Automatisches Page-Tracking:</strong> Jeder Seitenaufruf wird erfasst</li>
                  <li><strong>DSGVO-konform:</strong> Anonymisierte IPs und Cookie-konforme Einstellungen</li>
                  <li><strong>Real-time Daten:</strong> Aktuelle Besucherstatistiken für bessere Insights</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Besucherzähler-Komponente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Neue Besucherzähler-Komponente zeigt die Popularität der RWK App direkt im Footer an.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📊 Besucherzähler-Features:</h4>
                <ul className="list-disc pl-5 space-y-1 text-blue-700 dark:text-blue-300">
                  <li><strong>Formatierte Anzeige:</strong> 12.8K statt 12847 für bessere Lesbarkeit</li>
                  <li><strong>Loading-Animation:</strong> Elegante Pulse-Animation beim Laden</li>
                  <li><strong>Responsive Design:</strong> Optimiert für alle Bildschirmgrößen</li>
                  <li><strong>Dezente Integration:</strong> Passt perfekt ins bestehende Footer-Design</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          <strong>Version 1.7.5.4</strong> - Google Analytics Integration
        </p>
        <p className="mt-2">
          Zurück zu den{' '}
          <Link href="/updates" className="text-primary hover:underline">
            Update-Übersicht
          </Link>
        </p>
      </div>
    </div>
  );
}