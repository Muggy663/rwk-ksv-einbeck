"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminAgenda() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Agenda für Version 0.9</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary">Hohe Priorität</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li className="flex items-start">
                <span className="flex-grow">Benutzerverwaltung vereinfachen: Integriertes Formular zum Anlegen neuer Benutzer direkt in der Weboberfläche</span>
                <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Erweiterte Statistikfunktionen: Saisonübergreifende Statistiken für Schützen und Mannschaften</span>
                <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Leistungstrends über mehrere Saisons visualisieren</span>
                <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Änderungsprotokoll verbessern: Automatische Erfassung aller relevanten Änderungen</span>
                <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Filterbare Ansicht nach Benutzer, Datum, Änderungstyp</span>
                <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Automatisierter Saisonwechsel mit Migration der Daten</span>
                <Badge variant="outline" className="ml-2">In Arbeit</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Auf-/Abstiegsregelung implementieren</span>
                <Badge variant="default" className="ml-2 bg-green-500">Erledigt</Badge>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary">Mittlere Priorität</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li className="flex items-start">
                <span className="flex-grow">Liga-Verwaltung intuitiver gestalten: Drag-and-Drop-Interface für die Zuordnung von Vereinen zu Ligen</span>
                <Badge variant="outline" className="ml-2">Geplant</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Vorschau der Liga-Struktur vor dem Speichern</span>
                <Badge variant="outline" className="ml-2">Geplant</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Assistenten für die Erstellung neuer Ligen mit Vorschlägen basierend auf Vorjahren</span>
                <Badge variant="outline" className="ml-2">Geplant</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Terminverwaltung erweitern: Integration mit externen Kalendern (iCal-Export)</span>
                <Badge variant="outline" className="ml-2">Geplant</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Erinnerungsfunktion für wichtige Termine</span>
                <Badge variant="outline" className="ml-2">Geplant</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Mobile Optimierung für Ergebniserfassung</span>
                <Badge variant="outline" className="ml-2">Geplant</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Dokumentenverwaltung erweitern: Kategorisierung und verbesserte Suchfunktion</span>
                <Badge variant="outline" className="ml-2">Geplant</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Zugriffsrechte pro Dokument oder Kategorie</span>
                <Badge variant="outline" className="ml-2">Geplant</Badge>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary">Für Version 0.9.1 geplant</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li className="flex items-start">
                <span className="flex-grow">Optimierung der RWK-Tabellen-Ladezeit durch Pagination</span>
                <Badge variant="outline" className="ml-2">Geplant</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Caching häufig abgefragter Daten</span>
                <Badge variant="outline" className="ml-2">Geplant</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Optimierung der Firestore-Indizes</span>
                <Badge variant="outline" className="ml-2">Geplant</Badge>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary">Zu evaluieren</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li className="flex items-start">
                <span className="flex-grow">Offline-Modus für Ergebniserfassung ohne Internetverbindung</span>
                <Badge variant="outline" className="ml-2">Zu prüfen</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Benachrichtigungssystem für wichtige Ereignisse</span>
                <Badge variant="outline" className="ml-2">Zu prüfen</Badge>
              </li>
              <li className="flex items-start">
                <span className="flex-grow">Integrierter Chat für Mannschaftsführer und Vereinsvertreter</span>
                <Badge variant="outline" className="ml-2">Zu prüfen</Badge>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Agenda für Version 1.0</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Die Agenda für Version 1.0 wird nach Abschluss der Version 0.9 erstellt.</p>
        </CardContent>
      </Card>
    </div>
  );
}