"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, Monitor, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UpdateV091Page() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
          <Link href="/updates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Updates
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Version 0.9.1 Beta</h1>
          <p className="text-muted-foreground">Mobile Optimierungen und Benutzerfreundlichkeit</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Smartphone className="mr-2 h-5 w-5" />
                Mobile Optimierungen
              </CardTitle>
              <Badge variant="default">Neu</Badge>
            </div>
            <CardDescription>
              Verbesserte Darstellung und Bedienung auf mobilen Geräten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• PDF-Buttons in RWK-Tabellen vollständig sichtbar</li>
              <li>• Exportieren-Buttons in Statistiken mobil optimiert</li>
              <li>• Tab-Überschriften verkürzt und responsive</li>
              <li>• Zurück-Buttons vollbreite auf mobilen Geräten</li>
              <li>• Verbesserte Touch-Navigation</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Smartphone className="mr-2 h-5 w-5" />
                Touch-Gesten
              </CardTitle>
              <Badge variant="secondary">Neu</Badge>
            </div>
            <CardDescription>
              Swipe-Navigation für bessere mobile Bedienung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Wischen zwischen Statistik-Tabs möglich</li>
              <li>• Links/Rechts-Swipe für Tab-Navigation</li>
              <li>• Verbesserte Touch-Responsivität</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Monitor className="mr-2 h-5 w-5" />
                Sticky Navigation
              </CardTitle>
              <Badge variant="outline">Verbessert</Badge>
            </div>
            <CardDescription>
              Wichtige Navigation bleibt beim Scrollen sichtbar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Tab-Navigation bleibt beim Scrollen oben</li>
              <li>• Bessere Orientierung in langen Listen</li>
              <li>• Schnellerer Zugriff auf andere Bereiche</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Smartphone className="mr-2 h-5 w-5" />
                Verbesserte Formulare
              </CardTitle>
              <Badge variant="secondary">Optimiert</Badge>
            </div>
            <CardDescription>
              Größere Touch-Targets für bessere Bedienung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Größere Buttons und Eingabefelder</li>
              <li>• Verbesserte Dropdown-Menüs</li>
              <li>• Bessere Lesbarkeit der Labels</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Monitor className="mr-2 h-5 w-5" />
                Datenbereinigung & Logik-Fixes
              </CardTitle>
              <Badge variant="default">Neu</Badge>
            </div>
            <CardDescription>
              Erweiterte Datenbereinigung und korrigierte Schützen-Zuordnung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Erweiterte Datenbereinigung mit Diagnose-Tools</li>
              <li>• Schützen-Zuordnungslogik korrigiert: KK Gewehr ≠ KK Pistole</li>
              <li>• Ein Schütze darf in verschiedenen Disziplin-Kategorien antreten</li>
              <li>• Firestore Security Rules für Admin-Cleanup erweitert</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Monitor className="mr-2 h-5 w-5" />
                Allgemeine Verbesserungen
              </CardTitle>
              <Badge variant="outline">Optimiert</Badge>
            </div>
            <CardDescription>
              Weitere Verbesserungen für alle Gerätetypen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Dokumente: Einheitliche Card-Rahmen für alle Tabs</li>
              <li>• Einstellungen: UI-Komponenten im Dunkelmodus entfernt</li>
              <li>• PWA Manifest: Icon-Pfad korrigiert</li>
              <li>• Server-Side Rendering für /statistiken/erweitert</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Hinweis für Beta-Tester</h3>
        <p className="text-sm text-muted-foreground">
          Diese Version bringt wichtige mobile Optimierungen und behebt einen kritischen 
          Logikfehler bei der Schützen-Zuordnung. Ein Schütze darf jetzt korrekt in 
          verschiedenen Disziplin-Kategorien (z.B. KK Gewehr UND KK Pistole) antreten.
          Die erweiterte Datenbereinigung hilft bei der Lösung von Inkonsistenzen.
        </p>
      </div>
    </div>
  );
}