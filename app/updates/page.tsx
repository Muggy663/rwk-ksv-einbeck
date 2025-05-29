"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Newspaper, Tag, CalendarDays, ListChecks } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.6.2',
    date: '26. Mai 2025',
    title: 'Stabilität & Fehlerbehandlung',
    descriptionPoints: [
      'Verbessert: PDF-Generator mit robusterer Fehlerbehandlung und Null-Checks.',
      'Verbessert: Vorjahresdurchschnitt-Komponente mit besserer Fehlerbehandlung.',
      'Verbessert: Onboarding-Assistent und Passwortänderungsaufforderung mit robusterem localStorage-Zugriff.',
      'Verbessert: Admin-Index mit vollständigen Exporten aller Admin-Komponenten.',
      'Verbessert: Firestore-Sicherheitsregeln für audit_logs und documents.',
      'Behoben: Verschiedene Fehler bei der PDF-Generierung in unterschiedlichen Browsern.',
      'Behoben: Probleme mit der Vorjahresdurchschnitt-Berechnung bei fehlenden Daten.',
      'Behoben: Inkonsistente Verwendung von captainName und managerName in der Mannschaftsführer-Übersicht.',
    ],
  },
  {
    version: '0.6.1',
    date: '26. Mai 2025',
    title: 'PDF-Funktionalität & Vorjahresdurchschnitt',
    descriptionPoints: [
      'Neu: Druckfunktion für Ligaergebnisse implementiert.',
      'Neu: Optimierte PDF-Layouts für bessere Lesbarkeit.',
      'Neu: Integration des Vorjahresdurchschnitts in Team-Dialoge.',
      'Neu: Hilfs-Tooltips für komplexe Funktionen.',
      'Verbessert: Onboarding-Assistent mit zusätzlichen Hinweisen.',
      'Verbessert: PDF-Export-Seite für Ergebnislisten und Urkunden.',
      'Verbessert: Admin-Index für einfacheren Import von Admin-Komponenten.',
      'Behoben: Verschiedene Bugfixes und Performance-Optimierungen.',
    ],
  },
  {
    version: '0.6.0',
    date: '28. Mai 2025',
    title: 'Benutzerführung & Audit-Trail',
    descriptionPoints: [
      'Neu: "Erste Schritte"-Assistent für neue Vereinsvertreter und Mannschaftsführer.',
      'Neu: Aufforderung zur Passwortänderung nach dem ersten Login.',
      'Neu: Übersicht der Mannschaftsführer für Vereinsvertreter.',
      'Neu: Audit-Trail für Ergebniserfassung mit detaillierter Änderungshistorie.',
      'Neu: "Schnitt Vorjahr" Funktionalität in den Team-Dialogen implementiert.',
      'Neu: PDF-Generierung für Ergebnislisten und Urkunden.',
      'Verbessert: Vereins-Layout mit zusätzlichem Menüpunkt für Mannschaftsführer.',
      'Verbessert: Dokumentation und Benutzerhandbuch aktualisiert.',
    ],
  },
  {
    version: '0.5.1',
    date: '27. Mai 2025',
    title: 'Bugfixes für Passwort-Reset und Mannschaftsführer-Anzeige',
    descriptionPoints: [
      'Behoben: Fehler beim Passwort-Reset-Formular durch Auslagerung in separate Komponente.',
      'Behoben: Mannschaftsführer wurden in der Übersicht nicht angezeigt aufgrund unterschiedlicher Feldnamen in der Datenbank.',
      'Behoben: Firestore-Sicherheitsregeln für Vereinsvertreter korrigiert (Feldname clubId statt assignedClubId).',
      'Verbessert: Saisonauswahl in der Mannschaftsführer-Übersicht mit automatischer Auswahl der neuesten Saison.',
      'Dokumentation aktualisiert mit Datenbankstruktur-Informationen und Berechtigungsmodell.',
    ],
  },
  {
    version: '0.5.0',
    date: '26. Mai 2025',
    title: 'UX-Verbesserungen & Benutzerfreundlichkeit',
    descriptionPoints: [
      'Neu: Passwort-Reset-Funktion für Benutzer implementiert.',
      'Neu: Suchfunktion für Schützen bei größeren Vereinen hinzugefügt.',
      'Neu: Vereinfachte Mannschaftsanlage mit Dropdown für Mannschaftsstärke.',
      'Neu: Admin-Panel mit Liste aller Mannschaftsführer einer Saison und Kontaktdaten.',
      'Verbessert: Deutlichere visuelle Unterscheidung zwischen verfügbaren und zugewiesenen Schützen.',
      'Verbessert: Automatische Vorauswahl des aktuellen Durchgangs basierend auf Datum.',
      'Verbessert: Live-Validierung der Ringzahlen während der Eingabe.',
      'Verbessert: Admin-Benutzerverwaltung mit optimierter Benutzeroberfläche.',
    ],
  },
  {
    version: '0.4.0',
    date: '25. Mai 2025',
    title: 'Berechtigungen für Ergebniserfassung & Tooltips',
    descriptionPoints: [
      'Behoben: Vereinsvertreter können jetzt Ergebnisse für alle Mannschaften in einer Liga erfassen, in der ihr Verein teilnimmt.',
      'Verbessert: Tooltips für bessere Benutzerführung in allen Bereichen hinzugefügt.',
      'Optimiert: Ergebniserfassung speichert jetzt jedes Ergebnis einzeln, um Berechtigungsprobleme zu vermeiden.',
      'Aktualisierung der Dokumentation und Handbuch mit den neuesten Funktionen.',
    ],
  },
  {
    version: '0.3.5',
    date: '24. Mai 2025',
    title: 'Verbesserte Ergebniserfassung & Benutzerfreundlichkeit',
    descriptionPoints: [
      'Verbessert: Schützen ohne Ergebnisse werden in der Ergebniserfassung fett und mit Warnzeichen (⚠️) hervorgehoben.',
      'Aktualisierung der Dokumentation und Handbuch mit den neuesten Funktionen.',
    ],
  },
  {
    version: '0.3.4',
    date: '24. Mai 2025',
    title: 'Firestore Sicherheitsregeln & Ergebniserfassung',
    descriptionPoints: [
      'Behoben: Durchgang wird beim Mannschaftswechsel in der Ergebniserfassung nicht mehr zurückgesetzt (Admin und Vereinsvertreter).',
      'Behoben: "seasonId is not defined"-Fehler in der Ergebniserfassung für Admin und Vereinsvertreter.',
      'Verbessert: Mannschaften, deren Schützen bereits alle Ergebnisse für einen Durchgang haben, werden aus dem Dropdown entfernt.',
      'Verbessert: Anzeige "Alle Teams vollständig erfasst" wenn keine Mannschaften mehr für den ausgewählten Durchgang verfügbar sind.',
      'Firestore-Sicherheitsregeln implementiert und getestet.',
    ],
  },
  {
    version: '0.3.3',
    date: '22. Mai 2025',
    title: 'Fehlerbehebung Admin-Schützenverwaltung & Stabilitätsverbesserungen',
    descriptionPoints: [
      'Behoben: Fälschlicherweise angezeigter Fehler-Toast "maximal 3 Mannschaften ausgewählt" beim Öffnen des "Neuen Schützen anlegen"-Dialogs im Admin-Panel.',
      'Diverse Korrekturen an Importen und Code-Struktur zur Verbesserung der Build-Stabilität auf Vercel.',
      'Aktualisierung der Handbuch- und Agenda-Texte.',
    ],
  },
  {
    version: '0.3.1', // Beibehaltung der vorherigen korrekten Versionierung für diese Punkte
    date: '22. Mai 2025',
    title: 'RWK-Ordnung, Handbuch-Fix & Vorbereitung Admin-Agenda',
    descriptionPoints: [
      'Neue Seite "/rwk-ordnung" mit Inhalt erstellt und in die Hauptnavigation aufgenommen.',
      'Syntaxfehler auf der Seite "/handbuch" behoben, der das Rendern verhinderte.',
      'Handbuch und Admin-Agenda mit den neuesten Funktionen und vereinfachten Formulierungen aktualisiert.',
      'Fehlerbehebungen im Zusammenhang mit Icon-Importen auf verschiedenen Seiten.',
    ],
  },
  {
    version: '0.3.0',
    date: '22. Mai 2025',
    title: 'Verbesserte RWK-Tabellen, Doku & Fahrplan',
    descriptionPoints: [
      'RWK-Tabellen (/rwk-tabellen) verarbeiten jetzt URL-Query-Parameter, um direkt spezifische Ligen und Jahre anzuzeigen (Verlinkung von Startseite).',
      'Ligen-Akkordeons in RWK-Tabellen sind jetzt standardmäßig geöffnet.',
      'Einzelschützen in der aufgeklappten Mannschafts-Detailansicht (RWK-Tabellen) sind nun klickbar und öffnen den Statistik-Dialog.',
      'Behebung von Darstellungs- und JavaScript-Fehlern auf der RWK-Tabellenseite (EOF, useSearchParams).',
      'Handbuch und Admin-Dashboard-Agenda an den aktuellen Entwicklungsstand angepasst.',
      'Filterung von "Einzel"-Mannschaften aus der Mannschaftsrangliste.',
      'Korrekte Berechnung von Mannschafts-Rundenergebnissen (nur wenn 3 Schützen Ergebnisse haben).',
      'Anpassung der DG-Spaltenüberschriften in der Mannschaftstabelle für bessere Lesbarkeit.',
      'Behebung einer Dauerschleife auf der RWK-Tabellenseite durch Optimierung der React Hooks.',
    ],
  }
];

export default function UpdatesPage() {
  return (
    <div className="space-y-8 container mx-auto px-4 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <Newspaper className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Updates & Changelog</h1>
          <p className="text-lg text-muted-foreground">
            Alle wichtigen Informationen und Änderungen zur RWK Einbeck App.
          </p>
        </div>
      </div>

      {changelogEntries.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Noch keine Update-Einträge vorhanden.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {changelogEntries.map((entry) => (
            <Card key={entry.version} className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <CardTitle className="text-3xl text-accent flex items-center">
                    <Tag className="mr-3 h-7 w-7" />
                    Version {entry.version}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <CalendarDays className="mr-2 h-5 w-5" />
                    <span>{entry.date}</span>
                  </div>
                </div>
                {entry.title && <CardDescription className="text-lg pt-1">{entry.title}</CardDescription>}
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <ListChecks className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <ul className="space-y-2 list-inside text-foreground/90">
                    {entry.descriptionPoints.map((point, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="font-medium text-primary/80">-</span> {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}