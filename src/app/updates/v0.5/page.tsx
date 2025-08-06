"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function Version05UpdatesPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/updates" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary">Updates & Changelog: Version 0.5.x</h1>
        <p className="text-muted-foreground mt-2">UX-Verbesserungen und Benutzerfreundlichkeit.</p>
      </div>
      
      <div className="space-y-4">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.5.1 (27. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Bugfixes für Passwort-Reset und Mannschaftsführer-Anzeige</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Behoben: Fehler beim Passwort-Reset-Formular durch Auslagerung in separate Komponente</li>
                      <li>Behoben: Mannschaftsführer wurden in der Übersicht nicht angezeigt aufgrund unterschiedlicher Feldnamen in der Datenbank</li>
                      <li>Behoben: Firestore-Sicherheitsregeln für Vereinsvertreter korrigiert (Feldname clubId statt assignedClubId)</li>
                      <li>Verbessert: Saisonauswahl in der Mannschaftsführer-Übersicht mit automatischer Auswahl der neuesten Saison</li>
                      <li>Dokumentation aktualisiert mit Datenbankstruktur-Informationen und Berechtigungsmodell</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.5.0 (26. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">UX-Verbesserungen & Benutzerfreundlichkeit</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Neu: Passwort-Reset-Funktion für Benutzer implementiert</li>
                      <li>Neu: Suchfunktion für Schützen bei größeren Vereinen hinzugefügt</li>
                      <li>Neu: Vereinfachte Mannschaftsanlage mit Dropdown für Mannschaftsstärke</li>
                      <li>Neu: Admin-Panel mit Liste aller Mannschaftsführer einer Saison und Kontaktdaten</li>
                      <li>Verbessert: Deutlichere visuelle Unterscheidung zwischen verfügbaren und zugewiesenen Schützen</li>
                      <li>Verbessert: Automatische Vorauswahl des aktuellen Durchgangs basierend auf Datum</li>
                      <li>Verbessert: Live-Validierung der Ringzahlen während der Eingabe</li>
                      <li>Verbessert: Admin-Benutzerverwaltung mit optimierter Benutzeroberfläche</li>
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
