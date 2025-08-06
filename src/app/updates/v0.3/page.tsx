"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function Version03UpdatesPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/updates" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary">Updates & Changelog: Version 0.3.x</h1>
        <p className="text-muted-foreground mt-2">Verbesserungen der Kernfunktionen und Benutzeroberfläche.</p>
      </div>
      
      <div className="space-y-4">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.3.5 (24. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Verbesserte Ergebniserfassung & Benutzerfreundlichkeit</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Verbessert: Schützen ohne Ergebnisse werden in der Ergebniserfassung fett und mit Warnzeichen (⚠️) hervorgehoben</li>
                      <li>Aktualisierung der Dokumentation und Handbuch mit den neuesten Funktionen</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.3.4 (24. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Firestore Sicherheitsregeln & Ergebniserfassung</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Behoben: Durchgang wird beim Mannschaftswechsel in der Ergebniserfassung nicht mehr zurückgesetzt</li>
                      <li>Behoben: "seasonId is not defined"-Fehler in der Ergebniserfassung für Admin und Vereinsvertreter</li>
                      <li>Verbessert: Mannschaften, deren Schützen bereits alle Ergebnisse für einen Durchgang haben, werden aus dem Dropdown entfernt</li>
                      <li>Verbessert: Anzeige "Alle Teams vollständig erfasst" wenn keine Mannschaften mehr für den ausgewählten Durchgang verfügbar sind</li>
                      <li>Firestore-Sicherheitsregeln implementiert und getestet</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.3.3 (22. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Fehlerbehebung Admin-Schützenverwaltung & Stabilitätsverbesserungen</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Behoben: Fälschlicherweise angezeigter Fehler-Toast "maximal 3 Mannschaften ausgewählt" beim Öffnen des "Neuen Schützen anlegen"-Dialogs</li>
                      <li>Diverse Korrekturen an Importen und Code-Struktur zur Verbesserung der Build-Stabilität auf Vercel</li>
                      <li>Aktualisierung der Handbuch- und Agenda-Texte</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.3.1 (22. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">RWK-Ordnung, Handbuch-Fix & Vorbereitung Admin-Agenda</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Neue Seite "/rwk-ordnung" mit Inhalt erstellt und in die Hauptnavigation aufgenommen</li>
                      <li>Syntaxfehler auf der Seite "/handbuch" behoben, der das Rendern verhinderte</li>
                      <li>Handbuch und Admin-Agenda mit den neuesten Funktionen und vereinfachten Formulierungen aktualisiert</li>
                      <li>Fehlerbehebungen im Zusammenhang mit Icon-Importen auf verschiedenen Seiten</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Version 0.3.0 (22. Mai 2025)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Verbesserte RWK-Tabellen, Doku & Fahrplan</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>RWK-Tabellen verarbeiten jetzt URL-Query-Parameter, um direkt spezifische Ligen und Jahre anzuzeigen</li>
                      <li>Ligen-Akkordeons in RWK-Tabellen sind jetzt standardmäßig geöffnet</li>
                      <li>Einzelschützen in der aufgeklappten Mannschafts-Detailansicht sind nun klickbar und öffnen den Statistik-Dialog</li>
                      <li>Behebung von Darstellungs- und JavaScript-Fehlern auf der RWK-Tabellenseite</li>
                      <li>Handbuch und Admin-Dashboard-Agenda an den aktuellen Entwicklungsstand angepasst</li>
                      <li>Filterung von "Einzel"-Mannschaften aus der Mannschaftsrangliste</li>
                      <li>Korrekte Berechnung von Mannschafts-Rundenergebnissen (nur wenn 3 Schützen Ergebnisse haben)</li>
                      <li>Anpassung der DG-Spaltenüberschriften in der Mannschaftstabelle für bessere Lesbarkeit</li>
                      <li>Behebung einer Dauerschleife auf der RWK-Tabellenseite durch Optimierung der React Hooks</li>
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
