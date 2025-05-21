// src/app/updates/page.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NewspaperIcon, TagIcon, CalendarDaysIcon, ListChecksIcon } from 'lucide-react';
import type { ChangelogEntry } from '@/types/updates';

// Changelog entries using MAJOR.MINOR.PATCH
const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.2.3a',
    date: '20. Mai 2025', // Assuming today's date for the hotfix
    title: 'Hotfix: Build-Fehler und Favicon-Anpassung',
    descriptionPoints: [
      'Behebung eines Vercel Build-Fehlers ("cn is not defined") in der Admin-Dashboard-Seite durch Hinzufügen des fehlenden Imports.',
      'Favicon-Konfiguration in src/app/layout.tsx präzisiert, um die korrekte Anzeige des Lesezeichensymbols sicherzustellen.',
      'Aktualisierung der Agenda im Admin-Dashboard.',
    ],
  },
  {
    version: '0.2.3',
    date: '20. Mai 2025',
    title: 'Rollenbasierte UI für Vereinsvertreter & Mannschaftsführer',
    descriptionPoints: [
      'Unterscheidung zwischen Vereinsvertreter (VV) und Mannschaftsführer (MF) in der Benutzeroberfläche für Vereinsseiten (/app/verein/mannschaften, /app/verein/schuetzen) implementiert.',
      'Bearbeitungs- und Anlegefunktionen auf diesen Seiten sind nun nur noch für Benutzer mit der Rolle "vereinsvertreter" sichtbar und nutzbar.',
      'Korrektur im Vereins-Layout, sodass Mannschaftsführer korrekt auf das Vereins-Dashboard zugreifen können, ohne eine Fehlermeldung bezüglich fehlender VV-Berechtigungen zu erhalten.',
      'Handbuch und Admin-Dashboard-Agenda aktualisiert, um den Fortschritt und die neue Rollenlogik widerzuspiegeln.',
    ],
  },
  {
    version: '0.2.2',
    date: '20. Mai 2025',
    title: 'Dynamische Jahresauswahl & Impressum implementiert',
    descriptionPoints: [
      'RWK-Tabellen (/rwk-tabellen): Jahresauswahl wird jetzt dynamisch aus den in Firestore vorhandenen Saisons generiert.',
      'RWK-Tabellen: Das aktuelle Kalenderjahr wird als Standard im Jahres-Dropdown vorausgewählt, falls dafür Saisons mit Status "Laufend" existieren; ansonsten das neueste verfügbare Jahr mit laufenden Saisons.',
      'RWK-Tabellen: Es werden nur noch Saisons mit dem Status "Laufend" berücksichtigt und angezeigt.',
      'Impressumsseite (/impressum) mit den bereitgestellten Inhalten erstellt und im Footer verlinkt.',
      'Favicon-Konfiguration in layout.tsx hinzugefügt.',
    ],
  },
  {
    version: '0.2.1',
    date: '20. Mai 2025',
    title: 'Fehlerbehebungen Admin-Teamseite & Vorbereitung VV-Rechtesystem',
    descriptionPoints: [
      'Behebung eines persistenten Fehlers ("SelectItem value cannot be empty") auf der Admin-Teamseite (/admin/teams) durch Entfernen der Liga-Auswahl im Dialog und Absicherung der Filter-Dropdowns.',
      'Struktur für Vereinsvertreter-Seiten (/app/verein/...) angelegt und Basis-Layout für VV-Bereich erstellt.',
      'Logik zur Nutzung der `user_permissions`-Collection (anstelle der `VV_CLUB_ASSIGNMENTS`-Map) für das VV-Dashboard und die VV-Mannschaftsseite implementiert, inklusive Vereinsauswahl bei mehreren zugewiesenen Vereinen.',
    ],
  },
  {
    version: '0.2.0',
    date: '20. Mai 2025', // Updated date
    title: 'Benutzerverwaltung (Basis) & Vorbereitung für Custom Claims',
    descriptionPoints: [
      'Seite /admin/user-management überarbeitet: Super-Admin kann Rolle und bis zu 3 Vereine für Benutzer (identifiziert durch UID) direkt in Firestore (`user_permissions`-Collection) speichern (ohne Cloud Function für diesen Schreibvorgang).',
      'Anleitung für manuelle Benutzeranlage in Firebase Auth und Rechtevergabe in der App auf der Benutzerverwaltungs-Seite hinzugefügt.',
      'Platzhalter für "Statistiken" im Admin-Dashboard hinzugefügt.',
      'Fortschritt bezüglich des Wechsels zum Firebase "Blaze" Plan und der (noch nicht clientseitig genutzten) Cloud Function für Custom Claims in /admin/user-management dokumentiert.',
    ],
  },
  {
    version: '0.1.9',
    date: '20. Mai 2025', // Updated date
    title: 'Verbesserung Ergebniserfassung UX',
    descriptionPoints: [
      'Ergebniserfassungsseiten (Admin & Verein): Vorgemerkte Ergebnisse (`pendingScores`) bleiben nun auch bei einem Wechsel der Mannschaft in der Eingabeliste erhalten.',
    ],
  },
  {
    version: '0.1.8',
    date: '20. Mai 2025',
    title: 'Regeldurchsetzung Schützenzuordnung für VV',
    descriptionPoints: [
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" beim Neuanlegen von Schützen durch Vereinsvertreter (/app/verein/schuetzen) implementiert.',
      'UI-Anpassung: Beim Auswählen einer Mannschaft im Dialog werden andere Teams derselben Kategorie/Jahr für die Auswahl deaktiviert.',
    ],
  },
  {
    version: '0.1.7',
    date: '20. Mai 2025',
    title: 'VV-Funktionen auf Firestore user_permissions umgestellt',
    descriptionPoints: [
      'Vereinsvertreter-Seiten (Dashboard, Mannschaften, Schützen, Ergebnisse) nutzen nun die `user_permissions`-Collection aus Firestore zur Rechteprüfung und Vereinszuweisung (ersetzt die temporäre `VV_CLUB_ASSIGNMENTS`-Map).',
      'Implementierung einer Vereinsauswahl für VVs, wenn ihnen mehrere Vereine zugewiesen sind.',
      'Fehlerbehebungen und Korrekturen in den VV-Seiten zur Datenanzeige und -verwaltung im Kontext des zugewiesenen/ausgewählten Vereins.',
    ],
  },
   {
    version: '0.1.6',
    date: '20. Mai 2025',
    title: '"Letzte Änderungen"-Feed auf Startseite implementiert',
    descriptionPoints: [
      'Neue Firestore-Collection `league_updates` speichert Informationen über neu hinzugefügte Ergebnisse.',
      'Ergebniserfassung (Admin & Verein) erstellt/aktualisiert Einträge in `league_updates`, gruppiert pro Liga und Tag.',
      'Startseite (`/`) zeigt die letzten Einträge aus `league_updates` an, inklusive des Disziplintyps der Liga und des Wettkampfjahres.',
    ],
  },
   {
    version: '0.1.5',
    date: '20. Mai 2025',
    title: 'Ergebnisbearbeitung & Ranglisten-Anzeige verfeinert',
    descriptionPoints: [
      'Admin Edit Results (/admin/edit-results): Vollständige Implementierung der Bearbeitungsfunktion für Ergebnisse (Ringzahl, Ergebnistyp) inklusive Speicherung der Änderungshistorie und Löschfunktion.',
      'RWK Tabellen: Anzeige für "Bester Schütze" (bester männlicher Teilnehmer) und "Beste Dame" (beste weibliche Teilnehmerin) getrennt und korrekt implementiert.',
      'Validierung für Ringzahlen (max. 300 für KK, max. 400 für LG/LP) in Ergebniserfassung und -bearbeitung.',
      'Disziplin "SP" (Sportpistole) aus dem System entfernt.',
    ],
  },
  {
    version: '0.1.4',
    date: '20. Mai 2025',
    title: 'Verbesserungen Ergebniserfassung & Einzelrangliste',
    descriptionPoints: [
      'Ergebniserfassung: Korrekte Speicherung von Schützen-, Team- und Liganamen in der `rwk_scores`-Datenbank sichergestellt.',
      'Ergebniserfassung: Schützen werden nun auch nach dem Neuladen der Seite korrekt aus dem Dropdown entfernt, wenn für den gewählten Durchgang bereits ein Ergebnis in der Datenbank existiert (`existingScoresForTeamAndRound`).',
      'RWK Tabellen: Korrektur der Geschlechter-Aggregierung für die zuverlässige Ermittlung der "Besten Dame".',
    ],
  },
  {
    version: '0.1.3',
    date: '20. Mai 2025',
    title: 'Implementierung Ergebniserfassung (Speichern) & -bearbeitung (Basis)',
    descriptionPoints: [
      'Admin Results (/admin/results): Ergebnisse können erfasst und in Firestore (rwk_scores) gespeichert werden.',
      'Admin Edit Results (/admin/edit-results): Neue Seite zum Suchen und (Basis-)Bearbeiten von erfassten Ergebnissen hinzugefügt.',
      'Logik für "Letzte Änderungen"-Feed vorbereitet (Speichern von league_updates).',
    ],
  },
  {
    version: '0.1.2', // War vorher fälschlicherweise 0.2.2
    date: '20. Mai 2025',
    title: 'Dynamische Jahresauswahl RWK-Tabellen & Impressum',
    descriptionPoints: [
      'RWK-Tabellen (/rwk-tabellen): Jahresauswahl wird jetzt dynamisch aus den in Firestore vorhandenen Saisons generiert (nur Jahre mit angelegten Saisons).',
      'RWK-Tabellen: Das aktuelle Kalenderjahr wird als Standard im Jahres-Dropdown vorausgewählt, falls dafür Saisons mit Status "Laufend" existieren; ansonsten das neueste verfügbare Jahr mit laufenden Saisons.',
      'RWK-Tabellen: Es werden nur noch Saisons mit dem Status "Laufend" berücksichtigt und angezeigt.',
      'Impressumsseite (/impressum) mit den bereitgestellten Inhalten erstellt und im Footer verlinkt.',
    ],
  },
  {
    version: '0.1.1',
    date: '20. Mai 2025',
    title: 'Korrektur Schützenzuordnung Zähler & Datenintegrität',
    descriptionPoints: [
      'Behebung von "No document to update"-Fehlern bei der Mannschaftsbearbeitung durch Prüfung auf Existenz von Schützen.',
      'Korrektur des Zählers für ausgewählte Schützen im Mannschafts-Bearbeiten-Dialog.',
      'Sicherstellung der Datenkonsistenz bei der Zuordnung von Schützen zu Teams (beidseitige Verknüpfung in `shooter.teamIds` und `team.shooterIds`).',
      'Regel "Maximal 3 Schützen pro Team" auf Admin- und VV-Teamseiten und beim Neuanlegen von Schützen implementiert und korrigiert.',
      'Regel "Ein Schütze pro Saison/Disziplinkategorie nur in einem Team" auf Admin-Teamseite implementiert.',
    ],
  },
  {
    version: '0.1.0',
    date: '19. Mai 2025',
    title: 'Umstellung Versionierung & Admin Stammdaten mit DB-Anbindung',
    descriptionPoints: [
      'Versionierung auf MAJOR.MINOR.PATCH umgestellt.',
      'Admin Vereinsverwaltung (/admin/clubs): CRUD-Funktionen mit Firestore-Anbindung, Duplikatsprüfung, Vereinsnummer.',
      'Admin Saisonverwaltung (/admin/seasons): CRUD-Funktionen mit Firestore-Anbindung, Status.',
      'Admin Ligaverwaltung (/admin/leagues): CRUD-Funktionen, Zuordnung zu Saisons, spezifische Disziplintypen.',
      'Admin Mannschaftsverwaltung (/admin/teams): Datenbankanbindung, Zuordnung zu Liga/Saison/Verein, Schützenzuweisung (Basis).',
      'Admin Schützenverwaltung (/admin/shooters): Datenbankanbindung, Zuordnung zu Verein, Regeln für Teamzuordnung (Basis), Layout-Korrekturen.',
      'Basis für Vereinsvertreter-Bereich geschaffen (Layouts, Navigation, erste Seiten).',
      'Diverse UI-Korrekturen und Fehlerbehebungen (SelectItem-Fehler, Endlosschleifen).',
      'Git-Initialisierung und .gitignore-Setup.',
      'Anpassung des Logos und Firebase-Konfiguration auf Umgebungsvariablen umgestellt.',
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
                    <TagIcon className="mr-3 h-7 w-7" />
                    Version {entry.version}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <CalendarDaysIcon className="mr-2 h-5 w-5" />
                    <span>{entry.date}</span>
                  </div>
                </div>
                {entry.title && <CardDescription className="text-lg pt-1">{entry.title}</CardDescription>}
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
