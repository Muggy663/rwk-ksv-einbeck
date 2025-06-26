// src/app/updates/v0.9.6/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Wrench, Sparkles } from 'lucide-react';

export default function UpdateV096Page() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Version 0.9.6</h1>
          <p className="text-muted-foreground">
            Benutzerfreundlichkeits-Update (26. Juni 2025)
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/updates" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Alle Updates
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Übersicht</CardTitle>
          <CardDescription>
            Dieses Update bringt Verbesserungen für die Einzelschützen-Rangliste und Navigation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Die Einzelschützen-Rangliste wird jetzt fair nach Durchschnitt sortiert und die RWK-Ordnung hat ein klickbares Inhaltsverzeichnis.
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
            Neue Features
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Einzelschützen-Rangliste</strong>: Sortierung nach Durchschnitt statt Gesamtpunkten für fairere Bewertung</li>
            <li><strong>RWK-Ordnung Navigation</strong>: Klickbares Inhaltsverzeichnis mit direkten Sprunglinks</li>
            <li><strong>Verbesserte Benutzerführung</strong>: Optimierte Navigation und Benutzerfreundlichkeit</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Wrench className="mr-2 h-5 w-5 text-gray-500" />
            Technische Verbesserungen
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Nodemailer</strong>: E-Mail-Bibliothek hinzugefügt und konfiguriert</li>
            <li><strong>Umgebungsvariablen</strong>: Sichere Konfiguration für E-Mail-Zugangsdaten</li>
            <li><strong>Error-Handling</strong>: Verbesserte Fehlerbehandlung bei E-Mail-Versand</li>
            <li><strong>SMTP-Konfiguration</strong>: Optimierte Einstellungen für GMX-Server</li>
          </ul>

          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">⚖️ Fairere Einzelwertung</h4>
            <p className="text-sm text-green-700">
              Die Einzelschützen-Rangliste wird jetzt nach Durchschnitt sortiert. 
              Schützen mit weniger Durchgängen werden nicht mehr benachteiligt.
            </p>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📖 Verbesserte Navigation</h4>
            <p className="text-sm text-blue-700">
              Das Inhaltsverzeichnis der RWK-Ordnung ist jetzt klickbar und ermöglicht 
              direktes Springen zu den gewünschten Abschnitten.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}