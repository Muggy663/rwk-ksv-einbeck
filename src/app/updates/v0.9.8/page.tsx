// src/app/updates/v0.9.8/page.tsx
"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Printer, 
  Users, 
  Calendar,
  Sparkles,
  Wrench,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UpdateV098Page() {
  return (
    <div className="space-y-8 container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/updates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Updates
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl text-primary flex items-center">
                <FileText className="mr-3 h-7 w-7" />
                Handzettel & Kommunikation Update (27. Juni 2025)
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Handzettel-System für Mannschaftsführer und erweiterte Kommunikationsfeatures.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Version 0.9.8
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="mb-6 text-muted-foreground">
            Dieses Update bringt das lang gewünschte Handzettel-System und verbessert die Kommunikation zwischen Administratoren und Mannschaftsführern.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
            Neue Handzettel-Features
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Handzettel-Generator</strong>: Automatische Erstellung von Handzetteln für Mannschaftsführer</li>
            <li><strong>Wettkampf-Informationen</strong>: Termine, Orte und wichtige Hinweise auf einen Blick</li>
            <li><strong>Kontaktdaten-Export</strong>: Mannschaftsführer-Kontakte für einfache Kommunikation</li>
            <li><strong>PDF-Export</strong>: Professionelle Handzettel zum Ausdrucken und Verteilen</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Users className="mr-2 h-5 w-5 text-green-500" />
            Kommunikations-Verbesserungen
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Mannschaftsführer-Übersicht</strong>: Erweiterte Kontaktdaten-Verwaltung</li>
            <li><strong>E-Mail-Integration</strong>: Direkte Kommunikation aus der App heraus</li>
            <li><strong>Terminankündigungen</strong>: Automatische Benachrichtigungen für wichtige Termine</li>
            <li><strong>Rundschreiben-System</strong>: Effiziente Verteilung von Informationen</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Wrench className="mr-2 h-5 w-5 text-gray-500" />
            Technische Verbesserungen
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Template-System</strong>: Anpassbare Vorlagen für verschiedene Handzettel-Typen</li>
            <li><strong>Druckoptimierung</strong>: Bessere Layouts für den Ausdruck</li>
            <li><strong>Performance</strong>: Optimierte Ladezeiten für große Mannschaftslisten</li>
          </ul>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📋 Handzettel-System</h4>
            <p className="text-sm text-blue-700">
              Erstellen Sie professionelle Handzettel mit allen wichtigen Informationen für Mannschaftsführer. 
              Termine, Kontakte und spezielle Hinweise werden automatisch eingefügt.
            </p>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">📧 Kommunikations-Hub</h4>
            <p className="text-sm text-green-700">
              Zentrale Verwaltung aller Mannschaftsführer-Kontakte mit direkter E-Mail-Integration. 
              Versenden Sie Rundschreiben und Terminankündigungen mit einem Klick.
            </p>
          </div>

          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">🖨️ Druck-Optimierung</h4>
            <p className="text-sm text-purple-700">
              Alle Handzettel sind für den Ausdruck optimiert. Verschiedene Formate und Layouts 
              stehen zur Verfügung - von kompakten Übersichten bis zu detaillierten Informationsblättern.
            </p>
          </div>

          <Separator className="my-6" />

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Dieses Update fokussiert sich auf die Verbesserung der Kommunikation und Organisation.
            </p>
            <p className="text-xs text-muted-foreground">
              Handzettel-System für effiziente Mannschaftsführer-Kommunikation und bessere Organisation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}