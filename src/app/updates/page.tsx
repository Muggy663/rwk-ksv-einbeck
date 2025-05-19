// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewspaperIcon, TagIcon, CalendarDaysIcon, ListChecksIcon } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

// Changelog entries using MAJOR.MINOR.PATCH
const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.1.2',
    date: '19. Mai 2025',
    title: 'Verfeinerungen Admin-Bereich & RWK-Tabellen Filterung',
    descriptionPoints: [
      'RWK-Tabellen: Anzeige filtert nun korrekt nach Saisons mit Status "Laufend".',
      'Admin-Bereich: Korrektur der Zähler für Schützenzuordnung in Mannschaften.',
      'Admin-Bereich: Regel "Ein Schütze pro Disziplinkategorie/Jahr" in Mannschafts- und Schützenverwaltung implementiert.',
      'Admin-Bereich: Layout-Verbesserungen in Dialogen (Schützenverwaltung).',
      'Admin-Bereich: Ergebniserfassungsseite lädt Stammdaten (Saisons, Ligen, etc.) aus Firestore und speichert Ergebnisse.',
      'Diverse Fehlerbehebungen und Stabilitätsverbesserungen im Admin-Panel.',
    ],
  },
  {
    version: '0.1.1',
    date: '19. Mai 2025',
    title: 'Korrekturen in Admin-Bereich (Mannschaften & Schützen)',
    descriptionPoints: [
      'Admin Teams: Fehler behoben, der "No document to update" verursachte, wenn verwaiste Schützen-IDs im Team-Dokument vorhanden waren.',
      'Admin Teams: Zähler für ausgewählte Schützen im "Mannschaft bearbeiten"-Dialog korrigiert, um nur tatsächlich verfügbare Schützen zu berücksichtigen.',
      'Admin Shooters: UI-Verbesserungen im Dialog und Anzeige der Mannschaftszugehörigkeit.',
      'Allgemeine Stabilitätsverbesserungen in den Admin-Datenverwaltungsseiten.',
    ],
  },
  {
    version: '0.1.0',
    date: '19. Mai 2025',
    title: 'Einführung Admin-Grundfunktionen & Versionierungsschema-Anpassung',
    descriptionPoints: [
      'Admin Clubs: Vollständige Firestore-Anbindung (CRUD), Duplikatsprüfung, Vereinsnummer-Verwaltung und Sortierung implementiert.',
      'Admin Seasons: Vollständige Firestore-Anbindung (CRUD) und Duplikatsprüfung.',
      'Admin Leagues: Vollständige Firestore-Anbindung (CRUD), Saison-Zuordnung und Duplikatsprüfung.',
      'Admin Teams: Firestore-Anbindung für Laden von Saisons, Ligen, Vereinen. Schützenzuordnung zu Teams implementiert (max. 3 Schützen pro Team, Fehlerbehandlung für verwaiste Schützen-IDs). UI-Anpassungen.',
      'Admin Shooters: Firestore-Anbindung für CRUD-Operationen. Verbesserte UI für Dialoge und Kontextanzeige. Direkte Mannschaftszuordnung beim Neuanlegen (max. 3 Schützen pro Team).',
      'Versionierungsschema auf MAJOR.MINOR.PATCH (SemVer) umgestellt.',
      'Diverse UI-Layout-Korrekturen und Verbesserungen der Stabilität im Admin-Bereich.',
    ],
  },
  {
    version: '0.0.0.3',
    date: '19. Mai 2025',
    title: 'Verbesserungen Admin-Bereich & Ergebniserfassung (UI)',
    descriptionPoints: [
      'Admin-Bereich: Intuitivere Navigation und Filteransätze implementiert.',
      'Admin-Bereich: Platzhalter-Buttons für CSV-Import und PDF-Urkundengenerierung im Dashboard ergänzt.',
      'Ergebniserfassung: Formular behält Auswahl bei. Ergebnisse können zwischengespeichert und kontrolliert werden.',
      'Ergebniserfassung: Schützen verschwinden aus Auswahl, wenn Ergebnis für Runde vorgemerkt.',
      'Ergebniserfassung: Ergebnistypen (Vor-, Nach-, Regulärschießen) implementiert.',
    ],
  },
  {
    version: '0.0.0.2',
    date: '19. Mai 2025',
    title: 'Datenbankanbindung RWK-Tabellen & Erweiterungen',
    descriptionPoints: [
      'RWK-Tabellen laden Daten dynamisch aus Firestore.',
      'Auswahl für Wettkampfjahr und Disziplin in RWK-Tabellen.',
      'Separate Tab-Ansichten für Mannschafts- und Einzelschützenranglisten.',
      'Hervorhebung "Bester Schütze" und "Beste Dame".',
    ],
  },
  {
    version: '0.0.0.1',
    date: '19. Mai 2025',
    title: 'Initiales Setup & Kernfunktionen',
    descriptionPoints: [
      'Grundlegende Projektstruktur mit Next.js und TypeScript.',
      'Firebase Authentifizierung und Konfiguration.',
      'Erste Version der RWK-Tabellen Seite mit Dummy-Daten.',
      'Basis für den Admin-Bereich mit Layout und Navigation.',
      'System für Versionsnummerierung und Changelog eingeführt.',
    ],
  },
];

export default function UpdatesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <NewspaperIcon className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-primary">Updates & Changelog</h1>
          <p className="text-lg text-muted-foreground">
            Alle wichtigen Informationen und Änderungen zu den Rundenwettkämpfen und der App.
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
          {changelogEntries.map((entry, index) => (
            <Card key={entry.version} className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <CardTitle className="text-3xl text-accent flex items-center">
                    <TagIcon className="mr-3 h-7 w-7" />
                    Version {entry.version}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <CalendarDaysIcon className="mr-2 h-5 w-5" />
                    <span>{entry.date}</span>
                  </div>
                </div>
                <CardDescription className="text-lg pt-1">{entry.title}</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <ListChecksIcon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <ul className="space-y-2 list-inside text-foreground/90">
                    {entry.descriptionPoints.map((point, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="font-medium text-primary/80">-</span> {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              {index < changelogEntries.length - 1 && <Separator className="my-4"/>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
