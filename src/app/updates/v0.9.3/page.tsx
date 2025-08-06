"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Bug, Wrench, Shield } from 'lucide-react';

export default function UpdateV093Page() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Version 0.9.3</h1>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/updates" className="flex items-center justify-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>
      
      <Card className="mb-8 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="mr-2 h-5 w-5 text-amber-500" />
            Bugfix-Update (25. Juni 2025)
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            Dieses Update behebt mehrere Fehler, die nach der Veröffentlichung von Version 0.9.2 entdeckt wurden,
            und verbessert die Stabilität und Benutzerfreundlichkeit der Anwendung.
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Bug className="mr-2 h-5 w-5 text-amber-500" />
            Behobene Fehler
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Ergebniserfassung</strong>: Korrektur der Anzeige von Teams mit fehlenden Ergebnissen</li>
            <li><strong>Ergebniserfassung</strong>: Verbesserung der Benutzeroberfläche für vollständig erfasste Teams</li>
            <li><strong>Ergebniserfassung</strong>: Behebung von Berechtigungsproblemen bei Liga-Updates</li>
            <li><strong>Statistiken</strong>: Filterung von Saisons - nur laufende und abgeschlossene Saisons werden angezeigt</li>
            <li><strong>Termine</strong>: Behebung des Fehlers bei der Bearbeitung von Terminen</li>
            <li><strong>Termine</strong>: Verbesserte Anzeige der nächsten Termine unabhängig vom ausgewählten Monat</li>
            <li><strong>Allgemein</strong>: Deaktivierung problematischer Offline-Funktionen zur Verbesserung der Stabilität</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Wrench className="mr-2 h-5 w-5 text-blue-500" />
            Technische Verbesserungen
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Verbesserte Fehlerbehandlung bei Berechtigungsproblemen</li>
            <li>Aktualisierte Firestore-Regeln für Liga-Updates</li>
            <li>Optimierte Ladelogik für Schützen-Daten</li>
            <li>Automatische Bereinigung abgelaufener Termine</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-green-500" />
            Sicherheit und Datenschutz
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Verbesserte Berechtigungsprüfung für Liga-Updates</li>
            <li>Optimierte Fehlerbehandlung bei fehlenden Berechtigungen</li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button asChild variant="outline">
          <Link href="/updates/v0.9.2" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Version 0.9.2
          </Link>
        </Button>
      </div>
    </div>
  );
}
