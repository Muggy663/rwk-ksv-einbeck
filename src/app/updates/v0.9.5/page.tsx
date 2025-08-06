// src/app/updates/v0.9.5/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Bug, Wrench, Sparkles, BarChart3, Shield, Users, Zap } from 'lucide-react';

export default function UpdateV095Page() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Version 0.9.5</h1>
          <p className="text-muted-foreground">
            Feature-Update (26. Juni 2025)
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
            Dieses Update bringt neue Komfort-Features, Analytics-Dashboard und verbesserte Benutzerfreundlichkeit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Neben der Behebung eines Firebase-Admin-Fehlers wurden mehrere neue Features für eine bessere Benutzererfahrung und Überwachung hinzugefügt.
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Bug className="mr-2 h-5 w-5 text-amber-500" />
            Behobene Fehler
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Admin</strong>: Korrektur der Firebase-Admin-Importe für Firestore-Statistik</li>
            <li><strong>Vercel</strong>: Behebung des Fehlers "d is not a function" im Vercel-Build</li>
            <li><strong>Ergebniserfassung</strong>: Entfernung des nutzlosen "Weitere 30 Schützen laden" Buttons</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
            Neue Features
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Interaktive Onboarding-Tour</strong>: Vollständig überarbeitete Einführung mit Emojis, Icons und praktischen Beispielen</li>
            <li><strong>Info-Tooltips</strong>: Hilfreiche Erklärungen bei komplexen Funktionen</li>
            <li><strong>Nutzungsbedingungen</strong>: Vollständige AGB für rechtliche Absicherung</li>
            <li><strong>Vereins-Dashboard</strong>: Komplett überarbeitet für blutige Anfänger mit größeren Texten und besserer Visualisierung</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-blue-500" />
            Analytics & Monitoring (NEU)
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Analytics Dashboard</strong>: Neue Admin-Seite für Nutzungsstatistiken und Performance-Überwachung</li>
            <li><strong>Nutzungsstatistiken</strong>: Anonyme Erfassung der Feature-Nutzung und Seitenaufrufe</li>
            <li><strong>Performance-Monitoring</strong>: Überwachung der Ladezeiten mit Farbkodierung (grün/gelb/rot)</li>
            <li><strong>Fehler-Tracking</strong>: Automatische Erfassung und Benachrichtigung bei kritischen Fehlern</li>
            <li><strong>Meistbesuchte Seiten</strong>: Übersicht der am häufigsten genutzten Bereiche</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Users className="mr-2 h-5 w-5 text-green-500" />
            Benutzerfreundlichkeit
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Aufgelockertes Onboarding</strong>: Kürzere Texte, visuelle Icons und praktische Beispiele statt langer Textblöcke</li>
            <li><strong>Vereins-Dashboard</strong>: Farbkodierte Karten mit Bedeutung (grün=wichtig, blau=wichtig, orange=häufig, etc.)</li>
            <li><strong>Größere Texte</strong>: Alle Beschreibungen und Buttons für bessere Lesbarkeit vergrößert</li>
            <li><strong>Handtabellen</strong>: Karte ausgegraut mit "In Entwicklung..." Hinweis</li>
            <li><strong>Passwort ändern</strong>: Direkt im Vereins-Dashboard verfügbar</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-red-500" />
            Rechtliche Verbesserungen
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Copyright-Schutz</strong>: Vollständige Urheberrechts-Kennzeichnung (© 2025 Marcel Bünger für den KSV Einbeck)</li>
            <li><strong>Nutzungsbedingungen</strong>: Umfassende AGB für alle Nutzergruppen</li>
            <li><strong>Eigenständigkeits-Nachweis</strong>: Dokumentation der eigenständigen Entwicklung</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Zap className="mr-2 h-5 w-5 text-orange-500" />
            Admin-Verbesserungen
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Analytics-Integration</strong>: Neue "Analytics & Monitoring" Karte im Admin-Dashboard</li>
            <li><strong>Vereinfachte Navigation</strong>: Redundante /admin/dashboard Seite entfernt</li>
            <li><strong>Zentrale Verwaltung</strong>: Alle Admin-Funktionen auf einer Seite (/admin)</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Wrench className="mr-2 h-5 w-5 text-gray-500" />
            Technische Verbesserungen
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Optimierte Firebase-Admin-Importe für bessere Kompatibilität</li>
            <li>Verbesserte Fehlerbehandlung in der Firestore-Statistik-Funktion</li>
            <li>Neue Analytics-Infrastruktur für bessere Überwachung</li>
            <li>Erweiterte Hook-Bibliothek für Onboarding-Management</li>
            <li>Bereinigung redundanter Admin-Seiten</li>
          </ul>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Analytics & Datenschutz</h4>
            <p className="text-sm text-blue-700">
              Alle Analytics-Daten werden lokal im Browser gespeichert und enthalten keine personenbezogenen Informationen. 
              Die Daten dienen ausschließlich der Verbesserung der Anwendung und werden automatisch nach 100 Einträgen bereinigt.
            </p>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Zugriff auf Analytics</h4>
            <p className="text-sm text-green-700">
              Administratoren finden das neue Analytics-Dashboard unter: <strong>Admin → Analytics & Monitoring</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
