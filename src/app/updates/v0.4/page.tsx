"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function Version04UpdatesPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/updates" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary">Updates & Changelog: Version 0.4.x</h1>
        <p className="text-muted-foreground mt-2">Berechtigungen und Benutzerführung.</p>
      </div>
      
      <div className="space-y-4">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.4.0 (25. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Berechtigungen für Ergebniserfassung & Tooltips</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Behoben: Vereinsvertreter können jetzt Ergebnisse für alle Mannschaften in einer Liga erfassen, in der ihr Verein teilnimmt</li>
                      <li>Verbessert: Tooltips für bessere Benutzerführung in allen Bereichen hinzugefügt</li>
                      <li>Optimiert: Ergebniserfassung speichert jetzt jedes Ergebnis einzeln, um Berechtigungsprobleme zu vermeiden</li>
                      <li>Aktualisierung der Dokumentation und Handbuch mit den neuesten Funktionen</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
