"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function Version2UpdatesPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/updates" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary">Updates & Changelog: Version 2.x</h1>
        <p className="text-muted-foreground mt-2">Erweiterte Version mit zusätzlichen Funktionen und Verbesserungen.</p>
      </div>
      
      <div className="space-y-6">
        <Card className="border-dashed border-muted-foreground/30">
          <CardHeader>
            <CardTitle className="text-xl text-muted-foreground">Version 2.0 (Langfristig geplant)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4 text-muted-foreground">Diese Version ist für die langfristige Entwicklung vorgesehen.</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Konzeptionelle Funktionen</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Erweiterte Datenanalyse und Prognosen</li>
                  <li>Verbesserte Integration mit externen Systemen</li>
                  <li>Erweiterte Benutzeroberfläche mit anpassbaren Dashboards</li>
                  <li>Automatisierte Workflows für wiederkehrende Aufgaben</li>
                  <li>Erweiterte mobile Funktionen</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
