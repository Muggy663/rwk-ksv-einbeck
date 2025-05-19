// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewspaperIcon, TagIcon, CalendarDaysIcon, ListChecksIcon } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.0.2.0',
    date: '19. Mai 2025', // Assuming today's date for this update
    title: 'Regel "Maximal 3 Schützen pro Mannschaft" implementiert',
    descriptionPoints: [
      'Admin Teams: Begrenzung auf maximal 3 Schützen pro Mannschaft beim Bearbeiten von Teams implementiert.',
      'Admin Teams: Visuelles Feedback und Deaktivierung von Checkboxen/Speichern-Button bei Erreichen der Maximalzahl.',
      'Admin Schützen: Begrenzung auf maximal 3 Schützen pro Mannschaft beim Neuanlegen von Schützen und direkter Mannschaftszuordnung implementiert.',
      'Admin Schützen: Anzeige der aktuellen Schützenanzahl pro Mannschaft im Dialog zur Schützenerstellung.',
      'Diverse Layout-Verbesserungen und Fehlerbehebungen in den Admin-Dialogen für Schützen und Mannschaften.',
    ],
  },
  {
    version: '0.0.1.9',
    date: '19. Mai 2025',
    title: 'Admin-Bereich: Datenbankanbindung und UI-Verbesserungen',
    descriptionPoints: [
      'Admin Clubs: Vollständige Firestore-Anbindung für Anlegen, Lesen, Bearbeiten, Löschen.',
      'Admin Clubs: Prüfung auf doppelte Vereinsnamen und Hinzufügen der Vereinsnummer implementiert.',
      'Admin Clubs: Sortierung nach Vereinsnummer und UI-Korrekturen für Löschdialog.',
      'Admin Seasons: Vollständige Firestore-Anbindung für Anlegen, Lesen, Bearbeiten, Löschen von Saisons.',
      'Admin Leagues: Vollständige Firestore-Anbindung für Anlegen, Lesen, Bearbeiten, Löschen von Ligen, inklusive Saison-Zuordnung.',
      'Admin Teams: Firestore-Anbindung für Laden von Saisons und Ligen in Auswahl-Dropdowns. UI-Anpassung der Mannschaftstabelle.',
      'Admin Teams: Beginn der Implementierung der Schützenzuordnung zu Mannschaften (Speicherung der shooterIds).',
      'Admin Shooters: UI-Verbesserungen im Dialog und Anzeige der Mannschaftszugehörigkeit (informativ).',
      'Diverse Fehlerbehebungen und Verbesserungen der Stabilität im Admin-Bereich.',
    ],
  },
  {
    version: '0.0.1.0',
    date: '19. Mai 2025',
    title: 'Admin: Vereinsverwaltung mit Datenbankanbindung',
    descriptionPoints: [
      'Admin-Seite für Vereine (/admin/clubs) implementiert.',
      'Anzeigen, Anlegen, Bearbeiten und Löschen von Vereinen mit direkter Firestore-Anbindung.',
      'Bestätigungsdialog (AlertDialog) vor dem Löschen von Vereinen hinzugefügt.',
      'Prüfung auf doppelte Vereinsnamen beim Anlegen und Bearbeiten implementiert.',
      'Feld für Vereinsnummer (Format 08-XXX) zur Vereinsverwaltung hinzugefügt.',
      'Vereinsliste wird nun nach Vereinsnummer (primär) und Name (sekundär) sortiert.',
    ],
  },
  {
    version: '0.0.0.3',
    date: '02. August 2024',
    title: 'Verbesserungen Admin-Bereich & Ergebniserfassung',
    descriptionPoints: [
      'Admin-Bereich: Intuitivere Navigation zwischen Saisons, Ligen, Mannschaften und Schützen implementiert.',
      'Admin-Bereich: Filtermöglichkeiten auf den Verwaltungsseiten für Saisons, Ligen, Teams und Schützen hinzugefügt.',
      'Admin-Bereich: Platzhalter-Buttons für CSV-Import und PDF-Urkundengenerierung im Dashboard ergänzt.',
      'Ergebniserfassung: Formular behält Auswahl für Saison, Liga, Team und Runde bei.',
      'Ergebniserfassung: Ergebnisse können einer Vorschau-Liste hinzugefügt und vor dem Speichern kontrolliert werden.',
      'Ergebniserfassung: Schützen verschwinden aus dem Auswahl-Dropdown, sobald für sie in der aktuellen Runde ein Ergebnis in die Vorschau-Liste aufgenommen wurde.',
      'Ergebniserfassung: Typen für Vor-, Nach- und Regulärschießen sind auswählbar und werden zwischengespeichert.',
      'Korrektur: Button zum Anlegen von Mannschaften im Admin-Bereich wiederhergestellt.',
      'Korrektur: Fehler beim Filtern von Schützen nach "Alle Vereine" behoben.',
    ],
  },
  {
    version: '0.0.0.2',
    date: '01. August 2024',
    title: 'Datenbankanbindung RWK-Tabellen & Erweiterungen',
    descriptionPoints: [
      'RWK-Tabellen laden Daten dynamisch aus Firestore (Ligen, Teams, Schützenergebnisse).',
      'Auswahl für Wettkampfjahr und Disziplin (Kleinkaliber, Luftdruck) in RWK-Tabellen hinzugefügt.',
      'Dynamische Seitenüberschrift für RWK-Tabellen (z.B. "RWK 2025 Kleinkaliber (KK)").',
      'Separate Tab-Ansichten für Mannschafts- und Einzelschützenranglisten implementiert.',
      'Hervorhebung "Bester Schütze" (höchster Gesamtscore) und "Beste Dame" (höchster Gesamtscore weiblich).',
      'Mannschaft "SV Dörrigsen Einzel" wird in Tabellenansicht herausgefiltert.',
      'Mannschaftsergebnis pro Durchgang wird nur bei Ergebnissen von 3 Schützen berechnet.',
      'Durchschnittsberechnung für Mannschaftsergebnisse und Einzelschützen hinzugefügt.',
      'Anzeige der Einzelschützen in der Mannschaftstabelle dezenter gestaltet.',
      'Case-insensitive Überprüfung für `shooterGender` bei Ermittlung "Beste Dame".',
      'Korrektur von Hydration- und Parsing-Fehlern in der Tabellenansicht.',
      'Firebase Sicherheitsregeln angepasst und Hilfestellung bei Index-Erstellung gegeben.',
    ],
  },
  {
    version: '0.0.0.1',
    date: '31. Juli 2024',
    title: 'Initiales Setup & Kernfunktionen',
    descriptionPoints: [
      'Grundlegende Projektstruktur mit Next.js und TypeScript erstellt.',
      'Firebase Authentifizierung und Konfiguration eingerichtet.',
      'Erste Version der RWK-Tabellen Seite mit Dummy-Daten und Ligastruktur.',
      'Basis für den Admin-Bereich mit Layout und Navigation implementiert.',
      'Logo des KSV Einbeck in die Startseite und Kopfzeile integriert.',
      'Git-Repository für die Versionskontrolle initialisiert und mit Remote verbunden.',
      'System für Versionsnummerierung und Changelog eingeführt.',
      'Firebase Sicherheitsregeln angepasst für Datenabruf.',
    ],
  },
  // Zukünftige Einträge können hier hinzugefügt werden
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
