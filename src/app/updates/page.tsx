// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewspaperIcon, TagIcon, CalendarDaysIcon, ListChecksIcon } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.0.0.1',
    date: '31. Juli 2024',
    title: 'Initiales Setup & Kernfunktionen',
    descriptionPoints: [
      'Grundlegende Projektstruktur mit Next.js und TypeScript erstellt.',
      'Firebase Authentifizierung und Konfiguration eingerichtet.',
      'Erste Version der RWK-Tabellen Seite mit Dummy-Daten und Ligastruktur (KOL, KL, 1.KK, 2.KK).',
      'Basis für den Admin-Bereich mit Layout und Navigation implementiert.',
      'Logo des KSV Einbeck in die Startseite und Kopfzeile integriert.',
      'Git-Repository für die Versionskontrolle initialisiert und mit Remote verbunden.',
      'System für Versionsnummerierung und Changelog eingeführt.',
      'Korrektur von Hydration- und Parsing-Fehlern.',
    ],
  },
  // Zukünftige Einträge können hier hinzugefügt werden
  // {
  //   version: '0.0.0.2',
  //   date: 'TT. Monat JJJJ',
  //   title: 'Nächstes großes Update',
  //   descriptionPoints: [
  //     'Punkt 1',
  //     'Punkt 2',
  //   ],
  // }
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
